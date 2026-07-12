import type { WordStatus } from './index';

export type YearGroup = 'Reception' | 'Year1' | 'Year2';
export type PhonicsPhase = 2 | 3 | 4 | 5;
export type Theme = 'robot' | 'mystical' | 'monster';

// Legacy type for migration
export type ReadingAge =
  | 'age4-5'
  | 'age5-6'
  | 'age6-7'
  | 'age7-8'
  | 'age8-9'
  | 'age9-10'
  | 'age10-11';

export interface ReadingAids {
  lightbox: boolean;
  ruler: boolean;
}

export interface WordAttempt {
  id: string;
  word: string;
  status: WordStatus | 'skipped';
  setId: string;
  phase: number;
  timestamp: number;
}

export interface ChildProfile {
  id: string;
  name: string;

  // Year and phase selection
  yearGroup: YearGroup;
  phonicsPhase: PhonicsPhase;
  includedPhases: PhonicsPhase[];

  // Timestamps
  createdAt: string;
  lastPlayed: string;

  // Theme preference
  preferredTheme?: Theme;

  /** Reading background colour, chosen once before the first game (hex). */
  readingColor?: string;

  // Progress tracking
  progress?: {
    completedSetIds: string[];
  };

  // Word-level assessment history
  wordHistory?: WordAttempt[];

  // WORKSTREAM A: Reading aids
  readingAids: ReadingAids;

  // WORKSTREAM B: Phonics features
  enabledSounds: string[];
  parentOverride: boolean;
  visualPhonemeMarking: boolean;

  // Parent guide
  hasSeenParentGuide: boolean;
}

export interface AppStorage {
  profiles: ChildProfile[];
  activeProfileId: string | null;
  hasSeenPrivacyNotice: boolean;
}

export const YEAR_GROUP_LABELS: Record<YearGroup, { label: string; ageRange: string }> = {
  Reception: { label: 'Reception', ageRange: 'age 4-5' },
  Year1: { label: 'Year 1', ageRange: 'age 5-6' },
  Year2: { label: 'Year 2', ageRange: 'age 6-7' },
};

export const PHASE_INFO: Record<PhonicsPhase, { title: string; description: string }> = {
  2: { title: 'Starting sounds', description: 'First letter sounds: s, a, t, p, i, n...' },
  3: { title: 'More sounds', description: 'Digraphs: ch, sh, ai, ee, oa...' },
  4: { title: 'Blending words', description: 'Words like: spot, crash, blend...' },
  5: { title: 'Alternative spellings', description: 'ay, ea, ie, ue, a-e...' },
};

export const THEME_LABELS: Record<Theme, { label: string; emoji: string }> = {
  robot: { label: 'Robot', emoji: '🤖' },
  mystical: { label: 'Mystical', emoji: '🦄' },
  monster: { label: 'Monster', emoji: '👾' },
};

// Default values for new profiles
export function getDefaultReadingAids(): ReadingAids {
  return {
    lightbox: false,
    ruler: false,
  };
}

export function getDefaultProfileValues(yearGroup: YearGroup): Partial<ChildProfile> {
  switch (yearGroup) {
    case 'Reception':
      return {
        yearGroup: 'Reception',
        phonicsPhase: 2,
        includedPhases: [2],
        readingAids: getDefaultReadingAids(),
        enabledSounds: [],
        parentOverride: false,
        visualPhonemeMarking: true,
        hasSeenParentGuide: false,
      };
    case 'Year1':
      return {
        yearGroup: 'Year1',
        phonicsPhase: 5,
        includedPhases: [5],
        readingAids: getDefaultReadingAids(),
        enabledSounds: [],
        parentOverride: false,
        visualPhonemeMarking: true,
        hasSeenParentGuide: false,
      };
    case 'Year2':
      return {
        yearGroup: 'Year2',
        phonicsPhase: 5,
        includedPhases: [2, 3, 4, 5],
        readingAids: getDefaultReadingAids(),
        enabledSounds: [],
        parentOverride: false,
        visualPhonemeMarking: true,
        hasSeenParentGuide: false,
      };
  }
}
