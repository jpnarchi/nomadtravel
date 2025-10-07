import { Id } from "@/convex/_generated/dataModel";
import { Button } from "../ui/button";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner"

export function DeployButton({ id, version }: { id: Id<"chats">, version: number }) {
    const deploy = useAction(api.vercel.deploy);
    const [isLoading, setIsLoading] = useState(false);
    const [deploymentUrl, setDeploymentUrl] = useState('');
    return (
        <div>
            <Button 
                size="sm" 
                onClick={async () => {
                    try {
                        setIsLoading(true);
                        const result = await deploy({ id, version });
                        setDeploymentUrl(result.deploymentUrl);
                        // toast.success("Publicado exitosamente");
                    } catch (error) {
                        console.log(error);
                        // toast.error("Error al publicar", { description: error as string });
                    } finally {
                        setIsLoading(false);
                    }
                }}
                disabled={isLoading}
            >
                {isLoading ? "Publicando..." : "Publicar"}
            </Button>
            {deploymentUrl && (
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer">
                    {deploymentUrl}
                </a>
            )}
        </div>
    )
}