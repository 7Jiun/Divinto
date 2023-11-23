import { Request, Response } from 'express';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import * as userModel from '../model/userModel.ts';
import { JwtUserPayload } from '../utils/signJWT.ts';

export async function createWhiteboard(req: Request, res: Response) {
  const user: JwtUserPayload = res.locals.userPayload;
  const userId = user.id.toString();
  const { title } = req.body;
  try {
    const insert = await whiteboardModel.createWhiteboard(user, title);
    const whiteboardId = insert._id.toString();
    const addWhiteboardInUser = await userModel.addWhiteboardInUser(userId, whiteboardId);
    if (!addWhiteboardInUser) return res.status(500).json({ data: 'user whiteboard wrong' });
    res.status(200).json({ whiteboard: insert });
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

export async function updateWhiteboardTitle(req: Request, res: Response) {
  const { whiteboardId } = req.params;
  const { title } = req.body;
  try {
    const updateWhiteboard = await whiteboardModel.updateWhiteboardTitle(whiteboardId, title);
    // const addWhiteboardInUser;
    if (!updateWhiteboard) return res.status(400).json({ data: 'no this ID 喔' });
    res.status(200).json({ data: 'update title successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`whiteboard update error: ${error.message}`);
      res.status(500).json({ data: 'server error' });
    }
  }
}

export async function deleteWhiteboard(req: Request, res: Response) {
  const userId = res.locals.userPayload.id.toString();
  const { whiteboardId } = req.params;
  try {
    const updateWhiteboard = await whiteboardModel.deleteWhiteboard(whiteboardId);
    if (!updateWhiteboard) return res.status(400).json({ data: 'no this ID 喔' });
    const deleteWhiteboardInUser = await userModel.deleteWhiteboardInUser(userId, whiteboardId);
    if (!deleteWhiteboardInUser) return res.status(500).json({ data: 'user db update failed' });
    res.status(200).json({ data: 'delete whiteboard successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`whiteboard update error: ${error.message}`);
      res.status(500).json({ data: 'server error' });
    }
  }
}

export async function getCardsByTag(req: Request, res: Response) {
  let tag: string | null = null;
  if (typeof req.query.tag === 'string') {
    tag = req.query.tag;
  }
  const { whiteboardId } = req.params;
  try {
    const taggedCards = await whiteboardModel.getCardsByTag(tag, whiteboardId);
    res.status(200).json({ data: taggedCards });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
  }
}
