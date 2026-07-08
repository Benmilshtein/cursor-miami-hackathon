'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconBox, IconAward, IconGavel, IconMessage, IconCrown, IconStar, IconCheckCircle } from '@/components/ui';
import { fadeUp, fadeInLeft, staggerContainer, popIn, viewportOnce } from '@/lib/animations';

export function JurySection() {
  const { t } = useLanguage();

  const cards = [
    { icon: IconAward, key: 'card1', color: 'blue' as const, num: '01' },
    { icon: IconGavel, key: 'card2', color: 'purple' as const, num: '02' },
    { icon: IconMessage, key: 'card3', color: 'green' as const, num: '03' },
    { icon: IconCrown, key: 'card4', color: 'blue' as const, num: '04' },
  ];

  const targets = ['target1', 'target2', 'target3', 'target4'];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="grid-pattern absolute inset-0" />
      <GlowEffect color="blue" position={{ top: '-100px', left: '-100px' }} size="md" className="opacity-20" />
      <GlowEffect color="purple" position={{ bottom: '-150px', right: '-100px' }} size="md" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div className="max-w-2xl" variants={fadeInLeft}>
            <motion.div 
              className="inline-flex items-center gap-3 bg-purple-500/5 border-l-4 border-[var(--accent-purple)] px-4 py-2 min-h-[44px] rounded-r mb-6"
              whileHover={{ x: 3 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <IconStar size={16} className="text-[var(--accent-purple)]" />
              </motion.div>
              <span className="text-sm font-bold text-[var(--accent-purple)] uppercase tracking-wider">
                {t('jury', 'tag')}
              </span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
              {t('jury', 'title')}
            </h2>
            <p className="text-lg text-[#a1a1a1] leading-relaxed">
              {t('jury', 'description')}
            </p>
          </motion.div>

          {/* Target Badge */}
          <motion.div 
            className="glass-card p-4 sm:p-6 w-full lg:w-80 lg:max-w-sm"
            variants={fadeUp}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <motion.div 
              className="absolute top-0 left-0 w-full h-0.5 bg-[var(--accent-blue)] opacity-60"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            />
            <div className="flex items-center gap-2 text-sm text-[#666666] mb-3">
              <IconCheckCircle size={16} />
              {t('jury', 'targetLabel')}
            </div>
            <div className="flex flex-wrap gap-2">
              {targets.map((key, index) => (
                <motion.span 
                  key={key}
                  className="bg-blue-500/10 text-[var(--accent-blue)] text-xs sm:text-sm font-semibold px-3 py-2 min-h-[36px] rounded-md"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
                >
                  {t('jury', key)}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {cards.map(({ icon: Icon, key, color, num }, index) => (
            <motion.div
              key={key}
              variants={popIn}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                transition: { duration: 0.2 }
              }}
            >
              <Card 
                className="group h-full"
                padding="lg"
              >
                <motion.span 
                  className="absolute top-5 right-5 text-4xl font-extrabold text-white/5"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {num}
                </motion.span>
                <motion.div 
                  className={`icon-box icon-box-${color} mb-6`}
                  whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon size={24} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('jury', `${key}Title`)}
                </h3>
                <p className="text-[#a1a1a1] text-sm leading-relaxed">
                  {t('jury', `${key}Desc`)}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
