import { useState, useMemo } from 'react';
import { ActionButton } from '../ui/ActionButton';
import { StoryDisplayLightbox } from './StoryDisplayLightbox';
import { StoryWithRuler } from './StoryWithRuler';
import { CONSTANTS } from '../../utils/constants';
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
      style={{ backgroundColor: CONSTANTS.colors.background }}
    >
      {/* Header */}
      <div className="text-center mb-2 md:mb-4">
        <div className="text-2xl md:text-4xl mb-0.5 md:mb-2">📖</div>
        <h2 className="text-lg md:text-2xl font-bold text-gray-700">Story time!</h2>
        <p className="hidden md:block text-gray-500 text-sm">Listen to the story</p>
      </div>

      {/* Outer: scroll container — min-h-0 lets flex-1 shrink, overflow-y-auto enables scrolling */}
      {/* Inner: centering wrapper — min-h-full so short stories stay vertically centered */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full py-2">
          {renderStoryDisplay()}
        </div>
      </div>

      {/* Action buttons — flex-shrink-0 keeps the bar always visible */}
      <div className="flex flex-col gap-2 md:gap-4 flex-shrink-0">
        <ActionButton onClick={handlePlay} color="blue">
          {hasPlayed ? '🔁 Replay story' : '🔊 Play story'}
        </ActionButton>
        {isPlaying && (
          <ActionButton onClick={handleStop} color="secondary">
            ⏸ Stop story
          </ActionButton>
        )}
        <ActionButton onClick={() => { onStopStory(); onNext(); }} color="primary">
          Next set →
        </ActionButton>
      </div>
    </div>
  );
}
