import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { UIMessage } from "ai";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getMessagesForChat(chatId: Id<"chats">): Promise<UIMessage[]> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const messages = await convex.query(api.messages.getAll, { chatId });

        if (!messages) {
            return [];
        }

        // Format messages to match UIMessage structure
        return messages.map((message) => ({
            id: message._id,
            role: message.role,
            parts: [{ type: "text" as const, text: message.content }],
        }));
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}


export async function getChatById(chatId: Id<"chats">): Promise<Doc<"chats"> | null> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);
        
        const chat = await convex.query(api.chats.getById, { chatId });
        return chat;
    } catch (error) {
        console.error("Error fetching chat:", error);
        return null;
    }
}