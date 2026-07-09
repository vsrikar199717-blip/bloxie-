---
title: "feat: Add session summary screen with word-level breakdown"
type: feat
status: completed
date: 2026-05-06
origin: docs/brainstorms/2026-05-06-session-summary-screen-requirements.md
---

# feat: Add Session Summary Screen with Word-Level Breakdown

## Overview

Replace the minimal "Amazing job! You read N words!" session-complete screen with a summary showing every word colour-coded by assessment status. Parents can correct mis-taps by tapping words to cycle their status, re-practice struggling words via a micro-session, and explicitly exit to the building zone when ready.

## Problem Frame

When a session ends, parents see only a total word count with no breakdown. They can't review which words the child struggled with, can't correct mis-taps from the fast-paced session, and can't immediately re-practice problem words while the context is fresh. (see origin: docs/brainstorms/2026-05-06-session-summary-screen-requirements.md)

## Requirements Trace

- R1. Session summary replaces the current completion screen when `isSessionComplete` triggers
- R2. Words grouped by status with colour coding: practice (red), support (amber), independent (green), skipped (grey). Empty sections hidden
- R3. Aggregate stats: total words attempted + count per status category
- R4. Mis-tap correction via tap-to-cycle: independent → support → practice → skipped → independent. Updates the WordAttempt record in-place
- R5. "Practice these again" button shown when any word has status `practice` or `skipped`
- R6. Micro-session returns to summary with updated statuses. New attempts appended to wordHistory (originals preserved)
- R7. Explicit "Let's build!" exit button — no auto-switch
- R8. Celebration tone preserved — positive, encouraging feel

## Scope Boundaries

- **Out of scope:** Cross-session history, trend lines (that's the Parent Dashboard)
- **Out of scope:** Changing when wordHistory persists — keep immediate-persist-on-tap
- **Out of scope:** Sound effects or animations on the summary screen
- **Out of scope:** Spaced repetition or smart word selection (idea #4)

## Context & Research

### Relevant Code and Patterns

- **Session completion**: `isSessionComplete` computed in `useSession.ts:210-213` — true when `currentSetIndex >= wordSets.length && !isShowingStory`
- **Current completion UI**: `ReadingZone.tsx:98-106` — simple inline celebration message, the exact insertion point
- **Conditional rendering chain**: ReadingZone uses a priority chain: preBonusBreak → bonusTransition → sessionComplete → story → wordDisplay → loading
- **Component layout pattern**: `h-full flex flex-col p-4 md:p-8` with `flex-1 min-h-0` scrollable content and `flex-shrink-0` action buttons (StoryScreen, WordDisplay)
- **Tab switching**: `SessionScreen` manages `activeTab` state; switching to building is `setActiveTab('building')`. ReadingZone currently has no tab-switching prop
- **Storage updates**: `updateProfile` does shallow merge. Updating a specific `wordHistory` entry requires reading the full array, mapping, and writing back
- **WordAttempt**: Has no `id` field currently — uses `word + setId + timestamp`
- **persistAttempt helper**: `SessionScreen.tsx:242-254` — creates and appends WordAttempt via `onUpdateProfile`

### Institutional Learnings

- **StoryScreen flex/scroll layout fix** (`docs/solutions/ui-bugs/story-screen-layout-flex-scroll-overflow-2026-04-09.md`): Never combine `overflow-y-auto` with `items-center` on the same flex element — use nested div pattern (outer scrolls, inner centers with `min-h-full`). Scrollable content + fixed bottom bar requires `flex-1 min-h-0` on content, `overflow-y-auto` on content, `flex-shrink-0` on bottom bar.

## Key Technical Decisions

- **Add `id` field to WordAttempt** over word+timestamp composite key: `crypto.randomUUID()` provides a reliable, unique identifier for in-place updates. Composite keys are fragile — the same word can appear in multiple sets, and timestamp collisions are theoretically possible with rapid taps. The `id` enables clean array lookups for R4 corrections.

- **Lightweight micro-session via local component state** over reusing the session reducer: The session reducer is tightly coupled to `WordSet` structure (phonicsWords array + bonus word, set-level completion, story transitions). A micro-session only needs to cycle through a flat list of individual words. Using local state in the summary component (`currentPracticeIndex`, `isPracticing`) keeps the implementation simple and avoids fighting the reducer's assumptions. WordDisplay is reused for the actual word presentation.

- **SessionSummary as a new component in ReadingZone's conditional chain** over rendering from SessionScreen: Follows the established pattern (BonusTransition, StoryScreen are all conditionally rendered inside ReadingZone). The summary replaces the current `isSessionComplete` block at `ReadingZone.tsx:98-106`.

- **Session-scoped attempt tracking** via filtering wordHistory by timestamp range: The summary needs to know which words were assessed in *this* session, not all historical attempts. Filter `activeProfile.wordHistory` for entries with timestamps after the session start time. This avoids adding a `sessionId` field — the session start timestamp is a natural boundary.

- **Pass `onSwitchToBuilding` prop** from SessionScreen to ReadingZone: ReadingZone currently has no tab-switching capability. Add a new callback prop that calls `setActiveTab('building')` in SessionScreen. This follows the existing "data down, callbacks up" pattern.

## Open Questions

### Resolved During Planning

- **How to identify WordAttempt records for update**: Add `id: string` field using `crypto.randomUUID()`. Set in `persistAttempt`.
- **How to implement micro-session**: Local state in SessionSummary component. Track `isPracticing` boolean and `practiceWords` array. Reuse WordDisplay for word presentation. When complete, return to summary view with refreshed data.
- **Where SessionSummary lives**: New component at `src/components/ReadingZone/SessionSummary.tsx`, rendered in ReadingZone's conditional chain.
- **How to scope attempts to current session**: Filter wordHistory by timestamp >= session start time. Pass session start timestamp as a prop.

### Deferred to Implementation

- **Exact celebration copy and emoji choices**: The tone should be positive per R8, but exact wording can be decided during implementation
- **Whether micro-session practice words should include "skipped" words**: R5 says yes (practice + skipped), but implementation should verify this feels right in practice

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
Session Flow (existing):
  WordDisplay → ... → last word assessed → isSessionComplete = true

Summary Screen Flow (new):
  isSessionComplete = true
    → SessionSummary renders
    → shows words grouped by status (R2, R3)
    → parent can tap words to cycle status (R4) → updates wordHistory in-place
    → parent can tap "Practice these again" (R5)
        → isPracticing = true
        → WordDisplay renders practice words one at a time
        → each assessment persists new WordAttempt (R6)
        → when done → isPracticing = false → summary re-renders with fresh data
    → parent taps "Let's build!" (R7) → onSwitchToBuilding() → tab switches
```

```
Data flow for tap-to-cycle correction (R4):
  1. Parent taps word chip in summary
  2. Cycle status: independent → support → practice → skipped → independent
  3. Find the WordAttempt by id in activeProfile.wordHistory
  4. Create new array with updated entry
  5. Call onUpdateProfile({ wordHistory: updatedArray })
  6. Local state updates immediately for responsive UI
```

## Implementation Units

- [x] **Unit 1: Add `id` field to WordAttempt**

  **Goal:** Give every WordAttempt a unique identifier for in-place updates

  **Requirements:** R4 (enables correction lookup)

  **Dependencies:** None

  **Files:**
  - Modify: `src/types/profile.ts` — add `id: string` to WordAttempt interface
  - Modify: `src/components/SessionScreen.tsx` — add `id: crypto.randomUUID()` in `persistAttempt`
  - Modify: `src/hooks/useStorage.ts` — add `id` fallback in migration for existing records without IDs

  **Approach:**
  - Add `id: string` as a required field on `WordAttempt`
  - Generate via `crypto.randomUUID()` in `persistAttempt` when creating new attempts
  - In `migrateProfile`, map any existing `wordHistory` entries that lack `id` to add one

  **Patterns to follow:**
  - Existing `migrateProfile` pattern in `useStorage.ts` for backward compatibility
  - `persistAttempt` helper in `SessionScreen.tsx` for the creation site

  **Test scenarios:**
  - New WordAttempt records have a unique `id` field
  - Existing profiles without `id` on wordHistory entries get IDs added during migration
  - IDs are unique across multiple rapid assessments

  **Verification:**
  - App loads without errors with existing localStorage data
  - Each word assessment creates a WordAttempt with a non-empty `id`

---

- [x] **Unit 2: Create SessionSummary component**

  **Goal:** Build the summary screen that displays words grouped by status with aggregate stats

  **Requirements:** R1, R2, R3, R8

  **Dependencies:** Unit 1

  **Files:**
  - Create: `src/components/ReadingZone/SessionSummary.tsx`
  - Modify: `src/components/ReadingZone/ReadingZone.tsx` — replace completion block with SessionSummary

  **Approach:**
  - New component receives: `wordHistory` (filtered to current session), `onSwitchToBuilding`, `onUpdateWordStatus`, `onStartPractice`, `profileName`
  - Derive word groups from the session's wordHistory: filter to latest attempt per word (by timestamp), group by status
  - Four sections ordered: practice (red `bg-red-100`), support (amber `bg-orange-100`), independent (green `bg-green-100`), skipped (grey `bg-gray-100`). Hide empty sections
  - Words displayed as coloured chips/pills within each section
  - Aggregate stats bar at top: "12 words: 7 nailed it, 3 with help, 2 need practice"
  - Celebratory header with emoji (R8): "Amazing job!" or similar, keeping positive tone
  - Layout follows StoryScreen pattern: `h-full flex flex-col p-4 md:p-8`, scrollable content with `flex-1 min-h-0 overflow-y-auto` (nested div for centering per learnings), action buttons in `flex-shrink-0` footer

  **Patterns to follow:**
  - `StoryScreen.tsx` for layout structure and action button placement
  - `WordDisplay.tsx` for responsive button sizing (`text-sm md:text-base`)
  - CLAUDE.md Rule 7 for button touch targets
  - StoryScreen flex/scroll learnings: nested div pattern for scrollable + centered content

  **Test scenarios:**
  - Words correctly grouped into four status sections
  - Empty sections are not rendered
  - Aggregate counts match the actual word statuses
  - Responsive layout works on mobile (375px) and tablet (768px+)

  **Verification:**
  - Session completion shows the summary instead of "Amazing job! You read N words!"
  - All assessed words appear in the correct colour-coded section
  - Stats bar shows accurate counts

---

- [x] **Unit 3: Tap-to-cycle status correction**

  **Goal:** Enable parents to correct mis-taps by tapping a word to cycle its status

  **Requirements:** R4

  **Dependencies:** Unit 1, Unit 2

  **Files:**
  - Modify: `src/components/ReadingZone/SessionSummary.tsx` — add tap handler to word chips
  - Modify: `src/components/ReadingZone/ReadingZone.tsx` — wire `onUpdateWordStatus` callback
  - Modify: `src/components/SessionScreen.tsx` — add handler that updates a specific WordAttempt by `id`

  **Approach:**
  - Define cycle order: `independent → support → practice → skipped → independent`
  - On tap, determine next status from cycle, call `onUpdateWordStatus(attemptId, newStatus)`
  - SessionScreen handler: reads `activeProfile.wordHistory`, maps the entry with matching `id` to new status, calls `onUpdateProfile` with the updated array
  - Local state in SessionSummary also updates immediately so the UI is responsive (optimistic update)
  - Word chip moves to new section and changes colour on tap

  **Patterns to follow:**
  - `persistAttempt` pattern for reading/writing wordHistory via `onUpdateProfile`
  - Colour mapping consistent with WordDisplay button colours: red (`#CD0000`), orange (`#F97316`), green (`#22C55E`), grey (`#9CA3AF`)

  **Test scenarios:**
  - Tapping a green (independent) word changes it to amber (support)
  - Full cycle: independent → support → practice → skipped → independent
  - The corresponding WordAttempt in localStorage wordHistory reflects the new status
  - Aggregate stats update after correction
  - Word moves to the correct section after status change

  **Verification:**
  - Tap a word, see it change colour and move sections
  - Reload app, check wordHistory — the corrected status persists

---

- [x] **Unit 4: "Practice these again" micro-session**

  **Goal:** Let parents start a mini reading session with only practice/skipped words

  **Requirements:** R5, R6

  **Dependencies:** Unit 2, Unit 3

  **Files:**
  - Modify: `src/components/ReadingZone/SessionSummary.tsx` — add practice mode with local state
  - Modify: `src/components/ReadingZone/ReadingZone.tsx` — pass speech and word data props needed for WordDisplay reuse

  **Approach:**
  - "Practice these again" button visible when any word has status `practice` or `skipped`
  - On tap, set local state: `isPracticing = true`, populate `practiceWords` array from current practice/skipped words
  - Render `WordDisplay` for each practice word in sequence, using `practiceWordIndex` local state
  - Each assessment calls the same `onCorrect`/`onSkip` callbacks which persist new WordAttempt records (appended, not replacing originals)
  - When all practice words assessed, set `isPracticing = false` — summary re-renders
  - Summary derives word groups from the *latest* attempt per word (by timestamp), so updated statuses from the micro-session are reflected
  - No parts/objects awarded during micro-session practice (this is remediation, not the main session reward loop)

  **Patterns to follow:**
  - WordDisplay component reuse — same props interface as normal session
  - `persistAttempt` for recording new attempts
  - ReadingZone's prop-passing pattern for speech callbacks (`onSpeak`)

  **Test scenarios:**
  - Button hidden when no practice/skipped words exist
  - Button visible when at least one practice or skipped word exists
  - Micro-session presents only practice/skipped words
  - Each word assessment persists a new WordAttempt (original preserved)
  - After micro-session, summary shows updated statuses based on latest attempts
  - Multiple rounds of practice work (practice → summary → practice again)

  **Verification:**
  - Tap "Practice these again", see only the struggling words
  - Assess each word, return to summary with updated colours
  - Check wordHistory — both original and practice attempts present

---

- [x] **Unit 5: "Let's build!" exit and prop wiring**

  **Goal:** Add explicit exit from summary to building zone

  **Requirements:** R7

  **Dependencies:** Unit 2

  **Files:**
  - Modify: `src/components/ReadingZone/ReadingZone.tsx` — add `onSwitchToBuilding` prop
  - Modify: `src/components/SessionScreen.tsx` — pass `onSwitchToBuilding={() => setActiveTab('building')}` to ReadingZone

  **Approach:**
  - Add `onSwitchToBuilding: () => void` to `ReadingZoneProps`
  - SessionScreen passes `() => setActiveTab('building')` as the callback
  - SessionSummary renders a prominent "Let's build!" button using `ActionButton` component (built-in responsive sizing per CLAUDE.md)
  - Button placed in the `flex-shrink-0` footer area alongside "Practice these again"

  **Patterns to follow:**
  - `ActionButton` component for primary action buttons (CLAUDE.md atomic component rules)
  - Callback prop pattern: data down, callbacks up
  - StoryScreen's footer button placement pattern

  **Test scenarios:**
  - "Let's build!" button is always visible on the summary screen
  - Tapping it switches to the building zone tab
  - On desktop, both zones remain visible (md: layout)

  **Verification:**
  - Tap "Let's build!" on summary, building zone becomes active
  - Works on both mobile (tab switch) and desktop (both visible)

## System-Wide Impact

- **Interaction graph:** SessionScreen → ReadingZone → SessionSummary. New `onSwitchToBuilding` and `onUpdateWordStatus` callbacks flow down. `onUpdateProfile` flows up for wordHistory mutations.
- **State lifecycle risks:** Tap-to-cycle reads `activeProfile.wordHistory` from the current render. Same stale-closure risk as the existing `persistAttempt` pattern (P1 from earlier review). Acceptable for MVP — corrections are low-frequency single taps, not rapid-fire.
- **API surface parity:** No external APIs affected. The `WordAttempt.id` field addition is backward-compatible via migration.
- **Integration coverage:** The micro-session reuses `WordDisplay` which already handles all three assessment buttons and skip. No new button wiring needed inside WordDisplay.

## Risks & Dependencies

- **Risk: WordDisplay prop mismatch in micro-session context**: WordDisplay expects `wordNumber`, `totalWords`, `pattern`, `teachingTip`, `segments` — some of these may not be available when re-presenting individual words outside a WordSet context. Mitigation: pass reasonable defaults (wordNumber=practiceIndex+1, totalWords=practiceWords.length) and skip teaching tip / segments if not available.
- **Risk: "Latest attempt per word" derivation could show wrong status if same word appears in multiple sets**: Mitigation: filter by `setId` as well as `word` when deriving latest status, or use the `id` field to track which specific attempt to show.
- **Dependency:** Unit 1 (WordAttempt `id` field) must land before Unit 3 (tap-to-cycle) can work reliably.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-06-session-summary-screen-requirements.md](docs/brainstorms/2026-05-06-session-summary-screen-requirements.md)
- Related code: `src/components/ReadingZone/ReadingZone.tsx:98-106` (current completion UI)
- Related code: `src/components/ReadingZone/StoryScreen.tsx` (layout pattern)
- Related code: `src/hooks/useSession.ts:210-213` (isSessionComplete)
- Related learnings: `docs/solutions/ui-bugs/story-screen-layout-flex-scroll-overflow-2026-04-09.md`
- Related ideation: `docs/ideation/2026-05-01-word-mastery-tracking-ideation.md` (idea #2)
