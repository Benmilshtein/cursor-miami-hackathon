'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { useTrack, type TrackId } from '@/lib/TrackContext';
import { SectionTag } from '@/components/ui';
import { staggerContainer, fadeUp, scaleUp, viewportOnce } from '@/lib/animations';

type RequirementItem = { icon: string; titleKey: string; descKey: string };

const requiredByTrack: Record<TrackId, RequirementItem[]> = {
  beginner: [
    { icon: 'deploy', titleKey: 'beginnerReq1', descKey: 'beginnerReq1Desc' },
    { icon: 'prototype', titleKey: 'beginnerReq2', descKey: 'beginnerReq2Desc' },
    { icon: 'file', titleKey: 'beginnerReq3', descKey: 'beginnerReq3Desc' },
    { icon: 'presentation', titleKey: 'beginnerReq4', descKey: 'beginnerReq4Desc' },
  ],
};

// Recommended items apply to both tracks
const recommendedItems: RequirementItem[] = [
  { icon: 'video', titleKey: 'rec1', descKey: 'rec1Desc' },
  { icon: 'deploy', titleKey: 'rec2', descKey: 'rec2Desc' },
];

const noteTextByTrack: Record<TrackId, string> = {
  beginner: 'beginnerNoteText',
};

const RequirementIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    github: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    file: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    presentation: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    prototype: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    video: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    deploy: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  };
  return icons[icon] || null;
};

export function Requirements() {
  const { t } = useLanguage();
  const { track } = useTrack();
  const requiredItems = requiredByTrack[track];

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      
      {/* Glow - Subtle */}
      <div
        className="absolute top-[30%] left-[-10%] w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-[var(--glow-purple)] rounded-full blur-[180px] animate-glow-pulse"
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
            <SectionTag color="purple">{t('requirements', 'tag')}</SectionTag>
          </motion.div>
          
          <motion.h2 
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-6 mb-4"
          >
            {t('requirements', 'title')}
          </motion.h2>
          
          <motion.p 
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t('requirements', 'subtitle')}
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Required */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div 
              variants={fadeUp}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
              <h3 className="text-xl font-semibold text-white">{t('requirements', 'required')}</h3>
            </motion.div>

            <div className="space-y-4">
              {requiredItems.map((item, index) => (
                <motion.div
                  key={item.titleKey}
                  variants={scaleUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  transition={{ delay: index * 0.06 }}
                  className="glass-card p-4 sm:p-5 flex items-start gap-4 group"
                  whileHover={{ x: 4, boxShadow: '0 10px 25px rgba(16, 214, 194, 0.08)' }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <RequirementIcon icon={item.icon} className="w-6 h-6 text-[var(--accent-green)]" />
                  </motion.div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('requirements', item.titleKey)}</h4>
                    <p className="text-[var(--text-muted)] text-sm">{t('requirements', item.descKey)}</p>
                  </div>
                  <motion.div 
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <svg className="w-5 h-5 text-[var(--accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recommended */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div 
              variants={fadeUp}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-3 h-3 rounded-full bg-[var(--accent-blue)]" />
              <h3 className="text-xl font-semibold text-white">{t('requirements', 'recommended')}</h3>
            </motion.div>

            <div className="space-y-4">
              {recommendedItems.map((item, index) => (
                <motion.div
                  key={item.titleKey}
                  variants={scaleUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  transition={{ delay: index * 0.06 }}
                  className="glass-card p-4 sm:p-5 flex items-start gap-4 group"
                  whileHover={{ x: 4, boxShadow: '0 10px 25px rgba(255, 45, 146, 0.08)' }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <RequirementIcon icon={item.icon} className="w-6 h-6 text-[var(--accent-blue)]" />
                  </motion.div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('requirements', item.titleKey)}</h4>
                    <p className="text-[var(--text-muted)] text-sm">{t('requirements', item.descKey)}</p>
                  </div>
                  <motion.div 
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Additional Note */}
            <motion.div 
              variants={fadeUp}
              className="mt-6 p-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-tertiary)]/50"
            >
              <p className="text-[var(--text-muted)] text-sm">
                <span className="text-[var(--accent-purple)] font-medium">{t('requirements', 'noteLabel')}</span>{' '}
                {t('requirements', noteTextByTrack[track])}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
