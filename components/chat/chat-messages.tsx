import { motion } from "framer-motion";
import { UserIcon } from "@/components/global/icons";
import { Markdown } from "@/components/global/markdown";
import Image from "next/image";
import { Loader } from "@/components/ai-elements/loader";
import { UIMessage } from "ai";
import { useScrollToBottom } from "../global/use-scroll-to-bottom";
import { SuggestionButtons } from "./suggestion-buttons";
import { PreviewButton } from "./preview-button";
import { ProjectSummary } from "./tools/project-summary";
import { ProjectSummaryResponse } from "@/lib/interfaces";
import { Id } from "@/convex/_generated/dataModel";

export function ChatMessages({
    id,
    messages,
    isLoading,
    handleSuggestionClick,
    suggestions,
}: {
    id: Id<"chats">,
    messages: UIMessage[],
    isLoading: boolean,
    handleSuggestionClick: (suggestion: string) => void,
    suggestions: string[],
}) {
    const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 items-center p-4" ref={messagesContainerRef}>
                {messages.map(({ role, parts, id: messageId }, messageIndex) => (
                    <motion.div
                        key={messageId}
                        className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2`}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="flex flex-col gap-2 w-full">
                            {parts.map((part, index) => {
                                //console.log(part)
                                if (part.type === "text") {
                                    return (
                                        <div key={index} className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
                                            <div className="flex flex-row gap-3 items-start">
                                                {role === 'assistant' && (
                                                    <div className="shrink-0 mt-2">
                                                        <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
                                                    </div>
                                                )}
                                                {role === 'user' && (
                                                    <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
                                                        <UserIcon />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {part.text && <Markdown>{part.text}</Markdown>}
                                                    {isLoading && role === 'assistant' && messageIndex === messages.length - 1 && (
                                                        <div className="flex flex-row gap-2 items-center mt-2">
                                                            <Loader className="size-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!isLoading && role === 'assistant' && messageIndex === messages.length - 1 && <SuggestionButtons suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />}
                                        </div>
                                    )
                                }

                                if (part.type === "tool-displayProjectSummary") {
                                    if (!part.output) return null;
                                    const response = part.output as ProjectSummaryResponse;
                                    return (
                                        <div key={index}>
                                            <ProjectSummary data={response.data} />
                                        </div>
                                    )
                                }

                                if (part.type === "tool-generateCode") {
                                    const version = 1;
                                    return (
                                        <div key={index} className="flex flex-row gap-3 pt-2 pb-4">
                                            {role === 'assistant' && (
                                                <div className="shrink-0 mt-2">
                                                    <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
                                                </div>
                                            )}
                                            <PreviewButton 
                                                id={id}
                                                version={version}
                                            />
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
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
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div
                    ref={messagesEndRef}
                    className="shrink-0 min-w-[24px] min-h-[25vh]"
                />
            </div>
        </div>
    );
}
