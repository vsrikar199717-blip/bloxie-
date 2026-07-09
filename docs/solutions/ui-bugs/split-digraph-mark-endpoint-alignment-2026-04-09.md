---
title: "Split-digraph phoneme marks: letters misaligned and curve endpoints don't match consonant dots"
date: "2026-04-09"
category: ui-bugs
module: ReadingZone
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Characters inside split-group (e.g. 'ite' in 'white') sit at a different vertical height than adjacent regular segments"
  - "U-curve endpoints sit at a different Y level than consonant dots in the same word"
  - "Visible baseline shift in split-digraph words like 'white', 'make', 'bike'"
root_cause: dimension_mismatch
resolution_type: code_fix
severity: medium
related_components:
  - "PhonemeMarkedWord.tsx"
  - "storyScreen.css"
tags:
  - split-digraph
  - phoneme-marks
  - svg-curve
  - vertical-alignment
  - css-dimensions
  - dyslexia-text
---

# Split-digraph phoneme marks: letters misaligned and curve endpoints don't match consonant dots

## Problem

Split-digraph words (e.g., "white", "make", "bike") rendered with phoneme marks displayed two visual alignment bugs: characters inside the split group sat at a different baseline than adjacent regular segments, and the U-shaped curve's endpoints were vertically offset from the consonant dots in the same word.

## Symptoms

1. **Letter misalignment** — in words like "white", the segment "wh" and the split group "ite" appeared on different vertical levels; "ite" floated upward relative to "wh".
2. **Curve endpoint mismatch** — the U-curve's left and right tips sat ~12 px below the consonant dots (e.g., the dot under "t" in "white"), breaking the visual illusion that the curve frames a single phoneme unit.

## What Didn't Work

A prior refactor (plan `2026-04-09-005`) had already converted `.phoneme-split-group > .phoneme-chars` from `display: flex` to `display: inline`, eliminating the block-level gap between segments. That solved the horizontal gap but left the two vertical misalignments described above, because the CSS `vertical-align` anchor and mark-height constants were still inconsistent.

## Solution

Four targeted changes:

### 1 — Fix vertical-align on `.phoneme-split-sub` (`storyScreen.css` ~line 258)

```css
/* Before */
.phoneme-split-sub {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: bottom;   /* ← anchors column BOTTOM to line-box bottom → chars shift up */
}

/* After */
.phoneme-split-sub {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: baseline; /* ← aligns text baseline with the word's baseline */
}
```

### 2 — Remove `paddingBottom` from split group (`PhonemeMarkedWord.tsx` ~line 43)

```tsx
/* Before */
<span className="phoneme-segment phoneme-split-group"
      style={{ paddingBottom: dims.curveHeight }}>

/* After */
<span className="phoneme-segment phoneme-split-group">
```

### 3 — Unify sub-segment mark height (`PhonemeMarkedWord.tsx` ~line 52)

```tsx
/* Before — 10 px (word) / 6 px (story) */
<span className="phoneme-mark" style={{ height: dims.dotSize + 4 }}>

/* After — 44 px (word) / 28 px (story), same as regular segments */
<span className="phoneme-mark" style={{ height: dims.curveHeight }}>
```

### 4 — Reposition SVG curve endpoints (`PhonemeMarkedWord.tsx`, `SplitCurve` ~line 192)

```tsx
/* Before — endpoints at y=2 (near top of 44 px padding zone, above dots) */
const startY = 2;
const controlY = vh + 4;

/* After — endpoints at dot-center level; control point deeper for visible U */
const startY = vh / 2;      // = curveHeight / 2 (22 px word, 14 px story)
const controlY = vh * 1.5;  // creates a clear U arc below startY
```

## Why This Works

| Change | Root cause addressed |
|--------|----------------------|
| `vertical-align: baseline` | `bottom` anchored each sub-column's BOTTOM to the line-box bottom, pushing the text baseline upward; `baseline` restores natural text-baseline alignment matching regular segments |
| Remove `paddingBottom` | The 44 px padding zone created an invisible "basement" below the 10 px mark areas; the curve container lived there, fully below the dots. Removing the zone collapses this structure. |
| Unify mark height to `curveHeight` | Regular segments used `curveHeight` (44/28 px); sub-segments used `dotSize + 4` (10/6 px). The mismatch put dots and curve endpoints in non-overlapping vertical bands. |
| `startY = vh / 2` | Dots are centered in their `curveHeight`-tall mark area at `curveHeight / 2` from the top. Setting `startY = vh / 2` places curve endpoints at the same Y, making them co-linear with dot centers. |

After all four changes, every segment in the word — split or regular — has a `curveHeight`-tall mark area. The curve container (absolute, `bottom: 0`, `height: curveHeight`) exactly overlaps the sub-segment mark area; dots and curve endpoints share the same vertical midpoint. The SVG's `overflow: visible` allows the U arc to extend below the SVG bounds without clipping.

## Prevention

**1. Always use `vertical-align: baseline` for inline-flex phoneme columns.**
Unless you have a concrete reason to anchor to a different edge, any `inline-flex; flex-direction: column` segment should use `baseline`. Document any exception.

**2. Use one height constant for all mark containers.**
Every mark container (dot, underline, curve) must use the same height so they occupy the same vertical band:

```tsx
// ✅ correct — all mark areas same height
<span className="phoneme-mark" style={{ height: dims.curveHeight }}>
  <span className="phoneme-dot" style={{ width: dims.dotSize, height: dims.dotSize }} />
</span>
```

**3. Avoid "padding-basement" layouts for absolutely-positioned overlays.**
If a curve or overlay needs space, keep it in the mark area at the correct nesting level rather than reserving invisible padding on an ancestor:

```tsx
// ❌ avoid — curve hidden in padding zone, invisible to dots above
<span className="phoneme-split-group" style={{ paddingBottom: dims.curveHeight }}>

// ✅ prefer — curve container overlaps the mark area directly
<span className="phoneme-split-group">
  <span className="phoneme-chars">{/* sub-segments with curveHeight marks */}</span>
  <span className="phoneme-curve-container" style={{ height: dims.curveHeight }}>
    <SplitCurve dims={dims} />
  </span>
</span>
```

**4. Anchor SVG curve endpoints to `vh / 2` (dot-center), not `2`.**
When the curve container covers the same mark area as dots, the curve endpoints should start at the visual center of that area:

```tsx
const startY = vh / 2;      // = "at the dot level"
const controlY = vh * 1.5;  // clear U depth below start
```

**5. Verify at both `size="word"` and `size="story"`.**
The two modes use different constants (`curveHeight` 44/28, `dotSize` 6/4). Always confirm both before shipping phoneme-mark changes.

## Related

- Previous alignment bug (horizontal drift): [`phoneme-mark-alignment-letter-spacing-drift-2026-03-27.md`](./phoneme-mark-alignment-letter-spacing-drift-2026-03-27.md)
- Implementation plan: [`docs/plans/2026-04-09-005-fix-split-digraph-word-spacing-plan.md`](../plans/2026-04-09-005-fix-split-digraph-word-spacing-plan.md)
- Feature origin: [`docs/plans/2026-03-27-001-feat-visual-phoneme-marking-plan.md`](../plans/2026-03-27-001-feat-visual-phoneme-marking-plan.md)
