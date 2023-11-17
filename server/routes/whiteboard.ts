import { Router } from 'express';
import { createWhiteboard, getWhiteboard, getCardsByTag } from '../controller/whiteboardControl.ts';

const router = Router();

router.route('/whiteboard/:whiteboardId').get(getWhiteboard);

router.route('/whiteboard/:whiteboardId/search').get(getCardsByTag);

router.route('/whiteboard').post(createWhiteboard);

export default router;
