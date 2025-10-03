'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatHeader } from "@/components/global/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { UserChatsContainer } from "./user-chats-container"
import { Id } from "@/convex/_generated/dataModel"
import { notFound } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMobileViewport } from "@/hooks/use-mobile-viewport"

interface UserChatsProps {
    userId: Id<"users">
}

export function UserChats({ userId }: UserChatsProps) {
    const isAdmin = useQuery(api.users.isAdmin);
    const viewportHeight = useMobileViewport();
    if (!isAdmin) {
        notFound();
    }

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
                <ChatHeader />
                <div
                    className="w-full overflow-auto"
                    style={{
                        height: `calc(${viewportHeight} - 4rem)`,
                        minHeight: 'calc(100vh - 4rem)'
                    }}
                >
                    <UserChatsContainer userId={userId} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}