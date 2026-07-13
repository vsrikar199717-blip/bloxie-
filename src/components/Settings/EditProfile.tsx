import { useState } from 'react';
import { OnboardingLayout } from '../Onboarding/OnboardingLayout';
import type { ChildProfile, YearGroup, PhonicsPhase } from '../../types/profile';
import { YEAR_GROUP_LABELS, PHASE_INFO } from '../../types/profile';
import './settings.css';

interface EditProfileProps {
  profile: ChildProfile;
  onSave: (
    id: string,
    updates: {
      name: string;
      yearGroup: YearGroup;
      phonicsPhase: PhonicsPhase;
      includedPhases: PhonicsPhase[];
      visualPhonemeMarking: boolean;
    }
  ) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const YEAR_GROUPS: YearGroup[] = ['Reception', 'Year1', 'Year2'];

/** Same plant-per-year mapping as onboarding and Parent Mode. */
const YEAR_PLANT: Record<YearGroup, string> = {
  Reception: '/assets/plants/plant-1.svg',
  Year1: '/assets/plants/plant-2.svg',
  Year2: '/assets/plants/plant-3.svg',
};

export function EditProfile({ profile, onSave, onDelete, onBack }: EditProfileProps) {
  const [name, setName] = useState(profile.name);
  const [yearGroup, setYearGroup] = useState<YearGroup>(profile.yearGroup);
  const [includedPhases, setIncludedPhases] = useState<PhonicsPhase[]>(profile.includedPhases);
  const visualPhonemeMarking = profile.visualPhonemeMarking;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canSave = name.trim().length > 0 && includedPhases.length > 0;
  const hasChanges =
    name.trim() !== profile.name ||
    yearGroup !== profile.yearGroup ||
    visualPhonemeMarking !== profile.visualPhonemeMarking ||
    JSON.stringify([...includedPhases].sort()) !==
      JSON.stringify([...profile.includedPhases].sort());

  const handleYearGroupChange = (newYearGroup: YearGroup) => {
    setYearGroup(newYearGroup);
    // Reset included phases based on year group
    if (newYearGroup === 'Reception') {
      setIncludedPhases([2]);
    } else if (newYearGroup === 'Year1') {
      setIncludedPhases([5]);
    } else {
      setIncludedPhases([2, 3, 4, 5]);
    }
  };

  const handleTogglePhase = (phase: PhonicsPhase) => {
    // Phase 5 is compulsory for Y1/Y2
    if (phase === 5 && yearGroup !== 'Reception') return;

    // Never leave a child with nothing to practise
    if (includedPhases.length === 1 && includedPhases.includes(phase)) return;

    if (includedPhases.includes(phase)) {
      setIncludedPhases(includedPhases.filter((p) => p !== phase));
    } else {
      setIncludedPhases([...includedPhases, phase].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const phonicsPhase = Math.max(...includedPhases) as PhonicsPhase;
    onSave(profile.id, {
      name: name.trim(),
      yearGroup,
      phonicsPhase,
      includedPhases,
      visualPhonemeMarking,
    });
  };

  const availablePhases: PhonicsPhase[] =
    yearGroup === 'Reception' ? [2, 3, 4] : [2, 3, 4, 5];

  return (
    <OnboardingLayout>
      <div className="settings-step">
        <div className="settings-header">
          <button onClick={onBack} className="settings-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <h1 className="font-display">Edit Profile</h1>
          <div className="settings-header-spacer" />
        </div>

        <section className="settings-section">
          <label className="settings-label" htmlFor="child-name">Name</label>
          <input
            id="child-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
          />
        </section>

        <section className="settings-section">
          <h2>Year group</h2>
          <div className="settings-years">
            {YEAR_GROUPS.map((yg) => {
              const { label, ageRange } = YEAR_GROUP_LABELS[yg];
              const isSelected = yearGroup === yg;

              return (
                <button
                  key={yg}
                  onClick={() => handleYearGroupChange(yg)}
                  aria-pressed={isSelected}
                  className={`settings-year-card ${isSelected ? 'selected' : ''}`}
                >
                  <img src={YEAR_PLANT[yg]} alt="" aria-hidden="true" />
                  <p className="label font-display">{label}</p>
                  <p className="age">{ageRange}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="settings-section">
          <h2>{yearGroup === 'Reception' ? 'Phases to practise' : 'Phases to include'}</h2>

          {availablePhases.map((phase) => {
            const { title, description } = PHASE_INFO[phase];
            const isSelected = includedPhases.includes(phase);
            const isLocked = phase === 5 && yearGroup !== 'Reception';

            return (
              <label
                key={phase}
                className={`settings-phase ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleTogglePhase(phase)}
                  disabled={isLocked}
                />
                <div>
                  <div className="settings-phase-title">
                    <span className="settings-phase-chip">Phase {phase}</span>
                    {title}
                  </div>
                  <p className="settings-phase-desc">{description}</p>
                </div>
              </label>
            );
          })}
        </section>

        <section className="settings-section">
          <button onClick={handleSave} disabled={!canSave || !hasChanges} className="settings-save">
            Save changes
          </button>
        </section>

        <section className="settings-section">
          <div className="settings-card">
            {showDeleteConfirm ? (
              <div className="settings-confirm">
                <p>Delete {profile.name}'s profile? This cannot be undone.</p>
                <div className="settings-confirm-row">
                  <button onClick={() => onDelete(profile.id)} className="settings-confirm-yes">
                    Yes, delete
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="settings-confirm-no">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="settings-danger">
                Delete this profile
              </button>
            )}
          </div>
        </section>
      </div>
    </OnboardingLayout>
  );
}
