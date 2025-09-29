import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ArrowLeftIcon, Loader2, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export function Workbench({
    id,
    initialFiles
}: {
    id: Id<"chats">,
    initialFiles: Record<string, string>
}) {
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [files, setFiles] = useState(initialFiles);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
    const [deleteTemplateName, setDeleteTemplateName] = useState("");
    const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
    const router = useRouter();

    // Convex mutations
    const createTemplate = useMutation(api.templates.createTemplate);
    const createTemplateFile = useMutation(api.templates.createTemplateFile);
    const deleteTemplate = useMutation(api.templates.deleteTemplate);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const dependencies = {
        "lucide-react": "latest",
        "framer-motion": "latest"
    }

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

    const handleDeleteTemplate = async () => {
        if (!deleteTemplateName.trim()) {
            toast.error("Por favor ingresa el nombre del template a eliminar");
            return;
        }

        setIsDeletingTemplate(true);
        try {
            await deleteTemplate({
                name: deleteTemplateName.trim()
            });

            toast.success("Template eliminado exitosamente");
            setIsDeleteTemplateOpen(false);
            setDeleteTemplateName("");
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Error al eliminar el template");
        } finally {
            setIsDeletingTemplate(false);
        }
    };

    return (
        <div
            className="px-4 md:px-12 pb-12 pt-4"
            style={{ height: 'calc(100vh - 6%)' }}
        >
            <div className="flex flex-row justify-between items-center">
                <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => {
                        setIsBackButtonLoading(true);
                        router.push(`/chat/${id}`);
                        router.refresh();
                    }}
                >
                    {isBackButtonLoading ? (<Loader2 className="size-4 animate-spin" />) : (<ArrowLeftIcon className="size-4" />)}
                    Atrás
                </Button>

                <div className="flex gap-2">
                    <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" className="cursor-pointer">
                                <PlusIcon className="size-4 mr-2" />
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

                    <Dialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="cursor-pointer">
                                <Trash2Icon className="size-4 mr-2" />
                                Eliminar Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Eliminar Template</DialogTitle>
                                <DialogDescription>
                                    Ingresa el nombre del template que deseas eliminar. Esta acción no se puede deshacer.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label htmlFor="delete-template-name" className="text-sm font-medium">
                                        Nombre del Template
                                    </label>
                                    <Input
                                        id="delete-template-name"
                                        placeholder="Ej: Todo App"
                                        value={deleteTemplateName}
                                        onChange={(e) => setDeleteTemplateName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteTemplateOpen(false)}
                                    disabled={isDeletingTemplate}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteTemplate}
                                    disabled={isDeletingTemplate || !deleteTemplateName.trim()}
                                >
                                    {isDeletingTemplate ? (
                                        <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Eliminando...
                                        </>
                                    ) : (
                                        "Eliminar Template"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? "Vista previa" : "Código"}
                    </Button>
                </div>
            </div>
            <div className="h-full border rounded-lg overflow-hidden mt-4">
                <SandpackProvider
                    files={files}
                    theme="dark"
                    template="react"
                    options={{
                        externalResources: ['https://cdn.tailwindcss.com'],
                        autorun: true,
                    }}
                    customSetup={{
                        dependencies: dependencies
                    }}
                    style={{ height: '100%' }}
                >
                    <SandpackLayout style={{ height: '100%' }}>
                        {!showCode && (
                            <SandpackPreview
                                showOpenInCodeSandbox={false}
                                showRefreshButton={false}
                                showNavigator={true}
                                style={{ height: '100%', width: '100%' }}
                            />
                        )}
                        {showCode && (
                            <>
                                {isDesktop && (
                                    <SandpackFileExplorer
                                        style={{
                                            width: '250px',
                                            height: '100%',
                                            minWidth: '250px',
                                            maxWidth: '250px'
                                        }}
                                    />
                                )}
                                <SandpackCodeEditor
                                    showLineNumbers={true}
                                    showTabs={true}
                                    style={{
                                        height: '85.25vh'
                                    }}
                                />
                            </>
                        )}
                    </SandpackLayout>
                </SandpackProvider>
            </div>
        </div>
    );
}