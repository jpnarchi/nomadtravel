import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbProject } from "@/lib/interfaces";

export function useProjects(chatId: Id<"chats">) {
    const [projects, setProjects] = useState<DbProject[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProjects = useAction(api.supabase.fetchProjects);
    const updateSupabaseProjectIdForChat = useMutation(api.chats.updateSupabaseProjectIdForChat);
    const selectedProjectId = useQuery(api.chats.getSupabaseProjectId, { chatId });

    const getProjects = async () => {
        setIsLoading(true);
        try {
            const result = await fetchProjects();
            if (result && result.projects) {
                setProjects(result.projects);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setProjectForChat = async (projectId: string) => {
        await updateSupabaseProjectIdForChat({ supabaseProjectId: projectId, chatId });
    };

    return {
        projects,
        isLoading,
        getProjects,
        selectedProjectId,
        setProjectForChat,
    };
}


