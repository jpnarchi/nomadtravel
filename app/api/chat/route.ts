import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[]; } = await req.json();

  const result = streamText({
    model: openrouter('x-ai/grok-4-fast:free'),
    messages: convertToModelMessages(messages),
    system: 'You are a helpful assistant that can answer questions and help with tasks',
  });

  return result.toUIMessageStreamResponse();
}