/**
 * Contact CRUD handlers.
 * Handles: getContacts, addContacts, deleteContact, updateContact.
 */

import { Request, Response } from 'express';
import db from '../database.js';
import { normalizePhone } from '../utils/phone.js';
import { resolveContact } from '../services/contactResolver.js';

export async function getContacts(req: Request, res: Response): Promise<void> {
  try {
    const contacts = db.prepare(
      'SELECT id, phone, name, tags, created_at FROM contacts WHERE client_id = ? ORDER BY created_at DESC',
    ).all(req.client!.id);
    res.json({ success: true, data: contacts });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function addContacts(req: Request, res: Response): Promise<void> {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) {
    res.status(400).json({ success: false, error: 'contacts array required' });
    return;
  }
  try {
    let added = 0;
    for (const c of contacts) {
      const normalizedPhone = normalizePhone(c.phone) || c.phone;
      const result = resolveContact({
        clientId: req.client!.id,
        phone: normalizedPhone || undefined,
        displayName: c.name || null,
        source: 'csv',
      });
      if (c.name) {
        db.prepare('UPDATE contacts SET name = COALESCE(NULLIF(name,\'\'), ?) WHERE id = ?')
          .run(c.name, result.contactId);
      }
      if (c.tags) {
        db.prepare('UPDATE contacts SET tags = COALESCE(NULLIF(tags,\'\'), ?) WHERE id = ?')
          .run(c.tags, result.contactId);
      }
      added++;
    }
    res.json({ success: true, count: added });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function deleteContact(req: Request, res: Response): Promise<void> {
  try {
    db.prepare('DELETE FROM contacts WHERE id = ? AND client_id = ?').run(req.params.id, req.client!.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function updateContact(req: Request, res: Response): Promise<void> {
  const { name, phone, tags } = req.body;
  if (!name && !phone && !tags) {
    res.status(400).json({ success: false, error: 'At least one field required' });
    return;
  }
  try {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) {
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
}
