/**
 * Word Segmentation Generator for Robot Reading
 *
 * Processes all words from phonics_data.json and generates full segmentation data
 * including segments (single/digraph/trigraph/split) and phoneme arrays.
 *
 * Run with: node scripts/generateSegmentation.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Grapheme definitions in priority order (longest first)
const TRIGRAPHS = ['igh', 'ear', 'air', 'ure'];

const DIGRAPHS = [
  // Consonant digraphs
  'ch', 'sh', 'th', 'ng', 'wh', 'ph', 'ck', 'ff', 'll', 'ss', 'zz', 'qu',
  // Vowel digraphs
  'ai', 'ee', 'oa', 'oo', 'ar', 'or', 'ur', 'ow', 'oi',
  'ay', 'ou', 'ie', 'ea', 'oy', 'ir', 'ue', 'aw', 'ew', 'oe', 'au', 'er'
];

// Letter to phoneme mappings (for 'c' -> 'k', etc.)
const PHONEME_MAP = {
  'c': 'k',
  'x': 'ks',
  'q': 'k',
  'qu': 'kw',
};

// Split digraph patterns (vowel + consonant + 'e' at end)
const SPLIT_DIGRAPH_VOWELS = ['a', 'e', 'i', 'o', 'u'];

// Tricky words that don't follow normal phonics rules
const TRICKY_WORDS = {
  'the': {
    phase: 2,
    segments: [
      { chars: 'th', type: 'digraph' },
      { chars: 'e', type: 'single', decodable: false, note: 'schwa sound' }
    ],
    phonemes: ['th', 'uh']
  },
  'to': {
    phase: 2,
    segments: [
      { chars: 't', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oo/ sound' }
    ],
    phonemes: ['t', 'oo']
  },
  'no': {
    phase: 2,
    segments: [
      { chars: 'n', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oh/ sound' }
    ],
    phonemes: ['n', 'oh']
  },
  'go': {
    phase: 2,
    segments: [
      { chars: 'g', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oh/ sound' }
    ],
    phonemes: ['g', 'oh']
  },
  'I': {
    phase: 2,
    segments: [
      { chars: 'I', type: 'single', decodable: false, note: 'capital I says its name' }
    ],
    phonemes: ['igh']
  },
  'into': {
    phase: 2,
    segments: [
      { chars: 'i', type: 'single' },
      { chars: 'n', type: 'single' },
      { chars: 't', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oo/ sound' }
    ],
    phonemes: ['i', 'n', 't', 'oo']
  },
  'he': {
    phase: 3,
    segments: [
      { chars: 'h', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'makes /ee/ sound' }
    ],
    phonemes: ['h', 'ee']
  },
  'she': {
    phase: 3,
    segments: [
      { chars: 'sh', type: 'digraph' },
      { chars: 'e', type: 'single', decodable: false, note: 'makes /ee/ sound' }
    ],
    phonemes: ['sh', 'ee']
  },
  'we': {
    phase: 3,
    segments: [
      { chars: 'w', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'makes /ee/ sound' }
    ],
    phonemes: ['w', 'ee']
  },
  'me': {
    phase: 3,
    segments: [
      { chars: 'm', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'makes /ee/ sound' }
    ],
    phonemes: ['m', 'ee']
  },
  'be': {
    phase: 3,
    segments: [
      { chars: 'b', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'makes /ee/ sound' }
    ],
    phonemes: ['b', 'ee']
  },
  'was': {
    phase: 3,
    segments: [
      { chars: 'w', type: 'single' },
      { chars: 'a', type: 'single', decodable: false, note: 'makes /o/ sound' },
      { chars: 's', type: 'single', decodable: false, note: 'makes /z/ sound' }
    ],
    phonemes: ['w', 'o', 'z']
  },
  'you': {
    phase: 3,
    segments: [
      { chars: 'y', type: 'single' },
      { chars: 'ou', type: 'digraph', decodable: false, note: 'makes /oo/ sound' }
    ],
    phonemes: ['y', 'oo']
  },
  'they': {
    phase: 3,
    segments: [
      { chars: 'th', type: 'digraph' },
      { chars: 'ey', type: 'digraph', decodable: false, note: 'makes /ay/ sound' }
    ],
    phonemes: ['th', 'ay']
  },
  'all': {
    phase: 3,
    segments: [
      { chars: 'a', type: 'single', decodable: false, note: 'makes /or/ sound' },
      { chars: 'll', type: 'digraph' }
    ],
    phonemes: ['or', 'l']
  },
  'are': {
    phase: 3,
    segments: [
      { chars: 'ar', type: 'digraph' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['ar']
  },
  'my': {
    phase: 3,
    segments: [
      { chars: 'm', type: 'single' },
      { chars: 'y', type: 'single', decodable: false, note: 'makes /igh/ sound' }
    ],
    phonemes: ['m', 'igh']
  },
  'her': {
    phase: 3,
    segments: [
      { chars: 'h', type: 'single' },
      { chars: 'er', type: 'digraph' }
    ],
    phonemes: ['h', 'er']
  },
  'said': {
    phase: 4,
    segments: [
      { chars: 's', type: 'single' },
      { chars: 'ai', type: 'digraph', decodable: false, note: 'makes /e/ sound' },
      { chars: 'd', type: 'single' }
    ],
    phonemes: ['s', 'e', 'd']
  },
  'have': {
    phase: 4,
    segments: [
      { chars: 'h', type: 'single' },
      { chars: 'a', type: 'single' },
      { chars: 'v', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['h', 'a', 'v']
  },
  'like': {
    phase: 4,
    segments: [
      { chars: 'l', type: 'single' },
      { chars: 'i-e', type: 'split', positions: [1, 3] },
      { chars: 'k', type: 'single' }
    ],
    phonemes: ['l', 'igh', 'k']
  },
  'so': {
    phase: 4,
    segments: [
      { chars: 's', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oh/ sound' }
    ],
    phonemes: ['s', 'oh']
  },
  'do': {
    phase: 4,
    segments: [
      { chars: 'd', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /oo/ sound' }
    ],
    phonemes: ['d', 'oo']
  },
  'some': {
    phase: 4,
    segments: [
      { chars: 's', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /u/ sound' },
      { chars: 'm', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['s', 'u', 'm']
  },
  'come': {
    phase: 4,
    segments: [
      { chars: 'c', type: 'single' },
      { chars: 'o', type: 'single', decodable: false, note: 'makes /u/ sound' },
      { chars: 'm', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['k', 'u', 'm']
  },
  'were': {
    phase: 4,
    segments: [
      { chars: 'w', type: 'single' },
      { chars: 'er', type: 'digraph' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['w', 'er']
  },
  'there': {
    phase: 4,
    segments: [
      { chars: 'th', type: 'digraph' },
      { chars: 'ere', type: 'trigraph', decodable: false, note: 'makes /air/ sound' }
    ],
    phonemes: ['th', 'air']
  },
  'little': {
    phase: 4,
    segments: [
      { chars: 'l', type: 'single' },
      { chars: 'i', type: 'single' },
      { chars: 'tt', type: 'digraph' },
      { chars: 'l', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'schwa sound' }
    ],
    phonemes: ['l', 'i', 't', 'l']
  },
  'one': {
    phase: 4,
    segments: [
      { chars: 'o', type: 'single', decodable: false, note: 'makes /w/ sound' },
      { chars: 'n', type: 'single' },
      { chars: 'e', type: 'single', decodable: false, note: 'silent' }
    ],
    phonemes: ['w', 'u', 'n']
  },
  'when': {
    phase: 4,
    segments: [
      { chars: 'wh', type: 'digraph' },
      { chars: 'e', type: 'single' },
      { chars: 'n', type: 'single' }
    ],
    phonemes: ['w', 'e', 'n']
  },
  'out': {
    phase: 4,
    segments: [
      { chars: 'ou', type: 'digraph' },
      { chars: 't', type: 'single' }
    ],
    phonemes: ['ou', 't']
  },
  'what': {
    phase: 4,
    segments: [
      { chars: 'wh', type: 'digraph' },
      { chars: 'a', type: 'single', decodable: false, note: 'makes /o/ sound' },
      { chars: 't', type: 'single' }
    ],
    phonemes: ['w', 'o', 't']
  }
};

/**
 * Detect if a word contains a split digraph pattern
 */
function detectSplitDigraph(word) {
  const lowerWord = word.toLowerCase();

  // Pattern: vowel + single consonant + 'e' at end (and word is 4+ chars)
  if (lowerWord.length < 4 || !lowerWord.endsWith('e')) {
    return null;
  }

  // Check for V-C-e pattern at end
  const beforeE = lowerWord[lowerWord.length - 2];
  const beforeConsonant = lowerWord[lowerWord.length - 3];

  // Must be consonant before 'e' and vowel before that
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  if (!consonants.includes(beforeE) || !SPLIT_DIGRAPH_VOWELS.includes(beforeConsonant)) {
    return null;
  }

  // Check it's not a digraph before the 'e'
  const twoBeforeE = lowerWord.slice(-3, -1);
  if (DIGRAPHS.includes(twoBeforeE)) {
    return null;
  }

  return {
    vowel: beforeConsonant,
    vowelPos: lowerWord.length - 3,
    ePos: lowerWord.length - 1
  };
}

/**
 * Get the phoneme for a split digraph
 */
function getSplitDigraphPhoneme(vowel) {
  const map = {
    'a': 'ai',
    'e': 'ee',
    'i': 'igh',
    'o': 'oa',
    'u': 'oo'
  };
  return map[vowel] || vowel;
}

/**
 * Segment a word into its phonemic components
 */
function segmentWord(word, phase, targetGrapheme) {
  const lowerWord = word.toLowerCase();

  // Check if it's a tricky word
  if (TRICKY_WORDS[lowerWord] || TRICKY_WORDS[word]) {
    const tricky = TRICKY_WORDS[lowerWord] || TRICKY_WORDS[word];
    return {
      word,
      phase: tricky.phase,
      targetGrapheme,
      type: 'tricky',
      segments: tricky.segments.map(s => ({ ...s })),
      phonemes: [...tricky.phonemes]
    };
  }

  // Check for split digraph (only for phase 5 words or explicitly marked)
  const splitDigraph = detectSplitDigraph(word);
  if (splitDigraph && (phase === 5 || (targetGrapheme && targetGrapheme.includes('-e')))) {
    return segmentWithSplitDigraph(word, phase, targetGrapheme, splitDigraph);
  }

  // Normal segmentation
  const segments = [];
  const phonemes = [];
  let i = 0;

  while (i < word.length) {
    // Check trigraphs first (longest match)
    if (i + 3 <= word.length) {
      const tri = lowerWord.slice(i, i + 3);
      if (TRIGRAPHS.includes(tri)) {
        segments.push({ chars: word.slice(i, i + 3), type: 'trigraph' });
        phonemes.push(tri);
        i += 3;
        continue;
      }
    }

    // Check digraphs
    if (i + 2 <= word.length) {
      const di = lowerWord.slice(i, i + 2);
      if (DIGRAPHS.includes(di)) {
        segments.push({ chars: word.slice(i, i + 2), type: 'digraph' });
        phonemes.push(PHONEME_MAP[di] || di);
        i += 2;
        continue;
      }
    }

    // Single letter
    const char = word[i];
    const lowerChar = char.toLowerCase();
    segments.push({ chars: char, type: 'single' });
    phonemes.push(PHONEME_MAP[lowerChar] || lowerChar);
    i++;
  }

  return {
    word,
    phase,
    targetGrapheme,
    segments,
    phonemes
  };
}

/**
 * Segment a word that contains a split digraph
 */
function segmentWithSplitDigraph(word, phase, targetGrapheme, split) {
  const segments = [];
  const phonemes = [];
  const lowerWord = word.toLowerCase();

  let i = 0;
  while (i < word.length) {
    // When we hit the split digraph vowel position
    if (i === split.vowelPos) {
      // Add the split digraph segment
      segments.push({
        chars: `${word[i]}-e`,
        type: 'split',
        positions: [split.vowelPos, split.ePos]
      });
      phonemes.push(getSplitDigraphPhoneme(split.vowel));
      i++; // Move past the vowel
      continue;
    }

    // Skip the final 'e' as it's part of the split digraph
    if (i === split.ePos) {
      i++;
      continue;
    }

    // Check digraphs
    if (i + 2 <= word.length && i + 1 !== split.vowelPos && i + 1 !== split.ePos) {
      const di = lowerWord.slice(i, i + 2);
      if (DIGRAPHS.includes(di)) {
        segments.push({ chars: word.slice(i, i + 2), type: 'digraph' });
        phonemes.push(PHONEME_MAP[di] || di);
        i += 2;
        continue;
      }
    }

    // Single letter
    const char = word[i];
    const lowerChar = char.toLowerCase();
    segments.push({ chars: char, type: 'single' });
    phonemes.push(PHONEME_MAP[lowerChar] || lowerChar);
    i++;
  }

  return {
    word,
    phase,
    targetGrapheme: targetGrapheme || `${split.vowel}-e`,
    segments,
    phonemes
  };
}

/**
 * Extract all words from phonics_data.json
 */
function extractWordsFromPhonicsData(data) {
  const words = [];
  const seenWords = new Set();

  // Phase 2
  if (data.phase2) {
    Object.entries(data.phase2).forEach(([setName, setData]) => {
      if (setData.words) {
        Object.entries(setData.words).forEach(([grapheme, wordList]) => {
          if (Array.isArray(wordList)) {
            wordList.forEach((word) => {
              const lowerWord = word.toLowerCase();
              if (!seenWords.has(lowerWord)) {
                seenWords.add(lowerWord);
                words.push({ word, phase: 2, targetGrapheme: grapheme });
              }
            });
          }
        });
      }
    });
  }

  // Phase 3
  if (data.phase3) {
    Object.entries(data.phase3).forEach(([setName, setData]) => {
      if (setData.words) {
        Object.entries(setData.words).forEach(([grapheme, wordList]) => {
          if (Array.isArray(wordList)) {
            wordList.forEach((word) => {
              const lowerWord = word.toLowerCase();
              if (!seenWords.has(lowerWord)) {
                seenWords.add(lowerWord);
                words.push({ word, phase: 3, targetGrapheme: grapheme });
              }
            });
          }
        });
      }
    });
  }

  // Phase 4 (example words from clusters)
  if (data.phase4 && data.phase4.exampleWords) {
    Object.entries(data.phase4.exampleWords).forEach(([pattern, wordList]) => {
      if (Array.isArray(wordList)) {
        wordList.forEach((word) => {
          const lowerWord = word.toLowerCase();
          if (!seenWords.has(lowerWord)) {
            seenWords.add(lowerWord);
            words.push({ word, phase: 4, targetGrapheme: pattern });
          }
        });
      }
    });
  }

  // Phase 5 - Split digraphs
  if (data.phase5 && data.phase5.splitDigraphs) {
    Object.entries(data.phase5.splitDigraphs).forEach(([digraph, info]) => {
      if (info.words && Array.isArray(info.words)) {
        info.words.forEach((word) => {
          const lowerWord = word.toLowerCase();
          if (!seenWords.has(lowerWord)) {
            seenWords.add(lowerWord);
            words.push({ word, phase: 5, targetGrapheme: digraph });
          }
        });
      }
    });
  }

  // Phase 5 - New graphemes
  if (data.phase5 && data.phase5.newGraphemes) {
    Object.entries(data.phase5.newGraphemes).forEach(([grapheme, wordList]) => {
      if (Array.isArray(wordList)) {
        wordList.forEach((word) => {
          const lowerWord = word.toLowerCase();
          if (!seenWords.has(lowerWord)) {
            seenWords.add(lowerWord);
            words.push({ word, phase: 5, targetGrapheme: grapheme });
          }
        });
      }
    });
  }

  // Add tricky words
  if (data.trickyWords) {
    Object.entries(data.trickyWords).forEach(([phase, wordList]) => {
      const phaseNum = parseInt(phase.replace('phase', ''));
      if (Array.isArray(wordList)) {
        wordList.forEach((word) => {
          if (!seenWords.has(word.toLowerCase())) {
            seenWords.add(word.toLowerCase());
            words.push({ word, phase: phaseNum, targetGrapheme: 'tricky' });
          }
        });
      }
    });
  }

  return words;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting word segmentation generation...\n');

  // Read phonics data
  const phonicsDataPath = path.join(__dirname, '../src/data/phonics_data.json');
  const phonicsData = JSON.parse(fs.readFileSync(phonicsDataPath, 'utf-8'));

  // Extract all words
  const wordEntries = extractWordsFromPhonicsData(phonicsData);
  console.log(`Found ${wordEntries.length} unique words to process\n`);

  // Process each word
  const output = {
    metadata: {
      generated: new Date().toISOString().split('T')[0],
      totalWords: wordEntries.length,
      version: '1.0',
      notes: 'Auto-generated segmentation data. Tricky words have manual overrides.'
    },
    words: {}
  };

  let trickyCount = 0;
  let splitDigraphCount = 0;
  let normalCount = 0;

  for (const entry of wordEntries) {
    const segmented = segmentWord(entry.word, entry.phase, entry.targetGrapheme);
    output.words[entry.word.toLowerCase()] = segmented;

    if (segmented.type === 'tricky') {
      trickyCount++;
    } else if (segmented.segments.some(s => s.type === 'split')) {
      splitDigraphCount++;
    } else {
      normalCount++;
    }
  }

  // Write output
  const outputPath = path.join(__dirname, '../src/data/phonics_words_segmented.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('Segmentation complete!\n');
  console.log(`Summary:`);
  console.log(`  - Total words: ${wordEntries.length}`);
  console.log(`  - Normal words: ${normalCount}`);
  console.log(`  - Split digraph words: ${splitDigraphCount}`);
  console.log(`  - Tricky words: ${trickyCount}`);
  console.log(`\nOutput written to: ${outputPath}`);

  // Print some examples
  console.log('\n--- Sample Output ---\n');
  const samples = ['cat', 'ship', 'make', 'night', 'fair', 'said'];
  for (const sample of samples) {
    const word = output.words[sample];
    if (word) {
      console.log(`${sample}:`);
      console.log(`  Phase: ${word.phase}`);
      console.log(`  Segments: ${word.segments.map(s => `${s.chars}(${s.type})`).join(' + ')}`);
      console.log(`  Phonemes: [${word.phonemes.join(', ')}]`);
      console.log('');
    }
  }
}

main().catch(console.error);
