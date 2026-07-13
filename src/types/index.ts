import type { ObjectAsset } from '../utils/constants';

export type SegmentType = 'single' | 'digraph' | 'trigraph' | 'split';

export interface WordSegment {
  chars: string;
  type: SegmentType;
  /** Phoneme ID mapping to audio file, e.g. "ai", "th", "oo", "magic-e" */
  phoneme?: string;
  /** For split digraphs: 0-indexed character positions of the two vowel letters in the full word */
  positions?: [number, number];
  /** For tricky words — false if non-standard pronunciation */
  decodable?: boolean;
  /** Explanation for tricky parts */
  note?: string;
}

export interface PhonicsWord {
  word: string;
  teachingTip: string;
  segments?: WordSegment[];
}

export interface BonusWord {
  word: string;
  teachingTip: string;
}

export interface WordSet {
  id: string;
  phase: number;
  pattern: string;
  teachingHint: string;
  phonicsWords: PhonicsWord[];
  bonusWord: BonusWord;
  story: string;
}

export interface ContentData {
  version: string;
  wordSets: WordSet[];
}

export interface BuildingObject {
  id: string;
  asset: ObjectAsset;
  x: number;
  y: number;
  zIndex: number;
}

export interface SessionState {
  wordSets: WordSet[];
  currentSetIndex: number;
  currentWordIndex: number;
  isShowingStory: boolean;
  isShowingPreBonusBreak: boolean;
  isShowingBonusTransition: boolean;
  correctWordsThisSession: number;
  totalWordsAttempted: number;
  objectsEarned: number;
  completedSetIds: string[];
}

/**
 * How the parent marked the child's reading of a word.
 * - independent: child read the word without help
 * - support: child read the word with parent help
 * - practice: child struggled; flag word for future practice
 * All three award a monster part. Skip is a separate action and awards none.
 */
export type WordStatus = 'independent' | 'support' | 'practice';

export type SessionAction =
  | { type: 'LOAD_CONTENT'; wordSets: WordSet[] }
  | { type: 'RESTORE'; state: SessionState }
  | { type: 'MARK_WORD'; status: WordStatus }
  | { type: 'MARK_SKIPPED' }
  | { type: 'SHOW_BONUS_TRANSITION' }
  | { type: 'DISMISS_BONUS_TRANSITION' }
  | { type: 'END_PRE_BONUS_BREAK' }
  | { type: 'COMPLETE_STORY' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'END_SESSION' };

export interface ProgressData {
  shownSetIds: string[];
  lastSessionDate: string;
}
