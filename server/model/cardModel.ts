import { Card } from './schema.ts';
import { CardInput, UserPayload } from '../controller/cardControl.ts';
import { GetCard, UpdateCard } from '../routes/card.ts';

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

export function createId(user: UserPayload): string {
  const userId = user.id;
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
      console.log('match image');
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
  console.log(card);
  return card as unknown as GetCard;
}

export async function createCard(user: UserPayload, card: CardInput) {
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
    content: blockContents,
    tags: card.tags,
    createdAt: card.createdAt,
    updateAt: Date.now().toString(),
    removeAt: card.removeAt,
  };

  await Card.findByIdAndUpdate(card._id, updatedCard);
}

export async function getCards(cardIds: string[]): Promise<GetCard[]> {
  const cards = await Card.find({ _id: { $in: cardIds } });
  return cards as unknown as GetCard[];
}
