import { useState } from 'react';
import type { ChildProfile } from '../../types/profile';
import { YEAR_GROUP_LABELS } from '../../types/profile';

interface ParentModeProps {
  profiles: ChildProfile[];
  onBack: () => void;
  onEditProfile: (id: string) => void;
  onAddChild: () => void;
  onDeleteAllData: () => void;
  isSessionActive?: boolean;
  onReturnToSession?: () => void;
}

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

  const handleDeleteAllData = () => {
    if (showDeleteConfirm) {
      onDeleteAllData();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFCC] p-6">
      <div className="max-w-lg mx-auto">
        {/* Return to Session Button - only shown when accessed mid-session */}
        {isSessionActive && onReturnToSession && (
          <button
            onClick={onReturnToSession}
            className="w-full mb-4 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            Return to reading session
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Hide generic back button when accessed mid-session —
              "Return to reading session" button above handles that case */}
          {!isSessionActive ? (
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 font-semibold"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div className="w-16" />
          )}
          <h1 className="text-xl font-bold text-gray-800">Parent Mode</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Children Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Children</h2>

          <div className="space-y-3 mb-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <span className="font-semibold text-gray-800">{profile.name}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {YEAR_GROUP_LABELS[profile.yearGroup].label}
                  </span>
                </div>
                <button
                  onClick={() => onEditProfile(profile.id)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onAddChild}
            className="w-full p-4 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl text-gray-600 hover:text-blue-600 font-semibold transition-all"
          >
            + Add another child
          </button>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">About</h2>

          <p className="text-gray-600 mb-6">
            Your data is stored on this device only. We never see any of it.
          </p>

          {showDeleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-medium mb-3">
                Are you sure? This will delete all profiles and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Yes, delete all
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
              onClick={handleDeleteAllData}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Delete all data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
