import { motion } from "framer-motion";
import { parseAttachmentsFromText } from "@/lib/utils";
import Image from "next/image";
import { UserIcon } from "@/components/global/icons";
import { File, Folders, SquareDashedMousePointer } from "lucide-react";
import { Markdown } from "@/components/global/markdown";
import { Attachments } from "./attachments";
import { ToolMessage } from "./tools/tool-message";

import { Loader } from "@/components/ai-elements/loader";
import { GoogleIcon } from "@/components/global/icons";
import { ClipIcon, ErrorIcon } from "@/components/global/icons";
import { PreviewButton } from "./tools/preview-button";
import { Skeleton } from "../ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";


export function ChatMessage({
    id,
    messageId,
    parts,
    role,
    isLoading,
    currentVersion,
    isNewMessage = false,
}: {
    id: Id<"chats">;
    messageId: string;
    parts: any[];
    role: string;
    isLoading: boolean;
    currentVersion: number | null | undefined;
    isNewMessage?: boolean;
}) {
    return (
        <motion.div
            key={messageId}
            className={`flex flex-row gap-4 px-4 py-1 w-full md:w-[500px] md:px-0 first-of-type:pt-2 overflow-hidden`}
            initial={isNewMessage ? { y: 10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                duration: 0.1,
                ease: "easeOut"
            }}
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
                                        {role === "user" && displayText.includes("Selected Element:") ? (
                                            <div className="flex flex-row gap-2 items-center text-green-600">
                                                <SquareDashedMousePointer className="size-4" />
                                                <p>Elemento seleccionado</p>
                                            </div>
                                        ) : (
                                            <>{displayText && <Markdown>{displayText}</Markdown>}</>
                                        )}
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
    )
}