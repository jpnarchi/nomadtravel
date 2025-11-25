"use client";
import { useScroll, useTransform, useMotionValue, animate } from "framer-motion";
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export const ParallaxScroll = ({
  images,
  className,
  gridClassName,
}: {
  images: string[];
  className?: string;
  gridClassName?: string;
}) => {
  const gridRef = useRef<any>(null);
  const scrollProgress = useMotionValue(0);

  // Auto-scroll animation
  useEffect(() => {
    const controls = animate(scrollProgress, 1, {
      duration: 1000, // 300 segundos (5 minutos) para un scroll muy lento
      repeat: Infinity,
      ease: "linear",
    });

    return controls.stop;
  }, [scrollProgress]);

  const translateFirst = useTransform(scrollProgress, [0, 1], [0, -1500]);
  const translateSecond = useTransform(scrollProgress, [0, 1], [-1500, 0]);
  const translateThird = useTransform(scrollProgress, [0, 1], [0, -1500]);
  const translateFourth = useTransform(scrollProgress, [0, 1], [-1500, 0]);

  const fourth = Math.ceil(images.length / 4);

  const firstPart = images.slice(0, fourth);
  const secondPart = images.slice(fourth, 2 * fourth);
  const thirdPart = images.slice(2 * fourth, 3 * fourth);
  const fourthPart = images.slice(3 * fourth);

  // Duplicar las imágenes para crear un loop infinito
  const duplicatedFirst = [...firstPart, ...firstPart, ...firstPart];
  const duplicatedSecond = [...secondPart, ...secondPart, ...secondPart];
  const duplicatedThird = [...thirdPart, ...thirdPart, ...thirdPart];
  const duplicatedFourth = [...fourthPart, ...fourthPart, ...fourthPart];

  return (
    <div
      className={cn("h-[40rem] items-start overflow-hidden w-full pointer-events-none", className)}
      ref={gridRef}
    >
      <div
        className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start  max-w-5xl mx-auto gap-4 pt-0 pb-40 px-10")}
      >
        <div className="grid gap-6">
          {duplicatedFirst.map((el, idx) => (
            <motion.div
              style={{ y: translateFirst }} // Apply the translateY motion value here
              key={"grid-1" + idx}
            >
              <img
                src={el}
                className="w-full h-auto object-contain rounded-sm gap-6 !m-0 !p-0"
                alt="thumbnail"
              />
            </motion.div>
          ))}
        </div>
        <div className="grid gap-6">
          {duplicatedSecond.map((el, idx) => (
            <motion.div style={{ y: translateSecond }} key={"grid-2" + idx}>
              <img
                src={el}
                className="w-full h-auto object-contain rounded-sm gap-4 !m-0 !p-0"
                alt="thumbnail"
              />
            </motion.div>
          ))}
        </div>
        <div className="grid gap-6">
          {duplicatedThird.map((el, idx) => (
            <motion.div style={{ y: translateThird }} key={"grid-3" + idx}>
              <img
                src={el}
                className="w-full h-auto object-contain rounded-sm gap-4 !m-0 !p-0"
                alt="thumbnail"
              />
            </motion.div>
          ))}
        </div>
        <div className="grid gap-6">
          {duplicatedFourth.map((el, idx) => (
            <motion.div style={{ y: translateFourth }} key={"grid-4" + idx}>
              <img
                src={el}
                className="w-full h-auto object-contain rounded-sm gap-4 !m-0 !p-0"
                alt="thumbnail"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
