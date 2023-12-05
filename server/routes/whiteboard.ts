import { Router } from 'express';
import * as whiteboardControl from '../controller/whiteboardControl.ts';
import authenticate from '../middleware/authenticateUser.ts';

const router = Router();

router.route('/whiteboard/:whiteboardId').get(authenticate, whiteboardControl.getWhiteboard);

router.route('/whiteboard/:whiteboardId/search').get(authenticate, whiteboardControl.getCardsByTag);

router
  .route('/whiteboard/:whiteboardId/fullTextSearch')
  .get(authenticate, whiteboardControl.getCardsByTextSearch);

router.route('/whiteboard').post(authenticate, whiteboardControl.createWhiteboard);

router
  .route('/whiteboard/:whiteboardId')
  .put(authenticate, whiteboardControl.updateWhiteboardTitle);

router.route('/whiteboard/:whiteboardId').delete(authenticate, whiteboardControl.deleteWhiteboard);

export default router;
