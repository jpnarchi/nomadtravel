'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatHeader } from "@/components/global/chat-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@clerk/nextjs"
import { PricingContainer } from "./pricing-container"
import { Footer } from "../global/footer"

export function Pricing() {
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
                <div className="h-[calc(100vh-4rem)] w-full overflow-auto">
                    <PricingContainer />
                    <Footer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}