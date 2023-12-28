import fs from 'fs';
import OpenAi from 'openai';
import { Message } from './shape.ts';

export const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

export async function uploadFileToOpenAi(agentKnowledgeFile: string) {
  return openai.files.create({
    file: fs.createReadStream(`${agentKnowledgeFile}`),
    purpose: 'assistants',
  });
}

export async function createAgentByOpenAi(file: any) {
  return openai.beta.assistants.create({
    instructions:
      "Reflective Companion is designed to assist users in self-reflection through their daily diary entries. Its primary goal is to offer personalized insights, focusing on understanding and responding to the user's input and appended file. It will provide actionable instructions or short summary, grounded in the user's own experience which can be retrievaled in append file. Reflective Companion will maintain a friendly, conversational tone, similar to a user's friend, give the observation to user, and will avoid making assumptions. Instead, it will ask questions to better understand vague or unclear entries. It will pay special attention to identifying positive and negative moods in the diary entries, understanding what may be causing these emotions, and providing supportive feedback accordingly. Reflective Companion will remember specific topics or emotions from previous entries to build a more connected and personalized conversation over time, enhancing its ability to summarize the thoughts, supports and guide the user effectively. only reply in 100 to 200 tokens response for each question",
    model: 'gpt-4-1106-preview',
    tools: [{ type: 'retrieval' }],
    file_ids: [file.id],
  });
}

export async function createOpenAiThread() {
  const thread = await openai.beta.threads.create();
  return thread;
}

export async function postOpenAiMessage(openAiThreadId: string, question: string) {
  const message = await openai.beta.threads.messages.create(openAiThreadId, {
    role: 'user',
    content: question,
  });
  return message;
}

export async function runOpenAiThread(openAiThreadId: string, assistantId: string) {
  const run = await openai.beta.threads.runs.create(openAiThreadId, {
    assistant_id: assistantId,
  });
  return run.id;
}

export async function isRunCompleted(threadId: string, runId: string): Promise<Boolean> {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    return !!(run.completed_at || run.failed_at);
  } catch (error) {
    console.error('Fetch error:', error);
    return true;
  }
}

export async function createThreadAndRun(assistantId: string, message: Message) {
  const run = await openai.beta.threads.createAndRun({
    assistant_id: assistantId,
    thread: {
      messages: [{ role: 'user', content: message.text }],
    },
  });
  return run;
}

export async function getOpenAiMessage(openAiThreadId: string) {
  const response = await openai.beta.threads.messages.list(openAiThreadId);
  const messages = response.data;

  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
  return assistantMessages.length > 0
    ? assistantMessages[0].content
    : 'No response from assistant.';
}
