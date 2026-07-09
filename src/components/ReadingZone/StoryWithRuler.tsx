import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CONSTANTS } from '../../utils/constants';
import { PhonemeMarkedWord } from './PhonemeMarkedWord';
import type { WordSegment } from '../../types';
import './storyScreen.css';

/** Split a word token into prefix punctuation, core word, and suffix punctuation */
function splitPunctuation(token: string): { prefix: string; core: string; suffix: string } {
  const prefixMatch = token.match(/^([.,!?;:'"]*)/);
  const suffixMatch = token.match(/([.,!?;:'""]*)$/);
  const prefix = prefixMatch?.[1] ?? '';
  const suffix = suffixMatch?.[1] ?? '';
  const core = token.slice(prefix.length, token.length - suffix.length || undefined);
  return { prefix, core, suffix };
}

interface StoryWithRulerProps {
  story: string;
  wordSetWords: string[];
  segmentLookup: Map<string, WordSegment[]>;
  visualPhonemeMarking: boolean;
}

export function StoryWithRuler({ story, wordSetWords, segmentLookup, visualPhonemeMarking }: StoryWithRulerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [rulerY, setRulerY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lineHeight, setLineHeight] = useState(48);
  const [containerBounds, setContainerBounds] = useState({ top: 0, bottom: 0 });

  // Use ref to track drag state for document event listeners (avoids stale closures)
  const dragStateRef = useRef({
    isDragging: false,
    lineHeight: 48,
    containerBounds: { top: 0, bottom: 0 }
  });

  // Create lowercase set of word set words for matching
  const wordSetLower = useMemo(() => {
    return new Set(wordSetWords.map((w) => w.toLowerCase()));
  }, [wordSetWords]);

  // Keep dragStateRef in sync with state
  useEffect(() => {
    dragStateRef.current.lineHeight = lineHeight;
    dragStateRef.current.containerBounds = containerBounds;
  }, [lineHeight, containerBounds]);

  // Calculate line height and container bounds on mount and resize
  useEffect(() => {
    const updateMeasurements = () => {
      if (textRef.current && containerRef.current) {
        const computedStyle = window.getComputedStyle(textRef.current);
        const fontSize = parseFloat(computedStyle.fontSize);
        const lh = fontSize * Number(CONSTANTS.typography.lineHeight);
        setLineHeight(lh);

        const containerRect = containerRef.current.getBoundingClientRect();
        const textRect = textRef.current.getBoundingClientRect();

        // Set bounds relative to container
        const bounds = {
          top: textRect.top - containerRect.top,
          bottom: textRect.bottom - containerRect.top,
        };
        setContainerBounds(bounds);

        // Position ruler under first line
        setRulerY(textRect.top - containerRect.top + lh);
      }
    };

    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [story]);

  // Document-level pointer move handler for smooth touch dragging
  useEffect(() => {
    const handleDocumentPointerMove = (e: PointerEvent) => {
      if (!dragStateRef.current.isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;
      const { lineHeight: lh, containerBounds: bounds } = dragStateRef.current;

      // Snap to line height increments
      const snappedY =
        Math.round((relativeY - bounds.top) / lh) * lh + bounds.top;

      // Constrain to container bounds
      const constrainedY = Math.max(
        bounds.top + lh,
        Math.min(bounds.bottom, snappedY)
      );

      setRulerY(constrainedY);
    };

    const handleDocumentPointerUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
      }
    };

    document.addEventListener('pointermove', handleDocumentPointerMove);
    document.addEventListener('pointerup', handleDocumentPointerUp);
    document.addEventListener('pointercancel', handleDocumentPointerUp);

    return () => {
      document.removeEventListener('pointermove', handleDocumentPointerMove);
      document.removeEventListener('pointerup', handleDocumentPointerUp);
      document.removeEventListener('pointercancel', handleDocumentPointerUp);
    };
  }, []);

  // Handle drag start on ruler
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragStateRef.current.isDragging = true;
    setIsDragging(true);
  }, []);

  // Render text with word set words bolded and phoneme marks
  const renderStoryWithBoldWords = () => {
    const parts = story.split(/(\s+)/);

    return parts.map((part, idx) => {
      const isWhitespace = /^\s+$/.test(part);
      if (isWhitespace) return <span key={idx}>{part}</span>;

      const { prefix, core, suffix } = splitPunctuation(part);
      const cleanWord = core.toLowerCase();
      const isBold = wordSetLower.has(cleanWord);
      const segments = segmentLookup.get(cleanWord);

      const wordContent = (
        <>
          {prefix && <span>{prefix}</span>}
          <PhonemeMarkedWord
            word={core}
            segments={segments}
            size="story"
            showMarks={visualPhonemeMarking && !!segments}
            emphasis="subtle"
          />
          {suffix && <span>{suffix}</span>}
        </>
      );

      if (isBold) {
        return (
          <span key={idx} className="font-bold text-blue-700">
            {wordContent}
          </span>
        );
      }
      return <span key={idx}>{wordContent}</span>;
    });
  };

  return (
    <div
      ref={containerRef}
      className="story-with-ruler max-w-xl text-center"
      style={{ position: 'relative' }}
    >
      <span
        ref={textRef}
        className="story-text-ruler dyslexia-text text-xl md:text-3xl text-black"
        style={{
          letterSpacing: CONSTANTS.typography.letterSpacing,
          lineHeight: visualPhonemeMarking ? 2.2 : CONSTANTS.typography.lineHeight,
          display: 'block',
        }}
      >
        {renderStoryWithBoldWords()}
      </span>

      {/* Draggable ruler line */}
      <div
        className={`ruler-line ${isDragging ? 'ruler-dragging' : ''}`}
        style={{
          top: `${rulerY}px`,
          touchAction: 'none', // Prevent scroll while dragging
        }}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}
