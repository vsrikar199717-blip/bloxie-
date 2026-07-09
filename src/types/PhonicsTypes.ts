/**
 * Phonics Type Definitions for Robot Reading
 * Based on Letters and Sounds framework (UK phonics)
 */

import type { WordSegment } from './index';
export type { WordSegment };

export interface SegmentedWord {
  word: string;
  phase: number;
  targetGrapheme?: string;
  type?: 'tricky';
  segments: WordSegment[];
  phonemes: string[];
}

export interface PhonicsWordsData {
  metadata: {
    generated: string;
    totalWords: number;
    version: string;
    notes: string;
  };
  words: Record<string, SegmentedWord>;
}

export interface StorySet {
  graphemes: string[];
  words: Record<string, string[]>;
  story: {
    text: string;
    trickyWord?: string;
  };
}

export interface PhonicsData {
  metadata: {
    scheme: string;
    version: string;
    generated: string;
    notes?: string;
    phases_covered: number[];
  };
  graphemeReference: {
    phase2: Record<string, string[]>;
    phase3: Record<string, string[]>;
    phase5: {
      newGraphemes: string[];
      splitDigraphs: string[];
    };
  };
  trickyWords: Record<string, string[]>;
  phase2: Record<string, StorySet>;
  phase3: Record<string, StorySet>;
  phase4: {
    description: string;
    initialClusters: string[];
    finalClusters: string[];
    exampleWords: Record<string, string[]>;
  };
  phase5: {
    splitDigraphs: Record<string, {
      phoneme: string;
      words: string[];
    }>;
    newGraphemes: Record<string, string[]>;
  };
  segmentationExamples?: Record<string, any>;
}

// Audio playback configuration
export interface PhonemeAudioConfig {
  pauseBetweenPhonemes: number;  // milliseconds
  pauseBeforeFullWord: number;   // milliseconds
  speechRate: number;            // TTS speech rate (0.1 - 2.0)
  speechLang: string;            // BCP 47 language tag
}

export const DEFAULT_AUDIO_CONFIG: PhonemeAudioConfig = {
  pauseBetweenPhonemes: 400,
  pauseBeforeFullWord: 600,
  speechRate: 0.8,
  speechLang: 'en-GB',
};
