'use client';

import { motion } from 'motion/react';

interface FloatingOrbProps {
  className: string;
  animation?: {
    y: [number, number, number];
    x?: [number, number, number];
    scale?: [number, number, number];
  };
  duration: number;
  delay?: number;
}

export function FloatingOrb({ className, animation, duration, delay = 0 }: FloatingOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full blur-2xl pointer-events-none ${className}`}
      animate={{
        y: animation?.y || [0, -30, 0],
        x: animation?.x || [0, 15, 0],
        scale: animation?.scale || [1, 1.05, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

interface FloatingIconProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FloatingIcon({ children, className, delay = 0, duration = 4 }: FloatingIconProps) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{
        y: [0, -22, 0],
        x: [0, 12, 0],
        rotate: [0, 6, -6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

interface FloatingDotProps {
  className: string;
  animation?: {
    y: [number, number, number];
    scale?: [number, number, number];
  };
  duration: number;
  delay?: number;
}

export function FloatingDot({ className, animation, duration, delay = 0 }: FloatingDotProps) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{
        y: animation?.y || [0, -20, 0],
        scale: animation?.scale || [1, 1.15, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

interface FloatingStarProps {
  className?: string;
  delay?: number;
  duration?: number;
  color: string;
  size: number;
}

export function FloatingStar({ className, delay = 0, duration = 5, color, size }: FloatingStarProps) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{
        y: [0, -22, 0],
        x: [0, 12, 0],
        rotate: [0, 6, -6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`drop-shadow-sm ${color}`}>
        <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

interface FloatingPlusProps {
  className: string;
  duration: number;
  delay?: number;
}

export function FloatingPlus({ className, duration, delay = 0 }: FloatingPlusProps) {
  return (
    <motion.div
      className={`absolute font-light pointer-events-none ${className}`}
      animate={{
        y: [0, -25, 0],
        rotate: [0, 15, -15, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      +
    </motion.div>
  );
}
