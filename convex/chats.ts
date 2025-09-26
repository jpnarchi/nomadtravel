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
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
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
        });

        return chatId;
    },
});

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