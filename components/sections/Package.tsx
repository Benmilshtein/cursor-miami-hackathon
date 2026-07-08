'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, IconCheck, IconCrown } from '@/components/ui';
import { fadeUp, fadeInLeft, fadeInRight, staggerContainer, viewportOnce } from '@/lib/animations';

export function Package() {
  const { t } = useLanguage();

  const items = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6'];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="purple" position={{ top: '-30%', right: '-10%' }} />
      <GlowEffect color="blue" position={{ bottom: '-30%', left: '-10%' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div 
            className="lg:w-2/5"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInLeft}>
              <SectionTag color="purple" className="mb-4">
                {t('package', 'tag')}
              </SectionTag>
            </motion.div>
            <motion.div className="mb-6" variants={fadeInLeft}>
              <motion.span 
                className="text-3xl md:text-4xl font-extrabold text-white/20 block mb-2" 
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.8)' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                {t('package', 'preTitle')}
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white">
                {t('package', 'title')}
              </h2>
            </motion.div>
            <motion.p 
              className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8"
              variants={fadeInLeft}
            >
              {t('package', 'description')}
            </motion.p>
            <motion.div 
              className="inline-flex items-center gap-3 bg-rose-500/15 border border-rose-500/30 px-5 py-3 min-h-[44px] rounded-full"
              variants={fadeInLeft}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255, 107, 92, 0.12)' }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <IconCrown size={20} className="text-[var(--accent-purple)]" />
              </motion.div>
              <span className="text-[#c4b5fd] font-semibold text-sm uppercase tracking-wider">
                {t('package', 'badge')}
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column: Checklist */}
          <motion.div 
            className="flex-1 w-full"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInRight}
          >
            <motion.div 
              className="glass-card p-4 sm:p-6 md:p-8 lg:p-10 border-rose-500/20 shadow-xl shadow-rose-500/5 relative overflow-hidden"
              whileHover={{ boxShadow: '0 20px 40px rgba(255, 107, 92, 0.08)' }}
            >
              {/* Animated glow - Subtle */}
              <motion.div 
                className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--glow-purple)] rounded-full blur-[100px] opacity-[0.08]"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.06, 0.1, 0.06]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <motion.div 
                className="space-y-5"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {items.map((key, index) => (
                  <motion.div 
                    key={key}
                    className="flex items-center gap-4 sm:gap-5 p-3 sm:p-4 min-h-[48px] bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-color)]"
                    variants={fadeUp}
                    whileHover={{ 
                      x: 10, 
                      backgroundColor: 'rgba(255, 107, 92, 0.08)',
                      borderColor: 'var(--border-hover)',
                      transition: { duration: 0.2 }
                    }}
                  >
                    <motion.div 
                      className="check-circle"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 200, 
                        delay: index * 0.1 
                      }}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                    >
                      <IconCheck size={16} />
                    </motion.div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-white">
                        {t('package', key)}
                      </p>
                      <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        {t('package', `${key}Sub`)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
