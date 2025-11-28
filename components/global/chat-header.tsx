'use client'

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserNav } from "@/components/global/user-nav";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {useState, useEffect } from "react";

export function ChatHeader() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    // const { setOpen, setOpenMobile, isMobile } = useSidebar();

    // const handleProjectsClick = (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     if (isMobile) {
    //         setOpenMobile(true);
    //     } else {
    //         setOpen(true);
    //     }
    // };

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);


    return (
        <header className="w-full h-16 shrink-0 bg-white border-b border-border/40">
            <div className="max-w-7xl mx-auto flex h-full items-center gap-2 px-4 justify-between">
            <div className="flex items-center gap-6" >
                {isSignedIn && <SidebarTrigger className="-ml-1" />}
                <div className="hidden sm:flex items-center gap-2 cursor-pointer shrink-0" onClick={() => router.push('/')}>
                    <Image
                    src="/logo.png"
                    width={100}
                    alt="I Love Presentations"
                    height={100}
                    className="h-10 w-20 shrink-0"
                    />
                </div>
                <nav className="flex items-center gap-8">
                    <Link href="/" className="text-base  md:text-md lg:text-md  font-medium hover:text-primary transition-colors">
                        Home
                    </Link>
                    {isSignedIn && (
                    <Link href="/my-templates" className="text-base  md:text-md lg:text-md font-medium hover:text-primary transition-colors">
                        My Templates
                    </Link>)}

                    <Link href="/pricing" className="text-base  md:text-md lg:text-md font-medium hover:text-primary transition-colors">
                        Pricing
                    </Link>

                    {/* {isSignedIn && (
                    <button
                        onClick={handleProjectsClick}
                        className="text-base md:text-lg font-medium hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                         Projects
                    </button>
                    )} */}
                </nav>
            </div>
            <div className="flex items-center gap-12">
                {!isSignedIn && (
                    <>
                        <Link href="/sign-in" className="hidden md:block md:text-md lg:text-md hover:text-primary transition-colors">
                            Sign in
                        </Link>
                        {isMobile ? (
                            <Button className="justify-center gap-2 text-base md:text-md lg:text-md rounded-full px-6 md:px-8 py-3 md:py-5 -mr-12">
                                <Link href="/sign-in">
                                    Sign in
                                </Link>
                            </Button>
                        ) : (
                            <Button className="justify-center gap-2 text-base md:text-md lg:text-md rounded-full px-6 md:px-8 py-3 md:py-5">
                                <Link href="/sign-up">
                                    Start free
                                </Link>
                            </Button>
                        )}
                    </>
                )}
                <UserNav />
            </div>
            </div>
        </header>
    );
}
