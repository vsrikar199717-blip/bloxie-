import type { Theme } from '../../types/profile';

interface Scene {
  src: string;
  /** How strongly the scene shows through. The rest is white, so it reads lighter. */
  opacity: number;
}

/** Themes with no artwork yet fall through to the plain background. */
const SCENES: Partial<Record<Theme, Scene>> = {
  robot: {
    src: '/assets/backdrops/robot.png',
    opacity: 0.9,
  },
};

export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const scene = SCENES[theme];
  if (!scene) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-white" aria-hidden="true">
      <img
        src={scene.src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: scene.opacity }}
      />
    </div>
  );
}
