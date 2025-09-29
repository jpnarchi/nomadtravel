import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

// Helper function to get current user
const getCurrentUser = async (ctx: QueryCtx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
        throw new Error("Unauthorized");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

// Exported function to get current user
export const getUserInfo = query({
    args: {},
    handler: async (ctx) => {
        return await getCurrentUser(ctx);
    },
});

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

export const getFiles = query({
    args: {
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.name) {
            throw new Error("Name is required");
        }

        const template = await ctx.db
            .query("templates")
            .withIndex("by_name", (q) => q.eq("name", args.name!))
            .unique();

        if (!template) {
            throw new Error("Template not found");
        }

        const templateFiles = await ctx.db
            .query("templateFiles")
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

        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        if (!args.description) {
            throw new Error("Description is required");
        }

        const template = await ctx.db.insert("templates", { name: args.name!, description: args.description! });
        return template;
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

        if (user.plan !== "admin") {
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

export const deleteTemplate = mutation({
    args: {
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.name) {
            throw new Error("Name is required");
        }

        const template = await ctx.db.query("templates").withIndex("by_name", (q) => q.eq("name", args.name!)).unique();

        if (!template) {
            throw new Error("Template not found");
        }

        const templateFiles = await ctx.db
            .query("templateFiles")
            .collect();

        for (const templateFile of templateFiles) {
            if (templateFile.templateId === template._id) {
                await ctx.db.delete(templateFile._id);
            }
        }

        await ctx.db.delete(template._id);
        return { success: true };
    },
});