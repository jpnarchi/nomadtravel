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

const webSearchTool = anthropic.tools.webSearch_20250305({
    maxUses: 5,
});

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

const http = httpRouter();

// Helper function to get today's date in YYYY-MM-DD format
const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

        // Helper to compress messages and filter heavy tool results
        function compressMessages(messages: UIMessage[]): UIMessage[] {
            return messages.map(msg => {
                if (msg.role === 'assistant') {
                    return {
                        ...msg,
                        parts: msg.parts.map((part: any) => {
                            // Filter out heavy tool results, keep only success status
                            if (part.type?.startsWith('tool-') && part.output) {
                                const output = part.output;
                                // Keep only success status for large outputs
                                if (typeof output === 'string' && output.length > 500) {
                                    return {
                                        ...part,
                                        output: { success: output.includes('success') }
                                    } as any;
                                }
                                // For objects, simplify to just success field
                                if (typeof output === 'object' && output !== null && Object.keys(output).length > 2) {
                                    return {
                                        ...part,
                                        output: { success: output.success !== false }
                                    } as any;
                                }
                            }
                            return part;
                        })
                    } as UIMessage;
                }
                return msg;
            });
        }

        // Take last 3 messages (reduced from 6) and compress them
        const messages = compressMessages(allMessages.slice(-3));

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

        // Get current date and user info for context
        const currentDate = getTodayString();
        const userName = identity.name || "User";

        // Detect simple text update tasks to use cheaper model
        const lastUserMessage = allMessages[allMessages.length - 1];
        const userContent = lastUserMessage?.parts
            ?.filter((part: any) => part.type === 'text')
            .map((part: any) => part.text)
            .join(' ')
            .toLowerCase() || '';
        const isSimpleTextUpdate =
            userContent.includes('cambiar') ||
            userContent.includes('actualizar') ||
            userContent.includes('modificar') ||
            userContent.includes('change') ||
            userContent.includes('update') ||
            userContent.includes('edit text');

        const result = streamText({
            // Use cheaper model for simple text updates, more powerful for complex tasks
            model: isSimpleTextUpdate
                ? openrouter('google/gemini-2.5-flash')
                : openrouter('anthropic/claude-haiku-4.5'),
            // model: provider('claude-sonnet-4'),
            // model: anthropic('claude-sonnet-4-5-20250929'),
            messages: convertToModelMessages(messages),
            system: `You are iLovePresentations, an AI for Fabric.js presentations (1920x1080).

User: ${userName} | Date: ${currentDate}

## Communication
- Max 2-3 sentences, no lists/emojis
- Be proactive, make assumptions
- No technical details or file names

## Core Tools
- generateInitialCodebase: Start with template
- readFile: Read slide content
- updateSlideTexts: Update text only (preferred for text changes)
- manageFile: Design changes only (colors, positions, shapes)
- fillImageContainer: Fill image placeholders
- showPreview: Display presentation

## Critical Workflow (SEQUENTIAL - WAIT for each step)
1. generateInitialCodebase → WAIT
2. readFile ALL slides → WAIT for each
3. fillImageContainer for ALL containers → WAIT for each success response
4. updateSlideTexts to replace ALL placeholders → WAIT
5. showPreview ONLY after steps 1-4 complete

## Key Rules
- Execute tools SEQUENTIALLY when dependent
- ALWAYS read slides before updating
- Fill ALL image containers (type: "Group", isImagePlaceholder: true) before preview
- Use updateSlideTexts for text (not manageFile)
- Replace ALL "Lorem Ipsum" and placeholder text
- NEVER call showPreview until ALL images filled and ALL text updated
- Image containers: Look for objects with isImagePlaceholder: true in readFile response

## Adding Slides
- Read 2-3 existing slides first to match design patterns (background, fonts, colors, positions)
- Use insertSlideAtPosition for middle insertions

Files: ${fileNames.slice(0, 15).join(', ')}${fileNames.length > 15 ? '...' : ''}
`.trim(),
            stopWhen: stepCountIs(50),
            maxOutputTokens: 64_000,
            tools: {
                readFile: {
                    description: 'Read slide content. Use BEFORE updating.',
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
                    description: 'Update slide text only. Default for text changes.',
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

                            // Work directly on the CURRENT version without creating a new one
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

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

                            // Save the updated slide in the CURRENT version
                            const updatedContent = JSON.stringify(slideData, null, 2);
                            await ctx.runMutation(api.files.updateByPath, {
                                chatId: id,
                                path,
                                content: updatedContent,
                                version: currentVersion ?? 0
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
                    description: 'Design changes only (colors, positions, shapes). Operations: create, update, delete.',
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

                                    // Work directly on the CURRENT version without creating a new one
                                    await ctx.runMutation(api.files.updateByPath, {
                                        chatId: id,
                                        path,
                                        content,
                                        version: currentVersion ?? 0
                                    });
                                    break;

                                case 'delete':
                                    // Work directly on the CURRENT version without creating a new one
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
                            console.error(`Error in operation ${operation}:`, error);
                            return {
                                success: false,
                                error: `Error ${operation === 'create' ? 'creating' : operation === 'update' ? 'updating' : 'deleting'} ${path}`
                            };
                        }
                    },
                },

                insertSlideAtPosition: {
                    description: 'Insert slide at position, auto-renumber existing slides.',
                    inputSchema: z.object({
                        position: z.number().min(1).describe('Position where to insert the new slide (1 = first slide, 2 = second slide, etc.)'),
                        content: z.string().describe('JSON content of the new slide with Fabric.js structure. Must be valid JSON with version, objects and background'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ position, content, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            // Work directly on the CURRENT version without creating a new one
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
                            console.error(`Error inserting slide at position ${position}:`, error);
                            return {
                                success: false,
                                error: `Error inserting slide at position ${position}`
                            };
                        }
                    },
                },

                generateInitialCodebase: {
                    description: 'Start presentation with template.',
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
                    description: 'Display presentation preview.',
                    inputSchema: z.object({}),
                    execute: async function () {
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                        // Get user info to check version limit
                        const userInfo = await ctx.runQuery(api.users.getVersionLimitInfo, {});
                        const versionLimit = userInfo.limit;

                        // Step 1: Show the current version (this is the snapshot the user will see)
                        const snapshotVersion = currentVersion ?? 0;

                        // Step 2: Check if creating a new version would exceed the limit
                        const newWorkingVersion = snapshotVersion + 1;
                        if (newWorkingVersion > versionLimit) {
                            return {
                                success: false,
                                error: `Version limit exceeded. You have reached the maximum of ${versionLimit} versions for your ${userInfo.plan} plan. Please upgrade your plan to create more versions.`,
                                version: snapshotVersion,
                                limitReached: true,
                                currentPlan: userInfo.plan,
                                versionLimit: versionLimit,
                            };
                        }

                        // Step 3: Create a new working version for future edits
                        // This prevents future changes from overwriting the snapshot
                        await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: snapshotVersion });

                        // Log version consumption
                        const versionsRemaining = versionLimit - newWorkingVersion;
                        console.log(`[VERSION CREATED] Tool: showPreview | Snapshot: v${snapshotVersion} | New working version: v${newWorkingVersion} | Plan: ${userInfo.plan} | Limit: ${versionLimit} | Remaining: ${versionsRemaining > 0 ? versionsRemaining : 0}`);

                        return {
                            success: true,
                            version: snapshotVersion, // Return the snapshot version to display
                            creationTime: new Date().toISOString(),
                        };
                    },
                },

                webSearch: {
                    description: 'Search internet for information.',
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
                    description: 'Read attached file.',
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
                    description: 'Generate AI image.',
                    inputSchema: z.object({
                        prompt: z.string().describe('Prompt to generate the image'),
                        size: z.union([
                            z.literal("1024x1024"),
                            z.literal("1024x1536"),
                            z.literal("1536x1024"),
                        ]).describe('The size of the image to generate. Supported sizes: 1024x1024 (square), 1024x1536 (portrait), 1536x1024 (landscape)'),
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

                fillImageContainer: {
                    description: 'Fill image placeholders with AI-generated images.',
                    inputSchema: z.object({
                        path: z.string().describe('Slide path (e.g., "/slides/slide-1.json")'),
                        imagePrompts: z.array(z.object({
                            containerIndex: z.number().describe('Index of the image placeholder/container object in the objects array (0-based)'),
                            prompt: z.string().describe('Detailed prompt to generate an appropriate image for this container based on slide content and context. Be specific about style, content, mood, and composition.'),
                        })).describe('Array of image containers to fill with their respective prompts'),
                        explanation: z.string().describe('Explanation in 1 to 3 words for user'),
                    }),
                    execute: async function ({ path, imagePrompts, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                            // Read the slide
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });
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

                            // Array to store generated image URLs
                            const generatedImageUrls: string[] = [];

                            // Process each image container
                            for (const { containerIndex, prompt } of imagePrompts) {
                                if (containerIndex < 0 || containerIndex >= slideData.objects.length) {
                                    return {
                                        success: false,
                                        error: `Invalid container index ${containerIndex}. Slide has ${slideData.objects.length} objects.`
                                    };
                                }

                                const container = slideData.objects[containerIndex];

                                // Verify it's an image placeholder (case-insensitive type check)
                                const objType = (container.type || '').toLowerCase();
                                if (!container.isImagePlaceholder || objType !== 'group') {
                                    return {
                                        success: false,
                                        error: `Object at index ${containerIndex} is not an image placeholder container (type: ${container.type}, isImagePlaceholder: ${container.isImagePlaceholder})`
                                    };
                                }

                                // Generate image with Gemini 2.5 Flash Image (Nano Banana) via OpenRouter
                                console.log('[GEMINI IMAGE] Starting generation with prompt:', prompt.substring(0, 100) + '...');

                                const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        model: 'google/gemini-2.5-flash-image-preview',
                                        messages: [
                                            {
                                                role: 'user',
                                                content: prompt
                                            }
                                        ],
                                        modalities: ['image', 'text'],
                                        image_config: {
                                            aspect_ratio: '1:1' // Square format (1024x1024)
                                        }
                                    })
                                });

                                console.log('[GEMINI IMAGE] Response status:', openrouterResponse.status);

                                if (!openrouterResponse.ok) {
                                    const errorText = await openrouterResponse.text();
                                    console.error('[GEMINI IMAGE] API Error:', errorText);
                                    throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`);
                                }

                                const responseData = await openrouterResponse.json();
                                console.log('[GEMINI IMAGE] Response structure:', JSON.stringify(responseData, null, 2).substring(0, 500));

                                // Extract base64 image from response
                                // Gemini returns images as objects: { type: "image_url", url: "data:image/..." } or { type: "image_url", image_url: { url: "..." } }
                                const imageObject = responseData.choices?.[0]?.message?.images?.[0];
                                console.log('[GEMINI IMAGE] Image object extracted:', imageObject);

                                if (!imageObject) {
                                    console.error('[GEMINI IMAGE] Full response:', JSON.stringify(responseData, null, 2));
                                    throw new Error('No image generated in response');
                                }

                                // Extract the actual base64 data from the object
                                let imageData: string;
                                if (typeof imageObject === 'string') {
                                    imageData = imageObject;
                                } else if (imageObject.url) {
                                    imageData = imageObject.url;
                                } else if (imageObject.image_url?.url) {
                                    imageData = imageObject.image_url.url;
                                } else {
                                    console.error('[GEMINI IMAGE] Unknown image object structure:', imageObject);
                                    throw new Error('Could not extract image data from response');
                                }

                                console.log('[GEMINI IMAGE] Base64 data extracted:', imageData.substring(0, 50) + '...');

                                // Convert base64 to Uint8Array
                                // Remove data URL prefix if present (data:image/png;base64,...)
                                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                                const binaryString = atob(base64Data);
                                const uint8Array = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    uint8Array[i] = binaryString.charCodeAt(i);
                                }

                                console.log('[GEMINI IMAGE] Converted to Uint8Array, size:', uint8Array.length);

                                // Upload image to storage
                                const imageUrl = await uploadFileToStorageFromHttpAction(ctx, uint8Array, 'image/png');
                                console.log('[GEMINI IMAGE] Uploaded to storage:', imageUrl);

                                if (!imageUrl) {
                                    return {
                                        success: false,
                                        error: `Failed to upload generated image`
                                    };
                                }

                                // Store the generated image URL
                                generatedImageUrls.push(imageUrl);

                                // Get container properties
                                const placeholderWidth = container.placeholderWidth || 400;
                                const placeholderHeight = container.placeholderHeight || 300;
                                const borderRadius = container.borderRadius || 0;
                                const containerLeft = container.left || 100;
                                const containerTop = container.top || 100;
                                const containerAngle = container.angle || 0;
                                const containerScaleX = container.scaleX || 1;
                                const containerScaleY = container.scaleY || 1;
                                const containerOriginX = container.originX || 'center';
                                const containerOriginY = container.originY || 'center';

                                // Calculate scale to cover the container (like CSS object-fit: cover)
                                // Assume generated image is 1024x1024
                                const imgWidth = 1024;
                                const imgHeight = 1024;
                                const actualContainerWidth = placeholderWidth * containerScaleX;
                                const actualContainerHeight = placeholderHeight * containerScaleY;

                                const scaleX = actualContainerWidth / imgWidth;
                                const scaleY = actualContainerHeight / imgHeight;
                                const scale = Math.max(scaleX, scaleY);

                                // Calculate crop values to center the image
                                const scaledImageWidth = imgWidth * scale;
                                const scaledImageHeight = imgHeight * scale;
                                const cropX = (scaledImageWidth - actualContainerWidth) / (2 * scale);
                                const cropY = (scaledImageHeight - actualContainerHeight) / (2 * scale);

                                // Create clipPath for rounded corners if needed
                                let clipPath = undefined;
                                if (borderRadius > 0) {
                                    const clipBorderRadius = borderRadius / scale;
                                    clipPath = {
                                        type: 'rect',
                                        width: imgWidth - (cropX * 2),
                                        height: imgHeight - (cropY * 2),
                                        rx: clipBorderRadius,
                                        ry: clipBorderRadius,
                                        left: -(imgWidth - (cropX * 2)) / 2,
                                        top: -(imgHeight - (cropY * 2)) / 2,
                                        originX: 'left',
                                        originY: 'top',
                                    };
                                }

                                // Replace container with image
                                slideData.objects[containerIndex] = {
                                    type: 'image',
                                    left: containerLeft,
                                    top: containerTop,
                                    angle: containerAngle,
                                    originX: containerOriginX,
                                    originY: containerOriginY,
                                    scaleX: scale,
                                    scaleY: scale,
                                    cropX: cropX,
                                    cropY: cropY,
                                    width: imgWidth - (cropX * 2),
                                    height: imgHeight - (cropY * 2),
                                    src: imageUrl,
                                    clipPath: clipPath,
                                    isImageContainer: true,
                                    borderRadius: borderRadius,
                                    selectable: true,
                                    evented: true,
                                    hasControls: true,
                                    hasBorders: true,
                                    crossOrigin: 'anonymous',
                                };
                            }

                            // Save the updated slide
                            const updatedContent = JSON.stringify(slideData, null, 2);
                            await ctx.runMutation(api.files.updateByPath, {
                                chatId: id,
                                path,
                                content: updatedContent,
                                version: currentVersion ?? 0
                            });

                            return {
                                success: true,
                                message: explanation,
                                imagesFilled: imagePrompts.length,
                                imageUrls: generatedImageUrls
                            };
                        } catch (error) {
                            console.error(`Error filling image containers in ${path}:`, error);
                            return {
                                success: false,
                                error: `Error filling image containers: ${error instanceof Error ? error.message : 'Unknown error'}`
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

// Stripe webhook endpoint
http.route({
    path: "/stripe",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return new Response("No signature", { status: 400 });
        }

        const body = await request.text();

        const result = await ctx.runAction(internal.stripe.fulfill, {
            signature,
            payload: body,
        });

        if (result.success) {
            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } else {
            return new Response(JSON.stringify({ error: result.error }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
    }),
});

export default http;