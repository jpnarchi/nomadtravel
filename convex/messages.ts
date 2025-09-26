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

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("desc")
            .collect();

        return messages;
    },
});

export const create = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        role: v.optional(v.union(v.literal("user"), v.literal("assistant"))),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.role) {
            throw new Error("Role not found");
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

        const messageId = await ctx.db.insert("messages", {
            chatId: args.chatId,
            userId: user._id,
            role: args.role,
            content: args.content,
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