'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatContainer } from "@/components/hero/chat-container"
import { ChatContainerNonLogged } from "@/components/hero/chat-container-non-logged"
import { ChatHeader } from "@/components/global/chat-header"


import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@clerk/nextjs"

export function Chat() {
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
            <SidebarInset className="h-screen overflow-y-auto">
                <ChatHeader />
                {isSignedIn ? <ChatContainer /> : <ChatContainerNonLogged />}
            </SidebarInset>
        </SidebarProvider>
    )
}