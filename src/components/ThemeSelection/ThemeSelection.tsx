import { useState, useEffect } from 'react';
import { SettingsCog } from '../ui/SettingsCog';
import type { Theme } from '../../types/profile';

interface ThemeSelectionProps {
  childName: string;
  onSelectTheme: (theme: Theme) => void;
  onOpenSettings: () => void;
}

const THEMES: Theme[] = ['robot', 'mystical', 'monster'];

const THEME_IMAGES: Record<Theme, string> = {
  robot: '/assets/themes/robot.gif',
  mystical: '/assets/themes/mystical.gif',
  monster: '/assets/themes/monster.gif',
};

export function ThemeSelection({ onSelectTheme, onOpenSettings }: ThemeSelectionProps) {
  const [selected, setSelected] = useState<Theme>('robot');
  // Active swap transition: which characters and which way the new one enters.
  const [anim, setAnim] = useState<{ from: Theme; to: Theme; dir: 'left' | 'right' } | null>(null);

  const handlePick = (theme: Theme) => {
    if (theme === selected || anim) return;
    const from = selected;
    // New character enters from the side of the card you tapped
    const dir: 'left' | 'right' =
      THEMES.indexOf(theme) > THEMES.indexOf(from) ? 'right' : 'left';
    setSelected(theme);
    setAnim({ from, to: theme, dir });
  };

  // Safety net in case onAnimationEnd doesn't fire
  useEffect(() => {
    if (!anim) return;
    const t = setTimeout(() => setAnim(null), 600);
    return () => clearTimeout(t);
  }, [anim]);

  return (
    <div className="h-screen w-full bg-white relative flex flex-col overflow-y-auto overflow-x-hidden">
      <SettingsCog onClick={onOpenSettings} />

      <div className="relative z-10 m-auto w-full flex justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-[1160px] flex flex-col items-center md:flex-row md:items-center md:justify-center gap-8 md:gap-14">
          {/* Heading + cards (+ CTA on desktop) */}
          <div className="order-1 flex flex-col items-center md:items-start md:w-[46%]">
            <h1 className="font-display text-[#111] font-bold leading-[1.15] text-center md:text-left text-[clamp(28px,4.4vw,50px)]">
              <span className="block whitespace-nowrap">what do you want</span>
              <span className="block whitespace-nowrap">to build today?</span>
            </h1>

            <div className="flex gap-4 md:gap-5 mt-8 md:mt-10">
              {THEMES.map((theme) => {
                const isSelected = selected === theme;
                return (
                  <button
                    key={theme}
                    onClick={() => handlePick(theme)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-center rounded-[20px] overflow-hidden border-2 transition-all duration-200
                      w-[104px] h-[104px] md:w-[128px] md:h-[128px]
                      ${
                        isSelected
                          ? 'bg-[#111] border-[#111] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)] scale-105'
                          : 'bg-white border-[#ececec] hover:border-[#d5d5d5] hover:-translate-y-0.5'
                      }`}
                  >
                    <img
                      src={THEME_IMAGES[theme]}
                      alt={theme}
                      className="w-[86px] h-[86px] md:w-[104px] md:h-[104px] object-contain"
                    />
                  </button>
                );
              })}
            </div>

            {/* CTA — desktop position (under the cards) */}
            <button
              onClick={() => onSelectTheme(selected)}
              className="hidden md:inline-flex mt-14 px-14 py-4 rounded-full bg-[#111] text-white font-bold text-lg transition-all hover:bg-black hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            >
              Lets begin
            </button>
          </div>

          {/* Large preview: game-style conveyor swap (characters never overlap) */}
          <div className="order-2 flex justify-center w-full md:w-[54%]">
            <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-square overflow-hidden">
              {anim ? (
                <div
                  className={`absolute inset-0 flex w-[200%] ${
                    anim.dir === 'left' ? 'anim-track-left' : 'anim-track-right'
                  }`}
                  onAnimationEnd={() => setAnim(null)}
                >
                  {(anim.dir === 'left'
                    ? [anim.to, anim.from] // new on the left, old on the right
                    : [anim.from, anim.to] // old on the left, new on the right
                  ).map((t, i) => (
                    <div
                      key={i}
                      className="w-1/2 h-full shrink-0 flex items-center justify-center"
                    >
                      <img src={THEME_IMAGES[t]} alt="" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              ) : (
                <img
                  key={selected}
                  src={THEME_IMAGES[selected]}
                  alt={selected}
                  className="absolute inset-0 w-full h-full object-contain anim-land"
                />
              )}
            </div>
          </div>

          {/* CTA — mobile position (below the preview) */}
          <button
            onClick={() => onSelectTheme(selected)}
            className="order-3 md:hidden px-14 py-4 rounded-full bg-[#111] text-white font-bold text-lg transition-all active:scale-[0.98]"
          >
            Lets begin
          </button>
        </div>
      </div>
    </div>
  );
}
