---
title: "fix: Small Screen Content Overflow and Phone Visual Quality"
type: fix
status: completed
date: 2026-04-07
---

# fix: Small Screen Content Overflow and Phone Visual Quality

## Overview

Two related visual problems exist on narrow/short screens:

1. **767 × 771 px overlap** — At 767 px width, the `md` breakpoint (768 px) is not triggered, so
   the stacked layout activates. The left `ReadingAidsToolbar` consumes 64 px of width, leaving
   only ~311 px for word content. A `text-7xl` (72 px) word like "brightest" (9 chars × ~43 px)
   can reach 387 px — wider than the available 311 px. Combined with `ActionButton` at
   `min-h-[60px]` × 3 buttons (196 px fixed), the ReadingZone content overflows its `flex-1`
   allocation into the BuildingZone below, creating visual overlap.

2. **Phone (375 × 667 px) poor visual quality** — Identical root causes, worse severity. Each
   zone is ~333 px tall. Buttons consume at minimum 196 px + outer padding 32 px = 228 px
   (69 % of zone height) before the word even renders. Story mode has the same proportions.

Both problems share three unfixed components from the previous responsive pass:
- `ActionButton` — hard-coded `py-4 min-h-[60px] text-2xl`, not responsive
- `StyledText` word size — hard-coded `text-7xl`, not responsive
- `WordDisplay` inner word container — still has hard-coded `p-8` (separate from the outer padding
  that was fixed in the last plan)

## Problem Frame

The app targets children on family devices (phones and tablets). At < 768 px width (stacked
layout), the ReadingZone is allocated half the viewport height. The content inside must fit
within ~333–385 px of vertical space while also fitting within ~300–375 px of horizontal space
(after the sidebar toolbar). The current large-scale typography and button sizing was designed for
full-height desktop use; it does not adapt.

## Requirements Trace

- R1. At 767 × 771 px, no ReadingZone content overflows into BuildingZone (no visual overlap).
- R2. At 375 × 667 px, all ReadingZone content (word + 3 buttons, or story header + story text + 2
  buttons) is fully visible without scrolling.
- R3. Word text remains large enough to be comfortably read by a child at small sizes (min ~48 px,
  `text-5xl`).
- R4. Touch targets remain accessible (min 44 px height per button).
- R5. All existing layouts at ≥ 768 px are unchanged.

## Scope Boundaries

- `PrivacyNotice`, `WhoIsPlaying`, `ParentMode`, `EditProfile`, `ProfileSetup` — excluded;
  these use scrollable `min-h-screen` card layouts that work on phones.
- `ReadingAidsToolbar` width/button sizing — excluded from this plan; toolbar layout is
  acceptable at current 64 px width.
- `BonusTransition` — excluded; it uses `fixed inset-0` and covers the full viewport correctly.
- `ThemeSelection` — already fixed in plan `2026-04-07-002`.
- No changes to game logic, state, or data.

## Context & Research

### Relevant Code and Patterns

- `src/components/ui/ActionButton.tsx` — `py-4 px-8 min-h-[60px] text-2xl` hard-coded; no
  responsive variants. Used in `WordDisplay`, `StoryScreen`, and `BuildingZone` (End session).
- `src/components/ui/StyledText.tsx` — `sizeClasses.word = 'text-7xl'`,
  `sizeClasses.story = 'text-4xl'`; no responsive variants.
- `src/components/ReadingZone/WordDisplay.tsx` — inner word container still uses bare `p-8`
  (the outer wrapper was fixed to `p-4 md:p-8` in the previous plan, but this inner container
  was missed).
- `src/components/ReadingZone/StoryScreen.tsx` — `gap-4` between action buttons.
- `src/components/ReadingZone/ReadingZone.tsx` — session complete state uses
  `text-6xl`, `text-4xl`, `text-2xl` with no responsive variants.
- `CLAUDE.md` Rule 7: responsive button sizing template: `py-2 px-3 md:py-3 md:px-4 text-base md:text-lg`
- `CLAUDE.md` Rule 4: inner padding template: `p-4 md:p-8`

### Institutional Learnings

- Prior plan `2026-04-07-002` fixed `ActionButton` gaps and outer container padding but left the
  inner word container `p-8` and `ActionButton` sizing itself unchanged — the highest-impact
  omissions.
- `overflow-hidden` must not be placed on zone wrappers (CLAUDE.md Rule 5); the zones currently
  lack it, so overflow is visually apparent rather than silently clipped.

## Key Technical Decisions

- **Fix in `ActionButton` not at call sites**: `ActionButton` is a shared primitive used in
  multiple screens. Fixing the sizing once in the component is cleaner than adding responsive
  classes at every call site. A single source of truth.
- **Fix in `StyledText` sizeClasses, not at call sites**: Same rationale. All `size="word"` uses
  automatically get the responsive treatment.
- **Target sizes**: `text-5xl` (48 px) for word on small screens — large enough for a child to
  read comfortably, small enough to fit within ~311 px width for long words. `text-3xl` (30 px)
  for story text on small screens.
- **Button height floor**: `min-h-[44px]` on small screens — meets the 44 px touch target minimum
  (Apple HIG / Material Design recommendation).
- **Do not change the `md` breakpoint**: Consistent with CLAUDE.md Rule 1. The fixes make content
  robust at any zone height rather than adjusting when the layout switches.

## Open Questions

### Resolved During Planning

- **Should word size scale with viewport width (`clamp()`)?** No — Tailwind breakpoint classes
  are consistent with the project style (CLAUDE.md Rule 1). Clamp would introduce custom CSS.
- **Should `ActionButton` expose size props (sm/lg) instead of hard-coding responsive classes?**
  No — the app only uses one button size concept. Adding a prop adds abstraction for one case.

### Deferred to Implementation

- Verify that `text-5xl` renders long words (e.g., "brightest", "playground") within 311 px at
  implementation time. If any word wraps at `text-5xl`, fall back to `text-4xl`.
- Verify that `StoryDisplayLightbox` story text renders acceptably at `text-3xl` on phone. The
  story text component may need its own internal adjustment if the story container clips.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not
> implementation specification. The implementing agent should treat it as context, not code
> to reproduce.*

```
ReadingZone (flex-1, ~333 px on phone)
├── ReadingAidsToolbar [64 px wide, full height, vertical column]
└── WordDisplay [flex-1, ~311 px wide, flex-col]
    ├── absolute badge (top-right, z-10, no flow impact)
    ├── flex-1 word area
    │     └── word container [p-3 md:p-8]
    │           └── StyledText [text-5xl md:text-7xl]  ← was text-7xl
    └── button area [gap-2 md:gap-4]
          ├── ActionButton Sound it out [py-2 md:py-4, min-h-[44px] md:min-h-[60px], text-lg md:text-2xl]
          └── flex row
                ├── ActionButton Got it   [same]
                └── ActionButton Skip     [same]

Height budget at 333px phone zone:
  outer p-4 top+bottom:  32px  (fixed)
  3 buttons + 2 gaps:   ~152px (44+8+44+8+44 with gap-2=8px)
  ─────────────────────────────
  fixed total:           184px
  word area (flex-1):    149px  ← was ~137px → 64px inner padding left 73px for word
  now inner p-3 top+bot: 24px  → 125px for word → fits text-5xl (48px) ✓
```

## Implementation Units

- [ ] **Unit 1: ActionButton responsive sizing**

**Goal:** Make `ActionButton` smaller on small screens so three buttons fit within ~333–385 px zone
height without overflowing.

**Requirements:** R2, R4, R5

**Dependencies:** None

**Files:**
- Modify: `src/components/ui/ActionButton.tsx`

**Approach:**
- Change `py-4 px-8` to `py-2 px-6 md:py-4 md:px-8`
- Change `min-h-[60px]` to `min-h-[44px] md:min-h-[60px]`
- Change `text-2xl` to `text-lg md:text-2xl`
- All other classes (`w-full`, `rounded-xl`, `font-bold`, color variants) unchanged
- This single change propagates to every ActionButton across all screens

**Patterns to follow:**
- CLAUDE.md Rule 7 button sizing template

**Test scenarios:**
- Happy path: At 375 × 667 px, three ActionButtons in WordDisplay (Sound it out + Got it + Skip)
  are all visible simultaneously within the reading zone, none clipped below the viewport split.
- Happy path: At 1024 px width, buttons render at full size (`text-2xl`, `py-4`) — no regression.
- Edge case: At exactly 768 px (md boundary), buttons switch to large size smoothly.
- Edge case: Each button has at least 44 px height on small screens — tap target not violated.

**Verification:**
- Three action buttons are visible without scrolling in a 333 px reading zone on a phone.
- Desktop button size is visually unchanged.

---

- [ ] **Unit 2: StyledText responsive word and story sizes**

**Goal:** Prevent horizontal text overflow of large words at narrow widths and reduce vertical
pressure in stacked zones.

**Requirements:** R1, R2, R3, R5

**Dependencies:** None (can run parallel to Unit 1)

**Files:**
- Modify: `src/components/ui/StyledText.tsx`

**Approach:**
- Change `sizeClasses.word` from `'text-7xl'` to `'text-5xl md:text-7xl'`
- Change `sizeClasses.story` from `'text-4xl'` to `'text-3xl md:text-4xl'`
- `sizeClasses.button` (`text-2xl`) is handled by Unit 1 at the ActionButton level — leave
  `StyledText.button` unchanged to avoid double-change
- These changes affect only the two active call sites: `WordDisplay` (word mode) and the story
  display components (story mode)

**Patterns to follow:**
- CLAUDE.md Pit 3 (坑 3): `text-3xl md:text-[50px]` pattern for font scaling
- `ThemeSelection.tsx` heading: `text-3xl md:text-[50px]` (same strategy)

**Test scenarios:**
- Happy path: At 375 px width, a 9-character word (e.g., "brightest") renders fully within
  ~311 px available width at `text-5xl` (48 px) — no horizontal overflow.
- Happy path: At 1024 px, word renders at `text-7xl` (72 px) — unchanged from current.
- Edge case: At exactly 768 px, word size transitions from `text-5xl` to `text-7xl` — no layout
  jump that would confuse the child.
- Edge case: A 2-character word (e.g., "at") at `text-5xl` is still clearly legible at ~96 px
  total width — satisfies R3.

**Verification:**
- No horizontal word overflow at 375 px width.
- Story text is readable (30 px = `text-3xl`) in a 333 px story zone with buttons visible.
- Desktop sizes unchanged.

---

- [ ] **Unit 3: WordDisplay inner container padding and button gap**

**Goal:** Remove the remaining hard-coded `p-8` on the word container (missed in previous plan)
and tighten button spacing on small screens.

**Requirements:** R1, R2, R5

**Dependencies:** Unit 1 and Unit 2 (this is the final vertical-budget adjustment; verify fit
with other units in place)

**Files:**
- Modify: `src/components/ReadingZone/WordDisplay.tsx`

**Approach:**
- Inner word container: change `p-8` to `p-3 md:p-8` — this alone frees 40 px (64 px → 24 px)
  of vertical space in the word area
- Action button area: change `gap-4` to `gap-2 md:gap-4` (frees 8 px between the Sound-it-out
  button and the Got-it/Skip row)
- The `flex gap-4` between Got-it and Skip (horizontal row): change to `gap-2 md:gap-4`
- Outer wrapper (`p-4 md:p-8`) was correctly set in the previous plan — do not change

**Patterns to follow:**
- CLAUDE.md Rule 4: `p-X md:p-Y` inner padding template
- Previous fix pattern: `gap-2 md:gap-4` for spacing adjustments

**Test scenarios:**
- Happy path: At 375 × 667 px in word mode, the word sits comfortably centered with visible
  padding around it; no content clips under buttons.
- Edge case: When `isBonus = true`, the bonus styling (`bg-yellow-100 border-4 shadow-lg`) plus
  `p-3` still shows the yellow background clearly — not so tight it loses the visual effect.
- Edge case: When phoneme marks are enabled, the additional vertical space for marks (8 px margin
  set via inline style) fits within the word container at `p-3`.

**Verification:**
- At 375 × 667 px, word is centered with visible padding and buttons are not obscured.
- Bonus word styling still visually distinct.

---

- [ ] **Unit 4: StoryScreen button gaps**

**Goal:** Tighten action button spacing in story mode on small screens (mirrors Unit 3 for
word mode).

**Requirements:** R2, R5

**Dependencies:** Unit 1 (ActionButton sizing reduction)

**Files:**
- Modify: `src/components/ReadingZone/StoryScreen.tsx`

**Approach:**
- Action button container: change `gap-4` to `gap-2 md:gap-4`
- No other changes needed; the outer padding (`p-4 md:p-8`) and header margins (`mb-2 md:mb-4`)
  were already handled in the previous plan

**Patterns to follow:**
- Same `gap-2 md:gap-4` pattern used in Unit 3

**Test scenarios:**
- Happy path: At 375 × 667 px in story mode, the story text area and two action buttons (Play
  story + Next set) are all visible without scrolling in the ~333 px zone.
- Edge case: When `isPlaying = true` (three buttons visible: Play, Stop, Next), all three fit in
  the ~333 px zone with Units 1 + 4 combined (3 × 44 px + 2 × 8 px gaps = 148 px).

**Verification:**
- Story mode shows story text + at least two buttons simultaneously at 375 px width.

---

- [ ] **Unit 5: ReadingZone session complete state responsive text**

**Goal:** Scale down the session complete celebration text on small screens.

**Requirements:** R2, R5

**Dependencies:** None

**Files:**
- Modify: `src/components/ReadingZone/ReadingZone.tsx`

**Approach:**
- Session complete emoji: `text-6xl` → `text-4xl md:text-6xl`
- "Amazing job!" heading: `text-4xl` → `text-2xl md:text-4xl`
- Words count line: `text-2xl` → `text-lg md:text-2xl`
- `mb-4` below emoji: `mb-2 md:mb-4`
- `mb-2` below heading: unchanged (already small)

**Patterns to follow:**
- Same responsive font scaling used in ThemeSelection (`text-3xl md:text-[50px]`)

**Test scenarios:**
- Happy path: At 375 × 667 px, session complete state fits in the ~333 px zone — emoji, heading,
  and words count are all visible without clipping.
- Happy path: At 1024 px, session complete text renders at full size — no regression.

**Verification:**
- Session complete screen is fully visible in the reading zone on a phone without scrolling.

## System-Wide Impact

- **Interaction graph:** `ActionButton` change is purely presentational — all click handlers,
  state, and callbacks are untouched.
- **Error propagation:** None — layout changes only.
- **State lifecycle risks:** None.
- **API surface parity:** None.
- **Integration coverage:** No cross-layer scenarios.
- **Unchanged invariants:** Game logic (word progression, part awarding, session state), drag-
  and-drop mechanics, and desktop layouts (≥ 768 px) are all unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `text-5xl` may still be too wide for very long words (10+ chars) at exactly 767 px | Verify at implementation time; fall back to `text-4xl md:text-7xl` if needed |
| Reducing `ActionButton` size may affect `BuildingZone`'s "End session" button visual weight | Check visually; the button is standalone (not in a tight vertical group), so `py-2 md:py-4` will look fine |
| `p-3` word container may look tight for the bonus word yellow box styling | Verify bonus styling at implementation; bump to `p-4` if the yellow box loses presence |

## Documentation / Operational Notes

- After implementation, update CLAUDE.md: add `ActionButton` and `StyledText` to the list of
  responsive-aware primitives so future developers know not to use hard-coded sizes at call sites.

## Sources & References

- Related plan: `docs/plans/2026-04-07-002-fix-responsive-design-small-screens-plan.md`
- Related code: `src/components/ui/ActionButton.tsx`
- Related code: `src/components/ui/StyledText.tsx`
- Related code: `src/components/ReadingZone/WordDisplay.tsx`
- Related code: `src/components/ReadingZone/StoryScreen.tsx`
- Related code: `src/components/ReadingZone/ReadingZone.tsx`
- `CLAUDE.md` Rules 1, 4, 7 — breakpoint strategy, padding templates, button sizing
