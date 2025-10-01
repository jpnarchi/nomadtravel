import { Loader } from "@/components/ai-elements/loader";
import { CircleCheckBig } from "lucide-react";
import { ReactNode } from "react";

export function ToolMessage({
    icon,
    message,
    isLoading,
}: {
    icon: ReactNode,
    message: string,
    isLoading: boolean,
}) {
    return (
        <div className="flex gap-4 items-center bg-background border rounded-md px-4 py-3 mb-1 ml-8 justify-between text-sm">
            <div className="flex gap-3 items-center">
                {icon}
                {message}
            </div>
            {isLoading && (<Loader />)}
            {!isLoading && (
                <CircleCheckBig className="size-4 text-green-500" />
            )}
        </div>
    )
}