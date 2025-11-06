"use client"

/**
 * Vista previa y edición de Templates con Fabric.js
 *
 * Componente principal para visualizar y editar presentaciones
 * Reemplaza completamente Sandpack con editor Fabric.js
 */

import { Button } from "../ui/button";
import { ArrowLeftIcon, Eye, Code } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Loader } from "../ai-elements/loader";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { FabricPresentationEditor } from "./fabric-presentation-editor";
import { FabricPresentationPreview } from "../preview/fabric-presentation-preview";

export function PreviewTemplate({
    id,
}: {
    id: Id<"templates">,
}) {
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const initialFiles = useQuery(api.templates.getFilesByTemplateId, { templateId: id });
    const [isSaving, setIsSaving] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const router = useRouter();

    const saveTemplateFiles = useMutation(api.templates.saveTemplateFiles);

    if (!initialFiles) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                </div>
            </div>
        );
    }

    const handleSave = async (currentFiles: Record<string, string>) => {
        console.log('🔵 handleSave llamado');
        console.log('📂 InitialFiles paths:', Object.keys(initialFiles).sort());
        console.log('📂 CurrentFiles paths:', Object.keys(currentFiles).sort());

        setIsSaving(true);
        try {
            // Calculate differences
            const added: { path: string; content: string }[] = [];
            const updated: { path: string; content: string }[] = [];
            const deleted: string[] = [];

            // Find added and updated files
            Object.entries(currentFiles).forEach(([path, content]) => {
                if (!initialFiles[path]) {
                    added.push({ path, content });
                } else if (initialFiles[path] !== content) {
                    updated.push({ path, content });
                }
            });

            // Find deleted files
            Object.keys(initialFiles).forEach(path => {
                if (!currentFiles[path]) {
                    deleted.push(path);
                }
            });

            console.log('📝 Cambios:', {
                added: added.map(f => f.path),
                updated: updated.map(f => f.path),
                deleted
            });

            await saveTemplateFiles({
                templateId: id,
                files: { added, updated, deleted }
            });

            console.log('✅ Guardado exitoso, esperando a que Convex actualice...');
            toast.success('Cambios guardados exitosamente');

            // Wait for Convex to update the reactive query, then force remount
            setTimeout(() => {
                console.log('🔄 Incrementando editorKey para forzar remount');
                setEditorKey(prev => prev + 1);
            }, 500);

        } catch (error) {
            toast.error('Error al guardar cambios');
            console.error('❌ Error guardando:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-screen flex flex-col px-4 md:px-12 pt-4 pb-24 md:pb-12">
            <div className="flex flex-row justify-between items-center">
                <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => {
                        setIsBackButtonLoading(true);
                        router.push(`/templates`);
                    }}
                >
                    {isBackButtonLoading ? (<Loader />) : (<ArrowLeftIcon className="size-4" />)}
                    {isBackButtonLoading ? "Loading" : "Return to chat"}
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setShowEditor(!showEditor)}
                    >
                        {showEditor ? (
                            <>
                                <Eye className="size-4 mr-2" />
                                Preview
                            </>
                        ) : (
                            <>
                                <Code className="size-4 mr-2" />
                                Editor
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden mt-4">
                {showEditor ? (
                    <FabricPresentationEditor
                        key={`editor-${editorKey}`}
                        initialFiles={initialFiles}
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                ) : (
                    <FabricPresentationPreview
                        chatId={id as any}
                        version={0}
                        isTemplate={true}
                        templateFiles={initialFiles}
                    />
                )}
            </div>
        </div>
    );
}
