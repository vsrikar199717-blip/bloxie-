import { useState } from 'react';

/**
 * Reading-colour picker shown before the game starts. Coloured backgrounds are
 * a research-backed reading aid (reduce visual stress / glare). The chosen
 * colour becomes the reading panel background.
 */

type Swatch = { name: string; hex: string; tag: string; desc: string };

const COLORS: Swatch[] = [
  { name: 'Butter', hex: '#FBF1BE', tag: 'WARM · RESEARCH-BACKED', desc: 'warm & cheerful' },
  { name: 'Peach', hex: '#FFE0CC', tag: 'WARM · RESEARCH-BACKED', desc: 'gentle, playful, very readable' },
  { name: 'Apricot', hex: '#FCE7C7', tag: 'WARM', desc: 'soft & warm' },
  { name: 'Blush', hex: '#FCE0E8', tag: 'SOFT', desc: 'calm & friendly' },
  { name: 'Mint', hex: '#DFF3E4', tag: 'COOL', desc: 'fresh & soothing' },
  { name: 'Sky', hex: '#DDEBFB', tag: 'COOL', desc: 'cool & focusing' },
  { name: 'Lavender', hex: '#EAE2FB', tag: 'COOL', desc: 'calm & dreamy' },
  { name: 'Cream', hex: '#FBF3E8', tag: 'NEUTRAL', desc: 'low-glare & neutral' },
];

export function ColorPicker({ onChoose }: { onChoose: (hex: string) => void }) {
  const [i, setI] = useState(1); // default: Peach
  const c = COLORS[i];

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-[760px] my-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[#111] mb-1">Pick a reading colour</h1>
        <p className="text-[#666] mb-6">
          Choose the background that feels easiest to read — you can change it any time.
        </p>

        {/* Swatches */}
        <div className="flex gap-3 flex-wrap mb-7">
          {COLORS.map((col, idx) => (
            <button
              key={col.hex}
              onClick={() => setI(idx)}
              aria-label={col.name}
              className="w-16 h-16 rounded-2xl transition-all"
              style={{
                background: col.hex,
                boxShadow: i === idx ? '0 0 0 3px #111' : '0 2px 8px rgba(0,0,0,.08)',
              }}
            />
          ))}
        </div>

        {/* Preview in the chosen colour, using the real reading font */}
        <div className="rounded-[24px] p-8 md:p-10" style={{ background: c.hex }}>
          <div className="text-[11px] font-bold tracking-[0.15em] text-[#8a6a4a] mb-3">{c.tag}</div>
          <div className="font-display text-5xl md:text-6xl text-[#4a3a2e] mb-4">dragon</div>
          <div className="font-display text-xl md:text-2xl text-[#4a3a2e]">
            The dragon flew over the big green hill.
          </div>
        </div>

        <div className="mt-3 text-[#555]">
          <b>{c.name}</b> <span className="text-[#aaa]">{c.hex}</span> — {c.desc}
        </div>

        <button
          onClick={() => onChoose(c.hex)}
          className="mt-6 px-12 py-4 rounded-full bg-[#111] text-white font-bold text-lg active:scale-[.98] transition"
        >
          Let's read!
        </button>
      </div>
    </div>
  );
}
