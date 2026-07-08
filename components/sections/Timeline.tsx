"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import {
  GlowEffect,
  SectionTag,
  Card,
  IconCalendar,
  IconTimer,
  IconTrophy,
  IconSend,
  IconMail,
  IconPhone,
} from "@/components/ui";
import {
  fadeUp,
  fadeInLeft,
  fadeInRight,
  staggerContainer,
  viewportOnce,
  timelineDotPulse,
} from "@/lib/animations";

export function Timeline() {
  const { t } = useLanguage();

  const events = [
    {
      icon: IconCalendar,
      dateKey: "event1Date",
      titleKey: "event1Title",
      descKey: "event1Desc",
      color: "blue" as const,
    },
    {
      icon: IconTimer,
      dateKey: "event2Date",
      titleKey: "event2Title",
      descKey: "event2Desc",
      color: "blue" as const,
    },
    {
      icon: IconTrophy,
      dateKey: "event3Date",
      titleKey: "event3Title",
      descKey: "event3Desc",
      color: "purple" as const,
      accent: true,
    },
  ];

  const contacts = [
    { icon: IconSend, label: "telegram", value: "@example" },
    { icon: IconMail, label: "email", value: "example@gmail.com" },
    { icon: IconPhone, label: "phone", value: "+1 (00) 000-00-00" },
  ];

  return (
    <section id="contacts" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="blue" position={{ top: "-30%", right: "-10%" }} />
      <GlowEffect color="purple" position={{ bottom: "-30%", left: "-10%" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="blue" className="mb-4">
              {t("timeline", "tag")}
            </SectionTag>
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-extrabold text-white"
            variants={fadeUp}
          >
            {t("timeline", "title")}
          </motion.h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Timeline */}
          <motion.div
            className="flex-1"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <div className="relative pl-6 sm:pl-8">
              {/* Animated Timeline Line */}
              <motion.div
                className="absolute left-0 top-3 w-0.5 bg-[#262626]"
                initial={{ height: 0 }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
              />

              <motion.div className="space-y-10" variants={staggerContainer}>
                {events.map(
                  (
                    { icon: Icon, dateKey, titleKey, descKey, color, accent },
                    index,
                  ) => (
                    <motion.div
                      key={titleKey}
                      className="relative flex items-start gap-5"
                      variants={fadeInLeft}
                    >
                      {/* Animated Timeline Dot */}
                      <motion.div
                        className={`absolute -left-[29px] sm:-left-[33px] top-1 w-3 h-3 rounded-full bg-[#0a0a0a] border-2 ${accent ? "border-[#a855f7]" : "border-[#3b82f6]"} z-10`}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: index * 0.2,
                        }}
                      >
                        <motion.div
                          className={`absolute inset-0 rounded-full ${accent ? "bg-[#a855f7]" : "bg-[#3b82f6]"}`}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                          }}
                        />
                      </motion.div>

                      <motion.div
                        className={`icon-box icon-box-${color}`}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Icon size={20} />
                      </motion.div>
                      <div>
                        <span className="text-sm text-[#666666] uppercase tracking-wider block mb-1">
                          {t("timeline", dateKey)}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                          {t("timeline", titleKey)}
                        </h3>
                        <p className="text-[#a1a1a1] leading-relaxed">
                          {t("timeline", descKey)}
                        </p>
                      </div>
                    </motion.div>
                  ),
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            className="w-full lg:w-96 lg:max-w-[450px]"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInRight}
          >
            <motion.div
              whileHover={{
                scale: 1.02,
                boxShadow: "0 30px 60px rgba(168, 85, 247, 0.15)",
              }}
            >
              <Card
                className="border-purple-500/30 shadow-xl shadow-purple-500/5 relative overflow-hidden"
                padding="lg"
              >
                {/* Animated Glow */}
                <motion.div
                  className="absolute -top-12 -right-12 w-48 h-48 bg-[#a855f7] rounded-full filter blur-[80px] opacity-[0.15] pointer-events-none"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.35, 0.2],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Flexibility Note */}
                <motion.div
                  className="bg-blue-500/10 p-4 rounded-r-lg mb-6"
                  style={{ borderLeftWidth: "3px", borderLeftColor: "#3b82f6" }}
                  whileHover={{ x: 5 }}
                >
                  <p className="text-sm text-sky-100">
                    <strong className="text-white">
                      {t("timeline", "flexNote")}
                    </strong>{" "}
                    {t("timeline", "flexDesc")}
                  </p>
                </motion.div>

                {/* CTA Title */}
                <motion.h3
                  className="text-2xl font-bold text-white mb-6 leading-snug"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {t("timeline", "ctaTitle")}
                </motion.h3>

                {/* Contact List */}
                <motion.div
                  className="space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {contacts.map(({ icon: Icon, label, value }, index) => (
                    <motion.div
                      key={label}
                      className="flex items-center gap-4 p-4 min-h-[48px] bg-[#141414]/60 rounded-xl border border-[#262626] cursor-pointer"
                      variants={fadeUp}
                      whileHover={{
                        x: 10,
                        backgroundColor: "rgba(168, 85, 247, 0.08)",
                        borderColor: "#404040",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        whileHover={{ rotate: [0, -15, 15, 0] }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <Icon size={24} className="text-[#a855f7]" />
                      </motion.div>
                      <div>
                        <span className="text-xs text-[#666666] block">
                          {t("timeline", label)}
                        </span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Corner Dots */}
                <div className="absolute bottom-5 right-5 flex gap-1">
                  <motion.div
                    className="w-1 h-1 bg-[#3b82f6] rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div className="w-1 h-1 bg-[#666666] rounded-full" />
                  <div className="w-1 h-1 bg-[#666666] rounded-full" />
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
