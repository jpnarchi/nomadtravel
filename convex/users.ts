import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Helper function to get current user (exported for reuse in other files)
export const getCurrentUser = async (ctx: QueryCtx) => {
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
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        const users = await ctx.db
            .query("users")
            .order("desc")
            .paginate(args.paginationOpts);

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
            if (user.pictureUrl !== identity.pictureUrl) {
                await ctx.db.patch(user._id, { pictureUrl: identity.pictureUrl });
            }
            return user._id;
        }

        return await ctx.db.insert("users", {
            email: identity.email ?? "Anonymous",
            name: identity.name ?? "Anonymous",
            pictureUrl: identity.pictureUrl ?? undefined,
            tokenIdentifier: identity.tokenIdentifier,
            plan: "free",
            lastLogin: Date.now(),
        });
    },
})

export const updateLastLogin = mutation({
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

        if (user === null) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, { lastLogin: Date.now() });
        return user._id;
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
        try {
            const user = await getCurrentUser(ctx);
            return user.plan === "admin";
        } catch (error) {
            // Return false for unsigned users or any other error
            return false;
        }
    },
})

export const searchByEmail = query({
    args: {
        searchTerm: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.plan !== "admin") {
            throw new Error("Unauthorized");
        }

        // If search term is empty, return all users
        if (!args.searchTerm.trim()) {
            return await ctx.db
                .query("users")
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Search for users by email using the by_email index
        const users = await ctx.db
            .query("users")
            .withIndex("by_email", (q) =>
                q.gte("email", args.searchTerm).lt("email", args.searchTerm + "\uffff")
            )
            .order("desc")
            .paginate(args.paginationOpts);

        return users;
    },
})