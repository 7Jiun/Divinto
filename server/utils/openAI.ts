import OpenAi from 'openai';
import { Message } from '../model/agentModel.ts';

export const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

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
    console.log(run);
    if (run.completed_at || run.failed_at) {
      return true;
    } else {
      return false;
    }
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
  console.log(run);
  return run;
}

export async function getOpenAiMessage(openAiThreadId: string) {
  const response = await openai.beta.threads.messages.list(openAiThreadId);
  const messages = response.data;

  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
  if (assistantMessages[0].content[0].type === 'text') {
    console.log(`this is message from open ai: ${assistantMessages[0].content[0].text.value}`);
  }
  return assistantMessages.length > 0
    ? assistantMessages[0].content
    : 'No response from assistant.';
}
