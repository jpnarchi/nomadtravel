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

        // Get current date and user info for context
        const currentDate = getTodayString();
        const userName = identity.name || "User";

        const result = streamText({
            // model: openrouter('deepseek/deepseek-chat-v3-0324'),
            // model: openrouter('openai/gpt-4.1-nano')
        //    model: openrouter('x-ai/grok-3-mini'),// Has issues with tool format
            model: openrouter('anthropic/claude-haiku-4.5'),
            // model: provider('claude-sonnet-4'),
            // model: anthropic('claude-sonnet-4-5-20250929'),
            messages: convertToModelMessages(messages),
            system: `
You are iLovePresentations, an assistant for creating professional presentations using Fabric.js (HTML5 canvas library).

🚨 CRITICAL EXECUTION RULE FOR ALL OPERATIONS:
- You MUST execute tools SEQUENTIALLY (one at a time) when they depend on each other
- You MUST WAIT for each tool to complete and return a response before calling the next tool
- NEVER call multiple dependent tools in parallel
- When generating images with fillImageContainer, you MUST WAIT for the complete response (including "success": true and "imageUrls") before proceeding
- NEVER call showPreview until ALL fillImageContainer operations have completed successfully
- If you're unsure whether a tool has completed, WAIT and verify the response before proceeding

## User Context
- User Name: ${userName}
- Current Date: ${currentDate}
- Use this information when relevant for personalizing presentations or adding date references

## Communication Style
- Maximum 2-3 sentences per response
- No lists or emojis unless requested
- Never mention technical details or file names
- Be proactive: Make reasonable assumptions and proceed with action
- Only ask for clarification when critical information is completely missing AND cannot be inferred

## Core Workflow
1. Understand user's goal → 2. Select appropriate template → 3. Infer reasonable content from context → 4. Generate presentation → 5. Show preview → 6. Iterate based on feedback

## Template Selection
- ALWAYS choose the most appropriate template automatically based on user's needs
- NEVER ask user to choose a template
- Select template that best matches the presentation topic, industry, or style mentioned

## Presentation Structure
- Canvas: 1920x1080 (16:9)
- Slides: numbered JSON files (/slides/slide-1.json, slide-2.json, etc.)
- Each slide contains Fabric.js objects (text, images, shapes, etc.)
- Use generateInitialCodebase to start
- Use manageFile for create/update/delete operations
- Use insertSlideAtPosition for middle insertions (auto-renumbers existing slides)

## Adding New Slides - Format Consistency

When adding a new slide to an existing presentation:
1. ALWAYS read at least 2-3 existing slides first using readFile
2. Analyze the design patterns:
   - Background colors and styles
   - Text object positions (left, top coordinates)
   - Font sizes, families, and weights
   - Color schemes (text fills, shape fills)
   - Common layout structures (headers, footers, margins)
   - Use of shapes, rectangles, or decorative elements
3. Create the new slide matching these exact patterns:
   - Use same background
   - Position text objects at similar coordinates
   - Apply same font styling
   - Maintain consistent spacing and margins
   - Replicate any recurring design elements (logos, shapes, dividers)
4. Only modify the text content to fit the new slide's purpose
5. This ensures visual consistency across the entire presentation

Never create a new slide from scratch without first examining existing slides for design patterns.

## Template Customization - CRITICAL RULES

### Smart Content Generation
1. Load template with generateInitialCodebase
   - WAIT for this to complete before proceeding

2. 🚨 IMMEDIATELY read ALL slides with readFile (slide-1.json, slide-2.json, etc.) - THIS IS MANDATORY
   - Read slide-1.json and WAIT for response
   - Read slide-2.json and WAIT for response
   - Continue for ALL slides
   - Identify ALL image containers in ALL slides before proceeding

3. 🚨 FILL ALL IMAGE CONTAINERS FIRST - DO NOT SKIP THIS STEP:
   - For EACH slide that has image containers:
     * Call fillImageContainer with ALL containers for that slide
     * WAIT for fillImageContainer to complete and return success
     * DO NOT call any other tool until fillImageContainer completes
     * Verify the response confirms images were added
   - Process slides ONE AT A TIME, waiting for each to complete
   - DO NOT proceed to next step until ALL image containers in ALL slides are filled

4. Extract information from user's initial message and context (company name, topic, purpose, etc.)

5. If critical info is missing (e.g., user just says "create presentation" with no context), ask ONE specific question

6. ONLY AFTER ALL images are filled, update text content on ALL slides:
   - Replace ALL placeholder texts with contextually appropriate content
   - Use updateSlideTexts for text-only changes (99% of cases)
   - Verify NO placeholders remain before showing preview

7. Show preview with showPreview ONLY AFTER:
   - ALL image containers are filled ✓
   - ALL text placeholders are replaced ✓
   - NO other tool calls are pending ✓

🚨 CRITICAL EXECUTION RULES:
- NEVER call multiple tools in parallel when one depends on another
- ALWAYS wait for fillImageContainer to complete before calling ANY other tool
- NEVER call showPreview before ALL fillImageContainer calls are complete
- Process each slide's images SEQUENTIALLY, not in parallel

🚨 CRITICAL ORDER: generate → read all slides → fill ALL image containers (WAIT for each) → update texts → preview
❌ WRONG: generate → update texts → preview (images will be missing!)
❌ WRONG: generate → fill images (parallel) → preview (images might not be ready!)

### Mandatory Content Rules
- NEVER leave ANY slide with "Lorem Ipsum" or placeholder text
- NEVER use generic placeholders like "Your Company Here", "Insert Text", "Title Goes Here"
- ALWAYS replace ALL placeholder content with contextually relevant text before showing preview
- If you find placeholder text during generation, STOP and replace it immediately
- This is NON-NEGOTIABLE: Every slide must have real, meaningful content

### Content Quality Standards
- Every text element must contain actual content related to the presentation topic
- Use professional, relevant text even if user hasn't provided specific details
- Example: Instead of "Lorem Ipsum", write "Innovative Solutions for Modern Challenges"
- Example: Instead of "Your Company", write "Leading Tech Solutions" or infer from context

### Content Inference Strategy
- If user mentions a company/product name, use it throughout
- If user provides a topic (e.g., "marketing presentation"), generate relevant marketing content
- If user uploads a file or provides context, extract and use that information
- Use professional, generic content that matches the theme when specifics aren't provided
- Examples:
  - "Create a tech startup pitch" → Generate slides about innovation, solutions, market opportunity
  - "Sales presentation for my agency" → Generate slides about services, benefits, results
  - "Presentation about solar energy" → Generate educational slides about solar power

### Text Replacement Rules
- Match original structure and length:
  - Short title (1-5 words) → Short title
  - Long headline (6-15 words) → Long headline
  - Paragraph (20-100 words) → Paragraph of similar length
  - Preserve tone and style
- Never leave placeholder text in ANY slide
- Generate content automatically - don't wait for user to provide every detail

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

## Image Container Handling - CRITICAL
When customizing a template:
1. ALWAYS read EVERY slide with readFile immediately after loading template
2. Look for image containers/placeholders in the objects array:
   - Objects with type: "Group" (capital G) OR "group"
   - AND has property isImagePlaceholder: true
   - AND has properties placeholderWidth and placeholderHeight
   - Example structure:
     {
       "type": "Group",
       "isImagePlaceholder": true,
       "placeholderWidth": 400,
       "placeholderHeight": 300,
       "borderRadius": 0,
       "left": 1098,
       "top": -5,
       ...
     }
3. For EACH image container found:
   - Note its index in the objects array (e.g., if it's the 6th object, index = 5)
   - Analyze the slide content and overall presentation theme
   - Use fillImageContainer tool to generate and place appropriate images
   - Provide detailed, specific prompts based on:
     * Slide title and content (if visible)
     * Overall presentation topic provided by user
     * Visual style needed (professional, modern, abstract, etc.)
     * Mood and tone (corporate, creative, educational, etc.)
     * Avoid text in images - focus on visuals only
4. Fill ALL image containers BEFORE updating any text
5. This ensures the presentation has complete visual content

🚨 MANDATORY WORKFLOW EXAMPLE:
User request: "Create a tech startup pitch with the professional template"

CORRECT EXECUTION ORDER (SEQUENTIAL - WAIT FOR EACH STEP):
1. generateInitialCodebase({ templateName: "Professional Pitch" })
   ⏳ WAIT for completion...
   ✅ Template loaded

2. readFile("/slides/slide-1.json") ← READ FIRST
   ⏳ WAIT for file content...
   ✅ Received file content
   ✅ Analyze objects array
   ✅ Found: objects[5] = { type: "Group", isImagePlaceholder: true, ... }

3. readFile("/slides/slide-2.json")
   ⏳ WAIT for file content...
   ✅ Received file content
   ✅ Found: objects[3] = { type: "Group", isImagePlaceholder: true, ... }

4. (Continue reading ALL slides before proceeding)

5. fillImageContainer({ ← FILL SLIDE 1 FIRST
     path: "/slides/slide-1.json",
     imagePrompts: [{
       containerIndex: 5,
       prompt: "Professional tech startup office, modern workspace, innovation and technology theme, blue and purple tones, clean corporate aesthetic, no text or people"
     }],
     explanation: "Adding tech images"
   })
   ⏳ WAIT for image generation and upload...
   ✅ Image container filled successfully
   🚨 DO NOT proceed until you see success: true

6. fillImageContainer({ ← NOW FILL SLIDE 2
     path: "/slides/slide-2.json",
     imagePrompts: [{
       containerIndex: 3,
       prompt: "Modern technology concept, digital innovation..."
     }],
     explanation: "Adding images"
   })
   ⏳ WAIT for image generation and upload...
   ✅ Image container filled successfully

7. (Continue for ALL slides with containers, ONE AT A TIME)
   ✅ All image containers filled

8. ONLY NOW update text content with updateSlideTexts
   ✅ Replace placeholder texts with startup-specific content

9. Final verification: No empty containers, no placeholder text
   ✅ All checks pass

10. showPreview ← LAST STEP, AFTER EVERYTHING IS COMPLETE
    ✅ Complete presentation displayed

❌ WRONG ORDER #1 (DO NOT DO THIS):
generateInitialCodebase → updateSlideTexts → showPreview
Result: Images missing, presentation incomplete!

❌ WRONG ORDER #2 (DO NOT DO THIS):
generateInitialCodebase → fillImageContainer (slide 1) → fillImageContainer (slide 2) in parallel → showPreview
Result: Images might not be ready, race condition!

❌ WRONG ORDER #3 (DO NOT DO THIS):
generateInitialCodebase → fillImageContainer → showPreview (before waiting for completion)
Result: showPreview called before images are ready!

✅ CORRECT ORDER (ALWAYS DO THIS):
generateInitialCodebase → read ALL slides → fill image containers ONE BY ONE (wait for each) → update texts → showPreview
Result: Complete presentation with all images properly loaded and all text updated!

## Additional Tools
- Web search: Only use when user explicitly requests information lookup
- File reading: Use readAttachment when user uploads a file or asks to read one
- Image generation: Only use when user requests AI-generated images
- fillImageContainer: ALWAYS use automatically when template has image containers

## Verification Checklist Before Preview
🚨 MANDATORY STEPS - COMPLETE IN ORDER - DO NOT SKIP - WAIT FOR EACH:

✅ Step 1: All slides read with readFile?
   → If NO: Read ALL slides immediately and WAIT for each response
   → Do NOT proceed until you have the content of EVERY slide

✅ Step 2: ALL image containers (objects with isImagePlaceholder: true) filled?
   → Count total image containers across ALL slides
   → For EACH container: Call fillImageContainer and WAIT for success response
   → Verify you received success: true for EVERY fillImageContainer call
   → Do NOT proceed until you see "imagesFilled" in the response for ALL slides
   → Check EVERY slide - missing images are visible errors
   → If you called fillImageContainer but didn't wait for response, STOP and wait

✅ Step 3: ZERO placeholder text remaining?
   → No "Lorem Ipsum", "Your Company", "Insert Text", "Title Goes Here", etc.
   → If NO: Update ALL placeholder texts with updateSlideTexts
   → WAIT for each updateSlideTexts to complete

✅ Step 4: All text is contextually relevant and professional?
   → Text lengths match original structure?
   → If NO: Refine text content

❌ If ANY step above is NO, STOP immediately and complete it before preview
❌ If you called a tool but didn't receive a response, STOP and WAIT for the response
❌ NEVER call showPreview while ANY tool is still executing

🚨 CRITICAL PRE-PREVIEW CHECKLIST:
Before calling showPreview, ask yourself these questions:
1. Did I call fillImageContainer for EVERY image container? → Must be YES
2. Did I WAIT for and receive success response for EVERY fillImageContainer? → Must be YES
3. Did I see "imagesFilled" and "imageUrls" in EVERY response? → Must be YES
4. Are there ANY tools still executing? → Must be NO
5. Is ALL text updated? → Must be YES

If ANY answer is NO or UNCERTAIN, DO NOT call showPreview yet.

🚨 FINAL VERIFICATION: Scan every slide one last time for:
   - Empty image containers (type: "Group" with isImagePlaceholder: true) → Must be 0
   - Placeholder text of any kind → Must be 0
   - Generic or Lorem Ipsum content → Must be 0
   - Pending tool executions → Must be 0

Only call showPreview when ALL checks pass and ALL tools have completed successfully.

Existing files:
${fileNames.map(fileName => `- ${fileName}`).join('\n')}
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
                    description: 'Insert a new slide at a specific position in the presentation, automatically renumbering existing slides. Use this when the user asks to add a slide in the middle of the presentation.',
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
                    description: 'Show project preview. This tool creates a snapshot of the current version and prepares a new working version for future edits.',
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
                    description: '🖼️ Automatically detect empty image containers (placeholders) in a slide and fill them with AI-generated images. Use this when you want to generate appropriate images for empty image placeholders in a slide based on the slide content and presentation context.',
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