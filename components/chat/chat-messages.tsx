// import { motion } from "framer-motion";
// import { ClipIcon, GoogleIcon, UserIcon } from "@/components/global/icons";
// import { Markdown } from "@/components/global/markdown";
// import Image from "next/image";
// import { Loader } from "@/components/ai-elements/loader";
// import { UIMessage } from "ai";
// import { SuggestionButtons } from "./suggestion-buttons";
// import { PreviewButton } from "./tools/preview-button";
// import { Id } from "@/convex/_generated/dataModel";
// import { Attachments } from "./attachments";
// import { parseAttachmentsFromText } from "@/lib/utils";
// import { Skeleton } from "../ui/skeleton";
// import { ToolMessage } from "./tools/tool-message";
// import { File, Folders } from "lucide-react";
// import { useEffect, useRef } from "react";
// import { ScrollArea } from "../ui/scroll-area";

// export function ChatMessages({
//     id,
//     messages,
//     isLoading,
//     displayThinking,
//     handleSuggestionClick,
//     suggestions,
//     showSuggestions,
// }: {
//     id: Id<"chats">,
//     messages: UIMessage[],
//     isLoading: boolean,
//     displayThinking: boolean,
//     handleSuggestionClick: (suggestion: string) => void,
//     suggestions: string[],
//     showSuggestions: boolean,
// }) {
//     const scrollRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages])

//     const scrollToBottom = () => {
//         if (scrollRef.current) {
//             scrollRef.current.scrollIntoView({ behavior: "auto" });
//         }
//     };

//     return (
//         <ScrollArea
//             className="max-h-[calc(100%-130px)] h-full w-full flex-1"
//         >
//             <div className="flex flex-col gap-4 items-center p-4">
//                 {messages.map(({ role, parts, id: messageId, ...message }: UIMessage, messageIndex: number) => (
//                     <motion.div
//                         key={messageId}
//                         className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2`}
//                         initial={{ y: 5, opacity: 0 }}
//                         animate={{ y: 0, opacity: 1 }}
//                     >
//                         <div className="flex flex-col gap-2 w-full">
//                             {parts.map((part, index) => {
//                                 console.log(part)
//                                 if (part.type === "text") {
//                                     const { files, displayText } = parseAttachmentsFromText(part.text);

//                                     return (
//                                         <div key={index} className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 mb-2">
//                                             <div className="flex flex-row gap-3 items-start">
//                                                 {role === 'assistant' && (
//                                                     <div className="shrink-0 mt-2">
//                                                         <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
//                                                     </div>
//                                                 )}
//                                                 {role === 'user' && (
//                                                     <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
//                                                         <UserIcon />
//                                                     </div>
//                                                 )}
//                                                 <div className="flex-1 min-w-0">
//                                                     {displayText && <Markdown>{displayText}</Markdown>}
//                                                 </div>
//                                             </div>

//                                             {files.length > 0 && (
//                                                 <Attachments files={files} />
//                                             )}
//                                         </div>
//                                     )
//                                 }

//                                 if (part.type === "tool-manageFile") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const message = response.message as string;
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<File className="size-4" />}
//                                                     message={message || "Actualizado"}
//                                                     isLoading={false}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<File className="size-4" />}
//                                                     message={"Cargando..."}
//                                                     isLoading={true}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                 }

//                                 if (part.type === "tool-generateInitialCodebase") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const message = response.message as string;
//                                         const filesCreated = response.filesCreated as number;
//                                         const files = response.files as string[];
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<Folders className="size-4" />}
//                                                     message={message}
//                                                     isLoading={false}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<Folders className="size-4" />}
//                                                     message={"Obteniendo plantilla..."}
//                                                     isLoading={true}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                 }

//                                 if (part.type === "tool-showPreview") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const version = response.version as number;
//                                         return (
//                                             <div key={index} className="flex flex-row gap-3 pt-2 pb-4 pl-8">
//                                                 <PreviewButton
//                                                     id={id}
//                                                     version={version || 1}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index} className="flex flex-row gap-4 items-center pt-2">
//                                                 {role === 'assistant' && (
//                                                     <Image src="/lentes.svg" alt="logo" width={24} height={24} />
//                                                 )}
//                                                 <div className="flex flex-row gap-2 items-center">
//                                                     <Loader />
//                                                     <div className="text-zinc-500 italic">
//                                                         Cargando vista previa...
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )
//                                     }
//                                 }

//                                 if (part.type === "tool-webSearch") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const message = response.message as string;
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage 
//                                                     icon={<GoogleIcon />}
//                                                     message={"Buscado en internet"}
//                                                     isLoading={false}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<GoogleIcon />}
//                                                     message={"Buscado en internet..."}
//                                                     isLoading={true}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                 }

//                                 if (part.type === "tool-readFile") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const message = response.message as string;
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<ClipIcon />}
//                                                     message={"Archivo leído"}
//                                                     isLoading={false}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index}>
//                                                 <ToolMessage
//                                                     icon={<ClipIcon />}
//                                                     message={"Leyendo archivo..."}
//                                                     isLoading={true}
//                                                 />
//                                             </div>
//                                         )
//                                     }
//                                 }

//                                 if (part.type === "tool-generateImageTool") {
//                                     if (part.output && part.state && part.state === 'output-available') {
//                                         const response = part.output as any;
//                                         const message = response.message as string;
//                                         const imageUrls = response.imageUrls as string[];
//                                         return (
//                                             <div key={index} className="flex flex-row gap-4 items-start py-2">
//                                                 {role === 'assistant' && (
//                                                     <Image src="/lentes.svg" alt="logo" width={24} height={24} />
//                                                 )}
//                                                 {imageUrls.map((imageUrl: string, index: number) => (
//                                                     <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer">
//                                                         <Image
//                                                             src={imageUrl}
//                                                             alt="imagen generada"
//                                                             width={250}
//                                                             height={125}
//                                                             className="rounded-xl"
//                                                         />
//                                                     </a>
//                                                 ))}
//                                             </div>
//                                         )
//                                     }
//                                     if (isLoading) {
//                                         return (
//                                             <div key={index} className="flex flex-row gap-4 items-start py-2">
//                                                 {role === 'assistant' && (
//                                                     <Image src="/lentes.svg" alt="logo" width={24} height={24} />
//                                                 )}
//                                                 <div className="flex flex-col space-y-3">
//                                                     <Skeleton className="h-[250px] w-[250px] rounded-xl" />
//                                                 </div>
//                                             </div>
//                                         )
//                                     }
//                                 }
//                             })}
//                         </div>
//                     </motion.div>
//                 ))}

//                 {displayThinking && (
//                     <motion.div
//                         initial={{ y: 5, opacity: 0 }}
//                         animate={{ y: 0, opacity: 1 }}
//                         transition={{ delay: 1 }}
//                         className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2`}
//                     >
//                         <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
//                             <div className="shrink-0 mt-2">
//                                 <Image src="/lentes.svg" alt="logo" width={24} height={24} priority />
//                             </div>
//                             <div className="flex-1 min-w-0 flex flex-row gap-2 items-center">
//                                 <Loader className="size-4" />
//                                 <div className="text-zinc-500 italic">
//                                     Pensando...
//                                 </div>
//                             </div>
//                         </div>
//                     </motion.div>
//                 )}

//                 {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && showSuggestions && (
//                     <motion.div
//                         initial={{ y: 5, opacity: 0 }}
//                         animate={{ y: 0, opacity: 1 }}
//                         className={`-mt-4 flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-0`}
//                     >
//                         <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
//                             <SuggestionButtons suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
//                         </div>
//                     </motion.div>
//                 )}
//             </div>

//             <div ref={scrollRef} />
//         </ScrollArea>
//     );
// }




import { motion } from "framer-motion";
import { ClipIcon, ErrorIcon, GoogleIcon, UserIcon } from "@/components/global/icons";
import { Markdown } from "@/components/global/markdown";
import Image from "next/image";
import { Loader } from "@/components/ai-elements/loader";
import { UIMessage } from "ai";
import { SuggestionButtons } from "./suggestion-buttons";
import { PreviewButton } from "./tools/preview-button";
import { Id } from "@/convex/_generated/dataModel";
import { Attachments } from "./attachments";
import { parseAttachmentsFromText } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { ToolMessage } from "./tools/tool-message";
import { File, Folders } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "../ui/scroll-area";

export function ChatMessages({
    id,
    messages,
    isLoading,
    displayThinking,
    handleSuggestionClick,
    suggestions,
    showSuggestions,
    currentVersion,
}: {
    id: Id<"chats">,
    messages: UIMessage[],
    isLoading: boolean,
    displayThinking: boolean,
    handleSuggestionClick: (suggestion: string) => void,
    suggestions: string[],
    showSuggestions: boolean,
    currentVersion: number | null | undefined,
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            scrollToBottom();
        });
    }, [messages])

    // Also scroll when suggestions change (which happens when files are uploaded)
    useEffect(() => {
        if (showSuggestions) {
            requestAnimationFrame(() => {
                scrollToBottom();
            });
        }
    }, [showSuggestions])

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <ScrollArea
            className="h-full w-full"
        >
            <div className="flex flex-col gap-4 items-center p-4">
                {messages.map(({ role, parts, id: messageId, ...message }: UIMessage, messageIndex: number) => (
                    <motion.div
                        key={messageId}
                        className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2 overflow-hidden`}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <div className="flex flex-col gap-2 w-full">
                            {parts.map((part, index) => {
                                // console.log(part)
                                if (part.type === "text") {
                                    const { files, displayText } = parseAttachmentsFromText(part.text);

                                    return (
                                        <div key={index} className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 mb-2">
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
                                                <div className="flex-1 min-w-0 break-words overflow-wrap-anywhere">
                                                    {displayText && <Markdown>{displayText}</Markdown>}
                                                </div>
                                            </div>

                                            {files.length > 0 && (
                                                <Attachments files={files} />
                                            )}
                                        </div>
                                    )
                                }

                                if (part.type === "tool-manageFile") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const message = response.message as string;
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<File className="size-4" />}
                                                    message={message || "Actualizado"}
                                                    isLoading={false}
                                                />
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<File className="size-4" />}
                                                    message={"Cargando..."}
                                                    isLoading={true}
                                                />
                                            </div>
                                        )
                                    }
                                }

                                if (part.type === "tool-generateInitialCodebase") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const message = response.message as string;
                                        const filesCreated = response.filesCreated as number;
                                        const files = response.files as string[];
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<Folders className="size-4" />}
                                                    message={message}
                                                    isLoading={false}
                                                />
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<Folders className="size-4" />}
                                                    message={"Obteniendo plantilla..."}
                                                    isLoading={true}
                                                />
                                            </div>
                                        )
                                    }
                                }

                                if (part.type === "tool-showPreview") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const version = response.version as number;
                                        const creationTime = response.creationTime as string;
                                        return (
                                            <div key={index} className="flex flex-row gap-3 pt-2 pb-4 pl-8">
                                                <PreviewButton
                                                    id={id}
                                                    version={version || 1}
                                                    creationTime={creationTime}
                                                    currentVersion={currentVersion}
                                                />
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index} className="flex flex-row gap-4 items-center pt-2">
                                                {role === 'assistant' && (
                                                    <Image src="/lentes.svg" alt="logo" width={24} height={24} />
                                                )}
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Loader />
                                                    <div className="text-zinc-500 italic">
                                                        Cargando vista previa...
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                }

                                if (part.type === "tool-webSearch") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const message = response.message as string;
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<GoogleIcon />}
                                                    message={"Buscado en internet"}
                                                    isLoading={false}
                                                />
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<GoogleIcon />}
                                                    message={"Buscado en internet..."}
                                                    isLoading={true}
                                                />
                                            </div>
                                        )
                                    }
                                }

                                if (part.type === "tool-readAttachment") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const message = response.message as string;
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<ClipIcon />}
                                                    message={"Archivo leído"}
                                                    isLoading={false}
                                                />
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index}>
                                                <ToolMessage
                                                    icon={<ClipIcon />}
                                                    message={"Leyendo archivo..."}
                                                    isLoading={true}
                                                />
                                            </div>
                                        )
                                    }
                                }

                                if (part.type === "tool-generateImageTool") {
                                    if (part.output && part.state && part.state === 'output-available') {
                                        const response = part.output as any;
                                        const message = response.message as string;
                                        const imageUrl = response.imageUrl as string;
                                        return (
                                            <div key={index} className="flex flex-row gap-4 items-start py-2">
                                                {role === 'assistant' && (
                                                    <Image src="/lentes.svg" alt="logo" width={24} height={24} />
                                                )}
                                                {imageUrl && (
                                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                                        <Image
                                                            src={imageUrl}
                                                            alt="imagen generada"
                                                            width={250}
                                                            height={125}
                                                            className="rounded-xl"
                                                        />
                                                    </a>
                                                )}
                                                {!imageUrl && (
                                                    <div className="flex items-center justify-center h-[125px] w-[250px] rounded-xl border border-destructive/50 text-destructive bg-destructive/5">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <ErrorIcon />
                                                            <span>Error al generar la imagen</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }
                                    if (isLoading) {
                                        return (
                                            <div key={index} className="flex flex-row gap-4 items-start py-2">
                                                {role === 'assistant' && (
                                                    <Image src="/lentes.svg" alt="logo" width={24} height={24} />
                                                )}
                                                <div className="flex flex-col space-y-3">
                                                    <Skeleton className="h-[250px] w-[250px] rounded-xl" />
                                                </div>
                                            </div>
                                        )
                                    }
                                }
                            })}
                        </div>
                    </motion.div>
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

                {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && showSuggestions && (
                    <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`-mt-4 flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-0`}
                    >
                        <div className="flex flex-row gap-3 items-start w-full md:w-[500px] md:px-0">
                            <SuggestionButtons suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                        </div>
                    </motion.div>
                )}
            </div>

            <div ref={scrollRef} />
        </ScrollArea>
    );
}