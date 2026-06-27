import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../middleware/auth.js';
import db from '../database.js';
import { normalizePhone } from '../utils/phone.js';

const router = Router();

// Get contacts for authenticated client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const contacts = db.prepare(
      'SELECT id, phone, name, tags, created_at FROM contacts WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.client!.id);
    res.json({ success: true, data: contacts });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Add contacts (batch import)
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, error: 'contacts array required' });
  }
  try {
    let added = 0;
    for (const c of contacts) {
      const id = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // Always normalize phone to international format so lookups are consistent
      const normalizedPhone = normalizePhone(c.phone) || c.phone;
      db.prepare(
        'INSERT INTO contacts (id, client_id, phone, name, tags) VALUES (?, ?, ?, ?, ?)'
      ).run(id, req.client!.id, normalizedPhone, c.name || '', c.tags || '');
      added++;
    }
    res.json({ success: true, count: added });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Delete contact
router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ? AND client_id = ?').run(req.params.id, req.client!.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// Update contact (name, phone, or tags)
router.patch('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  const { name, phone, tags } = req.body;
  if (!name && !phone && !tags) {
    return res.status(400).json({ success: false, error: 'At least one field required' });
  }
  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) {
      // Normalize phone to international format for consistency
      const normalizedPhone = normalizePhone(phone) || phone;
      fields.push('phone = ?'); values.push(normalizedPhone);
    }
    if (tags !== undefined) { fields.push('tags = ?'); values.push(tags); }
    values.push(req.params.id, req.client!.id);
    db.prepare(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND client_id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
