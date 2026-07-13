import { useState, useMemo } from 'react';
import { StoryDisplayLightbox } from './StoryDisplayLightbox';
import { StoryWithRuler } from './StoryWithRuler';
import type { PhonicsWord, WordSegment } from '../../types';
import type { ReadingAids } from '../../types/profile';
import './storyScreen.css';

interface StoryScreenProps {
  story: string;
  wordSetWords: string[];
  phonicsWords: PhonicsWord[];
  onNext: () => void;
  /** Step back to the last word of this set. */
  onGoBack: () => void;
  /** Finish the session early and go to the parent recap. */
  onEndSession: () => void;
  onPlayStoryWithHighlight: (
    text: string,
    onWordBoundary?: (charIndex: number) => void,
    onEnd?: () => void
  ) => void;
  onStopStory: () => void;
  readingAids: ReadingAids;
  visualPhonemeMarking: boolean;
  /** The child's chosen reading colour, same as every other reading panel. */
  bgColor?: string;
}

/** Black circular control, sized to stay a comfortable touch target. */
function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-[#8A8378] border border-[#EFE6D8] grid place-items-center shadow-[0_2px_8px_rgba(60,50,20,.08)] transition hover:text-[#2B2A32] active:scale-95"
    >
      {children}
    </button>
  );
}

const iconProps = {
  className: 'w-5 h-5 md:w-6 md:h-6',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function StoryScreen({
  story,
  wordSetWords,
  phonicsWords,
  onNext,
  onGoBack,
  onEndSession,
  onPlayStoryWithHighlight,
  onStopStory,
  readingAids,
  visualPhonemeMarking,
  bgColor,
}: StoryScreenProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Build segment lookup map from phonics words only (not bonus/tricky)
  const segmentLookup = useMemo((): Map<string, WordSegment[]> => {
    const map = new Map<string, WordSegment[]>();
    for (const pw of phonicsWords) {
      if (pw.segments) {
        map.set(pw.word.toLowerCase(), pw.segments);
      }
    }
    return map;
  }, [phonicsWords]);

  const handlePlay = () => {
    setHasPlayed(true);
    setIsPlaying(true);
    onPlayStoryWithHighlight(story, undefined, () => setIsPlaying(false));
  };

  const handleStop = () => {
    onStopStory();
    setIsPlaying(false);
  };

  // Render the appropriate story display based on reading aids state
  const renderStoryDisplay = () => {
    if (readingAids.ruler) {
      return (
        <StoryWithRuler
          story={story}
          wordSetWords={wordSetWords}
          segmentLookup={segmentLookup}
          visualPhonemeMarking={visualPhonemeMarking}
        />
      );
    }

    return (
      <StoryDisplayLightbox
        story={story}
        wordSetWords={wordSetWords}
        lightboxOn={readingAids.lightbox}
        segmentLookup={segmentLookup}
        visualPhonemeMarking={visualPhonemeMarking}
      />
    );
  };

  return (
    <div
      className="h-full flex flex-col p-4 md:p-8"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header */}
      <div className="story-header">
        <h2 className="font-display">Story time</h2>
        <p className="subtext">Read it together, then listen back.</p>
      </div>

      {/* Outer: scroll container — min-h-0 lets flex-1 shrink, overflow-y-auto enables scrolling */}
      {/* Inner: left-aligned wrapper — min-h-full so short stories stay vertically centred */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-start min-h-full py-2">
          {renderStoryDisplay()}
        </div>
      </div>

      {/* Control bar — icon controls left, end session right. flex-shrink-0 keeps it always visible. */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0 pt-2">
        {/* The play control carries a label — three identical unlabelled circles
            gave no clue which was which. The arrows stay small and quiet so the
            listen action is clearly the main one, same shape as the word
            panel's "Sound it out". */}
        <div className="flex items-center gap-3">
          <IconButton onClick={() => { onStopStory(); onGoBack(); }} label="Back to the last word">
            <svg {...iconProps}>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </IconButton>

          <button
            onClick={isPlaying ? handleStop : handlePlay}
            className="flex items-center gap-2 rounded-full bg-[#6C5CE7] text-white px-5 py-2.5 text-sm md:text-base font-semibold shadow-[0_8px_20px_rgba(108,92,231,.30)] transition hover:bg-[#5c4cd6] active:scale-95"
          >
            {isPlaying ? (
              <>
                <svg {...iconProps} className="w-4 h-4">
                  <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg {...iconProps} className="w-4 h-4">
                  <path d="M20 11a8 8 0 10-2.3 6.3" />
                  <path d="M20 5v6h-6" />
                </svg>
                {hasPlayed ? 'Play it again' : 'Listen to the story'}
              </>
            )}
          </button>

          <IconButton onClick={() => { onStopStory(); onNext(); }} label="Next set">
            <svg {...iconProps}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </IconButton>
        </div>

        <button
          onClick={() => { onStopStory(); onEndSession(); }}
          className="flex items-center gap-1.5 pl-5 pr-4 py-2.5 rounded-full bg-[#F5851F] text-white font-bold text-sm shadow-[0_6px_16px_rgba(245,133,31,0.32)] transition hover:bg-[#e0761a] active:scale-95"
        >
          End session
          <svg {...iconProps} className="w-4 h-4">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
