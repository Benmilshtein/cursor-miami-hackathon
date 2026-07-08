'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { SectionTag, Logo } from '@/components/ui';
import { staggerContainer, fadeUp, scaleUp, viewportOnce } from '@/lib/animations';

const allowedTools = [
  { labelKey: 'tool1' },
  { labelKey: 'tool2' },
  { labelKey: 'tool3' },
  { labelKey: 'tool4' },
];

const forbiddenItems = [
  { labelKey: 'forbidden1' },
  { labelKey: 'forbidden2' },
];

const logisticsItems = [
  { icon: 'food', titleKey: 'logistics1', descKey: 'logistics1Desc' },
  { icon: 'wifi', titleKey: 'logistics2', descKey: 'logistics2Desc' },
  { icon: 'travel', titleKey: 'logistics3', descKey: 'logistics3Desc' },
];

const LogisticsIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    food: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    wifi: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    travel: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[icon] || null;
};

export function TechStack() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-secondary)]" />
      <div className="grid-pattern absolute inset-0 opacity-50" />
      
      {/* Glow - Subtle */}
      <div
        className="absolute top-[-10%] right-[20%] w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] bg-[var(--accent-green)] rounded-full blur-[200px] animate-glow-pulse"
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
            <SectionTag color="green">{t('techStack', 'tag')}</SectionTag>
          </motion.div>
          
          <motion.h2 
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-6 mb-4"
          >
            {t('techStack', 'title')}
          </motion.h2>
          
          <motion.p 
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t('techStack', 'subtitle')}
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Required Tool - Cursor */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="glass-card p-4 sm:p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-blue)]" />
              <h3 className="text-xl font-semibold text-white">{t('techStack', 'requiredTool')}</h3>
            </div>

            <motion.div 
              className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--accent-blue)]/30"
              whileHover={{ scale: 1.02, borderColor: 'var(--accent-blue)' }}
            >
              <motion.div
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Logo size={40} className="sm:hidden" />
                <Logo size={56} className="hidden sm:block" />
              </motion.div>
              <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-1">Cursor</h4>
                <p className="text-[var(--text-secondary)]">{t('techStack', 'cursorDesc')}</p>
              </div>
            </motion.div>

            {/* Allowed Tools */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
                {t('techStack', 'allowed')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {allowedTools.map((tool) => (
                  <motion.span
                    key={tool.labelKey}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]"
                    whileHover={{ borderColor: 'var(--accent-green)', color: 'var(--text-primary)' }}
                  >
                    {t('techStack', tool.labelKey)}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Forbidden */}
            <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
              <h4 className="text-sm font-medium text-red-400 uppercase tracking-wider mb-4">
                {t('techStack', 'forbidden')}
              </h4>
              <div className="space-y-2">
                {forbiddenItems.map((item) => (
                  <div key={item.labelKey} className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{t('techStack', item.labelKey)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Logistics */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="glass-card p-4 sm:p-6 md:p-8"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)]" />
              <h3 className="text-xl font-semibold text-white">{t('techStack', 'logistics')}</h3>
            </motion.div>

            <div className="space-y-6">
              {logisticsItems.map((item) => (
                <motion.div
                  key={item.titleKey}
                  variants={scaleUp}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple)]/10 flex items-center justify-center flex-shrink-0">
                    <LogisticsIcon icon={item.icon} className="w-6 h-6 text-[var(--accent-purple)]" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('techStack', item.titleKey)}</h4>
                    <p className="text-[var(--text-muted)] text-sm">{t('techStack', item.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center glass-card p-8 sm:p-12"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t('techStack', 'ctaTitle')}
          </h3>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            {t('techStack', 'ctaDesc')}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 bg-[var(--accent-blue)] px-6 py-4 sm:px-8 rounded-xl text-base sm:text-lg font-semibold min-h-[48px] text-white hover:bg-[var(--accent-blue)]/90 transition-colors"
          >
            {t('nav', 'register')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
