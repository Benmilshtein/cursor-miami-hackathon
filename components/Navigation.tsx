'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { authClient } from '@/lib/auth-client';
import { Logo, IconMenu, IconX } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

type NavVariant = 'partnership' | 'participant';

interface NavigationProps {
  variant?: NavVariant;
}

const partnershipNavItems = [
  { key: 'about', href: '#about' },
  { key: 'support', href: '#support' },
  { key: 'audience', href: '#audience' },
  { key: 'contacts', href: '#contacts' },
];

const participantNavItems = [
  { key: 'criteria', href: '#criteria' },
  { key: 'register', href: '/register', highlight: true },
];

const participantNavItemsLoggedIn = [
  { key: 'criteria', href: '#criteria' },
  { key: 'dashboard', href: '/dashboard', highlight: true },
];

export function Navigation({ variant = 'partnership' }: NavigationProps) {
  const { t } = useLanguage();
  const { data: session } = authClient.useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const participantItems = session?.user ? participantNavItemsLoggedIn : participantNavItems;
  const navItems = variant === 'participant' ? participantItems : partnershipNavItems;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href="/" 
              className="flex items-center gap-3 group"
            >
              <Logo size={40} />
              <motion.span 
                className="font-bold text-lg text-white hidden sm:block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                48H
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
                <motion.a
                  key={item.key}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`
                  text-sm font-medium transition-colors relative
                  ${('highlight' in item && item.highlight)
                    ? 'bg-[var(--accent-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--accent-blue)]/90'
                    : 'text-[var(--text-secondary)] hover:text-white'
                  }
                `}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                  whileHover={{ y: ('highlight' in item && item.highlight) ? 0 : -2 }}
                >
                  {t('nav', item.key)}
                  {!('highlight' in item && item.highlight) && (
                    <motion.span
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--accent-purple)]"
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.a>
            ))}

            {/* Register CTA (only on partnership page) */}
            {variant === 'partnership' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/register"
                  className="inline-block rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 transition-colors"
                >
                  {t('nav', 'register')}
                </Link>
              </motion.div>
            )}
          </div>

          {/* Language Switcher + Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <LanguageSwitcher />
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconX size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconMenu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 border-t border-[var(--border-color)] pt-4">
                {navItems.map((item, index) => (
                    <motion.a
                      key={item.key}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`
                      py-3 min-h-[44px] flex items-center text-base font-medium transition-colors
                      ${('highlight' in item && item.highlight)
                        ? 'text-[var(--accent-blue)]'
                        : 'text-[var(--text-secondary)] hover:text-white active:text-[var(--accent-purple)]'
                      }
                    `}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {t('nav', item.key)}
                    </motion.a>
                ))}
                
                {/* Register CTA (only on partnership page) */}
                {variant === 'partnership' && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (navItems.length + 1) * 0.05 }}
                  >
                    <Link
                      href="/register"
                      className="py-3 min-h-[44px] flex items-center text-base font-medium text-[var(--accent-blue)] hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav', 'register')}
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
