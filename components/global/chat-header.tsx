'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/global/user-nav";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export function ChatHeader() {
    const router = useRouter();
    const { isSignedIn } = useAuth();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between">
            <div className="flex items-center gap-2" >
                {isSignedIn && <SidebarTrigger className="-ml-1" />}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <h1 className="font-bold bg-gradient-to-r from-emerald-500 to-lime-500 bg-clip-text text-transparent italic">Astri.dev</h1>
                </div>
            </div>
            <UserNav />
        </header>
    );
}
