'use client'

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageInput } from "./message-input"
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Footer } from "../global/footer";

export function ChatContainer() {
    const { isSignedIn } = useAuth();
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const createChat = useMutation(api.chats.create);
    const createMessage = useMutation(api.messages.create);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return
        }
        setIsLoading(true);
        e.preventDefault();
        try {
            if (input.trim()) {
                const chatId = await createChat();
                await createMessage({
                    chatId,
                    role: "user",
                    parts: [{ type: "text", text: input }],
                });

                router.push(`/chat/${chatId}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create chat');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key="initial-state"
                    className="flex-1 flex flex-col items-center justify-center gap-4 pb-8"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        y: -20,
                        transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    <motion.p
                        className="text-white text-4xl sm:text-5xl"
                        exit={{
                            y: -30,
                            opacity: 0,
                            transition: { duration: 0.2, ease: "easeInOut" }
                        }}
                    >
                        Ready to build?
                    </motion.p>
                    <motion.div
                        className="w-full"
                        exit={{
                            y: 20,
                            opacity: 0,
                            transition: { duration: 0.3, delay: 0.1, ease: "easeInOut" }
                        }}
                    >
                        <MessageInput
                            input={input}
                            setInput={setInput}
                            handleSubmit={handleSubmit}
                            isLoading={isLoading}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
            <Footer />
        </div>
    )
}