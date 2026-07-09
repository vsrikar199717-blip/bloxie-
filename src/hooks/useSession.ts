import { useReducer, useCallback } from 'react';
import type { SessionState, SessionAction, WordSet, WordSegment, WordStatus } from '../types';
import { CONSTANTS } from '../utils/constants';

const initialState: SessionState = {
  wordSets: [],
  currentSetIndex: 0,
  currentWordIndex: 0,
  isShowingStory: false,
  isShowingPreBonusBreak: false,
  isShowingBonusTransition: false,
  correctWordsThisSession: 0,
  totalWordsAttempted: 0,
  objectsEarned: 0,
  completedSetIds: [],
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'LOAD_CONTENT':
      return {
        ...initialState,
        wordSets: action.wordSets,
      };

    case 'MARK_WORD': {
      const currentSet = state.wordSets[state.currentSetIndex];
      const phonicsCount = currentSet?.phonicsWords.length ?? CONSTANTS.session.phonicsWordsPerSet;
      const totalWords = phonicsCount + CONSTANTS.session.bonusWordsPerSet;
      const isBonusWord = state.currentWordIndex >= phonicsCount;
      const objectsToAdd = isBonusWord ? 3 : 1;
      const newWordIndex = state.currentWordIndex + 1;
      const isSetComplete = newWordIndex >= totalWords;
      const isTransitioningToBonus = newWordIndex === phonicsCount && !isSetComplete;

      return {
        ...state,
        currentWordIndex: newWordIndex,
        correctWordsThisSession: state.correctWordsThisSession + 1,
        totalWordsAttempted: state.totalWordsAttempted + 1,
        objectsEarned: state.objectsEarned + objectsToAdd,
        isShowingStory: isSetComplete,
        isShowingPreBonusBreak: isTransitioningToBonus,
        isShowingBonusTransition: false,
        completedSetIds: isSetComplete && currentSet
          ? [...state.completedSetIds, currentSet.id]
          : state.completedSetIds,
      };
    }

    case 'MARK_SKIPPED': {
      const currentSet = state.wordSets[state.currentSetIndex];
      const phonicsCount = currentSet?.phonicsWords.length ?? CONSTANTS.session.phonicsWordsPerSet;
      const totalWords = phonicsCount + CONSTANTS.session.bonusWordsPerSet;
      const newWordIndex = state.currentWordIndex + 1;
      const isSetComplete = newWordIndex >= totalWords;
      const isTransitioningToBonus = newWordIndex === phonicsCount && !isSetComplete;

      return {
        ...state,
        currentWordIndex: newWordIndex,
        totalWordsAttempted: state.totalWordsAttempted + 1,
        isShowingStory: isSetComplete,
        isShowingPreBonusBreak: isTransitioningToBonus,
        isShowingBonusTransition: false,
        completedSetIds: isSetComplete && currentSet
          ? [...state.completedSetIds, currentSet.id]
          : state.completedSetIds,
      };
    }

    case 'END_PRE_BONUS_BREAK':
      return {
        ...state,
        isShowingPreBonusBreak: false,
        isShowingBonusTransition: true,
      };

    case 'SHOW_BONUS_TRANSITION':
      return {
        ...state,
        isShowingBonusTransition: true,
      };

    case 'DISMISS_BONUS_TRANSITION':
      return {
        ...state,
        isShowingBonusTransition: false,
      };

    case 'COMPLETE_STORY':
      return {
        ...state,
        isShowingStory: false,
        currentSetIndex: state.currentSetIndex + 1,
        currentWordIndex: 0,
      };

    case 'GO_BACK': {
      if (state.currentWordIndex <= 0) return state;
      return {
        ...state,
        currentWordIndex: state.currentWordIndex - 1,
        isShowingPreBonusBreak: false,
        isShowingBonusTransition: false,
        isShowingStory: false,
      };
    }

    case 'RESET':
      return {
        ...initialState,
        wordSets: state.wordSets,
      };

    case 'END_SESSION':
      return {
        ...state,
        currentSetIndex: state.wordSets.length,
        isShowingStory: false,
        isShowingPreBonusBreak: false,
        isShowingBonusTransition: false,
      };

    default:
      return state;
  }
}

// Helper to get current word data from the new structure
function getCurrentWordData(wordSet: WordSet | undefined, wordIndex: number): {
  word: string;
  teachingTip: string;
  segments?: WordSegment[];
  isBonus: boolean;
} | undefined {
  if (!wordSet) return undefined;

  const phonicsCount = wordSet.phonicsWords.length;

  if (wordIndex < phonicsCount) {
    // It's a phonics word
    const phonicsWord = wordSet.phonicsWords[wordIndex];
    return {
      word: phonicsWord.word,
      teachingTip: phonicsWord.teachingTip,
      segments: phonicsWord.segments,
      isBonus: false,
    };
  } else if (wordIndex === phonicsCount) {
    // It's the bonus word (no segments — tricky words don't get marks)
    return {
      word: wordSet.bonusWord.word,
      teachingTip: wordSet.bonusWord.teachingTip,
      segments: undefined,
      isBonus: true,
    };
  }

  return undefined;
}

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const loadContent = useCallback((wordSets: WordSet[]) => {
    dispatch({ type: 'LOAD_CONTENT', wordSets });
  }, []);

  const markWord = useCallback((status: WordStatus) => {
    dispatch({ type: 'MARK_WORD', status });
  }, []);

  const markSkipped = useCallback(() => {
    dispatch({ type: 'MARK_SKIPPED' });
  }, []);

  const showBonusTransition = useCallback(() => {
    dispatch({ type: 'SHOW_BONUS_TRANSITION' });
  }, []);

  const endPreBonusBreak = useCallback(() => {
    dispatch({ type: 'END_PRE_BONUS_BREAK' });
  }, []);

  const dismissBonusTransition = useCallback(() => {
    dispatch({ type: 'DISMISS_BONUS_TRANSITION' });
  }, []);

  const completeStory = useCallback(() => {
    dispatch({ type: 'COMPLETE_STORY' });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const endSession = useCallback(() => {
    dispatch({ type: 'END_SESSION' });
  }, []);

  // Computed values
  const currentWordSet = state.wordSets[state.currentSetIndex];
  const currentWordData = getCurrentWordData(currentWordSet, state.currentWordIndex);
  const currentWord = currentWordData?.word;
  const currentTeachingTip = currentWordData?.teachingTip;
  const currentSegments: WordSegment[] | undefined = currentWordData?.segments;
  const isCurrentWordBonus = currentWordData?.isBonus ?? false;
  const currentPattern = currentWordSet?.pattern;

  // Check if we're about to show the bonus word (just finished phonics words)
  const phonicsCount = currentWordSet?.phonicsWords.length ?? CONSTANTS.session.phonicsWordsPerSet;
  const shouldShowBonusTransition =
    state.currentWordIndex === phonicsCount &&
    !state.isShowingBonusTransition &&
    !state.isShowingStory;

  const hasLoadedContent = state.wordSets.length > 0;
  const isSessionComplete =
    hasLoadedContent &&
    state.currentSetIndex >= state.wordSets.length &&
    !state.isShowingStory;
  const hasMoreSets = state.currentSetIndex < state.wordSets.length - 1;

  return {
    state,
    currentWordSet,
    currentWord,
    currentTeachingTip,
    currentSegments,
    isCurrentWordBonus,
    currentPattern,
    shouldShowBonusTransition,
    isSessionComplete,
    hasMoreSets,
    loadContent,
    markWord,
    markSkipped,
    showBonusTransition,
    endPreBonusBreak,
    dismissBonusTransition,
    completeStory,
    goBack,
    reset,
    endSession,
  };
}
