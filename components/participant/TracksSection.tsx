"use client";

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
    levelKey: "beginnerLevel",
    nameKey: "beginnerName",
    tagKey: "beginnerTag",
    descKey: "beginnerDesc",
    bulletKeys: [
      "beginnerBullet1",
      "beginnerBullet2",
      "beginnerBullet3",
    ] as const,
  },
] as const;

export function TracksSection() {
  const { t } = useLanguage();

  return (
    <section
      id="tracks"
      className="relative py-16 sm:py-24 md:py-32 overflow-hidden bg-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-blue)/8_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12 sm:mb-16 md:mb-20"
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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-1 max-w-2xl mx-auto gap-6 lg:gap-8"
        >
          {tracks.map((track) => (
            <motion.article
              key={track.id}
              variants={scaleUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className="relative rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 backdrop-blur-sm p-8 sm:p-10 flex flex-col shadow-lg shadow-black/20 overflow-hidden"
              style={{
                boxShadow: `0 0 0 1px ${track.accent}10 inset`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: track.accent }}
              />

              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: track.accent }}
              />

              <div className="relative flex items-center justify-between mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border"
                  style={{
                    borderColor: `${track.accent}40`,
                    background: `${track.accent}15`,
                    color: track.accent,
                  }}
                >
                  <track.icon size={28} />
                </div>
                <span
                  className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    borderColor: `${track.accent}40`,
                    color: track.accent,
                  }}
                >
                  {t("tracks", track.levelKey)}
                </span>
              </div>

              <h3 className="relative text-2xl sm:text-3xl font-bold text-white mb-2">
                {t("tracks", track.nameKey)}
              </h3>
              <p
                className="relative text-sm font-semibold mb-5 uppercase tracking-wide"
                style={{ color: track.accent }}
              >
                {t("tracks", track.tagKey)}
              </p>
              <p className="relative text-[var(--text-secondary)] leading-relaxed mb-8">
                {t("tracks", track.descKey)}
              </p>

              <ul className="relative space-y-3 mt-auto">
                {track.bulletKeys.map((bulletKey) => (
                  <li
                    key={bulletKey}
                    className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                  >
                    <IconCheckCircle
                      size={18}
                      className="shrink-0 mt-0.5"
                      style={{ color: track.accent }}
                    />
                    <span>{t("tracks", bulletKey)}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
