import { Router } from 'express';
import * as cardControl from '../controller/cardControl.ts';
import * as multer from '../middleware/multer.ts';
import { uploadImage } from '../controller/uploadControl.ts';
import authenticate from '../middleware/authenticateUser.ts';
const router = Router();

router.route('/card/:cardId').get(authenticate, cardControl.getCard);

router.route('/card').post(authenticate, cardControl.createCard);

router.route('/card').put(authenticate, cardControl.updateCard);

router.route('/card/:cardId').delete(authenticate, cardControl.deleteCard);

router
  .route('/upload/:whiteboardId/:cardId')
  .post(authenticate, multer.uploadS3.single('image'), multer.uploadTypeCheck, uploadImage);

export default router;
