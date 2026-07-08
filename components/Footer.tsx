'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { Logo } from '@/components/ui';

export function Footer() {
  const { t } = useLanguage();

  return (
    <motion.footer 
      className="relative py-8 border-t border-[#262626]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <Logo size={32} />
            <span className="font-bold text-white">48H</span>
          </motion.div>

          {/* Copyright */}
          <motion.p 
            className="text-sm text-[#666666]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {t('footer', 'rights')}
          </motion.p>
        </div>
      </div>
    </motion.footer>
  );
}
