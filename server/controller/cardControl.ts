import { Request, Response } from 'express';
import { CardInput, UpdateCard, JwtUserPayload } from '../utils/shape.ts';
import * as cardModel from '../model/cardModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';

export async function createCard(req: Request<{}, {}, CardInput>, res: Response) {
  const user: JwtUserPayload = res.locals.userPayload;
  const card: CardInput = req.body;
  try {
    const newCard = await cardModel.createCard(user, card);
    await whiteboardModel.addWhiteboardCards(newCard._id, card.whiteboardId);
    res.status(200).json(newCard);
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
    if (card.removeAt) return res.status(400).json({ data: 'card is removed' });
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

export async function deleteCard(req: Request, res: Response) {
  const { cardId } = req.params;
  try {
    const removedCard = await cardModel.deleteCard(cardId);
    res.status(200).json(removedCard);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`deleted failed: ${error.message}`);
    }
    res.status(500).json({ data: 'deleted card failed' });
  }
}
