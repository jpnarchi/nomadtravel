import { getChatById } from "@/lib/convex-server";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { Preview } from "@/components/preview/preview";

export default async function Page({ params }: { params: Promise<{ id: string, version: string }> }) {
    const { id, version } = await params;
    const chat = await getChatById(id as Id<"chats">);
    if (!chat) {
        notFound();
    }

    return <Preview id={id as Id<"chats">} version={parseInt(version)} />
}