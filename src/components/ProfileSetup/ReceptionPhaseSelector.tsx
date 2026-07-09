import type { PhonicsPhase } from '../../types/profile';
import { PHASE_INFO } from '../../types/profile';

interface ReceptionPhaseSelectorProps {
  childName: string;
  selectedPhases: PhonicsPhase[];
  onTogglePhase: (phase: PhonicsPhase) => void;
}

const RECEPTION_PHASES: PhonicsPhase[] = [2, 3, 4];

export function ReceptionPhaseSelector({
  childName,
  selectedPhases,
  onTogglePhase,
}: ReceptionPhaseSelectorProps) {
  const handleToggle = (phase: PhonicsPhase) => {
    // Prevent unchecking if it's the only selected phase
    if (selectedPhases.length === 1 && selectedPhases.includes(phase)) {
      return;
    }
    onTogglePhase(phase);
  };

  return (
    <div>
      <div className="reception-phase-heading">
        <h1 className="font-display">Which phases should {childName} practise?</h1>
        <p className="subtext">
          Select {childName}'s current phase and any earlier phases for revision
        </p>
      </div>

      <div className="reception-phase-cards">
        {RECEPTION_PHASES.map((phase) => {
          const { title, description } = PHASE_INFO[phase];
          const isSelected = selectedPhases.includes(phase);

          return (
            <button
              key={phase}
              onClick={() => handleToggle(phase)}
              className={`reception-phase-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="phase-row-badge">Phase {phase}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3>{title}</h3>
                <p className="description">{description}</p>
              </div>
              <div className={`check-indicator ${isSelected ? 'checked' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
