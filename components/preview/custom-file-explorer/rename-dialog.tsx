"use client"

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RenameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string | undefined;
    itemType: 'file' | 'folder' | undefined;
    onConfirm: (newName: string) => void;
}

export function RenameDialog({ open, onOpenChange, itemName, itemType, onConfirm }: RenameDialogProps) {
    const [newName, setNewName] = useState('');

    useEffect(() => {
        setNewName(itemName || '');
    }, [itemName]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Renombrar {itemType === 'folder' ? 'Carpeta' : 'Archivo'}</DialogTitle>
                    <DialogDescription>
                        Ingresa el nuevo nombre para {itemName}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="rename">Nuevo Nombre</Label>
                        <Input
                            id="rename"
                            placeholder={itemName}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newName.trim()) {
                                    onConfirm(newName);
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={() => { if (newName.trim()) onConfirm(newName); }} disabled={!newName.trim() || newName === itemName}>
                        Renombrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

