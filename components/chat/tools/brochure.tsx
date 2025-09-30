import { Loader } from "@/components/ai-elements/loader";
import { Download, FileIcon } from "lucide-react";

export function Brochure({
    message,
    isLoading,
    pdfUrl,
}: {
    message: string,
    isLoading: boolean,
    pdfUrl: string,
}) {
    return (
        <div className="flex gap-4 items-center bg-background border rounded-md px-4 py-3 mb-1 ml-8 justify-between text-sm">
            <div className="flex gap-3 items-center">
                <FileIcon className="size-4" />
                {message}
            </div>
            {isLoading && (<Loader />)}
            {!isLoading && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                </a>
            )}
        </div>
    )
}