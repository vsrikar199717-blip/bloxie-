import { useState } from 'react';
import { ActionButton } from '../ui/ActionButton';
import type { ChildProfile, YearGroup, PhonicsPhase } from '../../types/profile';
import { YEAR_GROUP_LABELS, PHASE_INFO } from '../../types/profile';

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
    JSON.stringify(includedPhases.sort()) !== JSON.stringify([...profile.includedPhases].sort());

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
    // Don't allow unchecking Phase 5 for Y1/Y2
    if (phase === 5 && yearGroup !== 'Reception') return;

    // Don't allow unchecking the last phase
    if (includedPhases.length === 1 && includedPhases.includes(phase)) return;

    if (includedPhases.includes(phase)) {
      setIncludedPhases(includedPhases.filter((p) => p !== phase));
    } else {
      setIncludedPhases([...includedPhases, phase].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    if (canSave) {
      const phonicsPhase = Math.max(...includedPhases) as PhonicsPhase;
      onSave(profile.id, {
        name: name.trim(),
        yearGroup,
        phonicsPhase,
        includedPhases,
        visualPhonemeMarking,
      });
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(profile.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Get available phases based on year group
  const getAvailablePhases = (): PhonicsPhase[] => {
    if (yearGroup === 'Reception') {
      return [2, 3, 4];
    }
    return [2, 3, 4, 5];
  };

  return (
    <div className="h-screen bg-[#FFFFCC] p-6 overflow-y-auto pb-12">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 font-semibold"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Edit Profile</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {/* Name */}
          <label className="block text-lg font-bold text-gray-800 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none mb-6"
          />

          {/* Year Group */}
          <label className="block text-lg font-bold text-gray-800 mb-4">Year Group</label>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {YEAR_GROUPS.map((yg) => {
              const { label, ageRange } = YEAR_GROUP_LABELS[yg];
              const isSelected = yearGroup === yg;

              return (
                <button
                  key={yg}
                  onClick={() => handleYearGroupChange(yg)}
                  className={`
                    py-3 px-2 rounded-xl font-semibold text-sm transition-all
                    ${isSelected
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {label}
                  <span className="block text-xs mt-1 opacity-75">({ageRange})</span>
                </button>
              );
            })}
          </div>

          {/* Included Phases */}
          <label className="block text-lg font-bold text-gray-800 mb-4">
            {yearGroup === 'Reception' ? 'Phases to practise' : 'Include phases for practice'}
          </label>
          <div className="space-y-3 mb-6">
            {getAvailablePhases().map((phase) => {
              const { title, description } = PHASE_INFO[phase];
              const isSelected = includedPhases.includes(phase);
              const isDisabled = phase === 5 && yearGroup !== 'Reception';

              return (
                <label
                  key={phase}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTogglePhase(phase)}
                    disabled={isDisabled}
                    className="mt-1 w-5 h-5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        Phase {phase}
                      </span>
                      <span className="font-semibold text-gray-800">{title}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <ActionButton onClick={handleSave} color="primary" disabled={!canSave || !hasChanges}>
            Save changes
          </ActionButton>
        </div>

        {/* Delete Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {showDeleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-medium mb-3">
                Are you sure you want to delete {profile.name}'s profile?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Delete this profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
