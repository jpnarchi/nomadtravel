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
        const users = await ctx.db.query("users").collect();
        return users;
    },
});

export const store = mutation({
    args: {},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token_identifier", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();

        if (user !== null) {
            if (user.name !== identity.name) {
                await ctx.db.patch(user._id, { name: identity.name });
            }
            if (user.email !== identity.email) {
                await ctx.db.patch(user._id, { email: identity.email });
            }
            return user._id;
        }

        return await ctx.db.insert("users", {
            email: identity.email ?? "Anonymous",
            name: identity.name ?? "Anonymous",
            tokenIdentifier: identity.tokenIdentifier,
            plan: "free",
        });
    },
})

export const getUsersByPlan = query({
    args: {
        plan: v.union(
            v.literal("free"), 
            v.literal("basic"), 
            v.literal("pro"), 
            v.literal("admin")
        ),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db.query("users")
            .withIndex("by_plan", (q) => q.eq("plan", args.plan as "free" | "basic" | "pro" | "admin"))
            .collect();
        return users;
    },
})

export const isAdmin = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        return user.plan === "admin";
    },
})