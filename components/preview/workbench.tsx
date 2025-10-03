import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";

import { ArrowLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { CreateTemplateDialog } from "./create-template-dialog";
import { Loader } from "../ai-elements/loader";

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
    const router = useRouter();

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

    return (
        <div className="h-screen flex flex-col px-4 md:px-12 pt-4 pb-24 md:pb-12">
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
                    {isBackButtonLoading ? (<Loader />) : (<ArrowLeftIcon className="size-4" />)}
                    {isBackButtonLoading ? "Cargando" : "Volver a Chat"}
                </Button>

                <div className="flex gap-2">
                    <CreateTemplateDialog files={files} />
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
                                    showRunButton={false}
                                    style={{
                                        height: '85.25dvh',
                                        minHeight: '85.25vh'
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