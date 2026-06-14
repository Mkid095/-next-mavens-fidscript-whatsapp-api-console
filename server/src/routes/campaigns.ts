import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { clientJwtAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/campaigns - List all campaigns for the client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaigns = db.prepare(`
      SELECT * FROM campaigns WHERE client_id = ? ORDER BY created_at DESC
    `).all(req.client!.id);
    res.json({ success: true, data: campaigns });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/campaigns - Create a new campaign
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { name, instance_name, message_type, content, media_url, caption, scheduled_at, phone_numbers } = req.body;

    if (!name || !instance_name || !phone_numbers?.length) {
      return res.status(400).json({ success: false, error: 'name, instance_name, and phone_numbers are required' });
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

    const campaignId = `camp_${uuidv4().substring(0, 8)}`;
    const status = scheduled_at ? 'scheduled' : 'draft';

    db.prepare(`
      INSERT INTO campaigns (id, client_id, name, instance_name, message_type, content, media_url, caption, status, scheduled_at, total_recipients)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(campaignId, req.client!.id, name, instance_name, message_type || 'text', content || '', media_url || null, caption || '', status, scheduled_at || null, phone_numbers.length);

    // Insert recipients
    const insertRecipient = db.prepare(`
      INSERT INTO campaign_recipients (id, campaign_id, phone) VALUES (?, ?, ?)
    `);
    for (const phone of phone_numbers) {
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
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
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

// POST /api/campaigns/:id/send - Start sending a campaign (queues messages with delays)
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

    // Calculate token cost
    const recipientCount = db.prepare(
      'SELECT COUNT(*) as count FROM campaign_recipients WHERE campaign_id = ?'
    ).get(req.params.id) as { count: number };

    const tokenCost = campaign.message_type === 'text' || campaign.message_type === 'location'
      ? recipientCount.count
      : recipientCount.count * 2;

    const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(req.client!.id) as { token_balance: number };
    if (client.token_balance < tokenCost) {
      return res.status(402).json({ success: false, error: `Insufficient tokens. Need ${tokenCost}, have ${client.token_balance}` });
    }

    // Deduct tokens
    db.prepare('UPDATE clients SET token_balance = token_balance - ? WHERE id = ?').run(tokenCost, req.client!.id);
    db.prepare('INSERT INTO token_transactions (id, client_id, type, amount, reference) VALUES (?, ?, ?, ?, ?)')
      .run(`txn_${uuidv4().substring(0, 8)}`, req.client!.id, 'sent', -tokenCost, `campaign_${campaign.id}`);

    // Mark campaign as sending
    db.prepare("UPDATE campaigns SET status = 'sending', started_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);

    // Update all recipients to 'queued'
    db.prepare("UPDATE campaign_recipients SET status = 'queued' WHERE campaign_id = ?").run(req.params.id);

    res.json({ success: true, data: { campaign_id: campaign.id, tokens_deducted: tokenCost } });
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
