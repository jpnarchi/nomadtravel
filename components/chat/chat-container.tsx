'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { Id } from '@/convex/_generated/dataModel';
import { createPromptWithAttachments } from '@/lib/utils';
import { DefaultChatTransport } from 'ai';
import { Loader } from '../ai-elements/loader';
import Image from 'next/image';
import { toast } from 'sonner';

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
    const updateIsGenerating = useMutation(api.chats.updateIsGenerating);
    const updateSupabaseProjectIdForChat = useMutation(api.chats.updateSupabaseProjectIdForChat);
    const getSupabaseAnonKey = useAction(api.supabase.getSupabaseAnonKey);
    const suggestions = useQuery(api.suggestions.getAll, { chatId: id });
    const isGenerating = useQuery(api.chats.getIsGenerating, { chatId: id });
    const currentVersion = useQuery(api.chats.getCurrentVersion, { chatId: id });

    const hasRun = useRef(false);
    const wasShowingGenerando = useRef(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [input, setInput] = useState('');
    const [isGeneratingSync, setIsGeneratingSync] = useState(false);

    const { messages, sendMessage, stop: originalStop, status } = useChat({
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
            setIsGeneratingSync(true);
        }
    });

    const stop = async () => {
        // Update backend isGenerating state to false
        await updateIsGenerating({
            chatId: id,
            isGenerating: false,
        });
        // Call the original stop function
        originalStop();
    };

    const sendMessageDirectly = async () => {
        try {
            const token = await getToken({ template: "convex" });
            if (!token) {
                console.error("No authentication token available");
                return;
            }

            await updateIsGenerating({
                chatId: id,
                isGenerating: true,
            });
            setIsLoading(false);
            setIsGeneratingSync(false);

            // Make direct API call to chat endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id,
                    messages: initialMessages
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

        } catch (error: any) {
            console.error("Error sending message directly:", error);

            toast.error("Error al enviar el mensaje", error.message);

            await updateIsGenerating({
                chatId: id,
                isGenerating: false,
            });
        }
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const lastUserMessage = initialMessages[initialMessages.length - 1].parts.filter(part => part.type === 'text').map(part => part.text).join('');

        if (initialMessages.length === 1 || lastUserMessage.includes("Selected Element:")) {
            setIsLoading(true);
            const content = initialMessages[initialMessages.length - 1].parts.filter(part => part.type === 'text').map(part => part.text).join('');

            if (lastUserMessage.includes("Selected Element:")) {
                // For Selected Element messages, send directly to AI without adding to frontend messages
                sendMessageDirectly();
            } else {
                // For regular messages, use the normal flow
                sendMessage({ text: content });
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isSignedIn) {
            redirect('/sign-in');
        }
        setIsUploading(true);
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
            setIsGeneratingSync(false);
        }
    };

    const handleSupabaseProjectSelect = async (projectId: string, projectName: string) => {
        setIsLoading(true);
        setIsGeneratingSync(false);

        // Set the project for the chat
        await updateSupabaseProjectIdForChat({ supabaseProjectId: projectId, chatId: id });

        // Get the anon key for the project
        const { anonKey } = await getSupabaseAnonKey({ projectId });
        const supabaseUrl = `https://${projectId}.supabase.co`;

        const text = `Supabase conectado! Proyecto: ${projectName}`
        const keys = `
        Anon Key: ${anonKey}
        Supabase URL: ${supabaseUrl}
        `
        sendMessage({ text: text + keys });
        await createMessage({
            chatId: id,
            role: "user",
            parts: [{ type: "text", text: text + keys }],
        });
        setInput('');
        setShowSuggestions(false);
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleStripeConnected = async (publishableKey: string) => {
        setIsLoading(true);
        setIsGeneratingSync(false);

        const text = `Stripe conectado! Las credenciales se han guardado correctamente.`
        const keys = `
        STRIPE_PUBLISHABLE_KEY: ${publishableKey}\n
        STRIPE_SECRET_KEY
        STRIPE_WEBHOOK_SECRET

        Stripe secret key y Stripe webhook secret se guardaron en secrets.
        `
        sendMessage({ text: text + keys });
        await createMessage({
            chatId: id,
            role: "user",
            parts: [{ type: "text", text: text + keys }],
        });
        setInput('');
        setShowSuggestions(false);
        setFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        setIsLoading(true);
        setIsGeneratingSync(false);
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

    useEffect(() => {
        if (isGeneratingSync && !isGenerating) {
            setIsGeneratingSync(false);
        }
    }, [isGenerating, isGeneratingSync]);

    useEffect(() => {
        const isCurrentlyShowingGenerando = !isLoading && isGenerating && !isGeneratingSync;

        if (isCurrentlyShowingGenerando) {
            wasShowingGenerando.current = true;
        } else if (wasShowingGenerando.current && !isGenerating) {
            wasShowingGenerando.current = false;
            window.location.reload();
        }
    }, [isLoading, isGenerating, isGeneratingSync]);

    if (!isLoading && isGenerating && !isGeneratingSync) {
        return (
            <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="chat-state"
                        className="flex flex-col h-full min-h-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.4, ease: "easeOut" }
                        }}
                    >
                        {/* <div className="flex flex-col h-full bg-background items-center justify-center">
                            <div className="flex items-center gap-3">
                                <Loader />
                                <p>Generando...</p>
                            </div>
                        </div> */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <ChatMessages
                                id={id}
                                messages={messages}
                                isLoading={isLoading}
                                displayThinking={status === 'submitted'}
                                handleSuggestionClick={handleSuggestionClick}
                                suggestions={suggestions || []}
                                showSuggestions={showSuggestions}
                                currentVersion={currentVersion}
                                isGenerating={true}
                                onSupabaseProjectSelect={handleSupabaseProjectSelect}
                                onStripeConnected={handleStripeConnected}
                            />
                        </div>
                        <motion.div
                            className="flex-shrink-0"
                        >
                            <MessageInput
                                input={input}
                                setInput={setInput}
                                handleSubmit={handleSubmit}
                                stop={stop}
                                isLoading={true}
                                setIsLoading={setIsLoading}
                                setShowSuggestions={setShowSuggestions}
                                isUploading={isUploading}
                                files={files}
                                setFiles={setFiles}
                                fileInputRef={fileInputRef}
                                disabled={true}
                            />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key="chat-state"
                    className="flex flex-col h-full min-h-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: "easeOut" }
                    }}
                >
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ChatMessages
                            id={id}
                            messages={messages}
                            isLoading={isLoading}
                            displayThinking={status === 'submitted'}
                            handleSuggestionClick={handleSuggestionClick}
                            suggestions={suggestions || []}
                            showSuggestions={showSuggestions}
                            currentVersion={currentVersion}
                            onSupabaseProjectSelect={handleSupabaseProjectSelect}
                            onStripeConnected={handleStripeConnected}
                        />
                    </div>
                    <motion.div
                        // initial={{ y: 100, opacity: 0 }}
                        // animate={{
                        //     y: 0,
                        //     opacity: 1,
                        //     transition: { duration: 0.4, delay: 0.2, ease: "easeOut" }
                        // }}
                        className="flex-shrink-0"
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
                            disabled={false}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}