import { Router } from 'express';
import adminAuthRouter from './adminAuth.js';
import clientAuthRouter from './clientAuth.js';
import clientMeRouter from './clientMe.js';
import clientTokensRouter from './clientTokens.js';

const router = Router();

router.use('/', adminAuthRouter);
router.use('/', clientAuthRouter);
router.use('/', clientMeRouter);
router.use('/', clientTokensRouter);

export default router;
