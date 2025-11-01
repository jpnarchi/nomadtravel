'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/global/user-nav";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image"
import Link from "next/link"

export function ChatHeader() {
    const router = useRouter();
    const { isSignedIn } = useAuth();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between bg-white">
            <div className="flex items-center gap-6" >
                {isSignedIn && <SidebarTrigger className="-ml-1" />}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <Image
                    src="/logo.png"
                    width={80}
                    alt="I Love Presentations"
                    height={80}
                    className="h-10"
                    />
                </div>
                <nav className="flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                        Home
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                        Pricing
                    </Link>
                </nav>
            </div>
            <UserNav />
        </header>
    );
}
