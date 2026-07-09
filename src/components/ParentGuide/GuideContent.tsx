import { useState, useRef, useCallback } from 'react';
import './parentGuide.css';

interface GuideContentProps {
  mode: 'walkthrough' | 'modal';
  onComplete: () => void;
}

interface GuideCard {
  title: string;
  emoji: string;
  features: { icon: string; name: string; description: string }[];
}

const GUIDE_CARDS: GuideCard[] = [
  {
    title: 'Reading Tools',
    emoji: '📖',
    features: [
      {
        icon: '📏',
        name: 'Ruler',
        description: 'A coloured line your child can drag up and down to track which line they\'re reading.',
      },
      {
        icon: '💡',
        name: 'Lightbox',
        description: 'Dims everything except the line your child is focused on, so they don\'t lose their place.',
      },
      {
        icon: '🔤',
        name: 'Marks',
        description: 'Shows coloured marks under each sound in a word, helping your child see how to break it apart.',
      },
    ],
  },
  {
    title: 'Helping Your Child',
    emoji: '🤝',
    features: [
      {
        icon: '💬',
        name: 'Tips for Grownups',
        description: 'Tap the blue badge to see how to help your child sound out the current word.',
      },
      {
        icon: '🔊',
        name: 'Sound It Out',
        description: 'Your child can tap this to hear the word spoken aloud — great when you\'re not sure of the pronunciation!',
      },
      {
        icon: '⏭️',
        name: 'Skip',
        description: 'If a word is too tricky, skip it and move on. No new building part is given, but that\'s OK!',
      },
    ],
  },
  {
    title: 'Building Zone',
    emoji: '🏗️',
    features: [
      {
        icon: '🎨',
        name: 'Switch Theme',
        description: 'Tap the character button in the toolbar to change what your child is building at any time.',
      },
      {
        icon: '🗑️',
        name: 'Start Again',
        description: 'Clears all placed parts from the building area so your child can start fresh.',
      },
    ],
  },
  {
    title: 'Settings',
    emoji: '⚙️',
    features: [
      {
        icon: '🎯',
        name: 'Phonics Phases',
        description: 'Change which phonics phases your child practises in the settings menu. You can mix and match!',
      },
    ],
  },
];

const SWIPE_THRESHOLD = 50;

export function GuideContent({ mode, onComplete }: GuideContentProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalCards = GUIDE_CARDS.length;
  const isFirst = currentCard === 0;
  const isLast = currentCard === totalCards - 1;

  const goTo = useCallback((index: number) => {
    setCurrentCard(Math.max(0, Math.min(totalCards - 1, index)));
  }, [totalCards]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;

    // Live drag feedback
    if (trackRef.current) {
      const baseOffset = -(currentCard * 100);
      const dragPercent = (touchDeltaX.current / window.innerWidth) * 100;
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(${baseOffset + dragPercent}%)`;
    }
  }, [currentCard]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;

    // Snap back with animation
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.3s ease';
    }

    if (touchDeltaX.current < -SWIPE_THRESHOLD && !isLast) {
      goTo(currentCard + 1);
    } else if (touchDeltaX.current > SWIPE_THRESHOLD && !isFirst) {
      goTo(currentCard - 1);
    } else {
      // Snap back to current card
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-(currentCard * 100)}%)`;
      }
    }

    touchStartX.current = null;
    touchDeltaX.current = 0;
  }, [currentCard, isFirst, isLast, goTo]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          How it works
        </h2>
        <button
          onClick={onComplete}
          className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors px-3 py-1"
        >
          {mode === 'walkthrough' ? 'Skip' : 'Close'}
        </button>
      </div>

      {/* Cards */}
      <div
        className="guide-cards-container flex-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="guide-cards-track h-full"
          style={{ transform: `translateX(${-(currentCard * 100)}%)` }}
        >
          {GUIDE_CARDS.map((card, index) => (
            <div key={index} className="guide-card flex flex-col">
              {/* Card title */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{card.emoji}</span>
                <h3 className="text-xl font-bold text-gray-800">{card.title}</h3>
              </div>

              {/* Features list */}
              <div className="space-y-1">
                {card.features.map((feature, fi) => (
                  <div key={fi} className="guide-feature">
                    <span className="guide-feature-icon">{feature.icon}</span>
                    <p className="guide-feature-text">
                      <span className="guide-feature-name">{feature.name}</span>
                      {' — '}
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="guide-dots">
        {GUIDE_CARDS.map((_, index) => (
          <button
            key={index}
            className={`guide-dot ${index === currentCard ? 'guide-dot-active' : 'guide-dot-inactive'}`}
            onClick={() => goTo(index)}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4 px-6 pb-6 md:px-8 md:pb-8">
        {!isFirst && (
          <button
            onClick={() => goTo(currentCard - 1)}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-lg border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={isLast ? onComplete : () => goTo(currentCard + 1)}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-colors"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
