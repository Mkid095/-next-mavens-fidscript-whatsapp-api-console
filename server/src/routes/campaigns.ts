import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { clientJwtAuth } from '../middleware/auth.js';
import { emitDashboardRefresh } from '../utils/dashboardEmitter.js';
import { dispatchCampaignMessage, emitCampaignStarted, emitCampaignCompleted, type CampaignMessageKind } from '../modules/campaigns/index.js';
import { getInstanceForClient } from '../services/whatsapp/shared.js';
import {
  TOKEN_COST_TEXT, TOKEN_COST_MEDIA, TOKEN_COST_LOCATION, TOKEN_COST_CONTACT,
} from '../utils/tokenCosts.js';

const router = Router();

// =============================================================================
// Phase 5 Slice A refactor:
//   - POST /:id/send now routes through modules/campaigns/dispatch.ts which
//     calls the SHARED /api/v1 senders (sendText/sendMedia/sendLocation/sendContact).
//     1:1 chat and campaigns never drift. Per-recipient idempotency. Failed
//     sends refund automatically. message.sent event fires per send.
//   - campaign.started / campaign.completed events on the bus (timeline +
//     analytics subscribers react).
//   - Upfront token deduction replaced with a pre-flight balance check; the
//     shared senders charge per-send so a campaign with 90/100 failures only
//     costs 10 sends' worth of tokens.
// =============================================================================

function tokenCostFor(kind: CampaignMessageKind): number {
  switch (kind) {
    case 'text': return TOKEN_COST_TEXT;
    case 'media': return TOKEN_COST_MEDIA;
    case 'location': return TOKEN_COST_LOCATION;
    case 'contact': return TOKEN_COST_CONTACT;
  }
}

interface CampaignRow {
  id: string;
  client_id: string;
  workspace_id?: string | null;
  name: string;
  instance_name: string;
  message_type: string;
  content: string | null;
  media_url: string | null;
  caption: string | null;
  status: string;
  type?: string | null;
}

interface RecipientRow {
  id: string;
  campaign_id: string;
  phone: string;
  status: string;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
}

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

// POST /api/campaigns/:id/send - Send a campaign's queued messages via the SHARED /api/v1 senders
router.post('/:id/send', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id) as CampaignRow | undefined;
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Campaign already sent or sending' });
    }

    // Resolve instance via the shared loader (used by /api/v1 senders)
    const instance = getInstanceForClient(campaign.instance_name, req.client!.id);
    if (!instance) {
      return res.status(400).json({ success: false, error: 'Instance not found' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const recipients = (db.prepare(
      'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(req.params.id) as unknown as RecipientRow[]);

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients' });
    }

    // Pre-flight balance check (fast-fail if zero balance). Per-send charge
    // happens inside dispatchCampaignMessage via chargeAndEmit, so partial
    // success only costs the successful sends.
    const kind = (campaign.message_type as CampaignMessageKind) || 'text';
    const perSendCost = tokenCostFor(kind);
    const totalCost = perSendCost * recipients.length;
    const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(req.client!.id) as { token_balance: number };
    if (!client || client.token_balance < perSendCost) {
      return res.status(402).json({ success: false, error: `Insufficient tokens. Need at least ${perSendCost}, have ${client?.token_balance ?? 0}` });
    }

    db.prepare("UPDATE campaigns SET status = 'sending', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE campaign_recipients SET status = 'queued' WHERE campaign_id = ?").run(req.params.id);

    // Build SendContext ONCE (used by every per-recipient send).
    // req.client!.id is the workspace_id bridge (P11).
    const ctx = { instance: { ...instance, client_id: req.client!.id }, client: req.client!, req };

    // Fire campaign.started on the bus. Wrapped in try/catch so a subscriber
    // failure never breaks the send loop.
    emitCampaignStarted(
      { workspaceId: req.client!.id, actorUserId: req.client!.id, roleId: 'role_0', perms: ['*'] },
      { campaignId: campaign.id, stats: { totalRecipients: recipients.length } }
    ).catch(err => console.error('[campaigns] emit started failed:', err));

    // Async fan-out — fire and forget. Each send is per-recipient idempotent.
    const sendAll = async () => {
      let sentCount = 0;
      let failedCount = 0;
      const now = new Date().toISOString();

      for (const recipient of recipients) {
        const result = await dispatchCampaignMessage(ctx, {
          recipientId: recipient.id,
          to: recipient.phone,
          kind,
          text: campaign.content || undefined,
          mediaUrl: campaign.media_url || undefined,
          caption: campaign.caption || undefined,
        });
        if (result.ok) {
          db.prepare("UPDATE campaign_recipients SET status = 'sent', sent_at = ?, error_message = NULL WHERE id = ?")
            .run(now, recipient.id);
          sentCount++;
        } else {
          db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = ?, error_message = ? WHERE id = ?")
            .run(now, result.error || 'unknown', recipient.id);
          failedCount++;
        }
        // Pace sends to respect the per-client msg/min rate limit.
        await new Promise(r => setTimeout(r, 500));
      }

      db.prepare(`
        UPDATE campaigns
        SET status = 'completed', completed_at = ?, sent_count = ?, delivered_count = ?, failed_count = ?, updated_at = ?
        WHERE id = ?
      `).run(now, sentCount, sentCount, failedCount, now, campaign.id);

      emitCampaignCompleted(
        { workspaceId: req.client!.id, actorUserId: req.client!.id, roleId: 'role_0', perms: ['*'] },
        { campaignId: campaign.id, stats: { sent: sentCount, delivered: sentCount, failed: failedCount } }
      ).catch(err => console.error('[campaigns] emit completed failed:', err));

      emitDashboardRefresh(req.client!.id);
    };

    sendAll().catch(err => console.error('[campaigns] sendAll failed:', err));

    res.json({
      success: true,
      data: {
        campaign_id: campaign.id,
        recipients: recipients.length,
        estimated_tokens: totalCost,
        mode: 'per_send_charged',
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/campaigns/:id/duplicate - Resend a past campaign (copies it as draft with same content)
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
    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
