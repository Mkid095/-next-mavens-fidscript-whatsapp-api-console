import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { clientJwtAuth } from '../middleware/auth.js';
import { callEvolutionAPI } from '../utils/evolution.js';

const router = Router();

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
    const { name, instance_name, message_type, content, media_url, caption, scheduled_at, phone_numbers, group_id } = req.body;

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

    // Resolve phone numbers: from group_id or from phone_numbers array
    let resolvedPhones: string[] = [];
    if (group_id) {
      // Verify group belongs to client
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
    } else if (Array.isArray(phone_numbers) && phone_numbers.length > 0) {
      resolvedPhones = phone_numbers;
    } else {
      return res.status(400).json({ success: false, error: 'Provide either group_id or phone_numbers' });
    }

    const campaignId = `camp_${uuidv4().substring(0, 8)}`;
    const status = scheduled_at ? 'scheduled' : 'draft';

    db.prepare(`
      INSERT INTO campaigns (id, client_id, name, instance_name, message_type, content, media_url, caption, status, scheduled_at, total_recipients, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(campaignId, req.client!.id, name, instance_name, message_type || 'text', content || '', media_url || null, caption || '', status, scheduled_at || null, resolvedPhones.length, group_id || null);

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

// POST /api/campaigns/:id/send - Send a campaign's queued messages via Evolution API
router.post('/:id/send', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id) as any;
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Campaign already sent or sending' });
    }

    // Get instance for this campaign
    const instance = db.prepare(
      'SELECT * FROM instances WHERE name = ? AND client_id = ?'
    ).get(campaign.instance_name, req.client!.id) as any;
    if (!instance) {
      return res.status(400).json({ success: false, error: 'Instance not found' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const recipients = db.prepare(
      'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(req.params.id) as any[];

    const tokenCost = campaign.message_type === 'text' || campaign.message_type === 'location'
      ? recipients.length
      : recipients.length * 2;

    const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(req.client!.id) as { token_balance: number };
    if (client.token_balance < tokenCost) {
      return res.status(402).json({ success: false, error: `Insufficient tokens. Need ${tokenCost}, have ${client.token_balance}` });
    }

    db.prepare('UPDATE clients SET token_balance = token_balance - ? WHERE id = ?').run(tokenCost, req.client!.id);
    db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
      .run(`txn_${uuidv4().substring(0, 8)}`, req.client!.id, 'sent', -tokenCost, `campaign_${campaign.id}`);

    db.prepare("UPDATE campaigns SET status = 'sending', started_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE campaign_recipients SET status = 'queued' WHERE campaign_id = ?").run(req.params.id);

    // Resolve evolution instance name
    const evolutionName = instance.evolution_name || `${req.client!.id}_${instance.name}`;

    // Send messages asynchronously (don't wait for all to complete)
    const sendMessages = async () => {
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          if (campaign.message_type === 'text' || !campaign.message_type) {
            const evoRes: any = await callEvolutionAPI('POST', `/messages/sendText/${evolutionName}`, {
              number: recipient.phone,
              text: campaign.content,
            });
            const msgKey = Object.keys(evoRes || {}).find(k => k.includes('message') || k.includes('id'));
            if (evoRes && !evoRes?.erro && !evoRes?.error) {
              db.prepare("UPDATE campaign_recipients SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
              sentCount++;
              deliveredCount++; // Evolution marks delivered when queued
            } else {
              db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
              failedCount++;
            }
          } else if (campaign.message_type === 'media' && campaign.media_url) {
            const evoRes: any = await callEvolutionAPI('POST', `/messages/sendMedia/${evolutionName}`, {
              number: recipient.phone,
              mediatype: 'image',
              media: campaign.media_url,
              caption: campaign.content || campaign.caption || '',
            });
            if (evoRes && !evoRes?.erro && !evoRes?.error) {
              db.prepare("UPDATE campaign_recipients SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
              sentCount++;
              deliveredCount++;
            } else {
              db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
              failedCount++;
            }
          } else {
            db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
            failedCount++;
          }
        } catch (err) {
          db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = CURRENT_TIMESTAMP WHERE id = ?").run(recipient.id);
          failedCount++;
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      // Mark campaign complete
      db.prepare(
        "UPDATE campaigns SET status = 'completed', completed_at = CURRENT_TIMESTAMP, sent_count = ?, delivered_count = ?, failed_count = ? WHERE id = ?"
      ).run(sentCount, deliveredCount, failedCount, req.params.id);
    };

    sendMessages().catch(console.error);

    res.json({ success: true, data: { campaign_id: campaign.id, tokens_deducted: tokenCost } });
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
      INSERT INTO campaigns (id, client_id, name, instance_name, message_type, content, media_url, caption, status, group_id, total_recipients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
    `).run(newId, req.client!.id, `${original.name} (Copy)`, original.instance_name, original.message_type, original.content, original.media_url, original.caption, original.group_id, original.total_recipients);

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
