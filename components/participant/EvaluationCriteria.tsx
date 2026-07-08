"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import {
  SectionTag,
  IconUsers,
  IconGavel,
  IconTarget,
  IconTrophy,
} from "@/components/ui";
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/animations";

type Phase = {
  id: string;
  num: number;
  accent: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  titleKey: string;
  durationKey: string;
  goalKey: string;
  bulletKeys: string[];
  ordered?: boolean;
};

/** Alpha-tint a CSS color (the accents are hex, so inline `${color}15` won't render). */
function tint(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

const phases: Phase[] = [
  {
    id: "round1",
    num: 1,
    accent: "var(--accent-blue)",
    icon: IconUsers,
    titleKey: "round1Title",
    durationKey: "round1Duration",
    goalKey: "round1Goal",
    bulletKeys: ["round1Bullet1", "round1Bullet2", "round1Bullet3", "round1Bullet4"],
  },
  {
    id: "round2",
    num: 2,
    accent: "var(--accent-purple)",
    icon: IconGavel,
    titleKey: "round2Title",
    durationKey: "round2Duration",
    goalKey: "round2Goal",
    bulletKeys: ["round2Bullet1", "round2Bullet2", "round2Bullet3"],
  },
  {
    id: "tiebreak",
    num: 3,
    accent: "var(--accent-green)",
    icon: IconTarget,
    titleKey: "tieTitle",
    durationKey: "tieTag",
    goalKey: "tieGoal",
    bulletKeys: ["tieBullet1", "tieBullet2", "tieBullet3"],
    ordered: true,
  },
];

function PhaseRow({
  phase,
  index,
  isLast,
  t,
}: {
  phase: Phase;
  index: number;
  isLast: boolean;
  t: (section: TranslationKey, key: string) => string;
}) {
  const Icon = phase.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-4 sm:gap-6"
    >
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-black tabular-nums"
          style={{
            borderColor: tint(phase.accent, 45),
            backgroundColor: tint(phase.accent, 15),
            color: phase.accent,
          }}
        >
          {phase.num}
        </div>
        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-[var(--border-color)]" />
        )}
      </div>

      {/* Content card */}
      <div className="glass-card mb-6 flex-1 p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{
              borderColor: tint(phase.accent, 35),
              backgroundColor: tint(phase.accent, 12),
              color: phase.accent,
            }}
          >
            <Icon size={18} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {t("criteria", phase.titleKey)}
          </h3>
          <span
            className="rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: tint(phase.accent, 35), color: phase.accent }}
          >
            {t("criteria", phase.durationKey)}
          </span>
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {t("criteria", phase.goalKey)}
        </p>

        <ul className="space-y-2.5">
          {phase.bulletKeys.map((bulletKey, i) => (
            <li
              key={bulletKey}
              className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums"
                style={{
                  backgroundColor: phase.ordered ? tint(phase.accent, 20) : "transparent",
                  color: phase.accent,
                }}
              >
                {phase.ordered ? i + 1 : "•"}
              </span>
              <span>{t("criteria", bulletKey)}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function EvaluationCriteria() {
  const { t } = useLanguage();

  return (
    <section
      id="criteria"
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="blue">{t("criteria", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-8 mb-6"
          >
            {t("criteria", "title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t("criteria", "subtitle")}
          </motion.p>
        </motion.div>

        <div>
          {phases.map((phase, index) => (
            <PhaseRow
              key={phase.id}
              phase={phase}
              index={index}
              isLast={index === phases.length - 1}
              t={t}
            />
          ))}
        </div>

        {/* Live Leaderboard Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ delay: 0.1 }}
          className="relative mt-4 overflow-hidden rounded-3xl border border-[var(--accent-green)]/40 bg-[var(--bg-secondary)] p-6 sm:p-8"
        >
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[var(--accent-green)]/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent-green)]/40 bg-[var(--accent-green)]/12 text-[var(--accent-green)]">
                <IconTrophy size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {t("criteria", "leaderboardTitle")}
              </h3>
            </div>
            <blockquote className="border-l-2 border-[var(--accent-green)]/50 pl-4 text-base sm:text-lg italic text-[var(--text-secondary)]">
              {t("criteria", "leaderboardQuote")}
            </blockquote>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("criteria", "leaderboardNote")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
