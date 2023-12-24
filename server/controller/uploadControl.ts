import { Request, Response } from 'express';
import { BlockContent, BlockTypeEnum } from '../utils/shape.ts';
import { addImageContent } from '../model/cardModel.ts';
export async function uploadImage(req: Request, res: Response) {
  const { whiteboardId, cardId } = req.params;
  try {
    if (req.file) {
      const filePath = `${whiteboardId}/${cardId}/${req.file.originalname}`;
      const addUploadImageInfo: BlockContent = {
        type: BlockTypeEnum.Image,
        content: `![${req.file.originalname}](${process.env.DOMAIN}/${filePath})`,
      };
      await addImageContent(cardId, addUploadImageInfo);
      res.status(200).json({ data: addUploadImageInfo.content });
    } else {
      res.status(500).json({ data: 'internal server error' });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
    }
    res.status(500).json({ data: 'internal server error' });
  }
}
