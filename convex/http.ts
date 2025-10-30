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

// Helper function to clean base64 images from files before sending to API
function cleanBase64FromFiles(files: Record<string, string>): Record<string, string> {
    const cleaned: Record<string, string> = {};

    for (const [path, content] of Object.entries(files)) {
        try {
            // Try to parse as JSON (most files will be JSON slides)
            const parsed = JSON.parse(content);

            // If it has objects array, filter out base64 images
            if (parsed.objects && Array.isArray(parsed.objects)) {
                parsed.objects = parsed.objects.map((obj: any) => {
                    // If it's an image with base64 data, replace with placeholder
                    if (obj.type === 'image' && obj.src && obj.src.startsWith('data:image')) {
                        return {
                            ...obj,
                            src: '[BASE64_IMAGE_REMOVED_TO_SAVE_TOKENS]'
                        };
                    }
                    // For image type, also check other base64 fields
                    if (obj.type === 'Image' && obj.src && obj.src.startsWith('data:image')) {
                        return {
                            ...obj,
                            src: '[BASE64_IMAGE_REMOVED_TO_SAVE_TOKENS]'
                        };
                    }
                    return obj;
                });
            }

            cleaned[path] = JSON.stringify(parsed, null, 2);
        } catch {
            // If not JSON or parsing fails, keep original content
            cleaned[path] = content;
        }
    }

    return cleaned;
}

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
Eres un experto en generar respuestas rápidas contextuales para un chat con Astri, un asistente que ayuda a crear presentaciones profesionales con Fabric.js paso a paso.

CONTEXTO DE LA CONVERSACIÓN:
${messages.join('\n\n')}

CAPACIDADES DE ASTRI:
- Crear presentaciones impactantes con Fabric.js
- Diseñar slides con textos, formas, imágenes
- Buscar información en internet (negocios, referencias, datos)
- Leer archivos que el usuario suba
- Generar imágenes con IA
- Hacer cambios y mejoras visuales en slides

TU TAREA:
Genera exactamente 3 sugerencias (máximo 40 caracteres cada una) que sean:

1. **Respuestas naturales** que un usuario real escribiría
2. **Próximos pasos lógicos** en la conversación actual
3. **Acciones concretas** relacionadas con lo que Astri puede hacer
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
- Si Astri preguntó algo → "Sí", "No", "Claro"
- Si mostró una presentación → "Cambia color", "Más grande", "Agrega texto"
- Si terminó algo → "Agrega slide", "Qué sigue?", "Búscalo"
- Si mencionó un tema → "Búscalo", "Tengo logo", "Dame ideas"

EJEMPLOS MALOS:
- "Gracias" (muy genérico)
- "Ver código" (muy técnico)
- "Conectar DB" (fuera de alcance, esto es solo para presentaciones)
- "Editar JSON" (muy técnico)

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

        const { id, messages: allMessages }: { id: Id<"chats">; messages: UIMessage[] } = await req.json();

        // Take last 6 messages and clean base64 from them
        const rawMessages = allMessages.slice(-6);

        // Clean base64 from message history to save tokens
        const messages = rawMessages.map(msg => {
            // Process all message parts to clean base64 from tool outputs
            const cleanedParts = msg.parts.map((part: any) => {
                // Check if this is a tool result part (type starts with 'tool-')
                if (part.type && part.type.startsWith('tool-') && part.output) {
                    // Clean tool outputs that might contain files with base64
                    try {
                        const output = typeof part.output === 'string' ? JSON.parse(part.output) : part.output;
                        if (output.files) {
                            output.files = cleanBase64FromFiles(output.files);
                        }
                        return {
                            ...part,
                            output: typeof part.output === 'string' ? JSON.stringify(output) : output
                        };
                    } catch {
                        return part;
                    }
                }
                return part;
            });
            return { ...msg, parts: cleanedParts };
        });

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

        const files = await ctx.runQuery(api.files.getAll, { chatId: id, version: chat.currentVersion });
        const fileNames = Object.keys(files);

        // Clean base64 images from files to save tokens (only for display in system prompt)
        const cleanedFiles = cleanBase64FromFiles(files);

        // Check if there are any slides with images to avoid showing cleaned content
        const hasImagesInSlides = Object.entries(files).some(([path, content]) => {
            if (path.startsWith('/slides/') && path.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(content);
                    return parsed.objects?.some((obj: any) =>
                        (obj.type === 'image' || obj.type === 'Image') &&
                        obj.src &&
                        obj.src.startsWith('data:image')
                    );
                } catch {
                    return false;
                }
            }
            return false;
        });

        const templates = await ctx.runQuery(api.templates.getAll, {});

        const DEFAULT_BASE_URL = 'https://api.hicap.ai/v2/openai';

        const provider = createOpenAICompatible({
            name: 'hicap',
            baseURL: DEFAULT_BASE_URL,
            headers: { 'api-key': process.env.PROVIDER_API_KEY || '' },
            includeUsage: true,
        });

        // Redirect URL for Supabase auth callback
        let redirectUrl = process.env.NEXT_PUBLIC_BASE_URL + "/auth/supabase-auth-callback?chatId=" + id;

        if (chat.deploymentUrl) {
            redirectUrl = chat.deploymentUrl + "/auth/supabase-auth-callback?chatId=" + id;
        }

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

            supabaseTools.saveResendKeyInSecrets = {
                description: 'Despliega una edge function en Supabase.',
                inputSchema: z.object({}),
                execute: async function () {
                    if (!chat.supabaseProjectId) {
                        return {
                            success: false,
                            message: 'Supabase no conectado'
                        };
                    }

                    const result = await ctx.runAction(api.supabase.saveResendKeyInSecrets, {
                        projectId: chat.supabaseProjectId
                    });

                    if (!result) {
                        return {
                            success: false,
                            error: result.error,
                            message: 'Error al guardar la clave de Resend en Supabase'
                        };
                    }

                    return {
                        success: true,
                        message: 'Clave de Resend (RESEND_API_KEY) guardada en Supabase secrets exitosamente',
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
Eres Astri, un asistente especializado en crear presentaciones profesionales usando Fabric.js (librería de canvas HTML5).
Tu misión es ayudar al usuario a crear presentaciones impactantes paso a paso.

Reglas de interacción:
- Responde con frases muy cortas y claras (máximo 1 frase).
- Nunca uses listas ni emojis.
- Nunca hagas más de 1 pregunta a la vez.
- Nunca menciones nada técnico ni nombres de archivos al usuario.
- Siempre pide los datos reales que el usuario quiere usar. Nunca uses datos mock.
- IMPORTANTE: Cuando hagas una pregunta, SIEMPRE espera la respuesta del usuario antes de continuar o usar herramientas.
- IMPORTANTE: Después de crear, modificar o actualizar slides, SIEMPRE muestra una vista previa del resultado.

Reglas de presentaciones:
- Cada presentación está compuesta por slides (diapositivas).
- Cada slide es un archivo JSON que contiene objetos de Fabric.js.
- Los slides se numeran: /slides/slide-1.json, /slides/slide-2.json, etc.
- Formato de canvas: 1920x1080 (16:9) para presentaciones profesionales.
- Usa generateInitialCodebase antes de empezar una presentación.
- Usa manageFile para crear, actualizar o eliminar slides.
- Cada slide puede contener: textos, imágenes, formas geométricas, líneas, etc.

Reglas para agregar slides:
- Si el usuario pide agregar un slide AL FINAL de la presentación, usa manageFile con operation "create" y el número siguiente (ej: si hay 3 slides, crea slide-4.json).
- Si el usuario pide agregar un slide EN MEDIO de la presentación (ej: "agrega un slide después del slide 1" o "inserta un slide entre el 2 y el 3"), USA insertSlideAtPosition.
- insertSlideAtPosition renumerará automáticamente los slides existentes, no necesitas hacerlo manualmente.
- Ejemplo: Si tienes slide-1, slide-2, slide-3 y quieres insertar después del slide-1:
  - USA insertSlideAtPosition con position=2 (el nuevo slide será slide-2)
  - La herramienta automáticamente renombrará slide-2→slide-3 y slide-3→slide-4
- NUNCA intentes renumerar slides manualmente con múltiples llamadas a manageFile.

REGLA CRÍTICA - Preservar diseño de templates:
- Cuando uses generateInitialCodebase, el template YA tiene un diseño profesional completo.
- TU ÚNICA TAREA es personalizar los TEXTOS con la información del usuario.
- NUNCA cambies: posiciones (left/top), tamaños (width/height/fontSize), colores (fill/stroke), imágenes existentes, formas, o cualquier propiedad visual.
- Solo modifica el campo "text" de los objetos tipo "text", "i-text" o "textbox".
- Si hay una imagen con "[BASE64_IMAGE_REMOVED_TO_SAVE_TOKENS]", DÉJALA tal cual. NO la elimines, NO la cambies.
- El diseño del template es perfecto, solo actualiza los textos con los datos reales del usuario.

Estructura de un slide JSON:
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "text",
      "left": 100,
      "top": 100,
      "fontSize": 60,
      "text": "Título del Slide",
      "fill": "#ffffff",
      "fontFamily": "Arial"
    },
    {
      "type": "rect",
      "left": 50,
      "top": 50,
      "width": 200,
      "height": 100,
      "fill": "#3b82f6"
    }
  ],
  "background": "#1a1a1a"
}

Tipos de objetos disponibles en Fabric.js:
- text: Texto simple
- i-text: Texto editable
- textbox: Caja de texto con wrap
- rect: Rectángulo
- circle: Círculo
- triangle: Triángulo
- line: Línea
- image: Imagen (requiere URL pública, NUNCA uses base64)
- group: Grupo de objetos

IMPORTANTE sobre imágenes:
- Las imágenes base64 han sido removidas de los archivos mostrados para ahorrar tokens.
- Si ves "[BASE64_IMAGE_REMOVED_TO_SAVE_TOKENS]" significa que hay una imagen allí.
- NUNCA elimines ni modifiques objetos tipo "image" que ya existen en el template.
- Si un objeto image tiene src: "[BASE64_IMAGE_REMOVED_TO_SAVE_TOKENS]", déjalo exactamente igual.
- Para agregar NUEVAS imágenes (no reemplazar existentes), usa URLs públicas en el campo "src".
- NUNCA uses imágenes base64 (data:image/...) porque son muy pesadas.
- Si el usuario quiere agregar una imagen nueva, usa generateImageTool y luego usa la URL que devuelve.

Propiedades comunes:
- left, top: Posición X, Y
- width, height: Dimensiones
- fill: Color de relleno
- stroke: Color de borde
- strokeWidth: Grosor de borde
- opacity: Transparencia (0-1)
- angle: Rotación en grados
- scaleX, scaleY: Escala

Para textos:
- fontSize: Tamaño de fuente
- fontFamily: Fuente (Arial, Times New Roman, etc.)
- fontWeight: Peso (normal, bold)
- textAlign: Alineación (left, center, right)
- fill: Color del texto

Archivos existentes:
${fileNames.map(fileName => `- ${fileName}`).join('\n')}

${hasImagesInSlides ? `
IMPORTANTE: Los archivos contienen imágenes. Para ver o modificar el contenido:
- Lee el archivo actual desde la base de datos antes de modificarlo
- NO copies contenido de memoria, siempre usa el contenido actual del archivo
- Cuando actualices un slide, asegúrate de preservar TODAS las propiedades de TODOS los objetos
- Las imágenes ya están guardadas correctamente, NO las modifiques
` : `Archivos:
${JSON.stringify(cleanedFiles, null, 2)}`}

IMPORTANTE - NO disponibles para presentaciones:
- NO uses Supabase (esto es solo para presentaciones visuales).
- NO uses Stripe (esto es solo para presentaciones visuales).
- NO uses bases de datos.
- Enfócate únicamente en crear slides visuales impactantes.

Reglas de Supabase (DESHABILITADO):
${isSupabaseConnected
                    ? `- Supabase YA está conectado. Puedes usar supabaseSQLQuery para ejecutar consultas SQL.
- Si el usuario quiere cambiar la conexión o conectar a otro proyecto, usa connectToSupabase.

- Configuración de autenticación:
  - Cuando hagas cualquier funcionalidad de autenticación (login, registro, verificación de email, etc.), DEBES implementar el flujo completo de Supabase Auth.
  - La configuración de emailRedirectTo siempre debe usar: options: { emailRedirectTo: callback }
  - El valor de callback siempre debe ser:
    const callback = /codesandbox\\.io/.test(window.location.href)
      ? '${redirectUrl}'
      : \`\${window.location.origin}/auth/supabase-auth-callback\`;
  - SIEMPRE debes crear la ruta /auth/supabase-auth-callback con react router dom para manejar el redireccionamiento después de la verificación de email.
  - SIEMPRE crea la ruta /auth/supabase-auth-callback con react router dom para manejar el redireccionamiento después de la verificación de email.
  - Esto asegura que el redireccionamiento funcione automáticamente tanto en desarrollo como en producción.`
                    : '- Supabase NO está conectado. Si el usuario quiere usar base de datos, primero usa connectToSupabase.'}

Reglas de Stripe:
${isSupabaseConnected
                    ? `- Supabase está conectado; puedes proceder con pagos.
- Antes de pagos, verifica que existan las tablas necesarias (por ejemplo: payments). Si faltan, créalas con supabaseSQLQuery.
- Conecta Stripe con connectToStripe si aún no está conectado.
- Despliega una Edge Function con deployEdgeFunction.
- No cobres hasta tener: tablas creadas + Stripe conectado + función desplegada.
- Si falla algo, informa el error y detente.`
                    : '- Supabase NO está conectado; antes de cualquier pago usa connectToSupabase y espera confirmación.'}
				
Reglas de Resend (Para enviar correos):
${isSupabaseConnected
                    ? `- Supabase está conectado; puedes proceder con enviar correos con Resend.
- Tu tienes la clave de Resend (RESEND_API_KEY) solo llama la herramienta saveResendKeyInSecrets para guardarla en Supabase secrets.
- Despliega una Edge Function con deployEdgeFunction para enviar correos con "Astri <noreply@astri.dev>".
- Si falla algo, informa el error y detente.`
                    : '- Supabase NO está conectado; antes de enviar correos usa connectToSupabase y espera confirmación.'}

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

Flujo para personalizar templates:
1. Usa generateInitialCodebase para cargar el template.
2. Pide al usuario la información para personalizar (nombre, eslogan, etc.).
3. ESPERA la respuesta del usuario.
4. Para actualizar los textos en los slides:
   a. USA readFile para obtener el contenido actual del slide (ej: readFile con path "/slides/slide-1.json")
   b. El readFile te devolverá el JSON del slide, donde verás:
      - Objetos tipo "text" con su contenido actual
      - Objetos tipo "image" con src: "[BASE64_IMAGE_DATA]" (NO los modifiques)
      - Todas las formas, colores, posiciones, tamaños
   c. Copia TODO el JSON que recibiste de readFile
   d. Modifica SOLO el campo "text" de los objetos tipo text/i-text/textbox
   e. Mantén TODO lo demás exactamente igual:
      - Todos los objetos (textos, imágenes, formas, líneas, etc.)
      - Todas las propiedades (left, top, fontSize, fill, fontFamily, fontWeight, width, height, etc.)
      - Para objetos "image": copia TODO incluyendo src: "[BASE64_IMAGE_DATA]" SIN CAMBIAR NADA
   f. USA manageFile con operation "update" para guardar el slide modificado
5. Repite el paso 4 para cada slide que necesite actualización.
6. Muestra el preview al terminar con showPreview.
`.trim(),
            stopWhen: stepCountIs(50),
            maxOutputTokens: 64_000,
            tools: {
                readFile: {
                    description: 'Lee el contenido actual de un archivo específico de la presentación. Usa esto ANTES de actualizar un archivo para obtener su contenido completo.',
                    inputSchema: z.object({
                        path: z.string().describe('Ruta del archivo a leer (ej: "/slides/slide-1.json")'),
                    }),
                    execute: async function ({ path }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

                            const fileContent = allFiles[path];
                            if (!fileContent) {
                                return {
                                    success: false,
                                    error: `Archivo no encontrado: ${path}`
                                };
                            }

                            // Clean base64 from response to save tokens, but keep structure
                            let contentToReturn = fileContent;
                            if (path.endsWith('.json')) {
                                try {
                                    const parsed = JSON.parse(fileContent);
                                    if (parsed.objects && Array.isArray(parsed.objects)) {
                                        const cleanedObjects = parsed.objects.map((obj: any) => {
                                            if ((obj.type === 'image' || obj.type === 'Image') && obj.src && obj.src.startsWith('data:image')) {
                                                return {
                                                    ...obj,
                                                    src: '[BASE64_IMAGE_DATA]',
                                                    _note: 'Esta imagen tiene datos base64. Al actualizar el slide, copia este objeto COMPLETO pero deja el src como "[BASE64_IMAGE_DATA]" - NO lo cambies.'
                                                };
                                            }
                                            return obj;
                                        });
                                        contentToReturn = JSON.stringify({ ...parsed, objects: cleanedObjects }, null, 2);
                                    }
                                } catch {
                                    // Si no se puede parsear, devolver contenido original
                                }
                            }

                            return {
                                success: true,
                                path: path,
                                content: contentToReturn
                            };
                        } catch (error) {
                            console.error(`Error leyendo archivo ${path}:`, error);
                            return {
                                success: false,
                                error: `Error al leer ${path}`
                            };
                        }
                    },
                },

                manageFile: {
                    description: 'Gestiona slides de la presentación en formato JSON. IMPORTANTE: Cada slide debe ser un archivo JSON separado.',
                    inputSchema: z.object({
                        operation: z.enum(['create', 'update', 'delete']).describe('Tipo de operación: create (nuevo slide), update (modificar slide existente), delete (eliminar slide)'),
                        path: z.string().describe('Ruta del slide. DEBE seguir el formato: "/slides/slide-1.json", "/slides/slide-2.json", etc. Siempre empieza con /slides/ y termina con .json'),
                        content: z.string().optional().describe('Contenido JSON del slide con estructura Fabric.js (requerido para create y update). Debe ser un JSON válido con version, objects y background'),
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

                                    // Restore base64 images before saving
                                    let contentToSave = content;
                                    if (path.endsWith('.json')) {
                                        try {
                                            // Get current file from database
                                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });
                                            const currentContent = allFiles[path];

                                            if (currentContent) {
                                                const newData = JSON.parse(content);
                                                const currentData = JSON.parse(currentContent);

                                                // If both have objects arrays, restore base64 images
                                                if (newData.objects && currentData.objects && Array.isArray(newData.objects) && Array.isArray(currentData.objects)) {
                                                    // Create a map of current images by their index or properties
                                                    const currentImages = new Map();
                                                    currentData.objects.forEach((obj: any, idx: number) => {
                                                        if ((obj.type === 'image' || obj.type === 'Image') && obj.src && obj.src.startsWith('data:image')) {
                                                            currentImages.set(idx, obj.src);
                                                        }
                                                    });

                                                    // Restore base64 in new data
                                                    newData.objects = newData.objects.map((obj: any, idx: number) => {
                                                        if ((obj.type === 'image' || obj.type === 'Image') && obj.src === '[BASE64_IMAGE_DATA]') {
                                                            const originalSrc = currentImages.get(idx);
                                                            if (originalSrc) {
                                                                // Remove _note field if it exists
                                                                const { _note, ...rest } = obj;
                                                                return {
                                                                    ...rest,
                                                                    src: originalSrc
                                                                };
                                                            }
                                                        }
                                                        // Remove _note field if it exists
                                                        if (obj._note) {
                                                            const { _note, ...rest } = obj;
                                                            return rest;
                                                        }
                                                        return obj;
                                                    });

                                                    contentToSave = JSON.stringify(newData, null, 2);
                                                }
                                            }
                                        } catch (err) {
                                            console.error('Error restoring base64 images:', err);
                                            // If restoration fails, use original content
                                        }
                                    }

                                    await ctx.runMutation(api.files.updateByPath, {
                                        chatId: id,
                                        path,
                                        content: contentToSave,
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

                insertSlideAtPosition: {
                    description: 'Inserta un nuevo slide en una posición específica de la presentación, renumerando automáticamente los slides existentes. Usa esto cuando el usuario pida agregar un slide en medio de la presentación.',
                    inputSchema: z.object({
                        position: z.number().min(1).describe('Posición donde insertar el nuevo slide (1 = primer slide, 2 = segundo slide, etc.)'),
                        content: z.string().describe('Contenido JSON del nuevo slide con estructura Fabric.js. Debe ser un JSON válido con version, objects y background'),
                        explanation: z.string().describe('Explicación en 1 a 3 palabras de los cambios para usuarios no técnicos'),
                    }),
                    execute: async function ({ position, content, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

                            // Get all existing slide paths and sort them
                            const slidePaths = Object.keys(allFiles)
                                .filter(path => path.startsWith('/slides/') && path.endsWith('.json'))
                                .sort((a, b) => {
                                    const numA = parseInt(a.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    const numB = parseInt(b.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    return numA - numB;
                                });

                            // Validate position
                            if (position < 1) {
                                return {
                                    success: false,
                                    error: 'La posición debe ser mayor o igual a 1'
                                };
                            }

                            if (position > slidePaths.length + 1) {
                                return {
                                    success: false,
                                    error: `La posición ${position} es mayor al número de slides existentes (${slidePaths.length}). Usa posición ${slidePaths.length + 1} para agregar al final.`
                                };
                            }

                            // If inserting at the end, just create the new slide
                            if (position > slidePaths.length) {
                                const newPath = `/slides/slide-${position}.json`;
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content,
                                    version: currentVersion ?? 0
                                });

                                return {
                                    success: true,
                                    message: explanation,
                                    slideNumber: position
                                };
                            }

                            // We need to renumber slides from position onwards
                            // Process slides in reverse order to avoid conflicts
                            const slidesToRenumber = slidePaths.slice(position - 1); // Get slides from position to end

                            for (let i = slidesToRenumber.length - 1; i >= 0; i--) {
                                const oldPath = slidesToRenumber[i];
                                const oldNumber = parseInt(oldPath.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                const newNumber = oldNumber + 1;
                                const newPath = `/slides/slide-${newNumber}.json`;

                                // Delete old file
                                await ctx.runMutation(api.files.deleteByPath, {
                                    chatId: id,
                                    path: oldPath,
                                    version: currentVersion ?? 0
                                });

                                // Create with new name
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content: allFiles[oldPath],
                                    version: currentVersion ?? 0
                                });
                            }

                            // Now create the new slide at the desired position
                            const newPath = `/slides/slide-${position}.json`;
                            await ctx.runMutation(api.files.create, {
                                chatId: id,
                                path: newPath,
                                content,
                                version: currentVersion ?? 0
                            });

                            return {
                                success: true,
                                message: explanation,
                                slideNumber: position,
                                slidesRenumbered: slidesToRenumber.length
                            };
                        } catch (error) {
                            console.error(`Error insertando slide en posición ${position}:`, error);
                            return {
                                success: false,
                                error: `Error al insertar slide en posición ${position}`
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

                        // Return success message WITHOUT returning the files
                        // The files are now in the database and will be loaded from there
                        const message = `Plantilla "${templateName}" creada con éxito`;
                        const filesCreated = Object.keys(files).length;
                        return {
                            success: true,
                            message: message,
                            filesCreated: filesCreated,
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