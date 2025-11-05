import { Button } from "../ui/button";
import { ArrowLeftIcon, CodeXml, Eye, Pencil, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { CreateTemplateDialog } from "./create-template-dialog";
import { Loader } from "../ai-elements/loader";
import { FabricPresentationPreview } from "./fabric-presentation-preview";
import { FabricPresentationEditor } from "../templates/fabric-presentation-editor";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

export function Workbench({ id, version }: { id: Id<"chats">, version: number }) {
    const isAdmin = useQuery(api.users.isAdmin);
    const [isBackButtonLoading, setIsBackButtonLoading] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});
    const files = useQuery(api.files.getAll, { chatId: id, version });
    const currentVersion = useQuery(api.chats.getCurrentVersion, { chatId: id });
    const updateFile = useMutation(api.files.updateByPath);
    const router = useRouter();

    // Handle save changes
    const handleSaveChanges = async (filesToSave: Record<string, string>) => {
        setIsSaving(true);
        try {
            // Save to the version being viewed
            const versionToSave = version;

            // Update each modified file in the viewed version
            const updatePromises = Object.entries(filesToSave).map(([path, content]) =>
                updateFile({ chatId: id, path, content, version: versionToSave })
            );

            await Promise.all(updatePromises);

            toast.success(`Changes saved to version ${versionToSave}`);
            setEditedFiles({});
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error('Error saving changes');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle cancel editing
    const handleCancelEdit = () => {
        setEditedFiles({});
        setIsEditing(false);
        toast.info('Edit cancelled');
    };

    // Handle start editing
    const handleStartEdit = () => {
        setIsEditing(true);
        toast.info('Edit mode activated');
    };

    if (!files) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader />
                </div>
            </div>
        );
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
                    {isBackButtonLoading ? "Loading" : "Return to Chat"}
                </Button>

                <div className="flex gap-2">
                    {isAdmin && <CreateTemplateDialog files={files} />}

                    {!isEditing ? (
                        <>
                            <Button
                                size="sm"
                                // variant="outline"
                                className="cursor-pointer"
                                onClick={handleStartEdit}
                            >
                                <Pencil className="size-4 mr-2" />
                                Edit
                            </Button>
                            {isAdmin && <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => setShowCode(!showCode)}
                            >
                                {showCode ? <Eye className="size-4" /> : <CodeXml className="size-4" />}
                            </Button>}
                        </>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                            >
                                <X className="size-4 mr-2" />
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden mt-4 bg-black">
                {isEditing ? (
                    <FabricPresentationEditor
                        initialFiles={files}
                        onSave={handleSaveChanges}
                        isSaving={isSaving}
                    />
                ) : !showCode ? (
                    <FabricPresentationPreview chatId={id} version={version} />
                ) : (
                    <div className="h-full overflow-auto p-6 bg-zinc-900 text-white">
                        <h2 className="text-xl font-bold mb-4">Presentation Files</h2>
                        <div className="space-y-4">
                            {Object.entries(files)
                                .filter(([path]) => path.startsWith('/slides/'))
                                .sort((a, b) => a[0].localeCompare(b[0]))
                                .map(([path, content]) => (
                                    <div key={path} className="border border-zinc-700 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold mb-2 text-blue-400">{path}</h3>
                                        <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                                            <code>{content}</code>
                                        </pre>
                                    </div>
                                ))}
                            {Object.entries(files).filter(([path]) => path.startsWith('/slides/')).length === 0 && (
                                <p className="text-gray-400">No slides found in this presentation.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}