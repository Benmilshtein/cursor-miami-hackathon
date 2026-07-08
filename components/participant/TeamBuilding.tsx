'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { SectionTag } from '@/components/ui';
import { staggerContainer, fadeUp, scaleUp, viewportOnce } from '@/lib/animations';

const teamSections = [
  {
    key: 'size',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    key: 'find',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'purple',
  },
  {
    key: 'discuss',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'green',
  },
];

export function TeamBuilding() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      
      {/* Glow effects */}
      <div
        className="absolute top-[-10%] right-[10%] w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-[var(--glow-purple)] rounded-full blur-[150px] animate-glow-pulse"
      />
      <div
        className="absolute bottom-[-15%] left-[5%] w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] bg-[var(--glow-blue)] rounded-full blur-[120px] animate-glow-pulse [animation-delay:1s]"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="purple">{t('teamBuilding', 'tag')}</SectionTag>
          </motion.div>
          
          <motion.h2 
            variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-6 mb-4"
          >
            {t('teamBuilding', 'title')}
          </motion.h2>
          
          <motion.p 
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t('teamBuilding', 'subtitle')}
          </motion.p>
        </motion.div>

        {/* Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {teamSections.map((section) => (
            <motion.div
              key={section.key}
              variants={scaleUp}
              className="relative glass-card p-6 sm:p-8 group"
              whileHover={{ 
                y: -4, 
                boxShadow: section.color === 'blue' 
                  ? '0 15px 35px rgba(255, 45, 146, 0.1)' 
                  : section.color === 'purple'
                    ? '0 15px 35px rgba(255, 107, 92, 0.1)'
                    : '0 15px 35px rgba(16, 214, 194, 0.1)'
              }}
            >
              {/* Accent bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl opacity-40 group-hover:opacity-70 transition-opacity ${
                  section.color === 'blue' ? 'bg-[var(--accent-blue)]' :
                  section.color === 'purple' ? 'bg-[var(--accent-purple)]' :
                  'bg-[var(--accent-green)]'
                }`}
              />
              
              {/* Icon */}
              <motion.div 
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${
                  section.color === 'blue' ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]' :
                  section.color === 'purple' ? 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]' :
                  'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                }`}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {section.icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3">
                {t('teamBuilding', `${section.key}Title`)}
              </h3>

              {/* Description */}
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {t('teamBuilding', `${section.key}Desc`)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tip card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="glass-card p-6 sm:p-8 border-l-4 border-[var(--accent-purple)]"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--accent-purple)]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--accent-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                {t('teamBuilding', 'tipTitle')}
              </h4>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {t('teamBuilding', 'tipDesc')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
