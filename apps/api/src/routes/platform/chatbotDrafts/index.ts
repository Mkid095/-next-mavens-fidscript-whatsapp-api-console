import { Router } from 'express';
import chatbotDraftsGet from './chatbotDraftsGet.js';
import chatbotDraftsSave from './chatbotDraftsSave.js';
import chatbotDraftsDelete from './chatbotDraftsDelete.js';

const router = Router();

router.use('/', chatbotDraftsGet);
router.use('/', chatbotDraftsSave);
router.use('/', chatbotDraftsDelete);

export default router;
