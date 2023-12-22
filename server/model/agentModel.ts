import mongoose from 'mongoose';
import { JwtUserPayload } from '../utils/shape.ts';
import { Agent, Thread, User } from './schema.ts';

export interface Message {
  speaker: 'user' | 'agent';
  text: string;
}

interface IThread {
  _id: any;
  openAiThreadId: any;
  title: string;
  messages: Message[];
  createdAt: Date;
  updateAt: Date;
  removeAt: Date | null;
}

export async function createAgentInDb(
  user: JwtUserPayload,
  agentName: string,
  agentIdFromOpenAi: string,
  whiteboardId: string,
  whiteboardResourceUrl: string,
  openAiFileId: string,
) {
  const agentId: string = agentIdFromOpenAi;
  const insertId = await Agent.create({
    id: agentId,
    name: agentName,
    whiteboardId: whiteboardId,
    whiteboardResource: whiteboardResourceUrl,
    openAifileId: openAiFileId,
  });
  await User.findByIdAndUpdate(
    user.id.toString(),
    {
      $push: { agents: insertId._id.toString() },
    },
    { new: true },
  );
  return insertId._id.toString();
}

export async function deleteAgent(agentId: string): Promise<Boolean> {
  const removeAgent = await Agent.findByIdAndUpdate(
    agentId,
    {
      $set: {
        removeAt: Date.now(),
      },
    },
    { new: true },
  );
  if (removeAgent) {
    return true;
  } else {
    return false;
  }
}

export async function getAgentId(agentId: string) {
  const agent = await Agent.findById(agentId);
  if (!agent || agent.removeAt) return null;
  return agent.id;
}

export async function createThread(agentId: string, threadTitle: string, openAiThreadId: string) {
  const thread = await Thread.create({
    title: threadTitle,
    openAiThreadId: openAiThreadId,
  });
  console.log(thread);
  if (!thread) return false;
  const threadId = thread._id.toString();
  const agent = await Agent.findByIdAndUpdate(
    agentId,
    {
      $push: { threads: threadId },
      $set: { updateAt: Date.now() },
    },
    { new: true },
  );
  if (!agent) return false;
  console.log(agent);
  const newThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $set: {
        whiteboardId: agent.whiteboardId,
        updatedAt: Date.now(),
      },
    },
    { new: true },
  );
  return newThread;
}

export async function getThread(threadId: string) {
  const thread = await Thread.findById(threadId);
  if (!thread || thread.removeAt) return null;
  return thread;
}

export async function getThreadsByAgent(agentId: string) {
  const threads = await Agent.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(agentId) } },
    {
      $addFields: {
        threads: {
          $map: {
            input: '$threads',
            as: 'threads',
            in: { $toObjectId: '$$threads' },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'threads',
        localField: 'threads',
        foreignField: '_id',
        as: 'threads',
      },
    },
    {
      $project: {
        threads: {
          $filter: {
            input: '$threads',
            as: 'threads',
            cond: { $eq: ['$$threads.removeAt', null] },
          },
        },
        createdAt: '$createdAt',
        updateAt: '$updateAt',
        removeAt: '$removeAt',
      },
    },
  ]);
  return threads;
}

export async function updateThreadTitle(threadId: string, newTitle: string): Promise<unknown> {
  const updateThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $set: {
        title: newTitle,
        updateAt: Date.now(),
      },
    },
    { new: true },
  );
  if (updateThread) {
    return updateThread;
  } else {
    return false;
  }
}

export async function updateThreadMessage(
  threadId: string,
  message: Message,
): Promise<IThread | null> {
  const updateThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $push: { messages: message },
    },
    { new: true },
  );
  if (!updateThread) return null;
  if (updateThread.messages.length === 0) return null;
  if (!updateThread.createdAt) return null;
  const updateInterfaceThread = {
    title: updateThread.title,
    messages: updateThread.messages,
    _id: updateThread._id.toString(),
    openAiThreadId: updateThread.openAiThreadId,
    createdAt: updateThread.createdAt,
    updateAt: updateThread.updateAt,
    removeAt: updateThread.removeAt,
  };
  return updateInterfaceThread;
}

export async function updateThreadApprovement(
  threadId: string,
  approvementContent: string,
): Promise<unknown> {
  const updateThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $push: {
        approvements: approvementContent,
      },
      $set: {
        updateAt: Date.now(),
      },
    },
    { new: true },
  );
  if (updateThread) {
    return updateThread;
  } else {
    return false;
  }
}

export async function updateThreadDisapprovement(
  threadId: string,
  disapprovementContent: string,
): Promise<unknown> {
  const updateThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $push: {
        disapprovements: disapprovementContent,
      },
      $set: {
        updateAt: Date.now(),
      },
    },
    { new: true },
  );
  if (updateThread) {
    return updateThread;
  } else {
    return false;
  }
}

export async function deleteThread(threadId: string): Promise<Boolean> {
  const removeAgent = await Agent.findByIdAndUpdate(
    threadId,
    {
      $set: {
        removeAt: Date.now(),
      },
    },
    { new: true },
  );
  if (removeAgent) {
    return true;
  } else {
    return false;
  }
}
