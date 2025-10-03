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
import { useMobileViewport } from "@/hooks/use-mobile-viewport"

export function Pricing() {
    const { isSignedIn } = useAuth()
    const viewportHeight = useMobileViewport()

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
                <div
                    className="w-full overflow-auto"
                    style={{
                        height: `calc(${viewportHeight} - 4rem)`,
                        minHeight: 'calc(100vh - 4rem)'
                    }}
                >
                    <PricingContainer />
                    <Footer />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}