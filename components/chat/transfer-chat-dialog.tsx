import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export function TransferChatDialog({
    chatId,
    chatTitle
}: {
    chatId: Id<"chats">
    chatTitle: string
}) {
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [newOwnerEmail, setNewOwnerEmail] = useState("");
    const [isTransferring, setIsTransferring] = useState(false);
    const [emailValidation, setEmailValidation] = useState<{
        isValid: boolean;
        userInfo?: { name: string; email: string };
    } | null>(null);

    const transferChat = useMutation(api.chats.transferChatOwnership);
    const validateEmail = useQuery(api.chats.validateUserEmail,
        newOwnerEmail.trim() ? { email: newOwnerEmail.trim() } : "skip"
    );

    // Validate email when it changes
    useEffect(() => {
        if (newOwnerEmail.trim()) {
            if (validateEmail) {
                if (validateEmail.exists && validateEmail.name && validateEmail.email) {
                    setEmailValidation({
                        isValid: true,
                        userInfo: {
                            name: validateEmail.name,
                            email: validateEmail.email
                        }
                    });
                } else {
                    setEmailValidation({
                        isValid: false
                    });
                }
            }
        } else {
            setEmailValidation(null);
        }
    }, [validateEmail, newOwnerEmail]);

    const handleTransferChat = async () => {
        if (!newOwnerEmail.trim()) {
            toast.error("Por favor ingresa un email válido");
            return;
        }

        if (!emailValidation?.isValid) {
            toast.error("El usuario con este email no existe");
            return;
        }

        setIsTransferring(true);
        try {
            const result = await transferChat({
                chatId,
                newOwnerEmail: newOwnerEmail.trim()
            });

            toast.success(`Chat transferido exitosamente a ${result.newOwnerName}`);
            setIsTransferDialogOpen(false);
            setNewOwnerEmail("");
            setEmailValidation(null);
        } catch (error) {
            console.error("Error transferring chat:", error);
            toast.error(error instanceof Error ? error.message : "Error al transferir el chat");
        } finally {
            setIsTransferring(false);
        }
    };

    const handleCancel = () => {
        setIsTransferDialogOpen(false);
        setNewOwnerEmail("");
        setEmailValidation(null);
    };

    return (
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                    <UserPlus className="h-4 w-4" />
                    Transferir
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transferir Chat</DialogTitle>
                    <DialogDescription>
                        Transfiere la propiedad del chat "{chatTitle}" a otro usuario.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="new-owner-email" className="text-sm font-medium">
                            Email del nuevo propietario
                        </label>
                        <div className="relative">
                            <Input
                                id="new-owner-email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={newOwnerEmail}
                                onChange={(e) => setNewOwnerEmail(e.target.value)}
                                className="pr-10"
                            />
                            {emailValidation && (
                                <div className="absolute right-3 top-2.5">
                                    {emailValidation.isValid ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            )}
                        </div>
                        {emailValidation?.isValid && emailValidation.userInfo && (
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                                ✓ Usuario encontrado: {emailValidation.userInfo.name}
                            </div>
                        )}
                        {emailValidation?.isValid === false && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                ✗ Usuario no encontrado
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Esta acción transferirá permanentemente el chat y todos sus archivos, mensajes y sugerencias al nuevo propietario.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isTransferring}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleTransferChat}
                        disabled={isTransferring || !emailValidation?.isValid || !newOwnerEmail.trim()}
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Transferiendo...
                            </>
                        ) : (
                            "Transferir Chat"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
