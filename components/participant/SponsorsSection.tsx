"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag } from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";

type Sponsor = {
  name: string;
  href: string;
  /** Optional logo path under /public. Falls back to a text mark when unset. */
  logoUrl?: string;
};

/** Replace with your real sponsor(s). */
const leadingPartner: Sponsor = {
  name: "Your Sponsor",
  href: "#",
};

export function SponsorsSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative py-14 sm:py-20 overflow-hidden bg-[var(--bg-primary)]"
      aria-label={t("sponsors", "sectionLabel")}
    >
      {/* Top edge: thin gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--border-color)_20%,var(--border-color)_80%,transparent_100%)] opacity-60" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionTag color="blue">{t("sponsors", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums"
          >
            {t("sponsors", "title")}
          </motion.h2>
        </motion.div>

        {/* Leading Partner - hero tier */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--text-muted)] mb-5 text-center"
          >
            {t("sponsors", "leadingPartnerLabel")}
          </motion.p>
          <motion.div variants={fadeUp} className="flex justify-center">
            <a
              href={leadingPartner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 group"
            >
              {leadingPartner.logoUrl ? (
                <img
                  src={leadingPartner.logoUrl}
                  alt={leadingPartner.name}
                  style={{ maxWidth: "280px", width: "100%", height: "auto" }}
                  className="object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
                />
              ) : (
                <span className="text-2xl font-bold tracking-wide text-white/80 group-hover:text-white transition-colors duration-200">
                  {leadingPartner.name}
                </span>
              )}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
