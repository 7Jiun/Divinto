import { Router } from 'express';

const router = Router();

interface Whiteboard {
  id: string;
  title: string;
  cards: Array<string>;
}

const whiteboardExample: Whiteboard = {
  id: 'test123',
  title: 'about work',
  cards: ['123e', '123f'],
};

router.route('/whiteboard').get((req, res) => {
  res.json(whiteboardExample);
});

export default router;
