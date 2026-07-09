import { useState } from 'react';
import { YearGroupSelector } from './YearGroupSelector';
import { ReceptionPhaseSelector } from './ReceptionPhaseSelector';
import { PhaseInclusionSelector } from './PhaseInclusionSelector';
import { SettingsCog } from '../ui/SettingsCog';
import { OnboardingLayout } from '../Onboarding/OnboardingLayout';
import type { YearGroup, PhonicsPhase } from '../../types/profile';
import './profileSetup.css';

type Step = 'name' | 'yearGroup' | 'phase';

interface ProfileSetupProps {
  onComplete: (profile: {
    name: string;
    yearGroup: YearGroup;
    phonicsPhase: PhonicsPhase;
    includedPhases: PhonicsPhase[];
  }) => void;
  onOpenSettings: () => void;
  showSettingsCog?: boolean;
}

export function ProfileSetup({
  onComplete,
  onOpenSettings,
  showSettingsCog = true,
}: ProfileSetupProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [yearGroup, setYearGroup] = useState<YearGroup | null>(null);
  const [includedPhases, setIncludedPhases] = useState<PhonicsPhase[]>([]);

  const handleYearGroupSelect = (selected: YearGroup) => {
    setYearGroup(selected);

    // Set default phases based on year group
    if (selected === 'Reception') {
      setIncludedPhases([2]); // Default to Phase 2
    } else if (selected === 'Year1') {
      setIncludedPhases([5]); // Default to Phase 5 only
    } else if (selected === 'Year2') {
      setIncludedPhases([2, 3, 4, 5]); // Default to all phases
    }
  };

  const handleTogglePhase = (phase: PhonicsPhase) => {
    if (includedPhases.includes(phase)) {
      setIncludedPhases(includedPhases.filter((p) => p !== phase));
    } else {
      setIncludedPhases([...includedPhases, phase].sort((a, b) => a - b));
    }
  };

  const handleNext = () => {
    if (step === 'name' && name.trim()) {
      setStep('yearGroup');
    } else if (step === 'yearGroup' && yearGroup) {
      setStep('phase');
    }
  };

  const handleBack = () => {
    if (step === 'phase') {
      setStep('yearGroup');
    } else if (step === 'yearGroup') {
      setStep('name');
    }
  };

  const handleFinish = () => {
    if (!yearGroup || includedPhases.length === 0) return;

    // phonicsPhase is the highest selected phase
    const phonicsPhase = Math.max(...includedPhases) as PhonicsPhase;

    onComplete({
      name: name.trim(),
      yearGroup,
      phonicsPhase,
      includedPhases,
    });
  };

  const canProceed = () => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'yearGroup') return yearGroup !== null;
    if (step === 'phase') return includedPhases.length > 0;
    return false;
  };

  return (
    <OnboardingLayout showDecorations={step === 'name'}>
      {showSettingsCog && <SettingsCog onClick={onOpenSettings} />}

      {step === 'name' && (
        <div className="name-step">
          <h1 className="font-display">
            <span>Let's set this up</span>
            <span>for your child</span>
          </h1>
          <p className="subtext">
            3 quick questions, about a minute. This helps us pick words and pace
            that match your child, nothing else.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your child's name…"
            className="name-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canProceed()) {
                handleNext();
              }
            }}
          />
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="begin-button"
          >
            Let's Begin
          </button>
        </div>
      )}

      {step === 'yearGroup' && (
        <div className="w-full max-w-[900px]">
          <YearGroupSelector
            childName={name}
            selectedYearGroup={yearGroup}
            onSelect={handleYearGroupSelect}
          />
          <div className="onboarding-actions">
            <button onClick={handleBack} className="btn-back">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-next"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 'phase' && yearGroup === 'Reception' && (
        <div className="w-full max-w-[900px]">
          <ReceptionPhaseSelector
            childName={name}
            selectedPhases={includedPhases}
            onTogglePhase={handleTogglePhase}
          />
          <div className="onboarding-actions">
            <button onClick={handleBack} className="btn-back">
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="btn-next"
            >
              Let's begin
            </button>
          </div>
        </div>
      )}

      {step === 'phase' && (yearGroup === 'Year1' || yearGroup === 'Year2') && (
        <div className="w-full max-w-[900px]">
          <PhaseInclusionSelector
            childName={name}
            yearGroup={yearGroup}
            includedPhases={includedPhases}
            onTogglePhase={handleTogglePhase}
          />
          <div className="onboarding-actions">
            <button onClick={handleBack} className="btn-back">
              Back
            </button>
            <button onClick={handleFinish} className="btn-next">
              Let's begin
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
