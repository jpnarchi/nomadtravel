"use client"

import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";

import { ArrowLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Loader } from "../ai-elements/loader";
import { CustomFileExplorer } from "./custom-file-explorer";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

export function PreviewTemplate({
    id,
}: {
    id: Id<"templates">,
}) {
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const initialFiles = useQuery(api.templates.getFilesByTemplateId, { templateId: id });
    const [isDesktop, setIsDesktop] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const saveTemplateFiles = useMutation(api.templates.saveTemplateFiles);

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
        "framer-motion": "latest",
        "@supabase/supabase-js": "latest"
    }

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

            await saveTemplateFiles({
                templateId: id,
                files: { added, updated, deleted }
            });

            toast.success('Cambios guardados exitosamente');
            setHasChanges(false);
            router.refresh();
        } catch (error) {
            toast.error('Error al guardar cambios');
            console.error(error);
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
                        router.push(`/`);
                    }}
                >
                    {isBackButtonLoading ? (<Loader />) : (<ArrowLeftIcon className="size-4" />)}
                    {isBackButtonLoading ? "Cargando" : "Volver"}
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? "Vista previa" : "Código"}
                    </Button>
                </div>
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden mt-4">
                <SandpackProvider
                    key={showCode ? 'code' : 'preview'}
                    files={initialFiles}
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
                                    <CustomFileExplorer
                                        templateId={id}
                                        initialFiles={initialFiles}
                                        onFilesChange={(currentFiles) => {
                                            const filesChanged = JSON.stringify(initialFiles) !== JSON.stringify(currentFiles);
                                            setHasChanges(filesChanged);
                                        }}
                                        onSave={handleSave}
                                        hasChanges={hasChanges}
                                        isSaving={isSaving}
                                    />
                                )}
                                <SandpackCodeEditor
                                    showLineNumbers={true}
                                    showTabs={true}
                                    showRunButton={false}
                                    style={{
                                        height: '100%',
                                        minHeight: '100%'
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