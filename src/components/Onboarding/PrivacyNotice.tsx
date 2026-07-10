import { useEffect, useState } from 'react';
import { BloxieCharacter } from '../ui/BloxieCharacter';

interface PrivacyNoticeProps {
  onAccept: () => void;
}

/** Bloxie "speaks" these in turn, so the privacy message feels friendly. */
const MESSAGES = [
  <>
    This app saves your child’s name and reading level on{' '}
    <strong className="font-bold text-[#111]">this device only</strong>
  </>,
  <>We never see or store any of your child’s data.</>,
];

const SPEAK_MS = 3000;

export function PrivacyNotice({ onAccept }: PrivacyNoticeProps) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % MESSAGES.length), SPEAK_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <h1 className="font-display text-[clamp(30px,6vw,56px)] font-bold text-[#111] text-center leading-tight">
        Welcome to Bloxie
      </h1>

      {/* Bloxie + speech bubble */}
      <div className="mt-8 flex items-center justify-center gap-3 md:gap-4">
        <BloxieCharacter className="w-[130px] md:w-[160px] h-auto flex-shrink-0" />

        <div className="relative bg-[#f7f7f7] border-2 border-[#d9d9d9] rounded-2xl px-5 py-4 max-w-[280px] self-start mt-2">
          {/* tail pointing at bloxie */}
          <span className="absolute -left-[9px] top-9 w-4 h-4 bg-[#f7f7f7] border-l-2 border-b-2 border-[#d9d9d9] rotate-45" />
          <p
            key={i}
            className="text-[15px] leading-relaxed text-[#3a3a3a] animate-[fadeIn_0.4s_ease]"
          >
            {MESSAGES[i]}
          </p>
        </div>
      </div>

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
  );
}
