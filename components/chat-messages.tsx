import { motion } from "framer-motion";
import { UserIcon } from "@/components/icons";
import { Markdown } from "@/components/markdown";
import Image from "next/image";
import { Loader } from "@/components/ai-elements/loader";
import { UIMessage } from "ai";
import { PreviewButton } from "./preview-button";
import { SuggestionButtons } from "./suggestion-buttons";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function ChatMessages({
    messages,
    isLoading,
    setShowWorkbench,
    handleSuggestionClick,
    suggestions
}: {
    messages: UIMessage[],
    isLoading: boolean,
    setShowWorkbench: (show: boolean) => void,
    handleSuggestionClick: (suggestion: string) => void,
    suggestions: string[]
}) {
    const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 items-center p-4" ref={messagesContainerRef}>
                {messages.map(({ role, parts, id }, messageIndex) => (
                    <motion.div
                        key={id}
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
                                                        <Image src="/lentes.svg" alt="logo" width={24} height={24} priority/>
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

                                            {/* {!isLoading && role === 'assistant' && <PreviewButton setShowWorkbench={setShowWorkbench} />} */}
                                            {!isLoading && role === 'assistant' && messageIndex === messages.length - 1 && <SuggestionButtons suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />}
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </motion.div>
                ))}

                <div
                    ref={messagesEndRef}
                    className="shrink-0 min-w-[24px] min-h-[25vh]"
                />
            </div>
        </div>
    );
}
