import { streamText, UIMessage, convertToModelMessages, stepCountIs, generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { createFileForChat, getPromptForAgent } from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 300;

export async function POST(req: Request) {
  const { id, messages }: { id: Id<"chats">; messages: UIMessage[]; } = await req.json();

  const mainAgentPrompt = await getPromptForAgent("main_agent");
  const codeGeneratorPrompt = await getPromptForAgent("code_generator");

  const result = streamText({
    // model: openrouter('x-ai/grok-4-fast:free'),
    model: openrouter('google/gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: mainAgentPrompt,
    stopWhen: stepCountIs(5),
    tools: {
      displayProjectSummary: {
        description: 'Display a comprehensive summary of the platform to be built based on gathered information',
        inputSchema: z.object({
          businessName: z.string().describe('Name of the business or project'),
          businessType: z.string().describe('Type of business (e-commerce, SaaS, etc.)'),
          industry: z.string().describe('Industry or niche market'),
          targetAudience: z.string().describe('Primary target audience description'),
          platformPurpose: z.string().describe('Main purpose of the platform'),
          keyFeatures: z.array(z.string()).describe('List of key features needed (no third-party integrations)'),
          designStyle: z.string().describe('Preferred design style and aesthetic'),
          technicalRequirements: z.array(z.string()).describe('Technical requirements (front-end only, no external integrations)'),
          competition: z.string().optional().describe('Competitive landscape or inspiration'),
          contentStructure: z.array(z.string()).describe('Main pages/sections the platform needs'),
          imageRequirements: z.string().optional().describe('Image needs and reminder about URL requirement')
        }),
        execute: async function ({
          businessName,
          businessType,
          industry,
          targetAudience,
          platformPurpose,
          keyFeatures,
          designStyle,
          technicalRequirements,
          competition,
          contentStructure,
          imageRequirements
        }) {
          return {
            type: 'project-summary',
            data: {
              businessName,
              businessType,
              industry,
              targetAudience,
              platformPurpose,
              keyFeatures,
              designStyle,
              technicalRequirements,
              competition,
              contentStructure,
              imageRequirements,
              limitations: [
                'No third-party integrations available',
                'Front-end React application only',
                'Images require user-provided URLs',
                'No external API connections',
                'No payment processing capabilities'
              ]
            }
          };
        },
      },
      generateCode: {
        description: 'Generate code for the platform based on the gathered information',
        inputSchema: z.object({
          prompt: z.string().describe('Prompt for the code generation'),
        }),
        execute: async function ({
          prompt,
        }) {

          // TODO: Get all the current files in the chat and pass them to the model as context

          try {
            const { object } = await generateObject({
              // model: openrouter('x-ai/grok-4-fast'),
              model: openrouter('google/gemini-2.5-flash'),
              // model: openrouter('anthropic/claude-sonnet-4'),
              system: codeGeneratorPrompt,
              prompt: prompt,
              maxOutputTokens: 64000,
              schema: z.object({
                files: z.record(
                  z.string().describe('Path of the file'),
                  z.string().describe('Content of the file')
                )
              }),
            });

            const files = object.files;
            for (const [path, content] of Object.entries(files)) {
              await createFileForChat(id, path, content);
            }

            return { success: true }
          } catch (error) {
            console.error('Error generating code:', error);
            return { success: false }
          }
        },
      }
    }
  });

  return result.toUIMessageStreamResponse();
}