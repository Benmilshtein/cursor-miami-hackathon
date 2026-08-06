"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import {
  SectionTag,
  IconRocket,
  IconCheckCircle,
} from "@/components/ui";
import {
  staggerContainer,
  fadeUp,
  scaleUp,
  viewportOnce,
} from "@/lib/animations";

const tracks = [
  {
    id: "beginner",
    icon: IconRocket,
    accent: "var(--accent-green)",
    nameKey: "beginnerName",
    tagKey: "beginnerTag",
    bulletKeys: [
      "beginnerBullet1",
      "beginnerBullet2",
      "beginnerBullet3",
    ] as const,
  },
] as const;

export function TracksSection() {
  const { t } = useLanguage();
  const track = tracks[0];
  const accent = track.accent;

  return (
    <section
      id="tracks"
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-blue)/8_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="blue">{t("tracks", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-6 mb-4"
          >
            {t("tracks", "title")}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t("tracks", "subtitle")}
          </motion.p>
        </motion.div>

        <motion.article
          variants={scaleUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm"
          style={{ boxShadow: `0 0 0 1px ${accent}12 inset` }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />
          <div
            className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: accent }}
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full opacity-15 blur-3xl"
            style={{ background: "var(--accent-blue)" }}
          />

          <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:p-10">
            {/* Copy */}
            <div className="order-2 lg:order-1 min-w-0">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${accent}40`,
                  background: `${accent}15`,
                  color: accent,
                }}
              >
                <track.icon size={24} />
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t("tracks", track.nameKey)}
              </h3>
              <p
                className="mt-2 text-sm font-semibold uppercase tracking-[0.14em]"
                style={{ color: accent }}
              >
                {t("tracks", track.tagKey)}
              </p>

              <ul className="mt-7 space-y-3.5">
                {track.bulletKeys.map((bulletKey) => (
                  <li
                    key={bulletKey}
                    className="flex items-start gap-3 text-sm sm:text-[15px] leading-relaxed text-[var(--text-secondary)]"
                  >
                    <IconCheckCircle
                      size={18}
                      className="shrink-0 mt-0.5"
                      style={{ color: accent }}
                    />
                    <span>{t("tracks", bulletKey)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prize check — organic photo treatment */}
            <figure className="order-1 lg:order-2 relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                className="absolute -inset-3 rounded-[1.75rem] opacity-40 blur-2xl"
                style={{
                  background: `radial-gradient(ellipse at 50% 40%, ${accent}55, transparent 70%)`,
                }}
              />
              <motion.div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]"
                style={{ rotate: "1.25deg" }}
                whileHover={{ rotate: 0, y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <Image
                  src="/superteam-usa-check.jpeg"
                  alt={t("tracks", "prizeAlt")}
                  width={680}
                  height={532}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 90vw, 480px"
                />
              </motion.div>
              <figcaption className="relative mt-4 text-center text-xs sm:text-sm text-[var(--text-muted)] tracking-wide">
                {t("tracks", "prizeCaption")}
              </figcaption>
            </figure>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
