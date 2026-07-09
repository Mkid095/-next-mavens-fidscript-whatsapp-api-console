import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_READ, V1_MUTATE } from '../../middleware/auth/v1Limits.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import type { SendContext, SendResult } from '../../services/whatsapp/shared.js';
import * as chats from '../../services/whatsapp/chats.js';
import { mirrorChatList, mirrorThread } from '../../services/whatsapp/chatMirror.js';

/**
 * /api/v1/chats/* — chat management. Reads get V1_READ (600/min), mutations
 * get V1_MUTATE (120/min). No tokens — all free.
 *
 * For SDK backward-compatibility, find-chats and find-messages now read from the
 * local DB (inbox_messages) instead of paginating Evolution — but return responses
 * shaped exactly like Evolution's API so existing SDK consumers see no change.
 */
const router = Router();
const authRead = [clientApiKeyAuth, V1_READ];
const authMutate = [clientApiKeyAuth, V1_MUTATE];

type Handler = (ctx: SendContext, req: Request) => Promise<SendResult>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    const ctx = buildSendCtx(req, res, req.params.instance);
    if (!ctx) return;
    try { respondSendResult(res, await handler(ctx, req)); }
    catch (e) { console.error('chats error:', e); res.status(500).json({ success: false, error: 'Chat operation failed' }); }
  };
}

// Mutations — V1_MUTATE
router.post('/mark-read/:instance', ...authMutate, wrap((c, r) => chats.markRead(c, r.body)));
router.post('/mark-unread/:instance', ...authMutate, wrap((c, r) => chats.markUnread(c, r.body)));
router.post('/archive/:instance', ...authMutate, wrap((c, r) => chats.archiveChat(c, r.body)));
router.post('/presence/:instance', ...authMutate, wrap((c, r) => chats.sendPresence(c, r.body)));
router.delete('/delete-for-everyone/:instance', ...authMutate, wrap((c, r) => chats.deleteForEveryone(c, r.body)));
router.post('/update-message/:instance', ...authMutate, wrap((c, r) => chats.updateMessage(c, r.body)));

// Reads — V1_READ
// find-chats: DB-backed (mirrorChatList), return Evolution shape { response: [...] }
router.post('/find-chats/:instance', ...authRead, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try {
    const result = await mirrorChatList(ctx);
    if (!result.ok) { respondSendResult(res, result); return; }
    const chats = result.data as { chats: unknown[] };
    res.json({ response: chats.chats });
  } catch (e) { console.error('chats error:', e); res.status(500).json({ success: false, error: 'Chat operation failed' }); }
});

// find-messages: DB-backed (mirrorThread), return Evolution shape { response: { messages: { records: [...], pages: 1 } } }
router.post('/find-messages/:instance', ...authRead, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try {
    const jid = req.body?.where?.remoteJid as string || '';
    if (!jid) { res.status(400).json({ success: false, error: 'where.remoteJid required' }); return; }
    const result = await mirrorThread(ctx, jid);
    if (!result.ok) { respondSendResult(res, result); return; }
    const msgs = result.data as { messages: unknown[] };
    res.json({ response: { messages: { records: msgs.messages, pages: 1 } } });
  } catch (e) { console.error('chats error:', e); res.status(500).json({ success: false, error: 'Chat operation failed' }); }
});

router.post('/find-contacts/:instance', ...authRead, wrap((c, r) => chats.findContacts(c, r.body.where)));
router.post('/find-status/:instance', ...authRead, wrap((c, r) => chats.findStatus(c, r.body.where, r.body.limit)));
router.post('/is-whatsapp/:instance', ...authRead, wrap((c, r) => chats.isWhatsApp(c, r.body.numbers)));
router.post('/base64/:instance', ...authRead, wrap((c, r) => chats.getBase64(c, r.body)));
router.get('/profile-pic-url/:instance', ...authRead, wrap((c, r) => chats.profilePicUrl(c, String(r.query.number))));

export default router;
