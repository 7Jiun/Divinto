import { JwtUserPayload } from '../utils/signJWT.ts';
import { Agent, Thread } from './schema.ts';

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
  agentIdFromOpenAi: string,
  whiteboardResourceUrl: string,
  openAiFileId: string,
) {
  const agentId: string = agentIdFromOpenAi;
  const insertId = await Agent.create({
    id: agentId,
    whiteboardResource: whiteboardResourceUrl,
    openAifileId: openAiFileId,
  });
  const updateAgentInUser = await Thread.findByIdAndUpdate(
    user.id.toString(),
    {
      $push: { agents: insertId },
    },
    { new: true },
  );
  return updateAgentInUser;
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
  if (!thread) return false;
  await Agent.findByIdAndUpdate(
    agentId,
    {
      $push: { threads: thread._id },
      $set: { updateAt: Date.now() },
    },
    { new: true },
  );
  return thread;
}

export async function getThread(threadId: string) {
  const thread = await Thread.findById(threadId);
  if (!thread || thread.removeAt) return null;
  return thread;
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
