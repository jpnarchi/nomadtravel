import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectsDb } from "./projects-db";

export function ConnectOrg({
    id
}: {
    id: Id<"chats">;
}) {
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + "/chat/" + id;

    const searchParams = useSearchParams()
    const code = searchParams.get('code')

    const user = useQuery(api.users.getUserInfo);
    const updateSupabaseAccessToken = useMutation(api.users.updateSupabaseAccessToken);

    const getOAuthUrl = useAction(api.supabase.getOAuthUrl);
    const exangeCodeForToken = useAction(api.supabase.exangeCodeForToken);
    const getOrganizations = useAction(api.supabase.getOrganizations);

    const [organizations, setOrganizations] = useState<any>([]);

    useEffect(() => {
        if (code) {
            handleSupabaseToken()
        }
    }, [code])

    useEffect(() => {
        if (user?.supabaseAccessToken) {
            fetchOrganizations();
        }
    }, [user?.supabaseAccessToken])

    const handleSupabaseToken = async () => {
        if (!code) { return }
        const data = await exangeCodeForToken({ code: code, redirectUri: redirectUri });
        if (!data) { return }
        await updateSupabaseAccessToken({ supabaseAccessToken: data.access_token });
    }

    const fetchOrganizations = async () => {
        const organizations = await getOrganizations();
        setOrganizations(organizations);
    }

    const handleSupabaseAuth = async () => {
        const url = await getOAuthUrl({ redirectUri: redirectUri });
        if (!url) { return }
        window.location.href = url;
    };

    const handleSupabaseDisconnect = async () => {
        await updateSupabaseAccessToken({ supabaseAccessToken: undefined });
    }

    return (
        <div className="flex flex-col gap-2 w-full">
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
                            onClick={() => handleSupabaseDisconnect()}
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
                        >
                            Conectar
                        </Button>
                    )}
                </div>

                {user?.supabaseAccessToken && organizations.length > 0 && (
                    <div className="flex flex-row items-center justify-between gap-4 w-full">
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold">Organización</p>
                            <p className="text-muted-foreground text-sm">Organización seleccionada</p>
                        </div>
                        <div className="flex flex-row gap-2">
                            {organizations.map((organization: any) => (
                                <Button key={organization.id} variant="outline" size="sm">
                                    {organization.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {user?.supabaseAccessToken && (
                    <ProjectsDb accessToken={user.supabaseAccessToken} />
                )}
            </Card>
        </div>
    )
}