import { Whiteboard } from './schema.ts';
import { UserPayload } from '../controller/cardControl.ts';
import { createId } from './cardModel.ts';

export interface GetWhiteboard {
  id: string;
  _id: string;
  title: string;
  cards: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string;
}

export async function createWhiteboard(user: UserPayload, title: string) {
  const whiteboardId: string = createId(user);
  const insertId = await Whiteboard.create({
    id: whiteboardId,
    title: title,
  });
  return insertId;
}

export async function getWhiteboard(whiteboardId: string): Promise<GetWhiteboard> {
  const whiteboard = await Whiteboard.findById(whiteboardId);
  return whiteboard as unknown as GetWhiteboard;
}

export async function addWhiteboardCards(cardId: string, whiteboardId: string) {
  await Whiteboard.findByIdAndUpdate(whiteboardId, { $push: { cards: cardId } }, { new: true });
}

// export async function getCardsByWhiteBoard(whiteboardId: string): Promise<string[]> {
//   const whiteboard = await getWhiteboard(whiteboardId);
//   const cards = whiteboard.cards;
//   return cards;
// }
