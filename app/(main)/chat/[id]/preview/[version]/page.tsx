import { getChatById, getFilesForVersion } from "@/lib/convex-server";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { Preview } from "@/components/preview/preview";

export default async function Page({ params }: { params: Promise<{ id: string, version: string }> }) {
    const { id, version } = await params;
    const chat = await getChatById(id as Id<"chats">);
    if (!chat) {
        notFound();
    }

    const files = await getFilesForVersion(id as Id<"chats">, parseInt(version));

    return <Preview id={id as Id<"chats">} initialFiles={files} />
}