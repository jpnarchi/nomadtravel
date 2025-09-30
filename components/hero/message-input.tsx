import { ArrowUpIcon, ClipIcon, LoaderIcon, CancelIcon } from "../global/icons";
import { MicrophoneButton } from "../global/microphone-button";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const MAX_FILES = 3;

export function MessageInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
    files,
    setFiles,
    fileInputRef,
}: {
    input: string,
    setInput: (input: string) => void,
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    isLoading: boolean,
    files: File[],
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
}) {
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
        <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-center p-4 pb-4">
                <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative items-end w-full max-w-lg">
                    <div className="relative flex-1 min-h-[44px] p-2 rounded-xl border-2 border-input bg-[#171717] dark:bg-[#171717] focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-colors flex flex-col">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,application/pdf,.doc,.docx,.txt"
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
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="cursor-pointer absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                            placeholder="Envía un mensaje..."
                            className="w-full bg-transparent dark:bg-transparent border-0 resize-none focus-visible:outline-none focus-visible:ring-0 p-2 min-h-[28px] max-h-[120px] placeholder:text-muted-foreground rounded-md flex-1 overflow-y-auto"
                            rows={1}
                        />
                        <div className="flex gap-2 justify-end items-center mt-2 flex-shrink-0">

                            <MicrophoneButton />

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={handleFileClick}
                                disabled={files.length >= MAX_FILES}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ClipIcon />
                            </Button>

                            {isLoading ? (
                                <Button
                                    type="button"
                                    size="icon"
                                    className="h-8 w-8 rounded-full cursor-pointer"
                                    disabled={true}
                                >
                                    <LoaderIcon />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-8 w-8 rounded-full cursor-pointer"
                                    disabled={!input.trim() || isLoading}
                                >
                                    <ArrowUpIcon />
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}