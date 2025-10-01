import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const getAll = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return [];
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            return [];
        }

        if (chat.userId !== user._id) {
            return [];
        }

        const suggestions = await ctx.db
            .query("suggestions")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .collect();

        return suggestions.flatMap(suggestion => suggestion.suggestions);
    },
});

export const upsert = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        suggestions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.suggestions) {
            throw new Error("Suggestions not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id) {
            throw new Error("Access denied");
        }

        // Check if suggestion already exists for this chat
        const existingSuggestion = await ctx.db
            .query("suggestions")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .first();

        if (existingSuggestion) {
            // Update existing suggestion
            await ctx.db.patch(existingSuggestion._id, {
                suggestions: args.suggestions,
            });
            return existingSuggestion._id;
        } else {
            // Create new suggestion if none exists
            const suggestionId = await ctx.db.insert("suggestions", {
                chatId: args.chatId,
                userId: user._id,
                suggestions: args.suggestions,
            });
            return suggestionId;
        }
    },
});