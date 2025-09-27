'use client'

import { useState } from "react"
import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatContainer } from "@/components/chat/chat-container"
import { ChatHeader } from "@/components/global/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Workbench } from "@/components/chat/workbench"
import { UIMessage } from "ai"
import { Id } from "@/convex/_generated/dataModel";

export function Chat({
    id,
    initialMessages
}: {
    id: Id<"chats">,
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