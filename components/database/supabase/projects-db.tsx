import { Button } from "@/components/ui/button";
import { AlertTriangle, Database, RotateCcw, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { DbProject } from "@/lib/interfaces";
import { Loader } from "@/components/ai-elements/loader";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

export function ProjectsDb({
    accessToken,
    chatId,
    onSupabaseProjectSelect
}: {
    accessToken: string,
    chatId: Id<"chats">,
    onSupabaseProjectSelect: () => void
}) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [projects, setProjects] = useState<DbProject[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchProjects = useAction(api.supabase.fetchProjects);
    const updateSupabaseProjectIdForChat = useMutation(api.chats.updateSupabaseProjectIdForChat);
    const getSupabaseProjectId = useQuery(api.chats.getSupabaseProjectId, { chatId });

    useEffect(() => {
        getProjects();
    }, [accessToken]);

    const getProjects = async () => {
        setLoading(true);
        setProjects([]);
        const projects = await fetchProjects();
        setProjects(projects.projects);
        setLoading(false);
    }

    const handleNewProject = async () => {
        window.open('https://app.supabase.com/new/new-project', '_blank');
    }

    const toggleProjectExpansion = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold">Proyectos</p>
                    <p className="text-muted-foreground text-sm mt-1">Selecciona un proyecto para continuar</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        getProjects();
                    }}
                    disabled={loading}
                >
                    <RotateCcw className="size-4 cursor-pointer" />
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader />
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="flex flex-col gap-2">
                            <Button
                                className={`cursor-pointer w-full flex flex-row gap-4 items-center justify-between px-4 ${getSupabaseProjectId === project.id ? '!border-green-500' : ''}`}
                                variant="outline"
                                size="lg"
                                onClick={async () => {
                                    if (project.status.toLowerCase() === 'inactive') {
                                        toggleProjectExpansion(project.id);
                                    } else {
                                        // window.open(`https://app.supabase.com/project/${project.id}`, '_blank');
                                        await updateSupabaseProjectIdForChat({ supabaseProjectId: project.id, chatId });
                                        onSupabaseProjectSelect();
                                    }
                                }}
                            >
                                <div className="flex flex-row gap-3 items-center">
                                    <Database className="size-4" />
                                    <p>{project.name}</p>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    {project.status.toLowerCase() === 'inactive' && (
                                        <>
                                            <AlertTriangle className="size-4 text-red-500" />
                                            {expandedProjects.has(project.id) ? (
                                                <ChevronDown className="size-4" />
                                            ) : (
                                                <ChevronRight className="size-4" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </Button>
                            {project.status.toLowerCase() === 'inactive' && expandedProjects.has(project.id) && (
                                <div className="ml-1 p-3 rounded-md">
                                    <div className="flex flex-row gap-2 items-start">
                                        <AlertTriangle className="size-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium text-red-500">Proyecto Inactivo</p>
                                            <p className="text-sm text-red-500">
                                                Este proyecto está actualmente inactivo. Esto puede deberse a problemas de conexión,
                                                configuración incorrecta, o que el proyecto haya sido pausado.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

                <Button
                    className="bg-green-700 hover:bg-green-600 text-white cursor-pointer"
                    variant="default"
                    size="lg"
                    onClick={handleNewProject}
                >
                    <div className="flex flex-row gap-2 items-center">
                        <Plus className="size-4" />
                        <p>Nuevo Proyecto</p>
                    </div>
                </Button>
            </div>
        </div>
    )
}