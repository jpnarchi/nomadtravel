import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProjects } from "./hooks/use-projects";
import { ProjectsList } from "./components/projects-list";

export function ProjectsDb({
    accessToken,
    chatId,
    onSupabaseProjectSelect,
    disableConnectOrg
}: {
    accessToken: string,
    chatId: Id<"chats">,
    onSupabaseProjectSelect: (projectId: string, projectName: string) => void,
    disableConnectOrg: boolean
}) {
    const { projects, isLoading, getProjects, selectedProjectId } = useProjects(chatId);
    const [isSelectingProject, setIsSelectingProject] = useState(false);

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
            isSelectingProject={isSelectingProject}
            selectedProjectId={selectedProjectId}
            onRefresh={getProjects}
            onCreateNew={handleNewProject}
            disableConnectOrg={disableConnectOrg}
            onSelect={async (projectId) => {
                setIsSelectingProject(true);
                try {
                    const project = projects.find(p => p.id === projectId);
                    const projectName = project?.name || 'Unknown Project';
                    onSupabaseProjectSelect(projectId, projectName);
                } finally {
                    setIsSelectingProject(false);
                }
            }}
        />
    );
}