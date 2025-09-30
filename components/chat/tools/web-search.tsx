import { Loader } from "@/components/ai-elements/loader";
import { GoogleIcon } from "@/components/global/icons";
import { CircleCheckBig } from "lucide-react";

export function WebSearch({
    message,
    isLoading,
}: {
    message: string,
    isLoading: boolean,
}) {
    return (
        <div className="flex gap-4 items-center bg-background border rounded-md px-4 py-3 mb-1 ml-8 justify-between text-sm w-full">
            <div className="flex gap-3 items-center">
                <GoogleIcon />
                {message}
            </div>
            {isLoading && (<Loader />)}
            {!isLoading && (<CircleCheckBig className="size-4" />)}
        </div>
    )
}