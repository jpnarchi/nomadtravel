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
import { TemplatesContainer } from "./templates-container";

export function Templates() {
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
            <SidebarInset>
                <ChatHeader />
                <TemplatesContainer />
            </SidebarInset>
        </SidebarProvider>
    )
}