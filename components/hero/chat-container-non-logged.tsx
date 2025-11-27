'use client'

import { Footer } from "../global/footer";
import { CTASection } from "./cta-section"
import { HowSection } from "./how-section"
import { HeroParallaxDemo } from "@/components/hero/hero-parallax-demo"
import {SectionsHero} from "@/components/ui/sections-hero-logged-out"


export function ChatContainerNonLogged() {
    return (
        <>
            <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-white">
                
                {/* Hero Parallax Section */}
                <HeroParallaxDemo/>

                {/* How It Works Section */}
                {/* <HowSection /> */}
                <SectionsHero/>


                {/* Footer */}
                <Footer />
            </div>
        </>
    )
}
