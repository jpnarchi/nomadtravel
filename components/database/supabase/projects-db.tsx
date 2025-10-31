import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProjects } from "./hooks/use-projects";
import { ProjectsList } from "./components/projects-list";
import { CreateProjectDialog } from "./components/create-project-dialog";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ProjectsDb({
    accessToken,
    chatId,
    onSupabaseProjectSelect,
    disableConnectOrg,
    organizationId
}: {
    accessToken: string,
    chatId: Id<"chats">,
    onSupabaseProjectSelect: (projectId: string, projectName: string) => void,
    disableConnectOrg: boolean,
    organizationId?: string
}) {
    const { projects, isLoading, getProjects, selectedProjectId } = useProjects(chatId);
    const [isSelectingProject, setIsSelectingProject] = useState(false);
    const restoreProject = useAction(api.supabase.restoreProject);

    useEffect(() => {
        if (accessToken) {
            getProjects();
        }
    }, [accessToken, getProjects]);

    const handleProjectCreated = (projectId: string, projectName: string) => {
        // onSupabaseProjectSelect(projectId, projectName);
        getProjects();
    };

    const handleDeleteProject = async (projectId: string) => {
        // delete project
    };

    const handleRestoreProject = async (projectId: string) => {
        try {
            await restoreProject({ projectId });
            toast.success("Proyecto restaurado exitosamente");

            // Wait 1 second before refreshing the projects list
            setTimeout(() => {
                getProjects();
            }, 1000);
        } catch (error) {
            console.error("Error restoring project:", error);
            toast.error("Error al restaurar el proyecto");
        }
    };

    if (!organizationId) {
        return (
            <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-row items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">Proyectos</p>
                        <p className="text-muted-foreground text-sm mt-1">No se encontró una organización</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <ProjectsList
                projects={projects}
                isLoading={isLoading}
                isSelectingProject={isSelectingProject}
                selectedProjectId={selectedProjectId}
                onRefresh={getProjects}
                onDelete={handleDeleteProject}
                onRestore={handleRestoreProject}
                disableConnectOrg={disableConnectOrg}
                onSelect={(projectId) => {
                    setIsSelectingProject(true);
                    const project = projects.find(p => p.id === projectId);
                    const projectName = project?.name || 'Unknown Project';
                    onSupabaseProjectSelect(projectId, projectName);
                    setIsSelectingProject(false);
                }}
            />
            {!disableConnectOrg && (
                <CreateProjectDialog
                    organizationId={organizationId}
                    onProjectCreated={handleProjectCreated}
                />
            )}
        </div>
    );
}