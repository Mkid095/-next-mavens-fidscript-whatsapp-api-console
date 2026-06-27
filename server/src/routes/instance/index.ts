import { Router } from 'express';
import create from './create.js';
import manage from './manage.js';
import clientInstances from './clientInstances.js';
import connect from './connect.js';
import connectionState from './connectionState.js';
import messaging from './messaging.js';
import logout from './logout.js';
import deleteInstance from './delete.js';
import groupSync from './groupSync.js';
import chatMirror from './chatMirror.js';

const router = Router();

router.use('/', create);
router.use('/', manage);
router.use('/', clientInstances);
router.use('/', connect);
router.use('/', connectionState);
router.use('/', messaging);
router.use('/', logout);
router.use('/', deleteInstance);
router.use('/', groupSync);
router.use('/', chatMirror);

export default router;
