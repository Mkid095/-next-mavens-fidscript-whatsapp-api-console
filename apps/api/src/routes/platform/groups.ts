import { Router, Request, Response } from 'express';
import { clientJwtAuth } from '../../middleware/auth.js';
import { getGroupInfo } from '../../services/whatsapp/groupMetadata.js';

// GET /api/platform/groups/:chatId/info — cached group subject/size/owner.
// :chatId is the WhatsApp group JID (e.g. "...@g.us"). Workspace-scoped via
// the client JWT (the cache is process-wide; the route is auth-gated).
const router = Router();
router.use(clientJwtAuth);

router.get('/:chatId/info', async (req: Request, res: Response) => {
  try {
    const chatId = decodeURIComponent(req.params.chatId);
    if (!chatId.includes('@g.us')) {
      res.status(400).json({ success: false, error: 'Not a group JID' });
      return;
    }
    const info = await getGroupInfo(chatId);
    res.json({ success: true, data: { subject: info.subject, size: info.size, owner: info.owner } });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
