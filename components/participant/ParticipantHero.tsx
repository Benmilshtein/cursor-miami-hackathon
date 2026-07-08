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
import Link from "next/link";
import { Logo, CodeTypingBackground } from "@/components/ui";

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

export function ParticipantHero() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const y1 = useTransform(scrollY, [0, 600], [0, 80]);
  const y2 = useTransform(scrollY, [0, 600], [0, -60]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Stagger effect for text
  const sentence = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        staggerChildren: 0.03,
      },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ease: [0.25, 0.4, 0.25, 1] as const, duration: 0.5 },
    },
  };

  return (
    <section
      id="register"
      ref={containerRef}
      className="relative min-h-screen sm:min-h-[110vh] flex items-center justify-center overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[var(--accent-blue)]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[var(--accent-purple)]/5 rounded-full blur-[100px]" />

        {/* Grid currently commented out to test "cleaner" look with just noise */}
        {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" /> */}

        {/* Code Typing Animation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen pointer-events-none overflow-hidden">
          <div className="w-full h-full sm:w-[120%] sm:h-[120%] absolute -rotate-6 sm:scale-110">
            <CodeTypingBackground className="text-xs sm:text-sm text-[var(--accent-blue)]/20" />
          </div>
        </div>
      </div>

      {/* Floating Elements (Parallax) - Hidden on mobile to prevent overlap */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <MouseParallax factor={-30} className="absolute top-[15%] left-[10%]">
          <div className="p-4 bg-[var(--bg-secondary)]/30 backdrop-blur-md border border-[var(--border-color)]/50 rounded-2xl rotate-[-6deg]">
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ff2d92] via-[#ff6b5c] to-[#10d6c2]">
              4H
            </span>
          </div>
        </MouseParallax>

        <MouseParallax factor={40} className="absolute bottom-[20%] left-[5%]">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)]/30 backdrop-blur-md border border-[var(--border-color)]/50 rounded-full">
            <div className="w-2 h-2 bg-[var(--accent-cyan)] rounded-full animate-pulse" />
            <span className="text-sm font-mono text-[var(--text-muted)]">
              SYSTEM_READY
            </span>
          </div>
        </MouseParallax>

        <MouseParallax factor={-50} className="absolute top-[25%] right-[8%]">
          <div className="flex flex-col gap-1 p-3 bg-[var(--bg-secondary)]/30 backdrop-blur-md border border-[var(--border-color)]/50 rounded-xl rotate-[12deg]">
            <div className="w-24 h-2 bg-[var(--border-color)]/30 rounded-full" />
            <div className="w-16 h-2 bg-[var(--border-color)]/30 rounded-full" />
            <div className="w-20 h-2 bg-[var(--border-color)]/30 rounded-full" />
          </div>
        </MouseParallax>
      </div>

      {/* Content */}
      <motion.div
        style={{ y: y1, opacity }}
        className="relative z-10 text-center px-4 max-w-7xl mx-auto flex flex-col items-center"
      >
        {/* Logo Mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <Logo size={60} />
        </motion.div>

        {/* Date Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm mb-8"
        >
          <span className="text-[var(--accent-green)] text-xs font-mono tracking-widest uppercase">
            {t("participantHero", "date")}
          </span>
          <span className="w-1 h-1 bg-[var(--text-muted)] rounded-full" />
          <span className="text-[var(--text-muted)] text-xs font-mono uppercase">
            {t("participantHero", "location")}
          </span>
        </motion.div>

        {/* Main Title - Split Text */}
        <motion.h1
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-6 leading-[0.9]"
          variants={sentence}
          initial="hidden"
          animate="visible"
        >
          {t("participantHero", "title")
            .split("")
            .map((char: string, index: number) =>
              char === " " ? (
                <br key={index} />
              ) : (
                <motion.span
                  key={index}
                  variants={letter}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              )
            )}
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-[#ff2d92] via-[#ff6b5c] to-[#10d6c2] bg-clip-text text-transparent"
        >
          {t("participantHero", "subtitle")}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {t("participantHero", "description")}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link
            href="/register"
            className="relative px-6 py-4 sm:px-8 rounded-full min-h-[48px] flex items-center justify-center bg-[var(--accent-blue)] text-white font-bold text-base sm:text-lg text-center max-w-md hover:bg-[var(--accent-blue)]/90 transition-colors"
          >
            {t("nav", "register")}
          </Link>

          <div className="text-sm text-[var(--text-muted)] font-mono">
            {t("participantHero", "teams")} / {t("participantHero", "prize")}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ y: y2 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-muted)] flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--text-muted)] to-transparent" />
      </motion.div>
    </section>
  );
}
