'use client';

import { useReducedMotion as useFramerReducedMotion } from 'motion/react';

export function useReducedMotion(): boolean | null {
  const prefersReducedMotion = useFramerReducedMotion();
  return prefersReducedMotion;
}
