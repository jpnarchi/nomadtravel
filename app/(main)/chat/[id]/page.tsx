import { Chat } from "@/components/chat/chat";
import { getChatById, getMessagesForChat } from "@/lib/convex-server";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const chat = await getChatById(id as Id<"chats">);
    if (!chat) {
        notFound();
    }
    const initialMessages = await getMessagesForChat(id as Id<"chats">);

    return (
        <Chat 
            id={id as Id<"chats">} 
            initialMessages={initialMessages} 
        />
    )
}