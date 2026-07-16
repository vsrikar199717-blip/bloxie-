import { useState } from 'react';
import type { PhonicsPhase } from '../../types/profile';
import { PHASE_INFO } from '../../types/profile';

interface PhaseInclusionSelectorProps {
  childName: string;
  yearGroup: 'Year1' | 'Year2';
  includedPhases: PhonicsPhase[];
  onTogglePhase: (phase: PhonicsPhase) => void;
}

const EARLIER_PHASES: PhonicsPhase[] = [4, 3, 2];

// Same plant that was shown for the selected year group on the previous screen
const YEAR_PLANT: Record<'Year1' | 'Year2', string> = {
  Year1: '/assets/plants/plant-2.svg',
  Year2: '/assets/plants/plant-3.svg',
};

const PHASE_BADGE_COLORS: Record<number, string> = {
  4: 'phase-4',
  3: 'phase-3',
  2: 'phase-2',
};

export function PhaseInclusionSelector({
  childName,
  yearGroup,
  includedPhases,
  onTogglePhase,
}: PhaseInclusionSelectorProps) {
  const hasEarlierPhases = includedPhases.some((p) => p < 5);
  const [showEarlier, setShowEarlier] = useState(hasEarlierPhases);

  const handleToggleEarlier = (yes: boolean) => {
    setShowEarlier(yes);
    if (!yes) {
      // Remove all earlier phases
      [2, 3, 4].forEach((phase) => {
        if (includedPhases.includes(phase as PhonicsPhase)) {
          onTogglePhase(phase as PhonicsPhase);
        }
      });
    } else {
      // Add all earlier phases by default
      [2, 3, 4].forEach((phase) => {
        if (!includedPhases.includes(phase as PhonicsPhase)) {
          onTogglePhase(phase as PhonicsPhase);
        }
      });
    }
  };

  const yearLabel = yearGroup === 'Year1' ? 'Year 1' : 'Year 2';

  return (
    <div>
      <div className="phase-heading">
        <h1 className="font-display">
          Based on <strong>{yearLabel}</strong>, we'll start {childName} at{' '}
          <strong>Phase 5</strong>
        </h1>
        <p className="subtext">
          <strong>Phases</strong> are the UK's standard steps for learning letter
          sounds. Phase 5 covers common spelling patterns like{' '}
          <strong>'a-e' (cake) and 'i-e' (bike)</strong>.
        </p>
      </div>

      {/* Phase 5 main card */}
      <div className="phase-main-card">
        <div className="recommended-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon
              points="6,1 7.5,4.2 11,4.6 8.5,7 9.1,10.5 6,8.8 2.9,10.5 3.5,7 1,4.6 4.5,4.2"
              fill="white"
            />
          </svg>
          Recommended
        </div>

        <div className="card-illustration">
          <img src={YEAR_PLANT[yearGroup]} alt="" aria-hidden="true" className="year-card-image" />
        </div>

        <div style={{ flex: 1 }}>
          <h3 className="font-display">Starting at Phase 5</h3>
          <p className="helper">Common spelling patterns, eg 'a-e' (cake), 'i-e' (bike)</p>
        </div>
      </div>

      {/* Toggle panel */}
      <div className={`toggle-panel ${showEarlier ? 'expanded' : ''}`}>
        <div className="toggle-panel-header">
          <div>
            <h3>Include easier sounds for extra practise?</h3>
            <p className="helper">This builds confidence and helps learning stick</p>
          </div>
          <div className="toggle-pills">
            <button
              className={`toggle-pill ${!showEarlier ? 'active' : 'inactive'}`}
              onClick={() => handleToggleEarlier(false)}
            >
              No
            </button>
            <button
              className={`toggle-pill ${showEarlier ? 'active' : 'inactive'}`}
              onClick={() => handleToggleEarlier(true)}
            >
              Yes
            </button>
          </div>
        </div>

        {/* Expandable phase rows (always mounted; height animates open/closed) */}
        <div className="phase-rows-wrap">
          <div className="phase-rows">
            {EARLIER_PHASES.map((phase) => {
              const isChecked = includedPhases.includes(phase);
              const { title, description } = PHASE_INFO[phase];
              return (
                <div key={phase} className="phase-row">
                  <div className={`phase-row-badge ${PHASE_BADGE_COLORS[phase]}`}>Phase {phase}</div>
                  <div className="phase-row-text">
                    <p className="title">{title}</p>
                    <p className="example">{description}</p>
                  </div>
                  <div
                    className={`check-indicator ${isChecked ? 'checked' : ''}`}
                    onClick={() => onTogglePhase(phase)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
