import { Loader2 } from "lucide-react";
import { ArrowUpIcon, ClipIcon, LoaderIcon } from "../global/icons";
import { MicrophoneButton } from "../global/microphone-button";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function MessageInput({
    input,
    setInput,
    handleSubmit,
    isLoading,
}: {
    input: string,
    setInput: (input: string) => void,
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    isLoading: boolean,
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

    return (
        <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-center p-4 pb-4">
                <form onSubmit={handleSubmit} className="flex flex-row gap-2 relative items-end w-full max-w-lg">
                    <div className="relative flex-1 min-h-[44px] p-2 rounded-xl border-2 border-input bg-[#171717] dark:bg-[#171717] focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-colors flex flex-col">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Send a message..."
                            className="w-full bg-transparent dark:bg-transparent border-0 resize-none focus-visible:outline-none focus-visible:ring-0 p-2 min-h-[28px] max-h-[120px] placeholder:text-muted-foreground rounded-md flex-1 overflow-y-auto"
                            rows={1}
                        />
                        <div className="flex gap-2 justify-end items-center mt-2 flex-shrink-0">

                            <MicrophoneButton />

                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
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