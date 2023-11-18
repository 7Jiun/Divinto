import { Request, Response } from 'express';
import { BlockContent, BlockTypeEnum, addImageContent } from '../model/cardModel.ts';

export async function uploadImage(req: Request, res: Response) {
  const { cardId } = req.params;
  try {
    if (req.file) {
      const basePath = req.file.path.split('/')[0];
      const filePath = req.file.path.replace(basePath, '');
      const addUploadImageInfo: BlockContent = {
        type: BlockTypeEnum.Image,
        content: `![${req.file.filename}](${filePath})`,
      };
      await addImageContent(cardId, addUploadImageInfo);
      res.status(200).json({ data: 'upload successfully' });
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
