import { generateObject, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { getPromptForAgent } from '@/lib/convex-server';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message }: { message: UIMessage } = await request.json();

    const suggestionGeneratorPrompt = await getPromptForAgent("suggestion_generator");
    
    const context = message
      .parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join(' ');
    
    const { object } = await generateObject({
      // model: openrouter('x-ai/grok-4-fast'),
      model: openrouter('google/gemini-2.5-flash'),
      prompt: suggestionGeneratorPrompt.replace('${context}', context),
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