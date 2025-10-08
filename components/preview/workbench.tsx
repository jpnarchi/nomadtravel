import { SandpackProvider, SandpackLayout, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";
import { ArrowLeftIcon, CodeXml, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { CreateTemplateDialog } from "./create-template-dialog";
import { Loader } from "../ai-elements/loader";
import { SandpackPreviewClient } from "./sandpack-preview-client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { WorkbenchFileExplorer } from "./custom-file-explorer";
import { elementInspectorJs, indexJs, toasterIndexJs } from "@/lib/element-inspector-files";
import { DeployButton } from "./deploy-button";

export function Workbench({ id, version }: { id: Id<"chats">, version: number }) {
    const isAdmin = useQuery(api.users.isAdmin);
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const files = useQuery(api.files.getAll, { chatId: id, version });
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
        "framer-motion": "latest",
        "@supabase/supabase-js": "latest",
        "@stripe/stripe-js": "latest",
    }

    if (!files) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                </div>
            </div>
        );
    }

    if (!files["/index.js"] || !files["/components/ElementInspector.js"]) {
        if (files['/lib/utils.js']) {
            files["/index.js"] = toasterIndexJs;
        } else {
            files["/index.js"] = indexJs;
        }
        files['/components/ElementInspector.js'] = elementInspectorJs
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
                    {isAdmin && <CreateTemplateDialog files={files} />}
                    <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setShowCode(!showCode)}
                    >
                        {showCode ? <Eye className="size-4" /> : <CodeXml className="size-4" />}
                    </Button>
                    <DeployButton id={id} version={version} />
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
                            <SandpackPreviewClient chatId={id} />
                        )}
                        {showCode && (
                            <>
                                {isDesktop && (
                                    <WorkbenchFileExplorer
                                        chatId={id}
                                        version={version}
                                        initialFiles={files}
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