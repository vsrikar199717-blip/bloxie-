import { useState, useMemo, useCallback, useRef } from 'react';
import { ActionButton } from '../ui/ActionButton';
import { ReadingGuide } from '../ui/ReadingGuide';
import { StyledText } from '../ui/StyledText';
import { PhonemeMarkedWord } from './PhonemeMarkedWord';
import type { WordAttempt, ReadingAids } from '../../types/profile';
import type { WordStatus, WordSet, WordSegment } from '../../types';

type AttemptStatus = WordStatus | 'skipped';

interface SessionSummaryProps {
  sessionAttempts: WordAttempt[];
  profileName: string;
  wordSets: WordSet[];
  readingAids: ReadingAids;
  visualPhonemeMarking: boolean;
  onExitSession: () => void;
  onUpdateWordStatus: (attemptId: string, newStatus: AttemptStatus) => void;
  onCorrect: (status: WordStatus) => void;
  onSkip: () => void;
  onSpeak: (text: string) => void;
  onPersistPracticeAttempt: (word: string, status: AttemptStatus, setId: string, phase: number) => void;
}

const STATUS_CONFIG: Record<AttemptStatus, { label: string; bgChip: string; bgSection: string; borderColor: string; emoji: string }> = {
  practice: { label: 'Needs more practice', bgChip: 'bg-red-500', bgSection: 'bg-red-50', borderColor: 'border-red-200', emoji: '🔁' },
  support: { label: 'With a little help', bgChip: 'bg-orange-400', bgSection: 'bg-orange-50', borderColor: 'border-orange-200', emoji: '🤝' },
  independent: { label: 'Nailed it!', bgChip: 'bg-green-500', bgSection: 'bg-green-50', borderColor: 'border-green-200', emoji: '🎉' },
  skipped: { label: 'Skipped', bgChip: 'bg-gray-400', bgSection: 'bg-gray-50', borderColor: 'border-gray-200', emoji: '⏭️' },
};

// Section display order: practice, support, independent, skipped
const SECTION_ORDER: AttemptStatus[] = ['practice', 'support', 'independent', 'skipped'];

/** Get the latest attempt per word (by timestamp), keyed by word+setId for uniqueness */
function getLatestAttempts(attempts: WordAttempt[]): WordAttempt[] {
  const latest = new Map<string, WordAttempt>();
  for (const a of attempts) {
    const key = `${a.word}::${a.setId}`;
    const existing = latest.get(key);
    if (!existing || a.timestamp > existing.timestamp) {
      latest.set(key, a);
    }
  }
  return Array.from(latest.values());
}

export function SessionSummary({
  sessionAttempts,
  profileName,
  wordSets,
  readingAids,
  visualPhonemeMarking,
  onExitSession,
  onUpdateWordStatus,
  onPersistPracticeAttempt,
}: SessionSummaryProps) {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceWords, setPracticeWords] = useState<WordAttempt[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [isLit, setIsLit] = useState(false);
  // Local copy of attempts for optimistic UI updates during corrections
  const [localAttempts, setLocalAttempts] = useState<WordAttempt[]>(sessionAttempts);

  // Build a lookup from word+setId to its segments
  const segmentsLookup = useMemo(() => {
    const map = new Map<string, WordSegment[] | undefined>();
    for (const set of wordSets) {
      for (const pw of set.phonicsWords) {
        map.set(`${pw.word}::${set.id}`, pw.segments);
      }
      map.set(`${set.bonusWord.word}::${set.id}`, undefined);
    }
    return map;
  }, [wordSets]);

  // Sync when sessionAttempts changes (e.g., after practice round appends new records)
  const latestAttempts = useMemo(() => getLatestAttempts(localAttempts), [localAttempts]);

  // Group by status
  const grouped = useMemo(() => {
    const groups: Record<AttemptStatus, WordAttempt[]> = {
      practice: [],
      support: [],
      independent: [],
      skipped: [],
    };
    for (const a of latestAttempts) {
      groups[a.status].push(a);
    }
    return groups;
  }, [latestAttempts]);

  const counts = useMemo(() => ({
    independent: grouped.independent.length,
    support: grouped.support.length,
    practice: grouped.practice.length,
    skipped: grouped.skipped.length,
  }), [grouped]);

  const handleStartPractice = useCallback(() => {
    const needsPractice = latestAttempts.filter(a => a.status === 'practice' || a.status === 'skipped');
    if (needsPractice.length > 0) {
      setPracticeWords(needsPractice);
      setPracticeIndex(0);
      setIsPracticing(true);
    }
  }, [latestAttempts]);

  const handlePracticeAssess = useCallback((status: WordStatus) => {
    const word = practiceWords[practiceIndex];
    // Persist new attempt
    onPersistPracticeAttempt(word.word, status, word.setId, word.phase);
    // Update local attempts with new status for this word
    const newAttempt: WordAttempt = {
      id: crypto.randomUUID(),
      word: word.word,
      status,
      setId: word.setId,
      phase: word.phase,
      timestamp: Date.now(),
    };
    setLocalAttempts(prev => [...prev, newAttempt]);

    const nextIndex = practiceIndex + 1;
    if (nextIndex >= practiceWords.length) {
      setIsPracticing(false);
    } else {
      setPracticeIndex(nextIndex);
    }
  }, [practiceWords, practiceIndex, onPersistPracticeAttempt]);

  const handlePracticeSkip = useCallback(() => {
    const word = practiceWords[practiceIndex];
    onPersistPracticeAttempt(word.word, 'skipped', word.setId, word.phase);
    const newAttempt: WordAttempt = {
      id: crypto.randomUUID(),
      word: word.word,
      status: 'skipped' as AttemptStatus,
      setId: word.setId,
      phase: word.phase,
      timestamp: Date.now(),
    };
    setLocalAttempts(prev => [...prev, newAttempt]);

    const nextIndex = practiceIndex + 1;
    if (nextIndex >= practiceWords.length) {
      setIsPracticing(false);
    } else {
      setPracticeIndex(nextIndex);
    }
  }, [practiceWords, practiceIndex, onPersistPracticeAttempt]);

  // Practice mode: show one word at a time with assessment buttons
  if (isPracticing && practiceWords.length > 0) {
    const currentWord = practiceWords[practiceIndex];
    return (
      <div className="h-full flex flex-col p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-2 md:mb-4">
          <div className="text-2xl md:text-4xl mb-1">🔁</div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-700">Practice round</h2>
          <p className="text-sm md:text-base text-gray-500">
            Word {practiceIndex + 1} of {practiceWords.length}
          </p>
        </div>

        {/* Word display */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-2 p-3 md:p-8 rounded-2xl"
            onPointerDown={() => { if (readingAids.lightbox) setIsLit(true); }}
            onPointerUp={() => setIsLit(false)}
            onPointerLeave={() => setIsLit(false)}
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <div
              className={
                readingAids.lightbox
                  ? isLit ? 'word-lit rounded-lg' : 'word-dim'
                  : ''
              }
              style={{ transition: 'opacity 0.15s ease, background-color 0.15s ease' }}
            >
              <StyledText size="word">
                <PhonemeMarkedWord
                  word={currentWord.word}
                  segments={segmentsLookup.get(`${currentWord.word}::${currentWord.setId}`)}
                  size="word"
                  showMarks={visualPhonemeMarking}
                  emphasis="full"
                />
              </StyledText>
            </div>
            <div style={{ marginTop: visualPhonemeMarking && segmentsLookup.get(`${currentWord.word}::${currentWord.setId}`) ? '8px' : '0' }}>
              {readingAids.ruler && (
                <ReadingGuide width={`${currentWord.word.length * 45}px`} />
              )}
            </div>
          </div>
        </div>

        {/* Assessment buttons */}
        <div className="flex flex-col gap-2 md:gap-3 flex-shrink-0">
          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <button
              onClick={() => handlePracticeAssess('practice')}
              className="flex-1 px-5 py-3 bg-[#CD0000] border-2 border-[#CD0000] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#B00000] active:scale-95"
            >
              🔁 Needs more practice
            </button>
            <button
              onClick={() => handlePracticeAssess('support')}
              className="flex-1 px-5 py-3 bg-[#F97316] border-2 border-[#EA580C] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#EA580C] active:scale-95"
            >
              🤝 {profileName} used a little help
            </button>
            <button
              onClick={() => handlePracticeAssess('independent')}
              className="flex-1 px-5 py-3 bg-[#22C55E] border-2 border-[#16A34A] rounded-[23px] text-white text-sm md:text-base font-semibold cursor-pointer transition-all hover:bg-[#16A34A] active:scale-95"
            >
              🎉 {profileName} nailed it!
            </button>
          </div>
          <button
            onClick={handlePracticeSkip}
            className="px-4 py-2 text-gray-500 text-sm md:text-base hover:text-gray-700 transition-colors"
          >
            Skip →
          </button>
        </div>
      </div>
    );
  }

  // Summary view
  const hasPracticeWords = counts.practice > 0 || counts.skipped > 0;

  // --- Mouse/desktop drag handlers (HTML5 DnD API) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, attemptId: string) => {
    e.dataTransfer.setData('text/plain', attemptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: AttemptStatus) => {
    e.preventDefault();
    const attemptId = e.dataTransfer.getData('text/plain');
    const attempt = localAttempts.find(a => a.id === attemptId);
    if (!attempt || attempt.status === targetStatus) return;
    setLocalAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, status: targetStatus } : a));
    onUpdateWordStatus(attemptId, targetStatus);
  };

  // --- Touch drag handlers (mobile) ---
  const touchDragId = useRef<string | null>(null);
  const touchGhost = useRef<HTMLDivElement | null>(null);
  const lastHighlighted = useRef<Element | null>(null);

  const applyDropHighlight = (el: Element | null) => {
    if (lastHighlighted.current && lastHighlighted.current !== el) {
      (lastHighlighted.current as HTMLElement).style.outline = '';
    }
    if (el) {
      (el as HTMLElement).style.outline = '2px dashed #6366f1';
    }
    lastHighlighted.current = el;
  };

  const getDropSection = (x: number, y: number): AttemptStatus | null => {
    // Temporarily hide ghost so elementFromPoint can see through it
    if (touchGhost.current) touchGhost.current.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (touchGhost.current) touchGhost.current.style.display = '';
    if (!el) return null;
    const section = el.closest('[data-status]') as HTMLElement | null;
    applyDropHighlight(section);
    return section ? (section.dataset.status as AttemptStatus) : null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, attemptId: string, word: string) => {
    e.preventDefault();
    touchDragId.current = attemptId;
    const touch = e.touches[0];

    // Create floating ghost chip
    const ghost = document.createElement('div');
    ghost.textContent = word;
    ghost.style.cssText = `
      position: fixed;
      left: ${touch.clientX - 40}px;
      top: ${touch.clientY - 20}px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: #6366f1;
      color: white;
      font-size: 14px;
      font-weight: 600;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.85;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    `;
    document.body.appendChild(ghost);
    touchGhost.current = ghost;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!touchGhost.current) return;
    const touch = e.touches[0];
    touchGhost.current.style.left = `${touch.clientX - 40}px`;
    touchGhost.current.style.top = `${touch.clientY - 20}px`;
    getDropSection(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const targetStatus = getDropSection(touch.clientX, touch.clientY);

    // Clean up ghost and highlight
    if (touchGhost.current) {
      document.body.removeChild(touchGhost.current);
      touchGhost.current = null;
    }
    applyDropHighlight(null);

    const attemptId = touchDragId.current;
    touchDragId.current = null;
    if (!attemptId || !targetStatus) return;

    const attempt = localAttempts.find(a => a.id === attemptId);
    if (!attempt || attempt.status === targetStatus) return;
    setLocalAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, status: targetStatus } : a));
    onUpdateWordStatus(attemptId, targetStatus);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      {/* Celebratory header */}
      <div className="text-center mb-2 md:mb-4">
        <div className="text-4xl md:text-6xl mb-1 md:mb-2">🎉</div>
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1">
          Amazing job, {profileName}!
        </h2>
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Drag and drop words to change it&apos;s status
        </p>
      </div>

      {/* Scrollable word groups */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-3 md:gap-4 py-2">
          {SECTION_ORDER.map(status => {
            const words = grouped[status];
            const config = STATUS_CONFIG[status];

            return (
              <div
                key={status}
                data-status={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={`rounded-xl p-3 md:p-4 ${config.bgSection} border ${config.borderColor} min-h-[64px] transition-colors`}
              >
                <div className="text-sm md:text-base font-semibold text-gray-700 mb-2">
                  {config.emoji} {config.label} ({words.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {words.map(attempt => (
                    <div
                      key={attempt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, attempt.id)}
                      onTouchStart={(e) => handleTouchStart(e, attempt.id, attempt.word)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`${config.bgChip} text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm md:text-base font-medium cursor-grab active:cursor-grabbing transition-all hover:opacity-80 select-none`}
                      style={{ touchAction: 'none' }}
                    >
                      {attempt.word}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 md:gap-3 flex-shrink-0 pt-2 md:pt-4">
        {hasPracticeWords && (
          <ActionButton onClick={handleStartPractice} color="secondary">
            🔁 Practice these again
          </ActionButton>
        )}
        <ActionButton onClick={onExitSession} color="primary">
          Save results and start again
        </ActionButton>
      </div>
    </div>
  );
}
