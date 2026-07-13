import { useState, useMemo, useCallback, useRef } from 'react';
import { ReadingGuide } from '../ui/ReadingGuide';
import { StyledText } from '../ui/StyledText';
import { PhonemeMarkedWord } from './PhonemeMarkedWord';
import type { WordAttempt, ReadingAids } from '../../types/profile';
import type { WordStatus, WordSet, WordSegment } from '../../types';
import './sessionSummary.css';

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

const STATUS_CONFIG: Record<AttemptStatus, { label: string; color: string; empty: string }> = {
  practice: { label: 'Needs more practice', color: '#CD0000', empty: 'Nothing here — brilliant.' },
  support: { label: 'With a little help', color: '#F97316', empty: 'Nothing needed a hand.' },
  independent: { label: 'Nailed it', color: '#22C55E', empty: 'Drag words here as they click.' },
  skipped: { label: 'Skipped', color: '#9A9A9A', empty: 'Nothing skipped.' },
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
  const [dropTarget, setDropTarget] = useState<AttemptStatus | null>(null);
  // Local copy of attempts for optimistic UI updates during corrections
  const [localAttempts, setLocalAttempts] = useState<WordAttempt[]>(sessionAttempts);

  // Touch-drag scratch state. Declared up here, above the practice-mode early
  // return, because hooks must run in the same order on every render.
  const touchDragId = useRef<string | null>(null);
  const touchGhost = useRef<HTMLDivElement | null>(null);
  const lastHighlighted = useRef<Element | null>(null);

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
    const segments = segmentsLookup.get(`${currentWord.word}::${currentWord.setId}`);

    return (
      <div className="practice">
        <div className="practice-header">
          <h2 className="font-display">One more go</h2>
          <p className="practice-progress">
            Word {practiceIndex + 1} of {practiceWords.length}
          </p>
        </div>

        <div className="practice-word">
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
                  segments={segments}
                  size="word"
                  showMarks={visualPhonemeMarking}
                  emphasis="full"
                />
              </StyledText>
            </div>
            <div style={{ marginTop: visualPhonemeMarking && segments ? '8px' : '0' }}>
              {readingAids.ruler && (
                <ReadingGuide width={`${currentWord.word.length * 45}px`} />
              )}
            </div>
          </div>
        </div>

        <div className="practice-actions">
          <div className="practice-marks">
            <button
              className="practice-mark"
              style={{ background: STATUS_CONFIG.practice.color }}
              onClick={() => handlePracticeAssess('practice')}
            >
              Still tricky
            </button>
            <button
              className="practice-mark"
              style={{ background: STATUS_CONFIG.support.color }}
              onClick={() => handlePracticeAssess('support')}
            >
              With a little help
            </button>
            <button
              className="practice-mark"
              style={{ background: STATUS_CONFIG.independent.color }}
              onClick={() => handlePracticeAssess('independent')}
            >
              {profileName} nailed it
            </button>
          </div>
          <button className="practice-skip" onClick={handlePracticeSkip}>
            Skip this word →
          </button>
        </div>
      </div>
    );
  }

  // Summary view
  const hasPracticeWords = counts.practice > 0 || counts.skipped > 0;
  const totalWords = latestAttempts.length;

  // --- Mouse/desktop drag handlers (HTML5 DnD API) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, attemptId: string) => {
    e.dataTransfer.setData('text/plain', attemptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: AttemptStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(status);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: AttemptStatus) => {
    e.preventDefault();
    setDropTarget(null);
    const attemptId = e.dataTransfer.getData('text/plain');
    const attempt = localAttempts.find(a => a.id === attemptId);
    if (!attempt || attempt.status === targetStatus) return;
    setLocalAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, status: targetStatus } : a));
    onUpdateWordStatus(attemptId, targetStatus);
  };

  // --- Touch drag handlers (mobile) ---
  const applyDropHighlight = (el: Element | null) => {
    if (lastHighlighted.current && lastHighlighted.current !== el) {
      (lastHighlighted.current as HTMLElement).classList.remove('drop-active');
    }
    if (el) {
      (el as HTMLElement).classList.add('drop-active');
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, attemptId: string, word: string, color: string) => {
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
      padding: 7px 15px;
      border-radius: 9999px;
      background: ${color};
      color: white;
      font-size: 15px;
      font-weight: 700;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.9;
      white-space: nowrap;
      box-shadow: 0 8px 20px rgba(0,0,0,0.28);
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
    <div className="recap">
      <div className="recap-header">
        <h2 className="font-display">Great reading, {profileName}!</h2>
        <p className="recap-headline">
          <strong>{counts.independent}</strong> of <strong>{totalWords}</strong>{' '}
          {totalWords === 1 ? 'word' : 'words'} read all on their own
        </p>
        <p className="recap-hint">Drag any word to move it between groups</p>
      </div>

      <div className="recap-groups">
        {SECTION_ORDER.map(status => {
          const words = grouped[status];
          const config = STATUS_CONFIG[status];

          return (
            <div
              key={status}
              data-status={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, status)}
              className={`recap-group ${dropTarget === status ? 'drop-active' : ''}`}
            >
              <div className="recap-group-title">
                <span className="recap-dot" style={{ background: config.color }} />
                {config.label}
                <span className="recap-count">({words.length})</span>
              </div>

              {words.length === 0 ? (
                <p className="recap-empty">{config.empty}</p>
              ) : (
                <div className="recap-chips">
                  {words.map(attempt => (
                    <div
                      key={attempt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, attempt.id)}
                      onTouchStart={(e) => handleTouchStart(e, attempt.id, attempt.word, config.color)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="recap-chip"
                      style={{ background: config.color, touchAction: 'none' }}
                    >
                      {attempt.word}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="recap-actions">
        {hasPracticeWords && (
          <button className="recap-btn-secondary" onClick={handleStartPractice}>
            Practise the tricky ones
          </button>
        )}
        <button className="recap-btn-primary" onClick={onExitSession}>
          Save and finish
        </button>
      </div>
    </div>
  );
}
