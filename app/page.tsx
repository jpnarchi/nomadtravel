import { AppSidebar } from "@/components/app-sidebar"
import { ChatContainer } from "@/components/chat-container"
import { ChatHeader } from "@/components/chat-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Home() {
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
        <ChatContainer />
      </SidebarInset>
    </SidebarProvider>
  )
}
