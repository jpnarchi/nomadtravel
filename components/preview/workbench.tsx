import { SandpackProvider, SandpackLayout, SandpackPreview, SandpackCodeEditor, SandpackFileExplorer } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function Workbench({
    initialFiles
}: {
    initialFiles: Record<string, string>
}) {
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
        <div
            className="px-4 md:px-12 pb-12 pt-4"
            style={{ height: 'calc(100vh - 6%)' }}
        >
            <div className="flex flex-row justify-between items-center">
                <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => {
                        router.back();
                        router.refresh();
                    }}
                >
                    <ArrowLeftIcon className="size-4" />
                    Back
                </Button>

                <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setShowCode(!showCode)}
                >
                    {showCode ? "Preview" : "Code"}
                </Button>
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