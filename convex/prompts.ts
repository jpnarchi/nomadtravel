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

export const get = query({
    args: {
        agent: v.union(
            v.literal("main_agent"),
            v.literal("code_generator"),
            v.literal("title_generator"),
            v.literal("suggestion_generator")
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.agent) {
            throw new Error("Agent not found");
        }

        const prompt = await ctx.db
            .query("prompts")
            .withIndex("by_agent", (q) => q.eq("agent", args.agent))
            .first();

        return prompt;
    },
});

export const update = mutation({
    args: {
        agent: v.optional(v.union(
            v.literal("main_agent"),
            v.literal("code_generator"),
            v.literal("title_generator"),
            v.literal("suggestion_generator")
        )),
        prompt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        if (!args.agent) {
            throw new Error("Agent not found");
        }

        if (!args.prompt) {
            throw new Error("Prompt not found");
        }

        const prompt = await ctx.db
            .query("prompts")
            .withIndex("by_agent", (q) => q.eq("agent", args.agent!))
            .first();

        if (!prompt) {
            const promptId = await ctx.db.insert("prompts", {
                agent: args.agent!,
                prompt: args.prompt!,
            });
            return promptId;
        }

        await ctx.db.patch(prompt._id, {
            prompt: args.prompt,
        });

        return prompt._id;
    },
});