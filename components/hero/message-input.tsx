import { ArrowUpIcon, ClipIcon, LoaderIcon, CancelIcon } from "../global/icons";
import { MicrophoneButton } from "../global/microphone-button";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTypingPlaceholder } from "@/hooks/use-typing-placeholder";
import { DragDropOverlay } from "../global/drag-drop-overlay";
import { Layers, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_FILES = 5;

export function MessageInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    files,
    setFiles,
    fileInputRef,
    templateSource,
    setTemplateSource,
    canAccessMyTemplates = false,
}: {
    input: string,
    setInput: (input: string) => void,
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    isLoading: boolean,
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    templateSource?: 'default' | 'my-templates',
    setTemplateSource?: (source: 'default' | 'my-templates') => void,
    canAccessMyTemplates?: boolean,
}) {
    const placeholder = useTypingPlaceholder();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (input.trim()) {
                // Create a synthetic form event to match the expected type
                const formEvent = {
                    ...event,
                    currentTarget: event.currentTarget.closest('form') as HTMLFormElement,
                    target: event.currentTarget.closest('form') as HTMLFormElement,
                    preventDefault: () => event.preventDefault(),
                    stopPropagation: () => event.stopPropagation(),
                } as React.FormEvent<HTMLFormElement>;
                handleSubmit(formEvent);
            }
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const remainingSlots = MAX_FILES - files.length;
        if (remainingSlots <= 0) {
            toast.error(`Máximo ${MAX_FILES} archivos.`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (selectedFiles.length > remainingSlots) {
            toast.error(`Solo puedes adjuntar ${MAX_FILES} archivos.`);
        }

        const filesToAdd = selectedFiles.slice(0, remainingSlots);
        setFiles(prev => [...prev, ...filesToAdd]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const isImage = (file: File) => {
        return file.type.startsWith('image/');
    };

    return (
        <div className="flex-shrink-0 ">
            <div className="flex justify-center p-4 pb-4 bg-transparent">
                <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative items-end w-full max-w-3xl">
                    <div className="relative flex-1 min-h-[44px] p-2 rounded-xl border-2 border-input bg-white dark:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-colors flex flex-col">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.heic,.heif"
                            multiple
                            className="hidden"
                        />

                        {/* File previews */}
                        {files.length > 0 && (
                            <div className="flex gap-2 mb-2 p-2">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <div className="w-14 h-14 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                                            {isImage(file) ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-xs text-center px-1 truncate w-full">
                                                    {file.name.split('.').pop()?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            disabled={isLoading}
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="cursor-pointer absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                        >
                                            <CancelIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full bg-transparent dark:bg-transparent border-0 resize-none focus-visible:outline-none focus-visible:ring-0 p-2 min-h-[80px] max-h-[240px] placeholder:text-muted-foreground rounded-lg flex-1 overflow-y-auto !text-lg md:!text-xl"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="flex gap-2 justify-between items-center mt-2 flex-shrink-0">
                            {/* Left side - Files button and Templates selector */}
                            <div className="flex gap-2">
                                {files.length >= MAX_FILES ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-12 px-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2"
                                                    onClick={handleFileClick}
                                                    disabled
                                                >
                                                    <ClipIcon/>
                                                    <span>Files</span>
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            Máximo {MAX_FILES} archivos
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-12 px-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2"
                                        onClick={handleFileClick}
                                        disabled={isLoading}
                                    >
                                        <ClipIcon />
                                        <span>Files</span>
                                    </Button>
                                )}

                                {/* Templates selector dropdown - only show if props provided and user can access my templates */}
                                {templateSource && setTemplateSource && canAccessMyTemplates && (
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-12 px-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-2"
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            disabled={isLoading}
                                        >
                                            <Layers className="h-4 w-4" />
                                            <span>{templateSource === 'default' ? 'Default Templates' : 'My Templates'}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {dropdownOpen && (
                                                <>
                                                    {/* Backdrop to close dropdown */}
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setDropdownOpen(false)}
                                                    />

                                                    {/* Menu */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute bottom-14 left-0 w-56 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden"
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTemplateSource('default')
                                                                    setDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-3 ${
                                                                    templateSource === 'default' ? 'text-primary' : 'text-zinc-700'
                                                                }`}
                                                            >
                                                                <Layers className="h-4 w-4" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">Default Templates</span>
                                                                    <span className="text-xs text-zinc-500">Use premade templates</span>
                                                                </div>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTemplateSource('my-templates')
                                                                    setDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-3 ${
                                                                    templateSource === 'my-templates' ? 'text-primary' : 'text-zinc-700'
                                                                }`}
                                                            >
                                                                <Layers className="h-4 w-4" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">My Templates</span>
                                                                    <span className="text-xs text-zinc-500">Use your own templates</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Right side - Submit/Loader button */}
                            <div>
                                {/* <MicrophoneButton isDisabled={isLoading} /> */}

                                {isLoading ? (
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="h-12 w-12 rounded-full cursor-pointer"
                                        disabled={true}
                                    >
                                        <LoaderIcon />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="h-12 w-12 rounded-full cursor-pointer"
                                        disabled={(!input.trim() && files.length === 0) || isLoading}
                                    >
                                        <ArrowUpIcon />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <DragDropOverlay files={files} setFiles={setFiles} />
        </div>
    )
}