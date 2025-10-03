'use client'

import { Id } from "@/convex/_generated/dataModel"
import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

const dependencies = {
    "lucide-react": "latest",
    "framer-motion": "latest"
}

export function PreviewTemplate({
    id,
    initialFiles
}: {
    id: Id<"templates">,
    initialFiles: Record<string, string>
}) {
    const [showCode, setShowCode] = useState(true);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="h-screen flex flex-col px-4 md:px-12 pt-4 pb-24 md:pb-12">
            <h1>Template {id}</h1>
            <Button variant="default" className="cursor-pointer" onClick={() => setShowCode(!showCode)}>
                {showCode ? "Vista previa" : "Código"}
            </Button>
            <div className="flex-1 border rounded-lg overflow-hidden mt-4">
                <SandpackProvider
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
                                style={{ height: '80dvh', minHeight: '80vh', width: '100%' }}
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
    )
}