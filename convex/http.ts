import {
    convertToModelMessages,
    generateObject,
    generateText,
    stepCountIs,
    streamText,
    UIMessage,
    experimental_generateImage as generateImage
} from "ai";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const webSearchTool = anthropic.tools.webSearch_20250305({
    maxUses: 5,
});

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

const http = httpRouter();

// Helper function to upload image to storage within HTTP action context
async function uploadFileToStorageFromHttpAction(
    ctx: any,
    fileData: Uint8Array,
    mimeType: string
): Promise<string | null> {
    try {
        // Step 1: Store the file directly using ctx.storage.store()
        const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
        const storageId = await ctx.storage.store(blob);

        // Step 2: Get the public URL from storage
        const url = await ctx.storage.getUrl(storageId);

        if (!url) {
            throw new Error("Failed to get storage URL");
        }

        return url;
    } catch (error) {
        console.error("Error uploading image to storage:", error);
        return null;
    }
}

async function generateSuggestions(messages: string[]) {
    try {
        const { object } = await generateObject({
            model: openrouter('google/gemini-2.5-flash'),
            prompt: `
Genera 3 sugerencias contextuales (1-12 chars cada una) basadas en esta conversación:

Últimos mensajes: "${messages.join('\n\n')}"

Haz sugerencias relevantes a lo que se acaba de decir - respuestas naturales que un usuario enviaría realmente.
`.trim(),
            schema: z.object({
                suggestions: z.array(z.string()).length(3)
            }),
            temperature: 0.9,
        });

        return object.suggestions;
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return [];
    }
}

async function generateTitle(messages: string[]) {
    try {
        const { object } = await generateObject({
            model: openrouter('google/gemini-2.5-flash'),
            prompt: `
Genera un título para esta conversación, debe ser de 1 a 3 palabras:

Mensajes: "${messages.join('\n\n')}"

Haz el título relevante a la conversación.
`.trim(),
            schema: z.object({
                title: z.string().describe('El título de la conversación en 1 a 3 palabras')
            }),
            temperature: 0.9,
        });

        return object.title;
    } catch (error) {
        console.error('Error generating title:', error);
        return '';
    }
}

http.route({
    path: "/api/chat",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const identity = await ctx.auth.getUserIdentity();

        if (identity === null) {
            throw new Error("Unauthorized");
        }

        const { id, messages }: { id: Id<"chats">; messages: UIMessage[] } = await req.json();

        // update is generating
        await ctx.runMutation(api.chats.updateIsGenerating, {
            chatId: id,
            isGenerating: true,
        });

        const templates = await ctx.runQuery(api.templates.getAll, {});

        // const DEFAULT_BASE_URL = 'https://api.hicap.ai/v2/openai';

        // const provider = createOpenAICompatible({
        //     name: 'hicap',
        //     baseURL: DEFAULT_BASE_URL,
        //     headers: { 'api-key': process.env.PROVIDER_API_KEY || '' },
        //     includeUsage: true,
        // });

        const result = streamText({
            model: openrouter('anthropic/claude-sonnet-4'),
            // model: provider('claude-sonnet-4'),
            messages: convertToModelMessages(messages),
            system: `
Eres Nerd, un asistente útil que solo conoce React y TailwindCSS.
Tu misión es ayudar al usuario a crear proyectos simples paso a paso.

Reglas de interacción:
Responde con frases muy cortas y claras (máximo 1 frase).
Nunca uses listas ni emojis.
Nunca hagas más de 1 pregunta a la vez.
Nunca menciones nada técnico ni nombres de archivos al usuario.
Siempre pide los datos reales que el usuario quiere usar. Nunca uses datos mock.
Todo debe ser responsivo en desktop, tablet y móvil.
Siempre muestra una vista previa al terminar lo que el usuario te pidió.

Reglas de código:
/App.js solo sirve como punto de entrada.
Está prohibido escribir todo en App.js.
Cada parte de la interfaz debe dividirse en componentes y subcomponentes pequeños para que nada sea grande.
Crea todos los componentes en /components.
No uses la carpeta /src.
No modifiques /styles.css.
No crees tailwind.config.js.
Solo puedes usar lucide-react y framer-motion.
Usa generateInitialCodebase antes de empezar un proyecto.
Usa manageFile para crear, actualizar o eliminar archivos.

Reglas de herramientas adicionales:
Si el usuario menciona que ya tiene un negocio, primero pregunta si puedes buscarlo en internet y usa la herramienta webSearch. Pide al usuario información del negocio para poder buscarlo.
Si el usuario quiere buscar cualquier otra cosa en internet, explica primero que lo harás y luego usa webSearch. Muestra siempre los resultados.
Si el usuario pide leer un archivo, usa readAttachment.
Si el usuario pide generar una imagen:
Pregunta primero si quiere subir su foto o generarla con IA.
  - Si elige subir su foto, usa generateImageTool con la foto del usuario.
  - Si elige IA, usa generateImageTool y confirma con él si es la correcta.
            `.trim(),
            stopWhen: stepCountIs(50),
            maxOutputTokens: 64_000,
            tools: {
                manageFile: {
                    description: 'Gestiona archivos del proyecto React con TailwindCSS. Permite crear, actualizar o eliminar archivos.',
                    inputSchema: z.object({
                        operation: z.enum(['create', 'update', 'delete']).describe('Tipo de operación: create (nuevo archivo), update (modificar existente), delete (eliminar)'),
                        path: z.string().describe('Ruta del archivo (ejemplo: "/components/Header.js", "/App.js")'),
                        content: z.string().optional().describe('Contenido completo del archivo (requerido para create y update)'),
                        explanation: z.string().describe('Explicación en 1 a 3 palabras de los cambios para usuarios no técnicos'),
                    }),
                    execute: async function ({ operation, path, content, explanation }) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            switch (operation) {
                                case 'create':
                                    if (!content) {
                                        return {
                                            success: false,
                                            error: 'El contenido es requerido para crear un archivo'
                                        };
                                    }
                                    await ctx.runMutation(api.files.create, {
                                        chatId: id,
                                        path,
                                        content,
                                        version: currentVersion ?? 0
                                    });
                                    break;

                                case 'update':
                                    if (!content) {
                                        return {
                                            success: false,
                                            error: 'El contenido es requerido para actualizar un archivo'
                                        };
                                    }
                                    await ctx.runMutation(api.files.updateByPath, {
                                        chatId: id,
                                        path,
                                        content,
                                        version: currentVersion ?? 0
                                    });
                                    break;

                                case 'delete':
                                    await ctx.runMutation(api.files.deleteByPath, {
                                        chatId: id,
                                        path,
                                        version: currentVersion ?? 0
                                    });
                                    break;
                            }

                            return {
                                success: true,
                                message: explanation
                            };
                        } catch (error) {
                            console.error(`Error en operación ${operation}:`, error);
                            return {
                                success: false,
                                error: `Error al ${operation === 'create' ? 'crear' : operation === 'update' ? 'actualizar' : 'eliminar'} ${path}`
                            };
                        }
                    },
                },

                generateInitialCodebase: {
                    description: 'Genera el proyecto con los archivos iniciales.',
                    inputSchema: z.object({
                        templateName: z.union(
                            templates.map(template =>
                                z.literal(template.name).describe(template.description)
                            )
                        ),
                    }),
                    execute: async function ({ templateName }) {
                        // get current version
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                        // delete files in version if any
                        await ctx.runMutation(api.files.deleteFilesInVersion, { chatId: id, version: currentVersion ?? 0 });

                        // get template files
                        const templateFiles = await ctx.runQuery(api.templates.getFiles, { name: templateName });
                        const files = templateFiles.reduce((acc, file) => ({
                            ...acc,
                            [file.path]: file.content
                        }), {});

                        // create files in batch
                        const filesToCreate = templateFiles.map(file => ({
                            path: file.path,
                            content: file.content
                        }));

                        await ctx.runMutation(api.files.createBatch, {
                            chatId: id,
                            files: filesToCreate,
                            version: currentVersion ?? 0
                        });

                        // return message and files created
                        const message = `Plantilla "${templateName}" creada con éxito`;
                        const filesCreated = Object.keys(files).length;
                        return {
                            success: true,
                            message: message,
                            filesCreated: filesCreated,
                            files: files,
                        };
                    },
                },

                showPreview: {
                    description: 'Muestra la vista previa del proyecto.',
                    inputSchema: z.object({}),
                    execute: async function () {
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                        const result = await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                        return {
                            success: true,
                            version: currentVersion,
                            creationTime: result.creationTime,
                        };
                    },
                },

                webSearch: {
                    description: 'Busca en internet para obtener información relevante.',
                    inputSchema: z.object({
                        query: z.string().describe('La consulta a realizar en internet'),
                    }),
                    execute: async function ({ query }) {
                        try {
                            const { text } = await generateText({
                                model: anthropic('claude-sonnet-4-20250514'),
                                prompt: `Busca en internet: ${query}`,
                                tools: {
                                    web_search: webSearchTool,
                                },
                            });
                            return {
                                success: true,
                                message: text
                            };
                        } catch (error) {
                            console.error('Error searching in internet:', error);
                            return {
                                success: false,
                                message: `Error al buscar en internet: ${query}`
                            };
                        }
                    },
                },

                readAttachment: {
                    description: 'Lee un archivo adjunto para obtener información relevante.',
                    inputSchema: z.object({
                        question: z.string().describe('Pregunta que necesitas responder del archivo adjunto'),
                        url: z.string().describe('URL del archivo adjunto a leer'),
                        mimeType: z.union([
                            z.literal('application/pdf'),
                            z.literal('image/png'),
                            z.literal('image/jpeg'),
                            z.literal('image/jpg'),
                            z.literal('image/heic'),
                            z.literal('image/heif'),
                            z.literal('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), // .docx
                            z.literal('application/msword'), // .doc
                            z.literal('text/plain'), // .txt
                            z.literal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), // .xlsx
                            z.literal('application/vnd.ms-excel'), // .xls
                            z.literal('text/csv') // .csv
                        ]).describe('Tipo de archivo'),
                    }),
                    execute: async function ({ question, url, mimeType }) {
                        try {
                            const { text } = await generateText({
                                model: anthropic('claude-sonnet-4-20250514'),
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: question,
                                            },
                                            {
                                                type: 'file',
                                                data: new URL(url),
                                                mediaType: mimeType,
                                            },
                                        ],
                                    },
                                ],
                            });
                            return {
                                success: true,
                                message: text
                            };

                        } catch (error) {
                            console.error('Error reading attachment:', error);
                            return {
                                success: false,
                                message: `Error al leer el archivo adjunto: ${error instanceof Error ? error.message : 'Error desconocido'}`
                            };
                        }
                    },
                },

                generateImageTool: {
                    description: 'Genera una imagen con IA.',
                    inputSchema: z.object({
                        prompt: z.string().describe('Prompt para generar la imagen'),
                        size: z.union([
                            z.literal('1024x1024'),
                            z.literal('1024x1792'),
                            z.literal('1792x1024'),
                        ]).describe('El tamaño de la imagen a generar'),
                        n: z.number().describe('El número de imágenes a generar. dall-e-3: 1 (1 max), dall-e-2: 1-5 (5 max)'),
                        model: z.union([
                            z.literal('dall-e-3'),
                            z.literal('dall-e-2'),
                        ]).describe('El modelo a usar'),
                    }),
                    execute: async function ({ prompt, size, n, model }) {
                        try {
                            const { images } = await generateImage({
                                model: openai.image(model),
                                prompt: prompt,
                                size: size,
                                n: n,
                            });

                            // Upload all images to Convex storage
                            const imageUrls = [];
                            for (const image of images) {
                                const imageUrl = await uploadFileToStorageFromHttpAction(ctx, image.uint8Array, 'image/png');

                                if (!imageUrl) {
                                    throw new Error('Failed to upload image to storage');
                                }

                                imageUrls.push(imageUrl);
                            }

                            return {
                                success: true,
                                message: `${imageUrls.length} imagen${imageUrls.length > 1 ? 'es' : ''} generada${imageUrls.length > 1 ? 's' : ''} exitosamente`,
                                imageUrls: imageUrls
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return {
                                success: false,
                                message: `Error al generar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`
                            };
                        }
                    },
                },
            },
            onError(error) {
                console.error("streamText error:", error);
            },
            async onFinish(result) {
                const assistantParts = [];

                // Save relevant parts
                for (const step of result.steps) {
                    for (const part of step.content) {
                        if (part.type === 'text') {
                            assistantParts.push({
                                type: 'text',
                                text: part.text
                            });
                        } else if (part.type === 'tool-result') {
                            assistantParts.push({
                                type: `tool-${part.toolName}`,
                                toolCallId: part.toolCallId,
                                toolName: part.toolName,
                                input: (part as any).input,
                                output: (part as any).output,
                                state: 'output-available'
                            });
                        }
                    }
                }

                // Save message to database
                await ctx.runMutation(api.messages.create, {
                    chatId: id,
                    role: 'assistant',
                    parts: assistantParts,
                });

                // Get messages text 
                let messagesTexts = [];
                for (const message of messages) {
                    const messageText = message.parts.filter(part => part.type === 'text').map(part => part.text).join(' ');
                    messagesTexts.push(messageText);
                }
                const lastMessage = assistantParts.filter(part => part.type === 'text').map(part => part.text).join(' ');
                messagesTexts.push(lastMessage);

                // Generate suggestions
                const suggestions = await generateSuggestions(messagesTexts.slice(-3));
                await ctx.runMutation(api.suggestions.upsert, {
                    chatId: id,
                    suggestions: suggestions,
                });

                // Get last title
                const title = await ctx.runQuery(api.chats.getTitle, { chatId: id });

                if (!title) {
                    throw new Error("Title not found");
                }

                // Generate title
                if (messagesTexts.length < 15 && !title.includes("(Copia)")) {
                    const title = await generateTitle(messagesTexts);
                    await ctx.runMutation(api.chats.updateTitle, {
                        chatId: id,
                        title: title,
                    });
                }

                // update is generating
                await ctx.runMutation(api.chats.updateIsGenerating, {
                    chatId: id,
                    isGenerating: false,
                });
            }
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
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization, User-Agent",
                    "Access-Control-Max-Age": "86400",
                }),
            });
        } else {
            return new Response();
        }
    }),
});

export default http;