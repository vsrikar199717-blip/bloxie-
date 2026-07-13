import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReadingZone } from './ReadingZone/ReadingZone';
import { BuildingZone } from './BuildingZone/BuildingZone';
import { GuideContent } from './ParentGuide/GuideContent';
import { Walkthrough, type TourStep } from './Walkthrough';
import { PauseOverlay, ResumePrompt } from './ui/SessionModals';
import { useSession } from '../hooks/useSession';
import { useSpeech } from '../hooks/useSpeech';
import { useSound } from '../hooks/useSound';
import { usePartSystem, type WordPosition } from '../hooks/usePartSystem';
import type { WordSet, WordStatus } from '../types';
import type { ChildProfile, PhonicsPhase, ReadingAids, Theme, WordAttempt } from '../types/profile';
import { getDefaultReadingAids } from '../types/profile';
import { CONSTANTS } from '../utils/constants';
import {
  SNAPSHOT_VERSION,
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
} from '../utils/sessionPersistence';
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

/** First-run walkthrough, shown over the real dashboard. */
const TOUR_STEPS: TourStep[] = [
  { target: 'word', title: 'The word', body: 'Your child reads this out loud. Sounds are underlined so tricky pairs like “sh” stay together.' },
  { target: 'hear', title: 'Hear it', body: 'Not sure how it sounds? Tap the speaker to hear the whole word.' },
  { target: 'soundout', title: 'Sound it out', body: 'Lights up and says each sound in turn — perfect when your child gets stuck.' },
  { target: 'tip', title: 'Tips for grown-ups', body: 'Opens a short hint on how to help your child with this particular word.' },
  { target: 'marks', title: 'How did it go?', body: 'Grown-up: tap one after each word. Every word earns a building part — nothing is ever “wrong”.' },
  { target: 'build', title: 'Build your character!', body: 'Parts you earn appear in the tray on the right. Drag them here to build — that’s the reward for reading.' },
  { target: 'theme', title: 'Change your world', body: 'Tap to switch between robot, mystical and monster. Then read on!' },
];

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
    restore,
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

  // Read any interrupted session ONCE, during the first render, so the restored
  // build is in place before usePartSystem initialises. Reading it later would
  // mean mounting a fresh random character and then overwriting it.
  const [snapshot] = useState(() =>
    activeProfile ? loadSnapshot(activeProfile.id) : null
  );
  const [showResumePrompt, setShowResumePrompt] = useState(!!snapshot);
  const [discardedSnapshot, setDiscardedSnapshot] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [currentTheme, setCurrentTheme] = useState<Theme>(
    snapshot?.theme ?? activeProfile?.preferredTheme ?? 'robot'
  );
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
    partsSnapshot,
  } = usePartSystem(currentTheme, snapshot?.parts);

  // First-run walkthrough over the real dashboard (replaces the old guide screen)
  const [tourDone, setTourDone] = useState(false);
  const showTour = !!activeProfile && !activeProfile.hasSeenParentGuide && !tourDone;
  const finishTour = useCallback(() => {
    setTourDone(true);
    if (activeProfile) onUpdateProfile(activeProfile.id, { hasSeenParentGuide: true });
  }, [activeProfile, onUpdateProfile]);

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  // NOTE: Guide modal JSX was removed but the setter is still called by onOpenGuide
  // and the onOpenSettings handler. Left as a no-op until the Guide feature is
  // either restored or fully torn out — out of scope for the TS-error cleanup.
  const [showGuideModal, setShowGuideModal] = useState(false);

  // A resumed session keeps its original start time, so the recap still sees the
  // words read before the interruption.
  const [sessionStartTime, setSessionStartTime] = useState(
    () => snapshot?.startedAt ?? Date.now()
  );

  // Either re-enter the interrupted session, or build a fresh one.
  // IMPORTANT: only depend on phases and ID, NOT the full activeProfile object,
  // because toggling reading aids updates the profile and would reset the session.
  const profileId = activeProfile?.id ?? 'default';
  const includedPhases = activeProfile?.includedPhases;
  useEffect(() => {
    if (snapshot && !discardedSnapshot) {
      restore(snapshot.session);
      return;
    }
    const phases = includedPhases ?? [2];
    const sessionSets = buildSessionSets(
      wordSetsData.wordSets as WordSet[],
      phases,
      profileId,
    );
    loadContent(sessionSets);
  }, [loadContent, restore, profileId, includedPhases, snapshot, discardedSnapshot]);

  // Snapshot after every change, so an unexpected close loses nothing. Skipped
  // while the resume prompt is still up, because the parent has not yet chosen
  // whether this session continues — writing then could overwrite the very
  // snapshot they are being offered.
  useEffect(() => {
    if (!activeProfile || showResumePrompt) return;
    if (state.wordSets.length === 0) return;

    // A finished session is not something to resume into.
    if (isSessionComplete) {
      clearSnapshot();
      return;
    }

    saveSnapshot({
      version: SNAPSHOT_VERSION,
      profileId: activeProfile.id,
      savedAt: Date.now(),
      startedAt: sessionStartTime,
      theme: currentTheme,
      session: state,
      parts: partsSnapshot,
    });
  }, [
    activeProfile,
    showResumePrompt,
    isSessionComplete,
    state,
    partsSnapshot,
    currentTheme,
    sessionStartTime,
  ]);

  const handleResumeSession = useCallback(() => {
    setShowResumePrompt(false);
  }, []);

  /** Throw away the interrupted session and start a brand new one. */
  const handleStartFresh = useCallback(() => {
    clearSnapshot();
    setDiscardedSnapshot(true);
    setShowResumePrompt(false);
    setSessionStartTime(Date.now());
    resetPartSystem();
  }, [resetPartSystem]);

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
    clearSnapshot();
    onFinish();
  }, [onFinish]);

  // End session early — show parent review summary instead of exiting
  const handleEndSession = useCallback(() => {
    endSession();
    setActiveTab('reading');
  }, [endSession]);

  // Pausing stops any speech mid-flow; nothing else needs to halt, because
  // reading is untimed.
  const handlePause = useCallback(() => {
    stop();
    setIsPaused(true);
  }, [stop]);

  const handleFinishFromPause = useCallback(() => {
    setIsPaused(false);
    handleEndSession();
  }, [handleEndSession]);

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
    // pb-24 on mobile keeps content clear of the floating pill tab bar
    <div className="h-screen flex flex-col pb-24 md:pb-0 md:flex-row md:gap-2 md:p-2">
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
          onPause={handlePause}
          bgColor={bgColor}
        />
      </div>

      {/* Building Zone */}
      <div className={`min-h-0 min-w-0 md:flex-[505] md:rounded-[19px] bg-[#F2F2F2] ${activeTab === 'building' ? 'flex-1' : 'hidden md:block'}`}>
        <BuildingZone
          theme={currentTheme}
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

      {isPaused && (
        <PauseOverlay
          profileName={profileName}
          wordsRead={state.totalWordsAttempted}
          onResume={() => setIsPaused(false)}
          onFinish={handleFinishFromPause}
        />
      )}

      {showResumePrompt && snapshot && (
        <ResumePrompt
          profileName={profileName}
          wordsRead={snapshot.session.totalWordsAttempted}
          partsEarned={snapshot.parts.awardedParts.length}
          onResume={handleResumeSession}
          onStartFresh={handleStartFresh}
        />
      )}

      {/* First-run walkthrough on the real dashboard */}
      {showTour && <Walkthrough steps={TOUR_STEPS} onDone={finishTour} />}

      {/* Parent Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <GuideContent mode="modal" onComplete={() => setShowGuideModal(false)} />
          </div>
        </div>
      )}

      {/* Floating pill tab bar - small screens only */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,420px)]">
        <div className="relative flex bg-white rounded-full p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          {/* Sliding black selector */}
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-black border-2 border-[#F5851F] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: activeTab === 'building' ? 'translateX(100%)' : 'translateX(0)',
            }}
          />

          <button
            onClick={() => setActiveTab('reading')}
            aria-label="Reading"
            aria-pressed={activeTab === 'reading'}
            className="relative z-10 flex-1 h-12 grid place-items-center rounded-full"
          >
            <img
              src="/assets/icons/book.svg"
              alt=""
              className={`w-7 h-7 object-contain transition-transform duration-300 ${
                activeTab === 'reading' ? 'scale-110' : 'scale-100 opacity-80'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('building')}
            aria-label="Building"
            aria-pressed={activeTab === 'building'}
            className="relative z-10 flex-1 h-12 grid place-items-center rounded-full"
          >
            <img
              src="/assets/icons/block.svg"
              alt=""
              className={`w-7 h-7 object-contain transition-transform duration-300 ${
                activeTab === 'building' ? 'scale-110' : 'scale-100 opacity-80'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
