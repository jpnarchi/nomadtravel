import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function RestoreDialog({
    isOpen,
    onOpenChange,
    version,
    onRestore
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    version: number;
    onRestore: () => Promise<void>;
}) {
    const [isRestoring, setIsRestoring] = useState(false);

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await onRestore();
            toast.success(`Version ${version} restored successfully`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error restoring version:", error);
            toast.error("Error restoring version");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Restore version</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to restore version {version}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isRestoring}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-500/70 hover:bg-red-500 text-white cursor-pointer"
                        onClick={handleRestore}
                        disabled={isRestoring}
                    >
                        {isRestoring ? "Restoring" : "Restore"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
