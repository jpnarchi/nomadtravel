import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { ProjectsDb } from "./projects-db";
import { useSupabaseAuth } from "./hooks/use-supabase-auth";
import { DisconnectDialog } from "./components/disconnect-dialog";
import { useState } from "react";
import { motion } from "framer-motion";

export function ConnectOrg({
    id,
    onSupabaseProjectSelect,
    showLoader,
    disableConnectOrg
}: {
    id: Id<"chats">;
    onSupabaseProjectSelect: (projectId: string, projectName: string) => void;
    showLoader: boolean;
    disableConnectOrg: boolean;
}) {
    // Use a static redirect URI that's registered with Supabase
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + "/auth/supabase-callback";

    const {
        user,
        organizations,
        isLoadingOrganizations,
        isUpdatingToken,
        handleSupabaseAuth,
        handleSupabaseDisconnect,
    } = useSupabaseAuth(redirectUri, id);

    const isLoading = isUpdatingToken || isLoadingOrganizations || showLoader;
    const [disconnectOpen, setDisconnectOpen] = useState(false);

    if (isLoading) {
        return null;
    }

    return (
        <motion.div
            className="flex flex-col gap-2 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: 0.1
            }}
        >
            <Card className="group relative w-full flex flex-col items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all duration-200">
                <div className="flex flex-row items-center justify-between gap-4 w-full">
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Supabase</p>
                        <p className="text-muted-foreground text-sm">Conecta tu Base de Datos</p>
                    </div>
                    {user?.supabaseAccessToken && (
                        <Button
                            className="bg-red-500/70 hover:bg-red-500 text-white cursor-pointer"
                            variant="default"
                            size="sm"
                            onClick={() => setDisconnectOpen(true)}
                            disabled={disableConnectOrg}
                        >
                            Desconectar
                        </Button>
                    )}

                    {!user?.supabaseAccessToken && (
                        <Button
                            className="bg-green-700 hover:bg-green-600 text-white cursor-pointer"
                            variant="default"
                            size="sm"
                            onClick={() => handleSupabaseAuth()}
                            disabled={disableConnectOrg}
                        >
                            Conectar
                        </Button>
                    )}
                </div>

                {user?.supabaseAccessToken && organizations?.length > 0 && (
                    <div className="flex flex-row items-center justify-between gap-4 w-full">
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold">Organización</p>
                            <p className="text-muted-foreground text-sm">Organización seleccionada</p>
                        </div>
                        <div className="flex flex-row gap-2">
                            {organizations.map((organization: any) => (
                                <Button key={organization.id} variant="outline" size="sm" disabled={disableConnectOrg}>
                                    {organization.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {user?.supabaseAccessToken && (
                    <ProjectsDb
                        accessToken={user.supabaseAccessToken}
                        chatId={id}
                        onSupabaseProjectSelect={onSupabaseProjectSelect}
                        disableConnectOrg={disableConnectOrg}
                    />
                )}
                <DisconnectDialog
                    open={disconnectOpen}
                    onOpenChange={setDisconnectOpen}
                    onConfirm={handleSupabaseDisconnect}
                />
            </Card>
        </motion.div>
    )
}