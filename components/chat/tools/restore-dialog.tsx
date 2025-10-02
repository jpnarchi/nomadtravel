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
            toast.success(`Versión ${version} restaurada exitosamente`);
            onOpenChange(false);
        } catch (error) {
            console.error("Error restoring version:", error);
            toast.error("Error al restaurar la versión");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Restaurar versión</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que quieres restaurar la versión {version}? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isRestoring}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="bg-red-500 hover:bg-red-500 text-white cursor-pointer"
                        onClick={handleRestore}
                        disabled={isRestoring}
                    >
                        {isRestoring ? "Restaurando" : "Restaurar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
