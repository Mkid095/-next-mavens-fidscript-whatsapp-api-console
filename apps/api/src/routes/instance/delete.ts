import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// DELETE /api/instance/delete/:name - Delete instance (client own instances)
//
// NOTE: The Evolution API fork running in this deployment only implements
// /instance/create and /instance/connect. The delete/logout/terminate endpoints
// return 404 — there is no API to remove an Evolution instance once created.
// This means Evolution instances persist forever in the Evolution process memory.
//
// Since our DB is the authoritative source for which instances the user sees,
// we delete the local record regardless. The Evolution instance will remain alive
// in Evolution's memory but becomes invisible to this system. If the user later
// tries to create a new instance with the same name, Evolution will reject it
// with 403 (instance already exists) — the only way to recover is to restart
// the Evolution container which clears its in-memory state.
router.delete('/delete/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
  if (!instance) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;

  // Clean up our DB — instance row + all its messages.
  // Foreign key ON DELETE CASCADE handles inbox_messages, but be explicit.
  const deleteMsg = db.prepare('DELETE FROM inbox_messages WHERE instance_id = ?').run(instance.id);
  const deleteInst = db.prepare('DELETE FROM instances WHERE id = ?').run(instance.id);

  logAuditAction(
    req,
    'DELETE',
    'instance',
    instance.id,
    `Deleted instance ${req.params.name} (Evolution instance "${evolutionInstanceName}" remains in Evolution API — no delete endpoint available)`,
  );

  res.json({
    success: true,
    message: 'Instance deleted from database. The WhatsApp session still exists in Evolution API and cannot be removed via API in this deployment.',
    evolutionInstance: evolutionInstanceName,
    deletedMessages: deleteMsg.changes,
  });
});

export default router;
