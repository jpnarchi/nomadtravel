"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";


export const SectionsHero = () => {
    const { signIn } = useSignIn();

    const signInWithGoogle = () => {
      signIn?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    };

    return (
      <div className="max-w-7xl relative mx-auto pt-20 md:pt-60 pb-0 px-4 w-full left-0 top-0 z-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-50 lg:-mt-55 -mt-35">
          {/* Texto - aparece primero en mobile, segundo en desktop */}
          <div className="flex flex-col justify-center items-start order-1 md:order-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl dark:text-white leading-tight md:text-left font-[family-name:var(--font-ppmori-semibold)]">
              Lightning-Fast Creation
            </h1>
            <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl mt-4 md:mt-6 lg:mt-8 dark:text-neutral-200 leading-relaxed md:text-left">
              Turn any idea into a stunning presentation in minutes. Drag, drop, and design
              with intelligent templates and smart building blocks that make you look like a pro.
            </p>
          </div>
          {/* Imagen - aparece segunda en mobile, primera en desktop */}
          <div className="flex justify-center md:justify-start  items-center order-2 md:order-1">
            <img
              src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIUKVt5E8q1a6YH7LJd9XybZVDQ3cPou2htEj8"
              alt="Logo"
              className="w-80 sm:w-64 md:w-full md:max-w-sm lg:max-w-lg z-50 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            />
          </div>

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-50 lg:mt-30 mt-20">
          {/* Columna izquierda - Texto centrado */}
          <div className="flex flex-col justify-center items-start order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-semibold dark:text-white leading-tight md:text-left font-[family-name:var(--font-ppmori-semibold)]">
              Effortlessly Beautiful
            </h1>
            <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl mt-4 md:mt-6 lg:mt-8 dark:text-neutral-200 leading-relaxed md:text-left">
              No design background? No worries. Share your concepts and let optimized layouts
              and custom themes transform your slides into a polished, cohesive showcase.
            </p>
          </div>
          {/* Columna derecha - Imagen centrada */}
          <div className="flex justify-center md:justify-end  items-center order-2">
            <img
              src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIPDfaavZOZFfYEbg0V6cMN3k75QdKXa8Wypwm"
              alt="Logo"
              className="w-80 sm:w-64 md:w-full md:max-w-sm lg:max-w-lg z-50 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-50 lg:mt-25 mt-20">
          {/* Texto - aparece primero en mobile, segundo en desktop */}
          <div className="flex flex-col justify-center items-start order-1 md:order-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl dark:text-white leading-tight md:text-left font-[family-name:var(--font-ppmori-semibold)]">
              AI-Powered Intelligence
            </h1>
            <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl mt-4 md:mt-6 lg:mt-8 dark:text-neutral-200 leading-relaxed md:text-left">
              Every great idea deserves a creative partner. Our AI brings your vision to reality
              with intelligent suggestions, dynamic visuals, and instant content creation.
            </p>
          </div>
          {/* Imagen - aparece segunda en mobile, primera en desktop */}
          <div className="flex justify-center md:justify-start items-center order-2 md:order-1">
            <img
              src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIHvnARO8M4kumSHLKgvAni1eobCXFrPaYOxIc"
              alt="Logo"
              className="w-80 sm:w-64 md:w-full md:max-w-sm lg:max-w-lg z-50 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
            />
          </div></div>
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-12 md:py-20 lg:py-30 bg-gradient-to-t from-[#F4A7B6]/30  from-10% to-primary to-99% mt-10 md:mt-25">
          {/* Imágenes decorativas - Fuera del contenedor max-w */}
          {/* Imagen izquierda - Solo visible en desktop */}
          <img
            src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIujywkLOXp1zcDUfrCqNGaIx5LkJ9gbPMjRn6"
            alt="Decorative left"
            className="hidden lg:block absolute left-0 bottom-0 w-32 xl:w-120 h-auto opacity-80 -ml-40 mb-10"
          />

          {/* Imagen derecha - Solo visible en desktop */}
          <img
            src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIT9jM2zUlgOP8WXqRbDcys6iZYpKNLMvldaEF"
            alt="Decorative right"
            className="hidden lg:block absolute right-0 bottom-0 w-32 xl:w-60 mr-10 h-auto opacity-80  mb-10 transform scale-x-[-1]"
          />

          <div className="max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 px-4">
            {/* Texto - aparece primero en mobile, segundo en desktop */}
            <div className="flex flex-col justify-center items-center order-1 md:order-2">
              <h1 className="text-3xl text-white sm:text-4xl md:text-5xl lg:text-5xl dark:text-white leading-tight text-center font-[family-name:var(--font-ppmori-semibold)]">
                Start Creating Today
              </h1>
              <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl mt-4 md:mt-6 lg:mt-8 text-white leading-relaxed text-center">
                Join thousands who are already transforming their ideas into beautiful presentations.
                Your journey to professional-grade slides starts with a simple conversation.
              </p>
              <div className="flex flex-row gap-3 md:gap-4 mt-6 md:mt-6 lg:mt-10 justify-center w-full">
                <Link href="/sign-in">
                  <Button className="justify-center gap-2 text-base md:text-md rounded-full px-4 md:px-6 py-3 md:py-6">
                      Start now!
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={signInWithGoogle}
                  className="justify-center gap-2 text-base md:text-md rounded-full px-4 md:px-6 py-3 md:py-6 bg-white border border-black/20 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    );
  };