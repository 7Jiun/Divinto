import { Router } from 'express';
import * as markdownControl from '../controller/exportMd.ts';
const router = Router();

router.route('/markdown/card/:whiteboardId/:cardId').post(markdownControl.exportCardAsMarkdown);
router.route('/markdown/whiteboard/:whiteboardId').post(markdownControl.exportWhiteboardAsMarkdown);

// 加完使用者驗證要改成 get

export default router;
