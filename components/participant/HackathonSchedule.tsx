'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { SectionTag } from '@/components/ui';
import { staggerContainer, fadeUp, viewportOnce } from '@/lib/animations';

type ScheduleItem = {
  time: string;
  titleKey: string;
  descKey?: string;
  highlight?: boolean;
};

type DaySchedule = {
  dayKey: string;
  labelKey: string;
  items: ScheduleItem[];
};

const scheduleData: DaySchedule[] = [
  {
    dayKey: 'day1',
    labelKey: 'day1Label',
    items: [
      { time: '4:00 – 6:00pm', titleKey: 'block1', descKey: 'block1Desc' },
      { time: '6:00 – 10:30pm', titleKey: 'block2', descKey: 'block2Desc', highlight: true },
      { time: '10:30 – 11:00pm', titleKey: 'block3', descKey: 'block3Desc', highlight: true },
      { time: '11:00 – 12:00am', titleKey: 'block4', descKey: 'block4Desc' },
    ],
  },
];

export function HackathonSchedule() {
  const { t } = useLanguage();
  const [activeDay, setActiveDay] = useState(0);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      
      {/* Glow effects - Subtle */}
      <div
        className="absolute top-[20%] right-[-10%] w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] bg-[var(--accent-green)] rounded-full blur-[200px] animate-glow-pulse"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp}>
            <SectionTag color="green">{t('schedule', 'tag')}</SectionTag>
          </motion.div>
          
          <motion.h2 
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mt-6 mb-4"
          >
            {t('schedule', 'title')}
          </motion.h2>
          
          <motion.p 
            variants={fadeUp}
            className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto"
          >
            {t('schedule', 'subtitle')}
          </motion.p>
        </motion.div>

        {/* Day Tabs — hidden for a single-day schedule */}
        {scheduleData.length > 1 && (
        <motion.div
          className="flex justify-center gap-2 sm:gap-4 mb-10"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {scheduleData.map((day, index) => (
            <motion.button
              key={day.dayKey}
              onClick={() => setActiveDay(index)}
              className={`relative px-4 sm:px-6 py-3 min-h-[44px] rounded-xl font-medium transition-all duration-300 ${
                activeDay === index
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeDay === index && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-base">{t('schedule', day.dayKey)}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {t('schedule', day.labelKey)}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
        )}

        {/* Schedule Content */}
        <motion.div
          className="glass-card p-6 sm:p-8 overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {scheduleData[activeDay].items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 p-4 rounded-xl transition-all duration-300 ${
                    item.highlight
                      ? 'bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20'
                      : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {/* Time */}
                  <div className="flex-shrink-0 sm:w-32">
                    <span className={`text-sm font-mono ${
                      item.highlight ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {item.time}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      item.highlight ? 'text-white' : 'text-[var(--text-secondary)]'
                    }`}>
                      {t('schedule', item.titleKey)}
                    </h4>
                    {item.descKey && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {t('schedule', item.descKey)}
                      </p>
                    )}
                  </div>

                  {/* Highlight indicator */}
                  {item.highlight && (
                    <div className="hidden sm:flex items-center">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Note */}
        <motion.p 
          className="text-center text-[var(--text-muted)] text-sm mt-6"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {t('schedule', 'note')}
        </motion.p>
      </div>
    </section>
  );
}
