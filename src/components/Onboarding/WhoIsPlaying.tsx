import { SettingsCog } from '../ui/SettingsCog';
import type { ChildProfile } from '../../types/profile';
import { YEAR_GROUP_LABELS } from '../../types/profile';

interface WhoIsPlayingProps {
  profiles: ChildProfile[];
  onSelectProfile: (id: string) => void;
  onAddChild: () => void;
  onOpenSettings: () => void;
}

export function WhoIsPlaying({
  profiles,
  onSelectProfile,
  onAddChild,
  onOpenSettings,
}: WhoIsPlayingProps) {
  return (
    <div className="min-h-screen bg-[#FFFFCC] flex items-center justify-center p-6">
      <SettingsCog onClick={onOpenSettings} />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Who's playing today?
        </h1>

        <div className="space-y-3 mb-6">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelectProfile(profile.id)}
              className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl text-left transition-all"
            >
              <span className="text-lg font-semibold text-gray-800">
                {profile.name}
              </span>
              <span className="text-gray-500 ml-2">
                ({YEAR_GROUP_LABELS[profile.yearGroup].label})
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onAddChild}
          className="w-full p-4 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl text-gray-600 hover:text-blue-600 font-semibold transition-all"
        >
          + Add another child
        </button>
      </div>
    </div>
  );
}
