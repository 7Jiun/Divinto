import { Router } from 'express';
import * as markdownControl from '../controller/exportMd.ts';
import authenticate from '../middleware/authenticateUser.ts';
const router = Router();

router
  .route('/markdown/card/:whiteboardId/:cardId')
  .get(authenticate, markdownControl.exportCardAsMarkdown);
router
  .route('/markdown/whiteboard/:whiteboardId')
  .get(authenticate, markdownControl.exportWhiteboardAsMarkdown);

export default router;
