"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string | undefined;
    itemType: 'file' | 'folder' | undefined;
    onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, onOpenChange, itemName, itemType, onConfirm }: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar {itemName}</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que quieres eliminar este {itemType === 'folder' ? 'carpeta y todos sus archivos' : 'archivo'}?
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

