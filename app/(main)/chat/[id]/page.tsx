import { Chat } from "@/components/chat/chat";
import { getChatById, getFilesForChat, getMessagesForChat, getSuggestionsForChat } from "@/lib/convex-server";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const chat = await getChatById(id as Id<"chats">);
    if (!chat) {
        notFound();
    }
    const initialMessages = await getMessagesForChat(id as Id<"chats">);
    const initialSuggestions = await getSuggestionsForChat(id as Id<"chats">);
    const initialFiles = await getFilesForChat(id as Id<"chats">);

    console.log(initialFiles);

    return (
        <Chat 
            id={id as Id<"chats">} 
            initialMessages={initialMessages} 
            initialSuggestions={initialSuggestions}
            initialTitle={chat.title || 'New Chat'}
            initialFiles={initialFiles}
        />
    )
}