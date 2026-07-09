import { useCallback, useRef, useState } from 'react';
import { BuildingZone } from './BuildingZone/BuildingZone';
import { usePartSystem } from '../hooks/usePartSystem';

/**
 * ReadingLabGame — prototype of the "Reading Lab" approach.
 *
 * LEFT  = new reading panel, ported from the HTML mockup (3-tier kind marking +
 *         animated sound-it-out + high-contrast word).
 * RIGHT = the REAL BuildingZone, unchanged, driven by the real usePartSystem —
 *         so "nailed"/"a little help" award actual character parts to drag in.
 *
 * View it at /#lab (wired in App.tsx) without disturbing the normal flow.
 */

const WORDS = ['cat', 'go', 'kit', 'dog'];
const PATTERN = 'c · o · k · g';

export function ReadingLabGame() {
  const parts = usePartSystem('robot');

  const [idx, setIdx] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const toastTimer = useRef<number | null>(null);

  const finished = idx >= WORDS.length;
  const word = WORDS[idx] ?? '';

  const say = useCallback((text: string, rate = 0.85) => {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch {
      /* no-op */
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  // Sound it out: highlight + speak each grapheme, then the whole word
  const soundOut = useCallback(() => {
    if (!word) return;
    let i = 0;
    const step = () => {
      if (i < word.length) {
        setLit(i);
        say(word[i], 0.8);
        i++;
        window.setTimeout(step, 650);
      } else {
        setLit(null);
        window.setTimeout(() => say(word, 0.75), 200);
      }
    };
    step();
  }, [word, say]);

  const onMark = (mark: 'retry' | 'help' | 'nailed') => {
    if (mark === 'retry') {
      showToast("No worries — let's read it again together 💛");
      soundOut();
      return;
    }
    // nailed / help → award a real building part and advance
    parts.awardParts('phonics');
    showToast(mark === 'nailed' ? 'Nailed it! New part earned →' : 'Nice try! New part earned →');
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setIdx(0);
    setLit(null);
    parts.resetPartSystem();
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row gap-3 p-3 bg-[linear-gradient(160deg,#F3F4EF,#E9EAE2)] overflow-hidden">
      {/* ---------------- LEFT: Reading panel (from mockup) ---------------- */}
      <section className="md:w-[46%] rounded-[26px] shadow-[0_10px_30px_rgba(60,50,20,.10)] p-6 flex flex-col bg-[linear-gradient(180deg,#FBF1BE,#F6E7A0)] text-[#2B2A32]">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <span className="bg-white/70 border border-black/5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-[#6E6A7C]">
            Pattern: <b className="text-[#19A7A0]">{PATTERN}</b>
          </span>
          <div className="flex items-center gap-1.5">
            {WORDS.map((_, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: i < idx ? '#2FBF71' : i === idx ? '#19A7A0' : 'rgba(0,0,0,.13)' }}
              />
            ))}
          </div>
        </div>

        {finished ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="font-display text-4xl">All words done! ✨</div>
            <p className="text-[#6E6A7C] font-medium">Finish building your buddy on the right.</p>
            <button
              onClick={restart}
              className="bg-white rounded-full px-6 py-3 font-semibold shadow-[0_4px_14px_rgba(60,50,20,.10)]"
            >
              ↺ Start again
            </button>
          </div>
        ) : (
          <>
            {/* Stage */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3">
              <button
                onClick={() => say(word)}
                aria-label="Hear the word"
                className="w-[70px] h-[70px] rounded-full bg-white shadow-[0_10px_30px_rgba(60,50,20,.10)] text-3xl grid place-items-center active:scale-90 transition"
              >
                🔊
              </button>

              <div
                className="font-display flex select-none"
                style={{ fontSize: 'clamp(56px,10vw,108px)', letterSpacing: '0.06em', lineHeight: 1, gap: '0.04em' }}
              >
                {word.split('').map((c, i) => (
                  <span
                    key={i}
                    className="rounded-xl transition-all duration-200"
                    style={
                      lit === i
                        ? { background: '#19A7A0', color: '#fff', transform: 'translateY(-6px)', padding: '0 0.04em' }
                        : { padding: '0 0.04em' }
                    }
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-1.5 h-2">
                {word.split('').map((_, i) => (
                  <span
                    key={i}
                    className="h-2 rounded-md transition-all duration-200"
                    style={{
                      width: 46,
                      background: lit === i ? '#19A7A0' : '#4C9BF5',
                      transform: lit === i ? 'scaleY(1.7)' : 'none',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={soundOut}
                className="mt-2 bg-white border border-black/5 rounded-full px-5 py-2.5 font-semibold shadow-[0_4px_14px_rgba(60,50,20,.10)] active:translate-y-px"
              >
                🐢 Sound it out
              </button>
            </div>

            {/* Grown-up marking */}
            <div>
              <div className="text-[13px] text-[#6E6A7C] text-center mb-2.5 font-medium">
                👀 Grown-up: tap how the reading went
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => onMark('retry')}
                  className="rounded-[18px] py-3.5 px-2 text-white font-semibold leading-tight shadow-[0_10px_30px_rgba(60,50,20,.10)] active:translate-y-0.5"
                  style={{ background: '#5B93E8' }}
                >
                  Let's try
                  <br />
                  together
                </button>
                <button
                  onClick={() => onMark('help')}
                  className="rounded-[18px] py-3.5 px-2 text-white font-semibold leading-tight shadow-[0_10px_30px_rgba(60,50,20,.10)] active:translate-y-0.5"
                  style={{ background: '#F6A623' }}
                >
                  A little
                  <br />
                  help
                </button>
                <button
                  onClick={() => onMark('nailed')}
                  className="rounded-[18px] py-3.5 px-2 text-white font-semibold leading-tight shadow-[0_10px_30px_rgba(60,50,20,.10)] active:translate-y-0.5"
                  style={{ background: '#2FBF71' }}
                >
                  Nailed it! 🎉
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------------- RIGHT: real BuildingZone (unchanged) ---------------- */}
      <section className="flex-1 min-h-0 rounded-[26px] overflow-hidden bg-[#FBFAF6] shadow-[0_10px_30px_rgba(60,50,20,.10)]">
        <BuildingZone
          parts={parts.awardedParts}
          onPartMove={parts.movePart}
          onPartPlace={parts.placePart}
          onPartUnplace={parts.unplacePart}
          onEndSession={() => showToast('Session ended')}
          onResetModel={parts.resetPartSystem}
          isSoundMuted={muted}
          onToggleMute={setMuted}
          upcomingParts={parts.getUpcomingForCurrentFamily()}
        />
      </section>

      {/* Toast */}
      <div
        className="fixed left-1/2 bottom-6 z-40 bg-[#2B2A32] text-white px-5 py-3 rounded-2xl font-semibold transition-all"
        style={{
          transform: `translateX(-50%) translateY(${toast ? 0 : 20}px)`,
          opacity: toast ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        {toast}
      </div>
    </div>
  );
}
