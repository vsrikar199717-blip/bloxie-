import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CONSTANTS } from '../../utils/constants';
import { PhonemeMarkedWord } from './PhonemeMarkedWord';
import type { WordSegment } from '../../types';
import './storyScreen.css';

interface StoryDisplayLightboxProps {
  story: string;
  wordSetWords: string[];
  lightboxOn: boolean;
  segmentLookup: Map<string, WordSegment[]>;
  visualPhonemeMarking: boolean;
}

interface WordInfo {
  text: string;
  index: number;
  isBold: boolean;
}

/** Split a word token into prefix punctuation, core word, and suffix punctuation */
function splitPunctuation(token: string): { prefix: string; core: string; suffix: string } {
  const prefixMatch = token.match(/^([.,!?;:'"]*)/);
  const suffixMatch = token.match(/([.,!?;:'""]*)$/);
  const prefix = prefixMatch?.[1] ?? '';
  const suffix = suffixMatch?.[1] ?? '';
  const core = token.slice(prefix.length, token.length - suffix.length || undefined);
  return { prefix, core, suffix };
}

export function StoryDisplayLightbox({
  story,
  wordSetWords,
  lightboxOn,
  segmentLookup,
  visualPhonemeMarking,
}: StoryDisplayLightboxProps) {
  const [litWordIndex, setLitWordIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  // Create lowercase set of word set words for matching
  const wordSetLower = useMemo(() => {
    return new Set(wordSetWords.map((w) => w.toLowerCase()));
  }, [wordSetWords]);

  // Parse story into words with metadata
  const words = useMemo((): WordInfo[] => {
    const parts = story.split(/(\s+)/);
    let wordIndex = 0;

    return parts.map((part) => {
      const isWhitespace = /^\s+$/.test(part);
      if (isWhitespace) {
        return { text: part, index: -1, isBold: false };
      }

      const cleanWord = part.replace(/[.,!?;:'"]/g, '').toLowerCase();
      const isBold = wordSetLower.has(cleanWord);
      const info = { text: part, index: wordIndex, isBold };
      wordIndex++;
      return info;
    });
  }, [story, wordSetLower]);

  // Offset touch position upward so the finger doesn't cover the highlighted word
  const TOUCH_OFFSET_Y = 60;

  // Find word at touch/mouse position
  const findWordAtPosition = useCallback(
    (clientX: number, clientY: number, isTouch: boolean): number | null => {
      const adjustedY = isTouch ? clientY - TOUCH_OFFSET_Y : clientY;
      for (const [index, element] of wordRefs.current.entries()) {
        const rect = element.getBoundingClientRect();
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          adjustedY >= rect.top &&
          adjustedY <= rect.bottom
        ) {
          return index;
        }
      }
      return null;
    },
    []
  );

  // Handle pointer events for lightbox
  // Word stays lit until user taps another word (not cleared on pointer up)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!lightboxOn) return;
      const isTouch = e.pointerType === 'touch';
      const wordIndex = findWordAtPosition(e.clientX, e.clientY, isTouch);
      // Only update if tapping on a word (keep current word lit if tapping empty space)
      if (wordIndex !== null) {
        setLitWordIndex(wordIndex);
      }
    },
    [lightboxOn, findWordAtPosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!lightboxOn || e.buttons === 0) return;
      const isTouch = e.pointerType === 'touch';
      const wordIndex = findWordAtPosition(e.clientX, e.clientY, isTouch);
      // Only update lit word when dragging over a word
      if (wordIndex !== null) {
        setLitWordIndex(wordIndex);
      }
    },
    [lightboxOn, findWordAtPosition]
  );

  // Clear lit word when lightbox is turned off
  useEffect(() => {
    if (!lightboxOn) {
      setLitWordIndex(null);
    }
  }, [lightboxOn]);

  // Set ref for word element
  const setWordRef = useCallback(
    (element: HTMLSpanElement | null, index: number) => {
      if (element) {
        wordRefs.current.set(index, element);
      } else {
        wordRefs.current.delete(index);
      }
    },
    []
  );

  // Get class for word based on lightbox state
  const getWordClass = (wordInfo: WordInfo): string => {
    const classes: string[] = ['word-container'];

    if (wordInfo.isBold) {
      classes.push('word-bold');
    }

    if (!lightboxOn) {
      classes.push('word-normal');
    } else if (wordInfo.index === litWordIndex) {
      classes.push('word-lit');
    } else {
      classes.push('word-dim');
    }

    return classes.join(' ');
  };

  // Determine emphasis for a word based on lightbox state
  const getEmphasis = (wordInfo: WordInfo): 'full' | 'subtle' => {
    if (!lightboxOn) return 'subtle';
    if (wordInfo.index === litWordIndex) return 'full';
    return 'subtle'; // dimmed words won't show marks anyway (CSS hides them)
  };

  // Should marks be shown for this word?
  const shouldShowMarks = (wordInfo: WordInfo): boolean => {
    if (!visualPhonemeMarking) return false;
    // In lightbox mode, hide marks on dimmed words
    if (lightboxOn && wordInfo.index !== litWordIndex) return false;
    return true;
  };

  // Render word content with optional phoneme marks
  const renderWordContent = (wordInfo: WordInfo) => {
    const { prefix, core, suffix } = splitPunctuation(wordInfo.text);
    const segments = segmentLookup.get(core.toLowerCase());
    const showMarks = shouldShowMarks(wordInfo) && !!segments;

    return (
      <>
        {prefix && <span>{prefix}</span>}
        <PhonemeMarkedWord
          word={core}
          segments={segments}
          size="story"
          showMarks={showMarks}
          emphasis={getEmphasis(wordInfo)}
        />
        {suffix && <span>{suffix}</span>}
      </>
    );
  };

  // Increase line-height when marks are enabled to prevent overlap
  const storyLineHeight = visualPhonemeMarking
    ? 2.2
    : CONSTANTS.typography.lineHeight;

  return (
    <div
      ref={containerRef}
      className="story-container max-w-xl text-center"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <span
        className="dyslexia-text text-xl md:text-3xl text-black"
        style={{
          letterSpacing: CONSTANTS.typography.letterSpacing,
          lineHeight: storyLineHeight,
        }}
      >
        {words.map((wordInfo, idx) => {
          if (wordInfo.index === -1) {
            // Whitespace
            return <span key={idx}>{wordInfo.text}</span>;
          }

          return (
            <span
              key={idx}
              ref={(el) => setWordRef(el, wordInfo.index)}
              className={getWordClass(wordInfo)}
            >
              {renderWordContent(wordInfo)}
            </span>
          );
        })}
      </span>
    </div>
  );
}
