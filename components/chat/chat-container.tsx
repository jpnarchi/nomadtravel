'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { Id } from '@/convex/_generated/dataModel';
import { createPromptWithAttachments } from '@/lib/utils';
import { DefaultChatTransport } from 'ai';

export function ChatContainer({
    id,
    initialMessages,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
}) {
    const { isSignedIn, getToken } = useAuth();

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createMessage = useMutation(api.messages.create);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const saveFile = useMutation(api.messages.saveFile);
    const updateParts = useMutation(api.messages.updateParts);
    const suggestions = useQuery(api.suggestions.getAll, { chatId: id });

    const hasRun = useRef(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [input, setInput] = useState('');
    const { messages, sendMessage, stop, status } = useChat({
        transport: new DefaultChatTransport({
            api: `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/chat`,
            headers: async () => ({
                Authorization: `Bearer ${await getToken({ template: "convex" })}`,
            }),
        }),
        id,
        messages: initialMessages.length === 1 ? [] : initialMessages,
        onFinish: async (options) => {
            setIsLoading(false);
            setShowSuggestions(true);
        }
    });

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        if (initialMessages.length === 1) {
            setIsLoading(true);
            const content = initialMessages[0].parts.filter(part => part.type === 'text').map(part => part.text).join('');
            sendMessage({ text: content });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!isSignedIn) {
            redirect('/sign-in');
        }
        setIsUploading(true);
        e.preventDefault();
        if (input.trim()) {

            const messageId = await createMessage({
                chatId: id,
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

            sendMessage({ text: prompt });

            await updateParts({
                messageId: messageId,
                parts: [{ type: "text", text: prompt }],
            });

            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setIsUploading(false);
            setInput('');
            setShowSuggestions(false);
            setIsLoading(true);
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        setIsLoading(true);
        sendMessage({ text: suggestion });
        await createMessage({
            chatId: id,
            role: "user",
            parts: [{ type: "text", text: suggestion }],
        });
        setInput('');
        setShowSuggestions(false);
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            setShowSuggestions(true);
        }
    }, [suggestions]);

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key="chat-state"
                    className="flex flex-col h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: "easeOut" }
                    }}
                >
                    <ChatMessages
                        id={id}
                        messages={messages}
                        isLoading={isLoading}
                        displayThinking={status === 'submitted'}
                        handleSuggestionClick={handleSuggestionClick}
                        suggestions={suggestions || []}
                        showSuggestions={showSuggestions}
                    />
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            transition: { duration: 0.4, delay: 0.2, ease: "easeOut" }
                        }}
                    >
                        <MessageInput
                            input={input}
                            setInput={setInput}
                            handleSubmit={handleSubmit}
                            stop={stop}
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            setShowSuggestions={setShowSuggestions}
                            isUploading={isUploading}
                            files={files}
                            setFiles={setFiles}
                            fileInputRef={fileInputRef}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}