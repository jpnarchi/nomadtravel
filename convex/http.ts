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

        // Extract slidesCount from header (only for first message)
        const headerSlidesCount = req.headers.get('X-Slides-Count');
        const requestedSlidesCount = headerSlidesCount ? parseInt(headerSlidesCount, 10) : null;

        console.log('=== TEMPLATE SOURCE DEBUG ===');
        console.log('[HTTP] Request body keys:', Object.keys(requestBody));
        console.log('[HTTP] Header X-Template-Source:', headerTemplateSource);
        console.log('[HTTP] Body templateSource:', bodyTemplateSource);
        console.log('[HTTP] FINAL templateSource being used:', templateSource);
        console.log('[HTTP] Will call query:', templateSource === 'my-templates' ? 'getUserTemplates' : 'getAdminTemplates');
        console.log('[HTTP] Header X-Slides-Count:', headerSlidesCount);
        console.log('[HTTP] Requested slides count:', requestedSlidesCount);
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
${requestedSlidesCount ? `Target: ${requestedSlidesCount} slides` : ''}
${templates.length === 0 ? '⚠️ No templates - user must create templates first' : ''}

## Style
Be extremely concise. 1 sentence max per response exlpaining what your doing.  No emojis, no lists, no step-by-step explanations. Only speak when asking questions or confirming completion.

## Critical Rules
- FIRST PRIORITY: After generateInitialCodebase, IMMEDIATELY delete excess slides BEFORE any other operation
- SECOND PRIORITY: ALWAYS GENERATE ALL IMAGES - Never complete a presentation without generating images for ALL placeholders
  - Use replaceImagePlaceholder for EVERY slide with isImagePlaceholder or isImageContainer
  - This is MANDATORY, not optional
  - Never say "presentation complete" without generating images first
- Color contrast: When changing slide or text colors, ALWAYS ensure text color contrasts with background (never same/similar colors). Light backgrounds need dark text, dark backgrounds need light text
- After ANY image operation: ALWAYS call showPreview immediately
- duplicateSlide is FULLY AUTOMATIC: It automatically generates new texts AND images based on contentDescription. Just call duplicateSlide → showPreview (no manual updates needed)
- **Slide Positioning Rules:**
  - "before slide X" → position = X's current position (inserts at X's position, pushes X forward)
  - "after slide X" → position = X's current position + 1
  - "at the end" → position = total slides + 1
  - NEVER delete existing slides when user says "before" or "after" - only insert
  - Example: 5 slides total, "add 2 before slide 5" → insert at position 5, then position 5 again
- **Slide Reordering Rules:**
  - When user says "put/move slide X to/in position Y" → use moveSlide (fromPosition: X, toPosition: Y)
  - When user says "swap slides" or "change order" → use moveSlide
  - NEVER use duplicateSlide + deleteSlide to reorder - always use moveSlide
- Read slides before updating them
- Wait for each tool to complete

## Tools (by purpose)
Content: generateInitialCodebase, readFile (use textOnly: true by default), updateSlideTexts, updateSlideDesign
Structure: duplicateSlide (for new slides), moveSlide (for reordering), insertSlideAtPosition, deleteSlide, manageFile
Data: webSearch, readAttachment, showPreview
Images: replaceImagePlaceholder (unified tool for ALL image placeholder operations)

**Image Tool:**

**replaceImagePlaceholder** - Unified tool for generating and replacing ALL image placeholders
Use when:
- ⚠️ MANDATORY: During initial setup (ALWAYS scan and generate images for ALL placeholders)
- User says "change/replace/update/add the image/photo/picture"
- Slide has placeholders that need content (groups OR image objects)
- NOTE: duplicateSlide now handles images automatically - no need to call this after duplicating
How: Auto-detects placeholder type (group or image), generates image with AI, converts/replaces appropriately
Follow with: showPreview (mandatory)
IMPORTANT: Never complete a presentation creation without using this tool for ALL placeholders

## Workflow

**Initial Setup (MANDATORY SEQUENCE - NEVER SKIP STEPS):**
1. generateInitialCodebase
2. **IMMEDIATELY delete excess slides** (if template has 7 and user wants 5, delete slides 6-7 FIRST)
   - Use deleteSlide for each excess slide
   - Do this BEFORE reading, updating, or generating images
3. Add slides if needed (duplicateSlide with contentDescription for each missing slide)
4. readFile all slides with textOnly: true
5. updateSlideTexts for all content to match user's topic
6. **⚠️ MANDATORY IMAGE GENERATION (CANNOT BE SKIPPED):**
   - readFile each slide (textOnly: false to see full structure)
   - Identify ALL image placeholders (isImagePlaceholder or isImageContainer flags)
   - Use replaceImagePlaceholder for EVERY placeholder found
   - Generate images for ALL slides with placeholders
   - If any slide has placeholders, you MUST generate images
   - NEVER skip this step or say "done" without generating images
7. Final showPreview (only after ALL images are generated)

**Adding New Slides (when user requests):**
- duplicateSlide with detailed contentDescription (automatically generates unique texts + images)
- showPreview (duplicateSlide is fully automatic - no manual updates needed)
- **Position calculation (CRITICAL - follow exactly):**
  1. First, readFile to identify which slide is which (find "thank you slide", "conclusion", etc.)
  2. Calculate position based on the instruction:
     - "before slide X" → position = X (inserts at X, pushes X to X+1)
     - "after slide X" → position = X + 1
  3. For multiple slides with same position instruction, insert at the SAME position repeatedly

- **Real examples:**
  - "add slide before the thank you slide" → readFile to find thank you is slide 5 → position = 5
  - "add 2 slides before thank you slide (slide 5)" → insert position 5, then position 5 again (NOT 5 and 6)
  - "add slide after slide 2" → position = 3
  - "add slide at the end" → position = total slides + 1

- **NEVER delete slides when adding before/after** - only insert

**Reordering Slides (when user wants to change order):**
- Use moveSlide tool (NOT duplicateSlide + delete)
- Examples: "put slide 5 in position 2", "move slide 3 to the end", "swap slides"
- moveSlide handles all renumbering automatically
- showPreview after moving

**Updating Existing Content:**
- readFile slides with textOnly: true (saves tokens)
- updateSlideTexts for content changes
- replaceImagePlaceholder if user requests image changes
- showPreview

Files: ${fileNames.slice(0, 15).join(', ')}${fileNames.length > 15 ? '...' : ''}
`.trim(),
            stopWhen: stepCountIs(50),
            maxOutputTokens: 64_000,
            tools: {
                readFile: {
                    description: 'Read slide content. Use BEFORE updating.',
                    inputSchema: z.object({
                        path: z.string().describe('Path of the file to read (e.g.: "/slides/slide-1.json")'),
                        textOnly: z.boolean().optional().describe('If true, returns only text content (saves tokens). Use false only when you need full slide structure for design changes.'),
                    }),
                    execute: async function ({ path, textOnly }: any) {
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

                            // If textOnly mode, extract just text content
                            if (textOnly) {
                                try {
                                    const slideData = JSON.parse(fileContent);
                                    const texts = slideData.objects
                                        ?.map((obj: any, index: number) => {
                                            const objType = (obj.type || '').toLowerCase();
                                            if (['text', 'i-text', 'textbox', 'itext'].includes(objType)) {
                                                return {
                                                    index,
                                                    text: obj.text || ''
                                                };
                                            }
                                            return null;
                                        })
                                        .filter((t: any) => t !== null) || [];

                                    return {
                                        success: true,
                                        path: path,
                                        textOnly: true,
                                        texts: texts,
                                        background: slideData.background
                                    };
                                } catch (parseError) {
                                    console.error(`Error parsing slide for textOnly mode:`, parseError);
                                    // Fallback to full content if parsing fails
                                }
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
                    description: 'Update slide text content and properties. Use for text changes, colors, fonts, sizes, positions.',
                    inputSchema: z.object({
                        path: z.string().describe('Slide path (e.g., "/slides/slide-1.json")'),
                        textUpdates: z.array(z.object({
                            objectIndex: z.number().describe('Index of the text object in the objects array (0-based)'),
                            newText: z.string().optional().describe('New text content'),
                            properties: z.object({
                                fill: z.string().optional().describe('Text color (hex format like "#00ff00")'),
                                backgroundColor: z.string().optional().describe('Background color for text'),
                                fontSize: z.number().optional().describe('Font size'),
                                fontFamily: z.string().optional().describe('Font family'),
                                fontWeight: z.union([z.string(), z.number()]).optional().describe('Font weight (normal, bold, 100-900)'),
                                fontStyle: z.string().optional().describe('Font style (normal, italic)'),
                                textAlign: z.string().optional().describe('Text alignment (left, center, right)'),
                                lineHeight: z.number().optional().describe('Line height'),
                                charSpacing: z.number().optional().describe('Character spacing'),
                                opacity: z.number().optional().describe('Opacity (0-1)'),
                                left: z.number().optional().describe('X position'),
                                top: z.number().optional().describe('Y position'),
                                scaleX: z.number().optional().describe('Horizontal scale'),
                                scaleY: z.number().optional().describe('Vertical scale'),
                                angle: z.number().optional().describe('Rotation angle in degrees'),
                                stroke: z.string().optional().describe('Stroke/border color'),
                                strokeWidth: z.number().optional().describe('Stroke width'),
                                underline: z.boolean().optional().describe('Underline text'),
                                linethrough: z.boolean().optional().describe('Strikethrough text'),
                                overline: z.boolean().optional().describe('Overline text'),
                            }).optional().describe('Additional properties to update (only include properties you want to change)')
                        })).describe('Array of text updates with object index, new text, and optional properties'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ path, textUpdates, explanation }: any) {
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
                
                            // Apply text updates
                            for (const update of textUpdates) {
                                const { objectIndex, newText, properties } = update;
                
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
                
                                // Update text content if provided
                                if (newText !== undefined) {
                                    slideData.objects[objectIndex].text = newText;
                                }
                
                                // Update additional properties if provided
                                if (properties) {
                                    Object.keys(properties).forEach(key => {
                                        if (properties[key] !== undefined) {
                                            slideData.objects[objectIndex][key] = properties[key];
                                        }
                                    });
                                }
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
                                textsUpdated: textUpdates.length,
                                propertiesUpdated: textUpdates.some((u: any) => u.properties) ? true : false
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
                updateSlideDesign: {
                    description: 'Update slide design properties (colors, backgrounds, positions, sizes). Use this for visual changes without regenerating the entire slide.',
                    inputSchema: z.object({
                        path: z.string().describe('Slide path (e.g., "/slides/slide-1.json")'),
                        backgroundColor: z.string().optional().describe('New background color for the entire slide (hex format like "#000000")'),
                        designUpdates: z.array(z.object({
                            objectIndex: z.number().describe('Index of the object in the objects array (0-based)'),
                            properties: z.object({
                                fill: z.string().optional().describe('Fill color (hex format like "#00ff00")'),
                                stroke: z.string().optional().describe('Stroke/border color'),
                                backgroundColor: z.string().optional().describe('Background color for text objects'),
                                opacity: z.number().optional().describe('Opacity (0-1)'),
                                left: z.number().optional().describe('X position'),
                                top: z.number().optional().describe('Y position'),
                                scaleX: z.number().optional().describe('Horizontal scale'),
                                scaleY: z.number().optional().describe('Vertical scale'),
                                angle: z.number().optional().describe('Rotation angle in degrees'),
                            }).describe('Properties to update (only include properties you want to change)')
                        })).optional().describe('Array of object design updates'),
                        explanation: z.string().describe('Explanation in 1 to 3 words of changes for non-technical users'),
                    }),
                    execute: async function ({ path, backgroundColor, designUpdates, explanation }: any) {
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
                
                            // Update background color if provided
                            if (backgroundColor) {
                                slideData.background = backgroundColor;
                            }
                
                            // Apply design updates to specific objects
                            if (designUpdates && designUpdates.length > 0) {
                                for (const update of designUpdates) {
                                    const { objectIndex, properties } = update;
                
                                    if (objectIndex < 0 || objectIndex >= slideData.objects.length) {
                                        return {
                                            success: false,
                                            error: `Invalid object index ${objectIndex}. Slide has ${slideData.objects.length} objects.`
                                        };
                                    }
                
                                    const obj = slideData.objects[objectIndex];
                
                                    // Update only the specified properties
                                    Object.keys(properties).forEach(key => {
                                        if (properties[key] !== undefined) {
                                            obj[key] = properties[key];
                                        }
                                    });
                                }
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
                                objectsUpdated: designUpdates?.length || 0,
                                backgroundUpdated: !!backgroundColor
                            };
                        } catch (error) {
                            console.error(`Error updating design in ${path}:`, error);
                            return {
                                success: false,
                                error: `Error updating design in ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    },
                },

                duplicateSlide: {
                    description: 'INTELLIGENT tool for adding new slides. Automatically finds the most similar template, duplicates it, generates NEW unique content (texts + images) based on your description. All content is AI-generated and unique - no manual updates needed.',
                    inputSchema: z.object({
                        position: z.number().min(1).describe('Position where to insert the new slide (1-based index). IMPORTANT: To insert BEFORE slide X, use position = X. To insert AFTER slide X, use position = X + 1. Example: If there are 5 slides and you want to add before slide 5, use position = 5 (this will push slide 5 to position 6).'),
                        contentDescription: z.string().describe('Detailed description of what content the new slide should have. Be specific about the topic, purpose, and key elements. This will be used to generate ALL new content automatically.'),
                        explanation: z.string().describe('Explanation in 1 to 3 words for users'),
                    }),
                    execute: async function ({ position, contentDescription, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

                            // Get all existing slide paths
                            const slidePaths = Object.keys(allFiles)
                                .filter(path => path.startsWith('/slides/') && path.endsWith('.json'))
                                .sort((a, b) => {
                                    const numA = parseInt(a.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    const numB = parseInt(b.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    return numA - numB;
                                });

                            if (slidePaths.length === 0) {
                                return {
                                    success: false,
                                    error: 'No existing slides to duplicate. Use generateInitialCodebase first.'
                                };
                            }

                            // Validate slide limit
                            const slideCount = slidePaths.length;
                            const userInfo = await ctx.runQuery(api.users.getUserInfo, {});
                            const userPlan = userInfo?.plan || "free";
                            const slideLimit = getSlideLimit(userPlan);

                            if (slideCount >= slideLimit) {
                                return {
                                    success: false,
                                    error: `Slide limit reached. Maximum ${slideLimit} slides for ${userPlan} plan.`,
                                    limitReached: true,
                                    currentPlan: userPlan,
                                    slideLimit: slideLimit,
                                    currentSlides: slideCount
                                };
                            }

                            // Analyze all slides to find the most similar one
                            const slideAnalysis = [];
                            for (const path of slidePaths) {
                                const slideContent = allFiles[path];
                                const slideData = JSON.parse(slideContent);

                                // Extract text content from slide
                                const texts = slideData.objects
                                    ?.filter((obj: any) => ['text', 'i-text', 'textbox', 'itext'].includes(obj.type?.toLowerCase()))
                                    .map((obj: any) => obj.text || '')
                                    .join(' ') || '';

                                // Count element types
                                const elementCounts = {
                                    texts: slideData.objects?.filter((obj: any) => ['text', 'i-text', 'textbox', 'itext'].includes(obj.type?.toLowerCase())).length || 0,
                                    images: slideData.objects?.filter((obj: any) => obj.type?.toLowerCase() === 'image' || obj.isImagePlaceholder).length || 0,
                                    shapes: slideData.objects?.filter((obj: any) => ['rect', 'circle', 'triangle', 'polygon'].includes(obj.type?.toLowerCase())).length || 0,
                                };

                                slideAnalysis.push({
                                    path,
                                    texts,
                                    elementCounts,
                                    background: slideData.background || '#ffffff'
                                });
                            }

                            // Use AI to determine the most similar slide
                            const { object: selection } = await generateObject({
                                model: openrouter('google/gemini-2.5-flash'),
                                prompt: `You are analyzing presentation slides to find the most similar one to duplicate.

USER WANTS TO CREATE A SLIDE WITH THIS CONTENT:
"${contentDescription}"

EXISTING SLIDES ANALYSIS:
${slideAnalysis.map((s, i) => `
Slide ${i + 1} (${s.path}):
- Text content: ${s.texts.substring(0, 200)}${s.texts.length > 200 ? '...' : ''}
- Elements: ${s.elementCounts.texts} texts, ${s.elementCounts.images} images, ${s.elementCounts.shapes} shapes
- Background: ${s.background}
`).join('\n')}

TASK:
Analyze which existing slide has the most similar:
1. Structure (number and type of elements)
2. Purpose (title slide, content slide, image slide, etc.)
3. Design style (layout, complexity)

Select the slide that would require the LEAST modifications to match the user's content description.

Return the slide number (1-based) that is most similar.`,
                                schema: z.object({
                                    selectedSlideNumber: z.number().min(1).describe('The slide number (1-based) that is most similar'),
                                    reasoning: z.string().describe('Brief explanation of why this slide was selected (1-2 sentences)')
                                }),
                                temperature: 0.3,
                            });

                            const selectedPath = slidePaths[selection.selectedSlideNumber - 1];
                            const selectedContent = allFiles[selectedPath];
                            const duplicatedSlide = JSON.parse(selectedContent);

                            console.log(`[DUPLICATE SLIDE] Selected ${selectedPath} for duplication. Reason: ${selection.reasoning}`);

                            // ===== INTELLIGENT CONTENT GENERATION =====
                            // Step 1: Extract text objects with their current content
                            const textObjects = duplicatedSlide.objects
                                ?.map((obj: any, index: number) => {
                                    const objType = (obj.type || '').toLowerCase();
                                    if (['text', 'i-text', 'textbox', 'itext'].includes(objType)) {
                                        return {
                                            index,
                                            currentText: obj.text || '',
                                            fontSize: obj.fontSize || 20,
                                        };
                                    }
                                    return null;
                                })
                                .filter((t: any) => t !== null) || [];

                            // Step 2: Use AI to generate NEW text content based on contentDescription
                            if (textObjects.length > 0) {
                                console.log(`[DUPLICATE SLIDE] Generating new text content for ${textObjects.length} text objects...`);

                                const { object: newTexts } = await generateObject({
                                    model: openrouter('google/gemini-2.5-flash'),
                                    prompt: `You are creating content for a new presentation slide.

SLIDE PURPOSE:
${contentDescription}

CURRENT SLIDE STRUCTURE:
The slide has ${textObjects.length} text elements with the following roles:
${textObjects.map((t: any, i: number) => `${i + 1}. Text ${i + 1} (fontSize: ${t.fontSize}): "${t.currentText}"`).join('\n')}

TASK:
Generate NEW, UNIQUE content for each text element that matches the slide purpose.
- Larger font sizes (>40) are typically titles/headers
- Medium font sizes (20-40) are subtitles or main points
- Smaller font sizes (<20) are body text or details
- Keep text concise and relevant to the purpose
- Make it professional and impactful

Return an array with exactly ${textObjects.length} new text values.`,
                                    schema: z.object({
                                        texts: z.array(z.string()).length(textObjects.length).describe('Array of new text content for each text element')
                                    }),
                                    temperature: 0.8,
                                });

                                // Step 3: Apply new texts to the duplicated slide
                                textObjects.forEach((textObj: any, i: number) => {
                                    duplicatedSlide.objects[textObj.index].text = newTexts.texts[i];
                                });

                                console.log(`[DUPLICATE SLIDE] Updated ${textObjects.length} text elements with new content`);
                            }

                            // Step 4: Identify and generate NEW images for placeholders
                            const imagePlaceholders = duplicatedSlide.objects
                                ?.map((obj: any, index: number) => {
                                    const objType = (obj.type || '').toLowerCase();
                                    if ((objType === 'group' && obj.isImagePlaceholder === true) ||
                                        (objType === 'image' && (obj.isImagePlaceholder === true || obj.isImageContainer === true))) {
                                        return index;
                                    }
                                    return null;
                                })
                                .filter((idx: any) => idx !== null) || [];

                            if (imagePlaceholders.length > 0) {
                                console.log(`[DUPLICATE SLIDE] Generating ${imagePlaceholders.length} new images...`);

                                // Generate images for each placeholder
                                for (const placeholderIndex of imagePlaceholders) {
                                    try {
                                        const container = duplicatedSlide.objects[placeholderIndex];
                                        const objType = (container.type || '').toLowerCase();

                                        // Create prompt for image based on slide content
                                        const imagePrompt = `Create a professional, high-quality image for a presentation slide about: ${contentDescription}. Make it visually appealing, relevant, and suitable for business/professional presentations.`;

                                        console.log(`[DUPLICATE SLIDE] Generating image ${placeholderIndex + 1}/${imagePlaceholders.length}...`);

                                        // Generate image with Gemini
                                        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                model: 'google/gemini-2.5-flash-image-preview',
                                                messages: [{ role: 'user', content: imagePrompt }],
                                                modalities: ['image', 'text'],
                                                image_config: { aspect_ratio: '1:1' }
                                            })
                                        });

                                        if (openrouterResponse.ok) {
                                            const responseData = await openrouterResponse.json();
                                            const imageObject = responseData.choices?.[0]?.message?.images?.[0];

                                            if (imageObject) {
                                                // Extract base64
                                                let imageData: string;
                                                if (typeof imageObject === 'string') {
                                                    imageData = imageObject;
                                                } else if (imageObject.url) {
                                                    imageData = imageObject.url;
                                                } else if (imageObject.image_url?.url) {
                                                    imageData = imageObject.image_url.url;
                                                } else {
                                                    throw new Error('Could not extract image data');
                                                }

                                                // Convert to Uint8Array
                                                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                                                const binaryString = atob(base64Data);
                                                const uint8Array = new Uint8Array(binaryString.length);
                                                for (let i = 0; i < binaryString.length; i++) {
                                                    uint8Array[i] = binaryString.charCodeAt(i);
                                                }

                                                // Upload to storage
                                                const imageUrl = await uploadFileToStorageFromHttpAction(ctx, uint8Array, 'image/png');

                                                if (imageUrl) {
                                                    // Handle based on placeholder type
                                                    if (objType === 'group' && container.isImagePlaceholder === true) {
                                                        // Convert group placeholder to image object
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

                                                        duplicatedSlide.objects[placeholderIndex] = {
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
                                                    } else {
                                                        // Just replace the URL for image placeholders
                                                        duplicatedSlide.objects[placeholderIndex].src = imageUrl;
                                                    }

                                                    console.log(`[DUPLICATE SLIDE] Successfully generated image for placeholder ${placeholderIndex}`);
                                                }
                                            }
                                        }
                                    } catch (imgError) {
                                        console.error(`[DUPLICATE SLIDE] Error generating image for placeholder ${placeholderIndex}:`, imgError);
                                        // Continue with other images even if one fails
                                    }
                                }

                                console.log(`[DUPLICATE SLIDE] Completed image generation for all placeholders`);
                            }

                            const newSlideContent = JSON.stringify(duplicatedSlide, null, 2);

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
                                    error: `Position ${position} is too high. Use position ${slidePaths.length + 1} to add at the end.`
                                };
                            }

                            // If inserting at the end, just create the new slide
                            if (position > slidePaths.length) {
                                const newPath = `/slides/slide-${position}.json`;
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content: newSlideContent,
                                    version: currentVersion ?? 0
                                });

                                return {
                                    success: true,
                                    message: explanation,
                                    slideNumber: position,
                                    newSlidePath: `/slides/slide-${position}.json`,
                                    duplicatedFrom: selectedPath,
                                    reasoning: selection.reasoning,
                                    textsGenerated: textObjects.length,
                                    imagesGenerated: imagePlaceholders.length,
                                    fullyAutomatic: true
                                };
                            }

                            // Renumber slides from position onwards (in reverse order)
                            const slidesToRenumber = slidePaths.slice(position - 1);

                            for (let i = slidesToRenumber.length - 1; i >= 0; i--) {
                                const oldPath = slidesToRenumber[i];
                                const oldNumber = parseInt(oldPath.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                const newNumber = oldNumber + 1;
                                const newPath = `/slides/slide-${newNumber}.json`;

                                await ctx.runMutation(api.files.deleteByPath, {
                                    chatId: id,
                                    path: oldPath,
                                    version: currentVersion ?? 0
                                });

                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content: allFiles[oldPath],
                                    version: currentVersion ?? 0
                                });
                            }

                            // Create the new slide at the desired position
                            const newPath = `/slides/slide-${position}.json`;
                            await ctx.runMutation(api.files.create, {
                                chatId: id,
                                path: newPath,
                                content: newSlideContent,
                                version: currentVersion ?? 0
                            });

                            return {
                                success: true,
                                message: explanation,
                                slideNumber: position,
                                newSlidePath: newPath,
                                duplicatedFrom: selectedPath,
                                reasoning: selection.reasoning,
                                slidesRenumbered: slidesToRenumber.length,
                                textsGenerated: textObjects.length,
                                imagesGenerated: imagePlaceholders.length,
                                fullyAutomatic: true
                            };

                        } catch (error) {
                            console.error(`Error duplicating slide:`, error);
                            return {
                                success: false,
                                error: `Error duplicating slide: ${error instanceof Error ? error.message : 'Unknown error'}`
                            };
                        }
                    },
                },

                moveSlide: {
                    description: 'Move/reorder an existing slide to a new position. Use this when user wants to change the order of slides (e.g., "put slide 5 in position 2", "move slide 3 to position 1").',
                    inputSchema: z.object({
                        fromPosition: z.number().min(1).describe('Current position of the slide to move (1-based index)'),
                        toPosition: z.number().min(1).describe('Target position where the slide should be moved (1-based index)'),
                        explanation: z.string().describe('Explanation in 1 to 3 words for users'),
                    }),
                    execute: async function ({ fromPosition, toPosition, explanation }: any) {
                        try {
                            const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                            const allFiles = await ctx.runQuery(api.files.getAll, { chatId: id, version: currentVersion ?? 0 });

                            // Get all existing slide paths
                            const slidePaths = Object.keys(allFiles)
                                .filter(path => path.startsWith('/slides/') && path.endsWith('.json'))
                                .sort((a, b) => {
                                    const numA = parseInt(a.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    const numB = parseInt(b.match(/slide-(\d+)\.json$/)?.[1] || '0');
                                    return numA - numB;
                                });

                            if (slidePaths.length === 0) {
                                return {
                                    success: false,
                                    error: 'No slides found to move.'
                                };
                            }

                            // Validate positions
                            if (fromPosition < 1 || fromPosition > slidePaths.length) {
                                return {
                                    success: false,
                                    error: `Invalid fromPosition ${fromPosition}. Must be between 1 and ${slidePaths.length}.`
                                };
                            }

                            if (toPosition < 1 || toPosition > slidePaths.length) {
                                return {
                                    success: false,
                                    error: `Invalid toPosition ${toPosition}. Must be between 1 and ${slidePaths.length}.`
                                };
                            }

                            if (fromPosition === toPosition) {
                                return {
                                    success: true,
                                    message: 'Slide is already at the target position',
                                    slideNumber: fromPosition
                                };
                            }

                            console.log(`[MOVE SLIDE] Moving slide from position ${fromPosition} to position ${toPosition}`);

                            // Create a new array with slides in memory
                            const slides = slidePaths.map(path => ({
                                path,
                                content: allFiles[path]
                            }));

                            // Extract the slide to move
                            const slideToMove = slides[fromPosition - 1];

                            // Remove the slide from its current position
                            slides.splice(fromPosition - 1, 1);

                            // Insert the slide at the new position
                            slides.splice(toPosition - 1, 0, slideToMove);

                            // Delete all existing slides
                            for (const path of slidePaths) {
                                await ctx.runMutation(api.files.deleteByPath, {
                                    chatId: id,
                                    path,
                                    version: currentVersion ?? 0
                                });
                            }

                            // Create all slides in their new positions
                            for (let i = 0; i < slides.length; i++) {
                                const newPath = `/slides/slide-${i + 1}.json`;
                                await ctx.runMutation(api.files.create, {
                                    chatId: id,
                                    path: newPath,
                                    content: slides[i].content,
                                    version: currentVersion ?? 0
                                });
                            }

                            console.log(`[MOVE SLIDE] Successfully moved slide from position ${fromPosition} to position ${toPosition}`);

                            return {
                                success: true,
                                message: explanation,
                                fromPosition: fromPosition,
                                toPosition: toPosition,
                                totalSlides: slides.length
                            };

                        } catch (error) {
                            console.error(`Error moving slide:`, error);
                            return {
                                success: false,
                                error: `Error moving slide: ${error instanceof Error ? error.message : 'Unknown error'}`
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
                    description: 'Start presentation with template. IMPORTANT: After this tool, you MUST follow the complete workflow: delete excess slides → read all slides → update texts → GENERATE ALL IMAGES → showPreview.',
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
                            nextSteps: 'REQUIRED WORKFLOW: Delete excess slides → Read all slides → Update texts → GENERATE ALL IMAGES (use replaceImagePlaceholder for every placeholder) → showPreview'
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

                replaceImagePlaceholder: {
                    description: 'Unified tool to generate and replace ALL image placeholders. Automatically detects and handles both types: (1) Groups marked as placeholders - converts to images, (2) Image objects with placeholder flags - replaces URLs. Always use this when working with image placeholders.',
                    inputSchema: z.object({
                        path: z.string().describe('Slide path (e.g., "/slides/slide-1.json")'),
                        imageUpdates: z.array(z.object({
                            containerIndex: z.number().optional().describe('Index of the placeholder. If not provided, will auto-detect all placeholders'),
                            prompt: z.string().describe('Detailed prompt to generate the new image'),
                        })).describe('Array of image updates. Leave containerIndex empty to auto-detect all placeholders'),
                        explanation: z.string().describe('Explanation in 1 to 3 words'),
                    }),
                    execute: async function ({ path, imageUpdates, explanation }: any) {
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

                            // Find all image placeholders (both groups and images)
                            const imagePlaceholders: number[] = [];
                            slideData.objects.forEach((obj: any, index: number) => {
                                const objType = (obj.type || '').toLowerCase();
                                // Include groups with isImagePlaceholder OR images with placeholder/container flags
                                if ((objType === 'group' && obj.isImagePlaceholder === true) ||
                                    (objType === 'image' && (obj.isImagePlaceholder === true || obj.isImageContainer === true))) {
                                    imagePlaceholders.push(index);
                                }
                            });

                            // Results tracking
                            const results = {
                                successful: [] as { index: number, url: string }[],
                                failed: [] as { index: number, error: string }[]
                            };

                            // Process each image update
                            for (const update of imageUpdates) {
                                try {
                                    let targetIndex = update.containerIndex;

                                    // Auto-detect if no index provided
                                    if (targetIndex === undefined || targetIndex === null) {
                                        if (imagePlaceholders.length === 0) {
                                            results.failed.push({
                                                index: -1,
                                                error: 'No image placeholders found in slide'
                                            });
                                            continue;
                                        }
                                        targetIndex = imagePlaceholders.shift()!;
                                    }

                                    // Validate index
                                    if (targetIndex < 0 || targetIndex >= slideData.objects.length) {
                                        results.failed.push({
                                            index: targetIndex,
                                            error: `Invalid index (slide has ${slideData.objects.length} objects)`
                                        });
                                        continue;
                                    }

                                    const container = slideData.objects[targetIndex];
                                    const objType = (container.type || '').toLowerCase();

                                    // Verify it's a valid placeholder type
                                    const isGroupPlaceholder = objType === 'group' && container.isImagePlaceholder === true;
                                    const isImagePlaceholder = objType === 'image' && (container.isImagePlaceholder === true || container.isImageContainer === true);

                                    if (!isGroupPlaceholder && !isImagePlaceholder) {
                                        results.failed.push({
                                            index: targetIndex,
                                            error: `Not an image placeholder (type: ${container.type})`
                                        });
                                        continue;
                                    }

                                    console.log(`[IMAGE PLACEHOLDER] Generating for ${objType} at index ${targetIndex}:`, update.prompt.substring(0, 100));

                                    // Generate image with Gemini
                                    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            model: 'google/gemini-2.5-flash-image-preview',
                                            messages: [{ role: 'user', content: update.prompt }],
                                            modalities: ['image', 'text'],
                                            image_config: { aspect_ratio: '1:1' }
                                        })
                                    });

                                    if (!openrouterResponse.ok) {
                                        const errorText = await openrouterResponse.text();
                                        console.error(`[IMAGE PLACEHOLDER] API Error for index ${targetIndex}:`, errorText);
                                        results.failed.push({
                                            index: targetIndex,
                                            error: `API error: ${openrouterResponse.status}`
                                        });
                                        continue;
                                    }

                                    const responseData = await openrouterResponse.json();
                                    const imageObject = responseData.choices?.[0]?.message?.images?.[0];

                                    if (!imageObject) {
                                        console.error(`[IMAGE PLACEHOLDER] No image in response for index ${targetIndex}`);
                                        results.failed.push({
                                            index: targetIndex,
                                            error: 'No image generated'
                                        });
                                        continue;
                                    }

                                    // Extract base64
                                    let imageData: string;
                                    if (typeof imageObject === 'string') {
                                        imageData = imageObject;
                                    } else if (imageObject.url) {
                                        imageData = imageObject.url;
                                    } else if (imageObject.image_url?.url) {
                                        imageData = imageObject.image_url.url;
                                    } else {
                                        results.failed.push({
                                            index: targetIndex,
                                            error: 'Could not extract image data'
                                        });
                                        continue;
                                    }

                                    // Convert to Uint8Array
                                    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                                    const binaryString = atob(base64Data);
                                    const uint8Array = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        uint8Array[i] = binaryString.charCodeAt(i);
                                    }

                                    // Upload to storage
                                    const imageUrl = await uploadFileToStorageFromHttpAction(ctx, uint8Array, 'image/png');

                                    if (!imageUrl) {
                                        results.failed.push({
                                            index: targetIndex,
                                            error: 'Failed to upload to storage'
                                        });
                                        continue;
                                    }

                                    console.log(`[IMAGE PLACEHOLDER] Success for index ${targetIndex}:`, imageUrl);

                                    // Handle based on placeholder type
                                    if (isGroupPlaceholder) {
                                        // Convert group placeholder to image object
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

                                        slideData.objects[targetIndex] = {
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
                                    } else {
                                        // Just replace the URL for image placeholders
                                        slideData.objects[targetIndex].src = imageUrl;
                                    }

                                    results.successful.push({ index: targetIndex, url: imageUrl });

                                } catch (error) {
                                    console.error(`[IMAGE PLACEHOLDER] Error processing:`, error);
                                    results.failed.push({
                                        index: update.containerIndex ?? -1,
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                }
                            }

                            // Save updated slide
                            const updatedContent = JSON.stringify(slideData, null, 2);
                            await ctx.runMutation(api.files.updateByPath, {
                                chatId: id,
                                path,
                                content: updatedContent,
                                version: currentVersion ?? 0
                            });

                            const totalProcessed = imageUpdates.length;
                            const successCount = results.successful.length;
                            const failCount = results.failed.length;

                            return {
                                success: successCount > 0,
                                message: explanation,
                                imagesProcessed: successCount,
                                imagesRequested: totalProcessed,
                                imagesFailed: failCount,
                                imageUrls: results.successful.map(r => r.url),
                                failedContainers: results.failed,
                                partialSuccess: successCount > 0 && failCount > 0
                            };

                        } catch (error) {
                            console.error(`Error processing image placeholders in ${path}:`, error);
                            return {
                                success: false,
                                error: `Error processing image placeholders: ${error instanceof Error ? error.message : 'Unknown error'}`
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
                    "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization, User-Agent, X-Template-Source, X-Slides-Count",
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