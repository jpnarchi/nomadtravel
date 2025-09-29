import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

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
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return null;
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .collect();

        return files;
    },
});

export const create = mutation({
    args: {
        chatId: v.optional(v.id('chats')),
        path: v.optional(v.string()),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.path) {
            throw new Error("Path not found");
        }

        if (!args.content) {
            throw new Error("Content not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        const fileId = await ctx.db.insert("files", {
            chatId: args.chatId,
            userId: user._id,
            path: args.path,
            content: args.content,
        });

        return fileId;
    },
});

export const update = mutation({
    args: {
        fileId: v.optional(v.id('files')),
        path: v.optional(v.string()),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.fileId) {
            throw new Error("File not found");
        }

        if (!args.path) {
            throw new Error("Path not found");
        }

        if (!args.content) {
            throw new Error("Content not found");
        }

        const file = await ctx.db.get(args.fileId);

        if (!file) {
            throw new Error("Chat not found");
        }

        if (file.userId !== user._id) {
            throw new Error("Access denied");
        }

        const fileId = await ctx.db.patch(args.fileId, {
            path: args.path,
            content: args.content,
        });

        return fileId;
    },
});

export const deleteFile = mutation({
    args: {
        fileId: v.optional(v.id("files")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.fileId) {
            throw new Error("File not found");
        }

        const file = await ctx.db.get(args.fileId);

        if (!file) {
            throw new Error("File not found");
        }

        if (file.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.fileId);
        return { success: true };
    },
});

export const deleteByPath = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        path: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.path) {
            throw new Error("Path not found");
        }

        const file = await ctx.db.query("files")
            .withIndex("by_chat_path", (q) => q.eq("chatId", args.chatId!).eq("path", args.path!)).unique();

        if (!file) {
            throw new Error("File not found");
        }

        if (file.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(file._id);
        return { success: true };
    },
});

export const updateByPath = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        path: v.optional(v.string()),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.path) {
            throw new Error("Path not found");
        }

        if (!args.content) {
            throw new Error("Content not found");
        }

        const file = await ctx.db.query("files")
            .withIndex("by_chat_path", (q) => q.eq("chatId", args.chatId!).eq("path", args.path!)).unique();

        if (!file) {
            throw new Error("File not found");
        }

        if (file.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(file._id, {
            content: args.content,
        });

        return { success: true };
    },
});