import { convertToModelMessages, generateObject, streamText, UIMessage } from "ai";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { Id } from "./_generated/dataModel";

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

const http = httpRouter();

http.route({
    path: "/api/chat",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const identity = await ctx.auth.getUserIdentity();

        if (identity === null) {
            throw new Error("Unauthorized");
        }

        const { id, messages }: { id: Id<"chats">; messages: UIMessage[] } = await req.json();

        const lastMessages = messages.slice(-10);

        console.log('id', id);
        console.log('messages', messages);

        const result = streamText({
            model: openrouter('anthropic/claude-sonnet-4'),
            system: `
      You are a helpful assistant 
      `,
            messages: convertToModelMessages(lastMessages),
            onError(error) {
                console.error("streamText error:", error);
            },
        });

        return result.toUIMessageStreamResponse({
            headers: new Headers({
                "Access-Control-Allow-Origin": "*",
                Vary: "origin",
            }),
        });
    }),
});

http.route({
    path: "/api/chat",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
        const headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            return new Response(null, {
                headers: new Headers({
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

http.route({
    path: "/api/suggestions",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const identity = await ctx.auth.getUserIdentity();

        if (identity === null) {
            throw new Error("Unauthorized");
        }

        try {
            const { message }: { message: UIMessage } = await req.json();

            const context = message
                .parts
                .filter(part => part.type === 'text')
                .map(part => part.text)
                .join(' ');

            const { object } = await generateObject({
                model: openrouter('google/gemini-2.5-flash'),
                prompt: `
Genera 3 sugerencias contextuales (1-12 chars cada una) basadas en esta conversación:

Último mensaje del Asistente: "${context}"

Haz sugerencias relevantes a lo que se acaba de decir - respuestas naturales que un usuario enviaría realmente.
`,
                schema: z.object({
                    suggestions: z.array(z.string()).length(3)
                }),
                temperature: 0.9,
            });

            return new Response(JSON.stringify({ suggestions: object.suggestions }), {
                headers: new Headers({
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Vary: "origin",
                }),
            });
        } catch (error) {
            console.error('Error generating suggestions:', error);
            return new Response(JSON.stringify({ error: 'Failed to generate suggestions' }), {
                status: 500,
                headers: new Headers({
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Vary: "origin",
                }),
            });
        }
    }),
});

http.route({
    path: "/api/suggestions",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
        const headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            return new Response(null, {
                headers: new Headers({
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

http.route({
    path: "/api/title",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const identity = await ctx.auth.getUserIdentity();

        if (identity === null) {
            throw new Error("Unauthorized");
        }

        try {
            const { messages }: { messages: UIMessage[] } = await req.json();

            const context = messages
                .map(message => message.parts
                    .filter(part => part.type === 'text')
                    .map(part => part.text)
                    .join(' ')
                )
                .join(' ');

            const { object } = await generateObject({
                model: openrouter('google/gemini-2.5-flash'),
                prompt: `
Genera un título para esta conversación, debe ser de 1 a 3 palabras:

Mensajes: "${context}"

Haz el título relevante a la conversación.
`,
                schema: z.object({
                    title: z.string()
                }),
                temperature: 0.9,
            });

            return new Response(JSON.stringify({ title: object.title }), {
                headers: new Headers({
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Vary: "origin",
                }),
            });
        } catch (error) {
            console.error('Error generating title:', error);
            return new Response(JSON.stringify({ error: 'Failed to generate title' }), {
                status: 500,
                headers: new Headers({
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    Vary: "origin",
                }),
            });
        }
    }),
});

http.route({
    path: "/api/title",
    method: "OPTIONS",
    handler: httpAction(async (_, request) => {
        const headers = request.headers;
        if (
            headers.get("Origin") !== null &&
            headers.get("Access-Control-Request-Method") !== null &&
            headers.get("Access-Control-Request-Headers") !== null
        ) {
            return new Response(null, {
                headers: new Headers({
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST",
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

export default http;