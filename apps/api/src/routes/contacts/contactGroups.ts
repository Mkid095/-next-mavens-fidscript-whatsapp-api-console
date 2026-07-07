import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/groups - List all groups for the client
router.get('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const groups = db.prepare(
      'SELECT * FROM contact_groups WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.client!.id) as any[];

    // Attach member count to each group
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM contact_group_members WHERE group_id = ?');
    const result = groups.map(g => ({
      ...g,
      member_count: (countStmt.get(g.id) as { count: number }).count,
    }));

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/groups - Create a group
router.post('/', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }
    const id = `grp_${uuidv4().substring(0, 8)}`;
    db.prepare(
      'INSERT INTO contact_groups (id, client_id, name, description) VALUES (?, ?, ?, ?)'
    ).run(id, req.client!.id, name.trim(), description || '');
    const group = db.prepare('SELECT * FROM contact_groups WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: { ...group, member_count: 0 } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/groups/:id - Get group with all contacts
router.get('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const group = db.prepare(
      'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    const members = db.prepare(`
      SELECT c.id, c.phone, c.name, c.tags, cgm.added_at
      FROM contact_group_members cgm
      JOIN contacts c ON cgm.contact_id = c.id
      WHERE cgm.group_id = ?
      ORDER BY cgm.added_at DESC
    `).all(req.params.id);
    res.json({ success: true, data: { group, members } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// PUT /api/groups/:id - Update group name/description
router.put('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const group = db.prepare(
      'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    db.prepare(
      'UPDATE contact_groups SET name = ?, description = ? WHERE id = ?'
    ).run(name?.trim() || (group as any).name, description ?? (group as any).description, req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const group = db.prepare(
      'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    db.prepare('DELETE FROM contact_group_members WHERE group_id = ?').run(req.params.id);
    db.prepare('DELETE FROM contact_groups WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/groups/:id/contacts - Add contacts to a group
router.post('/:id/contacts', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { contact_ids } = req.body;
    if (!Array.isArray(contact_ids)) {
      return res.status(400).json({ success: false, error: 'contact_ids array required' });
    }
    const group = db.prepare(
      'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    let added = 0;
    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO contact_group_members (id, group_id, contact_id) VALUES (?, ?, ?)'
    );
    for (const contact_id of contact_ids) {
      insertStmt.run(`cgm_${uuidv4().substring(0, 8)}`, req.params.id, contact_id);
      added++;
    }
    res.json({ success: true, count: added });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// DELETE /api/groups/:id/contacts/:contactId - Remove a contact from a group
router.delete('/:id/contacts/:contactId', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const group = db.prepare(
      'SELECT * FROM contact_groups WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    db.prepare(
      'DELETE FROM contact_group_members WHERE group_id = ? AND contact_id = ?'
    ).run(req.params.id, req.params.contactId);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
