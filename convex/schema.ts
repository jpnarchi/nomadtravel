import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.string(),
        email: v.string(),
        plan: v.optional(
            v.union(
                v.literal("free"), 
                v.literal("basic"), 
                v.literal("pro")
            )
        )
    })
        .index('by_token_identifier', ['tokenIdentifier'])
        .index('by_email', ['email'])
        .index('by_plan', ['plan'])
    ,
});