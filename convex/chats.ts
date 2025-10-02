import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return chats;
    },
});

export const create = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const chatId = await ctx.db.insert("chats", {
            userId: user._id,
            title: "New Chat",
            currentVersion: 1,
            isGenerating: false,
        });

        return chatId;
    },
});

export const duplicateChat = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        
        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        const newChatId = await ctx.db.insert("chats", {
            userId: user._id,
            title: chat.title + " (Copia)",
            currentVersion: chat.currentVersion,
            isGenerating: false,
        });

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();
        
        for (const message of messages) {
            await ctx.db.insert("messages", {
                chatId: newChatId,
                userId: user._id,
                role: message.role,
                parts: message.parts,
            });
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();
        
        for (const file of files) {
            await ctx.db.insert("files", {
                chatId: newChatId,
                userId: user._id,
                path: file.path,
                content: file.content,
                version: chat.currentVersion ?? 1, 
            });
        }

        const suggestions = await ctx.db
            .query("suggestions")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();
        
        for (const suggestion of suggestions) {
            await ctx.db.insert("suggestions", {
                chatId: newChatId,
                userId: user._id,
                suggestions: suggestion.suggestions,
            });
        }

        return newChatId;
    },
})

export const updateIsGenerating = mutation({
    args: {
        chatId: v.id("chats"),
        isGenerating: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            isGenerating: args.isGenerating,
        });
    },
});

export const getIsGenerating = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        return chat.isGenerating;
    },
});

export const getCurrentVersion = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        return chat.currentVersion;
    },
});

export const updateCurrentVersion = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        currentVersion: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            currentVersion: args.currentVersion,
        });

        return args.chatId;
    },
})

export const updateTitle = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            title: args.title,
        });

        return args.chatId;
    },
})

export const verifyOwnership = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return null;
        }

        const chat = await ctx.db.get(args.chatId);

        if (chat && chat.userId === user._id) {
            return chat;
        }

        return null;
    },
});

export const deleteChat = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied")
        }

        const messages = await ctx.db.query("messages").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        const suggestions = await ctx.db.query("suggestions").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const suggestion of suggestions) {
            await ctx.db.delete(suggestion._id);
        }

        const files = await ctx.db.query("files").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const file of files) {
            await ctx.db.delete(file._id);
        }

        await ctx.db.delete(args.chatId);

        return { success: true };
    },
});

export const getById = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        return chat;
    },
});

export const getTitle = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        return chat.title;
    },
});