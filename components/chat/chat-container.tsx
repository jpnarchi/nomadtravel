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
import { PricingPopup } from '../pricing/pricing-popup';
import { DragDropOverlay } from '../global/drag-drop-overlay';
import { LivePresentationViewer } from './live-presentation-viewer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ChatContainer({
    id,
    initialMessages,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
}) {
    // Add safety check for initialMessages
    const safeInitialMessages = initialMessages || [];
    const { isSignedIn, getToken } = useAuth();

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createMessage = useMutation(api.messages.create);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const saveFile = useMutation(api.messages.saveFile);
    const updateParts = useMutation(api.messages.updateParts);
    const updateIsGenerating = useMutation(api.chats.updateIsGenerating);
    const suggestions = useQuery(api.suggestions.getAll, { chatId: id });
    const isGenerating = useQuery(api.chats.getIsGenerating, { chatId: id });
    const currentVersion = useQuery(api.chats.getCurrentVersion, { chatId: id });
    const user = useQuery(api.users.getUserInfo);
    const hasReachedLimit = useQuery(api.users.hasReachedVersionLimit, { chatId: id });
    const versionLimitInfo = useQuery(api.users.getVersionLimitInfo);

    const hasRun = useRef(false);
    const wasShowingGenerando = useRef(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [input, setInput] = useState('');
    const [isGeneratingSync, setIsGeneratingSync] = useState(false);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Initialize templateSource from localStorage if available
    const [templateSource, setTemplateSource] = useState<'default' | 'my-templates'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('templateSource');
            if (saved === 'my-templates' || saved === 'default') {
                return saved;
            }
        }
        return 'default';
    });
    const templateSourceRef = useRef<'default' | 'my-templates'>(templateSource);

    // Initialize slidesCount from localStorage if available (only for first message)
    const [slidesCount, setSlidesCount] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('slidesCount');
            if (saved) {
                // Clear it immediately after reading
                localStorage.removeItem('slidesCount');
                const count = parseInt(saved, 10);
                if (!isNaN(count) && count > 0) {
                    return count;
                }
            }
        }
        return null;
    });
    const slidesCountRef = useRef<number | null>(slidesCount);

    // Check if user has a paid plan (pro, premium, ultra, or admin)
    const isPaidUser = user?.role === "admin" || user?.plan === "ultra" || user?.plan === "premium" || user?.plan === "pro";

    console.log('[ChatContainer] User info:', { role: user?.role, plan: user?.plan, isPaidUser });

    // Keep ref in sync with state
    useEffect(() => {
        templateSourceRef.current = templateSource;
        console.log('[ChatContainer] templateSource STATE changed to:', templateSource);
        console.log('[ChatContainer] templateSourceRef.current is now:', templateSourceRef.current);
    }, [templateSource]);

    // Keep slidesCount ref in sync with state
    useEffect(() => {
        slidesCountRef.current = slidesCount;
        console.log('[ChatContainer] slidesCount STATE changed to:', slidesCount);
        console.log('[ChatContainer] slidesCountRef.current is now:', slidesCountRef.current);
    }, [slidesCount]);

    // Create a stable reference to getToken
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    const { messages, sendMessage, stop: originalStop, status } = useChat({
        transport: new DefaultChatTransport({
            api: `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/chat`,
            headers: async () => {
                const currentTemplateSource = templateSourceRef.current;
                const currentSlidesCount = slidesCountRef.current;
                console.log('[ChatContainer] headers() called, sending X-Template-Source:', currentTemplateSource);
                console.log('[ChatContainer] headers() called, sending X-Slides-Count:', currentSlidesCount);

                const headers: Record<string, string> = {
                    Authorization: `Bearer ${await getTokenRef.current({ template: "convex" })}`,
                    'X-Template-Source': currentTemplateSource,
                };

                // Only send slides count if it's set (for the first message)
                if (currentSlidesCount !== null) {
                    headers['X-Slides-Count'] = currentSlidesCount.toString();
                }

                return headers;
            },
        }),
        id,
        messages: safeInitialMessages.length === 1 ? [] : safeInitialMessages,
        onFinish: async (options) => {
            setIsLoading(false);
            setShowSuggestions(true);
            setIsGeneratingSync(true);
            // Clear slides count after first message is processed
            if (slidesCountRef.current !== null) {
                setSlidesCount(null);
            }
        }
    });

    const stop = async () => {
        await updateIsGenerating({
            chatId: id,
            isGenerating: false,
        });
        originalStop();
    };

    const sendMessageDirectly = async () => {
        try {
            // Check if user has reached version limit (server-side validation)
            if (hasReachedLimit) {
                setShowPricingPopup(true);
                return;
            }

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
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Template-Source': templateSourceRef.current,
            };

            // Only send slides count if it's set (for the first message)
            if (slidesCountRef.current !== null) {
                headers['X-Slides-Count'] = slidesCountRef.current.toString();
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id,
                    messages: safeInitialMessages,
                    templateSource: templateSourceRef.current
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

        // Add null checks for initialMessages
        if (!safeInitialMessages || safeInitialMessages.length === 0) {
            return;
        }

        const lastMessage = safeInitialMessages[safeInitialMessages.length - 1];
        if (!lastMessage || !lastMessage.parts) {
            return;
        }

        const lastUserMessage = lastMessage.parts.filter(part => part.type === 'text').map(part => part.text).join('');

        if (safeInitialMessages.length === 1 || lastUserMessage.includes("Selected Element:")) {
            setIsLoading(true);
            const content = lastMessage.parts.filter(part => part.type === 'text').map(part => part.text).join('');

            if (lastUserMessage.includes("Selected Element:")) {
                // For Selected Element messages, send directly to AI without adding to frontend messages
                sendMessageDirectly();
            } else {
                // For regular messages, use the normal flow
                sendMessage({ text: content });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isSignedIn) {
            redirect('/sign-in');
        }

        // Check if user has reached version limit (server-side validation)
        if (hasReachedLimit) {
            setShowPricingPopup(true);
            return;
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



    const handleSuggestionClick = async (suggestion: string) => {
        // Check if user has reached version limit (server-side validation)
        if (hasReachedLimit) {
            setShowPricingPopup(true);
            return;
        }

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
        if (messages && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
            setShowSuggestions(true);
        }
    }, [suggestions, messages]);

    useEffect(() => {
        if (isGeneratingSync && !isGenerating) {
            setIsGeneratingSync(false);
        }
    }, [isGenerating, isGeneratingSync]);

    useEffect(() => {
        const isCurrentlyShowingGenerando = !isLoading && isGenerating && !isGeneratingSync;

        console.log('[ChatContainer] isGenerating state:', {
            isLoading,
            isGenerating,
            isGeneratingSync,
            isCurrentlyShowingGenerando,
            wasShowingGenerando: wasShowingGenerando.current
        });

        if (isCurrentlyShowingGenerando) {
            wasShowingGenerando.current = true;
        } else if (wasShowingGenerando.current && !isGenerating) {
            console.log('[ChatContainer] Reloading page due to isGenerating change');
            wasShowingGenerando.current = false;
            window.location.reload();
        }
    }, [isLoading, isGenerating, isGeneratingSync]);

    if (!isLoading && isGenerating && !isGeneratingSync) {
        return (
            <div className="flex flex-row h-[calc(100dvh-4rem)] bg-black relative">
                {/* Chat column - 40% left */}
                <motion.div
                    className="flex flex-col h-full bg-primary"
                    initial={false}
                    animate={{
                        width: isCollapsed ? '0%' : '40%',
                        transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="chat-state"
                            className="flex flex-col w-full h-full overflow-hidden bg-white"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isCollapsed ? 0 : 1,
                                y: 0,
                                transition: { duration: 0.4, ease: "easeOut" }
                            }}
                        >
                            <div className="flex-1 min-h-0 overflow-hidden">
                                {messages.length === 0 || (messages.length === 1 && messages[0].role === 'user') ? (
                                    <div className="flex flex-col h-full bg-background items-center justify-center">
                                        <div className="flex items-center gap-3">
                                            <Loader />
                                            <p>Creating...</p>
                                        </div>
                                    </div>
                                ) : (
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
                                    />
                                )}
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
                    <DragDropOverlay files={files} setFiles={setFiles} />
                </motion.div>

                {/* Collapse/Expand button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white hover:bg-gray-100 border-t border-r border-b border-gray-300 rounded-r-lg p-2 shadow-lg transition-all duration-300"
                    style={{
                        left: isCollapsed ? '0' : '40%',
                    }}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    )}
                </button>

                {/* New column - 60% right */}
                <motion.div
                    className="h-full bg-background border-l"
                    initial={false}
                    animate={{
                        width: isCollapsed ? '100%' : '60%',
                        transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    <LivePresentationViewer chatId={id} />
                </motion.div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-row h-[calc(100dvh-4rem)] bg-black relative">
                {/* Chat column - 40% left */}
                <motion.div
                    className="flex flex-col h-full bg-gradient-to-t from-primary from-20% to-[#F4A7B6] to-95%"
                    initial={false}
                    animate={{
                        width: isCollapsed ? '0%' : '40%',
                        transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="chat-state"
                            className="flex flex-col w-full h-full overflow-hidden bg-white"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isCollapsed ? 0 : 1,
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
                    <DragDropOverlay files={files} setFiles={setFiles} />
                </motion.div>

                {/* Collapse/Expand button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute left-0 bottom-10 -translate-y-1/2 z-50 bg-white hover:bg-gray-100 border-t border-r border-b border-gray-300 rounded-r-lg p-2 shadow-lg transition-all duration-300"
                    style={{
                        left: isCollapsed ? '0' : '40%',
                    }}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    )}
                </button>

                {/* New column - 60% right */}
                <motion.div
                    className="h-full bg-background border-l"
                    initial={false}
                    animate={{
                        width: isCollapsed ? '100%' : '60%',
                        transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                >
                    <LivePresentationViewer chatId={id} />
                </motion.div>
            </div>
            <PricingPopup
                isOpen={showPricingPopup}
                onOpenChange={setShowPricingPopup}
            />
        </>
    );
}