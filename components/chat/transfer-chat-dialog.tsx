import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export function TransferChatDialog({
    chatId,
    chatTitle
}: {
    chatId: Id<"chats">
    chatTitle: string
}) {
    const router = useRouter();
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
            toast.error("Please enter a valid email");
            return;
        }

        if (!emailValidation?.isValid) {
            toast.error("User with this email does not exist");
            return;
        }

        setIsTransferring(true);
        try {
            const result = await transferChat({
                chatId,
                newOwnerEmail: newOwnerEmail.trim()
            });

            toast.success(`Chat successfully transferred to ${result.newOwnerName}`);
            setIsTransferDialogOpen(false);
            setNewOwnerEmail("");
            setEmailValidation(null);
            router.push('/');
        } catch (error) {
            console.error("Error transferring chat:", error);
            toast.error(error instanceof Error ? error.message : "Error transferring chat");
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
            <DialogTrigger asChild className="hover:bg-[#f5f5f5]">
                <Button variant="ghost" size="sm" className="gap-1 cursor-pointer w-full flex justify-start">
                    <UserPlus className="h-4 w-4" />
                    Transfer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transfer Chat</DialogTitle>
                    <DialogDescription>
                        Transfer the property of the chat"{chatTitle}" to another user.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="new-owner-email" className="text-sm font-medium">
                            Email of new user
                        </label>
                        <div className="relative">
                            <Input
                                id="new-owner-email"
                                type="email"
                                placeholder="user@example.com"
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
                                ✓ User found: {emailValidation.userInfo.name}
                            </div>
                        )}
                        {emailValidation?.isValid === false && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                ✗ User not found
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                    This action will permanently transfer the chat and all its files, messages, and suggestions to the new owner.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isTransferring}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransferChat}
                        disabled={isTransferring || !emailValidation?.isValid || !newOwnerEmail.trim()}
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Transfering...
                            </>
                        ) : (
                            "Transfer chat"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
