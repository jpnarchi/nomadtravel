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
        ),
        lastLogin: v.optional(v.number())
    })
        .index('by_token_identifier', ['tokenIdentifier'])
        .index('by_email', ['email'])
        .index('by_plan', ['plan'])
    ,
    chats: defineTable({
        userId: v.id('users'),
        title: v.optional(v.string()),
        currentVersion: v.optional(v.number()),
        isGenerating: v.optional(v.boolean()),
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
        files: v.optional(v.array(v.object({
            storageId: v.string(),
            type: v.string(),
            url: v.string()
        }))),
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
        version: v.number(),
    })
        .index('by_chat_id', ['chatId'])
        .index('by_chat_version', ['chatId', 'version'])
        .index('by_chat_path_version', ['chatId', 'path', 'version'])
    ,
    templates: defineTable({
        name: v.string(),
        description: v.string(),
    })
        .index('by_name', ['name'])
    ,
    templateFiles: defineTable({
        templateId: v.id('templates'),
        path: v.string(),
        content: v.string(),
    })
        .index('by_templateId', ['templateId'])
});