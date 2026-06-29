/**
 * /api/platform/chats/* + /api/platform/profile-pic/:name — client-JWT proxies
 * to the live WhatsApp-Web mirror, mounted under the platform router so it
 * uses platformLimiter (600/min backstop). The per-route chatMirrorLimiter
 * caps the heavy the gateway calls (find-chats/find-messages) at 10/min per
 * client to stay well under WhatsApp's ~80/min account limit and avoid
 * blocks. The portal authenticates with a client JWT (not an API key), so it
 * cannot reach /api/v1/chats/* directly; this layer is the only path.
 */
import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../../database.js';
import { requireConnected } from '../../services/whatsapp/shared.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import { mirrorChatList, mirrorThread, mirrorProfilePic } from '../../services/whatsapp/chatMirror.js';
import { getOutboundUsage, newInitiationsInBatch } from '../../services/whatsapp/outboundUsage.js';
import { instanceEmitter } from '../../utils/gateway.js';

// 10/sec per client — responsive UI reads (find-chats/find-messages) without
// approaching the ~80 MPS WhatsApp send throughput (reads aren't subject to
// the 80 MPS limit; this cap just prevents runaway bursts and keeps us well
// under any the gateway/WhatsApp read-rate ceiling). The frontend coalesces
// SSE bursts via the shared refresh gate so the cap is rarely approached.
const chatMirrorLimiter = rateLimit({
  windowMs: 1000,
  max: 10,
  keyGenerator: (req: Request) => `cli_${req.client?.id ?? req.ip ?? 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Chat refresh rate limit reached (10/sec).', code: 'CHAT_RATE_LIMIT' },
});

// Profile pics are cached per-JID after first fetch, so traffic is bursty
// (initial load) but light. Higher cap; the frontend caps concurrency at 3.
const profilePicLimiter = rateLimit({
  windowMs: 1000,
  max: 30,
  keyGenerator: (req: Request) => `cli_${req.client?.id ?? req.ip ?? 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Profile-picture rate limit reached.', code: 'PROFILE_PIC_RATE_LIMIT' },
});

const router = Router();

router.get('/chats/:name', chatMirrorLimiter, async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  respondSendResult(res, await mirrorChatList(ctx));
});

router.get('/chats/:name/:jid', chatMirrorLimiter, async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  const jid = decodeURIComponent(req.params.jid);
  respondSendResult(res, await mirrorThread(ctx, jid));
});

router.get('/profile-pic/:name', profilePicLimiter, async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  const number = String(req.query.number || '');
  respondSendResult(res, await mirrorProfilePic(ctx, number));
});

// GET /api/platform/usage/outbound/:name — outbound volume snapshot for the
// instance (unique initiations in the last 24h vs tier limit). The frontend
// uses this to render "47 / 250 new contacts today" + the upgrade threshold.
router.get('/usage/outbound/:name', async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  // No requireConnected — usage should be readable even when disconnected.
  try {
    const usage = getOutboundUsage(ctx.instance.id, ctx.client.id);
    res.json({ success: true, data: usage });
  } catch (err) {
    console.error('[chatMirror] usage query failed:', err);
    res.status(500).json({ success: false, error: 'Failed to read outbound usage', code: 'USAGE_QUERY_FAILED' });
  }
});

// POST /api/platform/usage/check-batch/:name { chatIds: string[] }
// Returns how many of the batch would be NEW initiations and whether sending
// the full batch would exceed the tier limit. Bulk campaigns call this before
// dispatch to cap the batch and warn the user.
router.post('/usage/check-batch/:name', async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  try {
    const chatIds: string[] = Array.isArray(req.body?.chatIds) ? req.body.chatIds.filter((s: unknown) => typeof s === 'string') : [];
    const usage = getOutboundUsage(ctx.instance.id, ctx.client.id);
    const wouldBeNew = newInitiationsInBatch(ctx.instance.id, ctx.client.id, chatIds);
    const totalAfter = usage.uniqueInitiationsToday + wouldBeNew;
    const wouldExceed = usage.tier !== 4 && totalAfter > usage.tierLimit;
    const safeToSend = usage.tier === 4 ? wouldBeNew : Math.min(wouldBeNew, Math.max(0, usage.tierLimit - usage.uniqueInitiationsToday));
    res.json({
      success: true,
      data: {
        batchSize: chatIds.length,
        wouldBeNewInitiations: wouldBeNew,
        uniqueAfter: totalAfter,
        tierLimit: usage.tierLimit,
        tier: usage.tier,
        wouldExceed,
        safeToSend,
      },
    });
  } catch (err) {
    console.error('[chatMirror] check-batch failed:', err);
    res.status(500).json({ success: false, error: 'Failed to check batch', code: 'BATCH_CHECK_FAILED' });
  }
});

// POST /api/platform/chats/:name/mark-read { jid }
// Marks all incoming unread messages in the given chat as read.
// Updates our own inbox_messages, then emits a message.read SSE event so the
// chat list badge clears in real time. Does NOT call Evolution API (which
// would only mark-read on the server, not our local DB).
router.post('/chats/:name/mark-read', async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }

  const jid: string = typeof req.body?.jid === 'string' ? req.body.jid : '';
  if (!jid) { res.status(400).json({ success: false, error: 'jid required' }); return; }

  const info = db.prepare(
    'UPDATE inbox_messages SET is_read = 1 WHERE instance_id = ? AND chat_id = ? AND is_read = 0 AND direction = ?'
  ).run(ctx.instance.id, jid, 'incoming');

  // Emit so SSE listeners (useChatList) can decrement the badge in real time
  instanceEmitter.emit('message.read', ctx.instance.name, { conversationId: null, messageId: '', chatId: jid });

  res.json({ success: true, updated: info.changes });
});

export default router;