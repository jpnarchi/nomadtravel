import { Chat } from "@/components/chat";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const messages = {
        id: "1",
        parts: [{ type: "text" as const, text: "Hello, how are you?" }],
        role: "user" as "user" | "system" | "assistant",
    }
    return <Chat id={id} initialMessages={[messages]} />
}