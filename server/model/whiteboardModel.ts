import mongoose from 'mongoose';
import { Whiteboard } from './schema.ts';
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

export interface Iwhiteboard {
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

export async function getWhiteboard(whiteboardId: string): Promise<GetWhiteboard[]> {
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
  return whiteboard as unknown as GetWhiteboard[];
}

export async function addWhiteboardCards(cardId: string, whiteboardId: string) {
  await Whiteboard.findByIdAndUpdate(whiteboardId, { $push: { cards: cardId } }, { new: true });
}

export async function getCardsByTag(tag: string | null, whiteboardId: string) {
  const cardsWithTag = Whiteboard.aggregate([
    // 第一步：匹配特定的 whiteboard
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
    { $unwind: '$cards' },
    // 过滤出包含特定标签的卡片
    { $match: { 'cards.tags': tag } },
  ]);
  return cardsWithTag;
}

export async function getCardsByWhiteboard(whiteboardId: string): Promise<Array<string> | null> {
  const whiteboard: Iwhiteboard | null = await Whiteboard.findById(whiteboardId);
  if (!whiteboard) {
    return null;
  }
  return whiteboard.cards;
}
