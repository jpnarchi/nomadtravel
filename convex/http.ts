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

        const templates = await ctx.runQuery(api.templates.getAll, {});

        const result = streamText({
            model: openrouter('anthropic/claude-sonnet-4'),
            messages: convertToModelMessages(messages),
            system: `
    Eres Nerd, un asistente útil que solo conoce React y TailwindCSS. 
    Pregunta al usuario que quiere crear, una vez que te diga, elige el template y llama a la herramienta generateInitialCodebase con el nombre del template.
    Nunca usas la carpeta /src. 
    No hace falta agregar tailwind en /styles.css
    No modifiques el archivo /styles.css
    /App.js es el componente raíz. 
    Nunca menciones algo técnico al usuario. 
    Genera siempre el código inicial antes de empezar a trabajar en el proyecto.
    Muestra siempre la vista previa cuando termines lo que el usuario te pidió.
    No crees un archivo tailwind.config.js.
    Nunca menciones algo técnico al usuario.
    Crea siempre componentes en la carpeta /components.
    Nunca muestras listas.
    Nunca muestras emojis.
    Mantén tus respuestas cortas y concisas. 1 frase máxima.
    Librerías permitidas: lucide-react, framer-motion.
    Cuando el usuario te pide que busques en internet, usa la herramienta webSearch.
    Antes de usar la herramienta webSearch explica que lo que vas a hacer es buscar en internet.
    Cuando termines de buscar en internet, muestra el resultado.
    Cuando el usuario te pide que leas un archivo, usa la herramienta readFile.
    Cuando el usuario te pide que genere una imagen, usa la herramienta generateImageTool.
    `.trim(),
            //     Cuando el usuario te pide que genere un brochure, usa la herramienta generateBrochure. Si no sabes suficiente sobre el negocio, pregúntale al usuario más detalles.
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
                        const templateFiles = await ctx.runQuery(api.templates.getFiles, { name: templateName });
                        const files = templateFiles.reduce((acc, file) => ({
                            ...acc,
                            [file.path]: file.content
                        }), {});
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                        for (const [path, content] of Object.entries(files) as [string, string][]) {
                            await ctx.runMutation(api.files.create, { chatId: id, path, content, version: currentVersion ?? 0 });
                        }
                        const message = `Base del template "${templateName}" creada con éxito`;
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
                        await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                        return {
                            success: true,
                            version: currentVersion
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

                readFile: {
                    description: 'Lee un archivo para obtener información relevante.',
                    inputSchema: z.object({
                        question: z.string().describe('Pregunta que necesitas responder del archivo'),
                        url: z.string().describe('URL del archivo a leer'),
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
                            console.error('Error reading file:', error);
                            return {
                                success: false,
                                message: `Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
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

                // Generate title
                if (messagesTexts.length < 15) {
                    const title = await generateTitle(messagesTexts);
                    await ctx.runMutation(api.chats.updateTitle, {
                        chatId: id,
                        title: title,
                    });
                }
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