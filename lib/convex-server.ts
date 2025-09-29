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
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}

export async function getPromptForAgent(agent: "main_agent" | "code_generator" | "title_generator" | "suggestion_generator"): Promise<string> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const prompt = await convex.query(api.prompts.get, { agent });

        if (!prompt) {
            return '';
        }

        return prompt.prompt;
    } catch (error) {
        console.error("Error fetching prompt:", error);
        return '';
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

export async function getFilesForChat(chatId: Id<"chats">): Promise<Record<string, string>> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const files = await convex.query(api.files.getAll, { chatId });

        if (!files) {
            return {};
        }

        return files.reduce((acc, file) => ({
            ...acc,
            [file.path]: file.content
        }), {});
    } catch (error) {
        console.error("Error fetching files:", error);
        return {};
    }
}

export async function createFileForChat(chatId: Id<"chats">, path: string, content: string): Promise<Id<"files"> | undefined> {
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        convex.setAuth(token);

        const file = await convex.mutation(api.files.create, { chatId, path, content });

        return file;
    } catch (error) {
        console.error("Error creating file:", error);
        return undefined;
    }
}

export async function deleteFileForChat(chatId: Id<"chats">, path: string): Promise<boolean> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const file = await convex.mutation(api.files.deleteByPath, { chatId, path });

        if (!file) {
            return false;
        }

        return file.success;
    } catch (error) {
        console.error("Error fetching files:", error);
        return false;
    }
}

export async function updateFileForChat(chatId: Id<"chats">, path: string, content: string): Promise<boolean> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const file = await convex.mutation(api.files.updateByPath, { chatId, path, content });

        if (!file) {
            return false;
        }

        return file.success;
    } catch (error) {
        console.error("Error fetching files:", error);
        return false;
    }
}