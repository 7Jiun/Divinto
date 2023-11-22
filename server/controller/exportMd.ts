/*
    exportCardById
        get Card>content>main,
        用 fs 寫成 md 的檔案,
        get images by fetch or what,
        用 archive package 壓縮檔案,
        輸出到 S3
        提供下載
*/

interface CardMarkdown {
  card: GetCard;
  markdown: string;
}

import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { getCardById } from '../model/cardModel.ts';
import { Request, Response } from 'express';
import { GetCard } from '../routes/card.ts';
import { getWhiteboard } from '../model/whiteboardModel.ts';

async function transferCardMarkdownById(cardId: string): Promise<CardMarkdown> {
  const card = await getCardById(cardId);
  const mainContent = card.content.main;
  let markdown = '';
  mainContent.forEach((block) => {
    if (block.type === 'text') {
      markdown += block.content;
      markdown += '\n\n';
    } else if (block.type === 'image') {
      const imageContent = block.content;
      const folderDirs = imageContent.split('/');
      const username = folderDirs[1];
      const whiteboardId = folderDirs[2];
      const updatedImageContent = imageContent.replace(
        `/${username}/${whiteboardId}/${cardId}/assets/`,
        '/assets/',
      );
      markdown += updatedImageContent;
      markdown += '\n\n';
    }
  });

  return {
    card: card,
    markdown: markdown,
  };
}

async function markdownCardToFile(
  userId: string,
  whiteboardId: string,
  card: GetCard,
  markdown: string,
): Promise<string | undefined> {
  const cardId = card._id;
  const writeUrl = `${process.env.URL}/${userId}/${whiteboardId}/${cardId}/${cardId}.md`;
  const dir = path.dirname(writeUrl);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    return await new Promise((resolve, reject) => {
      fs.writeFile(writeUrl, markdown, { flag: 'a+' }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(writeUrl);
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function addFilesFromDirectory(zipFolder: JSZip, dirPath: string) {
  const files = fs.readdirSync(`${dirPath}`);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const fileData = fs.readFileSync(filePath);
      zipFolder.file(file, fileData);
    } else if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(file);
      if (subFolder) {
        addFilesFromDirectory(subFolder, filePath);
      }
    }
  });
}

async function jsZipMarkdown(markdownUrl: string): Promise<string> {
  const zip = new JSZip();
  const fileDirArray = markdownUrl.split('/');
  // uploads/${user}/${whiteboard}/${card}/assets
  const assetFolder = `${fileDirArray[0]}/${fileDirArray[1]}/${fileDirArray[2]}/${fileDirArray[3]}/${fileDirArray[4]}`;
  const filename = fileDirArray[5].split('.')[0];
  const lastFolderName = path.basename(assetFolder);
  const assetZip = zip.folder(lastFolderName);
  if (assetZip) {
    await addFilesFromDirectory(assetZip, assetFolder);
  }
  const zipDir = `${assetFolder}/${filename}.zip`;
  await zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(`./${zipDir}`, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(zipDir);
        }
      });
    });
  });

  return zipDir;
}

async function jsZipWhiteboard(whiteboardUrl: string): Promise<string> {
  const zip = new JSZip();
  // ./uploads/${user}/${whiteboard}
  const whiteboardDirArray = whiteboardUrl.split('/');
  const whiteboardFolder = whiteboardDirArray[3];
  const assetZip = zip.folder(whiteboardFolder);
  if (assetZip) {
    await addFilesFromDirectory(assetZip, whiteboardUrl);
  }
  const zipDir = `${whiteboardUrl}/${whiteboardFolder}.zip`;
  await zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
    return new Promise((resolve, reject) => {
      fs.writeFile(`./${zipDir}`, content, (err) => {
        if (err) {
          reject(console.error(`zip error: ${err}`));
        } else {
          resolve(zipDir);
        }
      });
    });
  });

  return zipDir;
}

export async function exportCardAsMarkdown(req: Request, res: Response) {
  const { userId } = req.body;
  const { cardId, whiteboardId } = req.params;

  // 其實要加個檢查比較合理：卡片有沒有真的在白板裡
  const cardMarkdown = await transferCardMarkdownById(cardId);
  const filePath = await markdownCardToFile(
    userId,
    whiteboardId,
    cardMarkdown.card,
    cardMarkdown.markdown,
  );

  if (filePath && fs.existsSync(filePath)) {
    const zipPath = await jsZipMarkdown(filePath);
    const zipDirArray = zipPath.split('/');
    const zipFilename = zipDirArray[5];
    res.download(zipPath, zipFilename, (err) => {
      if (err instanceof Error) {
        console.error(`error: ${err.message}`);
        res.status(500).json({ data: 'download failed' });
      }
    });
  } else {
    res.status(500).json({ data: 'files not ready, please retry' });
  }
}

export async function exportWhiteboardAsMarkdown(req: Request, res: Response) {
  const { userId } = req.body;
  const { whiteboardId } = req.params;
  const whiteboard = await getWhiteboard(whiteboardId);
  const whiteboardUrl = `${process.env.URL}/${userId}/${whiteboardId}`;
  if (whiteboard[0] && whiteboard[0].cards) {
    const promises = whiteboard[0].cards.map(async (card) => {
      const cardMarkdown = await transferCardMarkdownById(card._id);
      return markdownCardToFile(userId, whiteboardId, cardMarkdown.card, cardMarkdown.markdown);
    });
    try {
      await Promise.all(promises)
        .then(async () => {
          const zipDir = await jsZipWhiteboard(whiteboardUrl);
          return zipDir;
        })
        .then((zipDir) => {
          const whiteboardZipPath = path.basename(zipDir);
          res.download(zipDir, whiteboardZipPath, (err) => {
            if (err instanceof Error) {
              console.error(`error: ${err.message}`);
              res.status(500).json({ data: 'download failed' });
            }
          });
        })
        .catch((error) => console.error(`whiteboard export error:, ${error}`));
    } catch (error) {
      console.error(`card promise error:, ${error}`);
    }
  } else {
    res.status(500).json({ data: 'get whiteboard error' });
  }
}

/*
    exportWhiteboard
        get cards,
        get Card>content>main,
        用 fs 寫成 md 的檔案,
        get images by fetch or what,
        用 archive package 壓縮檔案,
        輸出到 S3
        res.download 下載
*/

/*
    exportWhiteboardToGPT
        get cards,
        get Card>content>main,
        用 fs 寫成 md 的檔案,
        get images by fetch or what,
        用 archive package 壓縮檔案,
        輸出到 S3,
        輸入成為知識庫
*/
