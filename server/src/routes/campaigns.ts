import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { clientJwtAuth } from '../middleware/auth.js';
import statusRoutes from './statuses.js';
import dripFlowRoutes from './dripFlows.js';
import campaignSendRoutes from './campaignSend.js';

const router = Router();

// Mount status routes under /api/campaigns/statuses/* (Slice E)
router.use('/statuses', statusRoutes);

// Mount drip flow sub-routes (steps / triggers / enroll / enrollments) under
// /:id/* with mergeParams so the public URL shape stays the same
// (POST /:id/steps, POST /:id/enroll, etc.) but the handlers live in their
// own file.
router.use('/:id', dripFlowRoutes);

// Mount the campaign send fan-out at /:id (also uses mergeParams so :id
// is available in the inner handler).
router.use('/:id', campaignSendRoutes);

// GET /api/campaigns - List all campaigns for the client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaigns = db.prepare(`
      SELECT c.*, cg.name as group_name
      FROM campaigns c
      LEFT JOIN contact_groups cg ON c.group_id = cg.id
      WHERE c.client_id = ?
      ORDER BY c.created_at DESC
    `).all(req.client!.id);
    res.json({ success: true, data: campaigns });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/campaigns - Create a new campaign
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { name, instance_name, message_type, content, media_url, caption, scheduled_at, phone_numbers, group_id, segment_id, type, template_vars } = req.body;

    if (!name || !instance_name) {
      return res.status(400).json({ success: false, error: 'name and instance_name are required' });
    }

    // Verify instance belongs to client and is connected
    const instance = db.prepare(
      'SELECT * FROM instances WHERE name = ? AND client_id = ?'
    ).get(instance_name, req.client!.id) as any;
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Instance not found' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    // Resolve phone numbers: from group_id, segment_id, or phone_numbers array
    let resolvedPhones: string[] = [];
    if (group_id) {
      const group = db.prepare(
        'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
      ).get(group_id, req.client!.id);
      if (!group) {
        return res.status(404).json({ success: false, error: 'Contact group not found' });
      }
      const members = db.prepare(
        'SELECT c.phone FROM contact_group_members cgm JOIN contacts c ON cgm.contact_id = c.id WHERE cgm.group_id = ?'
      ).all(group_id) as { phone: string }[];
      resolvedPhones = members.map(m => m.phone);
    } else if (segment_id) {
      // Slice C: resolve the segment to its phone list via the same resolver
      // the segments route uses, so the campaign recipients always match the
      // current segment definition (no drift between segment and campaign).
      const segment = db.prepare(
        'SELECT * FROM campaign_segments WHERE id = ? AND workspace_id = ?'
      ).get(segment_id, req.client!.id) as { filter_json: string } | undefined;
      if (!segment) {
        return res.status(404).json({ success: false, error: 'Segment not found' });
      }
      const { resolveSegment } = await import('../modules/campaigns/segments.js');
      const filter = JSON.parse(segment.filter_json);
      const result = resolveSegment(filter, req.client!.id);
      resolvedPhones = result.phones;
      // Cache the count for the segment row
      db.prepare('UPDATE campaign_segments SET contact_count = ?, last_computed_at = ? WHERE id = ?')
        .run(result.customer_count, result.computed_at, segment_id);
    } else if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      resolvedPhones = phone_numbers;
    } else if (type === 'drip' || type === 'trigger') {
      // Drip + trigger campaigns have a dynamic audience — recipients are added
      // over time as triggers fire or via manual /enroll. No initial list needed.
      resolvedPhones = [];
    } else {
      return res.status(400).json({ success: false, error: 'Provide group_id, segment_id, or phone_numbers' });
    }

    const campaignId = `camp_${uuidv4().substring(0, 8)}`;
    const status = scheduled_at ? 'scheduled' : 'draft';
    const campaignType = type || 'broadcast';

    db.prepare(`
      INSERT INTO campaigns
        (id, client_id, workspace_id, created_by, name, instance_name, message_type, content, media_url, caption, status, scheduled_at, total_recipients, group_id, type, template_vars, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      campaignId,
      req.client!.id,
      req.client!.id, // workspace_id = client_id bridge (P11)
      req.client!.id, // created_by = client (no per-user distinction in slice A)
      name, instance_name, message_type || 'text', content || '', media_url || null, caption || '',
      status, scheduled_at || null, resolvedPhones.length, group_id || null,
      campaignType, template_vars ? JSON.stringify(template_vars) : null
    );

    // Insert recipients
    const insertRecipient = db.prepare(`
      INSERT INTO campaign_recipients (id, campaign_id, phone) VALUES (?, ?, ?)
    `);
    for (const phone of resolvedPhones) {
      insertRecipient.run(`recip_${uuidv4().substring(0, 8)}`, campaignId, phone);
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    res.status(201).json({ success: true, data: campaign });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/campaigns/:id - Get campaign with recipients
router.get('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT c.*, cg.name as group_name FROM campaigns c LEFT JOIN contact_groups cg ON c.group_id = cg.id WHERE c.id = ? AND c.client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    const recipients = db.prepare(
      'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);
    res.json({ success: true, data: { campaign, recipients } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
router.post('/:id/duplicate', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const original = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id) as any;
    if (!original) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const newId = `camp_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO campaigns
        (id, client_id, workspace_id, created_by, name, instance_name, message_type, content, media_url, caption, status, group_id, total_recipients, type, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      newId, req.client!.id, req.client!.id, req.client!.id,
      `${original.name} (Copy)`, original.instance_name, original.message_type,
      original.content, original.media_url, original.caption, original.group_id, original.total_recipients,
      original.type || 'broadcast'
    );

    // Copy all recipients
    const origRecipients = db.prepare('SELECT phone FROM campaign_recipients WHERE campaign_id = ?').all(req.params.id) as { phone: string }[];
    const insertRecipient = db.prepare('INSERT INTO campaign_recipients (id, campaign_id, phone) VALUES (?, ?, ?)');
    for (const r of origRecipients) {
      insertRecipient.run(`recip_${uuidv4().substring(0, 8)}`, newId, r.phone);
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(newId);
    res.status(201).json({ success: true, data: campaign });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    db.prepare('DELETE FROM campaign_recipients WHERE campaign_id = ?').run(req.params.id);
    db.prepare('DELETE FROM campaign_steps WHERE campaign_id = ?').run(req.params.id);
    db.prepare('DELETE FROM campaign_triggers WHERE campaign_id = ?').run(req.params.id);
    db.prepare('DELETE FROM drip_enrollments WHERE campaign_id = ?').run(req.params.id);
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
