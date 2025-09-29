// import { streamText, UIMessage, convertToModelMessages, stepCountIs, generateObject } from 'ai';
// import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { z } from 'zod';
// import { createFileForChat, getPromptForAgent } from '@/lib/convex-server';
// import { Id } from '@/convex/_generated/dataModel';

// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// export const maxDuration = 300;

// export async function POST(req: Request) {
//   const { id, messages }: { id: Id<"chats">; messages: UIMessage[]; } = await req.json();

//   const mainAgentPrompt = await getPromptForAgent("main_agent");
//   const codeGeneratorPrompt = await getPromptForAgent("code_generator");

//   const result = streamText({
//     // model: openrouter('x-ai/grok-4-fast:free'),
//     model: openrouter('google/gemini-2.5-flash'),
//     messages: convertToModelMessages(messages),
//     system: mainAgentPrompt,
//     stopWhen: stepCountIs(5),
//     tools: {
//       displayProjectSummary: {
//         description: 'Display a comprehensive summary of the platform to be built based on gathered information',
//         inputSchema: z.object({
//           businessName: z.string().describe('Name of the business or project'),
//           businessType: z.string().describe('Type of business (e-commerce, SaaS, etc.)'),
//           industry: z.string().describe('Industry or niche market'),
//           targetAudience: z.string().describe('Primary target audience description'),
//           platformPurpose: z.string().describe('Main purpose of the platform'),
//           keyFeatures: z.array(z.string()).describe('List of key features needed (no third-party integrations)'),
//           designStyle: z.string().describe('Preferred design style and aesthetic'),
//           technicalRequirements: z.array(z.string()).describe('Technical requirements (front-end only, no external integrations)'),
//           competition: z.string().optional().describe('Competitive landscape or inspiration'),
//           contentStructure: z.array(z.string()).describe('Main pages/sections the platform needs'),
//           imageRequirements: z.string().optional().describe('Image needs and reminder about URL requirement')
//         }),
//         execute: async function ({
//           businessName,
//           businessType,
//           industry,
//           targetAudience,
//           platformPurpose,
//           keyFeatures,
//           designStyle,
//           technicalRequirements,
//           competition,
//           contentStructure,
//           imageRequirements
//         }) {
//           return {
//             type: 'project-summary',
//             data: {
//               businessName,
//               businessType,
//               industry,
//               targetAudience,
//               platformPurpose,
//               keyFeatures,
//               designStyle,
//               technicalRequirements,
//               competition,
//               contentStructure,
//               imageRequirements,
//               limitations: [
//                 'No third-party integrations available',
//                 'Front-end React application only',
//                 'Images require user-provided URLs',
//                 'No external API connections',
//                 'No payment processing capabilities'
//               ]
//             }
//           };
//         },
//       },
//       generateCode: {
//         description: 'Generate code for the platform based on the gathered information',
//         inputSchema: z.object({
//           prompt: z.string().describe('Prompt for the code generation'),
//         }),
//         execute: async function ({
//           prompt,
//         }) {

//           // TODO: Get all the current files in the chat and pass them to the model as context

//           try {
//             const { object } = await generateObject({
//               // model: openrouter('x-ai/grok-4-fast'),
//               model: openrouter('google/gemini-2.5-flash'),
//               // model: openrouter('anthropic/claude-sonnet-4'),
//               system: codeGeneratorPrompt,
//               prompt: prompt,
//               maxOutputTokens: 64000,
//               schema: z.object({
//                 files: z.record(
//                   z.string().describe('Path of the file'),
//                   z.string().describe('Content of the file')
//                 )
//               }),
//             });

//             const files = object.files;
//             for (const [path, content] of Object.entries(files)) {
//               await createFileForChat(id, path, content);
//             }

//             return { success: true }
//           } catch (error) {
//             console.error('Error generating code:', error);
//             return { success: false }
//           }
//         },
//       }
//     }
//   });

//   return result.toUIMessageStreamResponse();
// }




import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { createFileForChat, getPromptForAgent, getFilesForChat, updateFileForChat, deleteFileForChat } from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';
import { defaultFiles } from '@/lib/default-files';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: Request) {
  const { id, messages }: { id: Id<"chats">; messages: UIMessage[]; } = await req.json();

  // const mainAgentPrompt = await getPromptForAgent("main_agent");
  // const codeGeneratorPrompt = await getPromptForAgent("code_generator");

  const result = streamText({
    // model: openrouter('x-ai/grok-4-fast:free'),
    model: openrouter('google/gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: "You are a helpful assistant that knows ONLY knows React and TailwindCSS. Don't ever use the /src folder. /App.js is the root component. Don't ever mention something technical to the user. Whenever you make a change, show preview",
    stopWhen: stepCountIs(15),
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
      //     imageRequirements: z.string().optional().describe('Image needs and reminder about URL requirement')
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
      //     imageRequirements
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
      //         limitations: [
      //           'No third-party integrations available',
      //           'Front-end React application only',
      //           'Images require user-provided URLs',
      //           'No external API connections',
      //           'No payment processing capabilities'
      //         ]
      //       }
      //     };
      //   },
      // },

      readFiles: {
        description: 'Read all existing files in the chat to understand the current codebase structure. Use this before creating or updating files.',
        inputSchema: z.object({}),
        execute: async function () {
          try {
            const files = await getFilesForChat(id);
            return {
              success: true,
              files: Object.entries(files).map(([path, content]) => ({
                path: path,
                content: content,
              }))
            };
          } catch (error) {
            console.error('Error reading files:', error);
            return { success: false, error: 'Failed to read files' };
          }
        },
      },

      createFile: {
        description: 'Create a new React component or file with TailwindCSS styling. Use this for new files only.',
        inputSchema: z.object({
          path: z.string().describe('File path (e.g., "/components/Header.js", "/App.js")'),
          content: z.string().describe('Complete file content with React and TailwindCSS code'),
        }),
        execute: async function ({ path, content }) {
          try {
            await createFileForChat(id, path, content);
            return {
              success: true,
              message: `Created ${path}`
            };
          } catch (error) {
            console.error('Error creating file:', error);
            return {
              success: false,
              error: `Failed to create ${path}`
            };
          }
        },
      },

      updateFile: {
        description: 'Update an existing file. Use this to modify React components or fix issues in existing files.',
        inputSchema: z.object({
          path: z.string().describe('Path of the file to update'),
          content: z.string().describe('Updated complete file content'),
        }),
        execute: async function ({ path, content }) {
          try {
            await updateFileForChat(id, path, content);
            return {
              success: true,
              message: `Updated ${path}`
            };
          } catch (error) {
            console.error('Error updating file:', error);
            return {
              success: false,
              error: `Failed to update ${path}`
            };
          }
        },
      },

      deleteFile: {
        description: 'Delete a file that is no longer needed.',
        inputSchema: z.object({
          path: z.string().describe('Path of the file to delete'),
        }),
        execute: async function ({ path }) {
          try {
            await deleteFileForChat(id, path);
            return {
              success: true,
              message: `Deleted ${path}`
            };
          } catch (error) {
            console.error('Error deleting file:', error);
            return {
              success: false,
              error: `Failed to delete ${path}`
            };
          }
        },
      },

      generateInitialCodebase: {
        description: 'Generate the initial codebase structure.',
        inputSchema: z.object({}),
        execute: async function () {
          const files = defaultFiles;
          for (const [path, content] of Object.entries(files)) {
            await createFileForChat(id, path, content);
          }
          const message = `Initial codebase generated with ${Object.keys(files).length} files`;
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
        description: 'Show the preview of the codebase.',
        inputSchema: z.object({}),
        execute: async function () {
          return {
            success: true,
          };
        },
      }
    }
  });

  return result.toUIMessageStreamResponse();
}