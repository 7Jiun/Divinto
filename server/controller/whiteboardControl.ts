import { Request, Response } from 'express';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import { UserPayload } from './cardControl.ts';

export async function createWhiteboard(req: Request, res: Response) {
  const user: UserPayload = {
    id: '22',
    name: 'Jiun',
  };
  const { title } = req.body;
  try {
    const insert = await whiteboardModel.createWhiteboard(user, title);
    res.status(200).json({ whiteboardId: insert });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error:${error.message}`);
    }
  }
}

export async function getWhiteboard(req: Request, res: Response) {
  const { whiteboardId } = req.params;
  try {
    const whiteboard = await whiteboardModel.getWhiteboard(whiteboardId);
    res.status(200).json({ data: whiteboard });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    res.status(500).json({ data: 'internal server error' });
  }
}
