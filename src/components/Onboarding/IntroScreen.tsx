import { useEffect, useState } from 'react';
import { BloxieCharacter } from '../ui/BloxieCharacter';

interface IntroScreenProps {
  onAccept: () => void;
}

/**
 * Intro — two phases in one screen so Bloxie animates continuously:
 *
 *  1. 'blank'   → empty white for a beat (Bloxie waits off-screen)
 *  2. 'peek'    → he rises up from the bottom edge and introduces himself
 *  3. 'settled' → he shrinks into place while "Welcome to Bloxie" + the
 *                 privacy message resolve around him
 *
 * Because it's the same element throughout, the shrink-into-place is a single
 * smooth transform rather than a jarring route change.
 */

const MESSAGES = [
  <>
    This app saves your child’s name and reading level on{' '}
    <strong className="font-bold text-[#111]">this device only</strong>
  </>,
  <>We never see or store any of your child’s data.</>,
];

const BLANK_MS = 2000; // nothing on screen
const PEEK_MS = 3400; // how long he chats before settling

type Phase = 'blank' | 'peek' | 'settled';

const TRANSFORMS: Record<Phase, string> = {
  blank: 'translateY(85vh) scale(2.3)',
  peek: 'translateY(38vh) scale(2.3)',
  settled: 'translateY(0) scale(1)',
};

export function IntroScreen({ onAccept }: IntroScreenProps) {
  const [phase, setPhase] = useState<Phase>('blank');
  const [msg, setMsg] = useState(0);

  // blank → peek → settled (tap anywhere to skip ahead)
  useEffect(() => {
    const a = window.setTimeout(() => setPhase('peek'), BLANK_MS);
    const b = window.setTimeout(() => setPhase('settled'), BLANK_MS + PEEK_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  // Bloxie keeps talking once he's settled
  useEffect(() => {
    if (phase !== 'settled') return;
    const t = window.setInterval(() => setMsg((n) => (n + 1) % MESSAGES.length), 3000);
    return () => window.clearInterval(t);
  }, [phase]);

  const settled = phase === 'settled';

  return (
    <div
      onClick={() => (phase === 'peek' ? setPhase('settled') : undefined)}
      className="min-h-screen w-full bg-white relative overflow-hidden flex flex-col items-center justify-center px-6 py-10"
    >
      {/* Phase 2 greeting — fades out as he settles */}
      <div
        className={`absolute top-[16vh] text-center px-6 transition-all duration-500 ${
          phase === 'peek' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
        }`}
      >
        <h1 className="font-display text-[clamp(34px,7vw,60px)] font-bold text-[#111]">Hey there!</h1>
        <p className="mt-3 text-[#666] text-base md:text-lg max-w-[420px] mx-auto">
          I’m Bloxie — I’ll be guiding you and your child along the way.
        </p>
      </div>

      {/* Phase 3 heading */}
      <h1
        className={`font-display text-[clamp(30px,6vw,56px)] font-bold text-[#111] text-center leading-tight transition-all duration-700 delay-200 ${
          settled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        Welcome to Bloxie
      </h1>

      {/* Bloxie + his bubble — Bloxie is the SAME element in every phase */}
      <div className="mt-8 flex items-center justify-center gap-3 md:gap-4">
        <div
          className="flex-shrink-0 will-change-transform"
          style={{
            transform: TRANSFORMS[phase],
            transition: 'transform 1000ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <BloxieCharacter className="w-[130px] md:w-[160px] h-auto" />
        </div>

        <div
          className={`relative bg-[#f7f7f7] border-2 border-[#d9d9d9] rounded-2xl px-5 py-4 max-w-[280px] self-start mt-2 transition-all duration-500 delay-500 ${
            settled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 pointer-events-none'
          }`}
        >
          <span className="absolute -left-[9px] top-9 w-4 h-4 bg-[#f7f7f7] border-l-2 border-b-2 border-[#d9d9d9] rotate-45" />
          <p key={msg} className="text-[15px] leading-relaxed text-[#3a3a3a] animate-[fadeIn_0.4s_ease]">
            {MESSAGES[msg]}
          </p>
        </div>
      </div>

      {/* Privacy line + CTA */}
      <div
        className={`flex flex-col items-center transition-all duration-700 delay-[600ms] ${
          settled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <p className="mt-10 text-center text-lg md:text-xl font-bold text-[#111] max-w-[640px]">
          Only set this up on a private family device, not a shared one
        </p>
        <button
          onClick={onAccept}
          className="mt-7 px-12 py-3.5 rounded-full bg-[#111] text-white font-semibold text-lg transition-all hover:bg-black hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        >
          Lets begin
        </button>
      </div>
    </div>
  );
}
