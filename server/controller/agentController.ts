import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { Message, AiCardInput, GetCard } from '../utils/shape.ts';
import { getWhiteboard } from '../model/whiteboardModel.ts';
import { transferCardMarkdown } from './exportMd.ts';
import * as agentModel from '../model/agentModel.ts';
import * as openAiUtils from '../utils/openAI.ts';
import * as cardModel from '../model/cardModel.ts';
import * as whiteboardModel from '../model/whiteboardModel.ts';
import mongoose from 'mongoose';

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

async function processCards(cards: GetCard[]) {
  const cardPromises = cards.map((card) => {
    const cardMarkdown = transferCardMarkdown(card);
    return `${card.tags}: ${cardMarkdown}/n/n`;
  });

  const cardsMarkdown = await Promise.all(cardPromises);
  return cardsMarkdown.join('');
}

export async function createAgent(req: Request, res: Response) {
  const { userPayload } = res.locals;
  const userId = userPayload.id.toString();
  const { whiteboardId } = req.params;
  const { agentName } = req.body;
  try {
    const whiteboard = await getWhiteboard(whiteboardId);
    if (!whiteboard || whiteboard.cards.length === 0) {
      return res.status(400).json({ data: 'wrong whiteboard id or no cards in the whiteboard' });
    }

    const whiteboardCardsWithTags = await processCards(whiteboard.cards);
    const agentKnowledgeFile = await markdownWhiteboardToFile(
      userId,
      whiteboardId,
      whiteboardCardsWithTags,
    );

    if (!agentKnowledgeFile) {
      return res.status(500).json({ data: 'export whiteboard failed' });
    }

    const file = await openAiUtils.uploadFileToOpenAi(agentKnowledgeFile);
    const assistant = await openAiUtils.createAgentByOpenAi(file);
    const newAgentId = await agentModel.createAgentInDb(
      userPayload,
      agentName,
      assistant.id,
      whiteboardId,
      agentKnowledgeFile,
      file.id,
    );

    res.status(200).json({ data: newAgentId });
  } catch (error) {
    console.error(`Error: ${error}`);
    res.status(500).json({ data: 'An error occurred' });
  }
}

export async function deleteAgent(req: Request, res: Response) {
  const { agentId } = req.params;
  try {
    const isDeleted = await agentModel.deleteAgent(agentId);
    return isDeleted
      ? res.status(200).json({ data: 'delete successfully' })
      : res.status(500).json({ data: 'wrong Id, please retry' });
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
  try {
    const threads = await agentModel.getThreadsByAgent(agentId);
    if (!threads) return res.status(400).json({ data: 'get agent threads wrong' });
    res.status(200).json({ data: threads });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      res.status(500).json({ data: 'internal server error' });
    }
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
  const { userPayload } = res.locals;
  const { threadId } = req.params;
  const addAiCardSession = await mongoose.startSession();
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
    const aiCardInput: AiCardInput = {
      title: thread.title,
      whiteboardId: thread.whiteboardId,
      approvement: totalApprovement,
      disapprovement: totalDisapprovement,
    };
    addAiCardSession.startTransaction();
    const aiCard = await cardModel.createAiCard(userPayload, aiCardInput, addAiCardSession);
    await whiteboardModel.addWhiteboardCards(aiCard._id, thread.whiteboardId, addAiCardSession);
    await addAiCardSession.commitTransaction();
    if (aiCard) {
      res.status(200).json({ data: aiCard, whiteboardId: thread.whiteboardId });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`create AI card error: ${error.message}`);
    }
    await addAiCardSession.abortTransaction();
    res.status(500).json({ data: 'create card unsuccessfully' });
  } finally {
    addAiCardSession.endSession();
  }
}
