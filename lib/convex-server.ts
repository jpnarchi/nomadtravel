import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { UIMessage, UIMessagePart } from "ai";
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

        const formattedMessages = messages.map((message) => ({
            id: message._id,
            role: message.role,
            parts: message.parts,
        }));

        return formattedMessages;

        // return messages.map((message) => ({
        //     id: message._id,
        //     role: message.role,
        //     parts: message.parts.map((part): UIMessagePart<any, any> => {
        //         // Handle tool parts that need specific type formatting
        //         if (part.type.startsWith('tool-') && 'toolCallId' in part) {
        //             return {
        //                 ...part,
        //                 type: part.type as `tool-${string}`, // Type assertion for tool parts
        //             } as UIMessagePart<any, any>;
        //         }

        //         // Handle dynamic tool parts
        //         if (part.type === 'dynamic-tool') {
        //             return part as UIMessagePart<any, any>;
        //         }

        //         // Handle data parts
        //         if (part.type.startsWith('data-')) {
        //             return {
        //                 ...part,
        //                 type: part.type as `data-${string}`,
        //             } as UIMessagePart<any, any>;
        //         }

        //         // Handle all other standard parts (text, reasoning, file, source-url, source-document, step-start)
        //         return part as UIMessagePart<any, any>;
        //     }),
        // }));
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

export async function getSuggestionsForChat(chatId: Id<"chats">): Promise<string[]> {
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        convex.setAuth(token);

        const suggestions = await convex.query(api.suggestions.getAll, { chatId });

        if (!suggestions) {
            return [];
        }

        return suggestions.flatMap(suggestion => suggestion.suggestions);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
}