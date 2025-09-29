import { getTemplateById, getTemplateFiles } from "@/lib/convex-server";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { PreviewTemplate } from "@/components/templates/preview-template";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const template = await getTemplateById(id as Id<"templates">);
    if (!template) {
        notFound();
    }

    const templateFiles = await getTemplateFiles(template.name);

    const initialFiles = templateFiles.reduce((acc, file) => {
        acc[file.path] = file.content;
        return acc;
    }, {} as Record<string, string>);

    return (
        <div>
            <h1>Template {template.name}</h1>
            <PreviewTemplate id={id as Id<"templates">} initialFiles={initialFiles} />
        </div>
    )
}