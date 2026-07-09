import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadingZone } from './ReadingZone/ReadingZone';
import { BuildingZone } from './BuildingZone/BuildingZone';
import { GuideContent } from './ParentGuide/GuideContent';
import { useSession } from '../hooks/useSession';
import { useSpeech } from '../hooks/useSpeech';
import { useSound } from '../hooks/useSound';
import { usePartSystem, type WordPosition } from '../hooks/usePartSystem';
import type { WordSet, WordStatus } from '../types';
import type { ChildProfile, PhonicsPhase, ReadingAids, Theme, WordAttempt } from '../types/profile';
import { getDefaultReadingAids } from '../types/profile';
import { CONSTANTS } from '../utils/constants';
import wordSetsData from '../data/wordSets.json';

interface SessionScreenProps {
  onFinish: () => void;
  onOpenSettings: () => void;
  onChangeTheme: () => void;
  activeProfile: ChildProfile | null;
  onUpdateReadingAids: (id: string, aids: ReadingAids) => void;
  onUpdatePhonemeMarking: (id: string, enabled: boolean) => void;
  onUpdateTheme?: (id: string, theme: Theme) => void;
  onUpdateProfile: (id: string, updates: Partial<Omit<ChildProfile, 'id' | 'createdAt'>>) => void;
  bgColor?: string;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Per-profile localStorage progress tracking
const PROGRESS_STORAGE_KEY = 'robot-reading-progress';

interface ProfileProgress {
  shownSetIds: string[];
  lastSessionOrder: string[];  // IDs from the last session, to avoid same order
}

interface AllProgress {
  [profileId: string]: ProfileProgress;
}

function getAllProgress(): AllProgress {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate from old format (flat shownSetIds) to per-profile
      if (parsed.shownSetIds && !Object.keys(parsed).some(k => typeof parsed[k] === 'object' && parsed[k]?.shownSetIds)) {
        return {};  // Discard old format, start fresh
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return {};
}

function getProfileProgress(profileId: string): ProfileProgress {
  const all = getAllProgress();
  return all[profileId] || { shownSetIds: [], lastSessionOrder: [] };
}

function saveProfileProgress(profileId: string, progress: ProfileProgress) {
  try {
    const all = getAllProgress();
    all[profileId] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

/**
 * Build a session word set list that:
 * 1. Filters by the child's selected phases
 * 2. Prioritises unseen sets over previously shown ones
 * 3. Alternates between phases when multiple are selected
 * 4. Shuffles within each phase so order differs between sessions
 */
function buildSessionSets(
  allSets: WordSet[],
  includedPhases: PhonicsPhase[],
  profileId: string,
): WordSet[] {
  const progress = getProfileProgress(profileId);
  const MIN_SETS_PER_SESSION = 3;

  // 1. Filter by selected phases
  const phaseSets = allSets.filter(s => includedPhases.includes(s.phase as PhonicsPhase));

  if (phaseSets.length === 0) return shuffleArray(allSets);

  // 2. Split into unseen vs seen
  const shownIds = new Set(progress.shownSetIds);
  const unseen = phaseSets.filter(s => !shownIds.has(s.id));

  // If too few unseen, reset progress for this profile and use all
  let pool: WordSet[];
  if (unseen.length < MIN_SETS_PER_SESSION) {
    saveProfileProgress(profileId, { shownSetIds: [], lastSessionOrder: progress.lastSessionOrder });
    pool = phaseSets;
  } else {
    pool = unseen;
  }

  // 3. Group by phase and shuffle each group independently
  const byPhase = new Map<number, WordSet[]>();
  for (const s of pool) {
    const list = byPhase.get(s.phase) || [];
    list.push(s);
    byPhase.set(s.phase, list);
  }
  for (const [phase, sets] of byPhase) {
    byPhase.set(phase, shuffleArray(sets));
  }

  // 4. Interleave phases: round-robin across phases in ascending order
  const phases = [...byPhase.keys()].sort((a, b) => a - b);
  const result: WordSet[] = [];
  const indices = new Map<number, number>(phases.map(p => [p, 0]));
  let exhausted = 0;

  while (exhausted < phases.length) {
    for (const phase of phases) {
      const sets = byPhase.get(phase)!;
      const idx = indices.get(phase)!;
      if (idx < sets.length) {
        result.push(sets[idx]);
        indices.set(phase, idx + 1);
        if (idx + 1 >= sets.length) exhausted++;
      }
    }
  }

  // 5. Avoid identical ordering to last session
  //    If the first N IDs match the last session, rotate by a random offset
  const lastOrder = progress.lastSessionOrder;
  if (lastOrder.length > 0 && result.length > 1) {
    const matchCount = result.findIndex((s, i) => i >= lastOrder.length || s.id !== lastOrder[i]);
    if (matchCount > result.length / 2) {
      const offset = 1 + Math.floor(Math.random() * (result.length - 1));
      const rotated = [...result.slice(offset), ...result.slice(0, offset)];
      return rotated;
    }
  }

  return result;
}

function markSetComplete(profileId: string, setId: string, sessionOrder: string[]) {
  const progress = getProfileProgress(profileId);
  if (!progress.shownSetIds.includes(setId)) {
    progress.shownSetIds.push(setId);
  }
  progress.lastSessionOrder = sessionOrder;
  saveProfileProgress(profileId, progress);
}

export function SessionScreen({
  onFinish,
  onOpenSettings,
  onChangeTheme: _onChangeTheme,
  activeProfile,
  onUpdateReadingAids,
  onUpdatePhonemeMarking,
  onUpdateTheme,
  onUpdateProfile,
  bgColor = '#FFFFCC',
}: SessionScreenProps) {
  const [activeTab, setActiveTab] = useState<'reading' | 'building'>('reading');
  const {
    state,
    currentWord,
    currentTeachingTip,
    currentSegments,
    isCurrentWordBonus,
    currentPattern,
    currentWordSet,
    isSessionComplete,
    loadContent,
    markWord,
    markSkipped,
    endPreBonusBreak,
    dismissBonusTransition,
    completeStory,
    goBack,
    endSession,
  } = useSession();

  const { speak, speakStoryWithHighlight, stop } = useSpeech();
  const { playObjectDrop, playDanceMusic, stopDanceMusic, setMuted } = useSound();

  const [currentTheme, setCurrentTheme] = useState<Theme>(activeProfile?.preferredTheme ?? 'robot');
  const {
    awardedParts,
    awardParts,
    onSetComplete,
    placePart,
    unplacePart,
    movePart,
    clearParts,
    resetPartSystem,
    getUpcomingForCurrentFamily,
  } = usePartSystem(currentTheme);

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  // NOTE: Guide modal JSX was removed but the setter is still called by onOpenGuide
  // and the onOpenSettings handler. Left as a no-op until the Guide feature is
  // either restored or fully torn out — out of scope for the TS-error cleanup.
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());

  // Load phase-filtered, shuffled content on mount or when phases/profile ID change.
  // IMPORTANT: only depend on phases and ID, NOT the full activeProfile object,
  // because toggling reading aids updates the profile and would reset the session.
  const profileId = activeProfile?.id ?? 'default';
  const includedPhases = activeProfile?.includedPhases;
  useEffect(() => {
    const phases = includedPhases ?? [2];
    const sessionSets = buildSessionSets(
      wordSetsData.wordSets as WordSet[],
      phases,
      profileId,
    );
    loadContent(sessionSets);
  }, [loadContent, profileId, includedPhases]);

  // Note: bonus transition is now triggered synchronously in the reducer
  // when MARK_WORD/MARK_SKIPPED advances to the bonus word position.

  // Determine word position for part awarding
  const getWordPosition = useCallback((): WordPosition => {
    return isCurrentWordBonus ? 'bonus' : 'phonics';
  }, [isCurrentWordBonus]);

  // Persist a word attempt to the profile's wordHistory
  const persistAttempt = useCallback((status: WordAttempt['status']) => {
    if (activeProfile && currentWordSet && currentWord) {
      const attempt: WordAttempt = {
        id: crypto.randomUUID(),
        word: currentWord,
        status,
        setId: currentWordSet.id,
        phase: currentWordSet.phase,
        timestamp: Date.now(),
      };
      const existing = activeProfile.wordHistory ?? [];
      onUpdateProfile(activeProfile.id, { wordHistory: [...existing, attempt] });
    }
  }, [activeProfile, currentWordSet, currentWord, onUpdateProfile]);

  // Mark set complete if this is the last word
  const maybeMarkSetComplete = useCallback(() => {
    const totalWords = (currentWordSet?.phonicsWords.length ?? CONSTANTS.session.phonicsWordsPerSet) + CONSTANTS.session.bonusWordsPerSet;
    if (state.currentWordIndex >= totalWords - 1 && currentWordSet) {
      const profileId = activeProfile?.id ?? 'default';
      const sessionOrder = state.wordSets.map(s => s.id);
      markSetComplete(profileId, currentWordSet.id, sessionOrder);
    }
  }, [currentWordSet, state.currentWordIndex, activeProfile, state.wordSets]);

  // Handle correct word - award parts based on position
  const handleCorrect = useCallback((status: WordStatus) => {
    stop(); // Cancel any in-progress speech
    const position = getWordPosition();
    const paths = awardParts(position);

    // Play sound for each part dropped
    paths.forEach((_, i) => {
      setTimeout(() => {
        playObjectDrop();
      }, i * CONSTANTS.session.objectDropDelayMs);
    });

    markWord(status);
    persistAttempt(status);
    maybeMarkSetComplete();
  }, [stop, getWordPosition, awardParts, playObjectDrop, markWord, persistAttempt, maybeMarkSetComplete]);

  // Handle skip - no objects, reward as-is, but flag word as skipped
  const handleSkip = useCallback(() => {
    stop(); // Cancel any in-progress speech
    markSkipped();
    persistAttempt('skipped');
    maybeMarkSetComplete();
  }, [stop, markSkipped, persistAttempt, maybeMarkSetComplete]);

  // Handle story complete - mark set complete in part system
  const handleCompleteStory = useCallback(() => {
    stop(); // Cancel any in-progress story TTS
    onSetComplete();
    completeStory();
  }, [stop, onSetComplete, completeStory]);

  // Finish session (screenshot is handled in BuildingZone)
  const handleFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  // End session early — show parent review summary instead of exiting
  const handleEndSession = useCallback(() => {
    endSession();
    setActiveTab('reading');
  }, [endSession]);

  const handleResetModel = useCallback(() => {
    resetPartSystem();
  }, [resetPartSystem]);

  const handleChangeTheme = useCallback((newTheme: Theme) => {
    setCurrentTheme(newTheme);
    clearParts(); // Clear building zone when switching themes
    if (activeProfile && onUpdateTheme) {
      onUpdateTheme(activeProfile.id, newTheme);
    }
  }, [activeProfile, onUpdateTheme, clearParts]);

  const handleToggleMute = useCallback((muted: boolean) => {
    setIsSoundMuted(muted);
    setMuted(muted);
    if (muted) {
      stopDanceMusic();
    }
  }, [setMuted, stopDanceMusic]);

  // Handle reading aids update
  const handleUpdateReadingAids = useCallback(
    (aids: ReadingAids) => {
      if (activeProfile) {
        onUpdateReadingAids(activeProfile.id, aids);
      }
    },
    [activeProfile, onUpdateReadingAids]
  );

  // Get current reading aids from profile or use defaults
  const readingAids = activeProfile?.readingAids || getDefaultReadingAids();
  const visualPhonemeMarking = activeProfile?.visualPhonemeMarking ?? true;

  const handleTogglePhonemeMarking = useCallback(() => {
    if (activeProfile) {
      onUpdatePhonemeMarking(activeProfile.id, !visualPhonemeMarking);
    }
  }, [activeProfile, visualPhonemeMarking, onUpdatePhonemeMarking]);

  const profileName = activeProfile?.name ?? 'Learner';

  // Session summary: filter wordHistory to this session's attempts
  const sessionAttempts = useMemo(() => {
    return (activeProfile?.wordHistory ?? []).filter(a => a.timestamp >= sessionStartTime);
  }, [activeProfile?.wordHistory, sessionStartTime]);

  // Update a specific WordAttempt status by id (for tap-to-cycle correction)
  const handleUpdateWordStatus = useCallback((attemptId: string, newStatus: WordAttempt['status']) => {
    if (!activeProfile) return;
    const updated = (activeProfile.wordHistory ?? []).map(a =>
      a.id === attemptId ? { ...a, status: newStatus } : a
    );
    onUpdateProfile(activeProfile.id, { wordHistory: updated });
  }, [activeProfile, onUpdateProfile]);

  // Persist a practice-round attempt (from SessionSummary micro-session)
  const handlePersistPracticeAttempt = useCallback((word: string, status: WordAttempt['status'], setId: string, phase: number) => {
    if (!activeProfile) return;
    const attempt: WordAttempt = {
      id: crypto.randomUUID(),
      word,
      status,
      setId,
      phase,
      timestamp: Date.now(),
    };
    const existing = activeProfile.wordHistory ?? [];
    onUpdateProfile(activeProfile.id, { wordHistory: [...existing, attempt] });
  }, [activeProfile, onUpdateProfile]);

  return (
    <div className="h-screen flex flex-col md:flex-row md:gap-2 md:p-2">
      {/* Reading Zone */}
      <div
        className={`min-h-0 min-w-0 md:flex-[553] md:rounded-[36px] md:overflow-hidden ${activeTab === 'reading' ? 'flex-1' : 'hidden md:block'}`}
        style={{ background: bgColor }}
      >
        <ReadingZone
          currentWord={currentWord}
          currentTeachingTip={currentTeachingTip}
          currentSegments={currentSegments}
          isCurrentWordBonus={isCurrentWordBonus}
          currentPattern={currentPattern}
          currentWordSet={currentWordSet}
          currentWordIndex={state.currentWordIndex}
          totalWordsInSet={(currentWordSet?.phonicsWords.length ?? 0) + CONSTANTS.session.bonusWordsPerSet}
          visualPhonemeMarking={visualPhonemeMarking}
          isShowingStory={state.isShowingStory}
          isShowingPreBonusBreak={state.isShowingPreBonusBreak}
          isShowingBonusTransition={state.isShowingBonusTransition}
          isSessionComplete={isSessionComplete}
          readingAids={readingAids}
          onCorrect={handleCorrect}
          onSkip={handleSkip}
          onGoBack={goBack}
          onCompleteStory={handleCompleteStory}
          onEndPreBonusBreak={endPreBonusBreak}
          onDismissBonusTransition={dismissBonusTransition}
          onSpeak={speak}
          onSpeakStoryWithHighlight={speakStoryWithHighlight}
          onStopStory={stop}
          profileName={profileName}
          sessionAttempts={sessionAttempts}
          wordSets={state.wordSets}
          onExitSession={handleFinish}
          onUpdateWordStatus={handleUpdateWordStatus}
          onPersistPracticeAttempt={handlePersistPracticeAttempt}
          onUpdateReadingAids={handleUpdateReadingAids}
          onTogglePhonemeMarking={handleTogglePhonemeMarking}
          theme={currentTheme}
          onChangeTheme={handleChangeTheme}
          onOpenSettings={onOpenSettings}
          bgColor={bgColor}
        />
      </div>

      {/* Building Zone */}
      <div className={`min-h-0 min-w-0 md:flex-[505] md:rounded-[19px] bg-[#F2F2F2] ${activeTab === 'building' ? 'flex-1' : 'hidden md:block'}`}>
        <BuildingZone
          parts={awardedParts}
          onPartMove={movePart}
          onPartPlace={placePart}
          onPartUnplace={unplacePart}
          onEndSession={handleEndSession}
          onPlayDanceMusic={playDanceMusic}
          onStopDanceMusic={stopDanceMusic}
          onResetModel={handleResetModel}
          isSoundMuted={isSoundMuted}
          onToggleMute={handleToggleMute}
          upcomingParts={getUpcomingForCurrentFamily()}
        />
      </div>

      {/* Parent Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <GuideContent mode="modal" onComplete={() => setShowGuideModal(false)} />
          </div>
        </div>
      )}

      {/* Tab Bar - small screens only */}
      <div className="md:hidden flex-shrink-0 h-14 flex border-t border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
            activeTab === 'reading'
              ? 'text-blue-600 border-t-2 border-blue-600 -mt-px'
              : 'text-gray-400'
          }`}
        >
          <span className="text-lg leading-none">📖</span>
          <span>Reading</span>
        </button>
        <button
          onClick={() => setActiveTab('building')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
            activeTab === 'building'
              ? 'text-blue-600 border-t-2 border-blue-600 -mt-px'
              : 'text-gray-400'
          }`}
        >
          <span className="text-lg leading-none">🔧</span>
          <span>Building</span>
        </button>
      </div>
    </div>
  );
}
