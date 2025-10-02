import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getStorageUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        return url;
    },
});

export const updateParts = mutation({
    args: {
        messageId: v.id("messages"),
        parts: v.array(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.messageId) {
            throw new Error("Message ID not found");
        }

        if (!args.parts) {
            throw new Error("Parts not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.messageId, {
            parts: args.parts,
        });

        return { success: true };
    },
})

export const saveFile = mutation({
    args: {
        storageId: v.id("_storage"),
        messageId: v.id("messages"),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.storageId) {
            throw new Error("Storage ID not found");
        }

        if (!args.messageId) {
            throw new Error("Message ID not found");
        }

        if (!args.type) {
            throw new Error("Type not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        const files = message.files || [];
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("URL not found");
        }
        files.push({ storageId: args.storageId, type: args.type, url: url });

        await ctx.db.patch(args.messageId, {
            files: files,
        });

        return { url: url };
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

        if (chat.userId !== user._id && user.plan !== "admin") {
            throw new Error("Access denied");
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();

        return messages;
    },
});

export const create = mutation({
    args: {
        chatId: v.optional(v.id('chats')),
        role: v.optional(v.union(
            v.literal("user"),
            v.literal("assistant")
        )),
        parts: v.optional(v.array(v.any())),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.role) {
            throw new Error("Role not found");
        }

        if (!args.parts) {
            throw new Error("Message parts not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.plan !== "admin") {
            throw new Error("Access denied");
        }

        const messageId = await ctx.db.insert("messages", {
            chatId: args.chatId,
            userId: user._id,
            role: args.role,
            parts: args.parts,
        });

        return messageId;
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.messageId) {
            throw new Error("Message not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.messageId);
        return { success: true };
    },
});