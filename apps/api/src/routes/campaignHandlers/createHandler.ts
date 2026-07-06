/**
 * Campaign create / duplicate / delete handlers
 */
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';

// ─── Create a new campaign ─────────────────────────────────────────────────────
export async function createCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { name, instance_name, message_type, content, media_url, caption, scheduled_at, phone_numbers, group_id, segment_id, type, template_vars } = req.body;

    if (!name || !instance_name) {
      res.status(400).json({ success: false, error: 'name and instance_name are required' }); return;
    }

    // Verify instance belongs to client and is connected
    const instance = db.prepare(
      'SELECT * FROM instances WHERE name = ? AND client_id = ?'
    ).get(instance_name, req.client!.id) as { status: string } | undefined;
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' }); return;
    }
    if (instance.status !== 'connected') {
      res.status(400).json({ success: false, error: 'Instance is not connected' }); return;
    }

    // Resolve phone numbers: from group_id, segment_id, or phone_numbers array
    let resolvedPhones: string[] = [];
    if (group_id) {
      const group = db.prepare(
        'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
      ).get(group_id, req.client!.id);
      if (!group) {
        res.status(404).json({ success: false, error: 'Contact group not found' }); return;
      }
      const members = db.prepare(
        'SELECT c.phone FROM contact_group_members cgm JOIN contacts c ON cgm.contact_id = c.id WHERE cgm.group_id = ?'
      ).all(group_id) as { phone: string }[];
      resolvedPhones = members.map(m => m.phone);
    } else if (segment_id) {
      const segment = db.prepare(
        'SELECT * FROM campaign_segments WHERE id = ? AND workspace_id = ?'
      ).get(segment_id, req.client!.id) as { filter_json: string } | undefined;
      if (!segment) {
        res.status(404).json({ success: false, error: 'Segment not found' }); return;
      }
      const { resolveSegment } = await import('../../modules/campaigns/segments.js');
      const filter = JSON.parse(segment.filter_json);
      const result = resolveSegment(filter, req.client!.id);
      resolvedPhones = result.phones;
      db.prepare('UPDATE campaign_segments SET contact_count = ?, last_computed_at = ? WHERE id = ?')
        .run(result.customer_count, result.computed_at, segment_id);
    } else if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      resolvedPhones = phone_numbers;
    } else if (type === 'drip' || type === 'trigger') {
      resolvedPhones = [];
    } else {
      res.status(400).json({ success: false, error: 'Provide group_id, segment_id, or phone_numbers' }); return;
    }

    const campaignId = `camp_${uuidv4().substring(0, 8)}`;
    const status = scheduled_at ? 'scheduled' : 'draft';
    const campaignType = type || 'broadcast';

    db.prepare(`
      INSERT INTO campaigns
        (id, client_id, workspace_id, created_by, name, instance_name, message_type, content, media_url, caption, status, scheduled_at, total_recipients, group_id, type, template_vars, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      campaignId, req.client!.id, req.client!.id, req.client!.id,
      name, instance_name, message_type || 'text', content || '', media_url || null, caption || '',
      status, scheduled_at || null, resolvedPhones.length, group_id || null,
      campaignType, template_vars ? JSON.stringify(template_vars) : null
    );

    const insertRecipient = db.prepare(`INSERT INTO campaign_recipients (id, campaign_id, phone) VALUES (?, ?, ?)`);
    for (const phone of resolvedPhones) {
      insertRecipient.run(`recip_${uuidv4().substring(0, 8)}`, campaignId, phone);
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    res.status(201).json({ success: true, data: campaign });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Duplicate a campaign ──────────────────────────────────────────────────────
export function duplicateCampaign(req: Request, res: Response): void {
  try {
    const original = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id) as Record<string, unknown> | undefined;
    if (!original) {
      res.status(404).json({ success: false, error: 'Campaign not found' }); return;
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
}

// ─── Delete a campaign ─────────────────────────────────────────────────────────
export function deleteCampaign(req: Request, res: Response): void {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' }); return;
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
}
