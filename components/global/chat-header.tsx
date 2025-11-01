'use client'

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/global/user-nav";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ChatHeader() {
    const router = useRouter();
    const { isSignedIn } = useAuth();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 justify-between bg-white">
            <div className="flex items-center gap-6" >
                {isSignedIn && <SidebarTrigger className="-ml-1" />}
                <div className="hidden sm:flex items-center gap-2 cursor-pointer shrink-0" onClick={() => router.push('/')}>
                    <Image
                    src="/logo.png"
                    width={80}
                    alt="I Love Presentations"
                    height={80}
                    className="h-10 w-20 shrink-0"
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
            <div className="flex items-center gap-4">
                {!isSignedIn && (
                    <Button className="hidden sm:block justify-center gap-2">
                        <Link href="/sign-in">
                            Sign In
                        </Link>
                    </Button>
                )}
                <UserNav />
            </div>
        </header>
    );
}
