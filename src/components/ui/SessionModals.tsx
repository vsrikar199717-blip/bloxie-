import './sessionModals.css';

/**
 * Shown when a child returns to a session that was interrupted — a closed tab,
 * a reload, a tablet that went to sleep. The parent chooses whether to carry on
 * or start something new; we never silently discard the work, and we never
 * silently force them back into it.
 */
interface ResumePromptProps {
  profileName: string;
  wordsRead: number;
  partsEarned: number;
  onResume: () => void;
  onStartFresh: () => void;
}

export function ResumePrompt({
  profileName,
  wordsRead,
  partsEarned,
  onResume,
  onStartFresh,
}: ResumePromptProps) {
  return (
    <div className="session-overlay" role="dialog" aria-modal="true">
      <div className="session-modal">
        <div className="session-modal-icon" aria-hidden="true">
          👋
        </div>

        <h2 className="font-display">Welcome back, {profileName}!</h2>
        <p className="subtext">
          You were in the middle of a session. Everything is exactly where you
          left it.
        </p>

        <div className="session-stats">
          <span className="session-stat">
            {wordsRead} {wordsRead === 1 ? 'word' : 'words'} read
          </span>
          <span className="session-stat">
            {partsEarned} {partsEarned === 1 ? 'part' : 'parts'} earned
          </span>
        </div>

        <div className="session-modal-actions">
          <button className="session-btn-primary" onClick={onResume}>
            Carry on reading
          </button>
          <button className="session-btn-secondary" onClick={onStartFresh}>
            Start a new session
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The pause overlay. Reading is untimed, so pausing is not about stopping a
 * clock — it is about a parent being able to step away mid-word without any
 * worry that the child's work will vanish.
 */
interface PauseOverlayProps {
  profileName: string;
  wordsRead: number;
  onResume: () => void;
  onFinish: () => void;
}

export function PauseOverlay({
  profileName,
  wordsRead,
  onResume,
  onFinish,
}: PauseOverlayProps) {
  return (
    <div className="session-overlay" role="dialog" aria-modal="true">
      <div className="session-modal">
        <div className="session-modal-icon" aria-hidden="true">
          ⏸️
        </div>

        <h2 className="font-display">Paused</h2>
        <p className="subtext">
          Take all the time you need. {profileName}'s reading is saved — you can
          close the app and pick this session up later.
        </p>

        {wordsRead > 0 && (
          <div className="session-stats">
            <span className="session-stat">
              {wordsRead} {wordsRead === 1 ? 'word' : 'words'} so far
            </span>
          </div>
        )}

        <div className="session-modal-actions">
          <button className="session-btn-primary" onClick={onResume}>
            Keep reading
          </button>
          <button className="session-btn-secondary" onClick={onFinish}>
            Finish and see how it went
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Pause control. Lives in the reading zone's left-hand control column, directly
 * under the settings cog, and deliberately matches it — a floating corner button
 * collided with the building zone's "Start again".
 */
export function PauseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Pause session"
      className="w-11 h-11 rounded-full bg-[#5a5a5a] hover:bg-[#6b6b6b] grid place-items-center transition-colors active:scale-95"
    >
      <svg
        className="w-5 h-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="9" y1="5" x2="9" y2="19" />
        <line x1="15" y1="5" x2="15" y2="19" />
      </svg>
    </button>
  );
}
