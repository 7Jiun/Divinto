import { JwtUserPayload } from '../utils/signJWT.ts';
import { Agent, Thread } from './schema.ts';

enum MessageSpeakerEnum {
  UserEnum = 'user',
  AgentEnum = 'agent',
}

interface Message {
  speaker: MessageSpeakerEnum;
  text: string;
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

export async function updateThreadMessage(threadId: string, message: Message): Promise<Boolean> {
  const updateThread = await Thread.findByIdAndUpdate(
    threadId,
    {
      $push: { messages: message },
    },
    { new: true },
  );
  if (updateThread) {
    return true;
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
