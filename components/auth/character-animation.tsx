'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

type AnimationStage = 'confused' | 'tablet' | 'studying';

export function CharacterAnimation() {
  const [stage, setStage] = useState<AnimationStage>('confused');
  const reducedMotion = useReducedMotion();
  const mountedRef = useRef(true);

  useEffect(() => {
    if (reducedMotion) {
      setStage('studying');
      return;
    }

    mountedRef.current = true;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const runCycle = async () => {
      while (mountedRef.current) {
        setStage('confused');
        await sleep(2800);
        if (!mountedRef.current) break;
        setStage('tablet');
        await sleep(2000);
        if (!mountedRef.current) break;
        setStage('studying');
        await sleep(4200);
        if (!mountedRef.current) break;
        await sleep(1500);
      }
    };

    runCycle();
    return () => {
      mountedRef.current = false;
    };
  }, [reducedMotion]);

  const noAnim = !!reducedMotion;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#ebf5ff] to-white">
      <div style={{ transform: 'scale(2)', transformOrigin: 'center center' }}>
        <motion.div
          animate={noAnim ? {} : { y: [0, -8, 0] }}
          transition={noAnim ? {} : { duration: 3.5, ease: 'easeInOut', repeat: Infinity }}
        >
          <svg
            viewBox="0 0 400 320"
            width="100%"
            height="100%"
          style={{ maxWidth: 800, maxHeight: 640 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ====== STATIC ELEMENTS ====== */}

          {/* Legs */}
          <rect x="130" y="230" width="18" height="40" rx="9" fill="#4a5568" />
          <rect x="162" y="230" width="18" height="40" rx="9" fill="#4a5568" />

          {/* Shoes */}
          <rect x="124" y="264" width="28" height="10" rx="5" fill="#2d3748" />
          <rect x="158" y="264" width="28" height="10" rx="5" fill="#2d3748" />

          {/* Shadow under character */}
          <ellipse cx="155" cy="278" rx="40" ry="5" fill="rgba(0,0,0,0.06)" />

          {/* Body / Torso */}
          <rect x="118" y="148" width="74" height="88" rx="24" fill="#0069e0" />

          {/* Collar detail */}
          <path
            d="M135 152 L155 170 L175 152"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Neck */}
          <rect x="145" y="128" width="20" height="25" rx="10" fill="#ffd5c2" />

          {/* Head */}
          <circle cx="155" cy="100" r="40" fill="#ffd5c2" />

          {/* Hair */}
          <path
            d="M112 95 C110 55, 130 50, 155 50 C180 50, 200 58, 198 96 C199 78, 182 57, 155 56 C128 57, 111 78, 112 95 Z"
            fill="#4a3728"
          />
          {/* Hair tufts */}
          <path
            d="M125 72 Q132 60 138 57"
            fill="none"
            stroke="#4a3728"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M175 72 Q170 60 165 57"
            fill="none"
            stroke="#4a3728"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Blush */}
          <circle cx="128" cy="108" r="8" fill="#ffb5a7" opacity="0.35" />
          <circle cx="182" cy="108" r="8" fill="#ffb5a7" opacity="0.35" />

          {/* Eyes */}
          <circle cx="140" cy="96" r="4.5" fill="#2d3748" />
          <circle cx="170" cy="96" r="4.5" fill="#2d3748" />
          {/* Eye highlights */}
          <circle cx="141.5" cy="94" r="1.8" fill="white" />
          <circle cx="171.5" cy="94" r="1.8" fill="white" />

          {/* ====== RIGHT ARM (two-segment: upper + forearm with elbow pivot) ====== */}
          <g transform="translate(192, 160)">
            {/* Upper arm (static) */}
            <path
              d="M0 0 Q6 10 12 20"
              fill="none"
              stroke="#ffd5c2"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Forearm (subtle swing) */}
            <g transform="translate(12, 20)">
              <motion.g
                animate={noAnim ? {} : { rotate: [-2, 2, -2] }}
                transition={noAnim ? {} : { duration: 4, ease: 'easeInOut', repeat: Infinity }}
              >
                <path
                  d="M0 0 Q7 10 14 18"
                  fill="none"
                  stroke="#ffd5c2"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <circle cx="14" cy="18" r="6" fill="#ffd5c2" />
              </motion.g>
            </g>
          </g>

          {/* ====== LEFT ARM - Stage-dependent ====== */}

          {/* Confused left arm (scratching head — whole arm rotates around shoulder) */}
          <AnimatePresence>
            {stage === 'confused' && (
              <motion.g
                key="arm-confused"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.2 }}
              >
                <motion.g
                  animate={noAnim ? {} : { rotate: [-5, 5, -5] }}
                  transition={noAnim ? {} : { duration: 0.6, ease: 'easeInOut', repeat: Infinity }}
                  style={{ transformBox: 'view-box', transformOrigin: '118px 165px' } as React.CSSProperties}
                >
                  <path
                    d="M118 165 Q110 140 108 120 Q115 90 138 75"
                    fill="none"
                    stroke="#ffd5c2"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <circle cx="138" cy="75" r="6" fill="#ffd5c2" />
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Studying left arm (reaching toward tablet) */}
          <AnimatePresence>
            {stage === 'studying' && (
              <motion.g
                key="arm-studying"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.3 }}
              >
                <g transform="translate(118, 165)">
                  <path
                    d="M0 0 Q0 -18 0 -35"
                    fill="none"
                    stroke="#ffd5c2"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <g transform="translate(0, -35)">
                    <motion.g
                      initial={noAnim ? {} : { rotate: -5 }}
                      animate={noAnim ? {} : { rotate: 0 }}
                      transition={noAnim ? {} : { duration: 0.4, ease: 'easeOut' }}
                    >
                      <path
                        d="M0 0 Q30 3 64 0"
                        fill="none"
                        stroke="#ffd5c2"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />
                      <circle cx="64" cy="0" r="6" fill="#ffd5c2" />
                    </motion.g>
                  </g>
                </g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Transitional arm (tablet stage - arm hanging down) */}
          <AnimatePresence>
            {stage === 'tablet' && (
              <motion.g
                key="arm-tablet"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.3 }}
              >
                <g transform="translate(118, 165)">
                  <path
                    d="M0 0 Q0 11 0 22"
                    fill="none"
                    stroke="#ffd5c2"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <g transform="translate(0, 22)">
                    <path
                      d="M0 0 Q0 9 0 18"
                      fill="none"
                      stroke="#ffd5c2"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <circle cx="0" cy="18" r="6" fill="#ffd5c2" />
                  </g>
                </g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== MOUTH - Stage-dependent ====== */}
          <AnimatePresence mode="wait">
            {stage === 'confused' ? (
              <motion.g
                key="mouth-confused"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.25 }}
              >
                <path
                  d="M140 114 Q146 108 150 114 Q154 120 158 114"
                  fill="none"
                  stroke="#2d3748"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </motion.g>
            ) : (
              <motion.g
                key="mouth-studying"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.25 }}
              >
                <path
                  d="M142 115 Q150 124 158 115"
                  fill="none"
                  stroke="#2d3748"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== QUESTION MARK - Confused only ====== */}
          <AnimatePresence>
            {stage === 'confused' && (
              <motion.g
                key="question-mark"
                initial={noAnim ? {} : { scale: 0, opacity: 0 }}
                animate={
                  noAnim
                    ? {}
                    : {
                        scale: [0, 1.15, 1],
                        opacity: 1,
                        rotate: [-6, 6, -6],
                      }
                }
                exit={noAnim ? {} : { scale: 0, opacity: 0 }}
                transition={
                  noAnim
                    ? {}
                    : {
                        scale: { duration: 0.4, ease: 'easeOut' },
                        rotate: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
                      }
                }
              >
                <text
                  x="155"
                  y="38"
                  textAnchor="middle"
                  fontSize="46"
                  fontWeight="bold"
                  fill="#f26110"
                  fontFamily="Inter, system-ui, -apple-system, sans-serif"
                >
                  ?
                </text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== GLASSES - Studying only ====== */}
          <AnimatePresence>
            {stage === 'studying' && (
              <motion.g
                key="glasses"
                initial={noAnim ? {} : { scale: 0.3, opacity: 0 }}
                animate={noAnim ? {} : { scale: 1, opacity: 1 }}
                exit={noAnim ? {} : { scale: 0.3, opacity: 0 }}
                transition={noAnim ? {} : { type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              >
                {/* Left lens */}
                <circle
                  cx="140"
                  cy="96"
                  r="10"
                  fill="none"
                  stroke="#4a5568"
                  strokeWidth="2.2"
                />
                {/* Right lens */}
                <circle
                  cx="170"
                  cy="96"
                  r="10"
                  fill="none"
                  stroke="#4a5568"
                  strokeWidth="2.2"
                />
                {/* Bridge */}
                <line x1="150" y1="96" x2="160" y2="96" stroke="#4a5568" strokeWidth="2.2" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== TABLET - Tablet & Studying stages ====== */}
          <AnimatePresence>
            {(stage === 'tablet' || stage === 'studying') && (
              <motion.g
                key="tablet"
                initial={noAnim ? {} : { x: 160, opacity: 0 }}
                animate={noAnim ? {} : { x: 0, opacity: 1 }}
                exit={noAnim ? {} : { x: 160, opacity: 0 }}
                transition={
                  noAnim
                    ? {}
                    : {
                        x: { type: 'spring', stiffness: 200, damping: 20, delay: 0.45 },
                        opacity: { duration: 0.35, ease: 'easeOut', delay: 0.45 },
                      }
                }
              >
                {/* Tablet body */}
                <rect x="255" y="80" width="110" height="150" rx="14" fill="#2d3748" />
                {/* Tablet screen */}
                <rect x="263" y="92" width="94" height="126" rx="4" fill="#f0f7ff" />
                {/* Screen glare */}
                <rect
                  x="263"
                  y="92"
                  width="94"
                  height="50"
                  rx="4"
                  fill="url(#tabletGlare)"
                  opacity="0.6"
                />
                {/* Logo */}
                <image
                  href="/logo-horizontal.png"
                  x="272"
                  y="142"
                  width="76"
                  height="13"
                  preserveAspectRatio="xMidYMid meet"
                />
                {/* Decorative content lines */}
                <rect x="275" y="120" width="70" height="4" rx="2" fill="#0069e0" opacity="0.15" />
                <rect x="275" y="167" width="50" height="3" rx="1.5" fill="#535862" opacity="0.12" />
                <rect x="275" y="175" width="62" height="3" rx="1.5" fill="#535862" opacity="0.12" />
                <rect x="275" y="183" width="40" height="3" rx="1.5" fill="#535862" opacity="0.12" />
                {/* Home indicator */}
                <circle cx="310" cy="212" r="3.5" fill="none" stroke="#cbd5e0" strokeWidth="1.2" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== SPARKLES - Studying only ====== */}
          <AnimatePresence>
            {stage === 'studying' && (
              <motion.g
                key="sparkles"
                initial={noAnim ? {} : { scale: 0, opacity: 0 }}
                animate={noAnim ? {} : { scale: 1, opacity: 0.7 }}
                exit={noAnim ? {} : { scale: 0, opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.5, ease: 'easeOut', delay: 0.3 }}
              >
                <motion.g
                  animate={noAnim ? {} : { rotate: [0, 360] }}
                  transition={noAnim ? {} : { duration: 8, ease: 'linear', repeat: Infinity }}
                  style={{ transformOrigin: '197px 87px' }}
                >
                  <path
                    d="M195 85 L197 82 L199 85 L202 87 L199 89 L197 92 L195 89 L192 87 Z"
                    fill="#f26110"
                    opacity="0.6"
                  />
                </motion.g>
                <motion.g
                  animate={noAnim ? {} : { rotate: [-360, 0] }}
                  transition={noAnim ? {} : { duration: 6, ease: 'linear', repeat: Infinity }}
                  style={{ transformOrigin: '241px 111px' }}
                >
                  <path
                    d="M239 108 L241 105 L243 108 L246 110 L243 112 L241 115 L239 112 L236 110 Z"
                    fill="#9552e0"
                    opacity="0.5"
                  />
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ====== DECORATIVE ELEMENTS ====== */}

          {/* Cloud - top left */}
          <motion.g
            animate={noAnim ? {} : { x: [0, 6, 0], y: [0, -3, 0] }}
            transition={noAnim ? {} : { duration: 6, ease: 'easeInOut', repeat: Infinity }}
          >
            <ellipse cx="52" cy="42" rx="22" ry="12" fill="white" opacity="0.7" />
            <ellipse cx="38" cy="46" rx="14" ry="9" fill="white" opacity="0.7" />
            <ellipse cx="66" cy="46" rx="16" ry="9" fill="white" opacity="0.7" />
          </motion.g>

          {/* Cloud - top right */}
          <motion.g
            animate={noAnim ? {} : { x: [0, -5, 0], y: [0, -4, 0] }}
            transition={noAnim ? {} : { duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 1.5 }}
          >
            <ellipse cx="340" cy="55" rx="18" ry="10" fill="white" opacity="0.55" />
            <ellipse cx="328" cy="58" rx="12" ry="7" fill="white" opacity="0.55" />
            <ellipse cx="352" cy="58" rx="13" ry="7" fill="white" opacity="0.55" />
          </motion.g>

          {/* Cloud - middle left */}
          <motion.g
            animate={noAnim ? {} : { x: [0, 4, 0], y: [0, -2, 0] }}
            transition={noAnim ? {} : { duration: 8, ease: 'easeInOut', repeat: Infinity, delay: 3 }}
          >
            <ellipse cx="30" cy="140" rx="15" ry="8" fill="white" opacity="0.45" />
            <ellipse cx="20" cy="143" rx="10" ry="6" fill="white" opacity="0.45" />
            <ellipse cx="40" cy="143" rx="11" ry="6" fill="white" opacity="0.45" />
          </motion.g>

          {/* Small star - top area */}
          <motion.g
            animate={noAnim ? {} : { opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={noAnim ? {} : { duration: 2.5, ease: 'easeInOut', repeat: Infinity }}
            style={{ transformBox: 'view-box', transformOrigin: '280px 30px' }}
          >
            <path
              d="M278 28 L280 24 L282 28 L286 30 L282 32 L280 36 L278 32 L274 30 Z"
              fill="#f6ad55"
              opacity="0.7"
            />
          </motion.g>

          {/* Small star - right area */}
          <motion.g
            animate={noAnim ? {} : { opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
            transition={noAnim ? {} : { duration: 3, ease: 'easeInOut', repeat: Infinity, delay: 0.8 }}
            style={{ transformBox: 'view-box', transformOrigin: '370px 120px' }}
          >
            <path
              d="M368 118 L370 115 L372 118 L375 120 L372 122 L370 125 L368 122 L365 120 Z"
              fill="#9552e0"
              opacity="0.6"
            />
          </motion.g>

          {/* Small star - left area */}
          <motion.g
            animate={noAnim ? {} : { opacity: [0.3, 0.7, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={noAnim ? {} : { duration: 2.8, ease: 'easeInOut', repeat: Infinity, delay: 1.6 }}
            style={{ transformBox: 'view-box', transformOrigin: '75px 85px' }}
          >
            <path
              d="M73 83 L75 80 L77 83 L80 85 L77 87 L75 90 L73 87 L70 85 Z"
              fill="#0069e0"
              opacity="0.5"
            />
          </motion.g>

          {/* Book - bottom right floating */}
          <motion.g
            animate={noAnim ? {} : { y: [0, -6, 0], rotate: [0, 3, 0] }}
            transition={noAnim ? {} : { duration: 5, ease: 'easeInOut', repeat: Infinity }}
            style={{ transformBox: 'view-box', transformOrigin: '340px 250px' }}
          >
            <rect x="320" y="240" width="36" height="28" rx="2" fill="#e05252" />
            <rect x="322" y="242" width="32" height="24" rx="1" fill="#f87171" />
            <line x1="338" y1="242" x2="338" y2="266" stroke="#e05252" strokeWidth="1.5" />
            <rect x="325" y="247" width="10" height="2" rx="1" fill="white" opacity="0.5" />
            <rect x="325" y="252" width="8" height="2" rx="1" fill="white" opacity="0.5" />
            <rect x="341" y="247" width="10" height="2" rx="1" fill="white" opacity="0.5" />
            <rect x="341" y="252" width="8" height="2" rx="1" fill="white" opacity="0.5" />
          </motion.g>

          {/* Pencil - bottom left floating */}
          <motion.g
            animate={noAnim ? {} : { y: [0, -5, 0], rotate: [-5, 5, -5] }}
            transition={noAnim ? {} : { duration: 4.5, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
            style={{ transformBox: 'view-box', transformOrigin: '55px 260px' }}
          >
            <rect x="48" y="240" width="6" height="30" rx="1" fill="#f6ad55" />
            <rect x="48" y="240" width="6" height="6" rx="1" fill="#e8c840" />
            <polygon points="48,270 54,270 51,278" fill="#ffd5c2" />
            <rect x="48" y="238" width="6" height="4" rx="1" fill="#e05252" />
            <line x1="51" y1="246" x2="51" y2="268" stroke="#e8c840" strokeWidth="0.5" opacity="0.5" />
          </motion.g>

          {/* Light bulb - studying stage only */}
          <AnimatePresence>
            {stage === 'studying' && (
              <motion.g
                key="lightbulb"
                initial={noAnim ? {} : { scale: 0, opacity: 0 }}
                animate={noAnim ? {} : { scale: 1, opacity: 1 }}
                exit={noAnim ? {} : { scale: 0, opacity: 0 }}
                transition={noAnim ? {} : { type: 'spring', stiffness: 250, damping: 15, delay: 0.5 }}
              >
                <motion.g
                  animate={noAnim ? {} : { y: [0, -4, 0] }}
                  transition={noAnim ? {} : { duration: 3, ease: 'easeInOut', repeat: Infinity }}
                >
                  <circle cx="220" cy="52" r="12" fill="#fef3c7" stroke="#f6ad55" strokeWidth="1.5" />
                  <path d="M215 48 Q220 42 225 48" fill="none" stroke="#f6ad55" strokeWidth="1" />
                  <line x1="220" y1="64" x2="220" y2="68" stroke="#f6ad55" strokeWidth="1.5" />
                  <line x1="216" y1="65" x2="216" y2="68" stroke="#f6ad55" strokeWidth="1" />
                  <line x1="224" y1="65" x2="224" y2="68" stroke="#f6ad55" strokeWidth="1" />
                  <motion.circle
                    cx="220"
                    cy="52"
                    r="16"
                    fill="#fef3c7"
                    animate={noAnim ? {} : { opacity: [0.15, 0.35, 0.15] }}
                    transition={noAnim ? {} : { duration: 2, ease: 'easeInOut', repeat: Infinity }}
                  />
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Tablet glare gradient */}
          <defs>
            <linearGradient id="tabletGlare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.8" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      </div>

      {/* Logo + Tagline — centered in left panel, aligned with back button */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
        <img src="/logo-horizontal.png" alt="LearnGenie" className="h-7 w-auto" />
        <p className="mt-2 text-sm text-[#535862]">
          开启你的
          <span className="font-medium text-[#0069e0]"> AI 互动学习</span>
          {' '}之旅
        </p>
      </div>
    </div>
  );
}
