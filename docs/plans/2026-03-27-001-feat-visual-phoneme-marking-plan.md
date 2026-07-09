---
title: "feat: Add visual phoneme marking to words"
type: feat
status: completed
date: 2026-03-27
origin: docs/brainstorms/2026-03-27-visual-phoneme-marking-requirements.md
---

# feat: Add visual phoneme marking to words

## Overview

Add standard UK phonics notation marks underneath words throughout the app. When enabled, every displayed word shows its grapheme segmentation: dots under single-letter phonemes, underlines under digraphs/trigraphs, and curved lines connecting split digraph letters. This gives children and parents a visual representation of how words break into sounds.

## Problem Frame

Children learning to read need visual cues to understand sound-letter relationships. Currently the app displays words as plain text with no segmentation. Adding phoneme marks reinforces the phonics patterns being practised. (see origin: docs/brainstorms/2026-03-27-visual-phoneme-marking-requirements.md)

## Requirements Trace

- R1. **Phoneme marks on practice words** — WordDisplay shows marks underneath the current word
- R2. **Phoneme marks on story text** — StoryDisplayLightbox and StoryWithRuler show marks on words. In lightbox mode, marks only appear on the highlighted (lit) word, not dimmed words
- R3. **Parent toggle** — `visualPhonemeMarking` profile boolean controls display. Already exists in ChildProfile, defaults to `true`. Parents toggle in settings
- R4. **Teaching tips updated** — Explain dot = single sound, underline = digraph/trigraph, curve = split digraph
- R5. **Phonics data extended** — `wordSets.json` words gain segment annotations
- R6. **Phonics types** — `WordSegment`, `SegmentedWord`, and related types defined in `src/types/index.ts`

## Scope Boundaries

- **In scope**: Visual marking display, parent toggle, data extension, teaching tips
- **Out of scope**: Sound-It-Out audio playback, parent sound selection, session selector, bonus transition screen marking (see origin)
- **Out of scope**: Marks on tricky/bonus words — these are sight words with irregular grapheme-phoneme correspondence; showing standard phonics marks would imply regular decoding and confuse children (e.g. "said" marked as s-ai-d suggests "ai" is a regular digraph)
- **Out of scope**: Marks on story words that aren't in the current word set's phonics words (story filler words like "the", "and" render without marks)

## Context & Research

### Relevant Code and Patterns

- **Profile toggle**: `visualPhonemeMarking: boolean` exists on `ChildProfile` in `src/types/profile.ts:47`, defaults to `true` for all year groups, migrated in `src/hooks/useStorage.ts:56`. Not yet consumed by any rendering component
- **Reading aids prop threading**: `readingAids` flows `App -> SessionScreen -> ReadingZone -> WordDisplay/StoryScreen`. The phoneme marking toggle should follow the same pattern as a separate prop
- **Word display**: `src/components/ReadingZone/WordDisplay.tsx` renders `<StyledText size="word">{word}</StyledText>` as a plain string. The `ReadingGuide` width below the word is calculated as `word.length * 45`px; the word itself uses natural text layout
- **Story display**: `src/components/ReadingZone/StoryDisplayLightbox.tsx` splits story text by whitespace into per-word `<span>` elements. Lightbox applies `.word-dim` / `.word-lit` CSS classes. Hit detection uses `getBoundingClientRect` on word spans
- **Ruler display**: `src/components/ReadingZone/StoryWithRuler.tsx` — same per-word span pattern, no lightbox interaction
- **Segment examples**: `src/data/phonics_data.json` already contains `segmentationExamples` showing the exact data schema: `{ chars, type, positions? }` with types `"single"`, `"digraph"`, `"trigraph"`, `"split"`
- **Operational data**: `src/data/wordSets.json` has 34 word sets, 166 unique phonics+bonus words needing segments. Words are currently `{ word: string, teachingTip: string }`
- **Styling**: Mix of Tailwind utilities and plain CSS (`storyScreen.css`). Constants centralised in `src/utils/constants.ts`
- **Settings UI**: `src/components/Settings/EditProfile.tsx` handles profile editing but has no `visualPhonemeMarking` toggle yet

### External References

- Letters and Sounds phonics scheme — the standard notation this feature implements
- The codebase has strong local patterns for component structure, prop threading, and CSS. No external research needed.

## Key Technical Decisions

- **Static CSS for split digraph curves**: Pre-defined SVG curve widths based on letter-span count (1 letter gap, 2 letter gap). No dynamic ref measurement. Rationale: the app uses consistent font sizes per context, visual tolerance is high for children, and this avoids layout thrashing with many marked words in stories (see origin)
- **Shared `PhonemeMarkedWord` component**: A single component renders any word with its marks. Used by both WordDisplay and story renderers. Avoids duplicating mark rendering logic in three places
- **Character-level `<span>` rendering**: Each letter in a marked word gets its own `<span>`. This gives deterministic positioning for dots (under single chars), underlines (spanning digraph/trigraph chars), and split digraph curves (connecting non-adjacent chars)
- **Marks positioned absolutely below word text**: Marks render via absolute positioning relative to an `inline-block` word container, keeping the marks outside the word span's text-level bounding rect. This preserves lightbox `getBoundingClientRect` hit detection (span height unchanged) while still allowing marks to inherit lightbox dimming via CSS on the container. In lightbox mode, dimmed words show no marks (marks hidden via CSS when `.word-dim` is applied)
- **No marks on tricky/bonus words**: Tricky words have irregular grapheme-phoneme correspondence. Showing standard marks would imply regular decoding (e.g. "ai" in "said" is not a regular digraph). Tricky words render as plain text. Only regular phonics words get segments
- **Segments on phonics words only**: Story filler words and tricky/bonus words render without marks. The segment lookup is keyed by word string against the current word set's phonics words only (excluding bonus word)
- **Segment data lives in `wordSets.json`**: Each `PhonicsWord` and `BonusWord` gains an optional `segments` array. This keeps operational data self-contained — no runtime lookup against `phonics_data.json`
- **`visualPhonemeMarking` threaded as a separate prop**: Not inside `ReadingAids` since it's semantically a learning aid, not a reading accessibility aid. It can coexist with lightbox or ruler
- **Session toolbar quick toggle**: A marks toggle button appears in the session toolbar alongside lightbox and ruler toggles, giving parents quick access without navigating to settings. Not mutually exclusive with reading aids — marks can be on with lightbox or ruler
- **De-emphasised marks in story mode**: When lightbox is off, all phonics words in story mode show marks but at reduced visual weight (lower opacity, thinner strokes) to avoid overwhelming the reading experience. Full-intensity marks only appear on the single highlighted word in lightbox mode and in the practice word display

## Open Questions

### Resolved During Planning

- **Q: How do marks interact with lightbox dimming?** Marks only appear on the highlighted word. Implementation: hide marks on `.word-dim` elements via `display: none` on the marks container when the parent has `.word-dim`
- **Q: What about story words without segment data?** They render as plain text, no marks. The `PhonemeMarkedWord` component gracefully falls back to plain rendering when no segments are provided
- **Q: How does the word width calculation in WordDisplay change?** The `word.length * 45` calculation for `ReadingGuide` width remains — it's approximate anyway. The character spans inside `PhonemeMarkedWord` handle their own layout via `inline` display with the existing `letter-spacing` from `dyslexia-text`
- **Q: Where does the settings toggle go?** Added to `EditProfile.tsx` as a simple on/off toggle, grouped under a "Learning aids" sub-heading below the existing reading aids section
- **Q: How should split digraph `chars` be stored?** The `chars` field stores only the vowel letters without the hyphen (e.g. `"ae"` not `"a-e"` for make). The `positions` array identifies which character indices in the full word these letters occupy. This ensures segment chars concatenation equals the original word string (m + ae + k ≠ "make", so instead: segments are `{chars: "m"}, {chars: "a"}, {chars: "k"}, {chars: "e"}` with a split annotation linking positions [1,3]). Alternatively, split digraph is represented as two single-char segments with a `splitPair` field linking them
- **Q: Should marks go inside or outside word spans?** Marks are positioned via CSS absolute positioning relative to an `inline-block` container that wraps the word text. This keeps the word text's bounding rect at normal text height for lightbox hit detection, while marks extend below. The container itself is `inline-block` (not `inline`) to establish a positioning context
- **Q: How do contractions/possessives work in story lookup?** The existing punctuation-stripping regex handles apostrophes. Contractions like "don't" become "dont" which won't match any phonics word — this is correct since contractions aren't in the word sets
- **Q: Should tricky/bonus words show marks?** No. Tricky words are sight words with irregular grapheme-phoneme mappings. Showing standard phonics marks would be pedagogically misleading. They render as plain text

### Deferred to Implementation

- **Exact SVG path values for split digraph curves**: The bezier control points need visual tuning once rendered at both font sizes (word display vs story). Start with reasonable defaults and adjust
- **Mark sizing relative to font context**: Dots and underlines need to be proportionally smaller in story text (~2.25rem) vs word display (~4.5rem). The exact pixel values will be tuned during implementation

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
WordSegment = { chars: string, type: "single" | "digraph" | "trigraph" | "split", positions?: [number, number] }
  - For split digraphs: chars contains both vowel letters without hyphen (e.g. "ae"),
    positions gives 0-indexed indices in the full word (e.g. [1, 3] for "make")
  - For all other types: chars concatenation across all segments equals the word string

PhonemeMarkedWord component:
  Input: word string, segments array (optional), size ("word" | "story"), showMarks boolean
  If no segments or showMarks is false -> render plain text (preserves existing rendering)
  Otherwise:
    Wrapper: inline-block container with position:relative (establishes positioning context)
    Top layer: character <span>s in normal inline flow (preserves letter-spacing from dyslexia-text)
    Bottom layer: marks positioned absolutely below the text baseline
      single   -> small dot
      digraph  -> straight underline spanning the chars
      trigraph -> straight underline spanning the chars
      split    -> SVG curve connecting the two position indices

  Story mode: marks render at reduced opacity (0.4) for de-emphasised appearance
  Lightbox lit word / practice word: marks at full opacity

In WordDisplay:
  Replace <StyledText>{word}</StyledText>
  with    <PhonemeMarkedWord word={word} segments={segments} size="word" showMarks={visualPhonemeMarking} />
  (Bonus/tricky words: pass no segments, so they render as plain text)

In StoryDisplayLightbox:
  Replace {wordInfo.text} inside word spans
  with    <PhonemeMarkedWord word={cleanWord} segments={lookupSegments(word)} size="story" />
  For punctuated words: split into (prefix, core, suffix) — render prefix + PhonemeMarkedWord + suffix
  Marks hidden on .word-dim spans; de-emphasised on .word-normal; full intensity on .word-lit
  Hit detection: unchanged — word span ref getBoundingClientRect unaffected since marks are absolute-positioned

In StoryWithRuler:
  Note: uses simpler renderStoryWithBoldWords() — no WordInfo/refs structure
  Same PhonemeMarkedWord insertion but adapted to StoryWithRuler's rendering path
  Marks always de-emphasised (no lightbox interaction)
```

## Implementation Units

- [ ] **Unit 1: Types and segment data schema**

  **Goal:** Define the TypeScript types for word segmentation and extend the word set types to support segments

  **Requirements:** R5, R6

  **Dependencies:** None

  **Files:**
  - Modify: `src/types/index.ts` — add `WordSegment`, `SegmentedWord` types; extend `PhonicsWord` with optional `segments`

  **Approach:**
  - `WordSegment`: `{ chars: string, type: 'single' | 'digraph' | 'trigraph' | 'split', positions?: [number, number] }`
  - `SegmentedWord`: `{ word: string, segments: WordSegment[] }`
  - Add `segments?: WordSegment[]` to `PhonicsWord` interface only (not `BonusWord` — bonus/tricky words don't get marks)
  - Keep segments optional so existing data still loads without errors during incremental rollout
  - For split digraphs, `chars` contains the vowel letters without hyphen (e.g. `"ae"`), `positions` gives 0-indexed character indices in the full word

  **Patterns to follow:**
  - Existing type definitions in `src/types/index.ts` and `src/types/profile.ts`
  - The `segmentationExamples` schema in `src/data/phonics_data.json` (note: adapt split digraph `chars` to omit hyphen)

  **Verification:**
  - TypeScript compiles with no errors
  - Existing code continues to work since segments are optional

- [ ] **Unit 2: Segment data for all word sets**

  **Goal:** Add segment annotations to every phonics word in `wordSets.json` (not bonus/tricky words)

  **Requirements:** R5

  **Dependencies:** Unit 1 (types define the schema)

  **Files:**
  - Modify: `src/data/wordSets.json` — add `segments` arrays to all phonics words across 34 word sets

  **Approach:**
  - Each `phonicsWords` entry gains a `segments` array following the schema from Unit 1
  - `bonusWord` entries do NOT get segments — tricky words are sight words and should not show marks
  - Use the `segmentationExamples` in `phonics_data.json` as the reference for segmentation patterns (adapt split digraph `chars` to omit hyphen)
  - Split digraphs: `chars` contains vowel letters without hyphen, `positions` gives 0-indexed indices in the full word
  - Words that appear in multiple sets should have identical segments

  **Test scenarios:**
  - All segment `chars` concatenated should equal the original `word` string
  - Every split digraph segment has a `positions` array with exactly 2 entries
  - No phonics word has an empty `segments` array
  - Digraph segments contain exactly 2 characters; trigraph segments contain exactly 3 characters
  - No adjacent single-char segments that should be a known digraph (cross-reference against digraph list: sh, ch, th, ng, ai, ee, oo, etc.)
  - No bonus/tricky word has a `segments` field

  **Verification:**
  - JSON is valid and app loads without errors
  - Spot-check a sample of words across each segment type (single, digraph, trigraph, split)
  - Run validation checks programmatically (concatenation, char counts, digraph detection)

- [ ] **Unit 3: PhonemeMarkedWord component**

  **Goal:** Create the shared component that renders a word with phoneme marks underneath

  **Requirements:** R1, R2

  **Dependencies:** Unit 1 (types)

  **Files:**
  - Create: `src/components/ReadingZone/PhonemeMarkedWord.tsx`
  - Modify: `src/components/ReadingZone/storyScreen.css` — add phoneme mark styles

  **Approach:**
  - Component accepts: `word`, `segments` (optional), `size` ("word" | "story"), `showMarks` boolean, `emphasis` ("full" | "subtle", defaults to "full")
  - If no segments or `showMarks` is false, render plain text (graceful fallback)
  - Wrapper: `inline-block` container with `position: relative` to establish positioning context
  - Character rendering: individual `<span>`s in normal inline flow (preserves `letter-spacing` from `dyslexia-text` and text wrapping)
  - Marks: positioned absolutely below the text baseline (keeps word span bounding rect height unchanged for hit detection)
  - **Dot** (single): small filled circle via CSS (`border-radius: 50%`)
  - **Underline** (digraph/trigraph): a thin horizontal line spanning the segment width
  - **Split digraph curve**: inline `<svg>` with a quadratic bezier path. Width calculated from the number of characters between the two positions. Use `em`-based sizing so it scales with font context
  - Size prop controls mark dimensions — larger for "word" context, smaller for "story"
  - Emphasis prop: "full" = opacity 1.0 (practice words, lightbox-lit words); "subtle" = opacity 0.4 with thinner strokes (story mode default when lightbox is off)
  - Add mark dimension constants to `src/utils/constants.ts`

  **Patterns to follow:**
  - Inline SVG precedent in `EditProfile.tsx`
  - CSS patterns in `storyScreen.css`
  - `StyledText` component for text rendering conventions

  **Test scenarios:**
  - Word with all single segments shows dots under each letter
  - Word with a digraph shows underline spanning two letters
  - Word with a split digraph shows curve connecting correct positions
  - Word with no segments renders as plain text
  - Marks scale appropriately between "word" and "story" sizes

  **Verification:**
  - Component renders visually correct marks for each segment type
  - Plain text fallback works when segments are absent

- [ ] **Unit 4: Wire PhonemeMarkedWord into WordDisplay**

  **Goal:** Replace plain text word rendering with marked word in the single-word practice view

  **Requirements:** R1, R3

  **Dependencies:** Unit 2 (data), Unit 3 (component)

  **Files:**
  - Modify: `src/components/ReadingZone/WordDisplay.tsx`
  - Modify: `src/components/ReadingZone/ReadingZone.tsx`
  - Modify: `src/components/SessionScreen.tsx`

  **Approach:**
  - Thread `visualPhonemeMarking` boolean from `activeProfile` through `SessionScreen` -> `ReadingZone` -> `WordDisplay` as a new prop
  - Add `segments?: WordSegment[]` to `ReadingZoneProps` — `SessionScreen` extracts segments from the current `PhonicsWord` object (undefined for bonus words, which have no segments)
  - In `WordDisplay`, replace `<StyledText size="word">{word}</StyledText>` with `<PhonemeMarkedWord word={word} segments={segments} size="word" showMarks={visualPhonemeMarking} emphasis="full" />`
  - Bonus words: `segments` will be undefined, so `PhonemeMarkedWord` renders plain text (correct — no marks on tricky words)
  - The `ReadingGuide` below the word continues to work as before — add 8px margin-top gap when marks are present to prevent overlap

  **Patterns to follow:**
  - How `readingAids` is currently threaded through the component tree
  - How `activeProfile` fields are extracted in `SessionScreen`

  **Test scenarios:**
  - With marking on: practice word shows dots/underlines/curves at full emphasis
  - With marking off: practice word shows as plain text (same as current)
  - Bonus/tricky words show NO marks (plain text regardless of toggle)
  - ReadingGuide still appears below the word with adequate spacing

  **Verification:**
  - Toggle the setting off and on — marks appear and disappear
  - All four segment types render correctly in the word display context

- [ ] **Unit 5: Wire PhonemeMarkedWord into story display**

  **Goal:** Add phoneme marks to words in story text across both lightbox and ruler modes

  **Requirements:** R2, R3

  **Dependencies:** Unit 2 (data), Unit 3 (component), Unit 4 (prop threading)

  **Files:**
  - Modify: `src/components/ReadingZone/StoryDisplayLightbox.tsx`
  - Modify: `src/components/ReadingZone/StoryWithRuler.tsx`
  - Modify: `src/components/ReadingZone/StoryScreen.tsx`
  - Modify: `src/components/ReadingZone/storyScreen.css`

  **Approach:**
  - Thread `visualPhonemeMarking` and the current word set's phonics words (with segments) through `StoryScreen` to both story renderers
  - Build a segment lookup map: `Map<string, WordSegment[]>` keyed by lowercase word, populated from the current word set's phonics words only (not bonus word — tricky words get no marks)
  - **Punctuation handling**: For each story word token, split into `{ prefix, core, suffix }` (e.g. `"play."` → `{ prefix: "", core: "play", suffix: "." }`). Look up `core` in segment map. Render as: prefix span + `<PhonemeMarkedWord>` + suffix span, all inside the same parent word span (preserves hit detection ref)
  - **StoryDisplayLightbox**: Replace `{wordInfo.text}` with the punctuation-aware marked word rendering. Emphasis varies by lightbox state:
    - `.word-dim`: marks hidden (`display: none`)
    - `.word-lit`: marks at full emphasis
    - `.word-normal` (lightbox off): marks at subtle emphasis (opacity 0.4)
  - **StoryWithRuler**: Note this component uses a simpler `renderStoryWithBoldWords()` function with no WordInfo/refs structure. Adapt the insertion point to this rendering path — wrap `{part}` in the same punctuation-aware marked word rendering. Marks always at subtle emphasis
  - **Hit detection**: Marks are absolutely positioned below the text, so the word span's `getBoundingClientRect` height is unchanged. Hit detection works without modification
  - Increase story line-height from 1.8 to 2.2 when marks are enabled, to provide space for marks below the text baseline without overlapping the next line

  **Patterns to follow:**
  - Current word parsing in `StoryDisplayLightbox` (`story.split(/(\s+)/)`)
  - Existing punctuation stripping regex: `part.replace(/[.,!?;:'"]/g, '')`
  - CSS class patterns in `storyScreen.css`

  **Test scenarios:**
  - Lightbox on: only the highlighted word shows marks at full intensity, dimmed words show no marks
  - Lightbox off: all phonics words in story show marks at subtle (de-emphasised) opacity
  - Ruler mode: all phonics words show marks at subtle opacity
  - Filler words ("the", "and") and bonus/tricky words never show marks
  - Punctuated words render correctly: `"play."` shows marked "play" followed by period
  - Words with leading punctuation (quotes): `"play` renders quote then marked word
  - Hit detection for lightbox still works — drag across words and verify correct highlighting
  - Multi-line stories: marks do not overlap the next line (line-height increased)

  **Verification:**
  - Toggle lightbox and drag across words — marks appear only on the lit word at full emphasis
  - Toggle ruler — marks visible on phonics words at subtle emphasis
  - Toggle visualPhonemeMarking off — no marks anywhere in story
  - Verify StoryWithRuler integration works despite its different rendering path

- [ ] **Unit 6: Settings toggle, toolbar toggle, and teaching tips**

  **Goal:** Add phoneme marking toggles (settings + session toolbar) and update teaching tips to explain the notation

  **Requirements:** R3, R4

  **Dependencies:** Unit 4 (the toggle needs something visible to control)

  **Files:**
  - Modify: `src/components/Settings/EditProfile.tsx` — add settings toggle
  - Modify: parent component providing `EditProfile`'s `onSave` prop — extend `onSave` type signature to include `visualPhonemeMarking`
  - Modify: `src/components/ReadingZone/StoryScreen.tsx` — add toolbar toggle button alongside lightbox/ruler toggles
  - Modify: `src/components/ReadingZone/WordDisplay.tsx` — add toolbar toggle button for word display mode

  **Approach:**
  - **Settings toggle**: Add a "Show sound marks" toggle in `EditProfile.tsx` under a "Learning aids" sub-heading, below the existing reading aids section. Extend the `EditProfileProps.onSave` updates type to include `visualPhonemeMarking: boolean`. Update the parent component that provides `onSave` to thread the new field through to `useStorage`
  - **Session toolbar toggle**: Add a marks toggle button (icon: e.g. "Aa" or a dot-underline icon) to the toggle row in `StoryScreen.tsx` and to `WordDisplay.tsx`. Uses the same `ToggleButton` component as lightbox/ruler. Not mutually exclusive with reading aids — marks can be on alongside lightbox or ruler. Toggle calls `onUpdateProfile` or a new callback to update `visualPhonemeMarking` on the active profile
  - **Teaching tips**: Update teaching tip text in `wordSets.json` (data change, not component change) to include notation explanation where appropriate:
    - Dot = one letter, one sound
    - Underline = two or three letters, one sound (digraph/trigraph)
    - Curved line = split digraph (vowel sound split by a consonant)

  **Patterns to follow:**
  - Existing `ToggleButton` component and toggle row patterns in `StoryScreen.tsx`
  - Existing toggle and form patterns in `EditProfile.tsx`
  - `TeachingTipBadge` component for tip display

  **Test scenarios:**
  - Settings toggle off -> marks disappear in session
  - Settings toggle on -> marks reappear
  - Toolbar toggle works during active session without disrupting reading position
  - Toolbar toggle state syncs with profile setting (persists across sessions)
  - Marks toggle coexists with lightbox and ruler (not mutually exclusive)
  - Setting persists across app reload
  - Teaching tip text is clear and age-appropriate for adults

  **Verification:**
  - Full round-trip: change setting in either location, verify marks state matches
  - Toolbar toggle visible and functional in both word display and story modes
  - Teaching tips display correctly

## System-Wide Impact

- **Lightbox hit detection**: Marks are absolutely positioned below the text baseline, keeping the word span's `getBoundingClientRect` height at normal text height. Hit detection should work without modification. Verify manually that touch/mouse drag correctly identifies words when marks are enabled
- **ReadingGuide**: The guide bar below words in `WordDisplay` sits after the word container. Add 8px margin-top gap when marks are present to prevent overlap with mark content
- **Story line height**: Increase `lineHeight` from 1.8 to 2.2 when marks are enabled in story mode, to provide space for marks below the text baseline. This may reflow stories slightly — acceptable tradeoff
- **Word container CSS**: Change `.word-container` from `display: inline` to `display: inline-block` to establish a positioning context for absolutely-positioned marks. Verify this doesn't affect text wrapping behaviour in stories
- **Performance**: With 34 word sets and stories containing ~20-40 words each, the maximum render is ~40 `PhonemeMarkedWord` components per story. Each is lightweight (a few spans + optional SVG). No performance concern
- **State lifecycle**: The `visualPhonemeMarking` boolean is already persisted via `useStorage`. Toggle changes from both settings and toolbar take effect immediately via React re-render

## Risks & Dependencies

- **Data quality**: Phonics words need correct segmentation. Mitigation: programmatic validation — concatenation check, digraph/trigraph char-count verification, cross-reference against known digraph list to catch missed multi-letter graphemes
- **CSS layout with character spans**: Individual character `<span>`s must preserve `letter-spacing` from `dyslexia-text` and normal text wrapping in stories. Prototype early to verify rendering matches current plain-text appearance. Use `inline` spans for characters (not `inline-flex`) to stay in normal text flow
- **Lightbox DOM structure change**: The word span now contains child character spans and absolutely-positioned marks instead of a plain text node. Low risk for hit detection since marks are absolute-positioned, but verify manually

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-27-visual-phoneme-marking-requirements.md](docs/brainstorms/2026-03-27-visual-phoneme-marking-requirements.md)
- Related code: `src/data/phonics_data.json` segmentationExamples (schema reference)
- Related code: `src/components/ReadingZone/StoryDisplayLightbox.tsx` (lightbox integration point)
- Related code: `src/types/profile.ts` (existing `visualPhonemeMarking` field)
