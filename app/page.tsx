'use client'

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatContainer } from "@/components/chat-container"
import { ChatHeader } from "@/components/chat-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Workbench } from "@/components/workbench"

export default function Home() {
  const [showWorkbench, setShowWorkbench] = useState(false)

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
        {!showWorkbench && <ChatHeader />}
        {!showWorkbench && <ChatContainer setShowWorkbench={setShowWorkbench} />}
        {showWorkbench && <Workbench setShowWorkbench={setShowWorkbench} />}
      </SidebarInset>
    </SidebarProvider>
  )
}
