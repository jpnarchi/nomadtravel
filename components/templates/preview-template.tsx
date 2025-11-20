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
import { FabricPresentationPreviewMobile } from "../preview/fabric-presentation-preview-mobile";

export function PreviewTemplate({
    id,
}: {
    id: Id<"templates">,
}) {
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const initialFiles = useQuery(api.templates.getFilesByTemplateId, { templateId: id });
    const [isSaving, setIsSaving] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const router = useRouter();

    const saveTemplateFiles = useMutation(api.templates.saveTemplateFiles);

    // Detect if mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        <div className="h-screen flex flex-col">
            {isMobile ? (
                <FabricPresentationPreviewMobile
                    chatId={id as any}
                    version={0}
                    isTemplate={true}
                    templateFiles={initialFiles}
                />
            ) : (
                <FabricPresentationEditor
                    key={`editor-${editorKey}`}
                    initialFiles={initialFiles}
                    onSave={handleSave}
                    isSaving={isSaving}
                    returnPath="/templates"
                />
            )}
        </div>
    );
}
