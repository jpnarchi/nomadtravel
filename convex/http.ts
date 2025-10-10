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
import { api, internal } from "./_generated/api";
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
Eres un experto en generar respuestas rápidas contextuales para un chat con Nerd, un asistente que ayuda a crear páginas web paso a paso.

CONTEXTO DE LA CONVERSACIÓN:
${messages.join('\n\n')}

CAPACIDADES DE NERD:
- Crear páginas web y diseños responsivos
- Buscar información en internet (negocios, referencias, datos)
- Leer archivos que el usuario suba
- Generar imágenes con IA
- Hacer cambios y mejoras visuales

TU TAREA:
Genera exactamente 3 sugerencias (máximo 40 caracteres cada una) que sean:

1. **Respuestas naturales** que un usuario real escribiría
2. **Próximos pasos lógicos** en la conversación actual
3. **Acciones concretas** relacionadas con lo que Nerd puede hacer
4. **Variadas** - mezcla diferentes tipos (confirmar, preguntar, pedir acción)

REGLAS ESTRICTAS:
❌ NO sugieras "Gracias" ni cortesías innecesarias
❌ NO sugieras acciones imposibles (enviar emails, conectar bases de datos, integraciones)
❌ NO sugieras "Ver página" o "Abrir enlace"
❌ NO menciones nada técnico (código, archivos, nombres técnicos)
✅ SÍ sugiere pasos siguientes del proyecto
✅ SÍ sugiere búsquedas web si es relevante
✅ SÍ sugiere cambios visuales o de diseño
✅ SÍ sugiere agregar secciones o elementos nuevos

EJEMPLOS BUENOS:
- Si Nerd preguntó algo → "Sí", "No", "Claro"
- Si mostró una vista previa → "Cambia color", "Más grande", "Agrega logo"
- Si terminó algo → "Agrega menú", "Qué sigue?", "Búscalo"
- Si mencionó un negocio → "Búscalo", "Tengo logo", "Dame ideas"

EJEMPLOS MALOS:
- "Gracias" (muy genérico)
- "Ver email" (no puede hacerlo)
- "Conectar DB" (fuera de alcance)
- "Editar código" (muy técnico)

Genera las 3 sugerencias más útiles y naturales para ESTE momento específico de la conversación.
Usa lenguaje simple y conversacional, como si fueras el usuario respondiendo.
`.trim(),
            schema: z.object({
                suggestions: z.array(z.string().max(40)).length(3)
            }),
            temperature: 0.8,
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

        // get chat 
        const chat = await ctx.runQuery(api.chats.getById, { chatId: id });

        if (!chat) {
            throw new Error("Chat not found");
        }

        const templates = await ctx.runQuery(api.templates.getAll, {});

        const DEFAULT_BASE_URL = 'https://api.hicap.ai/v2/openai';

        const provider = createOpenAICompatible({
            name: 'hicap',
            baseURL: DEFAULT_BASE_URL,
            headers: { 'api-key': process.env.PROVIDER_API_KEY || '' },
            includeUsage: true,
        });

        // check if supabase is connected 
        const isSupabaseConnected = !!chat.supabaseProjectId;

        // create supabase tools
        const supabaseTools: any = {
            connectToSupabase: {
                description: 'Conecta a Supabase.',
                inputSchema: z.object({}),
                execute: async function () {
                    return {
                        success: true,
                        message: 'Esperando a que el usuario conecte Supabase...'
                    };
                },
            },
        };

        // Add supabaseSQLQuery tool only if Supabase is connected
        if (isSupabaseConnected) {
            supabaseTools.supabaseSQLQuery = {
                description: 'Escribe una consulta SQL en Supabase.',
                inputSchema: z.object({
                    query: z.string().describe('La consulta SQL a ejecutar. Drop table if exists si lo necesitas. Usa mock data para nuevas tablas.'),
                }),
                execute: async function ({ query }: any) {
                    if (!chat.supabaseProjectId) {
                        return {
                            success: false,
                            message: 'Supabase no conectado'
                        };
                    }

                    const result = await ctx.runAction(api.supabase.executeSQLQuery, {
                        query: query,
                        projectId: chat.supabaseProjectId
                    });

                    if (!result) {
                        return {
                            success: false,
                            message: 'Error al ejecutar la consulta SQL'
                        };
                    }

                    // Check if the result indicates an error
                    if (result.success === false) {
                        return {
                            success: false,
                            message: result.message || 'Error al ejecutar la consulta SQL'
                        };
                    }

                    return {
                        success: true,
                        message: result.message || 'Consulta SQL ejecutada exitosamente',
                        data: result.data
                    };
                },
            };

            supabaseTools.connectToStripe = {
                description: 'Conecta a Stripe.',
                inputSchema: z.object({}),
                execute: async function () {
                    return {
                        success: true,
                        message: 'Esperando a que el usuario conecte Stripe...'
                    };
                },
            };

            supabaseTools.deployEdgeFunction = {
                description: 'Despliega una edge function en Supabase.',
                inputSchema: z.object({
                    functionName: z.string().describe('El nombre de la función a desplegar'),
                    fileContent: z.string().describe('El contenido de la función a desplegar. El código debe ser en TypeScript.'),
                }),
                execute: async function ({ functionName, fileContent }: any) {
                    if (!chat.supabaseProjectId) {
                        return {
                            success: false,
                            message: 'Supabase no conectado'
                        };
                    }

                    const result = await ctx.runAction(api.supabase.deployEdgeFunction, {
                        functionName: functionName,
                        fileContent: fileContent,
                        projectId: chat.supabaseProjectId
                    });

                    if (!result) {
                        return {
                            success: false,
                            error: result.error,
                            message: 'Error al desplegar la función'
                        };
                    }

                    return {
                        success: true,
                        message: result.message || 'Función desplegada exitosamente',
                        data: result.data
                    };
                },
            };
        }

        const result = streamText({
            model: openrouter('anthropic/claude-sonnet-4.5'),
            // model: provider('claude-sonnet-4'),
            // model: anthropic('claude-sonnet-4-5-20250929'),
            messages: convertToModelMessages(messages),
            system: `
Eres Nerd, un asistente útil que solo conoce React y TailwindCSS y programas en Sandpack (editor de código en internet).
Tu misión es ayudar al usuario a crear proyectos simples paso a paso.

Reglas de interacción:
- Responde con frases muy cortas y claras (máximo 1 frase).
- Nunca uses listas ni emojis.
- Nunca hagas más de 1 pregunta a la vez.
- Nunca menciones nada técnico ni nombres de archivos al usuario.
- Siempre pide los datos reales que el usuario quiere usar. Nunca uses datos mock.
- Todo debe ser responsivo en desktop, tablet y móvil.
- IMPORTANTE: Cuando hagas una pregunta, SIEMPRE espera la respuesta del usuario antes de continuar o usar herramientas.
- IMPORTANTE: Después de crear, modificar o actualizar componentes, SIEMPRE muestra una vista previa del resultado.

Reglas de código:
- /App.js solo sirve como punto de entrada.
- Está prohibido escribir todo en App.js.
- Cada parte de la interfaz debe dividirse en componentes y subcomponentes pequeños para que nada sea grande.
- Crea todos los componentes en /components.
- No uses la carpeta /src.
- Tailwind ya está instalado, no tienes que instalar nada.
- No modifiques nunca /styles.css
- No crees tailwind.config.js.
- Solo puedes usar lucide-react y framer-motion.
- Usa generateInitialCodebase antes de empezar un proyecto.
- Usa manageFile para crear, actualizar o eliminar archivos.
- Todos los datos mock van en la carpeta /data

Reglas de Supabase:
${isSupabaseConnected
                    ? '- Supabase YA está conectado. Puedes usar supabaseSQLQuery para ejecutar consultas SQL.\n- Si el usuario quiere cambiar la conexión o conectar a otro proyecto, usa connectToSupabase.'
                    : '- Supabase NO está conectado. Si el usuario quiere usar base de datos, primero usa connectToSupabase.'}

Reglas de Stripe:
${isSupabaseConnected
                    ? '- Supabase está conectado; puedes proceder con pagos.\n- Antes de pagos, verifica que existan las tablas necesarias (por ejemplo: payments). Si faltan, créalas con supabaseSQLQuery.\n- Conecta Stripe con connectToStripe si aún no está conectado.\n- Despliega una Edge Function con deployEdgeFunction.\n- No cobres hasta tener: tablas creadas + Stripe conectado + función desplegada.\n- Si falla algo, informa el error y detente.'
                    : '- Supabase NO está conectado; antes de cualquier pago usa connectToSupabase y espera confirmación.'}
				
Reglas de herramientas adicionales:
- Si el usuario menciona que ya tiene un negocio:
  1. Pregunta si puedes buscarlo en internet y espera su respuesta.
  2. Pide la información necesaria (nombre, ubicación, etc.) y espera su respuesta.
  3. Usa webSearch para buscar.
  4. Muestra los resultados encontrados al usuario.
  5. Pregunta si la información es correcta y espera confirmación antes de continuar.
- Si el usuario quiere buscar cualquier otra cosa en internet:
  1. Explica que lo buscarás.
  2. Usa webSearch.
  3. Muestra siempre los resultados y espera confirmación si es necesario.
- Si el usuario pide leer un archivo, usa readAttachment.
- Si el usuario pide generar una imagen:
  1. Pregunta primero si quiere subir su foto o generarla con IA y espera respuesta.
  2. Si elige subir su foto, espera a que la suba y usa generateImageTool.
  3. Si elige IA, usa generateImageTool y pregunta si es correcta antes de continuar.

Flujo de trabajo obligatorio:
1. Haz UNA pregunta.
2. ESPERA la respuesta del usuario (no uses herramientas hasta recibir respuesta).
3. Procesa la respuesta.
4. Si usas manageFile o modificas código, muestra SIEMPRE el preview al terminar.
5. Repite desde el paso 1 si necesitas más información.
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
                    execute: async function ({ operation, path, content, explanation }: any) {
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
                    execute: async function ({ templateName }: any) {
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
                    execute: async function ({ query }: any) {
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
                    execute: async function ({ question, url, mimeType }: any) {
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
                    description: 'Genera una imagen con IA (gpt-image-1)',
                    inputSchema: z.object({
                        prompt: z.string().describe('Prompt para generar la imagen'),
                        size: z.union([
                            z.literal("256x256"),
                            z.literal("512x512"),
                            z.literal("1024x1024"),
                            z.literal("1024x1792"),
                            z.literal("1792x1024"),
                        ]).describe('El tamaño de la imagen a generar'),
                    }),
                    execute: async function ({ prompt, size }: any) {
                        try {
                            const { image } = await generateImage({
                                // model: openai.imageModel('gpt-image-1'),
                                model: openai.image('gpt-image-1'),
                                prompt: prompt,
                                size: size,
                                n: 1,
                            });

                            // Upload image to Convex storage
                            const imageUrl = await uploadFileToStorageFromHttpAction(ctx, image.uint8Array, 'image/png');

                            return {
                                success: true,
                                message: `Imagen generada exitosamente`,
                                imageUrl: imageUrl
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

                ...supabaseTools,
            },
            async onError(error) {
                console.error("streamText error:", error);

                // update is generating
                await ctx.runMutation(api.chats.updateIsGenerating, {
                    chatId: id,
                    isGenerating: false,
                });
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
                const suggestions = await generateSuggestions(messagesTexts.slice(-6));
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

http.route({
    path: "/api/stripe",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature: string = request.headers.get("stripe-signature") as string;
        const result = await ctx.runAction(internal.stripe.fulfill, {
            signature,
            payload: await request.text(),
        });
        if (result.success) {
            return new Response(null, {
                status: 200,
            });
        } else {
            return new Response("Webhook Error", {
                status: 400,
            });
        }
    }),
});

export default http;