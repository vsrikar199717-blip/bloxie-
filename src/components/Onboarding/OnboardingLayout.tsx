import { FloatingDecorations } from './FloatingDecorations';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  /** Show the floating background decorations. Only the early onboarding
   *  screens use them; later steps (year / phase) are clean white. */
  showDecorations?: boolean;
}

/**
 * Shared layout for onboarding screens.
 * White background, optional floating decorations. Content is centred when it
 * fits and scrolls vertically when it is taller than the viewport (e.g. the
 * phase screen once earlier phases are expanded). `m-auto` centres the block
 * while still allowing the top to be scrolled into view when it overflows.
 */
export function OnboardingLayout({ children, showDecorations = true }: OnboardingLayoutProps) {
  return (
    <div className="h-screen w-full bg-white relative flex flex-col overflow-y-auto">
      {showDecorations && <FloatingDecorations />}
      <div className="relative z-10 m-auto w-full flex items-center justify-center p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
