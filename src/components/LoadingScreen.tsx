import { BloxieCharacter } from './ui/BloxieCharacter';

/**
 * Loading state shown after a character/theme is chosen.
 * Bloxie hops in place (blinking and looking around) with a "Loading..." caption.
 */
export function LoadingScreen() {
  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden">
      <BloxieCharacter className="loading-bloxie w-[170px] h-auto" />
      <p className="font-display text-3xl text-[#111] mt-8">Loading...</p>
    </div>
  );
}
