import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSupabaseAuth(redirectUri: string) {
    const user = useQuery(api.users.getUserInfo);
    const updateSupabaseAccessToken = useMutation(api.users.updateSupabaseAccessToken);

    const getOAuthUrl = useAction(api.supabase.getOAuthUrl);
    const exangeCodeForToken = useAction(api.supabase.exangeCodeForToken);
    const getOrganizations = useAction(api.supabase.getOrganizations);

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [isUpdatingToken, setIsUpdatingToken] = useState(false);
    const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);

    const fetchOrganizations = async () => {
        setIsLoadingOrganizations(true);
        try {
            const orgs = await getOrganizations();
            setOrganizations(orgs);
        } finally {
            setIsLoadingOrganizations(false);
        }
    };

    useEffect(() => {
        if (user?.supabaseAccessToken) {
            fetchOrganizations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.supabaseAccessToken]);

    const handleSupabaseAuth = async () => {
        const url = await getOAuthUrl({ redirectUri });
        if (!url) return;
        window.location.href = url;
    };

    const handleSupabaseDisconnect = async () => {
        await updateSupabaseAccessToken({ supabaseAccessToken: undefined });
    };

    const exchangeAndStoreToken = async (code: string) => {
        setIsUpdatingToken(true);
        try {
            const data = await exangeCodeForToken({ code, redirectUri });
            if (!data) return;
            await updateSupabaseAccessToken({ supabaseAccessToken: data.access_token });
        } finally {
            setIsUpdatingToken(false);
        }
    };

    return {
        user,
        organizations,
        isUpdatingToken,
        isLoadingOrganizations,
        handleSupabaseAuth,
        handleSupabaseDisconnect,
        exchangeAndStoreToken,
    };
}


