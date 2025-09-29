import { Loader } from "@/components/ai-elements/loader";
import { CircleCheckBig } from "lucide-react";

export function FileTool({
    message,
    isLoading,
}: {
    message: string,
    isLoading: boolean,
}) {
    return (
        <div className="flex gap-4 items-center bg-background border rounded-md px-4 py-3 mb-1 ml-8 justify-between text-sm">
            {message}
            {isLoading && (<Loader />)}
            {!isLoading && (<CircleCheckBig className="size-4" />)}
        </div>
    )
}