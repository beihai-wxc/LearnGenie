'use client';

export function AuthDecoration() {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ebf5ff] to-white">
      {/* Floating book 1 */}
      <div
        className="absolute left-[20%] top-[30%]"
        style={{ animation: 'auth-float 6s ease-in-out infinite' }}
      >
        <svg width="80" height="64" viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 4h48l16 8v44l-16-8H8V4z" fill="#e5f6ff" stroke="#0069e0" strokeWidth="1.5" />
          <path d="M56 4v52" stroke="#0069e0" strokeWidth="1" opacity="0.5" />
          <line x1="18" y1="16" x2="48" y2="16" stroke="#0069e0" strokeWidth="1" opacity="0.3" />
          <line x1="18" y1="24" x2="44" y2="24" stroke="#0069e0" strokeWidth="1" opacity="0.3" />
          <line x1="18" y1="32" x2="40" y2="32" stroke="#0069e0" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Floating book 2 */}
      <div
        className="absolute right-[25%] top-[35%]"
        style={{ animation: 'auth-float 5s ease-in-out infinite 1.5s' }}
      >
        <svg width="70" height="56" viewBox="0 0 70 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3h42l14 7v39l-14-7H6V3z" fill="#f4ebff" stroke="#9552e0" strokeWidth="1.5" />
          <path d="M48 3v46" stroke="#9552e0" strokeWidth="1" opacity="0.5" />
          <line x1="14" y1="14" x2="42" y2="14" stroke="#9552e0" strokeWidth="1" opacity="0.3" />
          <line x1="14" y1="21" x2="38" y2="21" stroke="#9552e0" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Floating book 3 */}
      <div
        className="absolute left-[40%] top-[55%]"
        style={{ animation: 'auth-float 7s ease-in-out infinite 2.5s' }}
      >
        <svg width="64" height="50" viewBox="0 0 64 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 2h38l12 6v36l-12-6H5V2z" fill="#fff9e0" stroke="#bb9915" strokeWidth="1.5" />
          <path d="M43 2v42" stroke="#bb9915" strokeWidth="1" opacity="0.5" />
          <line x1="12" y1="12" x2="38" y2="12" stroke="#bb9915" strokeWidth="1" opacity="0.3" />
          <line x1="12" y1="19" x2="34" y2="19" stroke="#bb9915" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Lightbulb */}
      <div
        className="absolute right-[20%] top-[55%]"
        style={{ animation: 'auth-float 6s ease-in-out infinite 3s' }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#bb9915" strokeWidth="1.2">
          <path d="M9.5 14.5v-3a2.5 2.5 0 115 0v3" />
          <path d="M9.5 16.5h5v2.5a1 1 0 01-1 1h-3a1 1 0 01-1-1v-2.5z" />
          <circle cx="12" cy="6.5" r="0.8" fill="#bb9915" stroke="none" />
          <circle cx="9" cy="5" r="0.6" fill="#bb9915" stroke="none" />
          <circle cx="15" cy="5" r="0.6" fill="#bb9915" stroke="none" />
        </svg>
      </div>

      {/* Sparkles */}
      <div
        className="absolute left-[15%] bottom-[25%]"
        style={{ animation: 'auth-float 4.5s ease-in-out infinite 2s' }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f26110" strokeWidth="1.2">
          <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
        </svg>
      </div>

      {/* Pencil */}
      <div
        className="absolute right-[15%] bottom-[30%]"
        style={{ animation: 'auth-float 6.5s ease-in-out infinite 1s' }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#535862" strokeWidth="1.2" strokeLinecap="round">
          <path d="M13.5 4.5l-9.5 9.5L2 22l8-2 9.5-9.5-6-6z" />
          <line x1="16" y1="2.5" x2="21.5" y2="8" />
        </svg>
      </div>

      {/* Dots */}
      <div className="absolute left-[10%] top-[20%] size-2 rounded-full bg-[#0069e0] opacity-30" style={{ animation: 'auth-float 3s ease-in-out infinite 0.5s' }} />
      <div className="absolute left-[60%] top-[15%] size-1.5 rounded-full bg-[#9552e0] opacity-30" style={{ animation: 'auth-float 4s ease-in-out infinite 1.5s' }} />
      <div className="absolute right-[10%] bottom-[20%] size-2 rounded-full bg-[#f26110] opacity-25" style={{ animation: 'auth-float 3.5s ease-in-out infinite 2.5s' }} />

      {/* Tagline */}
      <div className="absolute bottom-12 left-8 right-8 text-center">
        <p className="text-[#535862] text-sm leading-relaxed">
          开启你的
          <span className="text-[#0069e0] font-medium"> AI 互动学习</span>
          {' '}之旅
        </p>
      </div>

      <style>{`
        @keyframes auth-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(-2px) rotate(-1deg); }
          75% { transform: translateY(-12px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}
