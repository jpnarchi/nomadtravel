import { generateObject, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message }: { message: UIMessage } = await request.json();
    
    const context = message
      .parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
    
    const { object } = await generateObject({
      // model: openrouter('x-ai/grok-4-fast'),
      model: openrouter('google/gemini-2.5-flash'),
      prompt: `Generate 3 contextual quick replies (1-12 chars each) based on this conversation:

Last message from Assistant: "${context}"

Make suggestions relevant to what was just said - natural responses a user would actually send.`,
      schema: z.object({
        suggestions: z.array(z.string()).length(3)
      }),
      temperature: 0.9,
    });
    
    return Response.json({ suggestions: object.suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return Response.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}