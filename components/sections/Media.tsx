'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconBox, IconSend, IconHandshake, IconGlobe, IconCamera, IconDocument, IconUsers } from '@/components/ui';
import { fadeUp, staggerContainer, popIn, viewportOnce } from '@/lib/animations';

export function Media() {
  const { t, tArray } = useLanguage();

  const channels = [
    { icon: IconSend, key: 'telegram', itemsKey: 'telegramItems', color: 'blue' as const, highlight: true },
    { icon: IconHandshake, key: 'partners', itemsKey: 'partnersItems', color: 'purple' as const },
    { icon: IconGlobe, key: 'onlineMedia', itemsKey: 'onlineMediaItems', color: 'green' as const },
    { icon: IconCamera, key: 'content', itemsKey: 'contentItems', color: 'purple' as const },
    { icon: IconDocument, key: 'results', itemsKey: 'resultsItems', color: 'blue' as const },
    { icon: IconUsers, key: 'offline', itemsKey: 'offlineItems', color: 'green' as const },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff'/%3E%3C/svg%3E")`
      }} />
      <GlowEffect color="blue" position={{ top: '-20%', left: '50%' }} size="lg" className="-translate-x-1/2 opacity-10" />
      <GlowEffect color="purple" position={{ bottom: '-20%', right: '-10%' }} size="md" />

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
              {t('media', 'tag')}
            </SectionTag>
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
            variants={fadeUp}
          >
            {t('media', 'title')}
          </motion.h2>
          <motion.p 
            className="text-[var(--text-secondary)] text-lg max-w-2xl"
            variants={fadeUp}
          >
            {t('media', 'subtitle')}
          </motion.p>
        </motion.div>

        {/* Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {channels.map(({ icon: Icon, key, itemsKey, color, highlight }, index) => (
            <motion.div
              key={key}
              variants={popIn}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <Card 
                className={highlight ? 'bg-pink-500/10 border-pink-500/30' : ''} 
                padding="md"
              >
                {highlight && (
                  <motion.span 
                    className="absolute top-4 right-4 text-xs font-semibold text-[var(--accent-blue)] bg-pink-500/10 px-2 py-1 rounded"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Key Channel
                  </motion.span>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <IconBox color={color}>
                      <Icon size={20} />
                    </IconBox>
                  </motion.div>
                  <h3 className="text-lg font-bold text-white">
                    {t('media', key)}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {tArray('media', itemsKey).map((item, idx) => (
                    <motion.li 
                      key={idx} 
                      className={`text-sm text-[var(--text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full ${highlight ? 'before:bg-[var(--accent-blue)]' : 'before:bg-[var(--text-muted)]'}`}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
