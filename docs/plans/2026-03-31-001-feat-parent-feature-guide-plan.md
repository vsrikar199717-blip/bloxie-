---
title: "feat: Add parent feature guide walkthrough and help button"
type: feat
status: active
date: 2026-03-31
origin: docs/brainstorms/2026-03-31-parent-feature-guide-requirements.md
---

# feat: Add parent feature guide walkthrough and help button

## Overview

Add a parent-facing feature guide that teaches parents what the app's features do. Two entry points: a swipeable card walkthrough shown once per profile before their first session, and a help button in the reading aids toolbar that opens the same content as a modal.

## Problem Frame

Parents sit with their child during reading sessions but have no way to learn what features like Ruler, Lightbox, Marks, Skip, or Sound It Out do. Without understanding these tools, parents can't help their child get the most out of the app. (see origin: docs/brainstorms/2026-03-31-parent-feature-guide-requirements.md)

## Requirements Trace

- R1. Pre-session swipeable card walkthrough, shown once per profile, skippable
- R2. Help button in the reading aids toolbar that opens the guide as a modal overlay
- R3. Guide content covers 4 topic groups: Reading Tools, Helping Your Child, Building Zone, Settings
- R4. Warm and encouraging tone, scannable
- R5. Shared content between walkthrough and modal (one source of truth)

## Scope Boundaries

- No animated illustrations or screenshots within the guide — text and icons only
- No in-context coach marks or tooltips pointing at specific UI elements
- No changes to the existing TeachingTipBadge component
- No feature education for the Settings/Parent Mode screens
- No settings gear on the walkthrough screen (brief one-time screen; avoids state machine complexity)

## Context & Research

### Relevant Code and Patterns

- `src/types/profile.ts` — `ChildProfile` interface; add boolean fields here with migration defaults
- `src/hooks/useStorage.ts` — `migrateProfile` function (lines 47-79) shows pattern for defaulting new fields via nullish coalescing
- `src/App.tsx` — `Screen` union type (lines 12-19) and `handleSelectTheme` (lines 76-82) are the insertion points
- `src/components/ReadingZone/BonusTransition.tsx` — Existing full-screen overlay pattern (`fixed inset-0`, z-index 10000, tap to dismiss)
- `src/components/ui/TeachingTipBadge.tsx` — Existing backdrop pattern for closeable popovers
- `src/components/ReadingZone/ReadingAidsToolbar.tsx` — Toolbar button pattern (`.toolbar-btn` class, icon + label)
- `src/components/ReadingZone/storyScreen.css` — Toolbar CSS classes

### Institutional Learnings

- Avoid `position: absolute` with manual coordinate calculations for overlays that interact with text — prefer relative positioning within shared containers (from phoneme mark alignment fix)

## Key Technical Decisions

- **Per-profile flag on `ChildProfile`**: Add `hasSeenParentGuide: boolean` to the profile type. Follows the existing pattern for `visualPhonemeMarking`. Migration defaults to `false` so existing users see the walkthrough once (it's short and skippable).
- **No settings gear on walkthrough screen**: Avoids updating `handleBackFromSettings` to handle `'parent-guide'` as a return target. The walkthrough is brief enough that settings access can wait.
- **Self-contained overlay for modal, not a reusable Modal component**: Only one modal use case exists. Building a generic Modal would be premature abstraction. Follow the `BonusTransition` pattern.
- **CSS touch-swipe for cards, no library**: The app has no swipe/carousel dependency. A simple touch-based horizontal swipe with CSS transitions is sufficient for 4 cards. Keeps the bundle small.
- **Skip sets `hasSeenParentGuide = true`**: The toolbar help button provides re-entry to the content. No need to nag users who skip.
- **Opening settings closes the help modal**: If the modal is open and the user taps the settings gear, the modal closes. When returning from settings, the session resumes normally without a stale modal.
- **Split `handleSelectTheme`**: Set the theme first, then conditionally navigate to `'parent-guide'` (if `!hasSeenParentGuide`) or `'session'` (if already seen). A new `handleGuideComplete` handler marks the flag and navigates to `'session'`.

## Open Questions

### Resolved During Planning

- **Migration default for existing profiles**: Default `hasSeenParentGuide` to `false`. The walkthrough is short, skippable, and valuable for existing parents who haven't seen it.
- **Modal/overlay approach**: Follow the `BonusTransition` self-contained overlay pattern. No reusable Modal needed.
- **Settings gear on walkthrough**: Omitted. Avoids state machine complexity for a brief screen.
- **Help modal + settings interaction**: Opening settings closes the modal. The modal's open state resets when leaving the session screen.

### Deferred to Implementation

- Exact card copy wording — draft during implementation, guided by R4 tone requirements
- Touch swipe thresholds and animation timing — tune during implementation based on feel

## Implementation Units

- [ ] **Unit 1: Add `hasSeenParentGuide` to profile type and storage**

**Goal:** Enable per-profile tracking of whether the parent has seen the feature guide.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `src/types/profile.ts`
- Modify: `src/hooks/useStorage.ts`

**Approach:**
- Add `hasSeenParentGuide: boolean` to the `ChildProfile` interface
- Default to `false` in `getDefaultProfileValues`
- Add migration line in `migrateProfile`: `hasSeenParentGuide: profile.hasSeenParentGuide ?? false`
- Add a `markGuideAsSeen(profileId: string)` helper in `useStorage` that calls `updateProfile(id, { hasSeenParentGuide: true })`

**Patterns to follow:**
- `visualPhonemeMarking` field addition pattern in `types/profile.ts` and `useStorage.ts`

**Test scenarios:**
- Existing profile loaded from localStorage without `hasSeenParentGuide` gets `false` after migration
- New profile created has `hasSeenParentGuide: false`
- Calling `markGuideAsSeen` sets the flag to `true` and persists to localStorage

**Verification:**
- Profile type includes the new field, storage migrates cleanly, flag can be toggled

---

- [ ] **Unit 2: Create shared guide content component**

**Goal:** Build the guide card content as a reusable component that renders in both walkthrough and modal contexts.

**Requirements:** R3, R4, R5

**Dependencies:** None (can run in parallel with Unit 1)

**Files:**
- Create: `src/components/ParentGuide/GuideContent.tsx`
- Create: `src/components/ParentGuide/parentGuide.css`

**Approach:**
- Create a `GuideContent` component that renders 4 cards, each with an icon area, title, and short descriptive text
- Cards are: "Reading Tools" (Ruler, Lightbox, Marks), "Helping Your Child" (Tips for Grownups, Sound It Out, Skip), "Building Zone" (Switch theme, Start again), "Settings" (Phonics phases)
- Component accepts a `mode` prop: `'walkthrough'` (full-screen swipeable) or `'modal'` (overlay)
- In walkthrough mode: horizontal swipe navigation with dot indicators, "Skip" button, "Next"/"Done" buttons
- In modal mode: same card content with swipe navigation, "Close" button instead of "Skip"
- Touch swipe: track `touchstart`/`touchmove`/`touchend` X delta, threshold ~50px to trigger card transition. CSS `transform: translateX()` with `transition` for smooth slide
- Tone: warm, encouraging, short sentences per R4

**Patterns to follow:**
- CSS approach: co-located plain CSS file (like `storyScreen.css`) for card layout and transitions
- Tailwind utilities for spacing, colors, typography
- Functional component with named export

**Test scenarios:**
- All 4 cards render with correct content
- Swipe left advances to next card, swipe right goes back
- First card has no back navigation, last card shows "Done"/"Close"
- Dot indicators reflect current card position
- Skip button (walkthrough mode) and Close button (modal mode) render correctly

**Verification:**
- Component renders in both modes with correct content and navigation

---

- [ ] **Unit 3: Add walkthrough screen to app routing**

**Goal:** Insert the parent guide walkthrough into the screen flow between theme selection and the first session.

**Requirements:** R1

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/ParentGuide/ParentGuideScreen.tsx`

**Approach:**
- Add `'parent-guide'` to the `Screen` union type
- Split `handleSelectTheme`: set theme on profile, then check `hasSeenParentGuide`. If `false`, navigate to `'parent-guide'`. If `true`, navigate to `'session'`
- Create `ParentGuideScreen` wrapper that renders `GuideContent` in walkthrough mode with the yellow background (matching theme selection's `bg-[#FFFFCC]`)
- Add `handleGuideComplete` handler: calls `markGuideAsSeen(profileId)`, then `setCurrentScreen('session')`
- Wire the "Skip" action to the same `handleGuideComplete` handler (skip = seen)
- No SettingsCog on this screen

**Patterns to follow:**
- Screen rendering pattern in `App.tsx` (conditional render based on `currentScreen`)
- `ThemeSelection` component structure for the screen wrapper

**Test scenarios:**
- First session for a new profile: theme selection → parent guide → session
- Second session for same profile: theme selection → session (walkthrough skipped)
- Skipping the walkthrough: navigates to session, flag is set to `true`
- Completing all cards: navigates to session, flag is set to `true`
- Different profiles: each sees the walkthrough independently

**Verification:**
- New profiles see the walkthrough once. Returning profiles skip it. The theme is correctly set before the session loads.

---

- [ ] **Unit 4: Add help button to toolbar with modal overlay**

**Goal:** Give parents access to the feature guide at any point during a session via the reading aids toolbar.

**Requirements:** R2, R5

**Dependencies:** Unit 2

**Files:**
- Modify: `src/components/ReadingZone/ReadingAidsToolbar.tsx`
- Modify: `src/components/ReadingZone/ReadingZone.tsx`
- Modify: `src/components/SessionScreen.tsx`
- Modify: `src/components/ReadingZone/storyScreen.css`

**Approach:**
- Add a help button to the toolbar, positioned between the last reading aid button (Marks) and the `<div className="flex-1" />` spacer. Uses the `toolbar-btn toolbar-btn-inactive` classes with a `?` or `i` icon and "Help" label
- Add `showGuideModal` boolean state in `SessionScreen`. Pass `onOpenGuide` and `onCloseGuide` callbacks down through `ReadingZone` to `ReadingAidsToolbar`
- When the help button is tapped, set `showGuideModal = true` in `SessionScreen`
- Render `GuideContent` in modal mode as a `fixed inset-0` overlay with a semi-transparent backdrop, high z-index (following `BonusTransition` pattern), inside `SessionScreen`
- Close the modal when: user taps "Close", user taps backdrop, or user opens settings (reset `showGuideModal` to `false` when `onOpenSettings` fires)

**Patterns to follow:**
- Toolbar button: `.toolbar-btn` class with icon span and label span
- Overlay: `BonusTransition` pattern (`fixed inset-0`, `z-[10000]`)
- Prop threading: `ReadingZone` → `ReadingAidsToolbar` callback pattern (same as `onOpenSettings`)

**Test scenarios:**
- Help button appears in the toolbar between Marks and the spacer
- Tapping help opens the guide modal over the session
- Modal shows all 4 cards with swipe navigation
- Tapping Close or backdrop dismisses the modal
- Opening settings while modal is open closes the modal first
- Returning from settings: modal is not still open

**Verification:**
- Help button is accessible during any session. Modal opens and closes cleanly without disrupting session state.

## System-Wide Impact

- **Interaction graph:** `App.tsx` gains a new screen transition and handler. `SessionScreen` gains modal state that must reset on settings navigation. `ReadingZone` and `ReadingAidsToolbar` gain a new callback prop.
- **Error propagation:** No new error paths — all changes are UI state management.
- **State lifecycle risks:** The help modal's open state lives in `SessionScreen`, which stays mounted during settings navigation. The `onOpenSettings` handler must close the modal to prevent stale overlay state.
- **API surface parity:** No API. No other interfaces affected.
- **Integration coverage:** The key integration scenario is the walkthrough-to-session transition — the theme must be set before session loads, and `hasSeenParentGuide` must be persisted before navigating away.

## Risks & Dependencies

- **Touch swipe implementation**: Hand-rolling swipe without a library may feel rough on first pass. Mitigated by keeping the interaction simple (4 cards, horizontal only) and tuning thresholds during implementation.
- **Toolbar space**: Adding a 5th button to the vertical toolbar may crowd the sidebar on shorter screens. Mitigated by the existing `flex-1` spacer which pushes Settings to the bottom — the help button sits with the other aids at the top.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-03-31-parent-feature-guide-requirements.md](docs/brainstorms/2026-03-31-parent-feature-guide-requirements.md)
- Related code: `src/components/ReadingZone/BonusTransition.tsx` (overlay pattern)
- Related code: `src/hooks/useStorage.ts` (profile migration pattern)
- Related code: `src/components/ReadingZone/ReadingAidsToolbar.tsx` (toolbar button pattern)
