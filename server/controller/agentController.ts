import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { getWhiteboard } from '../model/whiteboardModel.ts';
import { transferCardMarkdownById } from './exportMd.ts';
import * as agentModel from '../model/agentModel.ts';
import * as openAiUtils from '../utils/openAI.ts';
import * as cardModel from '../model/cardModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';

import { Message } from '../model/agentModel.ts';

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

async function waitForRunCompletion() {
  return new Promise((resolve) => setTimeout(resolve, 5000));
}

export async function createAgent(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const userId = userPayload.id.toString();
  const { whiteboardId } = req.params;
  const agentName = req.body.agentName;
  const whiteboard = await getWhiteboard(whiteboardId);
  if (whiteboard[0] && whiteboard[0].cards) {
    let whiteboardCardsWithTags = '';
    const promises = whiteboard[0].cards.map(async (card) => {
      const cardMarkdown = await transferCardMarkdownById(card._id);
      const tagsMarkdownPair = `${card.tags}: ${cardMarkdown.markdown}`;
      whiteboardCardsWithTags = whiteboardCardsWithTags + tagsMarkdownPair + '/n/n';
    });
    try {
      await Promise.all(promises)
        .then(async () => {
          const agentKnowledgeFile = await markdownWhiteboardToFile(
            userId,
            whiteboardId,
            whiteboardCardsWithTags,
          );
          return agentKnowledgeFile;
        })
        .then(async (agentKnowledgeFile) => {
          if (!agentKnowledgeFile) return res.status(500).json({ data: 'export failed' });

          const file = await openAiUtils.openai.files.create({
            file: fs.createReadStream(`${agentKnowledgeFile}`),
            purpose: 'assistants',
          });
          const assistant = await openAiUtils.openai.beta.assistants.create({
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
          const newAgentId = await agentModel.createAgentInDb(
            userPayload,
            agentName,
            assistant.id,
            whiteboardId,
            agentKnowledgeFile,
            file.id,
          );

          res.status(200).json({ data: newAgentId });
        })
        .catch((error) => {
          console.error(`create agent error:, ${error}`);
          res.status(500).json({ data: 'create agent error' });
        });
    } catch (error) {
      console.error(`card promise error:, ${error}`);
      res.status(500).json({ data: 'create agent error' });
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
    const openAiThread = await openAiUtils.openai.beta.threads.create();
    if (!openAiThread)
      return res.status(500).json({ data: 'openAI api failed, please retry later' });
    const thread = await agentModel.createThread(agentId, threadTitle, openAiThread.id);
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

export async function getThreadsByAgent(req: Request, res: Response) {
  const { agentId } = req.params;
  const threads = await agentModel.getThreadsByAgent(agentId);
  if (!threads) return res.status(400).json({ data: 'get agent threads wrong' });
  res.status(200).json({ data: threads });
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

export async function updateThreadMessage(req: Request, res: Response) {
  const { agentId } = req.params;
  const { threadId } = req.params;
  const { message } = req.body;
  try {
    const updateThread = await agentModel.updateThreadMessage(threadId, message);
    if (!updateThread)
      return res.status(500).json({ data: 'update title  failed, please retry later' });
    const openAiAgentId = await agentModel.getAgentId(agentId);
    await openAiUtils.postOpenAiMessage(updateThread.openAiThreadId, message.text);
    const runId = await openAiUtils.runOpenAiThread(updateThread.openAiThreadId, openAiAgentId);

    let isRunCompleted = await openAiUtils.isRunCompleted(updateThread.openAiThreadId, runId);
    while (!isRunCompleted) {
      await waitForRunCompletion();
      console.log('eeeeeeeeeeeee');
      isRunCompleted = await openAiUtils.isRunCompleted(updateThread.openAiThreadId, runId);
    }
    let messagesFromOpenAi = await openAiUtils.getOpenAiMessage(updateThread.openAiThreadId);
    if (typeof messagesFromOpenAi !== 'string' && messagesFromOpenAi[0].type === 'text') {
      const messagesFromOpenAitoDb: Message = {
        speaker: 'agent',
        text: messagesFromOpenAi[0].text.value,
      };
      await agentModel.updateThreadMessage(threadId, messagesFromOpenAitoDb);

      res.status(200).json(messagesFromOpenAi);
    }
  } catch (error) {
    if (error instanceof Error) console.error(`update agent error: ${error.message}`);
    res.status(500).json({ data: 'update title failed, something error' });
  }
}

export async function updateThreadApprovement(req: Request, res: Response) {
  const { threadId } = req.params;
  const { approvementContent } = req.body;
  try {
    const updateThread = await agentModel.updateThreadApprovement(threadId, approvementContent);
    if (!updateThread)
      return res.status(500).json({ data: 'update title  failed, please retry later' });
    res.status(200).json(updateThread);
  } catch (error) {
    if (error instanceof Error) console.error(`delete agent error: ${error.message}`);
    res.status(500).json({ data: 'update title failed, something error' });
  }
}

export async function updateThreadDisapprovement(req: Request, res: Response) {
  const { threadId } = req.params;
  const { disapprovementContent } = req.body;
  try {
    const updateThread = await agentModel.updateThreadDisapprovement(
      threadId,
      disapprovementContent,
    );
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

export async function exportAiCard(req: Request, res: Response) {
  const userPayload = res.locals.userPayload;
  const { threadId } = req.params;
  try {
    const thread = await agentModel.getThread(threadId);
    if (!thread) return res.status(400).json({ data: 'wrong thread input' });
    let totalApprovement = '';
    let totalDisapprovement = '';
    thread.approvements.forEach((approvement) => {
      totalApprovement += approvement;
      totalApprovement += '\n';
    });
    thread.disapprovements.forEach((disapprovement) => {
      totalDisapprovement += disapprovement;
      totalDisapprovement += '\n';
    });
    const aiCardInput: cardModel.AiCardInput = {
      title: thread.title,
      whiteboardId: thread.whiteboardId,
      approvement: totalApprovement,
      disapprovement: totalDisapprovement,
    };
    const aiCard = await cardModel.createAiCard(userPayload, aiCardInput);
    await whiteboardModel.addWhiteboardCards(aiCard._id, thread.whiteboardId);

    if (aiCard) {
      res.status(200).json({ data: aiCard, whiteboardId: thread.whiteboardId });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`create AI card error: ${error.message}`);
      res.status(500).json({ data: 'create card unsuccessfully' });
    }
  }
}
