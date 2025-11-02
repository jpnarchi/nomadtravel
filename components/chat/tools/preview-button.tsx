import { RotateCcw } from "lucide-react";
import { Card } from "../../ui/card";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { formatCreationTime } from "@/lib/utils";
import { RestoreDialog } from "./restore-dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { InspectorIcon } from "@/components/global/icons";

export function PreviewButton({
    id,
    version,
    creationTime,
    currentVersion,
}: {
    id: Id<"chats">,
    version: number,
    creationTime: string,
    currentVersion: number | null | undefined
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const router = useRouter();
    const restoreVersion = useMutation(api.messages.restoreVersion);

    // CRITICAL: Always redirect to currentVersion (latest), not the specific version
    // This ensures users edit the latest version that the AI will use
    const versionToView = currentVersion ?? version;

    return (
        <div className="flex flex-col gap-2 w-full">
            <Card className="group relative w-full flex flex-row items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">

                {/* Central content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">Version {version}</p>
                        {version !== currentVersion && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                                Old Version
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCreationTime(creationTime)}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {/* Restore button - only show if not the current version */}
                    {currentVersion !== undefined && currentVersion !== null && version !== (currentVersion - 1) && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsRestoreDialogOpen(true)}
                            className="flex-shrink-0"
                            title="Restore this version"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        size="sm"
                        onClick={() => {
                            setIsLoading(true);
                            router.push(`/chat/${id}/preview/${versionToView}`);
                        }}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-200 text-white cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4" />
                                Loading
                            </>
                        ) : (
                            <>
                                View Presentation
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
                        await restoreVersion({ chatId: id, version });
                        window.location.reload();
                    }}
                />
            </Card>
            <div className="flex flex-row items-center gap-2 text-xs text-muted-foreground italic">
                <p>Tip: Click "View Presentation" to visualize the slides.</p>
            </div>
        </div>
    )
}