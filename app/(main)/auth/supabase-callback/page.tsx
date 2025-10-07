"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader } from "@/components/ai-elements/loader";

export default function SupabaseCallbackPage() {
    return (
        <SupabaseCallback />
    );
}

function SupabaseCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("Conectando tu cuenta...");

    const exangeCodeForToken = useAction(api.supabase.exangeCodeForToken);
    const updateSupabaseAccessToken = useMutation(api.users.updateSupabaseAccessToken);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state'); // This contains the chat ID
            const redirectUri = process.env.NEXT_PUBLIC_BASE_URL + "/auth/supabase-callback";

            if (!code) {
                setStatus("No se pudo completar la conexión");
                return;
            }

            try {
                setStatus("Verificando tu cuenta...");

                // Exchange code for token
                const data = await exangeCodeForToken({ code, redirectUri });

                if (!data) {
                    setStatus("No se pudo verificar tu cuenta");
                    return;
                }

                setStatus("Guardando tu información...");

                // Save the token
                await updateSupabaseAccessToken({ supabaseAccessToken: data.access_token });

                setStatus("¡Listo! Te regresamos al chat...");

                // Redirect back to the original chat
                if (state) {
                    router.push(`/chat/${state}`);
                } else {
                    // Fallback to home if no state
                    router.push('/');
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                setStatus("Algo salió mal. Por favor, inténtalo de nuevo.");
            }
        };

        handleCallback();
    }, [searchParams, router, exangeCodeForToken, updateSupabaseAccessToken]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                    <p className="text-sm text-muted-foreground">
                        {status}
                    </p>
                </div>
            </div>
        </div>
    );
}
