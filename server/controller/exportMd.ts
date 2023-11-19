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

export async function transferCardMarkdownById(cardId: string): Promise<CardMarkdown> {
  const card = await getCardById(cardId);
  const mainContent = card.content.main;
  let markdown = '';
  mainContent.forEach((block) => {
    if (block.type === 'text') {
      markdown += block.content;
      markdown += '\n\n';
    } else if (block.type === 'image') {
      const imageContent = block.content;
      const username = imageContent.split('/')[1];
      imageContent.replace(`/${username}`, '.');
      markdown += imageContent;
      markdown += '\n\n';
    }
  });

  return {
    card: card,
    markdown: markdown,
  };
}

export async function markdownCardToFile(userId: string, card: GetCard, markdown: string) {
  const cardId = card._id;
  const cardTitle = card.title;
  const writeUrl = `${process.env.URL}/${userId}/${cardId}/${cardTitle}.md`;
  try {
    fs.writeFile(writeUrl, markdown, { flag: 'a+' }, (err) => {
      if (err instanceof Error) {
        throw err;
      }
    });
    return writeUrl;
  } catch (err) {
    console.error(err);
  }
}

function addFilesFromDirectory(zipFolder: JSZip, dirPath: string) {
  const files = fs.readdirSync(dirPath);

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
  const assetFolder = `${fileDirArray[0]}/${fileDirArray[1]}/${fileDirArray[2]}/${fileDirArray[3]}`;
  const filename = fileDirArray[4].split('.')[0];

  const assetZip = zip.folder(assetFolder);
  if (assetZip) {
    addFilesFromDirectory(assetZip, assetFolder);
  }
  const zipDir = `${assetFolder}/${filename}.zip`;
  zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
    fs.writeFileSync(`./${zipDir}`, content);
  });

  return zipDir;
}

await jsZipMarkdown('./uploads/23iodj2/6557128f9009c80cebeb07b3/test.md');

export async function exportCardAsMarkdown(req: Request, res: Response) {
  const { userId } = req.body;
  const { cardId } = req.params;
  const cardMarkdown = await transferCardMarkdownById(cardId);
  const filePath = await markdownCardToFile(userId, cardMarkdown.card, cardMarkdown.markdown);
  if (filePath) {
    const zipPath = await jsZipMarkdown(filePath);
    const zipDirArray = zipPath.split('/');
    const zipDir = `${zipDirArray[0]}/${zipDirArray[1]}/${zipDirArray[2]}/${zipDirArray[3]}`;
    const zipFilename = zipDirArray[4];
    console.log(zipPath, zipDir, zipFilename);
    res.download(zipPath, zipFilename, (err) => {
      if (err instanceof Error) {
        console.error(`error: ${err.message}`);
        res.status(500).json({ data: 'download failed' });
      }
    });
  } else {
    res.status(500).json({ data: 'internal server error' });
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
