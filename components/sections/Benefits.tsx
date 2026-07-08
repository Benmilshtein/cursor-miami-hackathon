"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import {
  SectionTag,
  SpotlightCard,
  IconBox,
  IconEye,
  IconUsers,
  IconLayers,
  IconMegaphone,
  IconRocket,
  IconZap,
} from "@/components/ui";
import {
  fadeUp,
  fadeInLeft,
  staggerContainer,
  popIn,
  viewportOnce,
} from "@/lib/animations";

export function Benefits() {
  const { t } = useLanguage();

  const benefits = [
    { icon: IconEye, key: "benefit1", color: "var(--accent-blue)" },
    { icon: IconUsers, key: "benefit2", color: "var(--accent-purple)" },
    { icon: IconLayers, key: "benefit3", color: "var(--accent-green)" },
    { icon: IconMegaphone, key: "benefit4", color: "var(--accent-purple)" },
    { icon: IconRocket, key: "benefit5", color: "var(--accent-blue)" },
  ];

  return (
    <section
      id="partners"
      className="relative py-24 lg:py-32 overflow-hidden bg-[var(--bg-secondary)]"
    >
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Glow Effects */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[var(--glow-blue)] rounded-full blur-[200px] opacity-[0.03]"
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left Column */}
          <motion.div
            className="lg:w-2/5"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInLeft}>
              <SectionTag color="blue" className="mb-4">
                {t("benefits", "tag")}
              </SectionTag>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-extrabold text-white mb-10"
              variants={fadeInLeft}
            >
              {t("benefits", "title")}
            </motion.h2>

            {/* Formula Block - Enhanced */}
            <motion.div
              className="relative overflow-hidden p-1 rounded-3xl bg-gradient-to-br from-[var(--border-color)] to-transparent"
              variants={popIn}
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-[var(--bg-primary)] p-8 rounded-[22px] relative z-10 h-full">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest block mb-6">
                  {t("benefits", "formulaLabel")}
                </span>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl sm:text-4xl font-black mb-8 leading-none">
                  <motion.span
                    className="text-[var(--accent-blue)]"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    HR
                  </motion.span>
                  <span className="text-[var(--text-muted)] opacity-50 text-2xl">
                    +
                  </span>
                  <motion.span
                    className="text-[var(--accent-purple)]"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
                  >
                    PR
                  </motion.span>
                  <span className="text-[var(--text-muted)] opacity-50 text-2xl">
                    +
                  </span>
                  <motion.span
                    className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-green)] to-teal-300"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, delay: 1, repeat: Infinity }}
                  >
                    Tech
                  </motion.span>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] flex items-center gap-4">
                  <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <IconZap
                        size={20}
                        className="text-[var(--accent-green)]"
                      />
                    </motion.div>
                  </div>
                  <span className="text-white font-bold text-lg tracking-tight">
                    {t("benefits", "formulaResult")}
                  </span>
                </div>
              </div>

              {/* Animated Border Glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ width: "50%" }}
              />
            </motion.div>
          </motion.div>

          {/* Right Column: Benefits List with Spotlight */}
          <motion.div
            className="flex-1 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {benefits.map(({ icon: Icon, key, color }) => (
              <motion.div key={key} variants={fadeUp}>
                <SpotlightCard
                  className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 cursor-pointer bg-[var(--bg-primary)] border-[var(--border-color)]"
                  spotlightColor={color}
                >
                  <div className="relative group/icon">
                    <div className="absolute inset-0 bg-white/20 blur-md rounded-full opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                    <IconBox
                      color={
                        color.includes("blue")
                          ? "blue"
                          : color.includes("purple")
                            ? "purple"
                            : "green"
                      }
                      size="lg"
                    >
                      <Icon size={24} />
                    </IconBox>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--accent-blue)] transition-colors">
                      {t("benefits", `${key}Title`)}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {t("benefits", `${key}Desc`)}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
