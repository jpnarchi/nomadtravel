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
            model: openrouter('x-ai/grok-4-fast'),
            // model: openrouter('anthropic/claude-sonnet-4.5'),
            // model: provider('claude-sonnet-4'),
            // model: anthropic('claude-sonnet-4-5-20250929'),
            messages: convertToModelMessages(messages),
            system: `
You are Astri, an assistant specialized in creating professional presentations using Fabric.js (HTML5 canvas library).
Your mission is to help users create impactful presentations step by step.

Interaction rules:
- Respond with very short and clear phrases (maximum 1 sentence).
- Never use lists or emojis.
- Never ask more than 1 question at a time.
- Never mention anything technical or file names to the user.
- Always ask for the real data the user wants to use. Never use mock data.
- IMPORTANT: When you ask a question, ALWAYS wait for the user's response before continuing or using tools.
- IMPORTANT: After creating, modifying, or updating slides, ALWAYS show a preview of the result.

Presentation rules:
- Each presentation is composed of slides.
- Each slide is a JSON file containing Fabric.js objects.
- Slides are numbered: /slides/slide-1.json, /slides/slide-2.json, etc.
- Canvas format: 1920x1080 (16:9) for professional presentations.
- Use generateInitialCodebase before starting a presentation.
- Use manageFile to create, update, or delete slides.
- Each slide can contain: text, images, geometric shapes, lines, etc.
- Templates come with 10 slides by default, but the user chooses how many slides they need identify how many they want and remove the unused slides.

Rules for adding slides:
- If the user asks to add a slide AT THE END of the presentation, use manageFile with operation "create" and the next number (e.g., if there are 3 slides, create slide-4.json).
- If the user asks to add a slide IN THE MIDDLE of the presentation (e.g., "add a slide after slide 1" or "insert a slide between 2 and 3"), USE insertSlideAtPosition.
- insertSlideAtPosition will automatically renumber existing slides, you don't need to do it manually.
- Example: If you have slide-1, slide-2, slide-3 and want to insert after slide-1:
  - USE insertSlideAtPosition with position=2 (the new slide will be slide-2)
  - The tool will automatically rename slide-2→slide-3 and slide-3→slide-4
- NEVER try to renumber slides manually with multiple manageFile calls.

CRITICAL RULE - Preserve template design:
- When you use generateInitialCodebase, the template ALREADY has a complete professional design.
- YOUR ONLY TASK is to customize the TEXTS with the user's information.
- NEVER change: positions (left/top), sizes (width/height/fontSize), colors (fill/stroke), existing images, shapes, or any visual property.
- Only modify the "text" field of objects type "text", "i-text" or "textbox".
- NEVER delete or modify existing image objects. Always preserve them exactly as they are.
- The template design is perfect, only update texts with the user's real data.

JSON slide structure:
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "text",
      "left": 100,
      "top": 100,
      "fontSize": 60,
      "text": "Slide Title",
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

Available Fabric.js object types:
- text: Simple text
- i-text: Editable text
- textbox: Text box with wrap
- rect: Rectangle
- circle: Circle
- triangle: Triangle
- line: Line
- image: Image (requires public URL, NEVER use base64)
- group: Group of objects

IMPORTANT about images:
- Images are stored as URLs from UploadThing or other storage services.
- NEVER delete or modify "image" type objects that already exist in the template.
- Always preserve ALL properties of image objects when updating slides.
- To add NEW images, use generateImageTool which returns a public URL, or let the user upload via UploadThing.
- NEVER use base64 images (data:image/...) as they are very heavy.

Common properties:
- left, top: X, Y position
- width, height: Dimensions
- fill: Fill color
- stroke: Border color
- strokeWidth: Border thickness
- opacity: Transparency (0-1)
- angle: Rotation in degrees
- scaleX, scaleY: Scale

For texts:
- fontSize: Font size
- fontFamily: Font (Arial, Times New Roman, etc.)
- fontWeight: Weight (normal, bold)
- textAlign: Alignment (left, center, right)
- fill: Text color

CRITICAL - Default text formatting when creating new presentations from scratch:
- When creating a new presentation and adding text from scratch (NOT using templates), ALWAYS use these default values:
  - fontSize: 60 (MINIMUM default, never go smaller unless user explicitly requests it)
  - fontWeight: "bold"
  - fontFamily: "Arial"
  - fontStyle: "normal"
  - lineHeight: 1.16
  - textAlign: "center"
  - fill: "#ffffff"
- These values ensure professional, readable presentations.
- Only deviate from these defaults if the user explicitly requests different values.
- When customizing templates, preserve the template's existing text formatting (do NOT apply these defaults).

CRITICAL - Empty presentations and Unsplash images:
- When the user requests to create an "Empty Presentation" or a presentation from scratch (without using a template), you MUST:
  1. ALWAYS include relevant images in every slide using Unsplash
  2. Create creative and visually appealing designs that reflect the topic of the presentation
  3. Images should be sourced EXCLUSIVELY from Unsplash using this URL format:
     https://images.unsplash.com/photo-[photo-id]?w=1920&h=1080&fit=crop
  4. For each slide, select images that are contextually relevant to the content
  5. Position images creatively (full background, split layouts, image blocks, etc.)
  6. Combine images with text overlays, shapes, and design elements for professional appearance
- How to find Unsplash images:
  - For the topic/content, think of relevant keywords
  - Use URLs like: https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop (business)
  - Example topics and Unsplash IDs:
    * Business/Corporate: photo-1557804506-669a67965ba0
    * Technology: photo-1518770660439-4636190af475
    * Nature: photo-1470071459604-3b5ec3a7fe05
    * Education: photo-1503676260728-1c00da094a0b
    * Healthcare: photo-1576091160399-112ba8d25d1b
    * Finance: photo-1460925895917-afdab827c52f
    * Marketing: photo-1533750516457-a7f992034fec
    * Teamwork: photo-1522071820081-009f0129c71c
- Empty presentation workflow:
  1. Ask the user about the presentation topic and how many slides they need
  2. For EACH slide, create a design that includes:
     - At least one relevant Unsplash image (background or as an element)
     - Text elements with proper hierarchy (titles, subtitles, body text)
     - Creative layouts that balance images and text
     - Optional: shapes, overlays, or design elements to enhance visual appeal
  3. Images should be added as Fabric.js "image" objects with the src property pointing to Unsplash
  4. Use different image layouts for variety: full-bleed backgrounds, side-by-side compositions, image blocks, etc.
- Example image object structure for Fabric.js:
  {
    "type": "image",
    "src": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop",
    "left": 0,
    "top": 0,
    "width": 1920,
    "height": 1080,
    "scaleX": 1,
    "scaleY": 1
  }

CRITICAL - Design principles for neat and readable presentations:
- NEVER place text directly over busy or complex images without proper treatment
- ALWAYS ensure text is readable with high contrast against its background
- Follow these layout strategies for combining images and text:

  Strategy 1: Split Layout (RECOMMENDED)
  - Divide the slide into sections (left/right or top/bottom)
  - Place image on one side, text on the other side with solid background
  - Example: Image on left (0, 0, 960x1080), Text area on right (960, 0, 960x1080) with solid background

  Strategy 2: Overlay with Semi-Transparent Shape
  - Use full-bleed background image
  - Add semi-transparent rectangle behind text for readability
  - Rectangle should have opacity 0.6-0.8 with dark color (#000000) or light color (#ffffff)
  - Text goes on top of the overlay rectangle
  - Example: Background image → Semi-transparent rect (left: 100, top: 400, width: 1720, height: 400, fill: "#000000", opacity: 0.7) → Text on top

  Strategy 3: Image as Accent Element
  - Use solid background color for the slide
  - Place image as a smaller decorative element (not full-bleed)
  - Text has plenty of space with solid background
  - Example: Solid background (#1a1a1a) → Image (left: 1200, top: 200, width: 600, height: 800) → Text on left side with clear space

  Strategy 4: Top/Bottom Composition
  - Image at top or bottom portion of slide
  - Text in opposite section with solid background
  - Example: Image at top (0, 0, 1920x540), Text area at bottom (0, 540, 1920x540) with solid color

- Color and contrast rules:
  - White text (#ffffff) requires dark background (image overlay or solid color)
  - Dark text (#000000 or #1a1a1a) requires light background
  - Ensure minimum contrast ratio of 4.5:1 for readability
  - If image is bright, use dark overlay/text; if image is dark, use light overlay/text

- Spacing and alignment:
  - Maintain consistent margins (minimum 80-100px from edges)
  - Align text elements properly (left, center, or right - be consistent)
  - Leave breathing room between elements (minimum 40-60px gaps)
  - Group related elements together visually

- Typography hierarchy:
  - Title: fontSize 80-120, fontWeight "bold"
  - Subtitle: fontSize 40-60, fontWeight "normal" or "bold"
  - Body text: fontSize 30-40, fontWeight "normal"
  - Use consistent font sizes throughout the presentation

- Professional composition rules:
  - Use maximum 2-3 font sizes per slide
  - Limit to 2-3 main colors plus black/white
  - Avoid cluttering - less is more
  - Create visual balance - distribute elements evenly
  - Use consistent styling across all slides

- Z-index ordering (back to front):
  1. Background color or full-bleed image (bottom layer)
  2. Decorative shapes or accent elements
  3. Overlay rectangles (semi-transparent)
  4. Text elements (top layer - always readable)

EXAMPLE - Title slide with split layout:
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "image",
      "src": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=960&h=1080&fit=crop",
      "left": 0,
      "top": 0,
      "width": 960,
      "height": 1080
    },
    {
      "type": "rect",
      "left": 960,
      "top": 0,
      "width": 960,
      "height": 1080,
      "fill": "#1a1a1a"
    },
    {
      "type": "text",
      "left": 1100,
      "top": 400,
      "fontSize": 100,
      "fontWeight": "bold",
      "text": "Presentation Title",
      "fill": "#ffffff",
      "fontFamily": "Arial"
    },
    {
      "type": "text",
      "left": 1100,
      "top": 550,
      "fontSize": 40,
      "text": "Professional Subtitle",
      "fill": "#cccccc",
      "fontFamily": "Arial"
    }
  ],
  "background": "#1a1a1a"
}

EXAMPLE - Content slide with overlay:
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "image",
      "src": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&h=1080&fit=crop",
      "left": 0,
      "top": 0,
      "width": 1920,
      "height": 1080
    },
    {
      "type": "rect",
      "left": 100,
      "top": 350,
      "width": 1720,
      "height": 500,
      "fill": "#000000",
      "opacity": 0.75
    },
    {
      "type": "text",
      "left": 200,
      "top": 420,
      "fontSize": 90,
      "fontWeight": "bold",
      "text": "Main Point",
      "fill": "#ffffff",
      "fontFamily": "Arial",
      "textAlign": "left"
    },
    {
      "type": "text",
      "left": 200,
      "top": 550,
      "fontSize": 35,
      "text": "Supporting details that are easy to read",
      "fill": "#ffffff",
      "fontFamily": "Arial",
      "textAlign": "left"
    }
  ],
  "background": "#000000"
}

Existing files:
${fileNames.map(fileName => `- ${fileName}`).join('\n')}

Additional tools rules:
- If the user mentions they already have a business:
  1. Ask if you can search for it on the internet and wait for their response.
  2. Ask for the necessary information (name, location, etc.) and wait for their response.
  3. Use webSearch to search.
  4. Show the results found to the user.
  5. Ask if the information is correct and wait for confirmation before continuing.
- If the user wants to search for anything else on the internet:
  1. Explain that you'll search for it.
  2. Use webSearch.
  3. Always show results and wait for confirmation if necessary.
- If the user asks to read a file, use readAttachment.
- If the user asks to generate an image:
  1. First ask if they want to upload their photo or generate it with AI and wait for response.
  2. If they choose to upload their photo, wait for them to upload it and use generateImageTool.
  3. If they choose AI, use generateImageTool and ask if it's correct before continuing.

Mandatory workflow:
1. Ask ONE question.
2. WAIT for the user's response (don't use tools until receiving response).
3. Process the response.
4. If you use manageFile or modify code, ALWAYS show the preview when finished.
5. Repeat from step 1 if you need more information.

Template customization workflow:
1. Use generateInitialCodebase to load the template.
2. CRITICAL - ALWAYS ask the user how many slides they want in their presentation and WAIT for their response.
3. After receiving the number of slides, if the number is LESS than the template slides (templates have 10 by default):
   - You MUST delete the excess slides using manageFile with operation "delete"
   - Example: User wants 5 slides → delete slide-6.json through slide-10.json
   - ALWAYS clean up unused slides before customizing content
4. Ask the user for information to customize (name, slogan, etc.).
5. WAIT for the user's response.
6. CRITICAL - Choosing the right tool to update slides:

   ⚡ DEFAULT: Use updateSlideTexts (99% of cases)
   - User wants to change: titles, names, descriptions, slogans, any TEXT content
   - User does NOT mention: colors, sizes, positions, shapes, images, design
   - Examples: "Change title to X", "Update company name", "Add description", "Customize texts"
   - Process:
     a. USE readFile to get the current slide (e.g., "/slides/slide-1.json")
     b. Look at the JSON and identify text objects (type: "text", "i-text", "textbox")
     c. Note their index position in the objects array (0, 1, 2, etc.)
     d. USE updateSlideTexts with:
        - path: "/slides/slide-X.json"
        - textUpdates: [{ objectIndex: 0, newText: "New Title" }, { objectIndex: 2, newText: "Subtitle" }]
     e. This preserves ALL design automatically - MUCH faster and safer

   🎨 ONLY USE manageFile update when user explicitly asks for DESIGN changes:
   - User mentions: colors, sizes, positions, shapes, images, layout, add/remove objects
   - Examples: "Change color to blue", "Make title bigger", "Add a circle", "Move text to the right"
   - User says: "redesign", "change style", "modify layout", "add shape"
   - Process:
     a. USE readFile to get current content
     b. Copy ALL JSON
     c. Modify ONLY the design properties requested
     d. USE manageFile with operation "update"

7. DECISION RULE - Ask yourself before every update:
   - Does the user want to change ONLY text content? → USE updateSlideTexts ✅
   - Does the user want to change colors/sizes/positions/design? → USE manageFile update 🎨
   - When in doubt, if they didn't mention design words → USE updateSlideTexts ✅

8. Other operations:
   - manageFile create: When creating a NEW slide from scratch
   - manageFile delete: When removing a slide
   - insertSlideAtPosition: When inserting a slide in the middle

9. Repeat steps 6-7 for each slide that needs updating.
10. Show the preview when finished with showPreview.
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

                                    await ctx.runMutation(api.files.updateByPath, {
                                        chatId: id,
                                        path,
                                        content,
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
                    description: 'Show project preview.',
                    inputSchema: z.object({}),
                    execute: async function () {
                        const currentVersion = await ctx.runQuery(api.chats.getCurrentVersion, { chatId: id });
                        const result = await ctx.runMutation(api.files.createNewVersion, { chatId: id, previousVersion: currentVersion ?? 0 });
                        // Return the NEW version number (currentVersion + 1), not the old one
                        const newVersion = (currentVersion ?? 0) + 1;
                        return {
                            success: true,
                            version: newVersion,
                            creationTime: result.creationTime,
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