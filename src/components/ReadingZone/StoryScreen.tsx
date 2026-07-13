import { useState, useMemo } from 'react';
import { ActionButton } from '../ui/ActionButton';
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

export function StoryScreen({
  story,
  wordSetWords,
  phonicsWords,
  onNext,
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
      {/* Inner: centering wrapper — min-h-full so short stories stay vertically centered */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full py-2">
          {renderStoryDisplay()}
        </div>
      </div>

      {/* Action buttons — flex-shrink-0 keeps the bar always visible */}
      <div className="flex flex-col gap-2 md:gap-3 flex-shrink-0">
        {isPlaying ? (
          <ActionButton onClick={handleStop} color="outline">
            Stop
          </ActionButton>
        ) : (
          <ActionButton onClick={handlePlay} color="sunny">
            {hasPlayed ? 'Play it again' : 'Listen to the story'}
          </ActionButton>
        )}
        <ActionButton onClick={() => { onStopStory(); onNext(); }} color="ink">
          Next set →
        </ActionButton>
      </div>
    </div>
  );
}
