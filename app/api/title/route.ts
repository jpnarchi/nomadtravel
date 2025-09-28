import { generateObject, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';

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
            model: openrouter('x-ai/grok-4-fast:free'),
            prompt: `Generate a title for this conversation, it should be 1 to 3 words:

messages: "${context}"

Make the title relevant to the conversation.`,
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