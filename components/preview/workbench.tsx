import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Workbench({
    initialFiles
}: {
    initialFiles: Record<string, string>
}) {
    const [files, setFiles] = useState(initialFiles);
    const router = useRouter();

    const dependencies = {
        "lucide-react": "latest"
    }

    return (
        <div
            className="px-4 md:px-12 pb-12 pt-4"
            style={{ height: 'calc(100vh - 6%)' }}
        >
            <div className="flex flex-row justify-start">
                <Button
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => router.back()}
                >
                    <ArrowLeftIcon className="size-4" />
                    Back
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
                        <SandpackPreview
                            showOpenInCodeSandbox={false}
                            showRefreshButton={false}
                            showNavigator={true}
                            style={{ height: '100%', width: '100%' }}
                        />
                    </SandpackLayout>
                </SandpackProvider>
            </div>
        </div>
    );
}