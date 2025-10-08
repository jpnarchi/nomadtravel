import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getAll = query({
    args: {
        chatId: v.optional(v.id("chats")),
        version: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.version) {
            throw new Error("Version not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_chat_version", (q) => q.eq("chatId", args.chatId!).eq("version", args.version!))
            .collect();

        // Convert to Record<string, string> format for easier use
        const filesObject = files.reduce((acc, file) => {
            acc[file.path] = file.content;
            return acc;
        }, {} as Record<string, string>);

        return filesObject;
    },
});

export const create = mutation({
    args: {
        chatId: v.optional(v.id('chats')),
        path: v.optional(v.string()),
        content: v.optional(v.string()),
        version: v.optional(v.number()),
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

        if (!args.version) {
            throw new Error("Version not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        // Check if file already exists to prevent duplicates
        const existingFiles = await ctx.db.query("files")
            .withIndex("by_chat_path_version", (q) => q.eq("chatId", args.chatId!).eq("path", args.path!).eq("version", args.version!))
            .collect();
            
        if (existingFiles.length > 0) {
            return existingFiles[0]._id;
        }
            
        const fileId = await ctx.db.insert("files", {
            chatId: args.chatId,
            userId: user._id,
            path: args.path,
            content: args.content,
            version: args.version,
        });

        return fileId;
    },
});

export const deleteByPath = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        path: v.optional(v.string()),
        version: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.path) {
            throw new Error("Path not found");
        }

        if (!args.version) {
            throw new Error("Version not found");
        }

        const file = await ctx.db.query("files")
            .withIndex("by_chat_path_version", (q) => q.eq("chatId", args.chatId!).eq("path", args.path!).eq("version", args.version!))
            .unique();

        if (!file) {
            throw new Error("File not found");
        }

        if (file.userId !== user._id && user.role !== "admin") {
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
        version: v.optional(v.number()),
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

        if (!args.version) {
            throw new Error("Version not found");
        }

        const file = await ctx.db.query("files")
            .withIndex("by_chat_path_version", (q) => q.eq("chatId", args.chatId!).eq("path", args.path!).eq("version", args.version!))
            .unique();

        if (!file) {
            throw new Error("File not found");
        }

        if (file.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(file._id, {
            content: args.content,
        });

        return { success: true };
    },
});

export const createNewVersion = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        previousVersion: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.previousVersion) {
            throw new Error("Previous version not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        const newVersion = args.previousVersion + 1;

        await ctx.db.patch(args.chatId!, {
            currentVersion: newVersion,
        });

        const files = await ctx.db.query("files")
            .withIndex("by_chat_version", (q) => q.eq("chatId", args.chatId!).eq("version", args.previousVersion!))
            .collect();

        for (const file of files) {
            await ctx.db.insert("files", {
                chatId: args.chatId,
                userId: user._id,
                path: file.path,
                content: file.content,
                version: newVersion,
            });
        }

        return { 
            success: true,
            creationTime: new Date().toISOString(),
        };
    },
});

export const deleteFilesInVersion = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        version: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.version) {
            throw new Error("Version not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        const files = await ctx.db.query("files")
            .withIndex("by_chat_version", (q) => q.eq("chatId", args.chatId!).eq("version", args.version!))
            .collect();

        if (files.length > 0) {
            for (const file of files) {
                await ctx.db.delete(file._id);
            }
        }

        return { success: true };
    },
});

export const createBatch = mutation({
    args: {
        chatId: v.optional(v.id('chats')),
        files: v.array(v.object({
            path: v.string(),
            content: v.string(),
        })),
        version: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.version) {
            throw new Error("Version not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        const fileIds = [];
        for (const file of args.files) {
            const fileId = await ctx.db.insert("files", {
                chatId: args.chatId,
                userId: user._id,
                path: file.path,
                content: file.content,
                version: args.version,
            });
            fileIds.push(fileId);
        }

        return { success: true, fileIds };
    },
});