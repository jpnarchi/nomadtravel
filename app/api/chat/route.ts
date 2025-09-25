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
    system: `\n
        - you are a helpful assistant!
        - keep your responses limited to a sentence.
        - DO NOT output lists.
        - today's date is ${new Date().toLocaleDateString()}.
        - ask follow up questions
        '
      `,
  });

  return result.toUIMessageStreamResponse();
}