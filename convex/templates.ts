import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getAll = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const templates = await ctx.db
            .query("templates")
            .collect();

        return templates;
    },
});

export const getById = query({
    args: {
        id: v.id('templates'),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const template = await ctx.db.get(args.id);

        if (!template) {
            throw new Error("Template not found");
        }

        return template;
    },
});

export const getFiles = query({
    args: {
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.name) {
            throw new Error("Name is required");
        }

        // Get first template with this name (in case of duplicates)
        const templates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name!))
            .collect();

        if (templates.length === 0) {
            throw new Error("Template not found");
        }

        // Use the first template found
        const template = templates[0];

        const templateFiles = await ctx.db
            .query("templateFiles")
            .withIndex("by_templateId", (q) => q.eq("templateId", template._id))
            .collect();

        return templateFiles;
    },
});

export const createTemplate = mutation({
    args: {
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        if (!args.description) {
            throw new Error("Description is required");
        }

        // Check if template already exists
        const existingTemplates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name!))
            .collect();

        if (existingTemplates.length > 0) {
            throw new Error("Template already exists");
        }

        const templateId = await ctx.db.insert("templates", { name: args.name!, description: args.description! });
        return templateId;
    },
});

export const createTemplateWithFiles = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        files: v.optional(v.array(v.object({
            path: v.string(),
            content: v.string()
        }))),
        sourceTemplateId: v.optional(v.id('templates')),
    },
    handler: async (ctx, args) => {
        // Check if template name already exists
        const existingTemplates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .collect();

        if (existingTemplates.length > 0) {
            throw new Error("Template already exists");
        }

        // Create the new template
        const templateId = await ctx.db.insert("templates", {
            name: args.name,
            description: args.description,
        });

        // If files array is provided, create them
        if (args.files && args.files.length > 0) {
            for (const file of args.files) {
                await ctx.db.insert("templateFiles", {
                    templateId: templateId,
                    path: file.path,
                    content: file.content,
                });
            }
        }
        // Otherwise if a source template is provided, copy its files
        else if (args.sourceTemplateId) {
            const sourceFiles = await ctx.db
                .query("templateFiles")
                .withIndex("by_templateId", (q) => q.eq("templateId", args.sourceTemplateId!))
                .collect();

            // Copy all files from source template to new template
            for (const file of sourceFiles) {
                await ctx.db.insert("templateFiles", {
                    templateId: templateId,
                    path: file.path,
                    content: file.content,
                });
            }
        }

        return templateId;
    },
});

export const createTemplateFile = mutation({
    args: {
        templateId: v.optional(v.id('templates')),
        path: v.optional(v.string()),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.templateId) {
            throw new Error("Template ID is required");
        }

        if (!args.path) {
            throw new Error("Path is required");
        }

        if (!args.content) {
            throw new Error("Content is required");
        }

        const templateFile = await ctx.db.insert("templateFiles", { templateId: args.templateId, path: args.path, content: args.content });
        return templateFile;
    },
});

export const updateTemplate = mutation({
    args: {
        id: v.id('templates'),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        if (!args.description) {
            throw new Error("Description is required");
        }

        await ctx.db.patch(args.id, {
            name: args.name!,
            description: args.description!,
        });

        return { success: true };
    },
});

export const deleteTemplate = mutation({
    args: {
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        // Get ALL templates with this name (in case of duplicates)
        const templates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name!))
            .collect();

        if (templates.length === 0) {
            throw new Error("Template not found");
        }

        // Delete all matching templates and their files
        for (const template of templates) {
            // Delete all files for this template
            const templateFiles = await ctx.db
                .query("templateFiles")
                .withIndex("by_templateId", (q) => q.eq("templateId", template._id))
                .collect();

            for (const templateFile of templateFiles) {
                await ctx.db.delete(templateFile._id);
            }

            // Delete the template itself
            await ctx.db.delete(template._id);
        }

        return {
            success: true,
            deleted: templates.length
        };
    },
});

export const getFilesByTemplateId = query({
    args: {
        templateId: v.id('templates'),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        const templateFiles = await ctx.db
            .query("templateFiles")
            .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
            .collect();

        // Convert to Record<string, string> format for easier use
        const filesObject = templateFiles.reduce((acc, file) => {
            acc[file.path] = file.content;
            return acc;
        }, {} as Record<string, string>);

        return filesObject;
    },
});

export const updateTemplateFile = mutation({
    args: {
        templateId: v.id('templates'),
        path: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Find existing file using compound index
        const existingFile = await ctx.db
            .query("templateFiles")
            .withIndex("by_templateId_path", (q) =>
                q.eq("templateId", args.templateId).eq("path", args.path)
            )
            .unique();

        if (existingFile) {
            // Update existing file
            await ctx.db.patch(existingFile._id, {
                content: args.content,
            });
        } else {
            // Create new file if it doesn't exist
            await ctx.db.insert("templateFiles", {
                templateId: args.templateId,
                path: args.path,
                content: args.content,
            });
        }

        return { success: true };
    },
});

export const deleteTemplateFile = mutation({
    args: {
        templateId: v.id('templates'),
        path: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Find and delete the file using compound index
        const file = await ctx.db
            .query("templateFiles")
            .withIndex("by_templateId_path", (q) =>
                q.eq("templateId", args.templateId).eq("path", args.path)
            )
            .unique();

        if (file) {
            await ctx.db.delete(file._id);
        }

        return { success: true };
    },
});

export const saveTemplateFiles = mutation({
    args: {
        templateId: v.id('templates'),
        files: v.object({
            added: v.array(v.object({ path: v.string(), content: v.string() })),
            updated: v.array(v.object({ path: v.string(), content: v.string() })),
            deleted: v.array(v.string()),
        }),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Handle deletions using compound index
        for (const path of args.files.deleted) {
            const file = await ctx.db
                .query("templateFiles")
                .withIndex("by_templateId_path", (q) =>
                    q.eq("templateId", args.templateId).eq("path", path)
                )
                .unique();

            if (file) {
                await ctx.db.delete(file._id);
            }
        }

        // Handle additions
        for (const file of args.files.added) {
            await ctx.db.insert("templateFiles", {
                templateId: args.templateId,
                path: file.path,
                content: file.content,
            });
        }

        // Handle updates using compound index
        for (const file of args.files.updated) {
            const existingFile = await ctx.db
                .query("templateFiles")
                .withIndex("by_templateId_path", (q) =>
                    q.eq("templateId", args.templateId).eq("path", file.path)
                )
                .unique();

            if (existingFile) {
                await ctx.db.patch(existingFile._id, {
                    content: file.content,
                });
            }
        }

        return { success: true };
    },
});

export const renameTemplateFile = mutation({
    args: {
        templateId: v.id('templates'),
        oldPath: v.string(),
        newPath: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Get all files that match the old path (for renaming folders)
        const allFiles = await ctx.db
            .query("templateFiles")
            .withIndex("by_templateId", (q) => q.eq("templateId", args.templateId))
            .collect();

        // Find files that need to be renamed
        const filesToRename = allFiles.filter(file =>
            file.path === args.oldPath || file.path.startsWith(args.oldPath + '/')
        );

        // If no files found in database, it might be a newly created file that hasn't been saved yet
        // In this case, just return success and let Sandpack handle the rename
        if (filesToRename.length === 0) {
            return { success: true };
        }

        // Rename all matching files
        for (const file of filesToRename) {
            const newPath = file.path === args.oldPath
                ? args.newPath
                : file.path.replace(args.oldPath, args.newPath);

            // Create new file with updated path
            await ctx.db.insert("templateFiles", {
                templateId: args.templateId,
                path: newPath,
                content: file.content,
            });

            // Delete old file
            await ctx.db.delete(file._id);
        }

        return { success: true };
    },
});

export const getAllWithFirstSlide = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // Get all templates ordered by creation time (newest first)
        const templates = await ctx.db
            .query("templates")
            .order("desc")
            .collect();

        // For each template, get the first slide content from files
        const templatesWithFirstSlide = await Promise.all(
            templates.map(async (template) => {
                // Get all files for this template
                const templateFiles = await ctx.db
                    .query("templateFiles")
                    .withIndex("by_templateId", (q) => q.eq("templateId", template._id))
                    .collect();

                // Find the first slide file (e.g., /slides/slide-1.json)
                const firstSlideFile = templateFiles.find(file =>
                    file.path === '/slides/slide-1.json'
                );

                let firstSlideContent = null;
                if (firstSlideFile) {
                    try {
                        // The content is already the slide data, just pass it as-is
                        firstSlideContent = firstSlideFile.content;
                    } catch (error) {
                        console.error(`Error reading first slide for template ${template._id}:`, error);
                    }
                }

                return {
                    _id: template._id,
                    _creationTime: template._creationTime,
                    name: template.name,
                    description: template.description,
                    firstSlideContent: firstSlideContent,
                };
            })
        );

        return templatesWithFirstSlide;
    },
});