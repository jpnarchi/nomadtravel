'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessages } from '@/components/chat-messages';
import { MessageInput } from '@/components/message-input';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export function ChatContainer({ 
    id,
    initialMessages,
    setShowWorkbench,
}: {
    id: string,
    initialMessages: UIMessage[],
    setShowWorkbench: (show: boolean) => void,
}) {
    const { isSignedIn } = useAuth();
    const [input, setInput] = useState('');
    const { messages, sendMessage, stop, status } = useChat({
        id,
        onFinish: async (options) => {
            window.history.replaceState({}, "", `/chat/${id}`);
            await generateSuggestions(options.message);
        }
    });
    const [suggestions, setSuggestions] = useState([]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (!isSignedIn) {
            redirect('/sign-in');
        }
        e.preventDefault();
        if (input.trim()) {
            sendMessage({ text: input });
            setInput('');
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage({ text: suggestion });
        setInput('');
        setSuggestions([]);
    };

    const generateSuggestions = async (message: UIMessage) => {
        try {
            const response = await fetch('/api/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message }),
            });

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background">
            <AnimatePresence mode="wait">
                {messages.length === 0 ? (
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
                                stop={stop}
                                isLoading={status === 'submitted'}
                            />
                        </motion.div>
                    </motion.div>
                ) : (
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
                            messages={messages}
                            isLoading={status === 'submitted'}
                            setShowWorkbench={setShowWorkbench}
                            handleSuggestionClick={handleSuggestionClick}
                            suggestions={suggestions}
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
                                isLoading={status === 'submitted'}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
