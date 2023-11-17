import { Request, Response } from 'express';
import * as cardModel from '../model/cardModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import { UpdateCard } from '../routes/card.ts';

export interface UserPayload {
  id: string;
  name: string;
}

export interface CardInput {
  title: string;
  whiteboardId: string;
  position: Position;
  content: string;
  tags: Array<string>;
}

export async function createCard(req: Request<{}, {}, CardInput>, res: Response) {
  const user: UserPayload = {
    id: '22',
    name: 'Jiun',
  };
  const card: CardInput = req.body;
  try {
    const newCard = await cardModel.createCard(user, card);
    await whiteboardModel.addWhiteboardCards(newCard._id, card.whiteboardId);
    res.status(200).json({ data: 'create card successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    res.status(500).json({ data: 'create card failed' });
  }
}

export async function getCard(req: Request, res: Response) {
  try {
    const { cardId } = req.params;
    const card = await cardModel.getCardById(cardId);
    res.status(200).json(card);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error, ${error.message}`);
    }
    res.status(500).json({ data: 'internal server error' });
  }
}

export async function updateCard(req: Request<{}, {}, UpdateCard>, res: Response) {
  const cardStatus = req.body;
  try {
    await cardModel.updateCard(cardStatus);
    res.status(200).json({ data: 'updated successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    res.status(500).json({ data: 'internal server error' });
  }
}

// export async function deleteCard(req: Request, res: Response) {}
