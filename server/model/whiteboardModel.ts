import mongoose, { ClientSession } from 'mongoose';
import { Card, Whiteboard } from './schema.ts';
import { createId } from './cardModel.ts';
import { JwtUserPayload, GetWhiteboard, Iwhiteboard } from '../utils/shape.ts';

export async function createWhiteboard(
  user: JwtUserPayload,
  title: string,
  session: ClientSession,
) {
  const whiteboardId: string = createId(user);
  const [insertId] = await Whiteboard.create(
    [
      {
        id: whiteboardId,
        title: title,
      },
    ],
    { session: session },
  );
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
    {
      $project: {
        title: '$title',
        cards: {
          $filter: {
            input: '$cards',
            as: 'card',
            cond: { $eq: ['$$card.removeAt', null] },
          },
        },
        createdAt: '$createdAt',
        updateAt: '$updateAt',
        removeAt: '$removeAt',
      },
    },
  ]);
  return whiteboard as unknown as GetWhiteboard[];
}

export async function addWhiteboardCards(
  cardId: string,
  whiteboardId: string,
  session: ClientSession,
) {
  await Whiteboard.findByIdAndUpdate(
    whiteboardId,
    {
      $push: { cards: cardId },
      $set: { updateAt: Date.now() },
    },
    { new: true, session: session },
  );
}

export async function updateWhiteboardTitle(whiteboardId: string, title: string): Promise<Boolean> {
  const updateWhiteboard = await Whiteboard.findByIdAndUpdate(
    whiteboardId,
    {
      $set: {
        title: title,
        updateAt: Date.now(),
      },
    },
    { new: true },
  );
  if (updateWhiteboard) {
    return true;
  } else {
    return false;
  }
}

export async function deleteWhiteboard(whiteboardId: string): Promise<Boolean> {
  const removeWhiteboard = await Whiteboard.findByIdAndUpdate(
    whiteboardId,
    {
      $set: {
        removeAt: Date.now(),
      },
    },
    { new: true },
  );
  if (removeWhiteboard) {
    return true;
  } else {
    return false;
  }
}

export async function getCardsByTag(tag: string | null, whiteboardId: string) {
  const cardsWithTag = await Whiteboard.aggregate([
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
    {
      $addFields: {
        cards: {
          $filter: {
            input: '$cards',
            as: 'card',
            cond: { $eq: ['$$card.removeAt', null] },
          },
        },
      },
    },
    { $unwind: '$cards' },
    { $match: { 'cards.tags': tag } },
  ]);
  return cardsWithTag;
}

export async function getCardsByTextSearch(keyword: string | null, whiteboardId: string) {
  if (!keyword) return null;
  const targetWhiteboard = await getWhiteboard(whiteboardId);
  if (!targetWhiteboard) return null;
  const cardIds = targetWhiteboard[0].cards.map((cards) => cards._id);
  const cardsWithTextSearch = await Card.aggregate([
    {
      $search: {
        text: {
          query: keyword,
          path: 'content.main.content',
        },
      },
    },
    {
      $match: {
        _id: { $in: cardIds },
      },
    },
  ]);
  return cardsWithTextSearch;
}

export async function getCardsByWhiteboard(whiteboardId: string): Promise<Array<string> | null> {
  const whiteboard: Iwhiteboard | null = await Whiteboard.findById(whiteboardId);
  if (!whiteboard) {
    return null;
  }
  return whiteboard.cards;
}
