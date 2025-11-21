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

// Slide limit constants by plan
const SLIDE_LIMITS = {
    free: 7,
    pro: 25,
    premium: 100,
    ultra: 1000,
} as const;

// Helper function to get slide limit for a user plan
const getSlideLimit = (plan?: string): number => {
    switch (plan) {
        case "free":
            return SLIDE_LIMITS.free;
        case "pro":
            return SLIDE_LIMITS.pro;
        case "premium":
            return SLIDE_LIMITS.premium;
        case "ultra":
            return SLIDE_LIMITS.ultra;
        default:
            return SLIDE_LIMITS.free;
    }
};

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

        const requestBody = await req.json();
        const { id, messages: allMessages, templateSource: bodyTemplateSource }: { id: Id<"chats">; messages: UIMessage[]; templateSource?: 'default' | 'my-templates' } = requestBody;

        // Extract templateSource from header (preferred) or body (fallback)
        const headerTemplateSource = req.headers.get('X-Template-Source') as 'default' | 'my-templates' | null;
        const templateSource = headerTemplateSource || bodyTemplateSource || 'default';

        console.log('=== TEMPLATE SOURCE DEBUG ===');
        console.log('[HTTP] Request body keys:', Object.keys(requestBody));
        console.log('[HTTP] Header X-Template-Source:', headerTemplateSource);
        console.log('[HTTP] Body templateSource:', bodyTemplateSource);
        console.log('[HTTP] FINAL templateSource being used:', templateSource);
        console.log('[HTTP] Will call query:', templateSource === 'my-templates' ? 'getUserTemplates' : 'getAdminTemplates');
        console.log('=============================');

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

        // Get templates based on templateSource selection
        const templates = templateSource === 'my-templates'
            ? await ctx.runQuery(api.templates.getUserTemplates, {})
            : await ctx.runQuery(api.templates.getAdminTemplates, {});

        console.log('[HTTP] Template source:', templateSource);
        console.log('[HTTP] Templates received:', templates.length);
        console.log('[HTTP] Template names:', templates.map(t => t.name));

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
            ${templates.length === 0 ? '\n⚠️ IMPORTANT: No templates available. Inform the user that they need to create templates first before creating presentations. You cannot use generateInitialCodebase until templates are available.\n' : ''}

            ## Communication
            - Max 2-3 sentences, no lists/emojis
            - Be proactive, make assumptions
            - No technical details or file names

            ## Core Tools
            - generateInitialCodebase: Start with template${templates.length === 0 ? ' (UNAVAILABLE - no templates)' : ''}
            - readFile: Read slide content
            - updateSlideTexts: Update text only (preferred for text changes)
            - manageFile: Design changes only (colors, positions, shapes)
            - fillImageContainer: Fill image placeholders
            - deleteSlide: Remove excess slides
            - showPreview: Display presentation
            
            ## Critical Workflow (SEQUENTIAL - WAIT for each step)
            1. generateInitialCodebase → WAIT
            2. **MANDATORY SLIDE COUNT CHECK**:
               - Count total slides in template
               - IF template has MORE slides than user requested:
                 * deleteSlide for EACH excess slide (e.g., if user wants 5 slides but template has 7, delete 2 slides)
                 * WAIT for each deletion to complete
            3. readFile ALL remaining slides → WAIT for each
            4. MANDATORY IMAGE CHECK:
               - Search EVERY slide for image containers (objects with isImagePlaceholder: true OR type: "Group" with image placeholder properties)
               - IF ANY image containers found on ANY slide:
                 * fillImageContainer for EVERY SINGLE container across ALL slides → WAIT for each success response
                 * Do NOT proceed until ALL containers are filled
            5. updateSlideTexts to replace ALL placeholders → WAIT
            6. showPreview ONLY after all steps complete AND all images filled
            
            ## Key Rules
            - Execute tools SEQUENTIALLY when dependent
            - **MANDATORY**: ALWAYS delete excess slides if template has more than user requested
            - ALWAYS read slides before updating
            - **MANDATORY**: Search for and fill ALL image containers (isImagePlaceholder: true) before ANY preview
            - **NEVER skip fillImageContainer** if containers exist - this is REQUIRED
            - ONLY use fillImageContainer when objects have isImagePlaceholder: true
            - Use updateSlideTexts for text (not manageFile)
            - Replace ALL "Lorem Ipsum" and placeholder text
            - BEFORE showPreview: Verify checklist:
              * ✓ Correct number of slides (deleted excess if needed)
              * ✓ ALL slides read
              * ✓ ALL image containers identified and filled
              * ✓ NO placeholder text remains
              * ✓ NO unfilled image containers (isImagePlaceholder: true) exist
            - Image containers detection: Look for objects with isImagePlaceholder: true OR type: "Group" with placeholder properties in readFile response
            
            ## Adding Slides
            - Read 2-3 existing slides first to match design patterns (background, fonts, colors, positions)
            - Use insertSlideAtPosition for middle insertions
            - After adding slides, check NEW slides for image containers and fill them
            
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

                                    // Validate slide limit before creating
                                    if (path.startsWith('/slides/') && path.endsWith('.json')) {
                                        const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });
                                        const slideCount = Object.keys(allFiles).filter(p =>
                                            p.startsWith('/slides/') && p.endsWith('.json')
                                        ).length;

                                        // Get user plan
                                        const userInfo = await ctx.runQuery(api.users.getUserInfo, {});
                                        const userPlan = userInfo?.plan || "free";
                                        const slideLimit = getSlideLimit(userPlan);

                                        if (slideCount >= slideLimit) {
                                            return {
                                                success: false,
                                                error: `Slide limit reached. Maximum ${slideLimit} slides for ${userPlan} plan. Please upgrade to create more slides.`,
                                                limitReached: true,
                                                currentPlan: userPlan,
                                                slideLimit: slideLimit,
                                                currentSlides: slideCount
                                            };
                                        }
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

                            // Validate slide limit before inserting
                            const slideCount = slidePaths.length;
                            const userInfo = await ctx.runQuery(api.users.getUserInfo, {});
                            const userPlan = userInfo?.plan || "free";
                            const slideLimit = getSlideLimit(userPlan);

                            if (slideCount >= slideLimit) {
                                return {
                                    success: false,
                                    error: `Slide limit reached. Maximum ${slideLimit} slides for ${userPlan} plan. Please upgrade to create more slides.`,
                                    limitReached: true,
                                    currentPlan: userPlan,
                                    slideLimit: slideLimit,
                                    currentSlides: slideCount
                                };
                            }

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
                        templateName: templates.length > 0
                            ? z.union(
                                templates.map(template =>
                                    z.literal(template.name).describe(template.description)
                                ) as [any, ...any[]]
                            )
                            : z.string().describe('No templates available'),
                    }),
                    execute: async function ({ templateName }: any) {
                        // Check if templates are available
                        if (templates.length === 0) {
                            return {
                                success: false,
                                error: 'No templates available. Please create templates first or switch to "Default Templates" if you are using "My Templates".',
                                noTemplates: true
                            };
                        }

                        // get current version
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });

                        // delete files in version if any
                        await ctx.runMutation(api.files.deleteFilesInVersion, { chatId: id, version: currentVersion ?? 0 });

                        // get template files
                        const templateFiles = await ctx.runQuery(api.templates.getFiles, { name: templateName });

                        // Count slides in template
                        const templateSlideCount = templateFiles.filter(file =>
                            file.path.startsWith('/slides/') && file.path.endsWith('.json')
                        ).length;

                        // Validate slide limit
                        const userInfo = await ctx.runQuery(api.users.getUserInfo, {});
                        const userPlan = userInfo?.plan || "free";
                        const slideLimit = getSlideLimit(userPlan);

                        if (templateSlideCount > slideLimit) {
                            return {
                                success: false,
                                error: `This template has ${templateSlideCount} slides, but your ${userPlan} plan allows maximum ${slideLimit} slides. Please upgrade or choose a smaller template.`,
                                limitReached: true,
                                currentPlan: userPlan,
                                slideLimit: slideLimit,
                                templateSlides: templateSlideCount
                            };
                        }

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
                            containerIndex: z.number().describe('Index of the image placeholder/container'),
                            prompt: z.string().describe('Detailed prompt to generate image'),
                        })),
                        explanation: z.string().describe('Explanation in 1 to 3 words'),
                    }),
                    execute: async function ({ path, imagePrompts, explanation }: any) {
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

                            const slideData = JSON.parse(fileContent);

                            if (!slideData.objects || !Array.isArray(slideData.objects)) {
                                return {
                                    success: false,
                                    error: `Invalid slide structure in ${path}`
                                };
                            }

                            // Arrays para tracking de resultados
                            const results = {
                                successful: [] as { index: number, url: string }[],
                                failed: [] as { index: number, error: string }[]
                            };

                            // Procesar cada contenedor individualmente
                            for (const { containerIndex, prompt } of imagePrompts) {
                                try {
                                    // Validar índice
                                    if (containerIndex < 0 || containerIndex >= slideData.objects.length) {
                                        results.failed.push({
                                            index: containerIndex,
                                            error: `Invalid index (slide has ${slideData.objects.length} objects)`
                                        });
                                        continue; // Continuar con la siguiente imagen
                                    }

                                    const container = slideData.objects[containerIndex];

                                    // Verificar que sea un placeholder
                                    const objType = (container.type || '').toLowerCase();
                                    if (!container.isImagePlaceholder || objType !== 'group') {
                                        results.failed.push({
                                            index: containerIndex,
                                            error: `Not an image placeholder (type: ${container.type})`
                                        });
                                        continue;
                                    }

                                    console.log(`[GEMINI IMAGE] Generating for container ${containerIndex}:`, prompt.substring(0, 100));

                                    // Generar imagen
                                    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            model: 'google/gemini-2.5-flash-image-preview',
                                            messages: [{ role: 'user', content: prompt }],
                                            modalities: ['image', 'text'],
                                            image_config: { aspect_ratio: '1:1' }
                                        })
                                    });

                                    if (!openrouterResponse.ok) {
                                        const errorText = await openrouterResponse.text();
                                        console.error(`[GEMINI IMAGE] API Error for container ${containerIndex}:`, errorText);
                                        results.failed.push({
                                            index: containerIndex,
                                            error: `API error: ${openrouterResponse.status}`
                                        });
                                        continue;
                                    }

                                    const responseData = await openrouterResponse.json();
                                    const imageObject = responseData.choices?.[0]?.message?.images?.[0];

                                    if (!imageObject) {
                                        console.error(`[GEMINI IMAGE] No image in response for container ${containerIndex}`);
                                        results.failed.push({
                                            index: containerIndex,
                                            error: 'No image generated'
                                        });
                                        continue;
                                    }

                                    // Extraer base64
                                    let imageData: string;
                                    if (typeof imageObject === 'string') {
                                        imageData = imageObject;
                                    } else if (imageObject.url) {
                                        imageData = imageObject.url;
                                    } else if (imageObject.image_url?.url) {
                                        imageData = imageObject.image_url.url;
                                    } else {
                                        results.failed.push({
                                            index: containerIndex,
                                            error: 'Could not extract image data'
                                        });
                                        continue;
                                    }

                                    // Convertir a Uint8Array
                                    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                                    const binaryString = atob(base64Data);
                                    const uint8Array = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        uint8Array[i] = binaryString.charCodeAt(i);
                                    }

                                    // Upload a storage
                                    const imageUrl = await uploadFileToStorageFromHttpAction(ctx, uint8Array, 'image/png');

                                    if (!imageUrl) {
                                        results.failed.push({
                                            index: containerIndex,
                                            error: 'Failed to upload to storage'
                                        });
                                        continue;
                                    }

                                    console.log(`[GEMINI IMAGE] Success for container ${containerIndex}:`, imageUrl);

                                    // Guardar URL exitosa
                                    results.successful.push({ index: containerIndex, url: imageUrl });

                                    // Actualizar el slide data con la imagen
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

                                    const imgWidth = 1024;
                                    const imgHeight = 1024;
                                    const actualContainerWidth = placeholderWidth * containerScaleX;
                                    const actualContainerHeight = placeholderHeight * containerScaleY;

                                    const scaleX = actualContainerWidth / imgWidth;
                                    const scaleY = actualContainerHeight / imgHeight;
                                    const scale = Math.max(scaleX, scaleY);

                                    const scaledImageWidth = imgWidth * scale;
                                    const scaledImageHeight = imgHeight * scale;
                                    const cropX = (scaledImageWidth - actualContainerWidth) / (2 * scale);
                                    const cropY = (scaledImageHeight - actualContainerHeight) / (2 * scale);

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

                                } catch (error) {
                                    console.error(`[GEMINI IMAGE] Error processing container ${containerIndex}:`, error);
                                    results.failed.push({
                                        index: containerIndex,
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                }
                            }

                            // Guardar el slide actualizado (incluso con solo algunas imágenes exitosas)
                            const updatedContent = JSON.stringify(slideData, null, 2);
                            await ctx.runMutation(api.files.updateByPath, {
                                chatId: id,
                                path,
                                content: updatedContent,
                                version: currentVersion ?? 0
                            });

                            // Retornar resultados detallados
                            const totalProcessed = imagePrompts.length;
                            const successCount = results.successful.length;
                            const failCount = results.failed.length;

                            return {
                                success: successCount > 0, // Success si al menos una imagen funcionó
                                message: explanation,
                                imagesFilled: successCount,
                                imagesRequested: totalProcessed,
                                imagesFailed: failCount,
                                imageUrls: results.successful.map(r => r.url),
                                failedContainers: results.failed,
                                partialSuccess: successCount > 0 && failCount > 0
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
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization, User-Agent, X-Template-Source",
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