import { Router } from 'express';
import listRouter from './list.js';
import createRouter from './create.js';
import updateRouter from './update.js';
import deleteRouter from './delete.js';

const router = Router();
router.use('/', listRouter);
router.use('/', createRouter);
router.use('/', updateRouter);
router.use('/', deleteRouter);

export default router;