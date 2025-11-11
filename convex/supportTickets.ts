import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate upload URL for file attachments
export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Get storage URL for an attachment
export const getAttachmentUrl = query({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Get all tickets for the current user
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const tickets = await ctx.db
            .query("supportTickets")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        // Fetch chat titles for tickets that have a chatId
        const ticketsWithChatInfo = await Promise.all(
            tickets.map(async (ticket) => {
                if (ticket.chatId) {
                    const chat = await ctx.db.get(ticket.chatId);
                    return {
                        ...ticket,
                        chatTitle: chat?.title || "Unknown Chat"
                    };
                }
                return {
                    ...ticket,
                    chatTitle: null
                };
            })
        );

        return ticketsWithChatInfo;
    },
});

// Get tickets by status
export const getByStatus = query({
    args: {
        status: v.union(v.literal("open"), v.literal("closed")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const tickets = await ctx.db
            .query("supportTickets")
            .withIndex("by_user_id_status", (q) =>
                q.eq("userId", user._id).eq("status", args.status)
            )
            .order("desc")
            .collect();

        // Fetch chat titles for tickets that have a chatId
        const ticketsWithChatInfo = await Promise.all(
            tickets.map(async (ticket) => {
                if (ticket.chatId) {
                    const chat = await ctx.db.get(ticket.chatId);
                    return {
                        ...ticket,
                        chatTitle: chat?.title || "Unknown Chat"
                    };
                }
                return {
                    ...ticket,
                    chatTitle: null
                };
            })
        );

        return ticketsWithChatInfo;
    },
});

// Get ticket counts for different statuses
export const getCounts = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        const allTickets = await ctx.db
            .query("supportTickets")
            .withIndex("by_user_id", (q) => q.eq("userId", user._id))
            .collect();

        const openTickets = allTickets.filter(t => t.status === "open");
        const closedTickets = allTickets.filter(t => t.status === "closed");

        return {
            all: allTickets.length,
            open: openTickets.length,
            closed: closedTickets.length,
        };
    },
});

// Create a new support ticket
export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        chatId: v.optional(v.id("chats")),
        attachments: v.optional(v.array(v.object({
            storageId: v.string(),
            name: v.string(),
            type: v.string(),
            size: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        // Validate that the chat belongs to the user if chatId is provided
        if (args.chatId) {
            const chat = await ctx.db.get(args.chatId);
            if (!chat || (chat.userId !== user._id && user.role !== "admin")) {
                throw new Error("Access denied to this chat");
            }
        }

        const ticketId = await ctx.db.insert("supportTickets", {
            userId: user._id,
            chatId: args.chatId,
            title: args.title.trim(),
            description: args.description.trim(),
            status: "open",
            attachments: args.attachments,
        });

        return ticketId;
    },
});

// Update ticket status
export const updateStatus = mutation({
    args: {
        ticketId: v.id("supportTickets"),
        status: v.union(v.literal("open"), v.literal("closed")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.patch(args.ticketId, {
            status: args.status,
        });

        return args.ticketId;
    },
});

// Delete a ticket
export const deleteTicket = mutation({
    args: {
        ticketId: v.id("supportTickets"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.ticketId);

        return { success: true };
    },
});

// Get a single ticket by ID
export const getById = query({
    args: {
        ticketId: v.id("supportTickets"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (ticket.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        // Fetch chat info if chatId exists
        let chatInfo = null;
        if (ticket.chatId) {
            const chat = await ctx.db.get(ticket.chatId);
            chatInfo = chat ? { id: chat._id, title: chat.title } : null;
        }

        return {
            ...ticket,
            chatInfo,
        };
    },
});

// Admin queries
// Get all tickets for admin (with pagination and search)
export const getAllAsAdmin = query({
    args: {
        paginationOpts: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const tickets = await ctx.db
            .query("supportTickets")
            .order("desc")
            .collect();

        // Fetch user info and chat titles for each ticket
        const ticketsWithInfo = await Promise.all(
            tickets.map(async (ticket) => {
                const ticketUser = await ctx.db.get(ticket.userId);
                let chatTitle = null;
                if (ticket.chatId) {
                    const chat = await ctx.db.get(ticket.chatId);
                    chatTitle = chat?.title || "Unknown Chat";
                }
                return {
                    ...ticket,
                    userName: ticketUser?.name || "Unknown User",
                    userEmail: ticketUser?.email || "Unknown Email",
                    chatTitle,
                };
            })
        );

        return ticketsWithInfo;
    },
});

// Get ticket counts for admin
export const getCountsAsAdmin = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const allTickets = await ctx.db
            .query("supportTickets")
            .collect();

        const openTickets = allTickets.filter(t => t.status === "open");
        const closedTickets = allTickets.filter(t => t.status === "closed");

        return {
            all: allTickets.length,
            open: openTickets.length,
            closed: closedTickets.length,
        };
    },
});

// Admin: Update ticket status
export const updateStatusAsAdmin = mutation({
    args: {
        ticketId: v.id("supportTickets"),
        status: v.union(v.literal("open"), v.literal("closed")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        await ctx.db.patch(args.ticketId, {
            status: args.status,
        });

        return args.ticketId;
    },
});

// Admin: Delete a ticket
export const deleteTicketAsAdmin = mutation({
    args: {
        ticketId: v.id("supportTickets"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        await ctx.db.delete(args.ticketId);

        return { success: true };
    },
});
