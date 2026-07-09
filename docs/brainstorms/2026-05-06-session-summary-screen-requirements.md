---
date: 2026-05-06
topic: session-summary-screen
---

# Session Summary Screen with Word-Level Breakdown

## Problem Frame

When a session ends, the parent sees only "Amazing job! You read N words!" — a single number with no breakdown. The parent just watched the child read 10-15 words but has no summary of which words were strong vs. which need work. Mis-taps during fast-paced sessions (common with 4-7 year olds) persist immediately to wordHistory with no way to correct them. There is also no way to immediately re-practice struggling words while the session context is fresh.

## Requirements

- R1. **Session summary replaces the current completion screen.** When `isSessionComplete` triggers, the ReadingZone shows a summary screen instead of the current "Amazing job!" message.

- R2. **Words are grouped by status with colour coding.** The summary displays all assessed words in four sections, ordered top-to-bottom:
  - "Needs more practice" (red) — words marked `practice`
  - "With a little help" (amber/orange) — words marked `support`
  - "Nailed it!" (green) — words marked `independent`
  - "Skipped" (grey) — words marked `skipped`
  Empty sections are hidden.

- R3. **Aggregate stats shown.** Display total words attempted and a count per status category (e.g., "12 words: 7 nailed it, 3 with help, 2 need practice").

- R4. **Mis-tap correction via tap-to-cycle.** Parents can tap any word in the summary to cycle its status: `independent → support → practice → skipped → independent`. The word's colour updates immediately. The corresponding `WordAttempt` record in `wordHistory` is updated in place (not appended as a new record).

- R5. **"Practice these again" button.** When at least one word has status `practice` or `skipped`, show a button that starts a micro-session with only those words. The button is hidden when no words need practice.

- R6. **Micro-session returns to summary.** After completing the micro-session practice words, the summary screen re-displays with updated statuses reflecting the new assessments. The parent can review again, correct further, or exit. New attempts from the micro-session are appended to `wordHistory` as normal (they do not replace the original attempts).

- R7. **Explicit exit button.** A "Let's build!" (or similar) button lets the parent explicitly move to the building zone. No auto-switch or timer.

- R8. **Celebration tone preserved.** The summary screen retains a positive, celebratory feel (emoji, encouraging copy) rather than feeling like a test report. The "Nailed it" section should be visually prominent even when practice words exist.

## Success Criteria

- Parents can see at a glance which words the child read independently vs. needed help on
- Mis-taps can be corrected without restarting the session — the wordHistory ledger reflects the correction
- The "practice again" loop works for at least one round (practice words → micro-session → updated summary)
- The screen does not frustrate the child — it should feel like part of the celebration, not a barrier to building

## Scope Boundaries

- **In scope:** Summary display, tap-to-cycle correction, practice-again micro-session, exit to building
- **Out of scope:** Session history across sessions (that's the Parent Dashboard, idea #3). No trend lines, no cross-session comparison on this screen.
- **Out of scope:** Changing when wordHistory persists. Keep the current immediate-persist-on-tap behaviour; corrections update existing records.
- **Out of scope:** Sound effects or animations on the summary screen (can be added later)

## Key Decisions

- **Immediate persist + in-place correction** over buffered commits: Simpler architecture. Keep current `handleCorrect`/`handleSkip` persistence. Corrections on the summary screen update the existing `WordAttempt` record rather than re-architecting the commit timing.
- **Cycle-on-tap** over popup picker or long-press: Minimal UI, no extra components. Colour change gives immediate feedback. Status order: independent → support → practice → skipped → independent.
- **Grouped by status** over flat list or per-set grouping: Clear visual hierarchy. Practice/struggling words appear at the top for attention. Nailed-it section prominent for celebration.
- **Explicit exit button** over auto-switch: Gives parents time to review and correct at their own pace without time pressure.
- **Micro-session returns to summary** with updated statuses: Lets parent see improvement. Micro-session attempts are new `wordHistory` entries (original attempts preserved for history).
- **Skipped words shown as grey**: Distinguishes "didn't attempt" from "struggled". Skipped words can be corrected via tap-to-cycle and are included in "practice again" eligibility.

## Dependencies / Assumptions

- Depends on idea #1 (assessment pipeline + wordHistory) which is already implemented
- `wordHistory` records need to be updatable by some identifier — currently they have no unique ID field. Planning should determine whether to add an ID or use `word + timestamp` as a lookup key.

## Outstanding Questions

### Deferred to Planning
- [Affects R4][Technical] How to identify and update a specific WordAttempt record in wordHistory — add an `id` field, or use word+timestamp composite key?
- [Affects R5-R6][Technical] How to implement the micro-session — reuse existing session flow with a filtered word list, or build a lightweight standalone reading loop?
- [Affects R1][Technical] Where the summary screen component lives — inside ReadingZone as a new state, or as a sibling component rendered by SessionScreen?

## Next Steps

→ `/ce:plan` for structured implementation planning
