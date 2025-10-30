'use client'

import { useRef, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageInput } from "./message-input"
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Footer } from "../global/footer";
import { createPromptWithAttachments } from "@/lib/utils";
import { PricingPopup } from "../pricing/pricing-popup";

export function ChatContainer() {
    const { isSignedIn } = useAuth();
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);

    const router = useRouter();
    const user = useQuery(api.users.getUserInfo);
    const canCreateChat = useQuery(api.chats.canCreateChat);

    const createChat = useMutation(api.chats.create);
    const createMessage = useMutation(api.messages.create);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const saveFile = useMutation(api.messages.saveFile);
    const updateParts = useMutation(api.messages.updateParts);

    // Load saved draft on component mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('astri-dev-draft');
        if (savedDraft) {
            setInput(savedDraft);
        }
    }, []);

    // Save to localStorage every time input changes (only if not signed in)
    useEffect(() => {
        if (!isSignedIn) {
            localStorage.setItem('astri-dev-draft', input);
        }
    }, [input, isSignedIn]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isSignedIn) {
            router.push('/sign-in');
            return
        }

        // Check if user can create more chats (server-side validation)
        if (canCreateChat && !canCreateChat.canCreate) {
            setShowPricingPopup(true);
            return;
        }

        setIsLoading(true);
        try {
            if (input.trim()) {
                const chatId = await createChat();

                // create message 
                const messageId = await createMessage({
                    chatId,
                    role: "user",
                    parts: [{ type: "text", text: '' }],
                });

                const fileUrls = [];
                let prompt = input

                // check if files are present 
                if (files.length > 0) {
                    for (const file of files) {
                        const postUrl = await generateUploadUrl();
                        const result = await fetch(postUrl, {
                            method: "POST",
                            headers: { "Content-Type": file.type },
                            body: file,
                        });
                        const { storageId } = await result.json();

                        const { url } = await saveFile({
                            storageId,
                            messageId: messageId,
                            type: file.type,
                        });

                        fileUrls.push({ url: url, type: file.type });
                    }

                    prompt = createPromptWithAttachments(input, fileUrls);
                }

                await updateParts({
                    messageId: messageId,
                    parts: [{ type: "text", text: prompt }],
                });

                // setFiles([]);
                // if (fileInputRef.current) {
                //     fileInputRef.current.value = '';
                // }

                localStorage.removeItem('astri-dev-draft');

                router.push(`/chat/${chatId}`);
            }
        } catch (error: any) {
            console.error(error);

            // Check if it's a chat limit error
            if (error.message && error.message.includes('Chat limit exceeded')) {
                setShowPricingPopup(true);
                return;
            }

            toast.error('Error al crear el chat');
        }
    };

    return (
        <>
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
                            className="text-black text-4xl sm:text-5xl"
                            exit={{
                                y: -30,
                                opacity: 0,
                                transition: { duration: 0.2, ease: "easeInOut" }
                            }}
                        >
                            Crea tus Presentaciones con IA
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
                                files={files}
                                setFiles={setFiles}
                                fileInputRef={fileInputRef}
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
                <Footer />
            </div>
            <PricingPopup
                isOpen={showPricingPopup}
                onOpenChange={setShowPricingPopup}
            />
        </>
    )
}