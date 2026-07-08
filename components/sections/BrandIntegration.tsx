'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { GlowEffect, SectionTag, Card, IconBox, IconPresentation, IconMonitor, IconCamera, IconSend, IconMapPin, IconMessage } from '@/components/ui';
import { fadeUp, staggerContainer, popIn, viewportOnce } from '@/lib/animations';

export function BrandIntegration() {
  const { t, tArray } = useLanguage();

  const touchpoints = [
    { icon: IconPresentation, key: 'stage', itemsKey: 'stageItems', color: 'blue' as const },
    { icon: IconMonitor, key: 'online', itemsKey: 'onlineItems', color: 'purple' as const },
    { icon: IconCamera, key: 'photo', itemsKey: 'photoItems', color: 'green' as const },
    { icon: IconSend, key: 'mediaIntegration', itemsKey: 'mediaItems', color: 'blue' as const },
    { icon: IconMapPin, key: 'offlinePresence', itemsKey: 'offlineItems', color: 'purple' as const },
    { icon: IconMessage, key: 'networking', itemsKey: 'networkingItems', color: 'green' as const },
  ];

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      <GlowEffect color="blue" position={{ top: '-150px', left: '-150px' }} size="md" />
      <GlowEffect color="purple" position={{ bottom: '-150px', right: '-150px' }} size="md" />

      {/* Corner Accent */}
      <motion.div 
        className="absolute top-10 right-10 w-24 h-24 border-t-2 border-r-2 border-[#262626] hidden lg:block"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-4"
            variants={fadeUp}
          >
            <motion.div 
              className="w-6 h-0.5 bg-[#a855f7]"
              initial={{ width: 0 }}
              whileInView={{ width: 24 }}
              viewport={{ once: true }}
            />
            <SectionTag color="purple">
              {t('brand', 'tag')}
            </SectionTag>
            <motion.div 
              className="w-6 h-0.5 bg-[#a855f7]"
              initial={{ width: 0 }}
              whileInView={{ width: 24 }}
              viewport={{ once: true }}
            />
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
            variants={fadeUp}
          >
            {t('brand', 'title')}
          </motion.h2>
          <motion.p 
            className="text-[#a1a1a1] text-lg max-w-2xl mx-auto"
            variants={fadeUp}
          >
            {t('brand', 'subtitle')}
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
          {touchpoints.map(({ icon: Icon, key, itemsKey, color }, index) => (
            <motion.div
              key={key}
              variants={popIn}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="group h-full" padding="md">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                    transition={{ duration: 0.4 }}
                  >
                    <IconBox color={color}>
                      <Icon size={20} />
                    </IconBox>
                  </motion.div>
                  <h3 className="text-lg font-bold text-white">
                    {t('brand', key)}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {tArray('brand', itemsKey).map((item, idx) => (
                    <motion.li 
                      key={idx} 
                      className="text-sm text-[#a1a1a1] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#666666] group-hover:before:bg-[#a855f7] before:transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
                {/* Bottom accent on hover */}
                <motion.div 
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-transparent"
                  whileHover={{ backgroundColor: '#a855f7' }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
