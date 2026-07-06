import { Router } from 'express';
import packagesRouter from './packages.js';
import initiateRouter from './initiate.js';
import customRouter from './custom.js';
import callbackRouter from './callback.js';
import statusRouter from './status.js';

const router = Router();

router.use('/packages', packagesRouter);
router.use('/initiate', initiateRouter);
router.use('/custom', customRouter);
router.use('/callback', callbackRouter);
router.use('/', statusRouter);

export default router;