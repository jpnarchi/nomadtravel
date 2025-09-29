import { LaptopMinimal } from "lucide-react";
import { Card } from "../../ui/card";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Loader } from "@/components/ai-elements/loader";

export function PreviewButton({
    id,
    version
}: {
    id: Id<"chats">,
    version: number
}) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    return (
        <Card
            className="w-full flex flex-row justify-between items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={() => {
                setIsLoading(true);
                router.push(`/chat/${id}/preview/${version}`);
            }}
        >
            <div className="flex flex-col">
                <p className="font-medium mb-1">Vista previa</p>
                <p className="text-sm text-zinc-500">Versión {version}</p>
            </div>

            {isLoading ? (<Loader className="size-6" />) : (<LaptopMinimal className="size-6" />)}
        </Card>
    )
}