'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconBox, IconBuilding, IconTarget, IconMegaphone, IconHandshake } from '@/components/ui';
import { fadeInLeft, staggerContainer, popIn, viewportOnce } from '@/lib/animations';

export function Support() {
  const { t } = useLanguage();

  const cards = [
    { icon: IconBuilding, key: 'card1', color: 'blue' as const },
    { icon: IconTarget, key: 'card2', color: 'purple' as const },
    { icon: IconMegaphone, key: 'card3', color: 'green' as const },
    { icon: IconHandshake, key: 'card4', color: 'blue' as const },
  ];

  const cardColors = {
    blue: 'var(--accent-blue)',
    purple: 'var(--accent-purple)',
    green: '#22c55e',
  };

  return (
    <section id="support" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="blue" position={{ top: '50%', left: '50%' }} size="lg" className="-translate-x-1/2 -translate-y-1/2 opacity-10" />
      <GlowEffect color="purple" position={{ top: '-100px', right: '-100px' }} size="sm" />

      {/* Tech Lines */}
      <motion.div 
        className="absolute top-32 right-0 h-px bg-[var(--border-color)] hidden lg:block"
        initial={{ width: 0 }}
        whileInView={{ width: 400 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.div 
        className="absolute bottom-20 left-0 h-px bg-[var(--border-color)] hidden lg:block"
        initial={{ width: 0 }}
        whileInView={{ width: 300 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.7 }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div className="max-w-xl" variants={fadeInLeft}>
            <SectionTag color="purple" className="mb-4">
              {t('support', 'tag')}
            </SectionTag>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white">
              {t('support', 'title')}
            </h2>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {cards.map(({ icon: Icon, key, color }, index) => (
            <motion.div
              key={key}
              variants={popIn}
              whileHover={{ 
                scale: 1.02, 
                y: -8,
                boxShadow: `0 25px 50px ${cardColors[color]}20`
              }}
            >
              <Card accentColor={color} padding="lg">
                <div className="flex items-start gap-6">
                  <motion.div
                    whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <IconBox color={color} size="lg">
                      <Icon size={24} />
                    </IconBox>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('support', `${key}Title`)}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {t('support', `${key}Desc`)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
