import { useCallback, useState } from 'react';
import { ReadingGuide } from '../ui/ReadingGuide';
import type { WordSegment, WordStatus } from '../../types';
import type { ReadingAids, Theme } from '../../types/profile';

/**
 * LabWordPanel — reading panel, redesigned for more reading space.
 *
 * Layout: theme avatar + game progress path on top · big word centre with
 * ‹ › word nav · black "how it went" pills bottom-left · Bloxie encouragement
 * mascot bottom-right. Wired to the real session data, so story/bonus/summary/
 * aids still route through ReadingZone. Lightbox removed (kept ruler + tip).
 */

interface LabWordPanelProps {
  word: string;
  teachingTip: string;
  segments?: WordSegment[];
  isBonus: boolean;
  pattern?: string;
  wordNumber: number;
  totalWords: number;
  readingAids: ReadingAids;
  visualPhonemeMarking: boolean;
  onCorrect: (status: WordStatus) => void;
  onSkip: () => void;
  onGoBack: () => void;
  onSpeak: () => void;
  profileName: string;
  theme?: Theme;
  onChangeTheme?: (theme: Theme) => void;
  onOpenSettings?: () => void;
  bgColor?: string;
}

const THEMES: Theme[] = ['robot', 'mystical', 'monster'];

export function LabWordPanel({
  word,
  teachingTip,
  segments,
  isBonus,
  wordNumber,
  totalWords,
  readingAids,
  visualPhonemeMarking,
  onCorrect,
  onSkip,
  onGoBack,
  onSpeak,
  profileName,
  theme = 'robot',
  onChangeTheme,
  onOpenSettings,
  bgColor = '#FBF1BE',
}: LabWordPanelProps) {
  const [lit, setLit] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [bubble, setBubble] = useState(`Hey ${profileName}!`);
  const [themeOpen, setThemeOpen] = useState(false);

  const pickTheme = (t: Theme) => {
    if (t !== theme) onChangeTheme?.(t);
    setThemeOpen(false);
  };

  const graphemes: string[] =
    segments && segments.length > 0 ? segments.map((s) => s.chars) : word.split('');

  const sayText = useCallback((text: string, rate = 0.8) => {
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

  const soundOut = useCallback(() => {
    let i = 0;
    const step = () => {
      if (i < graphemes.length) {
        setLit(i);
        sayText(graphemes[i]);
        i++;
        window.setTimeout(step, 650);
      } else {
        setLit(null);
        window.setTimeout(() => onSpeak(), 220);
      }
    };
    step();
  }, [graphemes, sayText, onSpeak]);

  const mark = (status: WordStatus) => {
    setBubble(
      status === 'independent'
        ? 'Amazing! 🎉'
        : status === 'support'
          ? 'Great teamwork! 💪'
          : "That's okay — keep going! 🌱"
    );
    onCorrect(status);
  };

  const nodes = Math.max(totalWords, 1);

  return (
    <div
      className="h-full relative flex flex-col p-5 md:p-6 text-[#2B2A32] overflow-hidden"
      style={{ background: bgColor }}
    >
      {/* ---- Top: settings + theme (stacked) · progress path ---- */}
      <div className="flex items-start gap-4">
        {themeOpen && <div className="fixed inset-0 z-20" onClick={() => setThemeOpen(false)} />}

        {/* Settings on top, theme switcher directly under it */}
        <div className="relative z-30 flex flex-col gap-2 flex-shrink-0">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="w-11 h-11 rounded-full bg-[#5a5a5a] hover:bg-[#6b6b6b] grid place-items-center transition-colors active:scale-95"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Theme switcher: tap to expand a column of worlds under settings */}
          <div className="flex flex-col gap-2 p-1.5 rounded-3xl bg-white/85 shadow-[0_8px_20px_rgba(60,50,20,.16)] border border-black/5 w-fit">
            {(themeOpen ? THEMES : [theme]).map((t) => {
              const selected = t === theme;
              return (
                <button
                  key={t}
                  onClick={() => (themeOpen ? pickTheme(t) : setThemeOpen(true))}
                  aria-label={themeOpen ? `Choose ${t}` : 'Change world'}
                  className="w-11 h-11 rounded-2xl grid place-items-center overflow-hidden border-2 transition-all active:scale-95"
                  style={
                    selected
                      ? { background: '#1c1c1c', borderColor: '#1c1c1c' }
                      : { background: '#fff', borderColor: '#ececec' }
                  }
                >
                  <img src={`/assets/themes/${t}.gif`} alt="" className="w-9 h-9 object-contain" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress path */}
        <div className="flex-1 flex justify-center pt-3">
          <div className="relative flex items-center justify-between w-full max-w-[360px]">
            <div
              className="absolute left-2 right-2 h-[3px] bg-[#E7C445] rounded"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            {Array.from({ length: nodes }).map((_, i) => {
              const done = i < wordNumber - 1;
              const current = i === wordNumber - 1;
              const isLast = i === nodes - 1;
              return (
                <div
                  key={i}
                  className="relative z-10 rounded-full grid place-items-center transition-all"
                  style={{
                    width: current ? 26 : 20,
                    height: current ? 26 : 20,
                    background: done || current ? '#F6A623' : '#fff',
                    border: done || current ? 'none' : '2px solid #E7C445',
                    boxShadow: current ? '0 0 0 4px rgba(246,166,35,.25)' : 'none',
                  }}
                >
                  {isLast && <span style={{ fontSize: 11, lineHeight: 1 }}>⭐</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- Middle: word stage ---- */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        {isBonus && (
          <span className="mb-1 bg-[#FFD24C] text-[#7a5a00] rounded-full px-3 py-1 text-xs font-bold">
            ⭐ BONUS WORD
          </span>
        )}

        <button
          onClick={onSpeak}
          aria-label="Hear the word"
          className="w-[58px] h-[58px] md:w-[66px] md:h-[66px] rounded-full bg-white shadow-[0_10px_30px_rgba(60,50,20,.12)] text-2xl grid place-items-center active:scale-90 transition mb-3"
        >
          🔊
        </button>

        <div
          className="font-display flex"
          style={{ fontSize: 'clamp(56px,11vw,120px)', letterSpacing: '0.05em', lineHeight: 1, gap: '0.06em' }}
        >
          {graphemes.map((g, i) => (
            <span
              key={i}
              className="rounded-xl transition-all duration-200"
              style={
                lit === i
                  ? { background: '#19A7A0', color: '#fff', transform: 'translateY(-6px)', padding: '0 0.04em' }
                  : { padding: '0 0.04em' }
              }
            >
              {g}
            </span>
          ))}
        </div>

        {visualPhonemeMarking && (
          <div className="flex gap-2 mt-3 h-2">
            {graphemes.map((g, i) => (
              <span
                key={i}
                className="h-2 rounded-md transition-all duration-200"
                style={{
                  width: Math.max(26, g.length * 28),
                  background: lit === i ? '#19A7A0' : '#4C9BF5',
                  transform: lit === i ? 'scaleY(1.7)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {readingAids.ruler && (
          <div className="mt-3">
            <ReadingGuide width={`${word.length * 46}px`} />
          </div>
        )}

        <button
          onClick={soundOut}
          className="mt-4 bg-white/90 border border-black/5 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_4px_14px_rgba(60,50,20,.10)] active:translate-y-px"
        >
          🐢 Sound it out
        </button>

        {/* Word nav arrows */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button
            onClick={onSkip}
            aria-label="Next word"
            className="w-11 h-11 rounded-2xl bg-white shadow-[0_6px_16px_rgba(60,50,20,.14)] grid place-items-center text-2xl font-bold text-[#2B2A32] active:scale-95"
          >
            ›
          </button>
          <button
            onClick={onGoBack}
            aria-label="Previous word"
            className="w-11 h-11 rounded-2xl bg-white shadow-[0_6px_16px_rgba(60,50,20,.14)] grid place-items-center text-2xl font-bold text-[#2B2A32] active:scale-95"
          >
            ‹
          </button>
        </div>
      </div>

      {/* ---- Bottom: marks (left) + Bloxie (right) ---- */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-[320px] w-full">
          {/* Break it down */}
          <div className="relative">
            <button
              onClick={() => setShowTip((s) => !s)}
              className="flex items-center gap-2 w-fit px-4 py-2 bg-white/80 border border-black/5 rounded-full text-sm font-semibold active:scale-95"
            >
              💡 Break it down
            </button>
            {showTip && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTip(false)} />
                <div className="absolute bottom-12 left-0 w-72 p-4 bg-white rounded-xl shadow-xl border-2 border-blue-100 z-20">
                  <div className="flex items-center gap-2 text-[#19A7A0] mb-1.5 text-sm font-semibold">
                    <span>💡</span> Tips for grown-ups
                  </div>
                  <div className="text-[15px] text-gray-700 leading-relaxed">{teachingTip}</div>
                </div>
              </>
            )}
          </div>

          {/* Cream outlined "how it went" pills */}
          <button
            onClick={() => mark('support')}
            className="w-fit px-6 py-2.5 rounded-2xl bg-[#F1E6A2] border-[2.5px] border-[#2B2A32] text-[#2B2A32] text-sm font-bold shadow-[0_3px_0_rgba(43,42,50,.5)] active:translate-y-0.5 active:shadow-none transition"
          >
            Kid has used little help
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => mark('independent')}
              className="px-6 py-2.5 rounded-2xl bg-[#F1E6A2] border-[2.5px] border-[#2B2A32] text-[#2B2A32] text-sm font-bold shadow-[0_3px_0_rgba(43,42,50,.5)] active:translate-y-0.5 active:shadow-none transition"
            >
              Kid nailed it
            </button>
            <button
              onClick={() => mark('practice')}
              className="px-6 py-2.5 rounded-2xl bg-[#F1E6A2] border-[2.5px] border-[#2B2A32] text-[#2B2A32] text-sm font-bold shadow-[0_3px_0_rgba(43,42,50,.5)] active:translate-y-0.5 active:shadow-none transition"
            >
              Need more practise
            </button>
          </div>
        </div>

        {/* Bloxie encouragement */}
        <div className="flex items-end gap-2 flex-shrink-0">
          {bubble && (
            <div className="relative bg-white rounded-2xl px-3 py-2 text-sm font-semibold shadow-[0_6px_16px_rgba(60,50,20,.14)] mb-2 whitespace-nowrap">
              {bubble}
            </div>
          )}
          <div className="w-24 h-24 rounded-2xl bg-white shadow-[0_8px_20px_rgba(60,50,20,.16)] grid place-items-center overflow-hidden border border-black/5">
            <img src="/assets/decorations/bloxie.svg" alt="" className="w-20 h-20 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
