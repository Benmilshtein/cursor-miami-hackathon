"use client";

import React, { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import {
  SectionTag,
  IconDocument,
  IconCode,
  IconCamera,
  IconTrophy,
} from "@/components/ui";
import { fadeUp } from "@/lib/animations";

const stages = [
  {
    id: 1,
    icon: IconDocument,
    color: "var(--accent-blue)",
    dateKey: "stage1Date",
    titleKey: "stage1Title",
    descKey: "stage1Desc",
  },
  {
    id: 2,
    icon: IconCode,
    color: "var(--accent-purple)",
    dateKey: "stage2Date",
    titleKey: "stage2Title",
    descKey: "stage2Desc",
  },
  {
    id: 3,
    icon: IconCamera,
    color: "var(--accent-green)",
    dateKey: "stage3Date",
    titleKey: "stage3Title",
    descKey: "stage3Desc",
  },
  {
    id: 4,
    icon: IconTrophy,
    color: "var(--accent-blue)",
    dateKey: "stage4Date",
    titleKey: "stage4Title",
    descKey: "stage4Desc",
  },
];

export function SelectionProcess() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-secondary)]"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <SectionTag color="purple">
              {t("selectionProcess", "tag")}
            </SectionTag>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-8 mb-6">
              {t("selectionProcess", "title")}
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              {t("selectionProcess", "subtitle")}
            </p>
          </motion.div>
        </div>

        {/* Desktop Path Animation */}
        <div className="hidden lg:block relative mb-20">
          <svg className="absolute top-[60px] left-0 w-full h-[100px] pointer-events-none overflow-visible">
            <motion.path
              d="M 150 20 Q 400 20 600 20 T 1100 20"
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
            <motion.path
              d="M 150 20 Q 400 20 600 20 T 1100 20"
              fill="none"
              stroke="url(#gradient-line)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ pathLength: scrollYProgress }}
            />
            <defs>
              <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent-blue)" />
                <stop offset="50%" stopColor="var(--accent-purple)" />
                <stop offset="100%" stopColor="var(--accent-green)" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid grid-cols-4 gap-8">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative flex flex-col items-center"
              >
                {/* Icon Circle */}
                <div
                  className="w-32 h-32 rounded-full border-4 bg-[var(--bg-primary)] z-10 flex items-center justify-center mb-8 relative group"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at center, ${stage.color}40, transparent 70%)`,
                    }}
                  />
                  <stage.icon size={40} className="text-white relative z-10" />

                  {/* Number Badge */}
                  <div
                    className="absolute -top-2 -right-2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-white border-4 border-[var(--bg-primary)]"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.id}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center px-4">
                  <span
                    className="text-xs font-bold uppercase tracking-widest block mb-2"
                    style={{ color: stage.color }}
                  >
                    {t("selectionProcess", stage.dateKey)}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {t("selectionProcess", stage.titleKey)}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {t("selectionProcess", stage.descKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile View (keep simple vertical timeline) */}
        <div className="lg:hidden space-y-12">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-6"
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.id}
                </div>
                {index !== stages.length - 1 && (
                  <div className="w-1 h-full bg-[var(--border-color)] my-2 rounded-full" />
                )}
              </div>
              <div className="pb-8">
                <span
                  style={{ color: stage.color }}
                  className="text-xs font-bold uppercase tracking-wide"
                >
                  {t("selectionProcess", stage.dateKey)}
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  {t("selectionProcess", stage.titleKey)}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {t("selectionProcess", stage.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
