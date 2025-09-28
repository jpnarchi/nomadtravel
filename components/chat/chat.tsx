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
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@clerk/nextjs"

export function Chat({
    id,
    initialMessages,
    initialSuggestions,
    initialTitle,
    initialFiles,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
    initialSuggestions: string[],
    initialTitle: string,
    initialFiles: Record<string, string>
}) {
    const [showWorkbench, setShowWorkbench] = useState(false)
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
                {!showWorkbench && <ChatHeader />}
                {!showWorkbench && (
                    <ChatContainer
                        id={id}
                        initialMessages={initialMessages}
                        setShowWorkbench={setShowWorkbench}
                        initialSuggestions={initialSuggestions}
                        initialTitle={initialTitle}
                    />
                )}
                {showWorkbench && (
                    <Workbench 
                        setShowWorkbench={setShowWorkbench} 
                        initialFiles={initialFiles}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    )
}