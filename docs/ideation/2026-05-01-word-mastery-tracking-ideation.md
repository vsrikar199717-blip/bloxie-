---
date: 2026-05-01
topic: word-mastery-tracking
focus: tracking user performance over time using assessment buttons to track word mastery for parent review, teacher sharing, and smart word selection
---

# Ideation: Word Mastery Tracking & Progress Reporting

## Codebase Context

- **Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 beta, all state in localStorage
- **App purpose**: UK phonics reading app (Reception–Year 2). Parent sits with child; child reads words; parent taps one of three assessment buttons ("read on their own" / "with support" / "needs more practice")
- **Critical finding**: `WordStatus = 'independent' | 'support' | 'practice'` is fully typed but dead code at runtime. `handleCorrect` in `SessionScreen.tsx` hardcodes `markWord('independent')`, and both visible buttons in `WordDisplay.tsx` call the same `onCorrect` callback with no status argument. The parent's judgment is asked for and immediately discarded.
- **Data gap**: `MARK_WORD` reducer in `useSession.ts` accepts `status` but only increments aggregate counters (`correctWordsThisSession`, `totalWordsAttempted`). Word identity and status are lost. `ChildProfile.progress` only stores `completedSetIds[]`.
- **No parent-facing progress**: `ParentMode.tsx` (146 lines) shows only profile names, edit buttons, and "delete all data" — zero progress visibility.
- **No export/share capability** exists anywhere in the codebase.
- **Existing infrastructure**: `WordSet.pattern`, `targetGrapheme`, `getGraphemesForPhases()`, `PHASE_INFO`, `screenshot.ts` — metadata and utilities that support tracking features.
- **Past learnings**: No documented solutions exist for tracking/reporting (all 3 existing solutions are UI bug fixes).

## Ranked Ideas

### 1. Fix the Broken Assessment Pipeline + Per-Word Mastery Ledger
**Description:** Two tightly coupled fixes that form the foundation for everything else. First, wire the three assessment buttons to actually pass distinct statuses through `onCorrect` -> `markWord()` -> `MARK_WORD`. Second, persist every assessment as a `WordAttempt` record `{word, status, setId, phase, timestamp}` in a new `wordHistory[]` on `ChildProfile`.
**Rationale:** This is arguably a bug, not a feature. `WordStatus` is fully typed but dead code. Both visible buttons call the same handler with no status argument, and `handleCorrect` hardcodes `'independent'`. The parent's judgment is asked for and immediately discarded. Every other idea on this list is blocked without this.
**Downsides:** localStorage has ~5MB limit; word history will grow over months. Needs a retention/compaction strategy eventually.
**Confidence:** 95%
**Complexity:** Low
**Status:** Implemented

### 2. Session Summary Screen with Word-Level Breakdown
**Description:** Replace the current minimal "Amazing job! You read N words!" ending with a recap screen showing each word color-coded by status (green/amber/red). Include a "practice these again" button for micro-sessions with only `practice` words. Allow parents to correct mis-taps before data commits.
**Rationale:** Tightest possible feedback loop — parents see results while the session is fresh. Also a data-quality safeguard for the mastery ledger (mis-taps during fast-paced sessions with young children are inevitable). The "practice again" button creates a natural remediation loop.
**Downsides:** Adds a step between reading and the building reward, which could frustrate children eager to build their robot.
**Confidence:** 85%
**Complexity:** Low-Medium
**Status:** Implemented

### 3. Parent Progress Dashboard
**Description:** Add a per-child progress view in ParentMode showing words grouped by mastery status, filterable by phase and phonics pattern, with a grapheme heat map (green/amber/red/grey by mastery ratio). Tapping a grapheme shows specific words and their history.
**Rationale:** ParentMode is 146 lines with zero progress visibility. Parents sit through every session but have no way to see patterns over time. The heat map organized by phonics pattern (`WordSet.pattern` and `targetGrapheme` already exist) maps to how teachers think about phonics.
**Downsides:** Needs enough data (several sessions) before the view is useful. First-session parents see a mostly grey/empty view.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

### 4. Mastery-Aware Word Selection (Spaced Repetition Lite)
**Description:** Modify `buildSessionSets()` to weight word selection by mastery: `practice` words resurface sooner, `support` words at moderate intervals, `independent` words gradually space out. A simple 3-bucket Leitner model mapped to the three statuses.
**Rationale:** Currently `buildSessionSets` tracks which sets have been shown but has zero awareness of per-word performance. A child who struggles with every word and one who aces them get identical probability of seeing them again. This is the highest-impact feature for learning outcomes.
**Downsides:** Breaks the current set-based selection model; may need to remix words across sets. Harder to test. Parents may not understand why certain words keep appearing.
**Confidence:** 75%
**Complexity:** Medium-High
**Status:** Unexplored

### 5. Teacher Export / Share Report
**Description:** Add a "Share with teacher" button in the parent dashboard that generates a client-side PDF or structured text summary: child name, date range, phase coverage, words by mastery status, flagged practice words. Use browser print/PDF or Web Share API.
**Rationale:** UK phonics teaching relies on home-school communication. A one-page summary bridges the gap between home practice and classroom instruction. The privacy-first localStorage architecture means client-side generation is the only viable (and desirable) path.
**Downsides:** PDF generation adds a dependency or requires manual HTML-to-print styling. Report design needs to be curriculum-aligned.
**Confidence:** 75%
**Complexity:** Medium
**Status:** Unexplored

### 6. Independent-Only Celebration Mode
**Description:** Add a session mode toggle that only presents words previously marked `independent` at least N times. A confidence-building "victory lap" for before school assessments, low-motivation days, or showing off to grandparents.
**Rationale:** The app assumes every session should challenge the child, but children who only experience struggle sessions lose motivation. This mode costs almost nothing once mastery data exists — it's just a filter on `buildSessionSets`. Children earn this mode through practice.
**Downsides:** Needs enough `independent` words to form a viable session. New users can't use it. Risk of parents only using celebration mode.
**Confidence:** 70%
**Complexity:** Low (once idea 1 exists)
**Status:** Unexplored

### 7. Data-Driven Phase Advancement Suggestions
**Description:** When a child consistently marks `independent` on 80%+ of words across 3+ sessions at their current phase, surface a suggestion: "Emma seems ready for Phase 4." Currently phase selection is buried in EditProfile.
**Rationale:** Parents who aren't phonics experts don't know when to advance. Evidence-based prompts turn passive data into actionable guidance, aligned with how UK phonics screening works (demonstrate mastery before advancing).
**Downsides:** The threshold needs tuning and may not suit all children. Could feel presumptuous if wrong.
**Confidence:** 65%
**Complexity:** Low-Medium (once idea 1 exists)
**Status:** Unexplored

## Dependency Chain

Ideas 2-7 all depend on #1 (the data pipeline fix). Ideas 4, 6, and 7 additionally need enough accumulated mastery data. Natural build order: **1 -> 2 -> 3 -> 4/5/6/7**.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Live Session Mastery Sidebar | Adds clutter during reading; session recap (#2) serves the same insight need at a better moment |
| 2 | Session Replay Timeline | Over-engineered for the use case; session summary covers the need without full replay |
| 3 | Reading Streak Counter | Nice but tangential to core mastery tracking; lower focus fit |
| 4 | Decay-Aware Mastery Scores | Too complex for v1; simple recency weighting inside idea #4 is sufficient |
| 5 | Cross-Session Trend Sparklines | Sub-feature of the dashboard (#3), not a standalone idea |
| 6 | Grapheme Heat Map (standalone) | Merged into dashboard (#3) as a visualization mode rather than separate feature |

## Notes

### localStorage Growth (Accepted for MVP)
`wordHistory` grows unbounded (~100 bytes per attempt). At typical usage (~10 words/session × 3 sessions/week × 40 weeks) this is ~120KB per child per year — well within the 5MB localStorage limit for MVP. A compaction/retention strategy is not needed until multi-profile households with sustained multi-year usage. Revisit if the app scales beyond single-family use.

## Session Log
- 2026-05-01: Initial ideation — 40 raw ideas generated across 5 agents, deduped to 13, 7 survived adversarial filtering
- 2026-05-05: Idea #1 implemented. Assessment pipeline fixed end-to-end: three buttons now pass distinct statuses (`independent`, `support`, `practice`); skip flags words as `skipped`. `WordAttempt` records persist to `wordHistory[]` on `ChildProfile` in localStorage.
