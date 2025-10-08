import { Id } from "@/convex/_generated/dataModel";
import { Button } from "../ui/button";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { DeploymentSuccessDialog } from "./deployment-success-dialog";
import { ExternalLink } from "lucide-react";

export function DeployButton({ id, version }: { id: Id<"chats">, version: number }) {
    const deploy = useAction(api.vercel.deploy);
    const currentDeploymentUrl = useQuery(api.chats.getDeploymentUrl, { chatId: id });
    const [isLoading, setIsLoading] = useState(false);
    const [deploymentUrl, setDeploymentUrl] = useState('');
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    return (
        <div className="flex items-center gap-2">
            {currentDeploymentUrl && (
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => {
                    window.open(currentDeploymentUrl, '_blank', 'noopener,noreferrer');
                }}>
                    <ExternalLink className="size-4" />
                </Button>
            )}
            <Button
                className="cursor-pointer"
                size="sm"
                onClick={async () => {
                    try {
                        setIsLoading(true);
                        const result = await deploy({ id, version });
                        setDeploymentUrl(result.deploymentUrl);
                        setIsSuccessDialogOpen(true);
                        toast.success("Publicado exitosamente");
                    } catch (error) {
                        console.log(error);
                        toast.error("Error al publicar");
                    } finally {
                        setIsLoading(false);
                    }
                }}
                disabled={isLoading}
            >
                {isLoading ? "Publicando..." : "Publicar"}
            </Button>
            <DeploymentSuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                deploymentUrl={deploymentUrl}
            />
        </div>
    )
}