---
title: "StoryScreen: bottom bar hidden on small screens & story text clipped on large screens"
date: "2026-04-09"
category: ui-bugs
module: ReadingZone
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Bottom action button bar pushed off-screen and invisible on small/medium screens"
  - "Top portion of long story text permanently unreachable despite scrollbar being present"
  - "Story text same size on all screen sizes — wastes vertical space on mobile"
root_cause: flex_layout_constraint
resolution_type: code_fix
severity: high
related_components:
  - "StoryScreen.tsx"
  - "StoryDisplayLightbox.tsx"
  - "StoryWithRuler.tsx"
tags:
  - flexbox-layout
  - responsive-design
  - overflow-scroll
  - min-h-0
  - flex-shrink
  - story-display
---

# StoryScreen: bottom bar hidden on small screens & story text clipped on large screens

## Problem

Two related layout bugs prevented users from interacting with the StoryScreen on different screen sizes: on small screens the action buttons were pushed off-screen and unreachable, and on large screens with long stories the top portion of the story text was permanently clipped above the scroll boundary.

## Symptoms

**Bug 1 — Bottom bar hidden (small/medium screens):**
- Play, Stop, and Next buttons disappeared below the viewport — users could not progress
- Story text consumed all available space with no scrolling, leaving buttons invisible
- Fixed `text-3xl` (30px) font on mobile caused excessive line wrapping and vertical growth

**Bug 2 — Story top clipped (large screens, long stories):**
- First lines of a long story were permanently above the scrollable area
- Scrollbar appeared but scrolling upward was disabled — content above the vertical midpoint was unreachable
- Only the lower half of long stories could be read

## What Didn't Work

Applying `overflow-y-auto` to the flex-1 story container (the fix for Bug 1) while keeping `items-center justify-center` on the **same element** created Bug 2.

When a flex container has both `align-items: center` and `overflow-y: auto`, content taller than the container overflows **equally above and below** the vertical midpoint. The scrollbar only enables downward scrolling — anything above the center is permanently unreachable. The more vertical space added, the more top content became inaccessible.

## Solution

Five coordinated changes across three files:

### 1 — Split scroll container and centering into nested divs (`StoryScreen.tsx`)

```tsx
/* Before — overflow-y-auto + align-items:center on same element = centering trap */
<div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
  {renderStoryDisplay()}
</div>

/* After — outer scrolls, inner centers */
<div className="flex-1 min-h-0 overflow-y-auto">
  <div className="flex items-center justify-center min-h-full py-2">
    {renderStoryDisplay()}
  </div>
</div>
```

`min-h-full` on the inner div ensures that when the story is short, the inner div fills the full scrollable area and centering works. When the story is long, the inner div grows beyond the container and the outer div scrolls cleanly from the top.

### 2 — Add `flex-shrink-0` to buttons container (`StoryScreen.tsx`)

```tsx
/* Before — buttons could be squashed to zero */
<div className="flex flex-col gap-2 md:gap-4">

/* After — buttons always maintain their natural height */
<div className="flex flex-col gap-2 md:gap-4 flex-shrink-0">
```

### 3 — Add `min-h-0` to the flex-1 story container (`StoryScreen.tsx`)

```tsx
/* Before — flex item cannot shrink below content height */
<div className="flex-1 ...">

/* After — flex item can shrink below content height */
<div className="flex-1 min-h-0 ...">
```

Without `min-h-0`, flex children have an implicit `min-height: auto` which prevents shrinking below the natural content height, causing the story area to overflow and push the buttons off-screen.

### 4 & 5 — Responsive font size in both story display components

**StoryDisplayLightbox.tsx:**
```tsx
/* Before */
className="dyslexia-text text-3xl text-black"

/* After */
className="dyslexia-text text-xl md:text-3xl text-black"
```

**StoryWithRuler.tsx:**
```tsx
/* Before */
className="story-text-ruler dyslexia-text text-3xl text-black"

/* After */
className="story-text-ruler dyslexia-text text-xl md:text-3xl text-black"
```

Scales from 30 px (desktop) down to 20 px (mobile), reducing line wrapping and reclaiming vertical space on small screens. `StoryWithRuler` uses `getComputedStyle` for ruler positioning so it picks up the actual font size automatically.

## Why This Works

**`min-h-0`:** By default flex items have `min-height: auto`, meaning they cannot shrink smaller than their content. Adding `min-h-0` removes this floor and allows the story container to be constrained to the space allocated by flex.

**`flex-shrink-0` on buttons:** Flex distributes shrinking evenly unless told otherwise. Without `flex-shrink-0`, the buttons container shrinks proportionally with the story area, eventually collapsing to zero. With it, all shrinking happens in the story container only (which is safe due to `min-h-0` + `overflow-y-auto`).

**Nested div scroll/center pattern:** The root cause of Bug 2 is a known CSS flex overflow trap. Separating concerns into two elements resolves it cleanly:
- Outer (`overflow-y-auto`): handles all scroll behavior, never applies centering
- Inner (`items-center justify-center min-h-full`): handles all centering, never handles overflow

## Prevention

**Rule: Never combine `overflow-y-auto` with `items-center` on the same flex element.**

```tsx
// ❌ Creates the centering trap — top content unreachable when overflow occurs
<div className="flex-1 overflow-y-auto flex items-center justify-center">
  {content}
</div>

// ✅ Separate scroll and center layers
<div className="flex-1 min-h-0 overflow-y-auto">
  <div className="flex items-center justify-center min-h-full">
    {content}
  </div>
</div>
```

**Rule: Any flex-col layout with a fixed bottom bar needs these three classes.**

```tsx
// Complete pattern for "scrollable content + fixed bottom bar"
<div className="h-full flex flex-col">
  {/* Content area: shrinkable, scrollable */}
  <div className="flex-1 min-h-0 overflow-y-auto">
    <div className="flex items-center justify-center min-h-full">
      {content}
    </div>
  </div>

  {/* Bottom bar: never shrinks */}
  <div className="flex-shrink-0">
    {buttons}
  </div>
</div>
```

**Rule: Never use fixed pixel font sizes in vertically-constrained flex layouts.**

```tsx
// ❌ Fixed size — takes the same space regardless of available height
<span className="text-3xl">{story}</span>

// ✅ Responsive — smaller on mobile saves vertical space
<span className="text-xl md:text-3xl">{story}</span>
```

## Related

- Responsive design plan (context): [`docs/plans/2026-04-07-003-fix-small-screen-content-overflow-plan.md`](../plans/2026-04-07-003-fix-small-screen-content-overflow-plan.md)
- CLAUDE.md Rule 2 & Rule 5: `min-h-0` pattern and overflow-hidden warnings apply here too
