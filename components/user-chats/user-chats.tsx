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

interface UserChatsProps {
    userId: Id<"users">
}

export function UserChats({ userId }: UserChatsProps) {
    const isAdmin = useQuery(api.users.isAdmin);
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
            <SidebarInset className="flex flex-col h-screen">
                <ChatHeader />
                <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background overflow-y-auto">
                    <UserChatsContainer userId={userId} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}