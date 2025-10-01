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
            files: message.files,
        }));

        return formattedMessages;
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

export async function getFilesForVersion(chatId: Id<"chats">, version: number): Promise<Record<string, string>> {
    try {
        // Get the user's session token from Clerk
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        // Set the auth token for this request
        convex.setAuth(token);

        const files = await convex.query(api.files.getAll, { chatId, version });

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

export async function getAllTemplates(): Promise<Doc<"templates">[]> {
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        convex.setAuth(token);

        const templates = await convex.query(api.templates.getAll);

        if (!templates) {
            return [];
        }

        return templates;
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
}

export async function getTemplateFiles(name: string): Promise<Doc<"templateFiles">[]> {
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        convex.setAuth(token);

        const templateFiles = await convex.query(api.templates.getFiles, { name: name });

        if (!templateFiles) {
            return [];
        }

        return templateFiles;
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
}

export async function getTemplateById(id: Id<"templates">): Promise<Doc<"templates"> | null> {
    try {
        const { getToken } = await auth();
        const token = await getToken({ template: "convex" });

        if (!token) {
            throw new Error("No authentication token available");
        }

        convex.setAuth(token);

        const template = await convex.query(api.templates.getById, { id });
        return template;
    } catch (error) {
        console.error("Error fetching template:", error);
        return null;
    }
}