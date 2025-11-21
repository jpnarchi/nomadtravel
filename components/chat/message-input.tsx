import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, CancelIcon, ClipIcon, LoaderIcon, StopIcon } from "../global/icons";
import { MicrophoneButton } from "../global/microphone-button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Layers, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const MAX_FILES = 5;

export const MessageInput = ({
    input,
    setInput,
    handleSubmit,
    stop,
    isLoading,
    setIsLoading,
    setShowSuggestions,
    isUploading,
    files,
    setFiles,
    fileInputRef,
    disabled = false,
    templateSource,
    setTemplateSource,
}: {
    input: string;
    setInput: (input: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    stop: () => void;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
    isUploading: boolean;
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    disabled: boolean,
    templateSource?: 'default' | 'my-templates',
    setTemplateSource?: (source: 'default' | 'my-templates') => void,
}) => {
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
        <div className="flex-shrink-0 bg-transparent">
            <div className="flex justify-center p-4 pb-4 bg-transparent">
                <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative items-end w-full max-w-lg">
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
                                            disabled={isLoading || isUploading}
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
                            placeholder="Type your message..."
                            className="w-full bg-transparent dark:bg-transparent border-0 resize-none focus-visible:outline-none focus-visible:ring-0 p-2 min-h-[28px] max-h-[120px] placeholder:text-muted-foreground rounded-md flex-1 overflow-y-auto"
                            rows={1}
                            disabled={isLoading || isUploading || disabled}
                        />
                        <div className="flex gap-2 justify-between items-center mt-2 flex-shrink-0">
                            {/* Left side - Templates selector (if props provided) */}
                            <div className="flex gap-2">
                                {templateSource && setTemplateSource && (
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            disabled={isLoading || isUploading || disabled}
                                        >
                                            <Layers className="h-4 w-4" />
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
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute top-10 left-0 w-56 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden"
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTemplateSource('default')
                                                                    setDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-3 ${
                                                                    templateSource === 'default' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700'
                                                                }`}
                                                            >
                                                                <Layers className="h-4 w-4" />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">Default Templates</span>
                                                                    <span className="text-xs text-zinc-500">Use admin templates</span>
                                                                </div>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    console.log('[MessageInput] MY TEMPLATES CLICKED!');
                                                                    console.log('[MessageInput] setTemplateSource exists:', !!setTemplateSource);
                                                                    console.log('[MessageInput] Current templateSource:', templateSource);
                                                                    if (setTemplateSource) {
                                                                        console.log('[MessageInput] Calling setTemplateSource("my-templates")');
                                                                        setTemplateSource('my-templates');
                                                                    }
                                                                    setDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-100 transition-colors flex items-center gap-3 ${
                                                                    templateSource === 'my-templates' ? 'bg-blue-50 text-blue-600' : 'text-zinc-700'
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

                            {/* Right side - Microphone, Files, Submit buttons */}
                            <div className="flex gap-2 items-center">
                                <MicrophoneButton isDisabled={isLoading || isUploading || disabled} />

                                {files.length >= MAX_FILES ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                                                onClick={handleFileClick}
                                                disabled
                                            >
                                                <ClipIcon />
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
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={handleFileClick}
                                    disabled={isLoading || isUploading || disabled}
                                >
                                    <ClipIcon />
                                </Button>
                            )}

                            {isUploading && (
                                <Button
                                    type="button"
                                    size="icon"
                                    className="h-8 w-8 rounded-full cursor-pointer"
                                    disabled={true}
                                >
                                    <LoaderIcon />
                                </Button>
                            )}

                            {isLoading && (
                                <Button
                                    type="button"
                                    size="icon"
                                    className="h-8 w-8 rounded-full cursor-pointer"
                                    disabled={disabled}
                                    onClick={() => {
                                        stop();
                                        setIsLoading(false);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <StopIcon />
                                </Button>
                            )}

                            {!isLoading && !isUploading && (
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-8 w-8 rounded-full cursor-pointer"
                                    disabled={!input.trim() && files.length === 0 || disabled}
                                >
                                    <ArrowUpIcon />
                                </Button>
                            )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
