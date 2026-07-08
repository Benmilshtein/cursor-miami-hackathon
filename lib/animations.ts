import { Variants } from 'framer-motion';

const EASE_OUT: [number, number, number, number] = [0.25, 0.4, 0.25, 1];

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const fadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const scaleUp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const blurFadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const float = {
  y: [0, -5, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const pulseGlow = {
  opacity: [0.1, 0.18, 0.1],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const rotate = {
  rotate: 360,
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const heroTitle: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

export const shimmer = {
  backgroundPosition: ['200% 0%', '-200% 0%'],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'linear' as const,
  },
};

export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const buttonHover = {
  scale: 1.04,
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const buttonTap = {
  scale: 0.98,
};

export const iconSpin = {
  rotate: [0, 8, -8, 0],
  transition: { duration: 0.4 },
};

export const timelineDotPulse = {
  scale: [1, 1.2, 1],
  opacity: [0.5, 0.9, 0.5],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

export const drawLine: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: 'easeInOut' },
      opacity: { duration: 0.25 },
    },
  },
};

export const counterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const slideInBounce: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const viewportOnce = {
  once: true,
  margin: '-60px',
};

export const viewportAlways = {
  once: false,
  margin: '-30px',
};
