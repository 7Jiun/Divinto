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
    instructions: 'Please address the user as Jane Doe. The user has a premium account.',
  });
  return run;
}

export async function getOpenAiMessage(openAiThreadId: string) {
  const messages = await openai.beta.threads.messages.list(openAiThreadId);
  const latestMessage = messages.data[0].content.values;
  console.log(latestMessage);
  return latestMessage;
}
