// 'use client'

// import { useState } from "react"
// import { AppSidebar } from "@/components/app-sidebar"
// import { ChatContainer } from "@/components/chat-container"
// import { ChatHeader } from "@/components/chat-header"
// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/ui/sidebar"
// import { Workbench } from "@/components/workbench"

// export default function Home() {
//   const [showWorkbench, setShowWorkbench] = useState(false)

//   return (
//     <SidebarProvider
//       style={
//         {
//           "--sidebar-width": "19rem",
//         } as React.CSSProperties
//       }
//     >
//       <AppSidebar />
//       <SidebarInset>
//         {!showWorkbench && <ChatHeader />}
//         {!showWorkbench && <ChatContainer setShowWorkbench={setShowWorkbench} />}
//         {showWorkbench && <Workbench setShowWorkbench={setShowWorkbench} />}
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }

"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  const users = useQuery(api.users.getMany);
  return <div>Authenticated content: {users?.map((user) => user.name).join(', ')}</div>;
}