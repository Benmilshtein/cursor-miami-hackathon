'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconCode, IconEye, IconUsers } from '@/components/ui';
import { fadeUp, fadeInLeft, fadeInRight, staggerContainer, staggerContainerFast, viewportOnce } from '@/lib/animations';

export function Audience() {
  const { t } = useLanguage();

  const participants = ['participant1', 'participant2', 'participant3', 'participant4'];
  const viewers = ['viewer1', 'viewer2', 'viewer3', 'viewer4'];

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
  };

  return (
    <section id="audience" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="blue" position={{ top: '20%', left: '-10%' }} size="md" />
      <GlowEffect color="purple" position={{ bottom: '20%', right: '-10%' }} size="md" />

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
              {t('audience', 'tag')}
            </SectionTag>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-extrabold text-white"
            variants={fadeUp}
          >
            {t('audience', 'title')}
          </motion.h2>
        </motion.div>

        {/* Two Columns */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {/* Participants Column */}
          <motion.div 
            className="glass-card p-8 relative overflow-hidden"
            variants={fadeInLeft}
            whileHover={{ y: -5 }}
          >
            <motion.div 
              className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-blue)] opacity-60"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            />
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border-color)]">
              <motion.div 
                className="icon-box icon-box-blue"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <IconCode size={24} />
              </motion.div>
              <h3 className="text-2xl font-bold text-white">
                {t('audience', 'participantsTitle')}
              </h3>
            </div>
            <motion.div 
              className="space-y-4"
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {participants.map((key, index) => (
                <motion.div 
                  key={key} 
                  className="flex items-center gap-3 bg-[var(--bg-secondary)]/60 p-3 rounded-lg border border-[var(--border-color)]"
                  variants={listItemVariants}
                  whileHover={{ x: 10, backgroundColor: 'rgba(255, 45, 146, 0.08)' }}
                >
                  <motion.div 
                    className="list-dot bg-[var(--accent-blue)]"
                    whileHover={{ scale: 1.5 }}
                  />
                  <span className="text-[var(--text-secondary)] font-medium">
                    {t('audience', key)}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Viewers Column */}
          <motion.div 
            className="glass-card p-8 relative overflow-hidden"
            variants={fadeInRight}
            whileHover={{ y: -5 }}
          >
            <motion.div 
              className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-purple)] opacity-60"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border-color)]">
              <motion.div 
                className="icon-box icon-box-purple"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <IconEye size={24} />
              </motion.div>
              <h3 className="text-2xl font-bold text-white">
                {t('audience', 'viewersTitle')}
              </h3>
            </div>
            <motion.div 
              className="space-y-4"
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {viewers.map((key) => (
                <motion.div 
                  key={key} 
                  className="flex items-center gap-3 bg-[var(--bg-secondary)]/60 p-3 rounded-lg border border-[var(--border-color)]"
                  variants={listItemVariants}
                  whileHover={{ x: 10, backgroundColor: 'rgba(255, 107, 92, 0.08)' }}
                >
<motion.div 
              className="list-dot bg-[var(--accent-purple)]"
                    whileHover={{ scale: 1.5 }}
                  />
                  <span className="text-[var(--text-secondary)] font-medium">
                    {t('audience', key)}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div 
          className="bg-[var(--bg-tertiary)]/80 border-l-4 border-[var(--accent-purple)] p-5 rounded-r-xl flex items-center gap-5"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ x: 10, borderLeftWidth: 8 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <IconUsers size={24} className="text-[var(--accent-purple)] flex-shrink-0" />
          </motion.div>
          <p className="text-[var(--text-secondary)]">
            <span className="text-white font-semibold">{t('audience', 'note')}</span>
            {' '}{t('audience', 'noteDesc')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
