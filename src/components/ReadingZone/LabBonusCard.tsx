import { useEffect } from 'react';

/**
 * Inline bonus intro — a brief card shown in the reading panel (same background)
 * instead of a separate full-screen transition, so it doesn't break the flow.
 * Auto-continues to the bonus word after a short beat.
 */
export function LabBonusCard({
  onComplete,
  bgColor = '#FBF1BE',
}: {
  onComplete: () => void;
  bgColor?: string;
}) {
  useEffect(() => {
    const t = window.setTimeout(onComplete, 1800);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="h-full flex items-center justify-center p-6" style={{ background: bgColor }}>
      <div
        className="relative w-full max-w-[420px] rounded-[26px] px-8 py-12 text-center text-white overflow-hidden animate-[fadeIn_0.3s_ease]"
        style={{ background: 'linear-gradient(155deg,#F6C21E,#F2A81C)', boxShadow: '0 18px 44px rgba(230,150,20,.45)' }}
      >
        <span className="absolute top-4 left-5 text-3xl opacity-60">⭐</span>
        <span className="absolute bottom-5 right-6 text-3xl opacity-60">⭐</span>
        <span className="absolute top-6 right-8 text-xl opacity-40">✦</span>
        <div className="font-display text-4xl md:text-5xl font-bold drop-shadow-sm">Bonus round!</div>
        <div className="mt-2 text-lg font-semibold text-white/90">Tricky word time!</div>
      </div>
    </div>
  );
}
