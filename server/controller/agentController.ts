import fs from 'fs';
import path from 'path';
import OpenAi from 'openai';
import { Request, Response } from 'express';
import { getWhiteboard } from '../model/whiteboardModel.ts';
import { transferCardMarkdownById } from './exportMd.ts';
import * as agentModel from '../model/agentModel.ts';

const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

async function markdownWhiteboardToFile(
  userId: string,
  whiteboardId: string,
  markdown: string,
): Promise<string | undefined> {
  const writeUrl = `${
    process.env.URL
  }/${userId}/agentData/${whiteboardId}-${Date.now().toString()}.md`;
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

export async function createAgent(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const userId = userPayload.id.toString();
  const { whiteboardId } = req.params;
  const whiteboard = await getWhiteboard(whiteboardId);
  const whiteboardUrl = `${process.env.URL}/${userId}/${whiteboardId}`;
  if (whiteboard[0] && whiteboard[0].cards) {
    let whiteboardCardsWithTags = '';
    const promises = whiteboard[0].cards.map(async (card) => {
      const cardMarkdown = await transferCardMarkdownById(card._id);
      const tagsMarkdownPair = `${card.tags}: ${cardMarkdown}`;
      whiteboardCardsWithTags = whiteboardCardsWithTags + tagsMarkdownPair + '/n/n';
      // 建立 agent with file (用function 把 原本的寫好，只要改file id 就好)
    });

    try {
      await Promise.all(promises)
        .then(async () => {
          const agentKnowledgeFile = await markdownWhiteboardToFile(
            userId,
            whiteboardUrl,
            whiteboardCardsWithTags,
          );
          return agentKnowledgeFile;
        })
        .then(async (agentKnowledgeFile) => {
          if (!agentKnowledgeFile) return res.status(500).json({ data: 'export failed' });
          const agentKnowledgePath = path.basename(agentKnowledgeFile);
          const file = await openai.files.create({
            file: fs.createReadStream(`${agentKnowledgePath}`),
            purpose: 'assistants',
          });
          // 把file.id 存起來
          const assistant = await openai.beta.assistants.create({
            instructions:
              'You are a open-minded person who adjust talking style to fit your client for helping them to a deeper self-awareness. you also probably know some information via upload files',
            model: 'gpt-4-1106-preview',
            tools: [
              { type: 'retrieval' },
              {
                type: 'function',
                function: {
                  name: 'getCurrentWeather',
                  description: 'Get the weather in location',
                  parameters: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'string',
                        description: 'The city and state e.g. San Francisco, CA',
                      },
                      unit: { type: 'string', enum: ['c', 'f'] },
                    },
                    required: ['location'],
                  },
                },
              },
            ],
            file_ids: [file.id],
          });
          await agentModel.createAgentInDb(userPayload, assistant.id, agentKnowledgeFile);
          res.status(200).json({ data: 'create assistant successfully' });
        })
        //  把 assistant 存起來
        .catch((error) => console.error(`create agent error:, ${error}`));
    } catch (error) {
      console.error(`card promise error:, ${error}`);
    }
  } else {
    res.status(500).json({ data: 'get whiteboard error' });
  }
}

export async function deleteAgent(req: Request, res: Response) {
  const { agentId } = req.params;
  try {
    const isDeleted = await agentModel.deleteAgent(agentId);
    if (isDeleted) return res.status(200).json({ data: 'delete successfully' });
    if (!isDeleted) return res.status(500).json({ data: 'wrong Id, please retry' });
  } catch (error) {
    if (error instanceof Error) console.error(`delete agent error: ${error.message}`);
    res.status(500).json({ data: 'delete failed, please retry later' });
  }
}

export async function createThread(req: Request, res: Response) {
  const { agentId } = req.params;
  const { threadTitle } = req.body;
  try {
    const thread = await agentModel.createThread(agentId, threadTitle);
    if (!thread)
      return res.status(400).json({ data: 'create thread wrong, please check agent exist' });
    res.status(200).json(thread);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`create thread error: ${error.message}`);
      res.status(500).json({ data: 'create thread error' });
    }
  }
}

export async function getThread(req: Request, res: Response) {
  const { threadId } = req.params;
  try {
    const thread = await agentModel.getThread(threadId);
    if (!thread) return res.status(500).json({ data: 'wrong Id, please retry' });
    res.status(200).json(thread);
  } catch (error) {
    if (error instanceof Error) console.error(`delete agent error: ${error.message}`);
    res.status(500).json({ data: 'get thread failed, please retry later' });
  }
}

export async function updateThreadTitle(req: Request, res: Response) {
  const { threadId } = req.params;
  const { threadTitle } = req.body;
  try {
    const updateThread = await agentModel.updateThreadTitle(threadId, threadTitle);
    if (!updateThread)
      return res.status(500).json({ data: 'update title  failed, please retry later' });
    res.status(200).json(updateThread);
  } catch (error) {
    if (error instanceof Error) console.error(`delete agent error: ${error.message}`);
    res.status(500).json({ data: 'update title failed, something error' });
  }
}

export async function deleteThread(req: Request, res: Response) {
  const { threadId } = req.params;
  try {
    const isDeleted = await agentModel.deleteThread(threadId);
    if (isDeleted) return res.status(200).json({ data: 'delete successfully' });
    if (!isDeleted) return res.status(400).json({ data: 'wrong Id, please retry' });
  } catch (error) {
    if (error instanceof Error) console.error(`delete thread error: ${error.message}`);
    res.status(500).json({ data: 'thread delete failed, please retry later' });
  }
}

export async function updateThreadMessage(req: Request, res: Response) {
  const { threadId } = req.params;
  const { message } = req.body;
  try {
    const updateThread = await agentModel.updateThreadMessage(threadId, message);
    if (!updateThread)
      return res.status(500).json({ data: 'update title  failed, please retry later' });
    // call chat gpt api
    // save api response
    // post to user
    res.status(200).json(updateThread);
  } catch (error) {
    if (error instanceof Error) console.error(`delete agent error: ${error.message}`);
    res.status(500).json({ data: 'update title failed, something error' });
  }
}
