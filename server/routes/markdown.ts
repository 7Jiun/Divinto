import { Router } from 'express';
import * as cardControl from '../controller/cardControl.ts';
import * as markdownControl from '../controller/exportMd.ts';
const router = Router();

router.route('/markdown/card/:cardId').post(markdownControl.exportCardAsMarkdown);
router.route('/markdown/whiteboard/:whiteboardId').get(cardControl.getCard);

export default router;
