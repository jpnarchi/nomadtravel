import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { FilePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export function CreateTemplateDialog({
    files
}: {
    files: Record<string, string>
}) {
    const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

    const createTemplate = useMutation(api.templates.createTemplate);
    const createTemplateFile = useMutation(api.templates.createTemplateFile);

    const handleCreateTemplate = async () => {
        if (!templateName.trim() || !templateDescription.trim()) {
            toast.error("Please complete the template name and description");
            return;
        }

        setIsCreatingTemplate(true);
        try {
            // Create the template
            const templateId = await createTemplate({
                name: templateName.trim(),
                description: templateDescription.trim()
            });

            // Create template files for each file in the workbench
            const filePromises = Object.entries(files).map(([path, content]) =>
                createTemplateFile({
                    templateId,
                    path,
                    content
                })
            );

            await Promise.all(filePromises);

            toast.success("Template created successfully");
            setIsCreateTemplateOpen(false);
            setTemplateName("");
            setTemplateDescription("");
        } catch (error) {
            console.error("Error creating template:", error);
            toast.error("Error creating template");
        } finally {
            setIsCreatingTemplate(false);
        }
    };

    return (
        <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="cursor-pointer" size="sm">
                    <FilePlus className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Template</DialogTitle>
                    <DialogDescription>
                        Create a template with all files from the current workbench.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="template-name" className="text-sm font-medium">
                            Template Name
                        </label>
                        <Input
                            id="template-name"
                            placeholder="Ex: Todo App"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="template-description" className="text-sm font-medium">
                            Description
                        </label>
                        <Textarea
                            id="template-description"
                            placeholder="Describe what this template does..."
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {Object.keys(files).length} files will be created in the template.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsCreateTemplateOpen(false)}
                        disabled={isCreatingTemplate}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateTemplate}
                        disabled={isCreatingTemplate || !templateName.trim() || !templateDescription.trim()}
                    >
                        {isCreatingTemplate ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Template"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}