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

    return <PreviewTemplate id={id as Id<"templates">} returnPath="/my-templates" />
}