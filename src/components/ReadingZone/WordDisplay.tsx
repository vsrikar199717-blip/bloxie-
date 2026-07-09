import { useState, useCallback } from 'react';
import { ReadingGuide } from '../ui/ReadingGuide';
import { StyledText } from '../ui/StyledText';
import { PhonemeMarkedWord } from './PhonemeMarkedWord';
import type { WordSegment, WordStatus } from '../../types';
import type { ReadingAids } from '../../types/profile';

interface WordDisplayProps {
  word: string;
  teachingTip: string;
  segments?: WordSegment[];
  isBonus: boolean;
  pattern?: string;
  wordNumber: number;
  totalWords: number;
  readingAids: ReadingAids;
  visualPhonemeMarking: boolean;
  onCorrect: (status: WordStatus) => void;
  onSkip: () => void;
  onGoBack: () => void;
  onSpeak: () => void;
  profileName: string;
}

export function WordDisplay({
  word,
  teachingTip,
  segments,
  isBonus,
  pattern,
  wordNumber,
  totalWords,
  readingAids,
  visualPhonemeMarking,
  onCorrect,
  onSkip,
  onGoBack,
  onSpeak,
  profileName,
}: WordDisplayProps) {
  const [isLit, setIsLit] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const handlePointerDown = useCallback(() => {
    if (readingAids.lightbox) setIsLit(true);
  }, [readingAids.lightbox]);

  const handlePointerUp = useCallback(() => {
    setIsLit(false);
  }, []);

  return (
    <div className="relative flex flex-col h-full p-4 md:p-8">
      {/* Pattern/Bonus + Teaching tip */}
      <div className="flex flex-row flex-wrap justify-end items-center gap-2 mb-2 md:mb-0 md:absolute md:top-4 md:right-4 md:flex-col md:items-end md:z-10">
        {!isBonus && pattern && (
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Pattern: {pattern}
          </span>
        )}
        {isBonus && (
          <span className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
            ⭐ BONUS
          </span>
        )}
        <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
          Word {wordNumber} of {totalWords}
        </span>
      </div>

      {/* Word display area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Speaker button + word */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={onSpeak}
            className="w-[60px] h-[60px] md:w-[84px] md:h-[84px] rounded-full bg-[#F5F5F5] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label="Listen to word"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#333]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>

          <div
            className={`
              flex flex-col items-center gap-2 p-3 md:p-8 rounded-2xl
              ${isBonus ? 'bg-yellow-100 border-4 border-yellow-400 shadow-lg' : ''}
            `}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <div
              className={
                readingAids.lightbox
                  ? isLit
                    ? 'word-lit rounded-lg'
                    : 'word-dim'
                  : ''
              }
              style={{ transition: 'opacity 0.15s ease, background-color 0.15s ease' }}
            >
              <StyledText size="word">
                <PhonemeMarkedWord
                  word={word}
                  segments={segments}
                  size="word"
                  showMarks={visualPhonemeMarking}
                  emphasis="full"
                />
              </StyledText>
            </div>
            <div style={{ marginTop: visualPhonemeMarking && segments ? '8px' : '0' }}>
              {readingAids.ruler && (
                <ReadingGuide width={`${word.length * 45}px`} />
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 md:gap-3">
        {/* Break it down — shows teaching tip for parents */}
        <div className="relative">
          <button
            onClick={() => setShowTip(!showTip)}
            className="flex items-center gap-2 w-fit px-5 py-2.5 bg-white border border-[#EE0] rounded-[23px] text-sm md:text-base font-semibold text-black cursor-pointer transition-colors hover:bg-[#FFFDE0] active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            Break it down
          </button>
          {showTip && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowTip(false)}
              />
              <div className="absolute bottom-14 left-0 w-72 p-4 bg-white rounded-xl shadow-xl border-2 border-blue-200 z-20">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <span>💡</span>
                  <span className="text-sm font-semibold">Tips for grown ups</span>
                </div>
                <div className="text-base text-gray-700 leading-relaxed">
                  {teachingTip}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Assessment buttons row */}
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          {/* Try again — practice */}
          <button
            onClick={() => onCorrect('practice')}
            className="flex-1 px-5 py-3 bg-[#CD0000] border-2 border-[#CD0000] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#B00000] active:scale-95"
          >
            🔁 Needs more practice
          </button>

          {/* Used a little help — support (orange) */}
          <button
            onClick={() => onCorrect('support')}
            className="flex-1 px-5 py-3 bg-[#F97316] border-2 border-[#EA580C] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#EA580C] active:scale-95"
          >
            🤝 {profileName} used a little help
          </button>

          {/* Nailed it — independent (green) */}
          <button
            onClick={() => onCorrect('independent')}
            className="flex-1 px-5 py-3 bg-[#22C55E] border-2 border-[#16A34A] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#16A34A] active:scale-95"
          >
            🎉 {profileName} nailed it!
          </button>
        </div>

        {/* Go back + Skip buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onGoBack}
            className="w-[38px] h-[38px] rounded-[12px] bg-black flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label="Go back one word"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </button>
          <button
            onClick={onSkip}
            className="w-[38px] h-[38px] rounded-[12px] bg-[#3673E2] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
            aria-label="Skip word"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
