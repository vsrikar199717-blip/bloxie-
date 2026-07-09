import { useRef, useState } from 'react';

/**
 * WordBuildGame — the core game loop, standalone.
 *
 * Kids read a word; reading it (or skipping) awards one building part into the
 * tray. Tapping a tray part drops it onto the character canvas, where it can be
 * dragged into place. Read all the words → the character is fully built.
 *
 * This is the same mechanic as SessionScreen (ReadingZone awards parts →
 * BuildingZone places them), distilled to a single dependency-free component.
 */

type Part = { key: string; label: string; src: string };
type Placed = Part & { id: string; x: number; y: number };

// Phonics-style words the child reads, one per part earned
const WORDS = ['sat', 'pin', 'top', 'red', 'big', 'jump', 'ship', 'star'];

// One building part earned per word (real robot assets from /public)
const PARTS: Part[] = [
  { key: 'body', label: 'Body', src: '/assets/parts/robots/original/bodies/1.svg' },
  { key: 'head', label: 'Head', src: '/assets/parts/robots/original/heads/1.svg' },
  { key: 'arm-l', label: 'Arm', src: '/assets/parts/robots/original/body-parts/1.svg' },
  { key: 'arm-r', label: 'Arm', src: '/assets/parts/robots/original/body-parts/2.svg' },
  { key: 'legs', label: 'Legs', src: '/assets/parts/robots/original/joints/1.svg' },
  { key: 'antenna', label: 'Antenna', src: '/assets/parts/robots/original/accessories/1.svg' },
  { key: 'badge', label: 'Badge', src: '/assets/parts/robots/original/accessories/2.svg' },
  { key: 'boots', label: 'Boots', src: '/assets/parts/robots/original/joints/2.svg' },
];

export function WordBuildGame() {
  const [wordIndex, setWordIndex] = useState(0);
  const [tray, setTray] = useState<Part[]>([]); // earned, not yet placed
  const [placed, setPlaced] = useState<Placed[]>([]); // on the character
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const finished = wordIndex >= WORDS.length;
  const currentWord = WORDS[wordIndex];

  // Say the word out loud (browser TTS)
  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.75;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  // Reading (or skipping) the word awards the next building part
  const awardPart = () => {
    const part = PARTS[wordIndex % PARTS.length];
    if (part) setTray((t) => [...t, part]);
    setWordIndex((i) => i + 1);
  };

  // Tap a tray part → drop it onto the canvas so it can be arranged
  const placeFromTray = (part: Part, trayIdx: number) => {
    setTray((t) => t.filter((_, i) => i !== trayIdx));
    setPlaced((p) => [
      ...p,
      { ...part, id: `${part.key}-${Date.now()}`, x: 110 + p.length * 4, y: 60 + p.length * 4 },
    ]);
  };

  // Drag placed parts around
  const onPointerDown = (e: React.PointerEvent, item: Placed) => {
    drag.current = { id: item.id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = d.origX + (e.clientX - d.startX);
    const y = d.origY + (e.clientY - d.startY);
    setPlaced((p) => p.map((it) => (it.id === d.id ? { ...it, x, y } : it)));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const reset = () => {
    setWordIndex(0);
    setTray([]);
    setPlaced([]);
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden">
      {/* ---------- READ side ---------- */}
      <div className="md:w-[42%] flex flex-col items-center justify-center p-8 gap-6 border-b md:border-b-0 md:border-r border-[#eee]">
        {finished ? (
          <div className="text-center">
            <h1 className="font-display text-4xl text-[#111] mb-3">All built! 🎉</h1>
            <p className="text-[#666] mb-6">You read every word and built your robot.</p>
            <button onClick={reset} className="px-10 py-4 rounded-full bg-[#111] text-white font-bold">
              Play again
            </button>
          </div>
        ) : (
          <>
            <p className="text-[#888] font-semibold">
              Word {wordIndex + 1} of {WORDS.length}
            </p>

            <div className="flex items-center gap-4">
              <h1 className="font-display text-[64px] leading-none text-[#111]">{currentWord}</h1>
              <button
                onClick={() => speak(currentWord)}
                className="w-12 h-12 rounded-full bg-[#f2f2f2] hover:bg-[#e6e6e6] text-2xl grid place-items-center"
                aria-label="Hear the word"
              >
                🔊
              </button>
            </div>

            <p className="text-[#888] text-sm">Read it out loud, then tap ✓ to earn a part.</p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={awardPart}
                className="px-10 py-4 rounded-full bg-[#111] text-white font-bold text-lg active:scale-95 transition"
              >
                I read it! ✓
              </button>
              <button
                onClick={awardPart}
                className="px-8 py-4 rounded-full bg-white border-2 border-[#e6e6e6] text-[#555] font-bold"
              >
                Skip
              </button>
            </div>

            {/* Tray of earned-but-unplaced parts */}
            <div className="mt-6 w-full max-w-[360px]">
              <p className="text-[#999] text-xs font-semibold mb-2 text-center">
                Your parts — tap to add
              </p>
              <div className="min-h-[86px] flex flex-wrap gap-3 justify-center p-3 rounded-2xl bg-[#fafafa] border border-[#eee]">
                {tray.length === 0 && <span className="text-[#bbb] text-sm self-center">no parts yet</span>}
                {tray.map((part, i) => (
                  <button
                    key={i}
                    onClick={() => placeFromTray(part, i)}
                    title={part.label}
                    className="w-16 h-16 rounded-xl bg-white border border-[#eee] grid place-items-center hover:-translate-y-0.5 transition"
                  >
                    <img src={part.src} alt={part.label} className="w-12 h-12 object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---------- BUILD side ---------- */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative flex-1 bg-[#f6f7f9] touch-none overflow-hidden"
      >
        {placed.length === 0 && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <p className="font-display text-2xl text-[#c7ccd3]">Build your robot here</p>
          </div>
        )}
        {placed.map((item) => (
          <img
            key={item.id}
            src={item.src}
            alt={item.label}
            onPointerDown={(e) => onPointerDown(e, item)}
            style={{ left: item.x, top: item.y }}
            className="absolute w-[120px] h-[120px] object-contain cursor-grab active:cursor-grabbing select-none"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
