import { Card } from './schema.ts';
import { CardInput } from '../controller/cardControl.ts';
import { GetCard, UpdateCard } from '../routes/card.ts';
import { JwtUserPayload } from '../utils/signJWT.ts';

// 定義 enum
export enum BlockTypeEnum {
  Text = 'text',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
}

export interface BlockContent {
  type: BlockTypeEnum;
  content: String;
}

export interface CardContent {
  main: BlockContent[];
  summary: BlockContent[] | null;
  approvement: BlockContent[] | null;
  disapprovement: BlockContent[] | null;
}

export function createId(user: JwtUserPayload): string {
  const userId = user.id.toString();
  const date: string = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString();
  const uniqueId = `${userId}-${date}-${random}`;
  return uniqueId;
}

function classifyContent(content: string): BlockContent[] {
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

export async function createCard(user: JwtUserPayload, card: CardInput) {
  const cardId = createId(user);
  const blockContents = classifyContent(card.content);
  const insertCard = await Card.create({
    id: cardId,
    title: card.title,
    position: card.position,
    content: {
      main: blockContents,
    },
    tags: card.tags,
  });
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
  };

  await Card.findByIdAndUpdate(card._id, updatedCard);
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
