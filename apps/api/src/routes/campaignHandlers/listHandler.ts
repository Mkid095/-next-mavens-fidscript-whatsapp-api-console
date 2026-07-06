/**
 * Campaign list + get handlers
 */
import { Request, Response } from 'express';
import db from '../../database.js';

// ─── List all campaigns for the client ───────────────────────────────────────
export function listCampaigns(req: Request, res: Response): void {
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
}

// ─── Get campaign with recipients ─────────────────────────────────────────────
export function getCampaign(req: Request, res: Response): void {
  try {
    const campaign = db.prepare(
      'SELECT c.*, cg.name as group_name FROM campaigns c LEFT JOIN contact_groups cg ON c.group_id = cg.id WHERE c.id = ? AND c.client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' }); return;
    }
    const recipients = db.prepare(
      'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);
    res.json({ success: true, data: { campaign, recipients } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}
