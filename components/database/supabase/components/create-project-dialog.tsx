import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader } from "@/components/ai-elements/loader";

export function CreateProjectDialog({
    organizationId,
    onProjectCreated
}: {
    organizationId: string;
    onProjectCreated: (projectId: string, projectName: string) => void;
}) {
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [dbPassword, setDbPassword] = useState("");
    const [isCreatingProject, setIsCreatingProject] = useState(false);

    const createProject = useAction(api.supabase.createProject);

    const handleCreateProject = async () => {
        if (!projectName.trim() || !dbPassword.trim()) {
            toast.error("Por favor completa el nombre del proyecto y la contraseña de la base de datos");
            return;
        }

        if (dbPassword.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        setIsCreatingProject(true);
        try {
            const result = await createProject({
                name: projectName.trim(),
                dbPass: dbPassword.trim(),
                organizationId,
                region: 'us-east-1',
            });

            if (result.success) {
                toast.success("Proyecto creado exitosamente");
                onProjectCreated(result.project.id, result.project.name);
                setIsCreateProjectOpen(false);
                setProjectName("");
                setDbPassword("");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error("Error al crear el proyecto");
        } finally {
            setIsCreatingProject(false);
        }
    };

    return (
        <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
            <DialogTrigger asChild>
                <Button
                    className="bg-green-700 hover:bg-green-600 text-white cursor-pointer"
                    variant="default"
                    size="lg"
                >
                    <div className="flex flex-row gap-2 items-center">
                        <Plus className="size-4" />
                        <p>Nuevo Proyecto</p>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo proyecto de Supabase.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="project-name" className="text-sm font-medium">
                            Nombre del Proyecto
                        </label>
                        <Input
                            id="project-name"
                            placeholder="Ej: mi-proyecto-app"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="db-password" className="text-sm font-medium">
                            Contraseña de la Base de Datos
                        </label>
                        <Input
                            id="db-password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={dbPassword}
                            onChange={(e) => setDbPassword(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsCreateProjectOpen(false)}
                        disabled={isCreatingProject}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateProject}
                        disabled={isCreatingProject || !projectName.trim() || !dbPassword.trim() || dbPassword.length < 8}
                    >
                        {isCreatingProject ? (
                            <>
                                <Loader className="size-4" />
                                Creando...
                            </>
                        ) : (
                            "Crear Proyecto"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
