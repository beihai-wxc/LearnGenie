'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Users, Library, Presentation, TrendingUp, CalendarCheck } from 'lucide-react';

const FEATURES = [
  { icon: <Users className="size-6" />, title: 'AI 多智能体课堂', description: '多个 AI 智能体协同教学——教师讲解、助教答疑、同学讨论，让学习不再孤单。', iconBg: 'bg-[#f4ebff] text-[#9552e0]' },
  { icon: <Library className="size-6" />, title: '知识库驱动学习', description: '上传文档或接入知识库，AI 自动提取要点，生成个性化的、有据可依的课程内容。', iconBg: 'bg-[#e5f6ff] text-[#0069e0]' },
  { icon: <Presentation className="size-6" />, title: '互动式课件生成', description: '从一段描述或一份 PDF 出发，一键生成包含幻灯片、测验和白板的完整课堂。', iconBg: 'bg-[#fff9e0] text-[#bb9915]' },
  { icon: <TrendingUp className="size-6" />, title: '学习画像与追踪', description: '每一次学习都会更新你的专属学习画像，让 AI 越来越懂你，课程越来越精准。', iconBg: 'bg-[#fff2eb] text-[#f26110]' },
  { icon: <CalendarCheck className="size-6" />, title: '个性化学习规划', description: 'AI 根据你的学习画像和薄弱环节，自动生成专属学习路径和每日任务，循序渐进达成目标。', iconBg: 'bg-[#d3f6e3] text-[#0d9e6b]' },
];

const CARD_W = 340;
const GAP = 24;
const TOTAL_X = (FEATURES.length - 1) * (CARD_W + GAP);
const AUTO_PX_PER_SEC = 50; // slow auto-scroll

export function LandingFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef(0);      // current auto-scroll position
  const lastTime = useRef(0);
  const [isInView, setIsInView] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const titleOp = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  // Scroll progress maps to -TOTAL_X range
  const scrollX = useTransform(scrollYProgress, [0, 1], [0, -TOTAL_X]);

  // Auto-scroll motion value
  const autoX = useMotionValue(0);

  // Combined: go as far as the further of scroll-driven or auto-scroll
  const combinedX = useMotionValue(0);
  useEffect(() => {
    const unsub1 = scrollX.on('change', (v) => {
      const cur = autoX.get();
      combinedX.set(Math.min(v, -cur));
    });
    const unsub2 = autoX.on('change', (cur) => {
      const sv = scrollX.get();
      combinedX.set(Math.min(sv, -cur));
    });
    return () => { unsub1(); unsub2(); };
  }, [scrollX, autoX, combinedX]);

  // Spring smooths the combined position
  const x = useSpring(combinedX, { stiffness: 50, damping: 25 });

  // Auto-scroll loop when section is in view
  useEffect(() => {
    if (!isInView) return;
    let raf: number;
    const tick = (t: number) => {
      if (lastTime.current === 0) lastTime.current = t;
      const dt = Math.min(t - lastTime.current, 200); // cap at 200ms
      lastTime.current = t;
      const current = autoX.get();
      const next = Math.min(current + (AUTO_PX_PER_SEC * dt) / 1000, TOTAL_X);
      autoX.set(next);
      autoRef.current = next;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTime.current = 0;
    };
  }, [isInView, autoX]);

  // Observe when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsInView(e.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Wheel accelerates auto-scroll beyond the scroll-driven position
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const current = autoX.get();
    const boost = e.deltaY * 1.2;
    const next = Math.max(0, Math.min(current + boost, TOTAL_X));
    autoX.set(next);
  }, [autoX]);

  return (
    <section ref={sectionRef} className="relative bg-white" style={{ height: '300vh' }}>
      <div
        className="sticky top-0 flex flex-col items-center justify-center overflow-hidden h-screen"
        onWheel={handleWheel}
      >
        <motion.div style={{ opacity: titleOp }} className="text-center mb-8 shrink-0">
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            为什么选择 LearnGenie
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            不只是内容生成，而是完整的互动学习体验
          </p>
        </motion.div>

        <div className="relative w-full overflow-hidden">
          <motion.div style={{ x }} className="flex gap-6 px-[calc(50vw-170px)]">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group shrink-0 rounded-[32px] bg-[#fafdff] p-10 transition-all duration-300 hover:-translate-y-1"
                style={{ width: CARD_W, boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
              >
                <div className={`mb-6 inline-flex size-12 items-center justify-center rounded-[16px] ${f.iconBg}`}>{f.icon}</div>
                <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">{f.title}</h3>
                <p className="text-[14px] leading-[1.5] text-[#535862]">{f.description}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div style={{ opacity: titleOp }} className="mt-8 flex items-center gap-2 text-sm text-[#93979f]">
          <span>滚动查看更多</span>
          <svg className="size-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l7 7 7-7" /></svg>
        </motion.div>
      </div>
    </section>
  );
}
