import { useEffect } from 'react';
import { LabWordPanel } from './LabWordPanel';
import { LabBonusCard } from './LabBonusCard';
import { StoryScreen } from './StoryScreen';
import { SessionSummary } from './SessionSummary';
import { MobileReadingAids } from './MobileReadingAids';
import type { WordSet, WordSegment, WordStatus } from '../../types';
import type { ReadingAids, WordAttempt, Theme } from '../../types/profile';

interface ReadingZoneProps {
  currentWord: string | undefined;
  currentTeachingTip: string | undefined;
  currentSegments: WordSegment[] | undefined;
  isCurrentWordBonus: boolean;
  currentPattern: string | undefined;
  currentWordSet: WordSet | undefined;
  currentWordIndex: number;
  totalWordsInSet: number;
  visualPhonemeMarking: boolean;
  isShowingStory: boolean;
  isShowingPreBonusBreak: boolean;
  isShowingBonusTransition: boolean;
  isSessionComplete: boolean;
  readingAids: ReadingAids;
  onCorrect: (status: WordStatus) => void;
  onSkip: () => void;
  onGoBack: () => void;
  onCompleteStory: () => void;
  onEndPreBonusBreak: () => void;
  onDismissBonusTransition: () => void;
  onSpeak: (text: string) => void;
  onSpeakStoryWithHighlight: (
    text: string,
    onWordBoundary?: (charIndex: number) => void,
    onEnd?: () => void
  ) => void;
  onStopStory: () => void;
  profileName: string;
  // Session summary props
  sessionAttempts: WordAttempt[];
  wordSets: WordSet[];
  onExitSession: () => void;
  onUpdateWordStatus: (attemptId: string, newStatus: WordAttempt['status']) => void;
  onPersistPracticeAttempt: (word: string, status: WordAttempt['status'], setId: string, phase: number) => void;
  // Mobile reading aids callbacks
  onUpdateReadingAids: (aids: ReadingAids) => void;
  onTogglePhonemeMarking: () => void;
  theme?: Theme;
  onChangeTheme?: (theme: Theme) => void;
  onOpenSettings?: () => void;
  bgColor?: string;
}

export function ReadingZone({
  currentWord,
  currentTeachingTip,
  currentSegments,
  isCurrentWordBonus,
  currentPattern,
  currentWordSet,
  currentWordIndex,
  totalWordsInSet,
  visualPhonemeMarking,
  isShowingStory,
  isShowingPreBonusBreak,
  isShowingBonusTransition,
  isSessionComplete,
  readingAids,
  onCorrect,
  onSkip,
  onGoBack,
  onCompleteStory,
  onEndPreBonusBreak,
  onDismissBonusTransition,
  onSpeak,
  onSpeakStoryWithHighlight,
  onStopStory,
  profileName,
  sessionAttempts,
  wordSets,
  onExitSession,
  onUpdateWordStatus,
  onPersistPracticeAttempt,
  onUpdateReadingAids,
  onTogglePhonemeMarking,
  theme,
  onChangeTheme,
  onOpenSettings,
  bgColor,
}: ReadingZoneProps) {
  // Auto-advance from pre-bonus break to bonus transition after a brief pause
  useEffect(() => {
    if (isShowingPreBonusBreak) {
      const timer = setTimeout(() => {
        onEndPreBonusBreak();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isShowingPreBonusBreak, onEndPreBonusBreak]);

  // Pre-bonus break: brief visual before the bonus transition
  if (isShowingPreBonusBreak) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-5xl animate-bounce">⭐</div>
      </div>
    );
  }

  // Bonus intro — inline card in the reading panel (not a separate screen)
  if (isShowingBonusTransition) {
    return <LabBonusCard onComplete={onDismissBonusTransition} bgColor={bgColor} />;
  }

  // Session complete state — show summary with word-level breakdown
  if (isSessionComplete) {
    return (
      <SessionSummary
        sessionAttempts={sessionAttempts}
        profileName={profileName}
        wordSets={wordSets}
        readingAids={readingAids}
        visualPhonemeMarking={visualPhonemeMarking}
        onExitSession={onExitSession}
        onUpdateWordStatus={onUpdateWordStatus}
        onCorrect={onCorrect}
        onSkip={onSkip}
        onSpeak={onSpeak}
        onPersistPracticeAttempt={onPersistPracticeAttempt}
      />
    );
  }

  // Mobile reading aids (shown in both word and story mode)
  const mobileAids = (
    <MobileReadingAids
      readingAids={readingAids}
      onUpdateReadingAids={onUpdateReadingAids}
      visualPhonemeMarking={visualPhonemeMarking}
      onTogglePhonemeMarking={onTogglePhonemeMarking}
    />
  );

  // Story mode
  if (isShowingStory && currentWordSet) {
    const wordSetWords = [
      ...currentWordSet.phonicsWords.map(pw => pw.word),
      currentWordSet.bonusWord.word,
    ];

    return (
      <div className="h-full relative">
        {mobileAids}
        <StoryScreen
          story={currentWordSet.story}
          wordSetWords={wordSetWords}
          phonicsWords={currentWordSet.phonicsWords}
          onNext={onCompleteStory}
          onPlayStoryWithHighlight={onSpeakStoryWithHighlight}
          onStopStory={onStopStory}
          readingAids={readingAids}
          visualPhonemeMarking={visualPhonemeMarking}
        />
      </div>
    );
  }

  // Word mode
  if (currentWord && currentTeachingTip) {
    return (
      <div className="h-full relative">
        {mobileAids}
        <LabWordPanel
          word={currentWord}
          teachingTip={currentTeachingTip}
          segments={currentSegments}
          isBonus={isCurrentWordBonus}
          pattern={currentPattern}
          wordNumber={currentWordIndex + 1}
          totalWords={totalWordsInSet}
          readingAids={readingAids}
          visualPhonemeMarking={visualPhonemeMarking}
          onCorrect={onCorrect}
          onSkip={onSkip}
          onGoBack={onGoBack}
          onSpeak={() => onSpeak(currentWord)}
          profileName={profileName}
          theme={theme}
          onChangeTheme={onChangeTheme}
          onOpenSettings={onOpenSettings}
          bgColor={bgColor}
        />
      </div>
    );
  }

  // Loading/empty state
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-2xl text-gray-500">Loading...</div>
    </div>
  );
}
