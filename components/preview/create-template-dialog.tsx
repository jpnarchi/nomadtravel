import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { PlusIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export function CreateTemplateDialog({
    files
}: {
    files: Record<string, string>
}) {
    const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

    const createTemplate = useMutation(api.templates.createTemplate);
    const createTemplateFile = useMutation(api.templates.createTemplateFile);

    const handleCreateTemplate = async () => {
        if (!templateName.trim() || !templateDescription.trim()) {
            toast.error("Por favor completa el nombre y descripción del template");
            return;
        }

        setIsCreatingTemplate(true);
        try {
            // Create the template
            const templateId = await createTemplate({
                name: templateName.trim(),
                description: templateDescription.trim()
            });

            // Create template files for each file in the workbench
            const filePromises = Object.entries(files).map(([path, content]) =>
                createTemplateFile({
                    templateId,
                    path,
                    content
                })
            );

            await Promise.all(filePromises);

            toast.success("Template creado exitosamente");
            setIsCreateTemplateOpen(false);
            setTemplateName("");
            setTemplateDescription("");
        } catch (error) {
            console.error("Error creating template:", error);
            toast.error("Error al crear el template");
        } finally {
            setIsCreatingTemplate(false);
        }
    };

    return (
        <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="cursor-pointer">
                    <PlusIcon className="size-4" />
                    Crear Template
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Template</DialogTitle>
                    <DialogDescription>
                        Crea un template con todos los archivos del workbench actual.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="template-name" className="text-sm font-medium">
                            Nombre del Template
                        </label>
                        <Input
                            id="template-name"
                            placeholder="Ej: Todo App"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="template-description" className="text-sm font-medium">
                            Descripción
                        </label>
                        <Textarea
                            id="template-description"
                            placeholder="Describe qué hace este template..."
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Se crearán {Object.keys(files).length} archivos en el template.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsCreateTemplateOpen(false)}
                        disabled={isCreatingTemplate}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateTemplate}
                        disabled={isCreatingTemplate || !templateName.trim() || !templateDescription.trim()}
                    >
                        {isCreatingTemplate ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear Template"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}