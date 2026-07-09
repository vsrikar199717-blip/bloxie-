/**
 * Playful floating decorations for onboarding screens.
 *
 * Rules:
 *  - Uses all five distinct decoration elements (d1–d5), each exactly ONCE.
 *    No image is duplicated/repeated.
 *  - Non-plant art only. Plants belong on the school-year cards.
 *  - Everything hugs the screen edges / corners (plus one high top-centre
 *    piece) and stays clear of the central content column, so decorations
 *    never overlap the text.
 *
 * d1 = bow · d2 = ornament · d3 = star · d4 = kite · d5 = UFO
 */

const BASE = '/assets/decorations';

type Deco = {
  src: string;
  className: string;
  width: number;
  duration: number;
  delay: number;
  rotate?: number;
};

const DECORATIONS: Deco[] = [
  { src: `${BASE}/d5.svg`, className: 'top-4 left-4', width: 62, duration: 5, delay: 0.8 },            // UFO — top-left
  { src: `${BASE}/d3.svg`, className: 'top-3 left-1/2 -translate-x-1/2', width: 40, duration: 3.2, delay: 0.2 }, // star — top-centre (high)
  { src: `${BASE}/d1.svg`, className: 'top-4 right-5', width: 54, duration: 4.2, delay: 0.6, rotate: -6 },       // bow — top-right
  { src: `${BASE}/d4.svg`, className: 'bottom-5 left-6', width: 48, duration: 3.8, delay: 1.1 },       // kite — bottom-left
  { src: `${BASE}/d2.svg`, className: 'bottom-6 right-6', width: 56, duration: 4.6, delay: 0.4 },      // ornament — bottom-right
];

export function FloatingDecorations() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {DECORATIONS.map((d, i) => (
        <img
          key={i}
          src={d.src}
          alt=""
          aria-hidden="true"
          className={`absolute ${d.className}`}
          style={{
            width: d.width,
            transform: d.rotate ? `rotate(${d.rotate}deg)` : undefined,
            animation: `float ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
