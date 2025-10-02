import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getCurrentUser } from "./users";

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getStorageUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        return url;
    },
});

export const updateParts = mutation({
    args: {
        messageId: v.id("messages"),
        parts: v.array(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.messageId) {
            throw new Error("Message ID not found");
        }

        if (!args.parts) {
            throw new Error("Parts not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.messageId, {
            parts: args.parts,
        });

        return { success: true };
    },
})

export const saveFile = mutation({
    args: {
        storageId: v.id("_storage"),
        messageId: v.id("messages"),
        type: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.storageId) {
            throw new Error("Storage ID not found");
        }

        if (!args.messageId) {
            throw new Error("Message ID not found");
        }

        if (!args.type) {
            throw new Error("Type not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        const files = message.files || [];
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) {
            throw new Error("URL not found");
        }
        files.push({ storageId: args.storageId, type: args.type, url: url });

        await ctx.db.patch(args.messageId, {
            files: files,
        });

        return { url: url };
    },
});

export const getAll = query({
    args: {
        chatId: v.optional(v.id("chats")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            return null;
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.plan !== "admin") {
            throw new Error("Access denied");
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId!))
            .order("asc")
            .collect();

        return messages;
    },
});

export const create = mutation({
    args: {
        chatId: v.optional(v.id('chats')),
        role: v.optional(v.union(
            v.literal("user"),
            v.literal("assistant")
        )),
        parts: v.optional(v.array(v.any())),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.chatId) {
            throw new Error("Chat not found");
        }

        if (!args.role) {
            throw new Error("Role not found");
        }

        if (!args.parts) {
            throw new Error("Message parts not found");
        }

        const chat = await ctx.db.get(args.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.plan !== "admin") {
            throw new Error("Access denied");
        }

        // Read the current version from the chat and stamp it onto the message
        const chatCurrent = await ctx.db.get(args.chatId);
        const currentVersion = chatCurrent?.currentVersion ?? 1;

        const messageId = await ctx.db.insert("messages", {
            chatId: args.chatId,
            userId: user._id,
            role: args.role,
            parts: args.parts,
            version: currentVersion,
        });

        return messageId;
    },
});

export const deleteMessage = mutation({
    args: {
        messageId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (!args.messageId) {
            throw new Error("Message not found");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        if (message.userId !== user._id) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.messageId);
        return { success: true };
    },
});

export const restoreVersion = mutation({
    args: {
        chatId: v.id("chats"),
        version: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const chat = await ctx.db.get(args.chatId);
        if (!chat) {
            throw new Error("Chat not found");
        }
        if (chat.userId !== user._id && user.plan !== "admin") {
            throw new Error("Access denied");
        }

        // Validate that the version exists
        if (args.version < 1) {
            throw new Error("Invalid version number");
        }

        try {
            // Delete files with version greater than the selected version
            const filesToDelete = await ctx.db
                .query("files")
                .withIndex("by_chat_version", (q) =>
                    q.eq("chatId", args.chatId).gt("version", args.version)
                )
                .collect();
            for (const file of filesToDelete) {
                await ctx.db.delete(file._id);
            }

            // Delete assistant messages with version greater than the selected version
            const aiMessagesToDelete = await ctx.db
                .query("messages")
                .withIndex("by_chat_role_version", (q) =>
                    q.eq("chatId", args.chatId).eq("role", "assistant").gt("version", args.version + 1)
                )
                .collect();

            for (const message of aiMessagesToDelete) {
                await ctx.db.delete(message._id);
            }

            // Delete user messages with version greater than the selected version
            const userMessagesToDelete = await ctx.db
                .query("messages")
                .withIndex("by_chat_role_version", (q) =>
                    q.eq("chatId", args.chatId).eq("role", "user").gt("version", args.version)
                )
                .collect();

            for (const message of userMessagesToDelete) {
                await ctx.db.delete(message._id);
            }

            // Create new version first (this will increment the currentVersion)
            await ctx.runMutation(api.files.createNewVersion, {
                chatId: args.chatId,
                previousVersion: args.version,
            });

            // Upsert suggestions as empty array
            await ctx.runMutation(api.suggestions.upsert, {
                chatId: args.chatId,
                suggestions: [],
            });

            return { success: true };
        } catch (error) {
            // If anything fails, we should log the error but not expose internal details
            console.error("Error in restoreVersion:", error);
            throw new Error("Failed to restore version. Please try again.");
        }
    },
});