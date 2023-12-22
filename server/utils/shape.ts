import { Types } from 'mongoose';

export interface Position {
  x: number;
  y: number;
}

export interface CardInput {
  title: string;
  whiteboardId: string;
  position: Position;
  content: string;
  tags: Array<string>;
}

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

export interface GetCard {
  whiteboardId: string;
  _id: string;
  id: string;
  title: string;
  position: Position;
  content: CardContent;
  tags: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string | null;
}

export interface UpdateCard {
  _id: string;
  id: string;
  title: string;
  position: Position;
  content: string;
  tags: string[];
  createdAt: string;
  updateAt: string;
  removeAt: string | null;
}

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

export interface IThread {
  _id: any;
  openAiThreadId: any;
  title: string;
  messages: Message[];
  createdAt: Date;
  updateAt: Date;
  removeAt: Date | null;
}

export interface Message {
  speaker: 'user' | 'agent';
  text: string;
}

export interface AiCardInput {
  title: string;
  whiteboardId: string;
  approvement: string | null;
  disapprovement: string | null;
}

export interface IUser {
  whiteboards: string[] | undefined | null;
  agents: string[] | undefined | null;
  createdAt: string | undefined | null;
  updateAt: string | undefined | null;
  removeAt: string | undefined | null;
  provider?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
  password?: string | null | undefined;
}

export interface JwtUserPayload {
  id: Types.ObjectId;
  name: string;
}

export interface CheckedUser {
  userPayload: JwtUserPayload | null;
  isVerified: Boolean;
}
