import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayString = () => {
    const today = new Date();
    // Use local timezone instead of UTC to avoid date shifting
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to increment daily signup count
const incrementDailySignups = async (ctx: MutationCtx) => {
    const today = getTodayString();

    // Check if there's already a record for today
    const existingRecord = await ctx.db
        .query("dailySignups")
        .withIndex("by_date", (q) => q.eq("date", today))
        .unique();

    if (existingRecord) {
        // Increment existing count
        await ctx.db.patch(existingRecord._id, {
            count: existingRecord.count + 1
        });
    } else {
        // Create new record for today
        await ctx.db.insert("dailySignups", {
            date: today,
            count: 1
        });
    }
};

// Helper function to increment total users count
const incrementTotalUsers = async (ctx: MutationCtx) => {
    // Check if there's already a total users record
    const existingRecord = await ctx.db
        .query("totalUsers")
        .first();

    if (existingRecord) {
        // Increment existing count
        await ctx.db.patch(existingRecord._id, {
            count: existingRecord.count + 1
        });
    } else {
        // Create new record with count 1
        await ctx.db.insert("totalUsers", {
            count: 1
        });
    }
};

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
        try {
            return await getCurrentUser(ctx);
        } catch (error) {
            return null;
        }
    },
});

export const getAll = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
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

        // This is a new user signup - increment daily signup count and total users count
        await incrementDailySignups(ctx);
        await incrementTotalUsers(ctx);

        return await ctx.db.insert("users", {
            email: identity.email ?? "Anonymous",
            name: identity.name ?? "Anonymous",
            pictureUrl: identity.pictureUrl ?? undefined,
            tokenIdentifier: identity.tokenIdentifier,
            plan: "free",
            role: "user",
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
            v.literal("pro"),
            v.literal("premium"),
        ),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db.query("users")
            .withIndex("by_plan", (q) => q.eq("plan", args.plan as "free" | "pro" | "premium"))
            .collect();
        return users;
    },
})

export const isAdmin = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await getCurrentUser(ctx);
            return user.role === "admin";
        } catch (error) {
            return false;
        }
    },
})

export const searchByEmailAsAdmin = query({
    args: {
        searchTerm: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
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

export const getUserByIdAsAdmin = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        return user;
    },
})

export const updatePlanAsAdmin = mutation({
    args: {
        userId: v.id("users"),
        plan: v.union(
            v.literal("free"),
            v.literal("premium"),
            v.literal("pro"),
        ),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // Verify the target user exists
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(args.userId, { plan: args.plan });
        return { success: true };
    },
})

export const getDailySignups = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        let query = ctx.db.query("dailySignups");

        if (args.startDate && args.endDate) {
            // Filter by date range
            const records = await query.collect();
            return records.filter(record =>
                record.date >= args.startDate! && record.date <= args.endDate!
            ).sort((a, b) => a.date.localeCompare(b.date));
        } else {
            // Return all records sorted by date
            return await query.order("asc").collect();
        }
    },
})

export const trackDailySession = mutation({
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

        const today = getTodayString();

        // Check if there's already a session record for this user today
        const existingSession = await ctx.db
            .query("sessions")
            .withIndex("by_user_id_date", (q) =>
                q.eq("userId", user._id).eq("date", today)
            )
            .unique();

        // If no session exists for today, create one
        if (!existingSession) {
            await ctx.db.insert("sessions", {
                userId: user._id,
                date: today,
            });
        }

        return user._id;
    },
})

export const getSessionsAsAdmin = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const sessions = await ctx.db
            .query("sessions")
            .order("desc")
            .paginate(args.paginationOpts);

        // Get user information for each session
        const sessionsWithUsers = await Promise.all(
            sessions.page.map(async (session) => {
                const user = await ctx.db.get(session.userId);
                return {
                    ...session,
                    user: user ? {
                        name: user.name,
                        email: user.email,
                        pictureUrl: user.pictureUrl,
                    } : null,
                };
            })
        );

        return {
            ...sessions,
            page: sessionsWithUsers,
        };
    },
})

export const getTotalUsers = query({
    args: {},
    handler: async (ctx) => {
        const currentUser = await getCurrentUser(ctx);

        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const totalUsersRecord = await ctx.db
            .query("totalUsers")
            .first();

        return totalUsersRecord ? totalUsersRecord.count : 0;
    },
})

export const updateSubscription = internalMutation({
    args: {
        subscriptionId: v.string(),
        userId: v.id("users"),
        endsOn: v.number(),
        customerId: v.string(),
        plan: v.string(),
    },
    handler: async (ctx, { subscriptionId, userId, endsOn, customerId, plan }) => {
        await ctx.db.patch(userId, {
            subscriptionId: subscriptionId,
            customerId: customerId,
            endsOn: endsOn,
            plan: plan as "free" | "pro" | "premium"
        });
    },
});

export const updateSubscriptionById = internalMutation({
    args: {
        subscriptionId: v.string(),
        endsOn: v.number()
    },
    handler: async (ctx, { subscriptionId, endsOn }) => {
        const user = await ctx.db.query("users")
            .withIndex("by_subscriptionId", (q) => q.eq("subscriptionId", subscriptionId))
            .unique();

        if (!user) {
            throw new Error("User not found!");
        }

        await ctx.db.patch(user._id, {
            endsOn: endsOn
        });
    },
});

export const updateSupabaseAccessToken = mutation({
    args: {
        supabaseAccessToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        await ctx.db.patch(user._id, { 
            supabaseAccessToken: args.supabaseAccessToken
        });

        return user._id;
    },
});