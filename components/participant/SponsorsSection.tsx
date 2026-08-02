"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { SectionTag } from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";

type Sponsor = {
  name: string;
  href: string;
  logoUrl: string;
  /** Extra classes for logos that need a bit more width or height. */
  className?: string;
};

const sponsors: Sponsor[] = [
  {
    name: "OKX",
    href: "https://www.okx.com",
    logoUrl: "/sponsors/okx.svg",
    className: "max-w-[140px]",
  },
  {
    name: "Quicknode",
    href: "https://www.quicknode.com",
    logoUrl: "/sponsors/quicknode.svg",
    className: "max-w-[180px]",
  },
  {
    name: "THE LAB MIAMI",
    href: "https://thelabmiami.com",
    logoUrl: "/sponsors/the-lab-miami.svg",
    className: "max-w-[160px]",
  },
  {
    name: "palma labs",
    href: "https://www.palmalabs.io",
    logoUrl: "/sponsors/palma-labs.svg",
    className: "max-w-[170px]",
  },
  {
    name: "Superteam USA",
    href: "https://us.superteam.fun",
    logoUrl: "/sponsors/superteam-usa.svg",
    className: "max-w-[200px]",
  },
];

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
      <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--border-color)_20%,var(--border-color)_80%,transparent_100%)] opacity-60" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="text-center mb-10 sm:mb-12"
        >
          <motion.div variants={fadeUp} className="mb-3">
            <SectionTag color="blue">{t("sponsors", "tag")}</SectionTag>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
          >
            {t("sponsors", "title")}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 items-center justify-items-center"
        >
          {sponsors.map((sponsor) => (
            <motion.a
              key={sponsor.name}
              variants={fadeUp}
              href={sponsor.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-full min-h-[64px] px-2"
              aria-label={sponsor.name}
            >
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className={`w-full h-auto object-contain opacity-85 group-hover:opacity-100 transition-opacity duration-200 ${sponsor.className ?? "max-w-[160px]"}`}
              />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
