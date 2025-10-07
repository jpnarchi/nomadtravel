import { motion } from "framer-motion";
import Image from "next/image";
import { Loader } from "@/components/ai-elements/loader";
import { UIMessage } from "ai";
import { SuggestionButtons } from "./suggestion-buttons";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { ConnectOrg } from "../database/supabase/connect-org";
import { ProjectsDb } from "../database/supabase/projects-db";
import { ConnectStripe } from "../payments/connect-stripe";

export function ChatMessages({
    id,
    messages,
    isLoading,
    displayThinking,
    handleSuggestionClick,
    suggestions,
    showSuggestions,
    currentVersion,
    isGenerating = false,
    onSupabaseProjectSelect,
}: {
    id: Id<"chats">,
    messages: UIMessage[],
    isLoading: boolean,
    displayThinking: boolean,
    handleSuggestionClick: (suggestion: string) => void,
    suggestions: string[],
    showSuggestions: boolean,
    currentVersion: number | null | undefined,
    isGenerating?: boolean,
    onSupabaseProjectSelect: (projectId: string, projectName: string) => void,
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            scrollToBottom();
        });
    }, [messages])

    useEffect(() => {
        if (showSuggestions) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollToBottom();
                }, 500);
            });
        }
    }, [showSuggestions])

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "auto", block: "end" });
        }
    };

    const lastUserMessageIndex = messages.reduce((lastIndex, message, index) => {
        return message.role === 'user' ? index : lastIndex;
    }, -1);

    const historyMessages = lastUserMessageIndex >= 0
        ? messages.slice(0, lastUserMessageIndex)
        : messages;

    const currentMessages = lastUserMessageIndex >= 0
        ? messages.slice(lastUserMessageIndex)
        : [];

    return (
        <ScrollArea className="h-full w-full">

            {/* History messages */}
            <div className="flex flex-col gap-4 items-center py-2">
                {historyMessages.map(({ role, parts, id: messageId, ...message }: UIMessage, messageIndex: number) => (
                    <ChatMessage
                        key={messageId}
                        role={role}
                        parts={parts}
                        id={id}
                        messageId={messageId}
                        isLoading={isLoading}
                        currentVersion={currentVersion}
                        onSupabaseProjectSelect={onSupabaseProjectSelect}
                        disableConnectOrg={true}
                    />
                ))}
            </div>

            {/* Current messages */}
            <div className="min-h-[calc(100dvh-13rem)] max-w-lg mx-auto flex flex-col gap-4 px-1.5">
                {currentMessages.map(({ role, parts, id: messageId, ...message }: UIMessage, messageIndex: number) => (
                    <ChatMessage
                        key={messageId}
                        role={role}
                        parts={parts}
                        id={id}
                        messageId={messageId}
                        isLoading={isLoading}
                        currentVersion={currentVersion}
                        isNewMessage={true}
                        onSupabaseProjectSelect={onSupabaseProjectSelect}
                        disableConnectOrg={false}
                    />
                ))}

                {displayThinking && (
                    <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2`}
                    >
                        <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
                            <div className="shrink-0 mt-2">
                                <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-row gap-2 items-center">
                                <Loader className="size-4" />
                                <div className="text-zinc-500 italic">
                                    Pensando...
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {!isGenerating && !isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && showSuggestions && (
                    <motion.div
                        className={`-mt-4 flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-0`}
                    >
                        <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
                            <SuggestionButtons suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                        </div>
                    </motion.div>
                )}

                {isGenerating && (
                    <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className={`flex flex-row gap-4 px-4 pb-1 w-full md:w-[500px] md:px-0 first-of-type:pt-0`}
                    >
                        <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
                            <div className="shrink-0 mt-2">
                                <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-row gap-2 items-center">
                                <Loader className="size-4" />
                                <div className="text-zinc-500 italic">
                                    Generando...
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* <div className="flex flex-row gap-3 pt-2 pb-4 pl-8">
                    <ConnectStripe />
                </div> */}
            </div>

            <div ref={scrollRef} />
        </ScrollArea>
    );
}