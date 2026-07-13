import { useState } from 'react';
import { OnboardingLayout } from '../Onboarding/OnboardingLayout';
import type { ChildProfile, YearGroup } from '../../types/profile';
import { YEAR_GROUP_LABELS } from '../../types/profile';
import './settings.css';

interface ParentModeProps {
  profiles: ChildProfile[];
  onBack: () => void;
  onEditProfile: (id: string) => void;
  onAddChild: () => void;
  onDeleteAllData: () => void;
  isSessionActive?: boolean;
  onReturnToSession?: () => void;
}

/**
 * The plant that already stands for each year group on the onboarding cards,
 * reused here as the child's avatar — so a child is recognised by the same
 * illustration everywhere in the app.
 */
const YEAR_PLANT: Record<YearGroup, string> = {
  Reception: '/assets/plants/plant-1.svg',
  Year1: '/assets/plants/plant-2.svg',
  Year2: '/assets/plants/plant-3.svg',
};

export function ParentMode({
  profiles,
  onBack,
  onEditProfile,
  onAddChild,
  onDeleteAllData,
  isSessionActive = false,
  onReturnToSession,
}: ParentModeProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <OnboardingLayout>
      <div className="settings-step">
        {/* Mid-session: getting back to the child is the only urgent action */}
        {isSessionActive && onReturnToSession && (
          <button onClick={onReturnToSession} className="settings-resume">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 15l-3-3 3-3" />
              <path d="M8 12h8" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            Back to reading
          </button>
        )}

        <div className="settings-header">
          {/* The resume button above already covers going back mid-session */}
          {!isSessionActive ? (
            <button onClick={onBack} className="settings-back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          ) : (
            <div className="settings-header-spacer" />
          )}

          <h1 className="font-display">Parent Mode</h1>
          <div className="settings-header-spacer" />
        </div>

        <section className="settings-section">
          <h2>Children</h2>

          {profiles.map((profile) => {
            const year = YEAR_GROUP_LABELS[profile.yearGroup];

            return (
              <div key={profile.id} className="settings-child">
                <div className="settings-child-plant">
                  <img src={YEAR_PLANT[profile.yearGroup]} alt="" aria-hidden="true" />
                </div>

                <div className="settings-child-content">
                  <p className="name font-display">{profile.name}</p>
                  <p className="year">
                    {year.label} · {year.ageRange}
                  </p>
                </div>

                <button onClick={() => onEditProfile(profile.id)} className="settings-child-edit">
                  Edit
                </button>
              </div>
            );
          })}

          <button onClick={onAddChild} className="settings-add">
            + Add another child
          </button>
        </section>

        <section className="settings-section">
          <h2>About</h2>

          <div className="settings-card">
            <p>Your data is stored on this device only. We never see any of it.</p>

            {showDeleteConfirm ? (
              <div className="settings-confirm">
                <p>Are you sure? This deletes every profile, and cannot be undone.</p>
                <div className="settings-confirm-row">
                  <button onClick={onDeleteAllData} className="settings-confirm-yes">
                    Yes, delete all
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="settings-confirm-no">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="settings-danger">
                Delete all data
              </button>
            )}
          </div>
        </section>
      </div>
    </OnboardingLayout>
  );
}
