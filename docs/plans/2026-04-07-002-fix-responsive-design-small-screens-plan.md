---
title: "fix: Responsive Design – All Screens Work on Small Displays"
type: fix
status: active
date: 2026-04-07
---

# fix: Responsive Design – All Screens Work on Small Displays

## Overview

Several screens in Robot Delysia App use hard-coded pixel widths, large fixed paddings, and a rigid
side-by-side 55/45 split that breaks or looks poor on phones and small tablets (portrait orientation,
< 768 px wide). This plan makes every screen responsive so the app is usable and visually polished
on all devices from ~360 px (phone) up to desktop.

## Problem Frame

The app is used by children reading on whatever device the family has — often a tablet in portrait
mode or a smartphone. At present:

- `ThemeSelection` has a hard-coded `w-[1011px]` container and three `192 × 250 px` theme cards
  that overflow on any screen narrower than ~700 px.
- `SessionScreen` splits reading and building zones at a fixed 55 % / 45 % horizontal ratio with
  no breakpoint fallback; on a phone both panels become too narrow to interact with.
- `WordDisplay` and `StoryScreen` use `p-8` (32 px) padding on all sides, which wastes most of
  the screen on small devices.
- The `ReadingAidsToolbar` theme-picker popup uses `left-full` absolute positioning and clips off
  the right edge of narrow screens.
- Font sizes in `ThemeSelection` (`text-[50px]`, `text-[30px]`) do not scale down.

## Requirements Trace

- R1. `ThemeSelection` must be usable and visually clean on screens ≥ 360 px wide.
- R2. `SessionScreen` must present the reading zone and building zone usably on small screens
  (portrait phone/tablet), ideally stacked vertically.
- R3. `WordDisplay` and `StoryScreen` must reduce padding on small screens so word and story
  content fills the available space.
- R4. The `ReadingAidsToolbar` theme-picker popup must not clip off-screen on any width.
- R5. No currently-working layout on ≥ 768 px screens must regress.

## Scope Boundaries

- No changes to `PrivacyNotice`, `WhoIsPlaying`, `ParentMode`, or `EditProfile` — these already
  use `max-w-md/lg` card layouts that respond acceptably.
- `ProfileSetup` CSS (`profileSetup.css`) has fixed `24 px` paddings that work on all target
  sizes; no changes needed.
- No changes to game logic, state management, or data.
- No new breakpoints beyond Tailwind's built-in `sm` (640 px) and `md` (768 px).
- Building zone drag-and-drop mechanics are not changed; only layout/sizing adjustments.

## Context & Research

### Relevant Code and Patterns

- `src/components/ThemeSelection/ThemeSelection.tsx` — hard-coded `w-[1011px]`, `px-16 py-14`,
  `text-[50px]`, three `w-[192px] h-[250px]` cards in `flex` row.
- `src/components/SessionScreen.tsx:317-374` — `h-screen flex` with
  `style={{ width: CONSTANTS.layout.readingZoneWidth }}` (55 %) and
  `style={{ width: CONSTANTS.layout.buildingZoneWidth }}` (45 %).
- `src/utils/constants.ts:17-19` — `readingZoneWidth: '55%'`, `buildingZoneWidth: '45%'`.
- `src/components/ReadingZone/WordDisplay.tsx:46` — `p-8` on outer wrapper; word font size
  comes from `StyledText` with `4.5rem` (see `constants.ts:typography.wordFontSize`).
- `src/components/ReadingZone/StoryScreen.tsx:86` — `p-8` outer wrapper.
- `src/components/ReadingZone/ReadingAidsToolbar.tsx:104` — theme-picker popup:
  `absolute left-full top-0 ml-2` (renders to the right of the toolbar).
- `src/components/ReadingZone/storyScreen.css` — `.reading-aids-toolbar` and `.toolbar-btn`
  (width `4rem`, no responsive variant).
- `src/components/ui/StyledText.tsx` — typography sizing to investigate for responsive font.
- `src/components/BuildingZone/BuildingZone.tsx:209` — `h-full flex flex-col p-4`; inner layout
  has build area + tray side-by-side (`flex-1 flex gap-2`).

### Institutional Learnings

- None in `docs/solutions/` specifically about responsive layout.

## Key Technical Decisions

- **Breakpoint**: Use `md` (768 px) as the single main breakpoint. Below `md` = "small screen"
  (stacked/compact), at or above = current layout. This avoids adding a custom breakpoint.
- **SessionScreen stacking**: On small screens, switch from `flex-row` to `flex-col` with
  approximately 50 % height each for reading and building zones. This keeps both zones always
  visible without tabs or hidden panels.
- **ThemeSelection cards**: Switch the three-card flex row to a centered column on `< md`. Cards
  become horizontally compact (full-width with a max-width cap) rather than 192 px squares.
- **Font scaling**: Use Tailwind responsive font utilities (`text-3xl md:text-[50px]`) directly
  in JSX rather than modifying `CONSTANTS` — keeps the constant file clean and avoids runtime
  calculation.
- **Toolbar theme picker**: On narrow screens, render the popup above the button (`bottom-full
  mb-2`) instead of to the right (`left-full`). Use a conditional class based on a Tailwind
  `md:` prefix or a `window.innerWidth` check at popup-open time. Prefer pure CSS/Tailwind
  over a JS check for this.
- **Padding reduction**: Replace flat `p-8` with `p-4 md:p-8` (or `p-3 sm:p-6 md:p-8` where
  very tight) in WordDisplay and StoryScreen.

## Open Questions

### Resolved During Planning

- **Should the session zones be tabbed (one visible at a time) or stacked (both visible)?**
  Resolution: Stacked — both zones are always visible. This preserves the mental model of the
  app (build while reading) and avoids hiding state or requiring the child to switch tabs.
- **Should font sizes use `clamp()` CSS or Tailwind breakpoint classes?**
  Resolution: Tailwind breakpoint classes only — consistent with existing code style and no
  additional CSS complexity.

### Deferred to Implementation

- Exact height split percentages for stacked session zones on small screens (50/50 may need
  tweaking once seen in a real device viewport; `50vh` and `flex-1` may both be valid).
- Whether `StyledText` word font size (`4.5rem`) needs a responsive variant — verify visually
  at implementation time; may not be an issue if horizontal space is reclaimed via padding fixes.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not
> implementation specification. The implementing agent should treat it as context, not code
> to reproduce.*

```
Screen width < 768px (md)           Screen width ≥ 768px (md)
─────────────────────────────        ───────────────────────────────────
ThemeSelection:                      ThemeSelection:
  ┌──────────────────────┐             ┌──────────────────────────────┐
  │  Hey Child!!         │             │  Hey Child!!                 │
  │  What to build?      │             │  What to build?              │
  │                      │             │  ┌──────┐ ┌──────┐ ┌──────┐ │
  │  ┌────────────────┐  │             │  │Robot │ │Myst. │ │Monst.│ │
  │  │    Robot       │  │             │  └──────┘ └──────┘ └──────┘ │
  │  └────────────────┘  │             └──────────────────────────────┘
  │  ┌────────────────┐  │
  │  │    Mystical    │  │           SessionScreen:
  │  └────────────────┘  │             ┌─────────────┬─────────────┐
  │  ┌────────────────┐  │             │ ReadingZone │ BuildingZone│
  │  │    Monster     │  │             │   (55%)     │   (45%)     │
  │  └────────────────┘  │             └─────────────┴─────────────┘
  └──────────────────────┘

SessionScreen:
  ┌──────────────────────┐
  │   ReadingZone (50%)  │
  ├──────────────────────┤
  │  BuildingZone (50%)  │
  └──────────────────────┘
```

## Implementation Units

- [ ] **Unit 1: ThemeSelection responsive layout**

**Goal:** Make ThemeSelection look polished on screens from 360 px to desktop.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `src/components/ThemeSelection/ThemeSelection.tsx`

**Approach:**
- Replace `w-[1011px] max-w-[95vw] px-16 py-14` with responsive variants:
  `w-full max-w-[95vw] md:w-[1011px] px-6 py-8 md:px-16 md:py-14`
- Replace the `flex justify-center gap-8` card row with `flex flex-col md:flex-row items-center
  justify-center gap-6 md:gap-8`
- Each theme card: replace `w-[192px]` with `w-full max-w-[280px] md:w-[192px]`; replace
  `h-[250px]` with `h-[160px] md:h-[250px]`
- Replace `text-[50px]` title with `text-3xl md:text-[50px]` (approx 30 px → 50 px)
- Replace `text-[30px]` card labels with `text-xl md:text-[30px]`
- Image inside card: reduce from `w-[150px] h-[150px]` to `w-[90px] h-[90px] md:w-[150px]
  md:h-[150px]` for small card height

**Patterns to follow:**
- Tailwind responsive utilities already used in `WhoIsPlaying.tsx` and `PrivacyNotice.tsx`

**Test scenarios:**
- Happy path: On a 375 px wide viewport, all three cards render vertically stacked, no
  horizontal scroll, each card occupies ≤ 95 vw width.
- Happy path: On a 1024 px wide viewport, all three cards render side-by-side, matching
  the original layout.
- Edge case: Very long child name (e.g., "Bartholomew") does not cause header text overflow
  at small width.

**Verification:**
- No horizontal scrollbar at 375 px width.
- Theme cards are tappable (min height adequate for touch).
- Desktop layout unchanged.

---

- [ ] **Unit 2: SessionScreen stacked layout on small screens**

**Goal:** On screens < 768 px, stack ReadingZone above BuildingZone (each taking roughly half
the viewport height) instead of the current fixed 55/45 horizontal split.

**Requirements:** R2, R5

**Dependencies:** None

**Files:**
- Modify: `src/components/SessionScreen.tsx`

**Approach:**
- Replace `<div className="h-screen flex">` wrapper with `<div className="h-screen flex
  flex-col md:flex-row">`.
- Replace the `style={{ width: CONSTANTS.layout.readingZoneWidth }}` inline style on the
  ReadingZone wrapper with a combined approach: keep the inline style for `md` and above, use
  a responsive class for small screens. Cleanest solution: replace inline `style` with Tailwind
  classes: `className="h-1/2 md:h-full md:w-[55%] overflow-hidden"` for ReadingZone,
  `className="h-1/2 md:h-full md:w-[45%] overflow-hidden"` for BuildingZone.
- Remove `CONSTANTS.layout.readingZoneWidth / buildingZoneWidth` from `SessionScreen` inline
  styles (the constant can remain for reference but need not be used for layout).
- The divider (`<div className="w-0.5 bg-gray-300" />`) should become `hidden md:block` so it
  only shows on wide screens (add a horizontal rule `block md:hidden` if a separator is needed).

**Patterns to follow:**
- `h-screen flex flex-col md:flex-row` is a standard Tailwind responsive stacking pattern.

**Test scenarios:**
- Happy path: On 375 px wide viewport, ReadingZone occupies the top half of screen, BuildingZone
  the bottom half; both are scrollable/usable.
- Happy path: On 1024 px wide viewport, layout is unchanged (side-by-side).
- Edge case: When `PartControlBar` appears in BuildingZone, bottom half does not expand beyond
  its allocated height; content scrolls or is clipped rather than pushing the ReadingZone up.

**Verification:**
- Both zones visible without scrolling the page on a 375 px viewport (portrait phone).
- Desktop side-by-side layout unchanged.
- The gear icon / settings cog within ReadingAidsToolbar remains accessible.

---

- [ ] **Unit 3: WordDisplay and StoryScreen padding on small screens**

**Goal:** Reduce the large `p-8` padding in WordDisplay and StoryScreen on small screens so
reading content has more room.

**Requirements:** R3, R5

**Dependencies:** Unit 2 (stacked layout means reading zone is shorter on small screens, so
padding reduction matters more)

**Files:**
- Modify: `src/components/ReadingZone/WordDisplay.tsx`
- Modify: `src/components/ReadingZone/StoryScreen.tsx`

**Approach:**
- In `WordDisplay.tsx`: Replace `className="relative flex flex-col h-full p-8"` with
  `p-4 md:p-8`.
- In `StoryScreen.tsx`: Replace `className="h-full flex flex-col p-8"` with `p-4 md:p-8`.
- In `StoryScreen.tsx` header section: reduce `mb-4` emoji/title spacing if needed
  (`mb-2 md:mb-4`).
- Teaching tip absolute corner: `top-4 right-4` is fine; verify on small screen that it
  doesn't overlap the word at implementation time and adjust if needed.

**Patterns to follow:**
- `p-4 md:p-8` pattern mirrors the approach taken in `PrivacyNotice.tsx` (`p-6`).

**Test scenarios:**
- Happy path: On 375 px wide viewport in portrait, a 5-letter word is fully visible in the
  reading zone without the action buttons being pushed off screen.
- Happy path: On 375 px wide viewport, story text area has sufficient space to display 2-3
  lines at story font size.
- Edge case: Teaching tip badge does not overlap the word display at narrow widths.

**Verification:**
- Word and action buttons visible simultaneously in the reading zone on a 375 px portrait device.
- No regression at 1024 px — padding returns to `p-8`.

---

- [ ] **Unit 4: ReadingAidsToolbar theme-picker popup positioning**

**Goal:** Prevent the theme-picker popup from rendering off-screen on narrow viewports.

**Requirements:** R4, R5

**Dependencies:** Unit 2 (toolbar is within the reading zone, whose width changes at `md`)

**Files:**
- Modify: `src/components/ReadingZone/ReadingAidsToolbar.tsx`

**Approach:**
- The current popup uses `absolute left-full top-0 ml-2` (renders to the right of the toolbar).
  On small screens this overflows the viewport because the toolbar is flush with the left edge.
- Change the popup container to render below the button on small screens: replace
  `left-full top-0 ml-2` with `left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-2`.
  This makes the popup appear below the theme button on small screens and to the right on large.
- Ensure `minWidth: '140px'` is retained.
- No JS window-width check needed — pure Tailwind.

**Patterns to follow:**
- Tailwind `md:` prefix for layout position switching, as used in `ThemeSelection`.

**Test scenarios:**
- Happy path: On 375 px wide viewport, clicking the theme button opens a popup below it, fully
  visible within the screen bounds.
- Happy path: On 1024 px wide viewport, popup still appears to the right of the toolbar button
  (original behaviour).
- Edge case: When the reading zone is in story mode and the toolbar is visible, the popup does
  not overlap story text in a way that blocks reading.

**Verification:**
- Popup fully visible without horizontal scroll on a 375 px viewport.
- Popup closes when clicking outside (existing logic unchanged).
- Desktop behaviour unchanged.

---

- [ ] **Unit 5: BuildingZone layout adjustments for small-screen height constraints**

**Goal:** When the building zone is half the viewport height (≈ 50 vh on a phone), ensure the
parts tray, build area, control bar, and action buttons all remain usable and do not overflow.

**Requirements:** R2, R5

**Dependencies:** Unit 2

**Files:**
- Modify: `src/components/BuildingZone/BuildingZone.tsx`

**Approach:**
- Reduce outer padding: `p-4` → `p-2 md:p-4` to reclaim vertical space.
- Reduce utility bar bottom margin: `mb-2` stays (already small).
- Reduce the dance/photo button padding: `py-3 px-4` → `py-2 px-3 md:py-3 md:px-4` and
  font size: `text-lg` → `text-base md:text-lg`.
- The `PartsTray` width: check if it has a fixed width that becomes too wide or narrow (review
  `PartsTray.tsx` at implementation time).
- The empty-state text `text-lg` in the build area can become `text-sm md:text-lg`.
- Finish button uses `ActionButton` — the `mt-3` margin can become `mt-1 md:mt-3`.

**Patterns to follow:**
- Same `p-X md:p-Y` pattern used in other units.

**Test scenarios:**
- Happy path: On a 375 × 667 px phone (portrait), the building zone at 50 % height shows the
  parts tray, at least the top of the build area, and the "End session" button without scrolling.
- Edge case: When `PartControlBar` is visible (part selected), build area + tray + control bar
  + finish button all fit in the 50 vh zone on a 667 px height screen.
- Edge case: When 3+ parts are placed and the dance/photo buttons appear, the zone is still
  scrollable or the content does not push the finish button off screen.

**Verification:**
- "End session" button always reachable on a 375 × 667 px phone in the stacked layout.
- Desktop building zone layout unchanged.

## System-Wide Impact

- **Interaction graph:** Changes are purely presentational (CSS/Tailwind classes). No callbacks,
  hooks, or state management are affected.
- **Error propagation:** None — layout changes carry no failure modes.
- **State lifecycle risks:** None.
- **API surface parity:** None.
- **Integration coverage:** No cross-layer test scenarios required.
- **Unchanged invariants:** All game logic (word progression, part awarding, drag-and-drop,
  sound, screenshot) is untouched. The `CONSTANTS.layout` values can remain as documentation
  even if no longer used for inline styles in `SessionScreen`.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Stacked session zones on very short phones (e.g. 568 px height) may still feel cramped | Each zone is independently scrollable (`overflow-y-auto` if needed); verify on 568 px at implementation time |
| `PartsTray` has its own sizing logic not fully reviewed in this plan | Review `PartsTray.tsx` in Unit 5; add responsive adjustments if its width is hard-coded |
| Tailwind `h-1/2` on the session zones may fight with `flex-1` behaviour inside ReadingZone/BuildingZone | Use `min-h-0` on children if flex children overflow; already partially in place in `BuildingZone.tsx:232` |
| ThemeSelection card height reduction (160 px) may clip the card image on some devices | Adjust `h-[160px]` → `h-auto min-h-[140px]` if overflow issues arise at implementation |

## Sources & References

- Related code: `src/components/ThemeSelection/ThemeSelection.tsx`
- Related code: `src/components/SessionScreen.tsx`
- Related code: `src/components/ReadingZone/WordDisplay.tsx`
- Related code: `src/components/ReadingZone/StoryScreen.tsx`
- Related code: `src/components/ReadingZone/ReadingAidsToolbar.tsx`
- Related code: `src/components/BuildingZone/BuildingZone.tsx`
- Related code: `src/utils/constants.ts`
