import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { ExternalLink, CheckCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

export function DeploymentSuccessDialog({
    isOpen,
    onClose,
    deploymentUrl
}: {
    isOpen: boolean;
    onClose: () => void;
    deploymentUrl: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleVisitSite = () => {
        window.open(deploymentUrl, '_blank', 'noopener,noreferrer');
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(deploymentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="size-5 text-green-500" />
                        ¡Despliegue Exitoso!
                    </DialogTitle>
                    <DialogDescription>
                        Tu aplicación ha sido publicada exitosamente y está disponible en línea.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">
                            URL de Despliegue
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md min-w-0">
                            <code className="text-sm flex-1 truncate min-w-0">
                                {deploymentUrl}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyUrl}
                                className="h-8 w-8 p-0 flex-shrink-0"
                            >
                                {copied ? (
                                    <Check className="size-4 text-green-500" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Tu aplicación está lista para ser compartida con el mundo.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleVisitSite}
                        className="flex items-center gap-2"
                    >
                        Visitar Sitio
                        <ExternalLink className="size-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}