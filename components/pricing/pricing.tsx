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
import { ScrollArea } from "../ui/scroll-area"

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
                <ScrollArea className="max-h-[calc(100%-130px)] h-full w-full flex-1">
                    <PricingContainer />
                    <Footer />
                </ScrollArea>
            </SidebarInset>
        </SidebarProvider>
    )
}