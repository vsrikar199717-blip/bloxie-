import type { SessionState } from '../types';
import type { AwardedPart, SessionPartsState } from '../hooks/usePartSystem';
import type { Theme } from '../types/profile';

/**
 * Mid-session persistence.
 *
 * Session state used to live only in memory, so a tab close, a browser
 * refresh, or a tablet going to sleep silently threw away everything the
 * child had read and every part they had built. On a shared family tablet
 * that is an everyday occurrence, not an edge case.
 *
 * We snapshot after every change and restore on the next visit, so a session
 * survives the app being killed at any point.
 */

const SESSION_KEY = 'robot-reading-active-session';

/** Bump when the snapshot shape changes, so stale saves are dropped, not misread. */
export const SNAPSHOT_VERSION = 1;

/** Snapshots older than this are treated as a finished session, not a pause. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface SessionSnapshot {
  version: number;
  profileId: string;
  savedAt: number;
  /** When the session originally began — the recap uses it to select attempts. */
  startedAt: number;
  theme: Theme;
  session: SessionState;
  parts: {
    partsState: SessionPartsState;
    awardedParts: AwardedPart[];
    nextZIndex: number;
  };
}

export function saveSnapshot(snapshot: SessionSnapshot): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (e) {
    // Quota exceeded or storage disabled (private mode). Losing resume is bad
    // but not fatal — the session in memory carries on working.
    console.error('Failed to save session:', e);
  }
}

/**
 * Returns the saved session for this profile, or null when there is nothing
 * worth resuming. A snapshot is discarded when it belongs to another child,
 * is from an older app version, is stale, or has no words read yet — resuming
 * into a session with nothing in it would just be a confusing detour.
 */
export function loadSnapshot(profileId: string): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as SessionSnapshot;

    if (snapshot.version !== SNAPSHOT_VERSION) return null;
    if (snapshot.profileId !== profileId) return null;
    if (Date.now() - snapshot.savedAt > MAX_AGE_MS) return null;
    if (!snapshot.session?.wordSets?.length) return null;
    if (snapshot.session.totalWordsAttempted < 1) return null;

    // A session that already ran to the end is finished, not paused.
    if (snapshot.session.currentSetIndex >= snapshot.session.wordSets.length) return null;

    return snapshot;
  } catch (e) {
    console.error('Failed to load session:', e);
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}
