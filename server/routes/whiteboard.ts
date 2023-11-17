import { Router } from 'express';
import { createWhiteboard, getWhiteboard } from '../controller/whiteboardControl.ts';

const router = Router();

router.route('/whiteboard/:whiteboardId').get(getWhiteboard);

router.route('/whiteboard').post(createWhiteboard);

export default router;
