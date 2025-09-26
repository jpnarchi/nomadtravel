'use client'

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatContainer } from "@/components/chat-container"
import { ChatHeader } from "@/components/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Workbench } from "@/components/workbench"
import { UIMessage } from "ai"

export function Chat({
    id,
    initialMessages
}: {
    id: string,
    initialMessages: UIMessage[]
}) {
    const [showWorkbench, setShowWorkbench] = useState(false)

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "19rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar />
            <SidebarInset>
                {!showWorkbench && <ChatHeader />}
                {!showWorkbench && (
                    <ChatContainer
                        id={id}
                        initialMessages={initialMessages}
                        setShowWorkbench={setShowWorkbench}
                    />
                )}
                {showWorkbench && <Workbench setShowWorkbench={setShowWorkbench} />}
            </SidebarInset>
        </SidebarProvider>
    )
}