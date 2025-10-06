"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dialogType: 'file' | 'folder';
    targetFolder: string;
    onConfirm: (newItemName: string) => void;
}

export function CreateItemDialog({ open, onOpenChange, dialogType, targetFolder, onConfirm }: CreateItemDialogProps) {
    const [newItemName, setNewItemName] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newItemName.trim()) {
            onConfirm(newItemName);
            setNewItemName('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setNewItemName(''); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Crear Nuevo {dialogType === 'file' ? 'Archivo' : 'Carpeta'}
                        {targetFolder && ` en ${targetFolder}`}
                    </DialogTitle>
                    <DialogDescription>
                        {targetFolder
                            ? `Ingresa el nombre del ${dialogType === 'file' ? 'archivo' : 'carpeta'} (ej., Button.tsx o utils)`
                            : `Ingresa la ruta del ${dialogType === 'file' ? 'archivo' : 'carpeta'}. Usa / para rutas anidadas (ej., /components/Button.tsx)`
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Nombre del {dialogType === 'file' ? 'Archivo' : 'Carpeta'}
                        </Label>
                        {targetFolder && (
                            <p className="text-sm text-muted-foreground">
                                Ubicación: {targetFolder}/
                            </p>
                        )}
                        <Input
                            id="name"
                            placeholder={
                                targetFolder
                                    ? (dialogType === 'file' ? 'Button.tsx' : 'components')
                                    : (dialogType === 'file' ? '/MyComponent.tsx' : '/components')
                            }
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={() => { if (newItemName.trim()) { onConfirm(newItemName); setNewItemName(''); } }} disabled={!newItemName.trim()}>
                        Crear
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

