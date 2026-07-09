/**
 * Phonics Helper Functions for Robot Reading
 *
 * Provides word lookup, filtering, and segmentation utilities.
 */

import phonicsWordsData from '../data/phonics_words_segmented.json';
import type { SegmentedWord, PhonicsWordsData } from '../types/PhonicsTypes';

const data = phonicsWordsData as PhonicsWordsData;

/**
 * Get segmented word data by word string
 */
export function getSegmentedWord(word: string): SegmentedWord | null {
  const lowerWord = word.toLowerCase();
  return data.words[lowerWord] || null;
}

/**
 * Get phonemes for a word
 */
export function getPhonemes(word: string): string[] | null {
  const segmented = getSegmentedWord(word);
  return segmented ? segmented.phonemes : null;
}

/**
 * Get all words for a specific phase
 */
export function getWordsForPhase(phase: number): SegmentedWord[] {
  return Object.values(data.words).filter(word => word.phase === phase);
}

/**
 * Get all words containing a specific grapheme
 */
export function getWordsForGrapheme(grapheme: string): SegmentedWord[] {
  return Object.values(data.words).filter(
    word => word.targetGrapheme === grapheme
  );
}

/**
 * Filter words by enabled phases
 */
export function filterWordsByPhases(phases: number[]): SegmentedWord[] {
  return Object.values(data.words).filter(word => phases.includes(word.phase));
}

/**
 * Filter words by enabled sounds (graphemes)
 * If enabledSounds is empty, returns all words for the given phases
 */
export function filterWordsBySound(
  phases: number[],
  enabledSounds: string[]
): SegmentedWord[] {
  const phaseWords = filterWordsByPhases(phases);

  if (enabledSounds.length === 0) {
    return phaseWords;
  }

  return phaseWords.filter(
    word => word.targetGrapheme && enabledSounds.includes(word.targetGrapheme)
  );
}

/**
 * Get all unique graphemes for a set of phases
 */
export function getGraphemesForPhases(phases: number[]): string[] {
  const graphemes = new Set<string>();

  Object.values(data.words).forEach(word => {
    if (phases.includes(word.phase) && word.targetGrapheme) {
      graphemes.add(word.targetGrapheme);
    }
  });

  return Array.from(graphemes).sort();
}

/**
 * Check if a word is a tricky word
 */
export function isTrickyWord(word: string): boolean {
  const segmented = getSegmentedWord(word);
  return segmented?.type === 'tricky';
}

/**
 * Get random words from a filtered set
 */
export function getRandomWords(
  words: SegmentedWord[],
  count: number
): SegmentedWord[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get the total word count
 */
export function getTotalWordCount(): number {
  return data.metadata.totalWords;
}

/**
 * Get words grouped by phase
 */
export function getWordsByPhase(): Record<number, SegmentedWord[]> {
  const grouped: Record<number, SegmentedWord[]> = {
    2: [],
    3: [],
    4: [],
    5: [],
  };

  Object.values(data.words).forEach(word => {
    if (grouped[word.phase]) {
      grouped[word.phase].push(word);
    }
  });

  return grouped;
}

/**
 * Format segments for display (e.g., "sh + i + p")
 */
export function formatSegments(word: SegmentedWord): string {
  return word.segments.map(s => s.chars).join(' + ');
}

/**
 * Get segment type label for UI
 */
export function getSegmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    single: 'Single letter',
    digraph: 'Digraph (2 letters, 1 sound)',
    trigraph: 'Trigraph (3 letters, 1 sound)',
    split: 'Split digraph',
  };
  return labels[type] || type;
}
