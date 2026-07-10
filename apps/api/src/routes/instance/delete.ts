import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import type { Instance } from '../../types.js';
import { callGateway, callGatewayChecked } from '../../utils/gateway.js';
import { logAuditAction } from '../../utils/audit.js';

const router = Router();

// DELETE /api/instance/delete/:name - Delete instance (client own instances)
//
// Flow:
// 1. Attempt to delete from Evolution API first
// 2. If Evolution API succeeds (200) → delete from our DB
// 3. If Evolution API returns 404 (not found) → instance already gone, still clean up our DB
// 4. If Evolution API returns other error → return error, don't touch our DB
router.delete('/delete/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const instance = db.prepare('SELECT * FROM instances WHERE name = ? AND client_id = ?').get(req.params.name, req.client?.id) as Instance | undefined;
  if (!instance) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  const evolutionInstanceName = instance.evolution_name || `${req.client?.id}_${req.params.name}`;

  // Step 1: Try to delete from Evolution API first
  let evolutionDeleted = false;
  let evolutionError: string | null = null;

  try {
    const evoResult = await callGatewayChecked('DELETE', `/instance/delete/${evolutionInstanceName}`);

    if (evoResult.ok) {
      // Evolution API successfully deleted the instance
      evolutionDeleted = true;
      console.log(`[instance/delete] Evolution API deleted: ${evolutionInstanceName}`);
    } else if (evoResult.status === 404) {
      // Instance doesn't exist in Evolution API — already deleted or never existed
      // This is fine, we'll clean up our DB record
      evolutionDeleted = false;
      console.log(`[instance/delete] Evolution API instance not found (already deleted?): ${evolutionInstanceName}`);
    } else {
      // Other error from Evolution API — don't touch our DB
      evolutionError = evoResult.data?.error || `Evolution API returned ${evoResult.status}`;
      console.error(`[instance/delete] Evolution API error: ${evolutionError}`);
      return res.status(400).json({
        success: false,
        error: `Failed to delete instance from WhatsApp service: ${evolutionError}`,
        evolutionInstance: evolutionInstanceName,
      });
    }
  } catch (err) {
    // Network error calling Evolution API
    evolutionError = err instanceof Error ? err.message : String(err);
    console.error(`[instance/delete] Failed to call Evolution API: ${evolutionError}`);
    return res.status(503).json({
      success: false,
      error: `Cannot reach WhatsApp service: ${evolutionError}`,
      evolutionInstance: evolutionInstanceName,
    });
  }

  // Step 2: Clean up our DB — instance row + all its messages
  const deleteMsg = db.prepare('DELETE FROM inbox_messages WHERE instance_id = ?').run(instance.id);
  const deleteInst = db.prepare('DELETE FROM instances WHERE id = ?').run(instance.id);

  logAuditAction(
    req,
    'DELETE',
    'instance',
    instance.id,
    `Deleted instance ${req.params.name}. Evolution API delete: ${evolutionDeleted ? 'success' : 'not found (skipped)'}`,
  );

  res.json({
    success: true,
    message: evolutionDeleted
      ? 'Instance deleted from both WhatsApp service and database.'
      : 'Instance removed from database (WhatsApp service instance was already deleted or not found).',
    evolutionInstance: evolutionInstanceName,
    evolutionDeleted,
    deletedMessages: deleteMsg.changes,
  });
});

export default router;
