import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        pictureUrl: v.optional(v.string()),
        plan: v.optional(
            v.union(
                v.literal("free"),
                v.literal("pro"),
                v.literal("premium"),
            )
        ),
        role: v.optional(v.union(
            v.literal("user"),
            v.literal("admin")
        )),
        lastLogin: v.optional(v.number()),
        endsOn: v.optional(v.number()),
        subscriptionId: v.optional(v.string()),
        customerId: v.optional(v.string()),
        supabaseAccessToken: v.optional(v.string()),
        supabaseRefreshToken: v.optional(v.string()),
    })
        .index('by_token_identifier', ['tokenIdentifier'])
        .index('by_email', ['email'])
        .index('by_plan', ['plan'])
        .index("by_subscriptionId", ["subscriptionId"])
    ,
    chats: defineTable({
        userId: v.id('users'),
        title: v.optional(v.string()),
        currentVersion: v.optional(v.number()),
        isGenerating: v.optional(v.boolean()),
        supabaseProjectId: v.optional(v.string()),
        vercelProjectId: v.optional(v.string()),
        deploymentUrl: v.optional(v.string()),
    })
        .index('by_user_id', ['userId'])
        .index('by_title', ['title'])
        .index('by_user_id_title', ['userId', 'title'])
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
        version: v.optional(v.number()),
    })
        .index('by_chat_id', ['chatId'])
        .index('by_chat_role_version', ['chatId', 'role', 'version'])
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
        .index('by_templateId_path', ['templateId', 'path'])
    ,
    dailySignups: defineTable({
        date: v.string(), // Format: YYYY-MM-DD
        count: v.number(),
    })
        .index('by_date', ['date'])
    ,
    sessions: defineTable({
        userId: v.id('users'),
        date: v.string(), // Format: YYYY-MM-DD
    })
        .index('by_user_id', ['userId'])
        .index('by_date', ['date'])
        .index('by_user_id_date', ['userId', 'date'])
    ,
    totalUsers: defineTable({
        count: v.number(),
    })
});