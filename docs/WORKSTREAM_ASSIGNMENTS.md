# Robot Reading Sprint: Workstream Assignments

## For Dev A: Reading Aids

**Branch**: `feature/reading-aids`  
**Merge order**: First (smaller changes)

### Your responsibilities:
1. Lightbox feature (word highlighting on drag)
2. Ruler feature (draggable reading line)
3. Toggle buttons and mutual exclusion logic
4. Extend ChildProfile with `readingAids` fields

### Files you'll create/modify:
- `src/types/ChildProfile.ts` - Add readingAids
- `src/components/StoryScreen/StoryScreen.tsx` - Main container
- `src/components/StoryScreen/StoryDisplay.tsx` - Lightbox mode
- `src/components/StoryScreen/StoryWithRuler.tsx` - Ruler mode
- `src/components/StoryScreen/ToggleButton.tsx` - Reusable toggle
- `src/components/StoryScreen/storyScreen.css` - All styles

### Your section in the brief:
**Look for**: "WORKSTREAM A: READING AIDS" (pages 4-10 in DOCX)

### Key deliverables:
- Two toggle buttons (mutually exclusive)
- Lightbox: dim all words, light up word under touch/mouse
- Ruler: draggable 4px blue line that snaps to rows
- All settings persist to localStorage
- Full testing checklist completion

---

## For Dev B: Phonics Features

**Branch**: `feature/phonics`  
**Merge order**: Second (after Dev A merged)

### Your responsibilities:
1. Sound-It-Out feature (phoneme-by-phoneme audio)
2. Parent sound selection (filter words by graphemes)
3. Visual phoneme marking (dots, underlines, curves)
4. Extend ChildProfile with phonics fields

### Files you'll create/modify:
- `src/types/ChildProfile.ts` - Add phonics fields
- `src/types/PhonicsTypes.ts` - New type definitions
- `src/data/phonics_data.json` - Add provided JSON data
- `src/utils/phonicsHelpers.ts` - Filtering/lookup functions
- `src/utils/audioHelpers.ts` - Audio sequencing
- `src/components/ParentSettings/` - Settings UI (3 files)
- `src/components/SessionSelection/` - Session selector (2 files)
- `src/components/StoryScreen/SoundItOutButton.tsx`
- `src/components/StoryScreen/PhonemeMarkedWord.tsx`
- `src/components/StoryScreen/SplitDigraphMarker.tsx`
- `src/assets/audio/phonemes/` - 44 audio files (MP3)

### Your section in the brief:
**Look for**: "WORKSTREAM B: PHONICS FEATURES" (pages 11-24 in DOCX)

### Key deliverables:
- 44 phoneme audio files (British English)
- Sequential audio playback with pauses
- Parent settings UI (phase selector, sound selector)
- Session selection (single sound/mixed/all words)
- Visual markers (dots, underlines, SVG curves)
- Full testing checklist completion

### Important notes:
- You'll need `phonics_data.json` (provided separately)
- Audio files can be sourced/recorded in parallel
- When you merge, resolve any ChildProfile conflicts with Dev A

---

## Coordination Points

### Both developers:
1. Extend `ChildProfile.ts` independently
2. Both add features to `StoryScreen.tsx`
3. Communicate before touching shared files

### Merge strategy:
1. Dev A creates PR first, gets reviewed and merged
2. Dev B rebases on main (includes Dev A's changes)
3. Dev B resolves ChildProfile conflicts by merging both field sets
4. Dev B's PR reviewed and merged
5. Full integration testing with both feature sets

### Final merged ChildProfile will have:
```typescript
interface ChildProfile {
  // ... existing fields ...
  
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

---

## Questions?

**Dev A**: Focus on section "WORKSTREAM A: READING AIDS"  
**Dev B**: Focus on section "WORKSTREAM B: PHONICS FEATURES"  
**Both**: Read "INTEGRATION & MERGE STRATEGY" section

Complete brief: `Robot_Reading_Combined_Brief.docx`
