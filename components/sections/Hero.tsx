"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Logo, IconLaptop, IconBuilding } from "@/components/ui";

function MouseParallax({
  children,
  factor = 20,
  className,
}: {
  children: React.ReactNode;
  factor?: number;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPos = (e.clientX / innerWidth - 0.5) * factor;
      const yPos = (e.clientY / innerHeight - 0.5) * factor;
      x.set(xPos);
      y.set(yPos);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [factor, x, y]);

  return (
    <motion.div style={{ x: mouseX, y: mouseY }} className={className}>
      {children}
    </motion.div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Stagger effect for text
  const sentence = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        staggerChildren: 0.05,
      },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { cubicBezier: [0.6, 0.01, -0.05, 0.95], duration: 1 },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen sm:min-h-[110vh] flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[var(--accent-blue)]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[var(--accent-purple)]/5 rounded-full blur-[100px]" />
      </div>

      {/* Floating Elements (Parallax) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <MouseParallax factor={-30} className="absolute top-[20%] left-[10%]">
          <div className="p-4 bg-[var(--bg-secondary)]/30 backdrop-blur-md border border-[var(--border-color)]/50 rounded-2xl rotate-[-6deg]">
            <IconLaptop className="text-[var(--accent-blue)]" size={32} />
          </div>
        </MouseParallax>

        <MouseParallax
          factor={40}
          className="absolute bottom-[25%] right-[10%]"
        >
          <div className="p-4 bg-[var(--bg-secondary)]/30 backdrop-blur-md border border-[var(--border-color)]/50 rounded-2xl rotate-[6deg]">
            <IconBuilding className="text-[var(--accent-purple)]" size={32} />
          </div>
        </MouseParallax>
      </div>

      {/* Content */}
      <motion.div
        style={{ y: y1, opacity }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pt-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm mb-8"
        >
          <span className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-pulse" />
          <span className="text-[var(--text-secondary)] text-xs font-mono tracking-widest uppercase">
            {t("hero", "tag")}
          </span>
        </motion.div>

        {/* Main Title - Split Text */}
        <motion.h1
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter text-white mb-6 leading-[0.95]"
          variants={sentence}
          initial="hidden"
          animate="visible"
        >
          {t("hero", "title")
            .split(" ")
            .map((word: string, i: number) => (
              <span
                key={i}
                className="inline-block whitespace-nowrap mr-[0.2em]"
              >
                {word.split("").map((char: string, index: number) => (
                  <motion.span
                    key={index}
                    variants={letter}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent"
        >
          {t("hero", "subtitle")}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {t("hero", "description")}
        </motion.p>

      </motion.div>
      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-muted)] flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">
          {t("hero", "scroll")}
        </span>
        <motion.div
          className="w-[1px] h-12 bg-gradient-to-b from-[var(--text-muted)] to-transparent"
          animate={{ height: [48, 24, 48], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}
