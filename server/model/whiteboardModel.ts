import mongoose from 'mongoose';
import { Card, Whiteboard } from './schema.ts';
import { UserPayload } from '../controller/cardControl.ts';
import { createId } from './cardModel.ts';
import { GetCard } from '../routes/card.ts';

export interface GetWhiteboard {
  id: string;
  _id: string;
  title: string;
  cards: GetCard[];
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
  const whiteboard = await Whiteboard.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(whiteboardId) } },
    {
      $addFields: {
        cards: {
          $map: {
            input: '$cards',
            as: 'cards',
            in: { $toObjectId: '$$cards' },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'cards',
        localField: 'cards',
        foreignField: '_id',
        as: 'cards',
      },
    },
  ]);
  return whiteboard as unknown as GetWhiteboard;
}

export async function addWhiteboardCards(cardId: string, whiteboardId: string) {
  await Whiteboard.findByIdAndUpdate(whiteboardId, { $push: { cards: cardId } }, { new: true });
}

// export async function getCardIdsByWhiteboard(whiteboardId: string): Promise<string[]> {
//   const whiteboard = await getWhiteboard(whiteboardId);
//   const cards = whiteboard.cards;
//   return cards;
// }

export async function getCardsByTag(tag: string | null, whiteboardId: string) {
  const cardsWithTag = Whiteboard.aggregate([
    // 第一步：匹配特定的 whiteboard
    { $match: { _id: new mongoose.Types.ObjectId(whiteboardId) } },

    // 第二步：使用 $lookup 从 Card 集合中查找匹配的 cards
    {
      $lookup: {
        from: Card.collection.name, // 'cards' 是 Card 集合的名字
        localField: 'cards', // whiteboard 中的 cards 属性
        foreignField: '_id', // Card 集合中的 _id 字段
        as: 'cardDetails', // 结果将被添加到此新字段中
      },
    },
  ]);
  return cardsWithTag;
}

// export async function exportWhiteboardAsMarkdown(whiteboardId: string) {
//   const cards = await getCardIdsByWhiteboard(whiteboardId);
// }
