import { Router } from 'express';
import * as cardControl from '../controller/cardControl.ts';
import * as multer from '../middleware/multer.ts';
import { CardContent } from '../model/cardModel.ts';
import { uploadImage } from '../controller/uploadControl.ts';
import authenticate from '../middleware/authenticateUser.ts';
const router = Router();

export interface Position {
  x: number;
  y: number;
}

export interface GetCard {
  whiteboardId: string;
  _id: string;
  id: string;
  title: string;
  position: Position;
  content: CardContent;
  tags: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string | null;
}

export interface UpdateCard {
  _id: string;
  id: string;
  title: string;
  position: Position;
  content: string;
  tags: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string | null;
}

router.route('/card/:cardId').get(authenticate, cardControl.getCard);

router.route('/card').post(authenticate, cardControl.createCard);

router.route('/card').put(authenticate, cardControl.updateCard);

router.route('/card/:cardId').delete(authenticate, cardControl.deleteCard);

router
  .route('/upload/:whiteboardId/:cardId')
  .post(
    authenticate,
    multer.uploadToBuffer.single('image'),
    multer.uploadTypeCheck,
    multer.uploadToDisk,
    uploadImage,
  );

export default router;
