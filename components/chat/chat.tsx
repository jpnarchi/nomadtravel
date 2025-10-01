'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatContainer } from "@/components/chat/chat-container"
import { ChatHeader } from "@/components/global/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { UIMessage } from "ai"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@clerk/nextjs"

export function Chat({
    id,
    initialMessages,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
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
                <ChatHeader />
                <ChatContainer
                    id={id}
                    initialMessages={initialMessages}
                />
            </SidebarInset>
        </SidebarProvider>
    )
}