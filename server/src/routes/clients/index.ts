import { Router } from 'express';
import listRouter from './list.js';
import createRouter from './create.js';
import getRouter from './get.js';
import manageRouter from './manage.js';
import deleteRouter from './delete.js';

const router = Router();
router.use('/', listRouter);
router.use('/', createRouter);
router.use('/', getRouter);
router.use('/', manageRouter);
router.use('/', deleteRouter);

export default router;