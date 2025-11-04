import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUser, getVersionLimit } from "./users";

// Chat limits for different plans
const CHAT_LIMITS = {
    free: 1,
    pro: 8000,
    premium: 8000,
    admin: 8000,
} as const;

// Helper function to get chat limit for a user
const getChatLimit = (user: { plan?: string; role?: string }): number => {
    if (user.role === "admin") {
        return CHAT_LIMITS.admin;
    }

    switch (user.plan) {
        case "free":
            return CHAT_LIMITS.free;
        case "pro":
            return CHAT_LIMITS.pro;
        case "premium":
            return CHAT_LIMITS.premium;
        default:
            return CHAT_LIMITS.free;
    }
};

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return chats;
    },
});

export const create = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        // Check if user has reached chat limit
        const chatLimit = getChatLimit(user);
        const existingChats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        if (existingChats.length >= chatLimit) {
            throw new Error(`Chat limit exceeded. Maximum chats allowed: ${chatLimit}. Please upgrade your plan to create more chats.`);
        }

        const chatId = await ctx.db.insert("chats", {
            userId: user._id,
            title: "New Chat",
            currentVersion: 1,
            isGenerating: false,
        });

        return chatId;
    },
});

export const duplicateChat = mutation({
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

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        // Check if user has reached chat limit
        const chatLimit = getChatLimit(user);
        const existingChats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        if (existingChats.length >= chatLimit) {
            throw new Error(`Chat limit exceeded. Maximum chats allowed: ${chatLimit}. Please upgrade your plan to create more chats.`);
        }

        const newChatId = await ctx.db.insert("chats", {
            userId: user._id,
            title: chat.title + " (Copia)",
            currentVersion: chat.currentVersion,
            isGenerating: false,
        });

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();

        for (const message of messages) {
            await ctx.db.insert("messages", {
                chatId: newChatId,
                userId: user._id,
                role: message.role,
                parts: message.parts,
            });
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();

        for (const file of files) {
            await ctx.db.insert("files", {
                chatId: newChatId,
                userId: user._id,
                path: file.path,
                content: file.content,
                version: chat.currentVersion ?? 1,
            });
        }

        const suggestions = await ctx.db
            .query("suggestions")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();

        for (const suggestion of suggestions) {
            await ctx.db.insert("suggestions", {
                chatId: newChatId,
                userId: user._id,
                suggestions: suggestion.suggestions,
            });
        }

        return newChatId;
    },
})

export const updateIsGenerating = mutation({
    args: {
        chatId: v.id("chats"),
        isGenerating: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            isGenerating: args.isGenerating,
        });
    },
});

export const getIsGenerating = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            return false;
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat.isGenerating;
    },
});

export const getCurrentVersion = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return 1;
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            return 1;
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat.currentVersion;
    },
});

export const updateCurrentVersion = mutation({
    args: {
        chatId: v.optional(v.id("chats")),
        currentVersion: v.optional(v.number()),
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

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        // Check version limit before updating
        if (args.currentVersion) {
            const versionLimit = getVersionLimit(user);
            if (args.currentVersion > versionLimit) {
                throw new Error(`Version limit exceeded. Maximum versions allowed: ${versionLimit}`);
            }
        }

        await ctx.db.patch(args.chatId, {
            currentVersion: args.currentVersion,
        });

        return args.chatId;
    },
})

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

        if (chat.userId !== user._id && user.role !== "admin") {
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

        if (chat && chat.userId === user._id || user.role === "admin") {
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

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied")
        }

        const messages = await ctx.db.query("messages").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        const suggestions = await ctx.db.query("suggestions").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const suggestion of suggestions) {
            await ctx.db.delete(suggestion._id);
        }

        const files = await ctx.db.query("files").withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!)).collect();

        for (const file of files) {
            await ctx.db.delete(file._id);
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

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat;
    },
});

export const getTitle = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat.title;
    },
});

export const getUserChatsAsAdmin = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        // Only admins can view other users' chats
        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return chats;
    },
});

export const searchUserChatsAsAdmin = query({
    args: {
        userId: v.id("users"),
        searchTerm: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        // Only admins can view other users' chats
        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // If search term is empty, return all chats for the user
        if (!args.searchTerm.trim()) {
            return await ctx.db
                .query("chats")
                .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Search for chats by title using the composite index by_user_id_title
        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id_title", (q) =>
                q.eq("userId", args.userId)
                    .gte("title", args.searchTerm)
                    .lt("title", args.searchTerm + "\uffff")
            )
            .order("desc")
            .paginate(args.paginationOpts);

        return chats;
    },
});

export const getUserChatsCountAsAdmin = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        // Only admins can view other users' chats
        if (currentUser.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const chats = await ctx.db
            .query("chats")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .collect();

        return chats.length;
    },
});

export const updateSupabaseProjectIdForChat = mutation({
    args: {
        chatId: v.id("chats"),
        supabaseProjectId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.supabaseProjectId) {
            throw new Error("Supabase project id is required");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            supabaseProjectId: args.supabaseProjectId,
        });

        return args.chatId;
    },
});

export const getSupabaseProjectId = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return null;
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            return null;
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat.supabaseProjectId;
    },
});

export const updateVercelProjectId = mutation({
    args: {
        chatId: v.id("chats"),
        vercelProjectId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.vercelProjectId) {
            throw new Error("Vercel project id is required");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            vercelProjectId: args.vercelProjectId,
        });

        return args.chatId;
    },
});

export const updatedDeploymentUrl = mutation({
    args: {
        chatId: v.id("chats"),
        deploymentUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.deploymentUrl) {
            throw new Error("Deployment url is required");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.chatId, {
            deploymentUrl: args.deploymentUrl,
        });

        return args.chatId;
    },
});

export const getDeploymentUrl = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return null;
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            return null;
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        return chat.deploymentUrl;
    },
});

export const transferChatOwnership = mutation({
    args: {
        chatId: v.id("chats"),
        newOwnerEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);

        // Verify the chat exists and current user owns it
        const chat = await ctx.db.get(args.chatId);
        if (!chat) {
            // throw new Error("Chat not found");
            return {
                success: false,
                newOwnerName: "",
                newOwnerEmail: "",
            };
        }

        if (chat.userId !== currentUser._id && currentUser.role !== "admin") {
            throw new Error("Access denied");
        }

        // Find the new owner by email
        const newOwner = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.newOwnerEmail))
            .first();

        if (!newOwner) {
            throw new Error("User with this email does not exist");
        }

        // Prevent transferring to the same user
        if (newOwner._id === currentUser._id) {
            throw new Error("Cannot transfer chat to yourself");
        }

        // Update chat ownership
        await ctx.db.patch(args.chatId, {
            userId: newOwner._id,
        });

        // Update all messages for this chat
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
            .collect();

        for (const message of messages) {
            await ctx.db.patch(message._id, {
                userId: newOwner._id,
            });
        }

        // Update all files for this chat
        const files = await ctx.db
            .query("files")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
            .collect();

        for (const file of files) {
            await ctx.db.patch(file._id, {
                userId: newOwner._id,
            });
        }

        // Update all suggestions for this chat
        const suggestions = await ctx.db
            .query("suggestions")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
            .collect();

        for (const suggestion of suggestions) {
            await ctx.db.patch(suggestion._id, {
                userId: newOwner._id,
            });
        }

        return {
            success: true,
            newOwnerName: newOwner.name,
            newOwnerEmail: newOwner.email,
        };
    },
});

export const validateUserEmail = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            return { exists: false };
        }

        return {
            exists: true,
            name: user.name,
            email: user.email,
        };
    },
});

// Query to check if user can create more chats
export const canCreateChat = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await getCurrentUser(ctx);
            const chatLimit = getChatLimit(user);
            const existingChats = await ctx.db
                .query("chats")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .collect();

            return {
                canCreate: existingChats.length < chatLimit,
                currentCount: existingChats.length,
                limit: chatLimit,
                plan: user.plan || "free",
            };
        } catch (error) {
            // Return default values for unauthenticated users
            return {
                canCreate: false,
                currentCount: 0,
                limit: 0,
                plan: "free",
            };
        }
    },
});

// Query to get user's chat count and limit info
export const getChatLimitInfo = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await getCurrentUser(ctx);
            const chatLimit = getChatLimit(user);
            const existingChats = await ctx.db
                .query("chats")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .collect();

            return {
                currentCount: existingChats.length,
                limit: chatLimit,
                plan: user.plan || "free",
                role: user.role || "user",
            };
        } catch (error) {
            // Return default values for unauthenticated users
            return {
                currentCount: 0,
                limit: 0,
                plan: "free",
                role: "user",
            };
        }
    },
});

// Query to get ALL presentations with their first slides
export const getAllPresentationsWithFirstSlide = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await getCurrentUser(ctx);

            // Get ALL chats ordered by creation time (desc)
            const allChats = await ctx.db
                .query("chats")
                .withIndex("by_user_id", (q) => q.eq("userId", user._id))
                .order("desc")
                .collect();

            // For each chat, get the first slide (slide-1.json)
            const presentations = await Promise.all(
                allChats.map(async (chat) => {
                    // Get the first slide file
                    const files = await ctx.db
                        .query("files")
                        .withIndex("by_chat_id", (q) => q.eq("chatId", chat._id))
                        .collect();

                    // Find slide-1.json
                    const firstSlide = files.find((file) =>
                        file.path.includes('/slides/slide-1.json')
                    );

                    return {
                        chatId: chat._id,
                        title: chat.title || "Untitled",
                        firstSlideContent: firstSlide?.content || null,
                        createdAt: chat._creationTime,
                    };
                })
            );

            return presentations;
        } catch (error) {
            // Return empty array for unauthenticated users or errors
            return [];
        }
    },
});