'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

type AnimationStage = 'confused' | 'tablet' | 'inspiration' | 'enlightened';

export function CharacterAnimation() {
  const [stage, setStage] = useState<AnimationStage>('confused');
  const reducedMotion = useReducedMotion();
  const mountedRef = useRef(true);

  useEffect(() => {
    if (reducedMotion) {
      setStage('enlightened');
      return;
    }

    mountedRef.current = true;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const runCycle = async () => {
      while (mountedRef.current) {
        setStage('confused');
        await sleep(1200);
        if (!mountedRef.current) break;

        setStage('tablet');
        await sleep(1200);
        if (!mountedRef.current) break;

        setStage('inspiration');
        await sleep(1000);
        if (!mountedRef.current) break;

        setStage('enlightened');
        await sleep(1400);
      }
    };

    runCycle();
    return () => {
      mountedRef.current = false;
    };
  }, [reducedMotion]);

  const noAnim = !!reducedMotion;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-[15%] top-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-violet-200/30 to-fuchsia-200/20 blur-3xl"
          animate={noAnim ? {} : { y: [0, -15, 0], x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[18%] bottom-[12%] w-56 h-56 rounded-full bg-gradient-to-br from-indigo-200/25 to-blue-200/15 blur-3xl"
          animate={noAnim ? {} : { y: [0, -12, 0], x: [0, -6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute left-[40%] top-[45%] w-44 h-44 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/12 blur-3xl"
          animate={noAnim ? {} : { y: [0, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      <div style={{ transform: 'scale(1.6)', transformOrigin: 'center center' }}>
        <motion.div
          animate={noAnim ? {} : { y: [0, -8, 0] }}
          transition={noAnim ? {} : { duration: 3, ease: 'easeInOut', repeat: Infinity }}
        >
          <svg
            viewBox="0 0 400 360"
            width="100%"
            height="100%"
            style={{ maxWidth: 800, maxHeight: 720 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* ====== DEFS ====== */}
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="60%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="bodyHighlight" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="cloudClip">
                <path d="M160 70 C130 65, 105 80, 95 110 C75 108, 55 125, 58 150 C45 155, 38 178, 52 195 C48 215, 62 238, 88 240 C92 258, 115 270, 142 262 C158 276, 188 278, 210 264 C235 270, 260 256, 265 232 C288 224, 298 198, 288 172 C302 156, 296 132, 278 122 C282 98, 262 76, 235 78 C222 62, 192 56, 170 66 Z" />
              </clipPath>
            </defs>

            {/* ====== SHADOW ====== */}
            <ellipse cx="175" cy="300" rx="50" ry="7" fill="rgba(124,58,237,0.08)" />

            {/* ====== CLOUD BODY ====== */}
            <g filter="url(#glow)">
              <path
                d="M160 70 C130 65, 105 80, 95 110 C75 108, 55 125, 58 150 C45 155, 38 178, 52 195 C48 215, 62 238, 88 240 C92 258, 115 270, 142 262 C158 276, 188 278, 210 264 C235 270, 260 256, 265 232 C288 224, 298 198, 288 172 C302 156, 296 132, 278 122 C282 98, 262 76, 235 78 C222 62, 192 56, 170 66 Z"
                fill="url(#bodyGrad)"
              />
              {/* Body highlight */}
              <path
                d="M165 72 C140 68, 118 82, 108 108 C90 106, 73 121, 76 143 C64 148, 58 168, 70 183 C67 200, 79 220, 101 222 C104 238, 124 248, 147 241 C161 253, 187 255, 206 243 C228 248, 250 236, 254 216 C274 209, 282 186, 274 164 C286 150, 280 130, 265 122 C268 102, 251 84, 228 86 C217 72, 191 67, 172 74 Z"
                fill="url(#bodyHighlight)"
              />
            </g>

            {/* ====== BLUSH ====== */}
            <AnimatePresence>
              {(stage === 'confused' || stage === 'tablet') && (
                <motion.g key="blush-confused" initial={noAnim ? {} : { opacity: 0 }} animate={noAnim ? {} : { opacity: 1 }} exit={noAnim ? {} : { opacity: 0 }} transition={{ duration: 0.3 }}>
                  <ellipse cx="128" cy="162" rx="14" ry="9" fill="#f472b6" opacity="0.3" />
                  <ellipse cx="218" cy="162" rx="14" ry="9" fill="#f472b6" opacity="0.3" />
                </motion.g>
              )}
              {stage === 'enlightened' && (
                <motion.g key="blush-happy" initial={noAnim ? {} : { opacity: 0 }} animate={noAnim ? {} : { opacity: 1 }} exit={noAnim ? {} : { opacity: 0 }} transition={{ duration: 0.3 }}>
                  <ellipse cx="126" cy="164" rx="16" ry="10" fill="#fb7185" opacity="0.4" />
                  <ellipse cx="220" cy="164" rx="16" ry="10" fill="#fb7185" opacity="0.4" />
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== EYES ====== */}
            <g>
              {/* Left eye sparkle */}
              <g transform="translate(132, 152)">
                <motion.polygon
                  points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
                  fill="#1e1b4b"
                  animate={
                    stage === 'enlightened'
                      ? !noAnim ? { scale: [1, 1.15, 1], rotate: [0, 180, 360] } : {}
                      : !noAnim ? { rotate: [0, 90, 0] } : {}
                  }
                  transition={!noAnim ? { duration: 1.5, ease: 'easeInOut', repeat: Infinity } : {}}
                  style={{ transformOrigin: 'center center' } as React.CSSProperties}
                />
                <circle cx="-3" cy="-3" r="2.5" fill="white" opacity="0.85" />
              </g>

              {/* Right eye sparkle */}
              <g transform="translate(214, 152)">
                <motion.polygon
                  points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
                  fill="#1e1b4b"
                  animate={
                    stage === 'enlightened'
                      ? !noAnim ? { scale: [1, 1.15, 1], rotate: [0, -180, -360] } : {}
                      : !noAnim ? { rotate: [0, -90, 0] } : {}
                  }
                  transition={!noAnim ? { duration: 1.5, ease: 'easeInOut', repeat: Infinity } : {}}
                  style={{ transformOrigin: 'center center' } as React.CSSProperties}
                />
                <circle cx="3" cy="-3" r="2.5" fill="white" opacity="0.85" />
              </g>
            </g>

            {/* ====== MOUTH ====== */}
            <AnimatePresence mode="wait">
              {stage === 'confused' && (
                <motion.path
                  key="mouth-confused"
                  d="M163 182 Q173 174 183 182 Q177 186 173 184 Q169 186 163 182 Z"
                  fill="none"
                  stroke="#4c1d95"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  initial={noAnim ? {} : { pathLength: 0, opacity: 0 }}
                  animate={noAnim ? {} : { pathLength: 1, opacity: 1 }}
                  exit={noAnim ? {} : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {(stage === 'tablet' || stage === 'inspiration') && (
                <motion.ellipse
                  key="mouth-thinking"
                  cx="173"
                  cy="184"
                  rx="8"
                  ry="5"
                  fill="none"
                  stroke="#4c1d95"
                  strokeWidth="2.5"
                  initial={noAnim ? {} : { scaleY: 0, opacity: 0 }}
                  animate={noAnim ? {} : { scaleY: 1, opacity: 1 }}
                  exit={noAnim ? {} : { scaleY: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: 'center center' } as React.CSSProperties}
                />
              )}

              {stage === 'enlightened' && (
                <motion.path
                  key="mouth-happy"
                  d="M160 180 Q173 196 186 180"
                  fill="none"
                  stroke="#4c1d95"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  initial={noAnim ? {} : { pathLength: 0, opacity: 0 }}
                  animate={noAnim ? {} : { pathLength: 1, opacity: 1 }}
                  exit={noAnim ? {} : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            {/* ====== LEFT ARM - Scratching head / holding tablet / raised happy ====== */}
            <AnimatePresence>
              {stage === 'confused' && (
                <motion.g
                  key="arm-scratch"
                  initial={noAnim ? {} : { opacity: 0 }}
                  animate={noAnim ? {} : { opacity: 1 }}
                  exit={noAnim ? {} : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.g
                    animate={noAnim ? {} : { rotate: [-8, 4, -8] }}
                    transition={noAnim ? {} : { duration: 0.5, ease: 'easeInOut', repeat: Infinity }}
                    style={{ transformBox: 'view-box', transformOrigin: '96px 190px' } as React.CSSProperties}
                  >
                    <path d="M96 190 Q84 160 80 135 Q82 112 100 100" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
                    <path d="M96 190 Q84 160 80 135 Q82 112 100 100" fill="none" stroke="#ddd6fe" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="8" fill="#c4b5fd" />
                    <circle cx="100" cy="100" r="4" fill="#ddd6fe" />
                  </motion.g>
                </motion.g>
              )}

              {(stage === 'tablet' || stage === 'inspiration') && (
                <motion.g
                  key="arm-hold-tablet"
                  initial={noAnim ? {} : { opacity: 0 }}
                  animate={noAnim ? {} : { opacity: 1 }}
                  exit={noAnim ? {} : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.g
                    animate={noAnim ? {} : { y: [0, -2, 0] }}
                    transition={noAnim ? {} : { duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
                  >
                    <path d="M96 190 Q88 205 88 218" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
                    <path d="M96 190 Q88 205 88 218" fill="none" stroke="#ddd6fe" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="88" cy="218" r="8" fill="#c4b5fd" />
                    <circle cx="88" cy="218" r="4" fill="#ddd6fe" />
                  </motion.g>
                </motion.g>
              )}

              {stage === 'enlightened' && (
                <motion.g
                  key="arm-celebrate"
                  initial={noAnim ? {} : { opacity: 0, y: 10 }}
                  animate={noAnim ? {} : { opacity: 1, y: 0 }}
                  exit={noAnim ? {} : { opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                >
                  <motion.g
                    animate={noAnim ? {} : { rotate: [-10, 10, -10], y: [0, -8, 0] }}
                    transition={noAnim ? {} : { duration: 0.8, ease: 'easeInOut', repeat: Infinity }}
                    style={{ transformBox: 'view-box', transformOrigin: '96px 190px' } as React.CSSProperties}
                  >
                    <path d="M96 190 Q78 160 68 130 Q62 105 75 82" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
                    <path d="M96 190 Q78 160 68 130 Q62 105 75 82" fill="none" stroke="#ddd6fe" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="75" cy="82" r="8" fill="#c4b5fd" />
                    <circle cx="75" cy="82" r="4" fill="#ddd6fe" />
                  </motion.g>
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== RIGHT ARM ====== */}
            <g transform="translate(250, 190)">
              <path d="M0 0 Q10 14 18 26" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
              <path d="M0 0 Q10 14 18 26" fill="none" stroke="#ddd6fe" strokeWidth="6" strokeLinecap="round" />
              <g transform="translate(18, 26)">
                <motion.g
                  animate={
                    stage === 'enlightened'
                      ? !noAnim ? { rotate: [-15, 15, -15] } : {}
                      : !noAnim ? { rotate: [-3, 3, -3] } : {}
                  }
                  transition={!noAnim ? { duration: stage === 'enlightened' ? 0.6 : 3, ease: 'easeInOut', repeat: Infinity } : {}}
                  style={{ transformOrigin: 'center center' } as React.CSSProperties}
                >
                  <path d="M0 0 Q8 12 16 20" fill="none" stroke="#c4b5fd" strokeWidth="13" strokeLinecap="round" />
                  <path d="M0 0 Q8 12 16 20" fill="none" stroke="#ddd6fe" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="16" cy="20" r="8" fill="#c4b5fd" />
                  <circle cx="16" cy="20" r="4" fill="#ddd6fe" />
                </motion.g>
              </g>
            </g>

            {/* ====== QUESTION MARK (Confused stage) ====== */}
            <AnimatePresence>
              {stage === 'confused' && (
                <motion.g
                  key="question-mark"
                  initial={noAnim ? {} : { scale: 0, opacity: 0, y: 10 }}
                  animate={!noAnim ? { scale: [0, 1.2, 1], opacity: 1, y: 0, rotate: [-8, 8, -8] } : { scale: 1, opacity: 1, y: 0 }}
                  exit={noAnim ? {} : { scale: 0, opacity: 0, y: -10 }}
                  transition={
                    !noAnim
                      ? { scale: { duration: 0.4, ease: 'easeOut' }, rotate: { duration: 1.2, ease: 'easeInOut', repeat: Infinity } }
                      : {}
                  }
                >
                  <text x="173" y="42" textAnchor="middle" fontSize="44" fontWeight="900" fill="#f97316" fontFamily="system-ui, sans-serif">?</text>
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== TABLET (Tablet & Inspiration stages) ====== */}
            <AnimatePresence>
              {(stage === 'tablet' || stage === 'inspiration') && (
                <motion.g
                  key="tablet"
                  initial={noAnim ? {} : { x: 80, opacity: 0, rotate: -10 }}
                  animate={noAnim ? {} : { x: 0, opacity: 1, rotate: 0 }}
                  exit={noAnim ? {} : { x: 80, opacity: 0, rotate: 10 }}
                  transition={!noAnim ? { type: 'spring', stiffness: 180, damping: 18 } : {}}
                >
                  {/* Tablet body */}
                  <rect x="105" y="228" width="100" height="68" rx="10" fill="#1e1b4b" />
                  <rect x="111" y="234" width="88" height="54" rx="5" fill="#ede9fe" />
                  {/* Screen glare */}
                  <rect x="111" y="234" width="88" height="22" rx="5" fill="white" opacity="0.45" />
                  {/* LearnGenie logo on screen */}
                  <image href="/logo-horizontal.png" x="122" y="252" width="66" height="11" preserveAspectRatio="xMidYMid meet" opacity="0.85" />
                  {/* Screen content lines below logo */}
                  <rect x="122" y="268" width="48" height="3" rx="1.5" fill="#7c3aed" opacity="0.18" />
                  <rect x="122" y="275" width="64" height="2.5" rx="1.25" fill="#a78bfa" opacity="0.15" />
                  {/* Home button */}
                  <circle cx="155" cy="290" r="3" fill="#4c1d95" opacity="0.3" />

                  {/* Tap finger animation during tablet stage */}
                  {stage === 'tablet' && (
                    <motion.circle
                      cx="145"
                      cy="256"
                      r="5"
                      fill="#7c3aed"
                      opacity="0.4"
                      initial={noAnim ? {} : { scale: 0 }}
                      animate={!noAnim ? { scale: [0, 1.3, 0], opacity: [0, 0.5, 0] } : {}}
                      transition={!noAnim ? { duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.5 } : {}}
                    />
                  )}
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== LIGHT BULB (Inspiration & Enlightened stages) ====== */}
            <AnimatePresence>
              {(stage === 'inspiration' || stage === 'enlightened') && (
                <motion.g
                  key="bulb"
                  initial={noAnim ? {} : { scale: 0, opacity: 0, y: 20 }}
                  animate={
                    !noAnim
                      ? { scale: stage === 'inspiration' ? [0, 1] : 1, opacity: 1, y: 0 }
                      : { scale: 1, opacity: 1, y: 0 }
                  }
                  exit={noAnim ? {} : { scale: 0, opacity: 0, y: -10 }}
                  transition={
                    !noAnim
                      ? { type: 'spring', stiffness: 250, damping: 12 }
                      : {}
                  }
                >
                  {/* Glow effect */}
                  <motion.circle
                    cx="173"
                    cy="32"
                    r="28"
                    fill="url(#bulbGlow)"
                    animate={!noAnim ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] } : {}}
                    transition={!noAnim ? { duration: 1.5, ease: 'easeInOut', repeat: Infinity } : {}}
                    style={{ transformOrigin: 'center center' } as React.CSSProperties}
                  />
                  {/* Bulb body */}
                  <g transform="translate(173, 32)">
                    <ellipse cx="0" cy="-2" rx="14" ry="15" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1.8" />
                    {/* Filament */}
                    <path d="M-5 -6 Q0 -12 5 -6" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="0" y1="-6" x2="0" y2="2" stroke="#f59e0b" strokeWidth="1.5" />
                    {/* Base */}
                    <rect x="-5" y="12" width="10" height="6" rx="2" fill="#d97706" />
                    <line x1="-4" y1="15" x2="4" y2="15" stroke="#b45309" strokeWidth="1" />
                    <line x1="-4" y1="17" x2="4" y2="17" stroke="#b45309" strokeWidth="1" />
                  </g>
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== SPARKLES around bulb (Enlightened stage) ====== */}
            <AnimatePresence>
              {stage === 'enlightened' && (
                <motion.g
                  key="sparkles-enlightened"
                  initial={noAnim ? {} : { scale: 0, opacity: 0 }}
                  animate={noAnim ? {} : { scale: 1, opacity: 1 }}
                  exit={noAnim ? {} : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.polygon
                    points="138,22 140,18 144,20 141,24 143,28 139,26 136,29 137,25 133,23 137,21"
                    fill="#fbbf24"
                    animate={!noAnim ? { scale: [0.8, 1.2, 0.8], rotate: [0, 90, 180], opacity: [0.5, 1, 0.5] } : {}}
                    transition={!noAnim ? { duration: 2, ease: 'easeInOut', repeat: Infinity } : {}}
                    style={{ transformOrigin: '139px 25px' } as React.CSSProperties}
                  />
                  <motion.polygon
                    points="208,26 210,22 214,24 211,28 213,32 209,30 206,33 207,29 203,27 207,25"
                    fill="#a855f7"
                    animate={!noAnim ? { scale: [0.9, 1.15, 0.9], rotate: [0, -90, -180], opacity: [0.4, 0.9, 0.4] } : {}}
                    transition={!noAnim ? { duration: 2.3, ease: 'easeInOut', repeat: Infinity, delay: 0.4 } : {}}
                    style={{ transformOrigin: '208px 29px' } as React.CSSProperties}
                  />
                  <motion.polygon
                    points="173,4 174.5,1 177,2.5 175,5 176,8 173.5,6.5 171,8 171.5,5 169,3.5 171.5,2.5"
                    fill="#fde68a"
                    animate={!noAnim ? { scale: [0.7, 1.1, 0.7], opacity: [0.4, 0.8, 0.4] } : {}}
                    transition={!noAnim ? { duration: 1.8, ease: 'easeInOut', repeat: Infinity, delay: 0.2 } : {}}
                    style={{ transformOrigin: '173px 5px' } as React.CSSProperties}
                  />
                </motion.g>
              )}
            </AnimatePresence>

            {/* ====== DECORATIVE ELEMENTS ====== */}

            {/* Clouds */}
            <motion.g
              animate={!noAnim ? { x: [0, 6, 0], y: [0, -3, 0] } : {}}
              transition={!noAnim ? { duration: 6, ease: 'easeInOut', repeat: Infinity } : {}}
            >
              <ellipse cx="46" cy="52" rx="24" ry="13" fill="white" opacity="0.65" />
              <ellipse cx="32" cy="57" rx="16" ry="10" fill="white" opacity="0.65" />
              <ellipse cx="62" cy="57" rx="18" ry="10" fill="white" opacity="0.65" />
            </motion.g>

            <motion.g
              animate={!noAnim ? { x: [0, -5, 0], y: [0, -4, 0] } : {}}
              transition={!noAnim ? { duration: 7.5, ease: 'easeInOut', repeat: Infinity, delay: 1.5 } : {}}
            >
              <ellipse cx="344" cy="68" rx="20" ry="11" fill="white" opacity="0.5" />
              <ellipse cx="332" cy="72" rx="14" ry="8" fill="white" opacity="0.5" />
              <ellipse cx="356" cy="72" rx="15" ry="8" fill="white" opacity="0.5" />
            </motion.g>

            <motion.g
              animate={!noAnim ? { x: [0, 4, 0], y: [0, -2, 0] } : {}}
              transition={!noAnim ? { duration: 8, ease: 'easeInOut', repeat: Infinity, delay: 3 } : {}}
            >
              <ellipse cx="34" cy="158" rx="17" ry="9" fill="white" opacity="0.4" />
              <ellipse cx="24" cy="162" rx="12" ry="7" fill="white" opacity="0.4" />
              <ellipse cx="44" cy="162" rx="13" ry="7" fill="white" opacity="0.4" />
            </motion.g>

            {/* Stars */}
            <motion.g
              animate={!noAnim ? { opacity: [0.3, 0.85, 0.3], scale: [0.8, 1.15, 0.8] } : {}}
              transition={!noAnim ? { duration: 2.5, ease: 'easeInOut', repeat: Infinity } : {}}
              style={{ transformBox: 'view-box', transformOrigin: '310px 38px' } as React.CSSProperties}
            >
              <polygon points="308,34 310,30 314,32 310,36 312,40 308,38 304,40 306,36 302,32 306,30" fill="#fbbf24" opacity="0.75" />
            </motion.g>

            <motion.g
              animate={!noAnim ? { opacity: [0.35, 0.8, 0.35], scale: [0.85, 1.1, 0.85] } : {}}
              transition={!noAnim ? { duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.8 } : {}}
              style={{ transformBox: 'view-box', transformOrigin: '365px 140px' } as React.CSSProperties}
            >
              <polygon points="363,137 365,134 368,136 365,139 367,143 363,141 360,143 361,139 358,136 361,134" fill="#a855f7" opacity="0.6" />
            </motion.g>

            <motion.g
              animate={!noAnim ? { opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.1, 0.8] } : {}}
              transition={!noAnim ? { duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: 1.6 } : {}}
              style={{ transformBox: 'view-box', transformOrigin: '68px 100px' } as React.CSSProperties}
            >
              <polygon points="66,98 68,94 71,96 68,99 70,103 66,101 63,103 64,99 61,96 64,94" fill="#8b5cf6" opacity="0.55" />
            </motion.g>

            <motion.g
              animate={!noAnim ? { opacity: [0.25, 0.65, 0.25], scale: [0.75, 1.05, 0.75] } : {}}
              transition={!noAnim ? { duration: 2.2, ease: 'easeInOut', repeat: Infinity, delay: 0.5 } : {}}
              style={{ transformBox: 'view-box', transformOrigin: '330px 230px' } as React.CSSProperties}
            >
              <polygon points="328,228 330,225 333,227 330,230 332,234 330,232 326,234 327,230 324,227 327,225" fill="#f97316" opacity="0.5" />
            </motion.g>

            {/* Small dots / particles */}
            <motion.circle
              cx="90"
              cy="38"
              r="3"
              fill="#c4b5fd"
              opacity="0.5"
              animate={!noAnim ? { y: [0, -8, 0], opacity: [0.3, 0.7, 0.3] } : {}}
              transition={!noAnim ? { duration: 4, ease: 'easeInOut', repeat: Infinity } : {}}
            />
            <motion.circle
              cx="320"
              cy="100"
              r="2.5"
              fill="#fde68a"
              opacity="0.5"
              animate={!noAnim ? { y: [0, -6, 0], opacity: [0.3, 0.6, 0.3] } : {}}
              transition={!noAnim ? { duration: 4.5, ease: 'easeInOut', repeat: Infinity, delay: 1 } : {}}
            />
            <motion.circle
              cx="52"
              cy="210"
              r="2"
              fill="#fbbf24"
              opacity="0.4"
              animate={!noAnim ? { y: [0, -5, 0], opacity: [0.2, 0.5, 0.2] } : {}}
              transition={!noAnim ? { duration: 3.5, ease: 'easeInOut', repeat: Infinity, delay: 2 } : {}}
            />
            <motion.circle
              cx="350"
              cy="190"
              r="2.5"
              fill="#a855f7"
              opacity="0.4"
              animate={!noAnim ? { y: [0, -7, 0], opacity: [0.25, 0.55, 0.25] } : {}}
              transition={!noAnim ? { duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 0.8 } : {}}
            />
          </svg>
        </motion.div>
      </div>

      {/* Logo + Tagline */}
      <div className="fixed left-[50%] top-6 z-20 translate-x-[-50%] text-center">
        <img src="/logo-horizontal.png" alt="LearnGenie" className="h-7 w-auto" />
        <p className="mt-2 text-sm font-medium text-[#6b6b80]">
          你的
          <span className="font-bold gradient-text"> AI 学习</span>
          之旅从这里开始
        </p>
      </div>
    </div>
  );
}
