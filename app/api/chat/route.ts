import { streamText, UIMessage, convertToModelMessages, stepCountIs, generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { appJsTemplate, buttonComponent } from '@/lib/templates';
import { createFileForChat } from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const maxDuration = 300;

const defaultFilesPrompt = `
    The default files are already provided in the environment:
    - /styles.css: 
        body {
            font-family: sans-serif;
            -webkit-font-smoothing: auto;
            -moz-font-smoothing: auto;
            -moz-osx-font-smoothing: grayscale;
            font-smoothing: auto;
            text-rendering: optimizeLegibility;
            font-smooth: always;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
        }
        h1 {
            font-size: 1.5rem;
        }

    - /package.json:
        {
            "dependencies": {
                "react": "^19.0.0",
                "react-dom": "^19.0.0",
                "react-scripts": "^5.0.0"
            },
            "main": "/index.js",
            "devDependencies": {}
        }

    - /index.js:
        import React, { StrictMode } from "react";
        import { createRoot } from "react-dom/client";
        import "./styles.css";

        import App from "./App";

        const root = createRoot(document.getElementById("root"));
        root.render(
            <StrictMode>
                <App />
            </StrictMode>
        );

    - /App.js:
        export default function App() {
            return <h1>Hello world</h1>
        }

    - /public/index.html:
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
            </head>
            <body>
                <div id="root"></div>
            </body>
        </html>
    `.trim()

const iconsPrompt = `
    Icons:
    - You can ONLY use icons from the lucide-react library from this specific list:
      
      • AlertCircle
      • AlertTriangle  
      • ArrowDown
      • ArrowLeft
      • ArrowRight
      • ArrowUp
      • Bell
      • Calendar
      • Camera
      • Check
      • CheckCircle2
      • Circle
      • Clock
      • Download
      • Edit
      • Heart
      • Home
      • Image
      • LayoutDashboard
      • Mail
      • Menu
      • Minus
      • Play
      • Plus
      • Rocket
      • Search
      • Settings
      • Shield
      • Smile
      • Star
      • Trash
      • Upload
      • User
      • Users
      • X

    - NEVER use other lucide-react icons that are not in this list.
    - If you need an icon that is not in this list, you must design it as a custom SVG.
    - For example, you can import an icon as import { Heart } from "lucide-react" and use it in JSX as <Heart className="" />.
    - For unavailable icons, create a custom SVG component with the same style and structure.
    `.trim()

export async function POST(req: Request) {
  const { id, messages }: { id: Id<"chats">; messages: UIMessage[]; } = await req.json();

  const result = streamText({
    // model: openrouter('x-ai/grok-4-fast:free'),
    model: openrouter('google/gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: `
You are a web platform consultant helping users define their React-based web application needs. Your goal is to gather key information through natural conversation.

INFORMATION TO DISCOVER:
- Business status: existing business, startup idea, or exploring options
- Business type: e-commerce, SaaS, service-based, marketplace, content platform, etc.
- Industry/niche: specific market or sector they operate in
- Target audience: demographics, business size, geographic location, tech-savviness
- Platform purpose: lead generation, sales, customer service, content sharing, community building
- Key features needed: user accounts, content management, booking system, search functionality, etc.
- Design preferences: modern/minimalist, corporate/professional, creative/artistic, mobile-first
- Technical requirements: scalability expectations, performance needs, browser compatibility
- Competition: who they're competing against or inspired by
- Content structure: what pages/sections the platform needs
- Image requirements: if they want images, they must provide URLs (inform them of this requirement)

IMPORTANT LIMITATIONS TO COMMUNICATE:
- No third-party integrations available (no payment processors, APIs, external services)
- All functionality must be self-contained within the React application
- For images: users must provide direct URLs to images they want to use
- No backend services - front-end only solutions

CONVERSATION GUIDELINES:
- Keep responses to 1 sentence maximum
- Ask ONE focused question at a time
- Use conversational, friendly tone
- Build on their previous answers
- Clearly explain limitations when relevant (especially regarding integrations and images)
- Avoid overwhelming with technical jargon
- Progress naturally through discovery
- Show genuine interest in their business goals
- When they mention payment processing, external APIs, or third-party services, politely explain these aren't available

START by asking what brings them here today - whether they have an existing business needing a platform or are exploring a new venture.

Once you have gathered enough information about their business needs, use the displayProjectSummary tool to show them a comprehensive summary of their platform requirements.
Once the user is happy with the summary, use the generateCode tool to generate the code for the platform.
`
    ,
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
              model: openrouter('x-ai/grok-4-fast'),
              // model: openrouter('google/gemini-2.5-flash'),
              system:
                `
You are a web developer. You can only generate code in React and tailwindcss.

Never consider the /src folder under the root folder.

Create components in the /components folder.

The root component is /App.js.

${defaultFilesPrompt}

${iconsPrompt}
            `,
              prompt: prompt,
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