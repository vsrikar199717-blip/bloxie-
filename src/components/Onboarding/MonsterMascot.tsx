/**
 * Friendly one-eyed fuzzy monster mascot with a little green cap.
 * Built as inline SVG (matching the app's illustration style) so it's
 * crisp at any size and easy to recolour. Swap for /assets/themes/monster.gif
 * if an exact art asset is preferred.
 */

// Fur tufts around the body perimeter (center 200,220 · radius 120)
const TUFTS: [number, number][] = [
  [320, 220], [308, 273], [275, 313], [227, 337], [173, 337],
  [124, 313], [92, 273], [80, 220], [92, 167], [124, 127],
  [173, 103], [227, 103], [275, 127], [308, 167],
];

export function MonsterMascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} aria-hidden="true">
      {/* Fuzzy fur silhouette */}
      {TUFTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={30} fill="#F8C63A" stroke="#C98A1E" strokeWidth={6} />
      ))}

      {/* Body */}
      <circle cx={200} cy={220} r={126} fill="#F8C63A" />
      {/* Soft belly highlight */}
      <ellipse cx={200} cy={250} rx={92} ry={80} fill="#FBD45E" opacity={0.6} />

      {/* Freckles */}
      <ellipse cx={122} cy={272} rx={11} ry={7} fill="#EE8B3C" opacity={0.85} />
      <ellipse cx={140} cy={292} rx={8} ry={5} fill="#EE8B3C" opacity={0.7} />
      <ellipse cx={278} cy={272} rx={11} ry={7} fill="#EE8B3C" opacity={0.85} />
      <ellipse cx={262} cy={292} rx={8} ry={5} fill="#EE8B3C" opacity={0.7} />

      {/* Big eye */}
      <ellipse cx={190} cy={228} rx={50} ry={54} fill="#fff" stroke="#C98A1E" strokeWidth={5} />
      <circle cx={198} cy={238} r={25} fill="#2B2140" />
      <circle cx={188} cy={230} r={8} fill="#fff" />
      <circle cx={210} cy={250} r={4} fill="#fff" opacity={0.8} />
      {/* eyelid for a cheeky look */}
      <path d="M143 205 Q190 178 238 208" stroke="#C98A1E" strokeWidth={6} strokeLinecap="round" fill="none" />

      {/* Little smile */}
      <path d="M232 292 Q252 312 274 296" stroke="#8A5A1A" strokeWidth={6} strokeLinecap="round" fill="none" />

      {/* Green cap */}
      <g transform="rotate(-10 200 120)">
        <path
          d="M118 150 Q92 150 90 162 Q120 176 205 166 Q162 150 118 150 Z"
          fill="#69AE52"
          stroke="#4E9440"
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path
          d="M128 154 A74 68 0 0 1 274 154 Z"
          fill="#7BC15F"
          stroke="#4E9440"
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M201 88 V154" stroke="#4E9440" strokeWidth={3} opacity={0.45} />
        <circle cx={201} cy={90} r={8} fill="#4E9440" />
      </g>
    </svg>
  );
}
