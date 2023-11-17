import { Router } from 'express';
import * as cardControl from '../controller/cardControl.ts';
import { BlockContent, BlockTypeEnum } from '../model/cardModel.ts';
const router = Router();

export interface Position {
  x: number;
  y: number;
}

export interface GetCard {
  _id: string;
  id: string;
  title: string;
  position: Position;
  content: BlockContent[];
  tags: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string | null;
}

const cardExample: GetCard = {
  _id: '6556e3a17595641fd780b839',
  id: '1123e',
  title: "about today's work",
  position: {
    x: 200,
    y: 600,
  },
  content: [
    {
      type: BlockTypeEnum.Text,
      content: 'I think today is not goes well',
    },
    {
      type: BlockTypeEnum.Image,
      content: '![示例圖片2](https://example.com/image.jpg "圖片標題")',
    },
  ],
  tags: ['sad', 'frustrated'],
  createdAt: '2023-11-16T15:45:30.000Z',
  updateAt: '2023-11-16T15:45:30.000Z',
  removeAt: null,
};

router.route('/card/:cardId').get(cardControl.getCard);

router.route('/card').post(cardControl.createCard);

router.route('/card').put(cardControl.updateCard);

router.route('/card').delete((req, res) => {
  res.json(cardExample);
});

export default router;
