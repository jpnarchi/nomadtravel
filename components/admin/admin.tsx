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
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

export function Admin() {
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
                    <AdminContainer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}