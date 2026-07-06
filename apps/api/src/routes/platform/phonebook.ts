/**
 * /api/platform/phonebook/sync/:name — manually triggers a WhatsApp phonebook
 * sync for a connected instance. The synced contacts land in the main
 * `contacts` table (flagged with instance_id) so bulk messaging can use
 * them. Manual contacts (instance_id NULL) are preserved untouched.
 */
import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import { requireConnected } from '../../services/whatsapp/shared.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import { syncPhonebookForInstance } from '../../services/whatsapp/phonebook.js';

// Manual sync is rare but heavy (the gateway find-contacts can be large).
// 5/min is a safe per-client cap.
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => `cli_${req.client?.id ?? req.ip ?? 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many phonebook syncs. Slow down.' },
});

const router = Router();

router.post('/sync/:name', syncLimiter, async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  try {
    const counts = await syncPhonebookForInstance(ctx.instance, ctx.client.id);
    res.json({ success: true, ...counts });
  } catch (err) {
    console.error('[phonebook] sync failed:', err);
    res.status(500).json({ success: false, error: 'Phonebook sync failed' });
  }
});

export default router;