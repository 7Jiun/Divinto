import { Card } from './schema.ts';
import {
  CardInput,
  GetCard,
  UpdateCard,
  JwtUserPayload,
  BlockTypeEnum,
  BlockContent,
  AiCardInput,
} from '../utils/shape.ts';
import { ClientSession } from 'mongoose';

export function createId(user: JwtUserPayload): string {
  const userId = user.id.toString();
  const date: string = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString();
  const uniqueId = `${userId}-${date}-${random}`;
  return uniqueId;
}

export function classifyContent(content: string): BlockContent[] {
  const lines = content.split('\n');
  const blockContents: BlockContent[] = [];
  const imageRegex = /!\[.*?\]\(.*?\)/; // 要根據前端找到的編輯器格式做調整
  const videoRegex = /\<iframe.*?src=".*?".*?<\/iframe>/; // 要根據前端找到的編輯器格式做調整
  const audioRegex = /<audio.*?>.*?<\/audio>/; // 要根據前端找到的編輯器格式做調整
  let blockNumber = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(imageRegex)) {
      const imageBlock: BlockContent = {
        type: BlockTypeEnum.Image,
        content: lines[i],
      };
      blockContents.push(imageBlock);
      blockNumber += 2;
    } else if (lines[i].match(videoRegex)) {
      const videoBlock: BlockContent = {
        type: BlockTypeEnum.Video,
        content: lines[i],
      };
      blockContents.push(videoBlock);
      blockNumber += 2;
    } else if (lines[i].match(audioRegex)) {
      const audioBlock: BlockContent = {
        type: BlockTypeEnum.Audio,
        content: lines[i],
      };
      blockContents.push(audioBlock);
      blockNumber += 2;
    } else {
      if (!blockContents[blockNumber]) {
        const textBlock = {
          type: BlockTypeEnum.Text,
          content: lines[i],
        };
        blockContents[blockNumber] = textBlock;
      } else {
        blockContents[blockNumber].content = `${blockContents[blockNumber].content}\n${lines[i]}`;
      }
    }
  }
  return blockContents;
}

export async function getCardById(cardId: string): Promise<GetCard> {
  const card = await Card.findById(cardId);
  return card as unknown as GetCard;
}

export async function createCard(
  user: JwtUserPayload,
  card: CardInput,
  whiteboardId: string,
  session: ClientSession,
) {
  const cardId = createId(user);
  const blockContents = classifyContent(card.content);
  const [insertCard] = await Card.create(
    [
      {
        id: cardId,
        whiteboardId: whiteboardId,
        title: card.title,
        position: card.position,
        content: {
          main: blockContents,
        },
        tags: card.tags,
      },
    ],
    { session: session },
  );
  return insertCard as unknown as GetCard;
}

export async function createAiCard(
  user: JwtUserPayload,
  card: AiCardInput,
  session: ClientSession,
) {
  const cardId = createId(user);
  const approvement = card.approvement;
  const disapprovement = card.disapprovement;
  const [insertCard] = await Card.create(
    [
      {
        id: cardId,
        title: card.title,
        position: {
          x: 100,
          y: 100,
        },
        content: {
          approvement: approvement,
          disapprovement: disapprovement,
        },
      },
    ],
    { session: session },
  );
  return insertCard as unknown as GetCard;
}

export async function updateCard(card: UpdateCard) {
  const blockContents: BlockContent[] = classifyContent(card.content);
  const updatedCard: GetCard = {
    _id: card._id,
    id: card.id,
    title: card.title,
    position: card.position,
    content: {
      main: blockContents,
      summary: null,
      approvement: null,
      disapprovement: null,
    },
    tags: card.tags,
    createdAt: card.createdAt,
    updateAt: Date.now().toString(),
    removeAt: card.removeAt,
    whiteboardId: card.whiteboardId,
  };

  await Card.findByIdAndUpdate(card._id, updatedCard);
}

export async function deleteCard(cardId: string) {
  const removed = await Card.findByIdAndUpdate(cardId, { removeAt: Date.now() });
  return removed;
}

export async function addImageContent(cardId: string, image: BlockContent) {
  await Card.findByIdAndUpdate(cardId, {
    $push: {
      'content.main': image,
    },
  });
}

export async function getCards(cardIds: string[]): Promise<GetCard[]> {
  const cards = await Card.find({ _id: { $in: cardIds } });
  return cards as unknown as GetCard[];
}
