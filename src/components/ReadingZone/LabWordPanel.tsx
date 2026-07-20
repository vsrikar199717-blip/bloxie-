import { useCallback, useLayoutEffect, useRef, useState } from 'react';
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
  const [themeOpen, setThemeOpen] = useState(false);
  const [helpView, setHelpView] = useState<'menu' | 'tip'>('menu');

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

  /**
   * Measure the word as it actually renders, so the sound marks and the ruler
   * cover the WHOLE word.
   *
   * They used to guess from the character count (26px per grapheme, 46px per
   * letter for the ruler), but the word is set in OpenDyslexic at a fluid
   * clamp(48px,18cqw,120px) with letter-spacing — so the guess only ever
   * matched at one panel width and fell short of the word everywhere else.
   * Measuring the real grapheme boxes keeps them aligned at every size.
   *
   * Re-measures on resize (ResizeObserver, since the size is container-driven)
   * and once the webfont lands — the first paint is in the fallback font, which
   * is a different width.
   */
  const wordRef = useRef<HTMLDivElement>(null);
  const wordStageRef = useRef<HTMLDivElement>(null);
  const [wordFontSize, setWordFontSize] = useState(48);
  const [wordBox, setWordBox] = useState<{ width: number; marks: { left: number; width: number }[] }>({
    width: 0,
    marks: [],
  });

  const graphemeKey = graphemes.join('\u0000');

  // Start at the normal fluid size, then shrink only when the rendered word
  // is wider than the reading stage. Measuring the actual OpenDyslexic glyphs
  // is more reliable than guessing from character count (wide letters and
  // letter-spacing make similarly sized words very different widths).
  useLayoutEffect(() => {
    const stage = wordStageRef.current;
    const el = wordRef.current;
    if (!stage || !el) return;

    const fitWord = () => {
      const available = Math.max(stage.clientWidth - 16, 1);
      const baseSize = Math.min(120, Math.max(48, stage.clientWidth * 0.18));

      el.style.fontSize = `${baseSize}px`;
      const naturalWidth = el.scrollWidth;
      const fittedSize = naturalWidth > available
        ? Math.max(28, Math.floor(baseSize * (available / naturalWidth) * 0.96))
        : baseSize;

      el.style.fontSize = `${fittedSize}px`;
      setWordFontSize(fittedSize);
    };

    fitWord();
    const ro = new ResizeObserver(fitWord);
    ro.observe(stage);
    document.fonts?.ready.then(fitWord).catch(() => {});

    return () => ro.disconnect();
  }, [graphemeKey]);

  useLayoutEffect(() => {
    const el = wordRef.current;
    if (!el) return;

    const measure = () => {
      const box = el.getBoundingClientRect();
      const marks = Array.from(el.children).map((child) => {
        const r = child.getBoundingClientRect();
        return { left: r.left - box.left, width: r.width };
      });
      setWordBox({ width: box.width, marks });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => ro.disconnect();
  }, [graphemeKey]);

  /**
   * Say each grapheme in turn, then the whole word.
   *
   * The speech queue does the sequencing for us: cancel ONCE, then queue every
   * utterance. The old version called cancel() before every grapheme on a 650ms
   * timer, so each sound killed the one before it — Chrome reliably gets stuck
   * in that cancel/speak race and goes silent. Highlighting rides the real
   * onstart/onend events rather than guessed timings, so the letters light up
   * in time with the audio however fast the voice actually speaks.
   */
  const soundOut = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    // Chrome drops an utterance queued in the same tick as cancel()
    window.setTimeout(() => {
      graphemes.forEach((g, i) => {
        const u = new SpeechSynthesisUtterance(g);
        u.lang = 'en-GB';
        u.rate = 0.6;
        u.onstart = () => setLit(i);
        synth.speak(u);
      });

      // …then the whole word, so they hear the blend
      const whole = new SpeechSynthesisUtterance(word);
      whole.lang = 'en-GB';
      whole.rate = 0.75;
      whole.onstart = () => setLit(null);
      whole.onend = () => setLit(null);
      synth.speak(whole);
    }, 60);
  }, [graphemes, word]);

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
      {/* ---- Top: worlds · pause · settings · progress path · end session ----
           These grown-up controls sit out here rather than inside Bloxie's
           menu: burying them left the menu crowded, and Bloxie's job is help
           with the reading — the aids — not app settings. */}
      <div className="flex items-start gap-3">
        {/* Worlds and settings: two separate buttons, stacked vertically, both
            always visible. Settings used to hide inside the worlds popover,
            which meant a grown-up had to open the child's world picker to reach
            it. Its own icon, directly under the world, keeps them apart. */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          {/* Change your world */}
          {onChangeTheme && (
            <div className="relative">
              {themeOpen && <div className="fixed inset-0 z-30" onClick={() => setThemeOpen(false)} />}
              <button
                onClick={() => setThemeOpen((o) => !o)}
                data-tour="theme"
                aria-label="Change your world"
                aria-expanded={themeOpen}
                className="relative z-40 w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(60,50,20,.14)] grid place-items-center overflow-hidden border-2 border-black/5 hover:border-[#F5851F]/40 transition active:scale-95"
              >
                <img src={`/assets/themes/${theme}.gif`} alt="" className="w-8 h-8 object-contain" />
              </button>
              {themeOpen && (
                <div className="font-display absolute z-40 top-full left-0 mt-2 p-2 bg-white rounded-2xl shadow-[0_14px_36px_rgba(43,42,50,.24)] border border-black/5">
                  <div className="flex gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => { pickTheme(t); setThemeOpen(false); }}
                        aria-label={`Choose ${t}`}
                        className="w-11 h-11 rounded-xl grid place-items-center overflow-hidden border-2 transition active:scale-95"
                        style={
                          t === theme
                            ? { background: '#1c1c1c', borderColor: '#1c1c1c' }
                            : { background: '#fff', borderColor: '#ececec' }
                        }
                      >
                        <img src={`/assets/themes/${t}.gif`} alt="" className="w-9 h-9 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings — its own control, under the world */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              title="Settings"
              className="w-10 h-10 rounded-full bg-white shadow-[0_4px_12px_rgba(60,50,20,.14)] grid place-items-center text-base border-2 border-black/5 hover:border-[#F5851F]/40 transition active:scale-95"
            >
              ⚙️
            </button>
          )}
        </div>

        {/* Progress path — numbered steps, so a child can see how far along the
            set they are rather than just how many dots are left. */}
        <div className="flex-1 flex justify-start items-center h-10">
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

      {/* Lightbox: darken everything so the only thing a child can see is the
          word. The overlay sits above the panel's chrome but below the word
          stage, which is lifted to z-20 and glows. */}
      {readingAids.lightbox && (
        <div
          className="absolute inset-0 z-10 bg-[#0B0A14]/80 pointer-events-none animate-[fadeIn_0.25s_ease]"
          aria-hidden="true"
        />
      )}

      {/* ---- Middle: word stage ----
           containerType makes cqw below resolve against THIS panel, not the
           viewport. The panel is only ~45% of an iPad's width, so a vw-based
           word size overflowed it. */}
      <div
        ref={wordStageRef}
        className={`flex-1 flex flex-col items-center justify-center relative min-h-0 ${
          readingAids.lightbox ? 'z-20' : ''
        }`}
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
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-[#F5851F] shadow-[0_6px_18px_rgba(60,50,20,.12)] grid place-items-center active:scale-90 transition mb-4"
        >
          <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div
          ref={wordRef}
          data-tour="word"
          className="font-display flex max-w-full justify-center transition-colors duration-300"
          style={{
            fontSize: wordFontSize,
            letterSpacing: '0.05em',
            lineHeight: 1,
            gap: '0.06em',
            // Lightbox: the word turns bright and glows against the dimmed panel
            color: readingAids.lightbox ? '#FFFDF3' : undefined,
            textShadow: readingAids.lightbox
              ? '0 0 18px rgba(255,247,214,0.85), 0 0 46px rgba(255,214,120,0.55)'
              : undefined,
          }}
        >
          {graphemes.map((g, i) => (
            <span
              key={i}
              className="shrink-0 rounded-xl transition-all duration-200"
              style={
                lit === i
                  ? {
                      // Orange outline rather than a solid fill: the letter stays
                      // readable underneath, and warm reads easier than the old teal.
                      boxShadow: 'inset 0 0 0 3px #F5851F',
                      background: 'rgba(245,133,31,0.12)',
                      transform: 'translateY(-6px)',
                      padding: '0 0.04em',
                    }
                  : { padding: '0 0.04em' }
              }
            >
              {g}
            </span>
          ))}
        </div>

        {/* One bar per grapheme, sitting under the grapheme it belongs to and
            exactly as wide — so the marks span the whole word. */}
        {visualPhonemeMarking && (
          <div className="relative mt-3 h-2" style={{ width: wordBox.width }}>
            {wordBox.marks.map((m, i) => (
              <span
                key={i}
                className="absolute top-0 h-2 rounded-md transition-all duration-200"
                style={{
                  left: m.left,
                  width: m.width,
                  // Warm tones only: blue/teal raise visual stress for dyslexic
                  // readers, so the sound marks use the panel's orange.
                  background: lit === i ? '#F5851F' : '#F0B37E',
                  transform: lit === i ? 'scaleY(1.7)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {readingAids.ruler && (
          <div className="mt-3">
            <ReadingGuide width={`${wordBox.width}px`} />
          </div>
        )}

        {/* Sound it out, on its own. The ‹ › word-nav circles that used to flank
            it are gone: the panel reads calmer with a single obvious action, and
            the "how did it go" pills are what move the session along. */}
        <div className="mt-7 md:mt-9 flex items-center justify-center">
          <button
            onClick={soundOut}
            data-tour="soundout"
            className="flex items-center gap-2 rounded-full bg-[#F5851F] text-white px-6 py-3 text-sm md:text-base font-semibold shadow-[0_8px_20px_rgba(245,133,31,.32)] transition hover:bg-[#e0761a] active:scale-95"
          >
            <SpeakerIcon className="w-4 h-4" />
            Sound it out
          </button>
        </div>
      </div>

      {/* ---- Bottom: grown-up marking pills (left) + Bloxie helper (right) ----
           Kept above the lightbox overlay: the grown-up still has to mark the
           word and reach Bloxie's menu (to turn the lightbox back off). */}
      <div className={`flex items-end justify-between gap-4 ${readingAids.lightbox ? 'relative z-20' : ''}`}>
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

        {/* Bloxie — ask him for help with the reading: the tip and the aids.
            Pause sits beside him, since taking a break is the other thing a
            child asks for mid-word. */}
        <div className="relative flex items-end gap-2 flex-shrink-0">
          {helpOpen && (
            <div className="fixed inset-0 z-30" onClick={closeHelp} />
          )}

          {/* Take a break — next to Bloxie, not buried in the top row */}
          {onPause && (
            <button
              onClick={onPause}
              aria-label="Want to take a break"
              title="Take a break"
              className="mb-1 w-11 h-11 rounded-full bg-white shadow-[0_4px_12px_rgba(60,50,20,.14)] grid place-items-center text-base border-2 border-black/5 hover:border-[#F5851F]/40 transition active:scale-95"
            >
              ⏸️
            </button>
          )}

          {/* Bloxie, with his bubble stacked above him so it reads as speech
              rather than a label sitting next to him. */}
          <div className="relative flex flex-col items-center">
            {/* Idle encouragement, only while he's not being asked for help */}
            {bubble && !helpOpen && (
              <div className="mb-2 bg-white rounded-2xl px-3 py-2 text-sm font-semibold shadow-[0_6px_16px_rgba(60,50,20,.14)] whitespace-nowrap animate-[fadeIn_0.3s_ease]">
                {bubble}
              </div>
            )}

            <button
            onClick={() => (helpOpen ? closeHelp() : setHelpOpen(true))}
            data-tour="bloxie"
            aria-label="Ask Bloxie for help"
            aria-expanded={helpOpen}
            className={`relative z-40 w-24 h-24 rounded-2xl bg-white shadow-[0_8px_20px_rgba(60,50,20,.16)] grid place-items-center border-2 transition active:scale-95 ${
              helpOpen ? 'border-[#F5851F]' : 'border-[#F5851F]/70 hover:border-[#F5851F]'
            }`}
          >
              <BloxieCharacter className="w-20 h-20" />
              {/* Kids won't know he's tappable unless we say so */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#F5851F] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-[0_3px_8px_rgba(245,133,31,.4)]">
                Help?
              </span>
            </button>
          </div>

          {/* Helper menu — opens upward, stays inside the reading panel */}
          {helpOpen && (
            <div className="font-display absolute z-40 bottom-full right-0 mb-3 w-[290px] bg-white rounded-2xl shadow-[0_18px_44px_rgba(43,42,50,.28)] border border-black/5 overflow-hidden">
              {helpView === 'menu' && (
                <div className="p-3">
                  {/* Left-aligned. OpenDyslexic throughout (set on the menu
                      container), so it matches the rest of the app. */}
                  <div className="px-2 pt-1 pb-3 text-[26px] leading-[1.15] font-bold text-[#2B2A32]">
                    Need a hand?
                  </div>

                  <div className="flex flex-col gap-1">
                    <HelpItem icon="💡" label="Break it down" onClick={() => setHelpView('tip')} />
                  </div>

                  {/* Reading aids sit right here, always visible. They're the
                      whole point of asking Bloxie for help, so they shouldn't be
                      a tap (or a screen) away. The grown-up controls that used to
                      crowd this menu now live along the top of the panel. */}
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <div className="px-3 pb-2 text-[13px] font-bold text-[#8A8594] tracking-wide">
                      READING AIDS
                    </div>
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
                </div>
              )}

              {helpView === 'tip' && (
                <div className="p-4">
                  <HelpBack onClick={() => setHelpView('menu')} />
                  <div className="flex items-center gap-2 text-[#F5851F] mb-1.5 text-sm font-semibold">
                    <span>💡</span> Tips for grown-ups
                  </div>
                  <div className="text-[15px] text-gray-700 leading-relaxed">{teachingTip}</div>
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
/**
 * A row in Bloxie's helper menu.
 * `emphasis` marks the row as the one that opens a sub-panel — it gets an
 * outlined pill and a chevron so it reads as "there's more behind this".
 */
function HelpItem({
  icon,
  label,
  onClick,
  emphasis = false,
  expanded,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  emphasis?: boolean;
  /** When set, the chevron rotates to show the row is expanded in place. */
  expanded?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition active:scale-[0.98] ${
        emphasis
          ? 'border-[1.5px] border-[#2B2A32] font-bold text-[#2B2A32] hover:bg-[#F7F5EF]'
          : 'border-[1.5px] border-transparent font-medium text-[#4A4754] hover:bg-[#F7F5EF]'
      }`}
    >
      <span className="w-6 h-6 grid place-items-center text-base flex-shrink-0">{icon}</span>
      <span className="flex-1 text-[15px]">{label}</span>
      {emphasis && (
        <Chevron
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      )}
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
        active ? 'bg-[#FFF3E6] text-[#D96B0D]' : 'text-[#6b6b6b] hover:bg-[#F7F5EF]'
      }`}
    >
      <span className="w-6 text-center">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className={`text-xs font-bold ${active ? 'text-[#D96B0D]' : 'text-[#C4BCB0]'}`}>
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
