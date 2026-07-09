---
title: "Phoneme marks drift out of alignment due to ch units ignoring letter-spacing"
date: "2026-03-27"
category: ui-bugs
module: ReadingZone
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Phoneme marks (dots, underlines, curves) drift left relative to annotated characters"
  - "Misalignment worsens progressively across longer words"
  - "Marks row is narrower than character row when letter-spacing is applied"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - "PhonemeMarkedWord.tsx"
  - "storyScreen.css"
tags:
  - css-alignment
  - letter-spacing
  - ch-unit
  - phoneme-marks
  - inline-flex
  - dyslexia-text
---

# Phoneme marks drift out of alignment due to ch units ignoring letter-spacing

## Problem

Phoneme marks (dots below single sounds, underlines below digraphs/trigraphs, SVG curves below split digraphs) were horizontally misaligned with the characters they annotated. The drift worsened with longer words, making the phonics notation misleading for children.

## Symptoms

- Dots, underlines, and curves appeared shifted to the left of their intended characters
- The misalignment was progressive: the first mark looked roughly correct, but each subsequent mark drifted further left
- Longer words showed worse misalignment than shorter words
- Visible in both the single-word practice view and the story view

## What Didn't Work

The original component used a **two-layer layout**:

- **Top layer**: Characters rendered as individual `<span>` elements in normal inline flow, inheriting `letter-spacing: 2.5px` from the parent `dyslexia-text` CSS class
- **Bottom layer**: An absolutely-positioned flex container (`.phoneme-marks`) placed below using `position: absolute; left: 0; right: 0;`, containing marks sized with `ch` CSS units

```css
/* Old: two independent layers */
.phoneme-marked-word {
  display: inline-block;
  position: relative;
}
.phoneme-marks {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
}
```

```tsx
// Old: marks sized with ch units, ignoring letter-spacing
marks.push(<span style={{ width: '1ch' }} />);      // dot spacer
style={{ width: `${charCount}ch` }}                  // digraph underline
<svg width={`${widthCh}ch`} ...>                     // split curve
```

The `ch` CSS unit equals the width of the "0" character in the current font. It does **not** include `letter-spacing`. With `letter-spacing: 2.5px`, a 4-character word's rendered width exceeds `4ch` by approximately 10px. The marks row was consistently narrower than the characters row.

## Solution

Rewrote the component to use a **column-based layout** where each phoneme segment is an `inline-flex` column containing its characters on top and its mark directly below.

**CSS:**
```css
.phoneme-marked-word {
  display: inline;
}

.phoneme-segment {
  display: inline-flex;
  flex-direction: column;    /* characters on top, mark below */
  align-items: center;
  vertical-align: baseline;
}

.phoneme-chars {
  display: inline;           /* inherits letter-spacing from parent */
}

.phoneme-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;               /* fills the segment's width exactly */
}

.phoneme-underline {
  width: 100%;               /* no more ch calculations */
}
```

**TSX structure (per segment):**
```tsx
<span className="phoneme-segment">
  <span className="phoneme-chars">
    {unit.chars.split('').map((ch, ci) => (
      <span key={ci}>{ch}</span>
    ))}
  </span>
  <span className="phoneme-mark" style={{ height: dims.curveHeight }}>
    {/* dot, underline, or SVG curve — all use width: 100% */}
  </span>
</span>
```

## Why This Works

The root cause was that mark width calculations (`ch` units) and character widths (glyph + letter-spacing) used different measurement systems. They were independent horizontal rows that had to match widths but couldn't.

The column-based layout eliminates this entirely. Each segment is a single flex column. The characters define the column's width (including letter-spacing, font metrics, kerning — everything). The mark sits inside the same container and uses `width: 100%`, so it always matches exactly. There are no independent width calculations to drift out of sync.

## Prevention

1. **Never use parallel rows with independent width calculations for alignment.** When an annotation must align with text, place both in the same container so one derives its width from the other.

2. **Avoid `ch` units for layout that must match rendered text width.** The `ch` unit does not account for `letter-spacing`, `word-spacing`, font kerning, or ligatures. Use percentage-based widths (`width: 100%`) relative to a shared parent instead.

3. **Prefer `inline-flex` columns over `position: absolute` overlays** for text annotations. Column layout automatically handles variable-width content without manual sizing.

4. **Test with `letter-spacing` enabled.** This bug only manifests when letter-spacing is non-zero (e.g., dyslexia-friendly text styles). Ensure test cases cover accessibility text modes.

## Related Issues

- Plan document: `docs/plans/2026-03-27-001-feat-visual-phoneme-marking-plan.md` — Unit 3 originally prescribed the two-layer absolute-positioning approach. The plan's risk assessment (Risks & Dependencies: "CSS layout with character spans") correctly flagged this as needing early prototyping.
