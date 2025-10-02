import { ExternalLink, RotateCcw } from "lucide-react";
import { Card } from "../../ui/card";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { formatCreationTime } from "@/lib/utils";
import { RestoreDialog } from "./restore-dialog";

export function PreviewButton({
    id,
    version,
    creationTime,
}: {
    id: Id<"chats">,
    version: number,
    creationTime: string
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const router = useRouter();
    return (
        <Card className="group relative w-full flex flex-row items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">

            {/* Contenido central */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground">Versión {version}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatCreationTime(creationTime)}</p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
                {/* Botón restaurar - estilo ghost de Vercel */}
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsRestoreDialogOpen(true)}
                    className="flex-shrink-0"
                    title="Restaurar esta versión"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    onClick={() => {
                        setIsLoading(true);
                        router.push(`/chat/${id}/preview/${version}`);
                    }}
                    disabled={isLoading}
                    className="bg-green-700 hover:bg-green-600 text-white cursor-pointer"
                >
                    {isLoading ? (
                        <>
                            <Loader className="w-4 h-4" />
                            Cargando
                        </>
                    ) : (
                        <>
                            Ver Página
                            <ExternalLink className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>

            {/* Restore Dialog */}
            <RestoreDialog
                isOpen={isRestoreDialogOpen}
                onOpenChange={setIsRestoreDialogOpen}
                version={version}
                onRestore={async () => {
                    // TODO: Implement actual restore functionality
                    // This is a placeholder - you'll need to implement the actual restore logic
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }}
            />
        </Card>
    )
}