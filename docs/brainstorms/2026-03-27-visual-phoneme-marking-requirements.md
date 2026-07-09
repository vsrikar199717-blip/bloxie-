---
date: 2026-03-27
topic: visual-phoneme-marking
---

# Visual Phoneme Marking

## Problem Frame

Children learning to read need visual cues to understand how words break down into sounds. Currently Robot Reading displays words as plain text with no segmentation. Adding phoneme marking (dots, underlines, curves) gives children and parents a standard phonics notation that reinforces sound-letter relationships during practice.

## Requirements

- R1. **Phoneme marks on practice words** — When enabled, the single word displayed in the reading zone shows phoneme marks underneath using standard notation:
  - Single-letter phonemes: dot underneath (·)
  - Digraphs (sh, ch, ai, ee, etc.): straight underline
  - Trigraphs (igh, air, ure, er): straight underline
  - Split digraphs (a-e, i-e, o-e, u-e, e-e): curved smile line connecting the two letters

- R2. **Phoneme marks on story text** — When enabled, words in story display also show phoneme marks. This applies across all story display modes (normal, lightbox, ruler).

- R3. **Parent toggle** — The `visualPhonemeMarking` profile setting (already in the type system) controls whether marks are shown. Parents toggle this in settings. Default is `true` (on) for new profiles — this is already set in the codebase.

- R4. **Teaching tips updated** — Teaching tips for adults should explain what the phoneme marks mean:
  - Dot = one letter, one sound
  - Underline = two or three letters, one sound (digraph/trigraph)
  - Curved line = split digraph (the vowel sound is split by a consonant)

- R5. **Phonics data extended** — `phonics_data.json` needs segment annotations added to each word. Each word entry becomes an object with the word string plus a `segments` array containing `{ chars, type, positions? }` entries. This data drives the visual marking.

- R6. **Phonics types created** — A `PhonicsTypes.ts` file defining `WordSegment`, `PhonicsWord`, and related types that the marking component and data model use.

## Success Criteria

- Children see standard UK phonics notation (dots, underlines, curves) on all practice words and story text when the feature is enabled
- Parents can toggle marks on/off in settings; the setting persists across sessions
- Split digraph curves visually connect the correct letter positions
- Marks do not interfere with word spacing, readability, or existing reading aids (lightbox, ruler)
- Teaching tips clearly explain the notation to adults

## Scope Boundaries

- **In scope**: Visual marking display, parent toggle, data extension, teaching tips
- **Out of scope**: Sound-It-Out phoneme audio playback (blocked on recording 44 audio files)
- **Out of scope**: Parent sound selection / session selector (deferred to later brainstorm)
- **Out of scope**: Phoneme marking on the bonus transition screen (keep that simple)

## Key Decisions

- **All four mark types from day one**: Including split digraph curves despite SVG complexity, because split digraphs are a core Phase 5 concept and partial notation would be confusing
- **Default on**: `visualPhonemeMarking` defaults to `true` for all year groups, since the marks are a core learning aid. Parents can opt out.
- **Marks appear everywhere words appear**: Both word display and story text, not one or the other
- **Data-driven**: Segment annotations live in `phonics_data.json` rather than being computed at runtime, because segmentation rules have exceptions and teacher-verified data is more reliable

## Dependencies / Assumptions

- The existing `phonics_data.json` structure will be extended with segment data — this is a significant data task covering all words across phases 2-5
- The `visualPhonemeMarking` field already exists in `ChildProfile` and is wired through `useStorage` — no profile migration needed
- Reading aids (lightbox, ruler) must continue working alongside phoneme marks without visual conflicts

## Outstanding Questions

### Deferred to Planning

- [Affects R2][Technical] How should phoneme marks interact with lightbox word highlighting? The lightbox dims non-highlighted words — should marks be visible on dimmed words or only on the highlighted word?
- [Affects R5][Needs research] What is the best format for segment data in the JSON? The brief suggests `{ chars, type, positions? }` — validate this covers all edge cases in the current word list.
- [Affects R1][Technical] For the split digraph SVG curve, should it use a static CSS approach or dynamic measurement via refs? Consider performance with many marked words in stories.

## Next Steps

→ `/ce:plan` for structured implementation planning
