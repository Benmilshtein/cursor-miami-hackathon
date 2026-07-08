'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function Logo({ size = 40, animated = true, className = '' }: LogoProps) {
  const logoVariants = {
    initial: { rotate: 0 },
    hover: { 
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.5 }
    },
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: { 
      opacity: 0.6, 
      scale: 1.2,
      transition: { duration: 0.3 }
    },
  };

  if (!animated) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <Image
          src="/logo-dark.png"
          alt="48H Logo"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
    );
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial="initial"
      whileHover="hover"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-[var(--accent-purple)] rounded-lg blur-xl"
        variants={glowVariants}
      />
      
      {/* Logo */}
      <motion.div
        variants={logoVariants}
        className="relative"
      >
        <Image
          src="/logo-dark.png"
          alt="48H Logo"
          width={size}
          height={size}
          className="rounded-lg relative z-10"
        />
      </motion.div>
    </motion.div>
  );
}

export function LogoWithText({ size = 40 }: { size?: number }) {
  return (
    <motion.div 
      className="flex items-center gap-3"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Logo size={size} />
      <motion.span 
        className="font-bold text-lg text-white"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        48H
      </motion.span>
    </motion.div>
  );
}
