import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';

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
    stopWhen: stepCountIs(5),
    tools: {
        getWeather: {
            description: 'Display the weather for a location',
            inputSchema: z.object({
                location: z.string().describe('The location to get the weather for'),
            }),
            execute: async function ({ location }) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { weather: 'Sunny', temperature: 75, location };
            },
        }
    }
  });

  return result.toUIMessageStreamResponse();
}