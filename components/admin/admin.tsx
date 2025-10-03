'use client'

import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { notFound } from "next/navigation";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "../global/app-sidebar";
import { ChatHeader } from "../global/chat-header";
import { AdminContainer } from "./admin-container";

export function Admin() {
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
                <div className="flex-1 w-full overflow-y-auto pb-24 md:pb-8">
                    <AdminContainer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}