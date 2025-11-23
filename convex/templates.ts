import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getAll = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // Get all templates
        const allTemplates = await ctx.db
            .query("templates")
            .collect();

        // Filter to show ONLY user's own templates (not admin templates)
        // - For regular users: Only their own templates (userId = user._id)
        // - For admins: Only admin templates (public templates with userId = undefined/null)
        const filteredTemplates = allTemplates.filter(template => {
            if (user.role === "admin") {
                // Admins see only admin templates (public templates)
                return template.isPublic === true && (template.userId === undefined || template.userId === null);
            } else {
                // Users see only their own templates
                return template.userId === user._id;
            }
        });

        return filteredTemplates;
    },
});

export const getById = query({
    args: {
        id: v.id('templates'),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const template = await ctx.db.get(args.id);

        if (!template) {
            throw new Error("Template not found");
        }

        // Allow access if:
        // 1. User is admin (can access any template)
        // 2. User owns the template (userId matches)
        // 3. Template is public (admin template)
        const isAdmin = user.role === "admin";
        const isOwner = template.userId === user._id;
        const isPublicTemplate = !template.userId && template.isPublic;

        if (!isAdmin && !isOwner && !isPublicTemplate) {
            throw new Error("Unauthorized");
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

        // Only ultra users and admins can create templates
        if (user.role !== "admin" && user.plan !== "ultra") {
            throw new Error("Unauthorized. Only Ultra plan users and admins can create templates.");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        if (!args.description) {
            throw new Error("Description is required");
        }

        // Check if template already exists for this user
        const existingTemplates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name!))
            .collect();

        // For non-admins, check if they already have a template with this name
        if (user.role !== "admin") {
            const userTemplateExists = existingTemplates.some(t => t.userId === user._id);
            if (userTemplateExists) {
                throw new Error("You already have a template with this name");
            }
        } else {
            // For admins, check if any template with this name exists
            if (existingTemplates.length > 0) {
                throw new Error("Template already exists");
            }
        }

        const templateId = await ctx.db.insert("templates", {
            name: args.name!,
            description: args.description!,
            userId: user.role === "admin" ? undefined : user._id,
            isPublic: user.role === "admin" ? true : false,
        });
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
        const user = await getCurrentUser(ctx);

        // Only ultra users and admins can create templates
        if (user.role !== "admin" && user.plan !== "ultra") {
            throw new Error("Unauthorized. Only Ultra plan users and admins can create templates.");
        }

        // Check if template name already exists
        const existingTemplates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .collect();

        // For non-admins, check if they already have a template with this name
        if (user.role !== "admin") {
            const userTemplateExists = existingTemplates.some(t => t.userId === user._id);
            if (userTemplateExists) {
                throw new Error("You already have a template with this name");
            }
        } else {
            // For admins, check if any template with this name exists
            if (existingTemplates.length > 0) {
                throw new Error("Template already exists");
            }
        }

        // Create the new template
        const templateId = await ctx.db.insert("templates", {
            name: args.name,
            description: args.description,
            userId: user.role === "admin" ? undefined : user._id,
            isPublic: user.role === "admin" ? true : false,
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

        const template = await ctx.db.get(args.id);
        if (!template) {
            throw new Error("Template not found");
        }

        // Check if user owns this template or is admin
        if (user.role !== "admin" && template.userId !== user._id) {
            throw new Error("Unauthorized. You can only edit your own templates.");
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

        // Filter templates that the user can delete
        let deletedCount = 0;
        for (const template of templates) {
            // User can delete if they own it OR if they are admin
            if (user.role === "admin" || template.userId === user._id) {
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
                deletedCount++;
            }
        }

        if (deletedCount === 0) {
            throw new Error("Unauthorized. You can only delete your own templates.");
        }

        return {
            success: true,
            deleted: deletedCount
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

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Check if user owns this template or is admin
        if (user.role !== "admin" && template.userId !== user._id) {
            throw new Error("Unauthorized. You can only edit your own templates.");
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

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Check if user owns this template or is admin
        if (user.role !== "admin" && template.userId !== user._id) {
            throw new Error("Unauthorized. You can only edit your own templates.");
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

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Check if user owns this template or is admin
        if (user.role !== "admin" && template.userId !== user._id) {
            throw new Error("Unauthorized. You can only edit your own templates.");
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

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        // Check if user owns this template or is admin
        if (user.role !== "admin" && template.userId !== user._id) {
            throw new Error("Unauthorized. You can only edit your own templates.");
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

// Query for /templates route - Only admin templates (public templates)
export const getAllAdminTemplatesWithFirstSlide = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // Only admins can access the /templates page
        if (user.role !== "admin") {
            throw new Error("Unauthorized. Only admins can access the templates management page.");
        }

        // Get all templates ordered by creation time (newest first)
        const allTemplates = await ctx.db
            .query("templates")
            .order("desc")
            .collect();

        // Only show admin templates (public templates, userId = undefined/null)
        const templates = allTemplates.filter(template =>
            template.isPublic === true || template.userId === undefined || template.userId === null
        );

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

// Query to get ONLY admin templates (for AI to use as default)
// This should return ALL public templates created by admins (userId is undefined/null)
// IMPORTANT: This query is accessible to ALL users (no authentication required)
export const getAdminTemplates = query({
    args: {},
    handler: async (ctx, args) => {
        // NO getCurrentUser() call - this query should work for ALL users
        // Get all templates from the database
        const allTemplates = await ctx.db
            .query("templates")
            .collect();

        console.log('[getAdminTemplates] Total templates in DB:', allTemplates.length);

        // Filter: Only return templates that are admin templates
        // Admin templates have: userId = undefined/null (created by admin)
        // We consider isPublic=true OR isPublic=undefined as public (for backward compatibility)
        const adminTemplates = allTemplates.filter(template => {
            const isAdminTemplate = !template.userId && (template.isPublic === true || template.isPublic === undefined);
            return isAdminTemplate;
        });

        console.log('[getAdminTemplates] Admin templates found:', adminTemplates.length);
        console.log('[getAdminTemplates] Returning admin template names:', adminTemplates.map(t => t.name));

        return adminTemplates;
    },
});

// Query to get ONLY user's own templates (for AI to use when "My Templates" is selected)
export const getUserTemplates = query({
    args: {},
    handler: async (ctx, args) => {
        try {
            const user = await getCurrentUser(ctx);

            console.log('[getUserTemplates] User ID:', user._id);
            console.log('[getUserTemplates] User role:', user.role);
            console.log('[getUserTemplates] User plan:', user.plan);

            // Get all templates
            const allTemplates = await ctx.db
                .query("templates")
                .collect();

            console.log('[getUserTemplates] Total templates in DB:', allTemplates.length);

            // Only return user's own templates
            const userTemplates = allTemplates.filter(template => {
                const isUserTemplate = template.userId === user._id;
                if (isUserTemplate) {
                    console.log(`[getUserTemplates] Found user template: "${template.name}"`);
                }
                return isUserTemplate;
            });

            console.log('[getUserTemplates] User templates found:', userTemplates.length);
            console.log('[getUserTemplates] Returning template names:', userTemplates.map(t => t.name));

            return userTemplates;
        } catch (error) {
            console.error('[getUserTemplates] ERROR:', error);
            // Return empty array if there's an error (e.g., user not authenticated)
            // This prevents infinite loading
            return [];
        }
    },
});

// Migration mutation to fix existing templates with isPublic=undefined
export const fixAdminTemplatesIsPublic = mutation({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // Only admins can run this migration
        if (user.role !== "admin") {
            throw new Error("Unauthorized. Only admins can run this migration.");
        }

        // Get all templates
        const allTemplates = await ctx.db
            .query("templates")
            .collect();

        let updatedCount = 0;

        // Update admin templates (those without userId) to have isPublic=true
        for (const template of allTemplates) {
            if (!template.userId && (template.isPublic === undefined || template.isPublic !== true)) {
                await ctx.db.patch(template._id, {
                    isPublic: true,
                });
                updatedCount++;
                console.log(`[MIGRATION] Updated template "${template.name}" to isPublic=true`);
            }
        }

        return {
            success: true,
            message: `Migration completed. Updated ${updatedCount} admin templates to isPublic=true.`,
            updatedCount,
        };
    },
});

// Mutation to assign a template to a specific user (convert admin template to user template)
export const assignTemplateToUser = mutation({
    args: {
        templateName: v.string(),
        targetUserId: v.optional(v.id('users')),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // Only admins can reassign templates
        if (user.role !== "admin") {
            throw new Error("Unauthorized. Only admins can assign templates.");
        }

        // Find the template by name
        const templates = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.templateName))
            .collect();

        if (templates.length === 0) {
            throw new Error(`Template "${args.templateName}" not found`);
        }

        const template = templates[0];

        // Use targetUserId if provided, otherwise use current user's ID
        const newUserId = args.targetUserId || user._id;

        // Update the template to belong to the specified user
        await ctx.db.patch(template._id, {
            userId: newUserId,
            isPublic: false,
        });

        return {
            success: true,
            message: `Template "${args.templateName}" assigned to user ${newUserId}`,
            templateId: template._id,
        };
    },
});

// Query for /my-templates route - ONLY user's own templates (not admin templates)
export const getAllWithFirstSlide = query({
    args: {},
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // All authenticated users can access this page
        // They will see their own templates (which will be empty for non-ultra users who can't create)

        // Get all templates ordered by creation time (newest first)
        const allTemplates = await ctx.db
            .query("templates")
            .order("desc")
            .collect();

        // NEW LOGIC: Only show user's own templates
        // - For regular users (pro, premium, ultra): Only their own templates (userId = user._id)
        // - For admins: Only admin templates (public templates with userId = undefined/null)
        const templates = allTemplates.filter(template => {
            if (user.role === "admin") {
                // Admins see only admin templates (public templates)
                return template.isPublic === true && (template.userId === undefined || template.userId === null);
            } else {
                // Pro, Premium, and Ultra users see only their own templates
                return template.userId === user._id;
            }
        });

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