import { Button } from "@/components/ui/button";
import { AlertTriangle, Database, RotateCcw, RotateCcw as RestoreIcon, Check, ChevronDown } from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";
import { DbProject } from "@/lib/interfaces";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function ProjectsList({
    projects,
    isLoading,
    isSelectingProject,
    selectedProjectId,
    onRefresh,
    onSelect,
    onDelete,
    onRestore,
    disableConnectOrg,
}: {
    projects: DbProject[];
    isLoading: boolean;
    isSelectingProject: boolean;
    selectedProjectId?: string | null;
    onRefresh: () => void;
    onSelect: (projectId: string) => void;
    onDelete: (projectId: string) => Promise<void>;
    onRestore: (projectId: string) => Promise<void>;
    disableConnectOrg: boolean;
}) {
    const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
    const [isFreeAccountWarningExpanded, setIsFreeAccountWarningExpanded] = useState(false);
    const [isInactivityWarningExpanded, setIsInactivityWarningExpanded] = useState(false);

    const handleRestore = async (projectId: string) => {
        setActionLoading(prev => new Set(prev).add(projectId));
        try {
            await onRestore(projectId);
        } catch (error) {
            console.error("Error restoring project:", error);
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
        }
    };

    const handleSelect = async (projectId: string) => {
        setActionLoading(prev => new Set(prev).add(projectId));
        try {
            await onSelect(projectId);
        } catch (error) {
            console.error("Error selecting project:", error);
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
        }
    };

    const isProjectLoading = (projectId: string) => actionLoading.has(projectId);

    // Supabase project statuses can be: ACTIVE_HEALTHY, ACTIVE_UNHEALTHY, INACTIVE, PAUSED, COMING_UP, etc.
    // Active: Only projects with status starting with "ACTIVE_" or exactly "ACTIVE"
    // Coming Up: Projects with status "COMING_UP" or similar
    // Inactive: Everything else (INACTIVE, PAUSED, etc.)
    const activeProjects = projects.filter(p => {
        const status = p.status.toLowerCase();
        return status.startsWith('active_') || status === 'active';
    });

    const comingUpProjects = projects.filter(p => {
        const status = p.status.toLowerCase();
        return status.includes('coming_up') || status.includes('starting') || status.includes('initializing') || status.includes('restoring');
    });

    const inactiveProjects = projects.filter(p => {
        const status = p.status.toLowerCase();
        return !(status.startsWith('active_') || status === 'active' ||
            status.includes('coming_up') || status.includes('starting') || status.includes('initializing') || status.includes('restoring'));
    });

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold">Proyectos</p>
                    <p className="text-muted-foreground text-sm mt-1">Selecciona un proyecto para continuar</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading || disableConnectOrg}
                    className="cursor-pointer"
                >
                    Refrescar
                    <RotateCcw className="size-4" />
                </Button>
            </div>

            {/* Free Account Warning */}
            {projects.length >= 2 && (
                <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <button
                                onClick={() => setIsFreeAccountWarningExpanded(!isFreeAccountWarningExpanded)}
                                className="flex items-center justify-between w-full text-left cursor-pointer"
                            >
                                <h4 className="text-sm font-medium">
                                    Información importante sobre límites de proyectos
                                </h4>
                                <ChevronDown
                                    className={`size-4 text-white transition-transform ${isFreeAccountWarningExpanded ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {isFreeAccountWarningExpanded && (
                                <p className="text-sm mt-1 text-zinc-300">
                                    Las cuentas gratuitas de Supabase están limitadas a 2 proyectos.
                                    Para crear más proyectos, considera actualizar a un plan de pago.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Inactivity Pause Disclaimer */}
            {inactiveProjects.length > 0 && (
                <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <button
                                onClick={() => setIsInactivityWarningExpanded(!isInactivityWarningExpanded)}
                                className="flex items-center justify-between w-full text-left cursor-pointer"
                            >
                                <h4 className="text-sm font-medium">
                                    Información importante sobre pausas automáticas
                                </h4>
                                <ChevronDown
                                    className={`size-4 text-white transition-transform ${isInactivityWarningExpanded ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {isInactivityWarningExpanded && (
                                <p className="text-sm mt-1 text-zinc-300">
                                    Los proyectos gratuitos de Supabase se pausan automáticamente después de 7 días de inactividad.
                                    Si un proyecto aparece como inactivo, puedes restaurarlo usando el botón "Restaurar".
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {/* Active Projects */}
                        {activeProjects.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Proyectos Activos</h4>
                                {activeProjects.map((project) => (
                                    <div key={project.id} className="group">
                                        <div className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${selectedProjectId === project.id
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'border-border'
                                            }`}>
                                            <Database className="size-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{project.name}</p>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Creado {new Date(project.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isProjectLoading(project.id) ? (
                                                    <Loader />
                                                ) : (
                                                    <>
                                                        {selectedProjectId === project.id ? (
                                                            <Check className="size-5 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <Button
                                                                className='cursor-pointer'
                                                                size="sm"
                                                                onClick={() => handleSelect(project.id)}
                                                                disabled={isSelectingProject || disableConnectOrg}
                                                            >
                                                                Seleccionar
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Coming Up Projects */}
                        {comingUpProjects.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Proyectos Iniciando</h4>
                                {comingUpProjects.map((project) => (
                                    <div key={project.id} className="group">
                                        <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                                            <Database className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{project.name}</p>
                                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                                        Configurando
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-zinc-300">
                                                    El proyecto se está configurando. Espera unos minutos y refresca la lista.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Inactive Projects */}
                        {inactiveProjects.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Proyectos Inactivos</h4>
                                {inactiveProjects.map((project) => (
                                    <div key={project.id} className="group">
                                        <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                            <Database className="size-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{project.name}</p>
                                                    <Badge variant="destructive" className="text-xs">
                                                        Inactivo
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    Creado {new Date(project.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isProjectLoading(project.id) ? (
                                                    <Loader />
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className='cursor-pointer'
                                                            variant="outline"
                                                            onClick={() => handleRestore(project.id)}
                                                            disabled={isSelectingProject || disableConnectOrg}
                                                        >
                                                            <RestoreIcon className="size-4" />
                                                            Restaurar
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {projects.length === 0 && (
                            <div className="text-center py-8">
                                <Database className="size-10 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No hay proyectos disponibles</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Crea un nuevo proyecto para comenzar
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}


