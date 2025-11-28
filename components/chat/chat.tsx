'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatContainerMobile } from "@/components/chat/chat-container-mobile"
import { ChatContainer } from "@/components/chat/chat-container";
import { ChatHeader } from "@/components/global/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { UIMessage } from "ai"
import { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@clerk/nextjs"
import { useState, useEffect } from "react";

export function Chat({
    id,
    initialMessages,
}: {
    id: Id<"chats">,
    initialMessages: UIMessage[],
}) {
    const { isSignedIn } = useAuth()
    const [isMobile, setIsMobile ] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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
                {isMobile ? (
                <ChatContainerMobile
                    id={id}
                    initialMessages={initialMessages}
                /> ) : <ChatContainer
                id={id}
                initialMessages={initialMessages}/> }
                
            </SidebarInset>
        </SidebarProvider>
    )
}