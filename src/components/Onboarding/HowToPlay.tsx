import { useEffect, useState } from 'react';
import { BloxieCharacter } from '../ui/BloxieCharacter';

interface HowToPlayProps {
  childName: string;
  onStart: () => void;
}

/**
 * "How to play" — a one-time coach mark for the grown-up, shown before their
 * first game. Parents often don't know their role, so this acts it out:
 * a word appears → you sound it out together → your child says it back →
 * you tap how it went → Bloxie earns a part. The parent-and-kid illustration
 * is the anchor; dialogue bubbles play in sequence over the top.
 *
 * Auto-advances, but tapping anywhere jumps to the next beat. The final beat
 * reveals the "Start reading" button.
 */

type Beat = {
  /** Caption under the scene explaining what's happening. */
  caption: React.ReactNode;
  /** Speech from the grown-up (left figure), if any. */
  parent?: string;
  /** Speech from the child (right figure), if any. */
  child?: string;
  /** Show the earned building part dropping in + Bloxie cheering. */
  reward?: boolean;
};

const BEAT_MS = 3200;

export function HowToPlay({ childName, onStart }: HowToPlayProps) {
  const name = childName || 'your child';

  const BEATS: Beat[] = [
    {
      caption: (
        <>
          A word pops up on screen — with dots showing each{' '}
          <strong className="font-bold text-[#111]">sound</strong>.
        </>
      ),
    },
    {
      caption: <>Say it out loud together, sound by sound.</>,
      parent: 's — a — t … sat!',
    },
    {
      caption: (
        <>
          Then let <strong className="font-bold text-[#111]">{name}</strong> say it back to you.
        </>
      ),
      child: 'sat!',
    },
    {
      caption: <>Tap how it went. Every read earns a building part!</>,
      parent: 'You nailed it! 🎉',
      reward: true,
    },
    {
      caption: (
        <>
          That’s the whole game — <strong className="font-bold text-[#111]">read words</strong>,{' '}
          earn parts, and build your Bloxie together.
        </>
      ),
      reward: true,
    },
  ];

  const [i, setI] = useState(0);
  const last = i >= BEATS.length - 1;
  const beat = BEATS[i];

  useEffect(() => {
    if (last) return;
    const t = window.setTimeout(() => setI((n) => n + 1), BEAT_MS);
    return () => window.clearTimeout(t);
  }, [i, last]);

  const next = () => {
    if (!last) setI((n) => n + 1);
  };

  return (
    <div
      onClick={next}
      className="h-dvh w-full bg-white relative overflow-x-hidden overflow-y-auto"
    >
      <div className="min-h-full w-full flex flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-5">
      {/* Eyebrow */}
      <p className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#9a9a9a]">
        How to play
      </p>

      {/* Heading */}
      <h1 className="mt-1.5 font-display text-[clamp(22px,3.8vw,30px)] font-bold text-[#111] text-center leading-tight [text-wrap:balance] max-w-[420px]">
        You and {name}, side by side
      </h1>

      {/* The scene: illustration + speech bubbles + a word card + Bloxie.
          Sized to ~70% and pulled up closer to the heading. */}
      <div className="relative w-full max-w-[392px] mt-2 shrink-0">
        {/* Word card floating above the pair */}
        <div
          className={`absolute right-0 top-2 z-20 transition-all duration-150 ${
            i === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="bg-white border-2 border-[#ececec] rounded-2xl shadow-[0_10px_24px_-12px_rgba(0,0,0,0.3)] px-7 py-3">
            <span className="font-display text-[34px] font-bold text-[#111] tracking-[3px]">
              sat
            </span>
            <span className="flex justify-center gap-[10px] mt-1">
              <i className="w-[6px] h-[6px] rounded-full bg-[#4A90D9]" />
              <i className="w-[6px] h-[6px] rounded-full bg-[#4A90D9]" />
              <i className="w-[6px] h-[6px] rounded-full bg-[#4A90D9]" />
            </span>
          </div>
        </div>

        {/* Grown-up bubble (upper-left) */}
        <Bubble side="left" show={!!beat.parent} tone="grown">
          {beat.parent}
        </Bubble>

        {/* Child bubble (upper-right) */}
        <Bubble side="right" show={!!beat.child} tone="child">
          {beat.child}
        </Bubble>

        {/* Illustration */}
        <img
          src={`${import.meta.env.BASE_URL}assets/decorations/parent-and-kid.svg`}
          alt="A grown-up and a child reading together"
          className="w-full h-auto select-none pointer-events-none"
          draggable={false}
        />

        {/* Bloxie stands next to the child the whole time. */}
        <div className="absolute left-[60%] bottom-0 z-20 flex flex-col items-center">
          <BloxieCharacter className="w-[76px] md:w-[92px] h-auto" />
        </div>
      </div>

      {/* Caption */}
      <p
        key={i}
        className="mt-4 text-center text-[#3a3a3a] text-base md:text-lg max-w-[460px] min-h-[3rem] animate-[fadeIn_0.4s_ease]"
      >
        {beat.caption}
      </p>

      {/* Progress dots */}
      <div className="mt-3 flex gap-2">
        {BEATS.map((_, n) => (
          <span
            key={n}
            className={`h-2 rounded-full transition-all duration-300 ${
              n === i ? 'w-6 bg-[#111]' : 'w-2 bg-[#dcdcdc]'
            }`}
          />
        ))}
      </div>

      {/* CTA (only on the last beat) / hint to tap */}
      <div className="mt-5 h-[52px] flex items-center">
        {last ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="px-14 py-4 rounded-full bg-[#111] text-white font-bold text-lg transition-all hover:bg-black hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] active:scale-[0.98]"
          >
            Start reading
          </button>
        ) : (
          <span className="text-sm text-[#b0b0b0]">Tap to continue</span>
        )}
      </div>
      </div>
    </div>
  );
}

/** A rounded speech bubble that fades/pops in, with a little tail. */
function Bubble({
  side,
  show,
  tone,
  children,
}: {
  side: 'left' | 'right';
  show: boolean;
  tone: 'grown' | 'child';
  children: React.ReactNode;
}) {
  const palette =
    tone === 'grown'
      ? 'bg-[#f2f6fb] border-[#cfe0f0] text-[#1c3a57]'
      : 'bg-[#fff0f4] border-[#f6c9d6] text-[#7a2440]';

  // The grown-up is drawn headless with a "?" over the neck (~x40%/y22%); anchor
  // the bubble there, above the shoulders. The child's head sits lower and far
  // right (~x83%/y58%), so her bubble drops down beside it.
  const place =
    side === 'left' ? 'top-[9%] left-[30%]' : 'top-[38%] right-[1%]';

  return (
    <div
      className={`absolute z-20 ${place} transition-all duration-400 ${
        show
          ? 'opacity-100 scale-100 translate-y-0 delay-150'
          : 'opacity-0 scale-90 translate-y-1 delay-0 pointer-events-none'
      }`}
    >
      <div
        className={`relative border-2 rounded-2xl px-4 py-2.5 max-w-[190px] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.35)] ${palette}`}
      >
        <p className="text-[15px] font-semibold leading-snug">{children}</p>
        {/* tail */}
        <span
          className={`absolute -bottom-[7px] w-3.5 h-3.5 rotate-45 border-b-2 border-r-2 ${
            tone === 'grown' ? 'bg-[#f2f6fb] border-[#cfe0f0]' : 'bg-[#fff0f4] border-[#f6c9d6]'
          } ${side === 'left' ? 'left-7' : 'right-7'}`}
        />
      </div>
    </div>
  );
}
