---
title: "fix: Restore natural character spacing in split-digraph words"
type: fix
status: completed
date: 2026-04-09
---

# fix: Restore natural character spacing in split-digraph words

## Overview

Words that contain a split-digraph phoneme annotation (e.g. "white", "make", "bike") are
rendered with a visible gap between the segment preceding the split group and the split group
itself. The word "white" appears as "wh ite" — a space-sized gap breaks the word visually.
This plan fixes the CSS layout conflict that causes the gap.

## Problem Frame

### Root Cause

The `PhonemeMarkedWord` component renders a split-digraph group as a single
`inline-flex` column containing two flex children:

1. **`.phoneme-split-group > .phoneme-chars`** — `display: flex; flex-direction: row` — a
   **block-level** flex row holding each sub-segment (vowel, consonant(s), silent-e).
2. **`.phoneme-curve-container`** — `display: flex; width: 100%` — the U-shaped SVG curve.

The critical problem is **display blockification inside a flex container**.

CSS Flexbox requires all direct children of a flex container to be block-level. When
`.phoneme-split-sub` (declared `display: inline-flex`) becomes a flex item inside the
block-level `.phoneme-chars` flex row, its outer display is blockified to block. This
switches its width-sizing algorithm from *inline/shrink-to-fit* to *block/flex-item*
rules, which interact with inherited `letter-spacing: 2.5px` differently than the
standard inline text model used by every other `phoneme-segment` in the word.

In the **inline** segments ("wh", single letters), characters flow with the natural
`letter-spacing` cadence: each `phoneme-segment` is an atomic `inline-flex` box and the
letter-spacing on the last character of one box abuts the first character of the next box
with no extra padding. In the **block-flex** split group, the same letter-spacing is
applied inside a new block formatting context, but the outer boundary of the split group
inline box has a different effective advance width — causing the visual gap to open up
between the preceding segment ("wh") and the split group ("ite").

The gap magnitude depends on font metrics, browser, and the number of sub-segments; it is
consistently larger than the normal inter-character spacing (looks like a full space
character), making the word appear as two separate tokens.

### Why other annotated words are unaffected

Non-split words (digraphs, trigraphs, singles) never use the `.phoneme-split-group > .phoneme-chars` flex-row structure. Their `phoneme-chars` is `display: inline`, which stays inline through the whole layout chain. Only the split-digraph path triggers the blockification.

## Requirements Trace

- R1. Characters within a split-digraph word must be spaced identically to those in
  non-annotated words (i.e. `letter-spacing: 2.5px` between every pair of adjacent glyphs,
  no extra gap).
- R2. The U-shaped curve must still span the full horizontal width of the split group's
  characters.
- R3. Consonants within the split group (e.g. "t" in "white") must still show their
  individual dot/underline mark below the character.
- R4. The fix must work at both `size="word"` (72 px) and `size="story"` (36 px) contexts.
- R5. The fix must not regress the layout of non-split phoneme segments.

## Scope Boundaries

- This fix touches only `storyScreen.css` and `PhonemeMarkedWord.tsx`.
- No changes to data/segment definitions, constants, or any other component.
- Responsive breakpoints and Tailwind classes are unaffected.

## Context & Research

### Relevant Code and Patterns

| File | What to look at |
|------|----------------|
| `robot-reading/src/components/ReadingZone/PhonemeMarkedWord.tsx` | `buildRenderUnits()`, split-group JSX branch (lines 39–74), `SplitCurve` component |
| `robot-reading/src/components/ReadingZone/storyScreen.css` | `.phoneme-split-group`, `.phoneme-split-group > .phoneme-chars`, `.phoneme-split-sub`, `.phoneme-curve-container`, `.phoneme-curve-svg` |
| `robot-reading/src/utils/constants.ts` | `CONSTANTS.phonemeMarks.word` and `.story` — `curveHeight`, `dotSize`, `underlineHeight` |

### Existing Pattern to Follow

Regular (non-split) segments use `display: inline` on `.phoneme-chars` and flow
naturally. The fix aligns the split group to follow the same inline-flow pattern.

## Key Technical Decisions

- **Inline flow for chars, absolute position for curve**: The split group's character row
  changes from `display: flex` to `display: inline` so sub-segments flow as normal
  inline-flex boxes (same model as regular segments). The curve loses its flex-item slot
  and is instead absolutely positioned spanning `left: 0; right: 0` at the bottom of the
  split group. The split group gains explicit `padding-bottom` equal to `dims.curveHeight`
  so the absolutely positioned curve has a pre-reserved slot and does not overlap the text.
  *Rationale*: This is the minimum change that eliminates the blockification while
  preserving the curve's full-width span without requiring JavaScript measurement.

- **`vertical-align: bottom` on `.phoneme-split-sub`**: Once `.phoneme-split-sub` flows
  inline, its column (chars + sub-mark) needs a stable vertical anchor. `vertical-align:
  bottom` aligns the bottom of each sub's inline box (including its sub-mark) to the
  bottom of the line box, which is consistent with how the regular `phoneme-segment` mark
  area sits below the baseline.
  *Rationale*: Prevents individual sub-segments from sitting at slightly different heights
  if their char heights differ.

- **Keep `SplitCurve` SVG unchanged**: The SVG itself draws correctly; only its CSS
  positioning context changes.

## Open Questions

### Resolved During Planning

- *Do all split-digraph words have exactly one `phoneme-curve-container` per split group?*
  Yes — the JSX always appends exactly one curve container after the sub-segments loop.
- *Is the `padding-bottom` approach safe on mobile?* Yes — the split group is always
  `inline-flex`, so padding-bottom is respected and does not create block-level line
  breaks.

### Deferred to Implementation

- Exact sub-pixel `padding-bottom` tuning: the implementer should verify at both `word`
  and `story` sizes that the curve does not clip or overlap the text, and adjust the
  inline style value if needed.
- Check whether `vertical-align: bottom` on `.phoneme-split-sub` aligns with the dot/mark
  positioning for the "t" consonant sub-segment; adjust `vertical-align` value if marks
  appear too high or low.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not
> implementation specification. The implementing agent should treat it as context, not code
> to reproduce.*

### Before (current — causes gap)

```
phoneme-split-group  [inline-flex column, align-items: center]
├── .phoneme-chars   [display: flex row  ← BLOCK-LEVEL, breaks inline flow]
│   ├── .phoneme-split-sub [inline-flex column, BLOCKIFIED → block flex item]
│   │   ├── .phoneme-sub-chars  "i"
│   │   └── .phoneme-mark  (empty)
│   ├── .phoneme-split-sub [block flex item]
│   │   ├── .phoneme-sub-chars  "t"
│   │   └── .phoneme-mark  [dot]
│   └── .phoneme-split-sub [block flex item]
│       ├── .phoneme-sub-chars  "e"
│       └── .phoneme-mark  (empty)
└── .phoneme-curve-container  [flex item, width:100%, height:44px]
    └── <svg> curve
```

### After (proposed — inline flow)

```
phoneme-split-group  [inline-flex column, position: relative,
                       padding-bottom: curveHeight]
└── .phoneme-chars   [display: inline  ← stays inline, no blockification]
    ├── .phoneme-split-sub [inline-flex column, vertical-align: bottom]
    │   ├── .phoneme-sub-chars  "i"  (inline)
    │   └── .phoneme-mark  (empty)
    ├── .phoneme-split-sub [inline-flex column, vertical-align: bottom]
    │   ├── .phoneme-sub-chars  "t"  (inline)
    │   └── .phoneme-mark  [dot]
    └── .phoneme-split-sub [inline-flex column, vertical-align: bottom]
        ├── .phoneme-sub-chars  "e"  (inline)
        └── .phoneme-mark  (empty)

phoneme-curve-container  [position: absolute, left:0, right:0, bottom:0, height:curveHeight]
└── <svg> curve  (spans full width of split group)
```

## Implementation Units

- [ ] **Unit 1: CSS — Switch split-group chars to inline flow and reposition curve**

**Goal:** Eliminate the block-flex chars row and anchor the curve absolutely.

**Requirements:** R1, R2, R3, R4, R5

**Dependencies:** None

**Files:**
- Modify: `robot-reading/src/components/ReadingZone/storyScreen.css`

**Approach:**

In `storyScreen.css`, make the following targeted changes to the split-group rules:

1. `.phoneme-split-group > .phoneme-chars`
   - Remove `display: flex; flex-direction: row; align-items: flex-start`
   - Replace with `display: inline`
   - This restores inline flow so sub-segments are atomic inline-flex boxes, exactly as
     regular `phoneme-segment` chars behave.

2. `.phoneme-split-sub`
   - Keep `display: inline-flex; flex-direction: column; align-items: center`
   - Add `vertical-align: bottom` so the bottom of each sub's column (including sub-mark)
     aligns uniformly with the line box bottom.

3. `.phoneme-curve-container`
   - Add `position: absolute; left: 0; right: 0; bottom: 0`
   - Remove `margin-top: 2px` (no longer relevant — absolute positioning handles offset)
   - Keep `height` (set via inline style in JSX)

4. `.phoneme-split-group` (already has `position: relative` — no change needed there)
   - The padding-bottom that reserves space for the curve is set as an **inline style in
     the JSX** (Unit 2), not in the stylesheet, because it depends on the runtime `dims`
     value.

**Patterns to follow:**
- Regular `.phoneme-chars` rule: `display: inline`
- Regular `.phoneme-segment` mark: static height via inline style

**Test scenarios:**
- Happy path: word "white" renders with visually equal spacing between all adjacent characters ("w","h","i","t","e"), matching the spacing of an unannotated "white"
- Happy path: word "make" (a_e split) renders without gap between "m" and "ake"
- Happy path: word "bike" renders the "i_e" split group without a gap
- Happy path: the U-curve spans the full width from the first to last character of the split group
- Happy path: consonant "t" in "white" shows a dot mark below it, aligned with other marks
- Happy path: `size="story"` words with split digraphs display correctly at the smaller scale
- Edge case: a word whose split group is the entire word (no preceding regular segment) renders without extra leading space
- Edge case: a word with two adjacent split groups (if any exist in the data) renders without gaps
- R5 regression: single, digraph, and trigraph segments in non-split words are visually unchanged

**Verification:**
- Open the app in the ReadingZone word view with phoneme marks ON
- Navigate to a word with a split digraph (e.g. "white", "make", "bike")
- Characters should sit at even spacing — no visual word-break gap
- The U-curve should span from the first to last character of the split group with no clipping
- Letter spacing within the split group should match letter spacing in adjacent segments

---

- [ ] **Unit 2: JSX — Add `padding-bottom` inline style to split-group for curve clearance**

**Goal:** Reserve vertical space below the split group's characters so the absolutely
positioned curve does not overlap or clip the text.

**Requirements:** R2, R4

**Dependencies:** Unit 1 (the absolute positioning from Unit 1 must be in place)

**Files:**
- Modify: `robot-reading/src/components/ReadingZone/PhonemeMarkedWord.tsx`

**Approach:**

In the split-group JSX branch (the `if (unit.type === 'split-group')` block), add a
`paddingBottom` inline style to the outer `phoneme-split-group` span:

```
paddingBottom: dims.curveHeight
```

This uses the existing `dims` object (already in scope) and applies correctly for both
`size="word"` (44 px) and `size="story"` (28 px) without new constants.

Remove the `style={{ height: dims.curveHeight }}` from the curve container span if it
causes the absolute element to take up layout height — verify during implementation.

**Patterns to follow:**
- Other inline styles in the same function: `style={{ height: dims.curveHeight }}`,
  `style={{ width: dims.dotSize, height: dims.dotSize }}`

**Test scenarios:**
- Happy path: the curve renders below the sub-segment marks without overlapping the dot on "t"
- Happy path: at `size="story"` the curve is 28 px tall and still clearly visible below the characters
- Edge case: `showMarks = false` still renders cleanly (this branch is only entered when marks are shown, so no change needed)

**Verification:**
- In both word-view and story-view contexts, the curve should appear below all characters
  and sub-marks, fully visible, with no overlap

## System-Wide Impact

- **Interaction graph:** Only `PhonemeMarkedWord` is modified. It is used in `WordDisplay`,
  `StoryWithRuler`, and `StoryDisplayLightbox`. All three will benefit from the fix without
  any change to their own code.
- **Error propagation:** Pure layout change — no runtime errors introduced.
- **State lifecycle risks:** None — purely presentational.
- **API surface parity:** No API changes.
- **Integration coverage:** The `.word-dim .phoneme-marks { display: none }` rule in
  `storyScreen.css` and the `emphasis="subtle"` path in `PhonemeMarkedWord` are unaffected
  by this change.
- **Unchanged invariants:** Regular (non-split) phoneme segments, dots, underlines, story
  ruler, and lightbox interaction are all unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| The absolutely positioned curve may escape the split group's bounding box on very narrow characters | Use `overflow: visible` (already set on `.phoneme-curve-svg`) and verify at story size |
| `vertical-align: bottom` on sub-segments may shift the baseline of the entire word | Test in story context; if the word's baseline shifts, try `vertical-align: top` or `baseline` instead |
| Safari / WebKit renders inline-flex inside inline differently from Chromium | Test on Safari iOS; the change narrows the surface area to a well-supported inline-flex pattern |

## Sources & References

- Related code: `robot-reading/src/components/ReadingZone/PhonemeMarkedWord.tsx`
- Related code: `robot-reading/src/components/ReadingZone/storyScreen.css`
- Related plan: `docs/plans/2026-03-27-001-feat-visual-phoneme-marking-plan.md`
- CSS Flexbox blockification spec: https://www.w3.org/TR/css-flexbox-1/#item-blockification
