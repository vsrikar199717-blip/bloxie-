# Robot Reading: Combined Sprint Brief
**Two Parallel Workstreams**

Version 1.0 | January 2026

---

## Project Context

Robot Reading is a dyslexia-focused phonics app for early readers (React/TypeScript/Tailwind PWA). This sprint implements five features across two parallel development workstreams.

**Tech Stack**: React, TypeScript, Tailwind CSS, PWA, localStorage, Vercel

---

## Workstream Assignments

### **WORKSTREAM A: Reading Aids**
**Developer**: Dev A  
**Features**: Lightbox & Ruler toggle features  
**Complexity**: Medium  
**Files**: 5-7 files in StoryScreen area  
**Dependencies**: Minimal  
**Merge order**: First (smaller surface area)

### **WORKSTREAM B: Phonics Features**
**Developer**: Dev B  
**Features**: Sound-It-Out, Parent Sound Selection, Visual Phoneme Marking  
**Complexity**: High  
**Files**: 12-15 files across multiple areas  
**Dependencies**: phonics_data.json structure  
**Merge order**: Second (resolves any ChildProfile conflicts)

---

## Shared Coordination Points

Both workstreams extend `ChildProfile` type independently. Merge Dev A first, then Dev B resolves any conflicts in the profile structure.

**Shared files**:
- `src/types/ChildProfile.ts` - Both extend profile
- `src/components/StoryScreen/StoryScreen.tsx` - Both add UI elements
- Parent settings area - Both add toggles/controls

**Integration testing**: Full test after both workstreams merged

---

# WORKSTREAM A: READING AIDS

## Overview

Add two mutually exclusive toggleable reading aids to stories screen:
- **Lightbox**: Highlights individual words as finger/mouse drags across them
- **Ruler**: Draggable blue line that underlines current row

---

## A1: Data Structure Updates

**File**: `src/types/ChildProfile.ts`

Add to existing ChildProfile interface:

```typescript
interface ChildProfile {
  id: string;
  name: string;
  readingAge: 'age4-5' | 'age5-6' | 'age6-7' | 'age7-8' | 'age8-9' | 'age9-10' | 'age10-11';
  createdAt: string;
  lastPlayed: string;
  preferredTheme?: 'robot' | 'mystical' | 'monster';
  progress?: {
    completedSetIds: string[];
  };
  // WORKSTREAM A: Add these fields
  readingAids: {
    lightbox: boolean;
    ruler: boolean;
  };
}
```

**Default for new profiles**:
```typescript
readingAids: {
  lightbox: false,
  ruler: false,
}
```

---

## A2: Component Structure

```
src/components/StoryScreen/
├── StoryScreen.tsx           # Main container with toggle logic
├── StoryDisplay.tsx          # Normal/lightbox display mode
├── StoryWithRuler.tsx        # Ruler mode display
├── ToggleButton.tsx          # Reusable toggle component
└── storyScreen.css           # All styles
```

---

## A3: UI Layout

Stories screen button layout:

```
┌─────────────────────────────────────────┐
│           [Story text here]             │
│─────────────────────────────────────────│
│      [💡 Lightbox]    [📏 Ruler]        │  ← New toggle row
│      [▶️ Play story]  [Next set →]      │  ← Existing buttons
└─────────────────────────────────────────┘
```

---

## A4: ToggleButton Component

**File**: `src/components/StoryScreen/ToggleButton.tsx`

```typescript
interface ToggleButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onToggle: () => void;
}

export function ToggleButton({ icon, label, isActive, onToggle }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`toggle-button ${isActive ? 'toggle-active' : 'toggle-inactive'}`}
    >
      {icon} {label}
    </button>
  );
}
```

**CSS** (in `storyScreen.css`):
```css
.toggle-button {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #ccc;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-active {
  border-color: #4A90D9;
  background: #E8F1FA;
  color: #4A90D9;
}

.toggle-inactive {
  border-color: #ccc;
  background: white;
  color: #666;
}

.toggle-button:hover {
  opacity: 0.8;
}
```

---

## A5: StoryScreen Container

**File**: `src/components/StoryScreen/StoryScreen.tsx`

**Toggle logic** (mutually exclusive - only one active at a time):

```typescript
function StoryScreen({ profile, updateProfile, story }) {
  const [lightboxOn, setLightboxOn] = useState(profile.readingAids.lightbox);
  const [rulerOn, setRulerOn] = useState(profile.readingAids.ruler);

  const handleLightboxToggle = () => {
    const newValue = !lightboxOn;
    setLightboxOn(newValue);
    
    // Turn off ruler if turning on lightbox
    if (newValue) {
      setRulerOn(false);
      updateProfile(profile.id, { 
        readingAids: { lightbox: true, ruler: false } 
      });
    } else {
      updateProfile(profile.id, { 
        readingAids: { lightbox: false, ruler: rulerOn } 
      });
    }
  };

  const handleRulerToggle = () => {
    const newValue = !rulerOn;
    setRulerOn(newValue);
    
    // Turn off lightbox if turning on ruler
    if (newValue) {
      setLightboxOn(false);
      updateProfile(profile.id, { 
        readingAids: { lightbox: false, ruler: true } 
      });
    } else {
      updateProfile(profile.id, { 
        readingAids: { lightbox: lightboxOn, ruler: false } 
      });
    }
  };

  return (
    <div className="story-screen">
      <StoryDisplay 
        story={story} 
        lightboxOn={lightboxOn} 
        rulerOn={rulerOn} 
      />
      
      <div className="toggle-row">
        <ToggleButton
          icon="💡"
          label="Lightbox"
          isActive={lightboxOn}
          onToggle={handleLightboxToggle}
        />
        <ToggleButton
          icon="📏"
          label="Ruler"
          isActive={rulerOn}
          onToggle={handleRulerToggle}
        />
      </div>
      
      <div className="action-row">
        <button onClick={playStory}>▶️ Play story</button>
        <button onClick={nextSet}>Next set →</button>
      </div>
    </div>
  );
}
```

---

## A6: Lightbox Implementation

**File**: `src/components/StoryScreen/StoryDisplay.tsx`

**Behaviour**:
- OFF: All words display normally (opacity 1)
- ON: All words dimmed (opacity 0.3)
- Drag finger/mouse across words to light them up one at a time
- Word only lit while touching - dims immediately on release

```typescript
function StoryDisplay({ story, lightboxOn, rulerOn }: Props) {
  const [litWordIndex, setLitWordIndex] = useState<number | null>(null);
  const words = story.split(' ');

  const handleTouchStart = (index: number) => {
    if (lightboxOn) {
      setLitWordIndex(index);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!lightboxOn) return;
    
    // Get element under touch/mouse point
    const touch = 'touches' in e ? e.touches[0] : e;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element?.dataset?.wordIndex) {
      setLitWordIndex(parseInt(element.dataset.wordIndex));
    }
  };

  const handleTouchEnd = () => {
    if (lightboxOn) {
      setLitWordIndex(null);
    }
  };

  // If ruler mode, delegate to StoryWithRuler component
  if (rulerOn) {
    return <StoryWithRuler story={story} />;
  }

  return (
    <p 
      className="story-text"
      onMouseMove={handleTouchMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {words.map((word, index) => (
        <span
          key={index}
          data-word-index={index}
          onMouseDown={() => handleTouchStart(index)}
          onTouchStart={() => handleTouchStart(index)}
          className={
            lightboxOn
              ? index === litWordIndex
                ? 'word-lit'
                : 'word-dim'
              : 'word-normal'
          }
        >
          {word}{' '}
        </span>
      ))}
    </p>
  );
}
```

**Lightbox CSS** (in `storyScreen.css`):
```css
.word-normal {
  opacity: 1;
}

.word-dim {
  opacity: 0.3;
  transition: opacity 0.05s;
}

.word-lit {
  opacity: 1;
  background-color: #FFFAA0;
  padding: 2px 6px;
  border-radius: 4px;
  transition: opacity 0.05s;
}
```

---

## A7: Ruler Implementation

**File**: `src/components/StoryScreen/StoryWithRuler.tsx`

**Behaviour**:
- Blue line (4px thick) starts under first row of text
- User drags the line itself to move between rows
- Line snaps to line-height increments
- Constrained to story bounds

```typescript
function StoryWithRuler({ story }: { story: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rulerY, setRulerY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lineHeight, setLineHeight] = useState(32);

  // Calculate initial position (under first line)
  useEffect(() => {
    if (containerRef.current) {
      const styles = window.getComputedStyle(containerRef.current);
      const lh = parseFloat(styles.lineHeight);
      setLineHeight(lh);
      setRulerY(lh); // Start under first row
    }
  }, []);

  const handleRulerDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let newY = clientY - rect.top;

    // Constrain to container bounds
    const maxY = container.scrollHeight;
    newY = Math.max(lineHeight, Math.min(newY, maxY));

    // Snap to line height increments
    const snappedY = Math.round(newY / lineHeight) * lineHeight;
    
    setRulerY(snappedY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="story-with-ruler"
      onMouseMove={handleDragMove}
      onTouchMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <p className="story-text">{story}</p>
      
      <div
        className={`ruler-line ${isDragging ? 'ruler-dragging' : ''}`}
        style={{ top: rulerY }}
        onMouseDown={handleRulerDragStart}
        onTouchStart={handleRulerDragStart}
      />
    </div>
  );
}
```

**Ruler CSS** (in `storyScreen.css`):
```css
.story-with-ruler {
  position: relative;
  user-select: none;
}

.ruler-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background-color: #4A90D9;
  border-radius: 2px;
  cursor: grab;
  z-index: 10;
  transition: background-color 0.1s;
}

.ruler-dragging {
  cursor: grabbing;
  background-color: #2E6AB3;
}
```

---

## A8: Workstream A Testing Checklist

**Toggle Buttons**:
- [ ] Both buttons render above Play/Next buttons
- [ ] Lightbox button shows 💡 icon + "Lightbox" label
- [ ] Ruler button shows 📏 icon + "Ruler" label
- [ ] Active state visually distinct (blue border/background)
- [ ] Toggling one turns off the other (mutually exclusive)
- [ ] States persist to localStorage
- [ ] States restore on app reload

**Lightbox**:
- [ ] OFF: All words full opacity
- [ ] ON: All words dimmed (opacity 0.3)
- [ ] Touch/click lights up single word (yellow background)
- [ ] Drag follows finger/mouse across words
- [ ] Only one word lit at a time
- [ ] Release dims word immediately
- [ ] Works on touch screens (iPad)
- [ ] Works with mouse (desktop)

**Ruler**:
- [ ] OFF: Story displays normally
- [ ] ON: Blue line appears under first row
- [ ] Line is draggable (touch and mouse)
- [ ] Line snaps to row positions
- [ ] Line constrained to story bounds
- [ ] Line is 4px thick, blue (#4A90D9)
- [ ] Cursor changes (grab/grabbing)

**Edge Cases**:
- [ ] Switching lightbox/ruler mid-story works correctly
- [ ] Very long stories work with ruler
- [ ] Very short stories (1-2 rows) work with ruler
- [ ] Profile updates don't break toggle states

---

# WORKSTREAM B: PHONICS FEATURES

## Overview

Three interconnected phonics features that use shared phonics data:
1. **Sound-It-Out**: Play phoneme-by-phoneme audio then full word
2. **Parent Sound Selection**: Filter practice words by specific sounds
3. **Visual Phoneme Marking**: Toggle visual markers showing word segmentation

All features depend on `phonics_data.json` structure (provided separately).

---

## B1: Data Structure Updates

### B1.1: ChildProfile Extension

**File**: `src/types/ChildProfile.ts`

Add to existing ChildProfile interface:

```typescript
interface ChildProfile {
  id: string;
  name: string;
  readingAge: 'age4-5' | 'age5-6' | 'age6-7' | 'age7-8' | 'age8-9' | 'age9-10' | 'age10-11';
  createdAt: string;
  lastPlayed: string;
  preferredTheme?: 'robot' | 'mystical' | 'monster';
  progress?: {
    completedSetIds: string[];
  };
  // WORKSTREAM B: Add these fields
  phonicsPhase: 2 | 3 | 4 | 5;  // Maps to Letters and Sounds phase
  enabledSounds: string[];      // Array of grapheme strings (e.g. ["sh", "ch", "ai"])
  parentOverride: boolean;      // Allow sounds from later phases
  visualPhonemeMarking: boolean; // Toggle for visual markers
}
```

**Defaults for new profiles**:
```typescript
phonicsPhase: 2,
enabledSounds: [],  // Empty = all sounds for phase available
parentOverride: false,
visualPhonemeMarking: false,
```

### B1.2: Phonics Data Types

**File**: `src/types/PhonicsTypes.ts`

```typescript
export interface WordSegment {
  chars: string;
  type: 'single' | 'digraph' | 'trigraph' | 'split';
  positions?: [number, number]; // For split digraphs only
  decodable?: boolean;          // For tricky words
  note?: string;                // Explanation for tricky parts
}

export interface PhonicsWord {
  word: string;
  phase: number;
  targetGrapheme?: string;
  type?: 'tricky';
  segments: WordSegment[];
  phonemes: string[];
  laterPhaseGraphemes?: string[]; // Flags words containing later graphemes
}

export interface StorySet {
  graphemes: string[];
  words: Record<string, PhonicsWord[]>;
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
    phases_covered: number[];
  };
  graphemeReference: {
    phase2: Record<string, string[]>;
    phase3: Record<string, string[]>;
    phase5: Record<string, string[]>;
  };
  trickyWords: Record<string, string[]>;
  phase2: Record<string, StorySet>;
  phase3: Record<string, any>;
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
}
```

---

## B2: Component Structure

```
src/
├── types/
│   ├── ChildProfile.ts         # Extended profile
│   └── PhonicsTypes.ts         # New phonics types
├── data/
│   └── phonics_data.json       # Full phonics dataset
├── utils/
│   ├── phonicsHelpers.ts       # Filtering, lookup functions
│   └── audioHelpers.ts         # Phoneme audio sequencing
├── components/
│   ├── ParentSettings/
│   │   ├── ParentSettings.tsx  # Main settings screen
│   │   ├── SoundSelector.tsx   # Sound selection UI
│   │   └── PhaseSelector.tsx   # Phase/reading age selector
│   ├── StoryScreen/
│   │   ├── StoryDisplay.tsx    # Modified to support phoneme marking
│   │   ├── PhonemeMarkedWord.tsx  # Word with visual markers
│   │   └── SoundItOutButton.tsx   # Phoneme-by-phoneme playback
│   └── SessionSelection/
│       ├── SessionSelector.tsx # Single sound / mix / all words
│       └── sessionSelection.css
└── assets/
    └── audio/
        └── phonemes/           # 44 phoneme audio files
            ├── s.mp3
            ├── a.mp3
            ├── sh.mp3
            └── ... (44 total)
```

---

## B3: Feature 1 - Sound-It-Out

### B3.1: Phoneme Audio Files

**Directory**: `src/assets/audio/phonemes/`

**Required files** (44 total, British English pronunciation):

**Single consonants**: b, c, d, f, g, h, j, k, l, m, n, p, r, s, t, v, w, x, y, z

**Single vowels**: a, e, i, o, u

**Digraphs**: ch, sh, th, ng, ai, ee, igh, oa, oo, ar, or, ur, ow, oi

**Trigraphs**: ear, air, ure, er

**Phase 5**: ay, ou, ie, ea, oy, ir, ue, aw, wh, ph, ew, oe, au

**File format**: MP3, 16kHz, mono, ~0.5-1 second duration each

**Naming convention**: `{phoneme}.mp3` (e.g., `sh.mp3`, `igh.mp3`)

### B3.2: Audio Playback Helper

**File**: `src/utils/audioHelpers.ts`

```typescript
export interface PhonemeAudioConfig {
  pauseBetweenPhonemes: number;  // milliseconds
  pauseBeforeFullWord: number;   // milliseconds
}

const DEFAULT_CONFIG: PhonemeAudioConfig = {
  pauseBetweenPhonemes: 300,
  pauseBeforeFullWord: 500,
};

export async function playSoundItOut(
  phonemes: string[],
  fullWord: string,
  config: PhonemeAudioConfig = DEFAULT_CONFIG
): Promise<void> {
  // Play each phoneme in sequence
  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    await playPhoneme(phoneme);
    
    // Pause between phonemes (except after last one)
    if (i < phonemes.length - 1) {
      await delay(config.pauseBetweenPhonemes);
    }
  }
  
  // Pause before full word
  await delay(config.pauseBeforeFullWord);
  
  // Play full word with TTS
  await playFullWord(fullWord);
}

async function playPhoneme(phoneme: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`/assets/audio/phonemes/${phoneme}.mp3`);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Failed to load phoneme: ${phoneme}`));
    audio.play();
  });
}

async function playFullWord(word: string): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.onend = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### B3.3: Sound-It-Out Button Component

**File**: `src/components/StoryScreen/SoundItOutButton.tsx`

```typescript
import { playSoundItOut } from '../../utils/audioHelpers';
import type { PhonicsWord } from '../../types/PhonicsTypes';

interface SoundItOutButtonProps {
  word: PhonicsWord;
  disabled?: boolean;
}

export function SoundItOutButton({ word, disabled }: SoundItOutButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      await playSoundItOut(word.phonemes, word.word);
    } catch (error) {
      console.error('Sound-it-out playback failed:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={disabled || isPlaying}
      className={`sound-it-out-button ${isPlaying ? 'playing' : ''}`}
    >
      {isPlaying ? '🔊 Playing...' : '🔊 Sound it out'}
    </button>
  );
}
```

**CSS**:
```css
.sound-it-out-button {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #4A90D9;
  background: white;
  color: #4A90D9;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sound-it-out-button:hover:not(:disabled) {
  background: #E8F1FA;
}

.sound-it-out-button.playing {
  background: #4A90D9;
  color: white;
}

.sound-it-out-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## B4: Feature 2 - Parent Sound Selection

### B4.1: Phonics Helper Functions

**File**: `src/utils/phonicsHelpers.ts`

```typescript
import phonicsData from '../data/phonics_data.json';
import type { PhonicsData, PhonicsWord } from '../types/PhonicsTypes';

const data = phonicsData as PhonicsData;

/**
 * Get all graphemes available for a specific phase
 */
export function getGraphemesForPhase(phase: number): string[] {
  const graphemes: string[] = [];
  
  if (phase >= 2) {
    Object.values(data.graphemeReference.phase2).forEach(set => {
      graphemes.push(...set);
    });
  }
  
  if (phase >= 3) {
    Object.values(data.graphemeReference.phase3).forEach(set => {
      graphemes.push(...set);
    });
  }
  
  if (phase >= 5) {
    graphemes.push(...data.graphemeReference.phase5.newGraphemes);
    graphemes.push(...data.graphemeReference.phase5.splitDigraphs);
  }
  
  return graphemes;
}

/**
 * Filter words by enabled sounds
 * @param phase - User's current phase
 * @param enabledSounds - Array of grapheme strings (empty = all phase sounds)
 * @param allowLaterPhases - Parent override to include later phase words
 */
export function filterWordsBySound(
  phase: number,
  enabledSounds: string[],
  allowLaterPhases: boolean = false
): PhonicsWord[] {
  const words: PhonicsWord[] = [];
  
  // If no specific sounds enabled, use all sounds for phase
  const soundsToInclude = enabledSounds.length > 0 
    ? enabledSounds 
    : getGraphemesForPhase(phase);
  
  // Collect words from relevant phases
  const phasesToSearch = allowLaterPhases 
    ? [2, 3, 4, 5] 
    : [2, 3, 4, 5].filter(p => p <= phase);
  
  phasesToSearch.forEach(p => {
    const phaseKey = `phase${p}`;
    const phaseData = data[phaseKey];
    
    if (!phaseData) return;
    
    // Extract words from phase data structure
    Object.values(phaseData).forEach((set: any) => {
      if (set.words) {
        Object.entries(set.words).forEach(([grapheme, wordList]: [string, any]) => {
          // Include if grapheme is in enabled sounds
          if (soundsToInclude.includes(grapheme)) {
            words.push(...wordList);
          }
        });
      }
    });
  });
  
  return words;
}

/**
 * Get all words containing a specific grapheme
 */
export function getWordsForGrapheme(grapheme: string): PhonicsWord[] {
  const words: PhonicsWord[] = [];
  
  // Search all phases for this grapheme
  [2, 3, 4, 5].forEach(phase => {
    const phaseKey = `phase${phase}`;
    const phaseData = data[phaseKey];
    
    if (!phaseData) return;
    
    Object.values(phaseData).forEach((set: any) => {
      if (set.words && set.words[grapheme]) {
        words.push(...set.words[grapheme]);
      }
    });
  });
  
  return words;
}

/**
 * Check if word contains graphemes from later phases
 */
export function hasLaterPhaseGraphemes(word: PhonicsWord, currentPhase: number): boolean {
  return word.phase > currentPhase || 
         (word.laterPhaseGraphemes && word.laterPhaseGraphemes.length > 0);
}
```

### B4.2: Parent Settings UI

**File**: `src/components/ParentSettings/ParentSettings.tsx`

```typescript
import { PhaseSelector } from './PhaseSelector';
import { SoundSelector } from './SoundSelector';
import type { ChildProfile } from '../../types/ChildProfile';

interface ParentSettingsProps {
  profile: ChildProfile;
  updateProfile: (id: string, updates: Partial<ChildProfile>) => void;
}

export function ParentSettings({ profile, updateProfile }: ParentSettingsProps) {
  const handlePhaseChange = (phase: number) => {
    updateProfile(profile.id, { 
      phonicsPhase: phase as 2 | 3 | 4 | 5,
      enabledSounds: [], // Reset enabled sounds when phase changes
    });
  };

  const handleSoundsChange = (sounds: string[]) => {
    updateProfile(profile.id, { enabledSounds: sounds });
  };

  const handleOverrideToggle = () => {
    updateProfile(profile.id, { 
      parentOverride: !profile.parentOverride 
    });
  };

  const handlePhonemeMarkingToggle = () => {
    updateProfile(profile.id, { 
      visualPhonemeMarking: !profile.visualPhonemeMarking 
    });
  };

  return (
    <div className="parent-settings">
      <h2>Parent Settings</h2>
      
      <section className="settings-section">
        <h3>Reading Phase</h3>
        <PhaseSelector 
          currentPhase={profile.phonicsPhase}
          onChange={handlePhaseChange}
        />
      </section>

      <section className="settings-section">
        <h3>Practice Sounds</h3>
        <SoundSelector
          phase={profile.phonicsPhase}
          enabledSounds={profile.enabledSounds}
          onChange={handleSoundsChange}
        />
        
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={profile.parentOverride}
            onChange={handleOverrideToggle}
          />
          <span>Include words from later phases</span>
        </label>
      </section>

      <section className="settings-section">
        <h3>Visual Aids</h3>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={profile.visualPhonemeMarking}
            onChange={handlePhonemeMarkingToggle}
          />
          <span>Show phoneme markers</span>
        </label>
      </section>
    </div>
  );
}
```

### B4.3: Sound Selector Component

**File**: `src/components/ParentSettings/SoundSelector.tsx`

```typescript
import { getGraphemesForPhase } from '../../utils/phonicsHelpers';

interface SoundSelectorProps {
  phase: number;
  enabledSounds: string[];
  onChange: (sounds: string[]) => void;
}

export function SoundSelector({ phase, enabledSounds, onChange }: SoundSelectorProps) {
  const availableGraphemes = getGraphemesForPhase(phase);
  
  const toggleSound = (grapheme: string) => {
    if (enabledSounds.includes(grapheme)) {
      onChange(enabledSounds.filter(s => s !== grapheme));
    } else {
      onChange([...enabledSounds, grapheme]);
    }
  };

  const selectAll = () => {
    onChange(availableGraphemes);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="sound-selector">
      <div className="selector-controls">
        <button onClick={selectAll}>Select all</button>
        <button onClick={clearAll}>Clear all</button>
        <p className="help-text">
          {enabledSounds.length === 0 
            ? 'All sounds available for practice' 
            : `${enabledSounds.length} sound(s) selected`}
        </p>
      </div>
      
      <div className="grapheme-grid">
        {availableGraphemes.map(grapheme => (
          <button
            key={grapheme}
            className={`grapheme-button ${
              enabledSounds.includes(grapheme) ? 'selected' : ''
            }`}
            onClick={() => toggleSound(grapheme)}
          >
            {grapheme}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**CSS**:
```css
.grapheme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.grapheme-button {
  padding: 12px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.grapheme-button:hover {
  border-color: #4A90D9;
}

.grapheme-button.selected {
  border-color: #4A90D9;
  background: #E8F1FA;
  color: #4A90D9;
}
```

### B4.4: Session Selection UI

**File**: `src/components/SessionSelection/SessionSelector.tsx`

```typescript
import { filterWordsBySound } from '../../utils/phonicsHelpers';
import type { ChildProfile } from '../../types/ChildProfile';

interface SessionSelectorProps {
  profile: ChildProfile;
  onStartSession: (words: PhonicsWord[]) => void;
}

export function SessionSelector({ profile, onStartSession }: SessionSelectorProps) {
  const [selectedGrapheme, setSelectedGrapheme] = useState<string | null>(null);
  
  const availableGraphemes = getGraphemesForPhase(profile.phonicsPhase);

  const startSingleSound = () => {
    if (!selectedGrapheme) return;
    const words = getWordsForGrapheme(selectedGrapheme);
    onStartSession(words);
  };

  const startMixedPractice = () => {
    const words = filterWordsBySound(
      profile.phonicsPhase,
      profile.enabledSounds,
      profile.parentOverride
    );
    onStartSession(words);
  };

  const startAllWords = () => {
    const words = filterWordsBySound(
      profile.phonicsPhase,
      [], // Empty = all sounds
      profile.parentOverride
    );
    onStartSession(words);
  };

  return (
    <div className="session-selector">
      <h2>Choose Practice Type</h2>
      
      <div className="session-option">
        <h3>Practice one sound</h3>
        <select 
          value={selectedGrapheme || ''} 
          onChange={(e) => setSelectedGrapheme(e.target.value)}
        >
          <option value="">Select a sound...</option>
          {availableGraphemes.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button 
          onClick={startSingleSound}
          disabled={!selectedGrapheme}
        >
          Start
        </button>
      </div>

      <div className="session-option">
        <h3>Mixed practice</h3>
        <p>Uses your selected sounds</p>
        <button onClick={startMixedPractice}>
          Start ({profile.enabledSounds.length || 'all'} sounds)
        </button>
      </div>

      <div className="session-option">
        <h3>All words</h3>
        <p>Practice any word at your level</p>
        <button onClick={startAllWords}>
          Start
        </button>
      </div>
    </div>
  );
}
```

---

## B5: Feature 3 - Visual Phoneme Marking

### B5.1: Visual Notation System

- **Single-letter phonemes**: Dot underneath (·)
- **Digraphs**: Straight underline (__)
- **Trigraphs**: Straight underline (___)
- **Split digraphs**: Curved smile line connecting letters (⌣)

### B5.2: Phoneme-Marked Word Component

**File**: `src/components/StoryScreen/PhonemeMarkedWord.tsx`

```typescript
import type { PhonicsWord, WordSegment } from '../../types/PhonicsTypes';

interface PhonemeMarkedWordProps {
  word: PhonicsWord;
}

export function PhonemeMarkedWord({ word }: PhonemeMarkedWordProps) {
  return (
    <span className="phoneme-marked-word">
      {word.segments.map((segment, index) => (
        <span key={index} className="segment-wrapper">
          {renderSegment(segment, word.word)}
        </span>
      ))}
    </span>
  );
}

function renderSegment(segment: WordSegment, fullWord: string) {
  const { chars, type, positions } = segment;
  
  if (type === 'single') {
    return (
      <span className="segment-single">
        {chars}
        <span className="marker-dot">·</span>
      </span>
    );
  }
  
  if (type === 'digraph') {
    return (
      <span className="segment-digraph">
        {chars}
        <span className="marker-underline"></span>
      </span>
    );
  }
  
  if (type === 'trigraph') {
    return (
      <span className="segment-trigraph">
        {chars}
        <span className="marker-underline"></span>
      </span>
    );
  }
  
  if (type === 'split' && positions) {
    // Split digraph - need to render with SVG curve
    const [startPos, endPos] = positions;
    return (
      <span className="segment-split">
        <SplitDigraphMarker 
          startPos={startPos} 
          endPos={endPos}
          word={fullWord}
        />
      </span>
    );
  }
  
  return <span>{chars}</span>;
}
```

### B5.3: Split Digraph SVG Marker

**File**: `src/components/StoryScreen/SplitDigraphMarker.tsx`

```typescript
interface SplitDigraphMarkerProps {
  startPos: number;
  endPos: number;
  word: string;
}

export function SplitDigraphMarker({ startPos, endPos, word }: SplitDigraphMarkerProps) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const [path, setPath] = useState('');

  useEffect(() => {
    if (!wordRef.current) return;
    
    // Calculate positions of letters
    const letters = wordRef.current.querySelectorAll('.letter');
    if (letters.length === 0) return;
    
    const startLetter = letters[startPos] as HTMLElement;
    const endLetter = letters[endPos] as HTMLElement;
    
    const startX = startLetter.offsetLeft + startLetter.offsetWidth / 2;
    const endX = endLetter.offsetLeft + endLetter.offsetWidth / 2;
    const y = startLetter.offsetHeight + 4;
    
    // Create curved path
    const midX = (startX + endX) / 2;
    const curveDepth = 12;
    
    const pathData = `M ${startX} ${y} Q ${midX} ${y + curveDepth} ${endX} ${y}`;
    setPath(pathData);
  }, [startPos, endPos, word]);

  return (
    <span className="split-digraph-container" ref={wordRef}>
      {word.split('').map((letter, index) => (
        <span key={index} className="letter">
          {letter}
        </span>
      ))}
      <svg className="split-digraph-svg">
        <path
          d={path}
          stroke="#4A90D9"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </span>
  );
}
```

**CSS**:
```css
.phoneme-marked-word {
  display: inline-block;
  position: relative;
}

.segment-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 2px;
}

.segment-single {
  position: relative;
  display: inline-block;
}

.marker-dot {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  color: #4A90D9;
  font-size: 20px;
}

.segment-digraph,
.segment-trigraph {
  position: relative;
  display: inline-block;
}

.marker-underline {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4A90D9;
}

.split-digraph-container {
  position: relative;
  display: inline-block;
}

.split-digraph-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.letter {
  display: inline-block;
}
```

### B5.4: Modified StoryDisplay with Phoneme Marking

**File**: `src/components/StoryScreen/StoryDisplay.tsx` (modify existing)

Add phoneme marking capability:

```typescript
function StoryDisplay({ 
  story, 
  lightboxOn, 
  rulerOn,
  phonemeMarkingOn,  // NEW PROP
  phonicsWords       // NEW PROP - array of PhonicsWord objects
}: Props) {
  // ... existing lightbox/ruler logic ...

  // If phoneme marking is on, render with marked words
  if (phonemeMarkingOn && phonicsWords) {
    return (
      <p className="story-text">
        {phonicsWords.map((phonicsWord, index) => (
          <React.Fragment key={index}>
            <PhonemeMarkedWord word={phonicsWord} />
            {' '}
          </React.Fragment>
        ))}
      </p>
    );
  }

  // Otherwise render normal display
  // ... rest of existing code ...
}
```

---

## B6: Data Integration

### B6.1: Loading Phonics Data

**File**: `src/hooks/usePhonicsData.ts`

```typescript
import { useState, useEffect } from 'react';
import phonicsData from '../data/phonics_data.json';
import type { PhonicsData } from '../types/PhonicsTypes';

export function usePhonicsData() {
  const [data, setData] = useState<PhonicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setData(phonicsData as PhonicsData);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}
```

### B6.2: Phonics Data File

Place the provided `phonics_data.json` file at: `src/data/phonics_data.json`

This file contains:
- All graphemes for Phases 2-5
- 10-15 words per grapheme with full segmentation
- Phoneme mappings
- Story sentences
- Tricky word definitions
- Consonant cluster lists

---

## B7: Build Order for Workstream B

| Step | Task | Dependencies |
|------|------|--------------|
| 1 | Create PhonicsTypes.ts | None |
| 2 | Extend ChildProfile | None (parallel with A) |
| 3 | Add phonics_data.json | None |
| 4 | Build phonicsHelpers.ts | Requires types + data |
| 5 | Build audioHelpers.ts | None (parallel with 4) |
| 6 | Parent settings UI | Requires helpers |
| 7 | Session selector | Requires helpers |
| 8 | Sound-it-out button | Requires audio helpers |
| 9 | Visual phoneme marking | Requires types |
| 10 | Record/source phoneme audio | Can be done in parallel |
| 11 | Integration testing | All components complete |

---

## B8: Workstream B Testing Checklist

**Sound-It-Out**:
- [ ] All 44 phoneme audio files present
- [ ] Audio files play correctly (British pronunciation)
- [ ] Phonemes play in correct sequence
- [ ] Pauses between phonemes work (300ms default)
- [ ] Full word plays after phonemes (500ms pause)
- [ ] Button disabled while playing
- [ ] Error handling for missing audio files
- [ ] Works on different browsers/devices

**Parent Sound Selection**:
- [ ] Phase selector shows correct phases
- [ ] Grapheme grid shows all phase-appropriate sounds
- [ ] Sound selection persists to profile
- [ ] "Select all" / "Clear all" buttons work
- [ ] Parent override toggle works
- [ ] Empty enabledSounds = all sounds available
- [ ] Sound filtering returns correct words

**Session Selection**:
- [ ] Single sound option filters correctly
- [ ] Mixed practice uses enabled sounds
- [ ] "All words" option works
- [ ] Parent override affects available words
- [ ] Session starts with correct word set

**Visual Phoneme Marking**:
- [ ] Toggle in parent settings works
- [ ] Single letters show dot underneath
- [ ] Digraphs show straight underline
- [ ] Trigraphs show straight underline
- [ ] Split digraphs show curved smile line
- [ ] Curves connect correct letter positions
- [ ] Markers don't interfere with word spacing
- [ ] Works with different font sizes
- [ ] Toggle persists to profile

**Data Integration**:
- [ ] phonics_data.json loads correctly
- [ ] All phases accessible (2, 3, 4, 5)
- [ ] Grapheme lookup works
- [ ] Word filtering by phase works
- [ ] Tricky words flagged correctly
- [ ] Later phase flags work

**Edge Cases**:
- [ ] Phase change resets enabled sounds
- [ ] Missing phoneme audio handled gracefully
- [ ] Very long words render correctly with markers
- [ ] Single-letter words work with markers
- [ ] Profile updates don't break phonics settings

---

# INTEGRATION & MERGE STRATEGY

## Merge Order

1. **Merge Workstream A first** (simpler, smaller changes)
   - Create branch: `feature/reading-aids`
   - PR review and merge to main
   
2. **Merge Workstream B second**
   - Create branch: `feature/phonics`
   - Rebase on latest main (includes A)
   - Resolve any ChildProfile conflicts
   - PR review and merge to main

## ChildProfile Conflict Resolution

If both workstreams extended ChildProfile, merge both sets of fields:

```typescript
interface ChildProfile {
  id: string;
  name: string;
  readingAge: 'age4-5' | 'age5-6' | 'age6-7' | 'age7-8' | 'age8-9' | 'age9-10' | 'age10-11';
  createdAt: string;
  lastPlayed: string;
  preferredTheme?: 'robot' | 'mystical' | 'monster';
  progress?: {
    completedSetIds: string[];
  };
  // FROM WORKSTREAM A
  readingAids: {
    lightbox: boolean;
    ruler: boolean;
  };
  // FROM WORKSTREAM B
  phonicsPhase: 2 | 3 | 4 | 5;
  enabledSounds: string[];
  parentOverride: boolean;
  visualPhonemeMarking: boolean;
}
```

## Integration Testing

After both workstreams merged:

1. **Profile creation** - All new fields have correct defaults
2. **Profile persistence** - All settings save/restore correctly
3. **Story screen** - All features work together without conflicts
4. **Parent settings** - All toggles and selectors function
5. **Cross-feature interactions**:
   - Lightbox + phoneme marking
   - Ruler + phoneme marking
   - Sound-it-out + visual marking
   - All features off/on combinations

---

# APPENDICES

## Appendix A: Letters and Sounds Framework

| Phase | Age/Year | Content |
|-------|----------|---------|
| 2 | 4-5 / Reception | 19 graphemes: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss |
| 3 | 4-5 / Reception | 25 graphemes: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear, air, ure, er |
| 4 | 4-5 / Reception | Consonant clusters: CVCC, CCVC, CCVCC patterns |
| 5 | 5-6 / Year 1 | Alternative spellings and split digraphs: ay, ou, ie, ea, oy, ir, ue, aw, wh, ph, ew, oe, au, a-e, e-e, i-e, o-e, u-e |

## Appendix B: Tricky Words

| Phase | Words |
|-------|-------|
| 2 | the, to, no, go, I, into |
| 3 | he, she, we, me, be, was, you, they, all, are, my, her |
| 4 | said, have, like, so, do, some, come, were, there, little, one, when, out, what |
| 5 | oh, their, people, Mr, Mrs, looked, called, asked, could |

## Appendix C: Audio Recording Guidelines

**British English pronunciation required**

**Recording specifications**:
- Format: MP3
- Sample rate: 16kHz
- Channels: Mono
- Duration: 0.5-1 second per phoneme
- Volume: Normalized to -3dB
- Silence: Trim leading/trailing silence

**Quality criteria**:
- Clear pronunciation
- No background noise
- Consistent volume across all files
- Child-friendly voice (ideally)

**Recommended sources**:
- Professional educational audio libraries
- British phonics teaching resources
- Custom recording with early years teacher
- Text-to-speech with British accent (fallback)

## Appendix D: Accessibility Considerations

Both workstreams continue existing accessibility principles:

- Increased letter spacing (dyslexia-friendly)
- No ALL CAPS text
- High contrast
- Clear, large touch targets (min 44x44px)
- Keyboard navigation support
- Screen reader compatibility

---

# QUESTIONS FOR TEACHER VALIDATION

Once implementation complete, validate with early years teacher:

1. Phoneme pronunciation accuracy in audio files
2. Word segmentation correctness
3. Any alternative valid segmentations
4. Regional pronunciation variations to flag
5. Appropriateness of word selection for each phase
6. Tricky word classifications
7. Visual marker system clarity

---

**END OF BRIEF**

---

## Developer Quick Reference

**Workstream A**: Reading Aids (Lightbox & Ruler)
- Focus: StoryScreen components
- Files: 5-7 files
- Key: Toggle buttons, word highlighting, draggable ruler

**Workstream B**: Phonics Features
- Focus: Audio, filtering, visual marking
- Files: 12-15 files
- Key: Phoneme audio, sound selection, parent settings

**Merge**: A first, then B (resolve ChildProfile conflicts)
