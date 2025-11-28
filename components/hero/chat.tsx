'use client'

import { AppSidebar } from "@/components/global/app-sidebar"
import { ChatContainer } from "@/components/hero/chat-container"
import { ChatContainerNonLogged } from "@/components/hero/chat-container-non-logged"
import { ChatHeader } from "@/components/global/chat-header"
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { HeroOnboarding } from "./hero-onboarding";
import { useState, useEffect, useRef } from "react"

import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth } from "@clerk/nextjs"

export function Chat() {
    const allPresentations = useQuery(api.chats.getAllPresentationsWithFirstSlide)
    const { isSignedIn } = useAuth()
    const isNavigatingRef = useRef(false)
    const [, forceUpdate] = useState({})



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
                {isSignedIn && (allPresentations?.length === 0 || isNavigatingRef.current) ? (
                    <HeroOnboarding
                        onNavigate={() => {
                            isNavigatingRef.current = true
                            forceUpdate({})
                        }}
                        onNavigateCancel={() => {
                            isNavigatingRef.current = false
                            forceUpdate({})
                        }}
                    />
                ) : isSignedIn ? (
                    <>
                        <ChatHeader />
                        <ChatContainer />
                    </>
                ) : (
                    <>
                        <ChatHeader />
                        <ChatContainerNonLogged />
                    </>
                )}
            </SidebarInset>
        </SidebarProvider>
    )
}