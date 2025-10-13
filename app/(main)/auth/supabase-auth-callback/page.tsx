"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader } from "@/components/ai-elements/loader";

export default function SupabaseAuthCallbackPage() {
    return (
        <SupabaseAuthCallback />
    );
}

function SupabaseAuthCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Procesando...");

    const chatId = searchParams.get('chatId');
    const chat = useQuery(api.chats.getById, chatId ? { chatId: chatId as any } : "skip");

    useEffect(() => {
        if (chatId && chat && chat.currentVersion) {
            let currentVersion = chat.currentVersion - 1;
            if (currentVersion < 1) {
                currentVersion = 1;
            }
            setStatus("Redirigiendo al chat...");
            router.push(`/chat/${chatId}/preview/${currentVersion}`);
        } else if (chatId && chat === null) {
            setStatus("Chat no encontrado");
        } else if (!chatId) {
            setStatus("ID de chat no proporcionado");
        }
    }, [chatId, chat, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                    <p className="text-sm text-muted-foreground">
                        {status}
                    </p>
                </div>
            </div>
        </div>
    );
}
