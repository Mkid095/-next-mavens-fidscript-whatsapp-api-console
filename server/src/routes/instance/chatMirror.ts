/**
 * /api/instance/chats/* + /api/instance/profile-pic/:name — client-JWT proxies
 * to the live WhatsApp-Web mirror. The portal authenticates with a client JWT
 * (not an API key), so it cannot reach /api/v1/chats/* directly; these routes
 * build a SendContext the same way the messaging routes do and return clean,
 * typed chat/message shapes from the chatMirror normalizer.
 */
import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { requireConnected } from '../../services/whatsapp/shared.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import { mirrorChatList, mirrorThread, mirrorProfilePic } from '../../services/whatsapp/chatMirror.js';

const router = Router();

// GET /api/instance/chats/:name — all WhatsApp chats (1:1 + groups), live.
router.get('/chats/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  respondSendResult(res, await mirrorChatList(ctx));
});

// GET /api/instance/chats/:name/:jid — full thread for a chat (jid URL-encoded).
router.get('/chats/:name/:jid', clientJwtAuth, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  const jid = decodeURIComponent(req.params.jid);
  respondSendResult(res, await mirrorThread(ctx, jid));
});

// GET /api/instance/profile-pic/:name?number= — avatar URL for a contact/number.
router.get('/profile-pic/:name', clientJwtAuth, async (req: Request, res: Response) => {
  const ctx = buildSendCtx(req, res, req.params.name);
  if (!ctx) return;
  const guard = requireConnected(ctx);
  if (guard) { respondSendResult(res, guard); return; }
  const number = String(req.query.number || '');
  respondSendResult(res, await mirrorProfilePic(ctx, number));
});

export default router;
