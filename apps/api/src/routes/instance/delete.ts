import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway } from '../../utils/gateway.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// DELETE /api/instance/delete/:name - Delete instance (client own instances)
// Must delete from Evolution API FIRST, then from our DB. Do NOT delete from
// our DB if Evolution fails — the instance would survive in Evolution and
// reappear. The Evolution "delete" endpoint is a POST with instanceName in body.
router.delete('/delete/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
  if (!instance) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;

  // Step 1: Delete from Evolution API first. This is the authoritative WhatsApp session delete.
  // The Evolution "DELETE /instance/delete" endpoint is actually a POST with instanceName in body.
  let evoSuccess = false;
  try {
    const evoRes = await callGateway('POST', '/instance/delete', { instanceName: evolutionInstanceName });
    // Treat both "success" field and HTTP 200 as success; Evolution sometimes returns { success: true }
    // or { response: "Instance deleted" } on success.
    evoSuccess = evoRes?.success === true || evoRes?.response === 'Instance deleted';
    if (!evoSuccess) {
      console.error('[instance/delete] Evolution API delete failed:', evoRes);
    }
  } catch (evoErr) {
    console.error('[instance/delete] Failed to reach Evolution API:', evoErr);
  }

  // Step 2: Only delete from our DB if Evolution succeeded.
  // If Evolution failed, return an error so the client knows the instance still exists
  // in Evolution and will reappear if they create a new local instance with the same name.
  if (!evoSuccess) {
    return res.status(502).json({
      success: false,
      error: 'Failed to delete instance from WhatsApp gateway. The instance still exists there and will reappear. Please try again.',
      code: 'EVOLUTION_DELETE_FAILED',
    });
  }

  // Step 3: Clean up our DB — instance row + all its messages.
  // Foreign key ON DELETE CASCADE should handle inbox_messages, but be explicit.
  const deleteMsg = db.prepare('DELETE FROM inbox_messages WHERE instance_id = ?').run(instance.id);
  const deleteInst = db.prepare('DELETE FROM instances WHERE id = ?').run(instance.id);
  logAuditAction(req, 'DELETE', 'instance', instance.id, `Deleted instance ${req.params.name} (removed ${deleteMsg.changes} messages)`);

  res.json({ success: true, message: 'Instance deleted from WhatsApp gateway and database', deletedMessages: deleteMsg.changes });
});

export default router;
