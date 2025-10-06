import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProjects } from "./hooks/use-projects";
import { ProjectsList } from "./components/projects-list";

export function ProjectsDb({
    accessToken,
    chatId,
    onSupabaseProjectSelect
}: {
    accessToken: string,
    chatId: Id<"chats">,
    onSupabaseProjectSelect: () => void
}) {
    const { projects, isLoading, getProjects, selectedProjectId, setProjectForChat } = useProjects(chatId);

    useEffect(() => {
        if (accessToken) {
            getProjects();
        }
    }, [accessToken]);

    const handleNewProject = () => {
        window.open('https://app.supabase.com/new/new-project', '_blank');
    };

    return (
        <ProjectsList
            projects={projects}
            isLoading={isLoading}
            selectedProjectId={selectedProjectId}
            onRefresh={getProjects}
            onCreateNew={handleNewProject}
            onSelect={async (projectId) => {
                await setProjectForChat(projectId);
                onSupabaseProjectSelect();
            }}
        />
    );
}