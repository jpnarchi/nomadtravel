import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.string(),
        email: v.string(),
        pictureUrl: v.optional(v.string()),
        plan: v.optional(
            v.union(
                v.literal("free"),
                v.literal("basic"),
                v.literal("pro"),
                v.literal("admin")
            )
        )
    })
        .index('by_token_identifier', ['tokenIdentifier'])
        .index('by_email', ['email'])
        .index('by_plan', ['plan'])
    ,
    chats: defineTable({
        userId: v.id('users'),
        title: v.optional(v.string()),
    })
        .index('by_user_id', ['userId'])
    ,
    messages: defineTable({
        chatId: v.id('chats'),
        userId: v.id('users'),
        role: v.union(
            v.literal("user"),
            v.literal("assistant")
        ),
        parts: v.array(v.any()),
    })
        .index('by_chat_id', ['chatId'])
    ,
    suggestions: defineTable({
        chatId: v.id('chats'),
        userId: v.id('users'),
        suggestions: v.array(v.string()),
    })
        .index('by_chat_id', ['chatId'])
    ,
    files: defineTable({
        chatId: v.id('chats'),
        userId: v.id('users'),
        path: v.string(),
        content: v.string(),
    })
        .index('by_chat_id', ['chatId'])
        .index('by_chat_path', ['chatId', 'path'])
    ,
});