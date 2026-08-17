import { Router, Request, Response } from 'express';
import { clientApiKeyAuth } from '../../middleware/auth.js';
import { V1_MUTATE } from '../../middleware/auth/v1Limits.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';
import type { SendContext, SendResult } from '../../services/whatsapp/shared.js';
import * as groups from '../../services/whatsapp/groups.js';

/**
 * /api/v1/groups/* - group management (FREE, no tokens). All ops are V1_MUTATE
 * (120/min) on top of the per-IP v1 bucket. Each route builds the ctx, delegates
 * to the shared service, and maps the result.
 */
const router = Router();
const auth = [clientApiKeyAuth, V1_MUTATE];

type Handler = (ctx: SendContext, req: Request) => Promise<SendResult>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    const ctx = buildSendCtx(req, res, req.params.instance);
    if (!ctx) return;
    try { respondSendResult(res, await handler(ctx, req)); }
    catch (e) { console.error('groups error:', e); res.status(500).json({ success: false, error: 'Group operation failed' }); }
  };
}

router.post('/create/:instance', ...auth, wrap((c, r) => groups.createGroup(c, r.body)));
router.post('/update-subject/:instance', ...auth, wrap((c, r) => groups.updateGroupSubject(c, r.body)));
router.post('/update-description/:instance', ...auth, wrap((c, r) => groups.updateGroupDescription(c, r.body)));
router.post('/update-picture/:instance', ...auth, wrap((c, r) => groups.updateGroupPicture(c, r.body)));
router.get('/fetch-all/:instance', ...auth, wrap((c, r) => groups.fetchAllGroups(c, r.query.getParticipants === 'true')));
router.get('/find/:instance', ...auth, wrap((c, r) => groups.findGroup(c, String(r.query.groupJid))));
router.get('/find-members/:instance', ...auth, wrap((c, r) => groups.findGroupMembers(c, String(r.query.groupJid))));
router.post('/update-participant/:instance', ...auth, wrap((c, r) => groups.updateParticipant(c, r.body)));
router.get('/invite-code/:instance', ...auth, wrap((c, r) => groups.inviteCode(c, String(r.query.groupJid))));
router.post('/revoke-invite/:instance', ...auth, wrap((c, r) => groups.revokeInvite(c, r.body.groupJid)));
router.get('/find-by-invite/:instance', ...auth, wrap((c, r) => groups.findByInvite(c, String(r.query.inviteCode))));
router.get('/accept-invite/:instance', ...auth, wrap((c, r) => groups.acceptInvite(c, String(r.query.inviteCode))));
router.post('/send-invite/:instance', ...auth, wrap((c, r) => groups.sendInvite(c, r.body)));
router.delete('/leave/:instance', ...auth, wrap((c, r) => groups.leaveGroup(c, String(r.query.groupJid))));
router.post('/toggle-ephemeral/:instance', ...auth, wrap((c, r) => groups.toggleEphemeral(c, r.body)));
router.post('/update-setting/:instance', ...auth, wrap((c, r) => groups.updateGroupSetting(c, r.body)));

export default router;
