import { Router } from 'express';
import * as whiteboardControl from '../controller/whiteboardControl.ts';
import authenticate from '../middleware/authenticateUser.ts';

const router = Router();

router.route('/whiteboard/:whiteboardId').get(authenticate, whiteboardControl.getWhiteboard);

router.route('/whiteboard/:whiteboardId/search').get(authenticate, whiteboardControl.getCardsByTag);

router.route('/whiteboard').post(authenticate, whiteboardControl.createWhiteboard);

export default router;
