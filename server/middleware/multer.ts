/* eslint-disable @typescript-eslint/no-shadow */
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Request, Response, NextFunction } from 'express';
import { JwtUserPayload } from '../utils/signJWT.ts';

export const uploadToBuffer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_REGION, BUCKET_NAME } = process.env;
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET_REGION || !BUCKET_NAME) {
  throw new Error('Missing required environment variables for S3 configuration');
}

const s3 = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
export const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    key: function (
      req: Request,
      file: { originalname: any },
      cb: (arg0: null, arg1: string) => void,
    ) {
      const { cardId, whiteboardId } = req.params;
      const key = `${whiteboardId}/${cardId}/${file.originalname}`;
      cb(null, key);
    },
    contentType: function (req, file, cb) {
      const mimetype = file.mimetype;
      cb(null, mimetype);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  // eslint-disable-next-line @typescript-eslint/no-shadow
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      cb(new Error('Invalid image type'));
    } else {
      cb(null, true);
    }
  },
});

export async function uploadTypeCheck(req: Request, res: Response, next: NextFunction) {
  const file = req.file;

  if (file && (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')) {
    next();
  } else {
    res.status(400).json({ data: 'invalid file type' });
  }
}

export async function uploadToDisk(req: Request, res: Response, next: NextFunction) {
  const user: JwtUserPayload = res.locals.userPayload;
  const { cardId, whiteboardId } = req.params;
  const file = req.file;
  const dir = process.env.URL;
  if (typeof dir === 'string' && file) {
    const targetPath = path.join(dir, user.id.toString(), whiteboardId, cardId, '/assets');

    fs.mkdirSync(targetPath, { recursive: true });

    const filePath = path.join(targetPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    file.path = filePath;
    next();
  } else {
    res.status(500).json({ data: 'upload failed, please retry in few seconds' });
  }
}
