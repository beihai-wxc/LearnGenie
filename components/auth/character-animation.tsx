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

          {/* Confused left arm (scratching head — upper arm static, forearm pivots at elbow) */}
          <AnimatePresence>
            {stage === 'confused' && (
              <motion.g
                key="arm-confused"
                initial={noAnim ? {} : { opacity: 0 }}
                animate={noAnim ? {} : { opacity: 1 }}
                exit={noAnim ? {} : { opacity: 0 }}
                transition={noAnim ? {} : { duration: 0.2 }}
              >
                <g transform="translate(118, 165)">
                  {/* Upper arm: shoulder → elbow (fixed) */}
                  <path
                    d="M0 0 Q-4 -21 -8 -42"
                    fill="none"
                    stroke="#ffd5c2"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  {/* Forearm: elbow → hand (rotates to scratch around elbow pivot) */}
                  <g transform="translate(-8, -42)">
                    <motion.g
                      animate={noAnim ? {} : { rotate: [-15, 15, -15] }}
                      transition={noAnim ? {} : { duration: 0.75, ease: 'easeInOut', repeat: Infinity }}
                    >
                      <path
                        d="M0 0 Q14 -26 32 -53"
                        fill="none"
                        stroke="#ffd5c2"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />
                      <circle cx="32" cy="-53" r="6" fill="#ffd5c2" />
                    </motion.g>
                  </g>
                </g>
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
                        exit: { duration: 0.35, ease: 'easeIn' },
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

      {/* Tagline */}
      <div className="absolute bottom-12 left-8 right-8 text-center">
        <p className="text-sm leading-relaxed text-[#535862]">
          开启你的
          <span className="font-medium text-[#0069e0]"> AI 互动学习</span>
          {' '}之旅
        </p>
      </div>
    </div>
  );
}
