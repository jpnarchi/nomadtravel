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
import { AdminTemplatesContainer } from "./admin-templates-container";

export function AdminTemplates() {
    const userInfo = useQuery(api.users.getUserInfo);
    const isAdmin = userInfo?.role === "admin";

    // Only allow access to admins for /templates route
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
                <div className="flex flex-col h-[calc(100dvh-4rem)] bg-background overflow-y-auto">
                    <AdminTemplatesContainer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}