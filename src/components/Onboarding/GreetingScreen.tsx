import { useEffect } from 'react';
import { FloatingDecorations } from './FloatingDecorations';

interface GreetingScreenProps {
  onContinue: () => void;
  headline?: string;
}

/**
 * Opening welcome splash: the mascot is the hero, appearing from the bottom
 * with only its upper body visible. Tap anywhere to continue; also
 * auto-advances after a short beat.
 */
export function GreetingScreen({ onContinue, headline = 'Hey there!!' }: GreetingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onContinue, 2400);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <button
      onClick={onContinue}
      className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col items-center cursor-pointer"
    >
      <FloatingDecorations />

      <div className="relative z-10 flex flex-col items-center px-6 pt-[15vh] text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-[#111] leading-[1.05]">
          {headline}
        </h1>
        <p className="mt-5 text-[#9a9a9a] text-sm md:text-base font-medium animate-pulse">
          tap anywhere to start
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-[12%] w-[min(78vw,380px)] animate-[float_4.5s_ease-in-out_infinite]">
        <img
          src="/assets/decorations/bloxie.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-auto"
        />
      </div>
    </button>
  );
}
