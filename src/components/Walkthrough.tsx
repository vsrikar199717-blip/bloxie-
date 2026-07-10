import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Spotlight walkthrough shown over the real dashboard the first time a child
 * plays. Each step highlights a real element (via [data-tour="…"]) and explains
 * it in place — so parents and kids learn on the actual UI, not a separate guide.
 */

export interface TourStep {
  target: string; // data-tour value; '' = centred, no spotlight
  title: string;
  body: string;
}

const PAD = 8;
const TIP_W = 330;
const TIP_H = 190;

export function Walkthrough({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[i];
  const isLast = i === steps.length - 1;

  // Measure the highlighted element (and re-measure on resize)
  useLayoutEffect(() => {
    const measure = () => {
      if (!step.target) return setRect(null);
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      const r = el?.getBoundingClientRect();
      // Ignore hidden/zero-size targets (e.g. the build zone behind a mobile tab)
      setRect(r && r.width > 0 && r.height > 0 ? r : null);
    };
    measure();
    const t = window.setTimeout(measure, 60); // after any layout settle
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [step]);

  // Escape skips the tour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDone();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  // Tooltip placement: under the target if there's room, else above; else centred
  let tipStyle: React.CSSProperties;
  if (rect) {
    const below = rect.bottom + 16;
    const fitsBelow = below + TIP_H < window.innerHeight;
    const top = fitsBelow ? below : Math.max(12, rect.top - 16 - TIP_H);
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - TIP_W / 2),
      window.innerWidth - TIP_W - 12
    );
    tipStyle = { top, left, width: TIP_W };
  } else {
    tipStyle = {
      top: '50%',
      left: '50%',
      width: TIP_W,
      transform: 'translate(-50%, -50%)',
    };
  }

  return (
    <>
      {/* Blocks interaction with the app underneath */}
      <div className="fixed inset-0 z-[9998]" />

      {/* Spotlight — the box-shadow dims everything except this rect */}
      {rect ? (
        <div
          className="fixed z-[9999] pointer-events-none rounded-2xl transition-all duration-300"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(17,17,17,0.66)',
            border: '3px solid #fff',
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[9999] pointer-events-none bg-[rgba(17,17,17,0.66)]" />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white rounded-2xl shadow-2xl p-5 animate-[fadeIn_0.25s_ease]"
        style={tipStyle}
      >
        <div className="text-xs font-bold tracking-wider text-[#19A7A0] mb-1">
          STEP {i + 1} OF {steps.length}
        </div>
        <div className="font-display text-xl text-[#111] mb-1.5">{step.title}</div>
        <p className="text-[15px] leading-relaxed text-[#555]">{step.body}</p>

        <div className="flex items-center justify-between mt-4">
          <button onClick={onDone} className="text-sm font-semibold text-[#999] hover:text-[#555]">
            Skip
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button
                onClick={() => setI((n) => n - 1)}
                className="px-4 py-2 rounded-full border-2 border-[#e6e6e6] text-sm font-bold text-[#111]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onDone() : setI((n) => n + 1))}
              className="px-5 py-2 rounded-full bg-[#111] text-white text-sm font-bold active:scale-95"
            >
              {isLast ? "Let's play!" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
