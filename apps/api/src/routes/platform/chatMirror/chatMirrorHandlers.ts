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
import db from '../../../database.js';
import { requireConnected } from '../../../services/whatsapp/shared.js';
import { buildSendCtx, respondSendResult } from '../../../services/whatsapp/http.js';
import { mirrorChatList, mirrorThread, mirrorProfilePic } from '../../../services/whatsapp/chatMirror.js';
import { findContacts } from '../../../services/whatsapp/chats.js';
import { getOutboundUsage, newInitiationsInBatch } from '../../../services/whatsapp/outboundUsage.js';
import { instanceEmitter } from '../../../utils/gateway.js';

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

// POST /api/platform/chats/:name/contacts { query?: string }
// Search WhatsApp contacts via Evolution API
router.post('/chats/:name/contacts', chatMirrorLimiter, async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  const query = typeof req.body?.query === 'string' ? req.body.query : undefined;
  const result = await findContacts(ctx, query ? { query } : undefined);
  if (!result.ok) { res.status(502).json({ success: false, error: result.error }); return; }
  const raw = result.data as { response?: { contacts?: unknown[] }; contacts?: unknown[] };
  const contacts = Array.isArray(raw.contacts) ? raw.contacts
    : Array.isArray(raw.response?.contacts) ? raw.response.contacts : [];
  res.json({ success: true, data: { contacts } });
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
// Marks all incoming unread messages in the given chat as read locally AND
// sends a read receipt to WhatsApp via Evolution API so the sender sees
// blue ticks on their WhatsApp app.
router.post('/chats/:name/mark-read', async (req, res) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }

  const jid: string = typeof req.body?.jid === 'string' ? req.body.jid : '';
  if (!jid) { res.status(400).json({ success: false, error: 'jid required' }); return; }

  // Query unread incoming message IDs for this chat so we can send read receipts
  const unreadRows = db.prepare(
    `SELECT id FROM inbox_messages
     WHERE instance_id = ? AND chat_id = ? AND is_read = 0 AND direction = 'incoming'`
  ).all(ctx.instance.id, jid) as { id: string }[];

  // Mark as read in our DB immediately (optimistic)
  const info = db.prepare(
    'UPDATE inbox_messages SET is_read = 1 WHERE instance_id = ? AND chat_id = ? AND is_read = 0 AND direction = ?'
  ).run(ctx.instance.id, jid, 'incoming');

  // Send read receipts to WhatsApp via Evolution API — this makes the sender
  // see blue ticks on their WhatsApp. Fire-and-forget; we already updated our DB.
  if (unreadRows.length > 0) {
    const { markRead } = await import('../../../services/whatsapp/chats.js');
    const readMessages = unreadRows.map((r) => ({
      key: { remoteJid: jid, fromMe: false, id: r.id },
    }));
    // Best-effort: log errors but still return success to the client
    const result = await markRead(ctx, { readMessages });
    if (!result.ok) {
      console.error('[chatMirror] markRead Evolution API error:', result.error);
    }
  }

  // Emit so SSE listeners (useChatList) can decrement the badge in real time
  instanceEmitter.emit('message.read', ctx.instance.name, { conversationId: null, messageId: '', chatId: jid });

  res.json({ success: true, updated: info.changes });
});

// GET /api/platform/chatmirror/media?url=<encoded_media_url>
// Proxy for Evolution API media URLs — fetches the media with the correct API
// key headers and returns it with proper CORS headers so the browser can render
// images/video/audio that would otherwise 403 (browser can't send apikey header).
// The URL must belong to our Evolution API instance; we reject anything else.
router.get('/media', async (req: Request, res) => {
  const encodedUrl = typeof req.query.url === 'string' ? req.query.url : '';
  if (!encodedUrl) { res.status(400).json({ success: false, error: 'url query param required' }); return; }

  let mediaUrl: string;
  try { mediaUrl = decodeURIComponent(encodedUrl); } catch { res.status(400).json({ success: false, error: 'Invalid URL encoding' }); return; }

  // Security: only proxy URLs from our Evolution API base
  const evBase = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  let targetUrl = mediaUrl;
  if (!mediaUrl.startsWith(evBase)) {
    // Allow relative paths: /mediafile/{instanceName}/{fileName}
    if (mediaUrl.startsWith('/mediafile/')) {
      targetUrl = `${evBase}${mediaUrl}`;
    } else {
      res.status(400).json({ success: false, error: 'Media URL not from Evolution API' }); return;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY ?? (() => { throw new Error('EVOLUTION_API_KEY env var is required'); })(),
        'Accept': 'image/*,video/*,audio/*,application/octet-stream,*/*',
      },
    });
    if (!response.ok) { res.status(502).json({ success: false, error: `Evolution API returned ${response.status}` }); return; }

    // Cap proxied media at 50 MB to prevent a single huge media file from
    // filling disk via the 24h nginx cache. Audio (voice notes) and small images
    // are well under this; 4K video is the upper limit we want to support.
    const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
    const declaredSize = Number(response.headers.get('content-length') ?? '0');
    if (declaredSize > MAX_MEDIA_BYTES) {
      res.status(413).json({ success: false, error: `Media too large (${declaredSize} bytes; max ${MAX_MEDIA_BYTES})` });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_MEDIA_BYTES) {
      res.status(413).json({ success: false, error: 'Media exceeded 50 MB during transfer' });
      return;
    }
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[chatMirror] media proxy error:', err);
    res.status(502).json({ success: false, error: 'Failed to fetch media' });
  }
});

export default router;
