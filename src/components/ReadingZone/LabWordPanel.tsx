import { useCallback, useState } from 'react';
import { ReadingGuide } from '../ui/ReadingGuide';
import { BloxieCharacter } from '../ui/BloxieCharacter';
import { MARK_ORDER, STATUS_LABELS, markLabel } from '../../utils/wordStatusLabels';
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
  onEndSession: () => void;
  onUpdateReadingAids: (aids: ReadingAids) => void;
  onTogglePhonemeMarking: () => void;
  onSpeak: () => void;
  profileName: string;
  theme?: Theme;
  onChangeTheme?: (theme: Theme) => void;
  onOpenSettings?: () => void;
  onPause?: () => void;
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
  onEndSession,
  onUpdateReadingAids,
  onTogglePhonemeMarking,
  onSpeak,
  profileName,
  theme = 'robot',
  onChangeTheme,
  onOpenSettings,
  onPause,
  bgColor = '#FBF1BE',
}: LabWordPanelProps) {
  const [lit, setLit] = useState<number | null>(null);
  const [bubble, setBubble] = useState(`Hey ${profileName}!`);

  // Bloxie's helper menu: 'menu' is the list, the others are its sub-views.
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpView, setHelpView] = useState<'menu' | 'tip' | 'theme' | 'aids'>('menu');

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    setHelpView('menu');
  }, []);

  const pickTheme = (t: Theme) => {
    if (t !== theme) onChangeTheme?.(t);
    closeHelp();
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
        ? 'You star! 🌟'
        : status === 'support'
          ? 'Great teamwork! 🤝'
          : 'Asking is smart! 💡'
    );
    onCorrect(status);
  };

  const nodes = Math.max(totalWords, 1);

  return (
    <div
      className="h-full relative flex flex-col p-5 md:p-6 text-[#2B2A32] overflow-hidden"
      style={{ background: bgColor }}
    >
      {/* ---- Top: progress path · end session ----
           Settings, pause, theme and the teaching tip all used to live up here
           and along the bottom edge. They now hide inside Bloxie's helper menu,
           so the only things competing for a child's attention are the word
           itself and the grown-up's marking pills. */}
      <div className="flex items-center gap-4">
        {/* Progress path — numbered steps, so a child can see how far along the
            set they are rather than just how many dots are left. */}
        <div className="flex-1 flex justify-start">
          <div className="relative flex items-center justify-between w-full max-w-[320px]">
            <div
              className="absolute left-3 right-3 h-[2px] bg-[#F0C98B] rounded"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            {Array.from({ length: nodes }).map((_, i) => {
              const done = i < wordNumber - 1;
              const current = i === wordNumber - 1;
              return (
                <div
                  key={i}
                  className="relative z-10 w-7 h-7 rounded-full grid place-items-center text-xs font-bold transition-all"
                  style={{
                    background: current ? '#F5851F' : '#fff',
                    color: current ? '#fff' : done ? '#F5851F' : '#C9BCA8',
                    border: current ? 'none' : `2px solid ${done ? '#F5851F' : '#EFE3D0'}`,
                    boxShadow: current ? '0 0 0 4px rgba(245,133,31,.20)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* End session — lives in the reading panel, matching the story screen */}
        <button
          onClick={onEndSession}
          className="flex-shrink-0 flex items-center gap-1.5 pl-5 pr-4 py-2.5 rounded-full bg-[#F5851F] text-white font-bold text-sm shadow-[0_6px_16px_rgba(245,133,31,0.32)] transition hover:bg-[#e0761a] active:scale-95"
        >
          End session
          <Chevron className="w-4 h-4" />
        </button>
      </div>

      {/* ---- Middle: word stage ----
           containerType makes cqw below resolve against THIS panel, not the
           viewport. The panel is only ~45% of an iPad's width, so a vw-based
           word size overflowed it. */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative min-h-0"
        style={{ containerType: 'inline-size' }}
      >
        {isBonus && (
          <span className="mb-3 bg-[#FFE9A8] text-[#8a6100] rounded-full px-3.5 py-1.5 text-xs font-bold">
            ⭐ Bonus word!
          </span>
        )}

        <button
          onClick={onSpeak}
          aria-label="Hear the word"
          data-tour="hear"
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-[#6C5CE7] shadow-[0_6px_18px_rgba(60,50,20,.12)] grid place-items-center active:scale-90 transition mb-4"
        >
          <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div
          data-tour="word"
          className="font-display flex max-w-full justify-center"
          style={{ fontSize: 'clamp(48px,18cqw,120px)', letterSpacing: '0.05em', lineHeight: 1, gap: '0.06em' }}
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

        {/* Word controls: back · sound it out · next, reading left-to-right like
            the story screen's bar. Replaces the old arrows that floated at the
            right edge with next stacked above back. */}
        <div className="mt-7 md:mt-9 flex items-center gap-3">
          <button
            onClick={onGoBack}
            aria-label="Previous word"
            className="w-10 h-10 rounded-full bg-white text-[#8A8378] border border-[#EFE6D8] grid place-items-center shadow-[0_2px_8px_rgba(60,50,20,.08)] transition hover:text-[#2B2A32] active:scale-95"
          >
            <Chevron className="w-4 h-4 rotate-180" />
          </button>

          <button
            onClick={soundOut}
            data-tour="soundout"
            className="flex items-center gap-2 rounded-full bg-[#6C5CE7] text-white px-6 py-3 text-sm md:text-base font-semibold shadow-[0_8px_20px_rgba(108,92,231,.30)] transition hover:bg-[#5c4cd6] active:scale-95"
          >
            <SpeakerIcon className="w-4 h-4" />
            Sound it out
          </button>

          <button
            onClick={onSkip}
            aria-label="Next word"
            className="w-10 h-10 rounded-full bg-white text-[#8A8378] border border-[#EFE6D8] grid place-items-center shadow-[0_2px_8px_rgba(60,50,20,.08)] transition hover:text-[#2B2A32] active:scale-95"
          >
            <Chevron className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---- Bottom: grown-up marking pills (left) + Bloxie helper (right) ---- */}
      <div className="flex items-end justify-between gap-4">
        {/* "How did it go?" — adventure framing, best outcome first. Nothing here
            is a failure: the compass is a journey still in progress. */}
        {/* Cream fill + hard black border, as before — the flat white pills read
            as disabled against the warm panel. Wording and order stay as the
            help ladder: on my own · a clue · together. */}
        <div data-tour="marks" className="flex flex-col items-start gap-2">
          {MARK_ORDER.map((status) => (
            <button
              key={status}
              onClick={() => mark(status)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F1E6A2] border-[2.5px] border-[#2B2A32] text-[#2B2A32] text-sm font-bold shadow-[0_3px_0_rgba(43,42,50,.5)] active:translate-y-0.5 active:shadow-none transition"
            >
              <span className="text-base">{STATUS_LABELS[status].icon}</span>
              {markLabel(status, profileName)}
            </button>
          ))}
        </div>

        {/* Bloxie — the one place to ask for help. Tapping him opens everything
            that used to clutter the panel: the tip, the worlds, pause, settings. */}
        <div className="relative flex items-end gap-2 flex-shrink-0">
          {helpOpen && (
            <div className="fixed inset-0 z-30" onClick={closeHelp} />
          )}

          {/* Idle encouragement, only while he's not being asked for help */}
          {bubble && !helpOpen && (
            <div className="bg-white rounded-2xl px-3 py-2 text-sm font-semibold shadow-[0_6px_16px_rgba(60,50,20,.14)] mb-2 whitespace-nowrap">
              {bubble}
            </div>
          )}

          <button
            onClick={() => (helpOpen ? closeHelp() : setHelpOpen(true))}
            data-tour="bloxie"
            aria-label="Ask Bloxie for help"
            aria-expanded={helpOpen}
            className={`relative z-40 w-24 h-24 rounded-2xl bg-white shadow-[0_8px_20px_rgba(60,50,20,.16)] grid place-items-center overflow-hidden border-2 transition active:scale-95 ${
              helpOpen ? 'border-[#F5851F]' : 'border-black/5 hover:border-[#F5851F]/40'
            }`}
          >
            <BloxieCharacter className="w-20 h-20" />
          </button>

          {/* Helper menu — opens upward, stays inside the reading panel */}
          {helpOpen && (
            <div className="absolute z-40 bottom-full right-0 mb-3 w-[290px] bg-white rounded-2xl shadow-[0_18px_44px_rgba(43,42,50,.28)] border border-black/5 overflow-hidden">
              {helpView === 'menu' && (
                <div className="p-2">
                  <div className="px-3 pt-2 pb-3 font-display text-lg">Need a hand?</div>

                  <HelpItem icon="💡" label="Break it down" onClick={() => setHelpView('tip')} />
                  <HelpItem icon="📏" label="Reading aids" onClick={() => setHelpView('aids')} />
                  {onChangeTheme && (
                    <HelpItem icon="🌍" label="Change your world" onClick={() => setHelpView('theme')} />
                  )}
                  {onPause && <HelpItem icon="⏸️" label="Take a break" onClick={() => { closeHelp(); onPause(); }} />}
                  {onOpenSettings && (
                    <HelpItem icon="⚙️" label="Settings" onClick={() => { closeHelp(); onOpenSettings(); }} />
                  )}
                </div>
              )}

              {helpView === 'tip' && (
                <div className="p-4">
                  <HelpBack onClick={() => setHelpView('menu')} />
                  <div className="flex items-center gap-2 text-[#19A7A0] mb-1.5 text-sm font-semibold">
                    <span>💡</span> Tips for grown-ups
                  </div>
                  <div className="text-[15px] text-gray-700 leading-relaxed">{teachingTip}</div>
                </div>
              )}

              {helpView === 'aids' && (
                <div className="p-4">
                  <HelpBack onClick={() => setHelpView('menu')} />
                  <div className="text-sm font-semibold mb-3">Reading aids</div>
                  <div className="flex flex-col gap-1.5">
                    <AidToggle
                      icon="📏"
                      label="Ruler"
                      active={readingAids.ruler}
                      onClick={() => onUpdateReadingAids({ ...readingAids, ruler: !readingAids.ruler })}
                    />
                    <AidToggle
                      icon="🔦"
                      label="Lightbox"
                      active={readingAids.lightbox}
                      onClick={() => onUpdateReadingAids({ ...readingAids, lightbox: !readingAids.lightbox })}
                    />
                    <AidToggle
                      icon="Aa"
                      label="Sound marks"
                      active={visualPhonemeMarking}
                      onClick={onTogglePhonemeMarking}
                    />
                  </div>
                </div>
              )}

              {helpView === 'theme' && (
                <div className="p-4">
                  <HelpBack onClick={() => setHelpView('menu')} />
                  <div className="text-sm font-semibold mb-3">Pick a world</div>
                  <div className="flex gap-2.5">
                    {THEMES.map((t) => {
                      const selected = t === theme;
                      return (
                        <button
                          key={t}
                          onClick={() => pickTheme(t)}
                          aria-label={`Choose ${t}`}
                          className="flex-1 aspect-square rounded-2xl grid place-items-center overflow-hidden border-2 transition active:scale-95"
                          style={
                            selected
                              ? { background: '#1c1c1c', borderColor: '#1c1c1c' }
                              : { background: '#fff', borderColor: '#ececec' }
                          }
                        >
                          <img src={`/assets/themes/${t}.gif`} alt="" className="w-12 h-12 object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Right-pointing chevron. Rotate it 180° for "back". */
function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SpeakerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

/** One row in Bloxie's helper menu. */
function HelpItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-[15px] font-semibold hover:bg-[#F7F5EF] transition active:scale-[0.98]"
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  );
}

/** A reading-aid on/off row in Bloxie's menu. */
function AidToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[15px] font-semibold transition active:scale-[0.98] ${
        active ? 'bg-[#E8F1FA] text-[#2E7BC4]' : 'text-[#6b6b6b] hover:bg-[#F7F5EF]'
      }`}
    >
      <span className="w-6 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className={`text-xs font-bold ${active ? 'text-[#2E7BC4]' : 'text-[#C4BCB0]'}`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

/** Back link inside a helper sub-view. */
function HelpBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-2 text-sm font-semibold text-[#999] hover:text-[#555] transition"
    >
      ‹ Back
    </button>
  );
}
