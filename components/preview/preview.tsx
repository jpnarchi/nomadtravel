'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Workbench } from "@/components/preview/workbench"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@clerk/nextjs"

export function Preview({
    id,
    initialFiles,
}: {
    id: Id<"chats">,
    initialFiles: Record<string, string>
}) {
    const { isSignedIn } = useAuth()

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            {isSignedIn && <AppSidebar />}
            <SidebarInset>
                <Workbench
                    initialFiles={initialFiles}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}