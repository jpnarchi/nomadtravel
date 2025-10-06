import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function DisconnectDialog({
    open,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Desconectar Supabase</DialogTitle>
                    <DialogDescription>
                        Esta acción eliminará tu token de acceso de Supabase de tu cuenta. Podrás volver a conectar cuando quieras.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        className="bg-red-500/70 hover:bg-red-500 text-white"
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                    >
                        Desconectar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


