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
import {useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";


export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Find the scrollable parent container
  const [scrollContainer, setScrollContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      let parent = (ref.current as HTMLElement).parentElement;
      while (parent) {
        const overflow = window.getComputedStyle(parent).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') {
          setScrollContainer(parent);
          break;
        }
        parent = parent.parentElement;
      }
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    container: scrollContainer ? { current: scrollContainer } : undefined,
    offset: ["start start", "end start"],
  });

  // Configuración más rápida para móvil
  const springConfig = isMobile
    ? { stiffness: 600, damping: 50, bounce: 0 }
    : { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.1], [0.1, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 100]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className={isMobile 
        ? "h-[120vh] py-40 overflow-hidden  antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
        : "h-[200vh] py-40 overflow-hidden  antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
      }
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-2 md:space-x-20 mb-20 -mt-40 lg:-mt-10">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row space-x-2 md:space-x-20 mb-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  const { signIn } = useSignIn();

  const signInWithGoogle = () => {
    signIn?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  return (
    <div className="max-w-7xl relative mx-auto py-12 md:py-20 lg:py-40 px-4 w-full left-0 top-0 z-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-50 lg:-mt-55 -mt-35">
        {/* Columna izquierda - Texto centrado */}
        <div className="flex flex-col justify-center items-start">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold dark:text-white leading-tight text-center md:text-left">
            The Ultimate Presentation Studio
          </h1>
          <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl mt-4 md:mt-6 lg:mt-8 dark:text-neutral-200 leading-relaxed text-center md:text-left">
            Create stunning presentations in seconds by simply chatting with AI.
            No design skills needed - just describe your vision and watch it come to life
            with professional presentations and intelligent content generation.
          </p>
          <div className="flex flex-row gap-3 md:gap-4 mt-6 md:mt-6 lg:mt-10 justify-center md:justify-start w-full">
            <Link href="/sign-in">
              <Button className="justify-center gap-2 text-base md:text-lg rounded-full px-4 md:px-6 py-3 md:py-6">
                  Start now!
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={signInWithGoogle}
              className="justify-center gap-2 text-base md:text-lg rounded-full px-4 md:px-6 py-3 md:py-6 bg-white border border-black/20 hover:bg-gray-50"
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
        {/* Columna derecha - Imagen centrada */}
        <div className="flex justify-center items-center">
          <img
            src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDI2WWFDL65IsSQuNPF3mlyR4BEveh91koaUZq8"
            alt="Logo"
            className="w-64 sm:w-64 md:w-full md:max-w-sm lg:max-w-xl z-50 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
}, []);

  return isMobile ? (
    <motion.img
      style={{
        x: translate,
      }}
      key={product.title}
      src={product.thumbnail}
      alt={product.title}
      className="h-96 w-[10rem] -mb-80 shrink-0 rounded-2xl object-contain"
    />
  ) : (
    <motion.img
      style={{
        x: translate,
      }}
      key={product.title}
      src={product.thumbnail}
      alt={product.title}
      className="h-96 w-[30rem] -mb-30 shrink-0 rounded-2xl object-contain"
    />
  );
};
