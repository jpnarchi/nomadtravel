import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { 
  createFileForVersion, 
  updateFileForVersion, 
  deleteFileForVersion, 
  createNewVersion,
  getCurrentVersion 
} from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';
import { defaultFiles } from '@/lib/default-files';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: Request) {
  const { id, messages }: { id: Id<"chats">; messages: UIMessage[]; } = await req.json();

  const result = streamText({
    // model: openrouter('x-ai/grok-4-fast:free'),
    // model: openrouter('google/gemini-2.5-flash'),
    model: openrouter('anthropic/claude-sonnet-4'),
    messages: convertToModelMessages(messages),
    system: `
    Eres Nerd, un asistente útil que solo conoce React y TailwindCSS. 
    Nunca usas la carpeta /src. 
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
    `,
    stopWhen: stepCountIs(50),
    maxOutputTokens: 64_000,
    tools: {
      // displayProjectSummary: {
      //   description: 'Display a comprehensive summary of the platform to be built based on gathered information',
      //   inputSchema: z.object({
      //     businessName: z.string().describe('Name of the business or project'),
      //     businessType: z.string().describe('Type of business (e-commerce, SaaS, etc.)'),
      //     industry: z.string().describe('Industry or niche market'),
      //     targetAudience: z.string().describe('Primary target audience description'),
      //     platformPurpose: z.string().describe('Main purpose of the platform'),
      //     keyFeatures: z.array(z.string()).describe('List of key features needed (no third-party integrations)'),
      //     designStyle: z.string().describe('Preferred design style and aesthetic'),
      //     technicalRequirements: z.array(z.string()).describe('Technical requirements (front-end only, no external integrations)'),
      //     competition: z.string().optional().describe('Competitive landscape or inspiration'),
      //     contentStructure: z.array(z.string()).describe('Main pages/sections the platform needs'),
      //     imageRequirements: z.string().optional().describe('Image needs and reminder about URL requirement'),
      //     limitations: z.array(z.string()).describe('Limitations of the platform'),
      //   }),
      //   execute: async function ({
      //     businessName,
      //     businessType,
      //     industry,
      //     targetAudience,
      //     platformPurpose,
      //     keyFeatures,
      //     designStyle,
      //     technicalRequirements,
      //     competition,
      //     contentStructure,
      //     imageRequirements,
      //     limitations,
      //   }) {
      //     return {
      //       type: 'project-summary',
      //       data: {
      //         businessName,
      //         businessType,
      //         industry,
      //         targetAudience,
      //         platformPurpose,
      //         keyFeatures,
      //         designStyle,
      //         technicalRequirements,
      //         competition,
      //         contentStructure,
      //         imageRequirements,
      //         limitations,
      //       }
      //     };
      //   },
      // },

      createFile: {
        description: 'Crea un nuevo componente React o archivo con estilo TailwindCSS. Usa esto solo para nuevos archivos.',
        inputSchema: z.object({
          path: z.string().describe('Ruta del archivo (por ejemplo, "/components/Header.js", "/App.js")'),
          content: z.string().describe('Contenido completo del archivo con código React y TailwindCSS'),
          explanation: z.string().describe('Explicación en 1 a 3 palabras de los cambios que estás haciendo para usuarios no técnicos'),
        }),
        execute: async function ({ path, content, explanation }) {
          try {
            const currentVersion = await getCurrentVersion(id);
            await createFileForVersion(id, path, content, currentVersion);
            return {
              success: true,
              message: `${explanation}`
            };
          } catch (error) {
            console.error('Error creating file:', error);
            return {
              success: false,
              error: `Error al crear ${path}`
            };
          }
        },
      },

      updateFile: {
        description: 'Actualiza un archivo existente. Usa esto para modificar componentes React o corregir problemas en archivos existentes.',
        inputSchema: z.object({
          path: z.string().describe('Ruta del archivo a actualizar'),
          content: z.string().describe('Contenido completo del archivo actualizado'),
          explanation: z.string().describe('Explicación en 1 a 3 palabras de los cambios que estás haciendo para usuarios no técnicos'),
        }),
        execute: async function ({ path, content, explanation }) {
          try {
            const currentVersion = await getCurrentVersion(id);
            await updateFileForVersion(id, path, content, currentVersion);
            return {
              success: true,
              message: `${explanation}`
            };
          } catch (error) {
            console.error('Error updating file:', error);
            return {
              success: false,
              error: `Error al actualizar ${path}`
            };
          }
        },
      },

      deleteFile: {
        description: 'Elimina un archivo que ya no es necesario.',
        inputSchema: z.object({
          path: z.string().describe('Ruta del archivo a eliminar'),
          explanation: z.string().describe('Explicación en 1 a 3 palabras de los cambios que estás haciendo para usuarios no técnicos'),
        }),
        execute: async function ({ path, explanation }) {
          try {
            const currentVersion = await getCurrentVersion(id);
            await deleteFileForVersion(id, path, currentVersion);
            return {
              success: true,
              message: `${explanation}`
            };
          } catch (error) {
            console.error('Error deleting file:', error);
            return {
              success: false,
              error: `Error al eliminar ${path}`
            };
          }
        },
      },

      generateInitialCodebase: {
        description: 'Genera el proyecto con los archivos iniciales.',
        inputSchema: z.object({}),
        execute: async function () {
          const files = defaultFiles;
          const currentVersion = await getCurrentVersion(id);
          for (const [path, content] of Object.entries(files)) {
            await createFileForVersion(id, path, content, currentVersion);
          }
          const message = `Base del proyecto creada con éxito`;
          const filesCreated = Object.keys(files).length;
          return {
            success: true,
            message: message,
            filesCreated: filesCreated,
            files: files
          };
        },
      },

      showPreview: {
        description: 'Muestra la vista previa del proyecto.',
        inputSchema: z.object({}),
        execute: async function () {
          const currentVersion = await getCurrentVersion(id);
          await createNewVersion(id, currentVersion);
          return {
            success: true,
            version: currentVersion
          };
        },
      }
    }
  });

  return result.toUIMessageStreamResponse();
}