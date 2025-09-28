import { LaptopMinimal } from "lucide-react";
import { Card } from "../ui/card";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

export function PreviewButton({ 
    id,
    version
}: { 
    id: Id<"chats">,
    version: number
}) {
    const router = useRouter();
    return (
        <Card 
            className="w-full flex flex-row justify-between items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={() => {
                router.push(`/chat/${id}/preview/${version}`);
            }}
        >
            <div className="flex flex-col">
                <p className="font-medium mb-1">Preview</p>
                <p className="text-sm text-zinc-500">Version {version}</p>
            </div>

            <LaptopMinimal className="size-6" />
        </Card>
    )
}