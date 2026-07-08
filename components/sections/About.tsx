'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconBox, IconTimer, IconChip, IconUsers, IconMicrophone } from '@/components/ui';
import { fadeUp, fadeInLeft, fadeInRight, staggerContainer, popIn, viewportOnce, counterVariants } from '@/lib/animations';

export function About() {
  const { t } = useLanguage();

  const features = [
    { icon: IconTimer, key: 'feature1', color: 'blue' as const },
    { icon: IconChip, key: 'feature2', color: 'blue' as const },
    { icon: IconUsers, key: 'feature3', color: 'blue' as const },
    { icon: IconMicrophone, key: 'feature4', color: 'blue' as const },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="blue" position={{ top: '-20%', right: '-10%' }} size="md" />
      <GlowEffect color="purple" position={{ bottom: '-20%', left: '-10%' }} size="md" />

      {/* Decoration Circle */}
      <motion.div 
        className="absolute top-1/2 -left-36 w-72 h-72 border border-[#262626] rounded-full hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left Column: Features */}
          <motion.div 
            className="flex-1"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInLeft}>
              <SectionTag color="blue" className="mb-4">
                {t('about', 'tag')}
              </SectionTag>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold text-white mb-10"
              variants={fadeInLeft}
            >
              {t('about', 'title')}
            </motion.h2>

            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
            >
              {features.map(({ icon: Icon, key, color }, index) => (
                <motion.div 
                  key={key} 
                  className="flex items-start gap-5"
                  variants={fadeUp}
                  whileHover={{ x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconBox color={color}>
                      <Icon size={20} />
                    </IconBox>
                  </motion.div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      {t('about', `${key}Title`)}
                    </h4>
                    <p className="text-[#a1a1a1] leading-relaxed">
                      {t('about', `${key}Desc`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Stats */}
          <motion.div 
            className="w-full lg:w-96 lg:max-w-[400px] space-y-4 sm:space-y-5"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Large Card */}
              <motion.div
                className="col-span-2"
                variants={popIn}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="flex flex-row items-center justify-between" padding="lg">
                  <motion.div 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--accent-purple)]"
                    variants={counterVariants}
                  >
                    {t('about', 'stat1Value')}
                    <span className="text-2xl align-super">{t('about', 'stat1Unit')}</span>
                  </motion.div>
                  <p className="text-base text-[#a1a1a1] text-right leading-tight">
                    {t('about', 'stat1Label')}
                  </p>
                </Card>
              </motion.div>

              {/* Small Cards */}
              <motion.div variants={popIn} whileHover={{ scale: 1.05, y: -5 }}>
                <Card padding="md">
                  <motion.div 
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--accent-blue)] mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  >
                    {t('about', 'stat2Value')}
                  </motion.div>
                  <p className="text-sm text-[#a1a1a1] leading-tight">
                    {t('about', 'stat2Label')}
                  </p>
                </Card>
              </motion.div>

              <motion.div variants={popIn} whileHover={{ scale: 1.05, y: -5 }}>
                <Card padding="md">
                  <motion.div 
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--accent-blue)] mb-2"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
                  >
                    {t('about', 'stat3Value')}
                  </motion.div>
                  <p className="text-sm text-[#a1a1a1] leading-tight">
                    {t('about', 'stat3Label')}
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* Goal Box */}
            <motion.div 
              className="bg-[#1a1a1a]/80 border-l-4 border-[#a855f7] p-5 rounded-r-xl"
              variants={fadeInRight}
              whileHover={{ x: 5, borderLeftWidth: 6 }}
            >
              <span className="text-[var(--accent-purple)] font-bold text-xs uppercase tracking-wider block mb-2">
                {t('about', 'goalLabel')}
              </span>
              <p className="text-[#a1a1a1] leading-relaxed italic">
                {t('about', 'goalText')}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
