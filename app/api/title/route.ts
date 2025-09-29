import { generateObject, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { titleGeneratorPrompt } from '@/lib/prompts';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await request.json();

        const context = messages
            .map(message => message.parts
                .filter(part => part.type === 'text')
                .map(part => part.text)
                .join(' ')
            )

        const { object } = await generateObject({
            // model: openrouter('x-ai/grok-4-fast'),
            model: openrouter('google/gemini-2.5-flash'),
            prompt: titleGeneratorPrompt.replace('${context}', context.join(' ')),
            schema: z.object({
                title: z.string()
            }),
            temperature: 0.9,
        });

        return Response.json({ title: object.title });
    } catch (error) {
        console.error('Error generating title:', error);
        return Response.json({ error: 'Failed to generate title' }, { status: 500 });
    }
}