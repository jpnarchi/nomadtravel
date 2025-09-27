'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { Id } from '@/convex/_generated/dataModel';

export function ChatContainer({
    id,
    initialMessages,
    setShowWorkbench,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
    setShowWorkbench: (show: boolean) => void,
}) {
    const { isSignedIn } = useAuth();

    const createMessage = useMutation(api.messages.create);

    const [input, setInput] = useState('');
    const { messages, sendMessage, stop, status } = useChat({
        messages: initialMessages,
        onFinish: async (options) => {
            window.history.replaceState({}, "", `/chat/${id}`);
            await generateSuggestions(options.message);
        }
    });
    const [suggestions, setSuggestions] = useState([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        if (!isSignedIn) {
            redirect('/sign-in');
        }
        e.preventDefault();
        if (input.trim()) {
            sendMessage({ text: input });
            await createMessage({
                chatId: id,
                role: "user",
                content: input,
            });
            setInput('');
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = async (suggestion: string) => {
        sendMessage({ text: suggestion });
        await createMessage({
            chatId: id,
            role: "user",
            content: suggestion,
        });
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
            </AnimatePresence>
        </div>
    );
}