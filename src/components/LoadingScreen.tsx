/**
 * Loading state shown after a character/theme is chosen.
 *
 * Whack-a-mole style: bloxie sits BEHIND the hole and is clipped at the hole
 * line, so its legs (and its own baked-in shadow) are hidden. The circle vector
 * sits in FRONT as the hole opening, so only bloxie's upper body peeks out and
 * bobs. No part of bloxie crosses over the hole.
 */
export function LoadingScreen() {
  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: 300, height: 230 }}>
        {/* Bloxie behind, clipped at the hole line (nothing renders below it) */}
        <div
          className="absolute inset-x-0 top-0 overflow-hidden flex items-end justify-center"
          style={{ bottom: 70 }}
        >
          <img
            src="/assets/decorations/bloxie.svg"
            alt=""
            aria-hidden="true"
            className="loading-bloxie"
            style={{ width: 150, height: 'auto' }}
          />
        </div>

        {/* Hole opening in front, sitting on the ground line */}
        <img
          src="/assets/decorations/hole.svg"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2"
          style={{ bottom: 40, width: 250, height: 60, transform: 'translateX(-50%)', zIndex: 2 }}
        />
      </div>

      <p className="font-display text-3xl text-[#111] mt-6">Loading...</p>
    </div>
  );
}
