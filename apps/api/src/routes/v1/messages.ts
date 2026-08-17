import { Router, Request, Response } from 'express';
import { clientApiKeyAuth, clientRateLimit } from '../../middleware/auth.js';
import {
  sendText, sendMedia, sendLocation, sendContact,
  sendReaction, sendPoll, sendList, sendAudio, sendSticker, sendStatus,
} from '../../services/whatsapp/messaging.js';
import { buildSendCtx, respondSendResult } from '../../services/whatsapp/http.js';

const router = Router();

// POST /api/v1/messages/text/:instance
router.post('/text/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ success: false, error: 'Recipient (to) and message are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendText(ctx, { to, message })); }
  catch (e) { console.error('v1 sendText error:', e); res.status(500).json({ success: false, error: 'Failed to send message' }); }
});

// POST /api/v1/messages/media/:instance
router.post('/media/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, media_url, media_type, caption } = req.body;
  if (!to || !media_url) return res.status(400).json({ success: false, error: 'Recipient (to) and media_url are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendMedia(ctx, { to, media_url, media_type, caption })); }
  catch (e) { console.error('v1 sendMedia error:', e); res.status(500).json({ success: false, error: 'Failed to send media' }); }
});

// POST /api/v1/messages/location/:instance
router.post('/location/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, latitude, longitude, name, address } = req.body;
  if (!to || latitude === undefined || longitude === undefined) return res.status(400).json({ success: false, error: 'Recipient (to), latitude, and longitude are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendLocation(ctx, { to, latitude, longitude, name, address })); }
  catch (e) { console.error('v1 sendLocation error:', e); res.status(500).json({ success: false, error: 'Failed to send location' }); }
});

// POST /api/v1/messages/contact/:instance
router.post('/contact/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, contact } = req.body;
  if (!to || !Array.isArray(contact) || contact.length === 0) return res.status(400).json({ success: false, error: 'Recipient (to) and contact array are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendContact(ctx, { to, contact })); }
  catch (e) { console.error('v1 sendContact error:', e); res.status(500).json({ success: false, error: 'Failed to send contact' }); }
});

// POST /api/v1/messages/reaction/:instance
router.post('/reaction/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, key, reaction } = req.body;
  if (!to || !key || !reaction) return res.status(400).json({ success: false, error: 'Recipient (to), message key, and reaction are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendReaction(ctx, { to, key, reaction })); }
  catch (e) { console.error('v1 sendReaction error:', e); res.status(500).json({ success: false, error: 'Failed to send reaction' }); }
});

// POST /api/v1/messages/poll/:instance
router.post('/poll/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, name, selectableCount, values } = req.body;
  if (!to || !name || !selectableCount || !Array.isArray(values) || values.length < 2) return res.status(400).json({ success: false, error: 'Recipient (to), poll name, selectableCount, and at least 2 values are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendPoll(ctx, { to, name, selectableCount, values })); }
  catch (e) { console.error('v1 sendPoll error:', e); res.status(500).json({ success: false, error: 'Failed to send poll' }); }
});

// POST /api/v1/messages/list/:instance
router.post('/list/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, title, description, buttonText, footerText, sections } = req.body;
  if (!to || !title || !buttonText || !Array.isArray(sections) || sections.length === 0) return res.status(400).json({ success: false, error: 'Recipient (to), title, buttonText, and sections are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendList(ctx, { to, title, description, buttonText, footerText, sections })); }
  catch (e) { console.error('v1 sendList error:', e); res.status(500).json({ success: false, error: 'Failed to send list message' }); }
});

// POST /api/v1/messages/audio/:instance - native voice message (PTT)
router.post('/audio/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, audio } = req.body;
  if (!to || !audio) return res.status(400).json({ success: false, error: 'Recipient (to) and audio URL are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendAudio(ctx, { to, audio })); }
  catch (e) { console.error('v1 sendAudio error:', e); res.status(500).json({ success: false, error: 'Failed to send audio' }); }
});

// POST /api/v1/messages/sticker/:instance
router.post('/sticker/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { to, sticker } = req.body;
  if (!to || !sticker) return res.status(400).json({ success: false, error: 'Recipient (to) and sticker URL are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendSticker(ctx, { to, sticker })); }
  catch (e) { console.error('v1 sendSticker error:', e); res.status(500).json({ success: false, error: 'Failed to send sticker' }); }
});

// POST /api/v1/messages/status/:instance - post a status/story update
router.post('/status/:instance', clientApiKeyAuth, clientRateLimit, async (req: Request, res: Response) => {
  const { type, content } = req.body;
  if (!type || !content) return res.status(400).json({ success: false, error: 'type (text|image|audio) and content are required' });
  const ctx = buildSendCtx(req, res, req.params.instance);
  if (!ctx) return;
  try { respondSendResult(res, await sendStatus(ctx, { type, content, caption: req.body.caption, backgroundColor: req.body.backgroundColor, font: req.body.font, allContacts: req.body.allContacts, statusJidList: req.body.statusJidList })); }
  catch (e) { console.error('v1 sendStatus error:', e); res.status(500).json({ success: false, error: 'Failed to send status' }); }
});

export default router;
