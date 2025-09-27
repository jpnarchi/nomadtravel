import { LaptopMinimal } from "lucide-react";
import { Card } from "../ui/card";

export function PreviewButton({ setShowWorkbench }: { setShowWorkbench: (show: boolean) => void }) {
    return (
        <Card 
            className="w-full flex flex-row justify-between items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setShowWorkbench(true)}
        >
            <div className="flex flex-col">
                <p className="font-medium mb-1">Sneaky</p>
                <p className="text-sm text-gray-500">Version 1</p>
            </div>

            <LaptopMinimal className="size-6" />
        </Card>
    )
}