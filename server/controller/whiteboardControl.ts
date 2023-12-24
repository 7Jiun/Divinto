import { Request, Response } from 'express';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import * as userModel from '../model/userModel.ts';
import { JwtUserPayload } from '../utils/shape.ts';
import mongoose from 'mongoose';

export async function createWhiteboard(req: Request, res: Response) {
  const user: JwtUserPayload = res.locals.userPayload;
  const userId = user.id.toString();
  const { title } = req.body;
  const createWhiteboardSession = await mongoose.startSession();
  try {
    createWhiteboardSession.startTransaction();
    const newWhiteboard = await whiteboardModel.createWhiteboard(
      user,
      title,
      createWhiteboardSession,
    );
    const whiteboardId = newWhiteboard._id.toString();
    await userModel.addWhiteboardInUser(userId, whiteboardId, createWhiteboardSession);
    await createWhiteboardSession.commitTransaction();
    res.status(200).json({ whiteboard: newWhiteboard });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error:${error.message}`);
    }
    await createWhiteboardSession.abortTransaction();
  } finally {
    await createWhiteboardSession.endSession();
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
    if (!updateWhiteboard) return res.status(400).json({ data: 'wrong Id, please retry' });
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
  const deleteWhiteboardSession = await mongoose.startSession();
  try {
    deleteWhiteboardSession.startTransaction();
    const isDeleteWhiteboard = await whiteboardModel.deleteWhiteboard(
      whiteboardId,
      deleteWhiteboardSession,
    );
    if (!isDeleteWhiteboard) {
      await deleteWhiteboardSession.abortTransaction();
      return res.status(400).json({ data: 'wrong Id, please retry' });
    }
    const deleteWhiteboardInUser = await userModel.deleteWhiteboardInUser(
      userId,
      whiteboardId,
      deleteWhiteboardSession,
    );
    if (!deleteWhiteboardInUser) {
      await deleteWhiteboardSession.abortTransaction();
      return res.status(500).json({ data: 'user db update failed' });
    }
    await deleteWhiteboardSession.commitTransaction();
    res.status(200).json({ data: 'delete whiteboard successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`whiteboard update error: ${error.message}`);
      await deleteWhiteboardSession.abortTransaction();
      res.status(500).json({ data: 'server error' });
    }
  } finally {
    deleteWhiteboardSession.endSession();
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

export async function getCardsByTextSearch(req: Request, res: Response) {
  let keyword: string | null = null;
  if (typeof req.query.keyword === 'string') {
    keyword = req.query.keyword;
  }
  const { whiteboardId } = req.params;
  try {
    const matchedCard = await whiteboardModel.getCardsByTextSearch(keyword, whiteboardId);
    res.status(200).json({ data: matchedCard });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
      res.status(500).json({ data: 'error' });
    }
  }
}
