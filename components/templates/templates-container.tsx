import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { TrashIcon, EditIcon, SaveIcon, CancelIcon, PreviewIcon } from "../global/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function TemplatesContainer() {
    const templates = useQuery(api.templates.getAll);
    const deleteTemplate = useMutation(api.templates.deleteTemplate);
    const updateTemplate = useMutation(api.templates.updateTemplate);
    const router = useRouter();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const handleEdit = (template: any) => {
        setEditingId(template._id);
        setEditName(template.name);
        setEditDescription(template.description);
    };

    const handleSave = async (templateId: any) => {
        if (!editName.trim() || !editDescription.trim()) return;

        try {
            await updateTemplate({
                id: templateId,
                name: editName.trim(),
                description: editDescription.trim(),
            });
            setEditingId(null);
            setEditName("");
            setEditDescription("");
        } catch (error) {
            console.error("Error updating template:", error);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
    };

    const handlePreview = (templateId: string) => {
        router.push(`/templates/${templateId}`);
    };

    return (
        <div className="p-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-6">Plantillas</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates?.map((template) => (
                    <Card key={template._id} className="group relative p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                        <div className="flex flex-col h-full">
                            <div className="flex-1">
                                {editingId === template._id ? (
                                    <div className="space-y-3">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Template name"
                                            className="text-lg font-semibold"
                                        />
                                        <Textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Template description"
                                            className="text-sm resize-none"
                                            rows={3}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold mb-2">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500 mb-4 line-clamp-3">
                                            {template.description}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4">
                                {editingId === template._id ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(template._id)}
                                            className="flex-1"
                                        >
                                            <SaveIcon />
                                            <span className="ml-2">Guardar</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            <CancelIcon />
                                            <span className="ml-2">Cancelar</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handlePreview(template._id)}
                                            className="flex-1"
                                        >
                                            <PreviewIcon />
                                            <span className="ml-2">Vista Previa</span>
                                        </Button>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(template)}
                                                className="h-8 w-8"
                                            >
                                                <EditIcon />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteTemplate({ name: template.name })}
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <TrashIcon />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}