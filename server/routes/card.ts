import { Router } from 'express';

const router = Router();

export interface Position {
  x: number;
  y: number;
}

export interface Card {
  id: string;
  title: string;
  position: Position;
  content: string;
  tags: Array<string>;
  createTime: string;
}

const cardExample: Card = {
  id: '1123e',
  title: "about today's work",
  position: {
    x: 200,
    y: 600,
  },
  content: 'I think today is not goes well',
  tags: ['sad', 'frustrated'],
  createTime: '2023-11-16T15:45:30.000Z',
};

router.route('/card').get((req, res) => {
  res.json(cardExample);
});

export default router;
