import OpenAi from 'openai';

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
  console.log(run);
  return run;
}

export async function getOpenAiMessage(openAiThreadId: string) {
  const response = await openai.beta.threads.messages.list(openAiThreadId);
  const messages = response.data;
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
  console.log(assistantMessages.forEach((msg) => msg.content));
  // 返回最新的助手消息
  return assistantMessages.length > 0
    ? assistantMessages[0].content
    : 'No response from assistant.';
}
