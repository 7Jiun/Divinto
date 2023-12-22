import { Request, Response } from 'express';
import { CardInput, UpdateCard, JwtUserPayload } from '../utils/shape.ts';
import { sleep } from 'bun';
import * as cardModel from '../model/cardModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import mongoose from 'mongoose';

export async function createCard(req: Request<{}, {}, CardInput>, res: Response) {
  const user: JwtUserPayload = res.locals.userPayload;
  const card: CardInput = req.body;
  const createCardSession = await mongoose.startSession();
  let retryCount = 0;
  const maxRetries = 5;
  while (retryCount < maxRetries) {
    try {
      createCardSession.startTransaction();
      const newCard = await cardModel.createCard(user, card, createCardSession);
      await whiteboardModel.addWhiteboardCards(newCard._id, card.whiteboardId, createCardSession);
      await createCardSession.commitTransaction();
      res.status(200).json(newCard);
      return;
    } catch (error) {
      await createCardSession.abortTransaction();
      if (
        error instanceof Error &&
        error.message ===
          'WriteConflict error: this operation conflicted with another operation. Please retry your operation or multi-document transaction.'
      ) {
        retryCount++;
        await sleep(200);
      } else {
        console.error(error);
        res.status(500).json({ data: 'create card failed' });
        return;
      }
    }
  }
  res.status(500).json({ data: 'create card failed due to retry limit' });
  await createCardSession.endSession();
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
