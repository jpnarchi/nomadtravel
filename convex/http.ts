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
You are an expert at generating contextual quick replies for a chat with Astri, an assistant that helps create professional presentations with Fabric.js step by step.

CONVERSATION CONTEXT:
${messages.join('\n\n')}

ASTRI'S CAPABILITIES:
- Create impactful presentations with Fabric.js
- Design slides with texts, shapes, images
- Search for information on the internet (businesses, references, data)
- Read files that the user uploads
- Generate images with AI
- Make changes and visual improvements to slides

YOUR TASK:
Generate exactly 3 suggestions (maximum 40 characters each) that are:

1. **Natural responses** that a real user would write
2. **Logical next steps** in the current conversation
3. **Concrete actions** related to what Astri can do
4. **Varied** - mix different types (confirm, ask, request action)

STRICT RULES:
❌ DO NOT suggest "Thanks" or unnecessary courtesies
❌ DO NOT suggest impossible actions (send emails, connect databases, integrations)
❌ DO NOT suggest "View page" or "Open link"
❌ DO NOT mention anything technical (code, files, technical names)
✅ DO suggest next project steps
✅ DO suggest web searches if relevant
✅ DO suggest visual or design changes
✅ DO suggest adding new sections or elements

GOOD EXAMPLES:
- If Astri asked something → "Yes", "No", "Sure"
- If showed a presentation → "Change color", "Make bigger", "Add text"
- If finished something → "Add slide", "What's next?", "Search it"
- If mentioned a topic → "Search it", "I have logo", "Give ideas"

BAD EXAMPLES:
- "Thanks" (too generic)
- "View code" (too technical)
- "Connect DB" (out of scope, this is only for presentations)
- "Edit JSON" (too technical)

Generate the 3 most useful and natural suggestions for THIS specific moment in the conversation.
Use simple and conversational language, as if you were the user responding.
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
Generate a title for this conversation, it should be 1 to 3 words:

Messages: "${messages.join('\n\n')}"

Make the title relevant to the conversation.
`.trim(),
            schema: z.object({
                title: z.string().describe('The conversation title in 1 to 3 words')
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

        // Take last 6 messages
        const messages = allMessages.slice(-6);

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

        const templates = await ctx.runQuery(api.templates.getAll, {});

        const result = streamText({
            // model: openrouter('deepseek/deepseek-chat-v3-0324'), 
          model: openrouter('anthropic/claude-haiku-4.5'),
           // model: openrouter('x-ai/grok-4-fast'), very good cheap as fuck
            // model: openrouter('anthropic/claude-sonnet-4.5'),
            // model: provider('claude-sonnet-4'),
            // model: anthropic('claude-sonnet-4-5-20250929'),
            messages: convertToModelMessages(messages),
            system: `
You are iLovePresentations, an assistant for creating professional presentations using Fabric.js (HTML5 canvas library).

## Communication Style
- Maximum 1 sentence per response
- No lists or emojis
- Ask only 1 question at a time
- Never mention technical details or file names
- Always request real data, never use mock data
- CRITICAL: Wait for user response after each question before proceeding

## Core Workflow
1. Ask ONE question → 2. WAIT for response → 3. Process → 4. Update ALL slides with real data → 5. Show preview → 6. Repeat

## Presentation Structure
- Canvas: 1920x1080 (16:9)
- Slides: numbered JSON files (/slides/slide-1.json, slide-2.json, etc.)
- Each slide contains Fabric.js objects (text, images, shapes, etc.)
- Use generateInitialCodebase to start
- Use manageFile for create/update/delete operations
- Use insertSlideAtPosition for middle insertions (auto-renumbers existing slides)

## Template Customization - CRITICAL RULES

### Mandatory Workflow
1. Load template with generateInitialCodebase
2. Ask how many slides needed and WAIT for response
3. Delete excess slides if user wants fewer than template provides
4. Ask for ALL information needed (company name, slogan, services, etc.)
5. IMMEDIATELY after receiving info, update ALL slides:
   - Read every slide with readFile
   - Replace ALL placeholder texts with user's real data
   - Use updateSlideTexts for text-only changes (99% of cases)
   - Verify NO placeholders remain before showing preview
6. Show preview with showPreview

### Text Replacement Rules
- Match original structure and length:
  - Short title (1-5 words) → Short title
  - Long headline (6-15 words) → Long headline
  - Paragraph (20-100 words) → Paragraph of similar length
  - Preserve tone and style
- Never leave placeholder text in ANY slide
- This is automatic - don't wait for user to say "fill all slides"

### Tool Selection for Updates

DEFAULT (99% of cases): Use updateSlideTexts
- When: User wants to change text content only
- Process: readFile → identify text object indices → updateSlideTexts with objectIndex and newText
- Preserves all design automatically

Use manageFile update ONLY when:
- User explicitly requests design changes (colors, sizes, positions, shapes, images, layout)
- User says: "redesign", "change style", "add shape", "make bigger", "change color"

Other operations:
- manageFile create: New slide from scratch
- manageFile delete: Remove slide
- insertSlideAtPosition: Insert in middle (auto-renumbers)

## Design Preservation
When customizing templates:
- ONLY modify the "text" field of text objects
- NEVER change: positions (left/top), sizes, colors, images, shapes unless explicitly requested
- Template design is complete - only update text content

## Default Text Formatting (New Presentations Only)
When creating from scratch (not using templates):
- fontSize: 60 (minimum)
- fontWeight: "bold"
- fontFamily: "Arial"
- textAlign: "center"
- fill: "#ffffff"

## Design Principles for Readability
- Never place text directly over busy images
- Use one of these strategies:
  1. Split layout: Image on one side, text on solid background on other side
  2. Overlay: Full image + semi-transparent rectangle (opacity 0.6-0.8) + text on top
  3. Accent element: Solid background + small decorative image + text with clear space
  4. Top/bottom: Image in one section, text in other with solid background
- Ensure high contrast (white text needs dark background, dark text needs light background)
- Maintain consistent margins (80-100px from edges)
- Typography hierarchy: Title (80-120px bold), Subtitle (40-60px), Body (30-40px)

## Image Handling
- Use public URLs from UploadThing or generateImageTool
- NEVER use base64 images
- NEVER delete existing template images unless explicitly requested
- Preserve all image object properties when updating

## JSON Structure
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "text",
      "left": 100,
      "top": 100,
      "fontSize": 60,
      "text": "Content",
      "fill": "#ffffff",
      "fontFamily": "Arial"
    }
  ],
  "background": "#1a1a1a"
}

Object types: text, i-text, textbox, rect, circle, triangle, line, image, group

Common properties: left, top, width, height, fill, stroke, strokeWidth, opacity, angle, scaleX, scaleY

Text properties: fontSize, fontFamily, fontWeight, textAlign, lineHeight

## Additional Tools
- Web search: Ask permission first, show results, wait for confirmation
- File reading: Use readAttachment when user asks to read a file
- Image generation: Ask if they want to upload or generate with AI, then use generateImageTool

## Verification Checklist Before Preview
- All slides updated? (slide-1, slide-2, slide-3, etc.)
- All placeholders replaced?
- Text lengths match original structure?
- If NO to any, complete missing updates before showing preview

Existing files:
\${fileNames.map(fileName => \`- \${fileName}\`).join('\\n')}
`.trim(),
            stopWhen: stepCountIs(50),
            maxOutputTokens: 64_000,
            tools: {
                readFile: {
                    description: 'Read the current content of a specific presentation file. Use this BEFORE updating a file to get its complete content.',
                    inputSchema: z.object({
                        path: z.string().describe('Path of the file to read (e.g.: "/slides/slide-1.json")'),
                    }),
                    execute: async function ({ path }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

                            const fileContent = allFiles[path];
                            if (!fileContent) {
                                return {
                                    success: false,
                                    error: `File not found: ${path}`
                                };
                            }

                            return {
                                success: true,
                                path: path,
                                content: fileContent
                            };
                        } catch (error) {
                            console.error(`Error reading file ${path}:`, error);
                            return {
                                success: false,
                                error: `Error reading ${path}`
                            };
                        }
                    },
                },

                updateSlideTexts: {
                    description: '⚡ PRIMARY TOOL for updating slides. Use this to update text content (titles, names, descriptions, etc.) without touching design. This is the DEFAULT choice unless user explicitly asks for design changes (colors, sizes, positions, shapes). ALWAYS prefer this over manageFile for text-only updates.',
                    inputSchema: z.object({
                        path: z.string().describe('Slide path (e.g., "/slides/slide-1.json")'),
                        textUpdates: z.array(z.object({
                            objectIndex: z.number().describe('Index of the text object in the objects array (0-based)'),
                            newText: z.string().describe('New text content')
                        })).describe('Array of text updates with object index and new text'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ path, textUpdates, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            // Create new version BEFORE making any changes to preserve the previous version
                            await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                            const newVersion = (currentVersion ?? 0) + 1;

                            // Now get files from the NEW version
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: newVersion });

                            const fileContent = allFiles[path];
                            if (!fileContent) {
                                return {
                                    success: false,
                                    error: `File not found: ${path}`
                                };
                            }

                            // Parse the slide JSON
                            const slideData = JSON.parse(fileContent);

                            if (!slideData.objects || !Array.isArray(slideData.objects)) {
                                return {
                                    success: false,
                                    error: `Invalid slide structure in ${path}`
                                };
                            }

                            // Apply text updates
                            for (const update of textUpdates) {
                                const { objectIndex, newText } = update;

                                if (objectIndex < 0 || objectIndex >= slideData.objects.length) {
                                    return {
                                        success: false,
                                        error: `Invalid object index ${objectIndex}. Slide has ${slideData.objects.length} objects.`
                                    };
                                }

                                const obj = slideData.objects[objectIndex];

                                // Verify it's a text object (case-insensitive check)
                                const objType = (obj.type || '').toLowerCase();
                                if (!['text', 'i-text', 'textbox', 'itext'].includes(objType)) {
                                    return {
                                        success: false,
                                        error: `Object at index ${objectIndex} is type "${obj.type}", not a text object`
                                    };
                                }

                                // Update only the text property
                                slideData.objects[objectIndex].text = newText;
                            }

                            // Save the updated slide in the NEW version
                            const updatedContent = JSON.stringify(slideData, null, 2);
                            await ctx.runMutation(api.files.updateByPath, {
                                chatId: id,
                                path,
                                content: updatedContent,
                                version: newVersion
                            });

                            return {
                                success: true,
                                message: explanation,
                                textsUpdated: textUpdates.length
                            };
                        } catch (error) {
                            console.error(`Error updating texts in ${path}:`, error);
                            return {
                                success: false,
                                error: `Error updating texts in ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    },
                },

                manageFile: {
                    description: '🎨 DESIGN TOOL for slides. Use ONLY when user explicitly requests DESIGN changes (colors, sizes, positions, add/remove shapes/images). DO NOT use for simple text updates - use updateSlideTexts instead. Operations: create (new slide), update (design changes), delete (remove slide).',
                    inputSchema: z.object({
                        operation: z.enum(['create', 'update', 'delete']).describe('Operation type: create (new slide), update (modify existing slide), delete (remove slide)'),
                        path: z.string().describe('Slide path. MUST follow format: "/slides/slide-1.json", "/slides/slide-2.json", etc. Always starts with /slides/ and ends with .json'),
                        content: z.string().optional().describe('JSON content of the slide with Fabric.js structure (required for create and update). Must be valid JSON with version, objects and background'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ operation, path, content, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            switch (operation) {
                                case 'create':
                                    if (!content) {
                                        return {
                                            success: false,
                                            error: 'Content is required to create a file'
                                        };
                                    }
                                    // For create, we still use current version (no need to create new version yet)
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
                                            error: 'Content is required to update a file'
                                        };
                                    }

                                    // Create new version BEFORE updating to preserve the previous version
                                    await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                                    const newVersion = (currentVersion ?? 0) + 1;

                                    await ctx.runMutation(api.files.updateByPath, {
                                        chatId: id,
                                        path,
                                        content,
                                        version: newVersion
                                    });
                                    break;

                                case 'delete':
                                    // For delete, we also create new version to preserve history
                                    await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                                    const newVersionDelete = (currentVersion ?? 0) + 1;

                                    await ctx.runMutation(api.files.deleteByPath, {
                                        chatId: id,
                                        path,
                                        version: newVersionDelete
                                    });
                                    break;
                            }

                            return {
                                success: true,
                                message: explanation
                            };
                        } catch (error) {
                            console.error(`Error in operation ${operation}:`, error);
                            return {
                                success: false,
                                error: `Error ${operation === 'create' ? 'creating' : operation === 'update' ? 'updating' : 'deleting'} ${path}`
                            };
                        }
                    },
                },

                insertSlideAtPosition: {
                    description: 'Insert a new slide at a specific position in the presentation, automatically renumbering existing slides. Use this when the user asks to add a slide in the middle of the presentation.',
                    inputSchema: z.object({
                        position: z.number().min(1).describe('Position where to insert the new slide (1 = first slide, 2 = second slide, etc.)'),
                        content: z.string().describe('JSON content of the new slide with Fabric.js structure. Must be valid JSON with version, objects and background'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ position, content, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            // Create new version BEFORE making any changes to preserve the previous version
                            await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                            const newVersion = (currentVersion ?? 0) + 1;

                            // Now get files from the NEW version
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: newVersion });

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
                                    error: 'Position must be greater than or equal to 1'
                                };
                            }

                            if (position > slidePaths.length + 1) {
                                return {
                                    success: false,
                                    error: `Position ${position} is greater than the number of existing slides (${slidePaths.length}). Use position ${slidePaths.length + 1} to add at the end.`
                                };
                            }

                            // If inserting at the end, just create the new slide
                            if (position > slidePaths.length) {
                                const newPath = `/slides/slide-${position}.json`;
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content,
                                    version: newVersion
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
                                    version: newVersion
                                });

                                // Create with new name
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content: allFiles[oldPath],
                                    version: newVersion
                                });
                            }

                            // Now create the new slide at the desired position
                            const newPath = `/slides/slide-${position}.json`;
                            await ctx.runMutation(api.files.create, {
                                chatId: id,
                                path: newPath,
                                content,
                                version: newVersion
                            });

                            return {
                                success: true,
                                message: explanation,
                                slideNumber: position,
                                slidesRenumbered: slidesToRenumber.length
                            };
                        } catch (error) {
                            console.error(`Error inserting slide at position ${position}:`, error);
                            return {
                                success: false,
                                error: `Error inserting slide at position ${position}`
                            };
                        }
                    },
                },

                generateInitialCodebase: {
                    description: 'Generate the project with initial files.',
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
                        const message = `Presentation "${templateName}" started successfully`;
                        const filesCreated = Object.keys(files).length;
                        return {
                            success: true,
                            message: message,
                            filesCreated: filesCreated,
                        };
                    },
                },

                showPreview: {
                    description: 'Show project preview. Note: A new version is automatically created when changes are made, so this tool just shows the current version without creating a new one.',
                    inputSchema: z.object({}),
                    execute: async function () {
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                        // Simply return the current version - no need to create a new one since
                        // the modification tools (updateSlideTexts, manageFile, insertSlideAtPosition)
                        // already create new versions before making changes
                        return {
                            success: true,
                            version: currentVersion,
                            creationTime: new Date().toISOString(),
                        };
                    },
                },

                webSearch: {
                    description: 'Search the internet for relevant information.',
                    inputSchema: z.object({
                        query: z.string().describe('The query to perform on the internet'),
                    }),
                    execute: async function ({ query }: any) {
                        try {
                            const { text } = await generateText({
                                model: anthropic('claude-sonnet-4-20250514'),
                                prompt: `Search the internet: ${query}`,
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
                                message: `Error searching the internet: ${query}`
                            };
                        }
                    },
                },

                readAttachment: {
                    description: 'Read an attached file to get relevant information.',
                    inputSchema: z.object({
                        question: z.string().describe('Question you need to answer from the attached file'),
                        url: z.string().describe('URL of the attached file to read'),
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
                        ]).describe('File type'),
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
                                message: `Error reading attached file: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    },
                },

                generateImageTool: {
                    description: 'Generate an image with AI (gpt-image-1)',
                    inputSchema: z.object({
                        prompt: z.string().describe('Prompt to generate the image'),
                        size: z.union([
                            z.literal("256x256"),
                            z.literal("512x512"),
                            z.literal("1024x1024"),
                            z.literal("1024x1792"),
                            z.literal("1792x1024"),
                        ]).describe('The size of the image to generate'),
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
                                message: `Image generated successfully`,
                                imageUrl: imageUrl
                            };
                        } catch (error) {
                            console.error('Error generating image:', error);
                            return {
                                success: false,
                                message: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    },
                },
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

export default http;