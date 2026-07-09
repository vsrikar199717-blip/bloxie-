import { useEffect } from 'react';

interface BonusTransitionProps {
  onComplete: () => void;
}

export function BonusTransition({ onComplete }: BonusTransitionProps) {
  // Auto-dismiss after 2.5 seconds (enough time for young readers to process)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="
        fixed inset-0
        flex flex-col items-center justify-center
        bg-gradient-to-b from-yellow-300 to-yellow-500
        cursor-pointer
      "
      style={{ zIndex: 10000 }}
      onClick={onComplete}
    >
      {/* Stars animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-pulse"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 30}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="text-6xl mb-4 animate-bounce">🌟</div>
        <h1
          className="
            text-5xl font-bold text-white
            drop-shadow-lg
            animate-pulse
          "
          style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}
        >
          Bonus round!
        </h1>
        <p className="text-2xl text-yellow-100 mt-4">
          Tricky word time!
        </p>
      </div>

      {/* Tap to continue hint */}
      <div className="absolute bottom-8 text-yellow-100 text-lg">
        Tap to continue
      </div>
    </div>
  );
}
