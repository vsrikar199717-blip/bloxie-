import type { WordAttempt } from '../types/profile';

type AttemptStatus = WordAttempt['status'];

/**
 * How a word went. Two voices, deliberately:
 *
 *  · `label`      — what the grown-up taps right after the word, spoken about
 *                   the child by name. `{name}` is substituted by markLabel().
 *  · `recapLabel` — a name-free category heading for the end-of-session recap,
 *                   where "{name} did it!" would read oddly as a group title.
 *
 * Nothing here is a failure: needing a little help is not getting it wrong.
 * That's why there's no red.
 *
 * Single source of truth — the live pills, the recap and the practice round all
 * read from this, so the wording cannot drift apart.
 */
export const STATUS_LABELS: Record<
  AttemptStatus,
  { icon: string; label: string; recapLabel: string; color: string; empty: string }
> = {
  independent: {
    icon: '🌟',
    label: '{name} did it!',
    recapLabel: 'Did it alone',
    color: '#22C55E',
    empty: 'Words land here as they click.',
  },
  practice: {
    icon: '💡',
    label: '{name} needed a little help',
    recapLabel: 'Needed a little help',
    color: '#4C9BF5',
    empty: 'Nothing needed a hand.',
  },
  support: {
    icon: '🤝',
    label: 'We did it together',
    recapLabel: 'Did it together',
    color: '#F97316',
    empty: 'Nothing here.',
  },
  skipped: {
    icon: '⏭️',
    label: 'Come back to it later',
    recapLabel: 'Came back to it later',
    color: '#9A9A9A',
    empty: 'Nothing skipped.',
  },
};

/** Fill the child's name into a status label. */
export function markLabel(status: AttemptStatus, name: string): string {
  return STATUS_LABELS[status].label.replace('{name}', name);
}

/**
 * The three pills, ordered as a ladder of help: go it alone, ask for a nudge,
 * do it together. Independence is offered first, every time.
 */
export const MARK_ORDER: Exclude<AttemptStatus, 'skipped'>[] = [
  'independent',
  'practice',
  'support',
];
