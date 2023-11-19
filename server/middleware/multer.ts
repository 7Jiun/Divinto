import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../controller/cardControl.ts';
// import { fileTypeFromBuffer } from 'file-type';

export const uploadToBuffer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export async function uploadTypeCheck(req: Request, res: Response, next: NextFunction) {
  const file = req.file;

  if (file && (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')) {
    // const fileType = await fileTypeFromBuffer(file.buffer);
    // if (fileType !== file.mimetype.split('/')[1]) {
    //   res.status(400).json({ data: 'fake image type' });
    // } else {
    next();
    // }
  } else {
    res.status(400).json({ data: 'invalid file type' });
  }
}

export async function uploadToDisk(req: Request, res: Response, next: NextFunction) {
  const user: UserPayload = {
    name: 'jiun',
    id: '23iodj2',
  };
  const { cardId, whiteboardId } = req.params;
  const file = req.file;
  const dir = process.env.URL;
  if (typeof dir === 'string' && file) {
    const targetPath = path.join(dir, user.id, whiteboardId, cardId, '/assets');

    fs.mkdirSync(targetPath, { recursive: true });

    const filePath = path.join(targetPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    file.path = filePath;
    next();
  } else {
    res.status(500).json({ data: 'upload failed, please retry in few seconds' });
  }
}
