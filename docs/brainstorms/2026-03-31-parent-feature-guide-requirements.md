---
date: 2026-03-31
topic: parent-feature-guide
---

# Parent Feature Guide

## Problem Frame

Parents sit with their child during reading sessions but have no way to learn what the app's features do. There's no onboarding for tools like Ruler, Lightbox, or Marks, no explanation of how Skip/Sound It Out work, and no guide for the building zone. Parents who don't understand these features can't help their child get the most out of the app.

## Requirements

- R1. **Pre-session walkthrough** — After theme selection and before the first session (per profile), show a swipeable card-based walkthrough introducing the app's features. Skippable via a "Skip" button. Only shown once per profile (first session).
- R2. **Toolbar help button** — Add a help/info button to the reading aids toolbar, positioned between the theme emoji button and the Settings gear button. Tapping opens the same guide content as an overlay/modal.
- R3. **Feature content** — The guide covers these features, grouped into 3-4 cards:
  - **Reading tools**: Ruler (reading line guide), Lightbox (focus overlay), Marks (visual phoneme marking) — all toggled from the toolbar
  - **Helping your child**: Tips for Grownups (help sounding out words), "Sound it out" button (child hears the word), "Skip" button (moves on without awarding a part)
  - **Building zone**: Switch theme anytime (emoji button in toolbar), "Start again" clears the build area
  - **Settings**: Change which phonics phases your child practises
- R4. **Tone** — Warm and encouraging. Written for a parent who wants to help their child, not a technical manual. Short sentences, scannable.
- R5. **Shared content** — The walkthrough (R1) and the toolbar modal (R2) use the same underlying content/components. One source of truth.

## Success Criteria

- A new parent understands what each toolbar button does before the child's first session
- A parent mid-session can quickly look up what a feature does via the toolbar help button
- The walkthrough does not block or frustrate parents who want to jump straight in (skippable)

## Scope Boundaries

- No animated illustrations or screenshots of the app within the guide — text and icons only for now
- No in-context coach marks or tooltips pointing at specific UI elements during the session
- No changes to the existing TeachingTipBadge ("Tips for grown ups") component — it continues to work as-is
- No feature education for the Settings/Parent Mode screens themselves

## Key Decisions

- **Swipeable cards over scrollable page**: Cards force bite-sized content and feel native to a touch device. Each card covers one topic group.
- **Shown once per profile, not once per device**: Different parents may set up profiles for different children. Each profile's first session gets the walkthrough.
- **Toolbar placement between emoji and gear**: Keeps help accessible without adding a floating button or cluttering the session screen.

## Outstanding Questions

### Deferred to Planning
- [Affects R1][Technical] How to track "has seen walkthrough" per profile — extend the existing profile storage or use a separate flag?
- [Affects R2][Technical] Modal/overlay implementation — reuse an existing pattern or build a new one?
- [Affects R3][Needs research] Exact copy for each card — draft during planning or treat as a separate content task?

## Next Steps

→ `/ce:plan` for structured implementation planning
