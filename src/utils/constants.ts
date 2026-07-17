export const CONSTANTS = {
  // Colours
  colors: {
    background: '#FFFFCC', // Pale yellow
    readingGuide: '#F5851F', // Orange — warm aids only, blue raises visual stress
    buttonPrimary: '#22C55E', // Green
    buttonSecondary: '#F97316', // Orange
    buildingZoneInactive: 'rgba(156, 163, 175, 0.3)', // Grey
    buildingZoneActive: '#FFFFFF',
  },

  // Typography
  typography: {
    wordFontSize: '4.5rem', // 72px
    storyFontSize: '2.25rem', // 36px
    buttonFontSize: '1.5rem', // 24px
    letterSpacing: '2.5px',
    lineHeight: 1.8,
  },

  // Layout
  layout: {
    readingZoneWidth: '55%',
    buildingZoneWidth: '45%',
    buttonMinHeight: '60px',
    guideLineHeight: '4px',
  },

  // Session
  session: {
    phonicsWordsPerSet: 4,
    bonusWordsPerSet: 1,
    totalWordsPerSet: 5, // 4 phonics + 1 bonus
    bonusObjectsOnStoryComplete: 3,
    objectDropDelayMs: 150,
  },

  // Animation
  animation: {
    objectDropDurationMs: 500,
  },

  // Phoneme marks
  phonemeMarks: {
    word: {
      dotSize: 6,
      underlineHeight: 3,
      curveHeight: 30,   // arch height above the word (was 44)
      markHeight: 14,    // mark container height below letters (dot/underline gap)
      marksBottom: 4,
    },
    story: {
      dotSize: 4,
      underlineHeight: 2,
      curveHeight: 20,   // arch height above the word (was 28)
      markHeight: 10,    // mark container height below letters
      marksBottom: 2,
    },
  },
} as const;

// Object asset names
export const OBJECT_ASSETS = [
  'toilet-roll',
  'milk-bottle',
  'cardboard-box',
  'straw',
  'tin-can',
  'egg-carton',
  'bottle-lid',
  'paper-tube',
  'plastic-cup',
  'yoghurt-pot',
  'cereal-box',
  'bubble-wrap',
  'cotton-reel',
  'juice-carton',
  'newspaper',
] as const;

export type ObjectAsset = typeof OBJECT_ASSETS[number];

export const getRandomObject = (): ObjectAsset => {
  return OBJECT_ASSETS[Math.floor(Math.random() * OBJECT_ASSETS.length)];
};
