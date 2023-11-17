import { Router } from 'express';
import * as cardControl from '../controller/cardControl.ts';
const router = Router();

router.route('/markdown/card/:cardId').get(cardControl.getCard);
router.route('/markdown/whiteboard/:whiteboardId').get(cardControl.getCard);
