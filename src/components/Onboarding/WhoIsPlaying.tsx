import { SettingsCog } from '../ui/SettingsCog';
import { OnboardingLayout } from './OnboardingLayout';
import type { ChildProfile } from '../../types/profile';
import { YEAR_GROUP_LABELS } from '../../types/profile';
import './whoIsPlaying.css';

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
    <OnboardingLayout>
      <SettingsCog onClick={onOpenSettings} />

      <div className="who-step">
        <div className="who-heading">
          <h1 className="font-display">Who's playing today?</h1>
          <p className="subtext">Tap your name to start reading.</p>
        </div>

        <div className="who-cards">
          {profiles.map((profile) => {
            const year = YEAR_GROUP_LABELS[profile.yearGroup];

            return (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className="who-card"
              >
                <div className="who-card-content">
                  <p className="name font-display">{profile.name}</p>
                  <p className="year">
                    {year.label} · {year.ageRange}
                  </p>
                </div>

                <svg
                  className="who-card-chevron"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>

        <button onClick={onAddChild} className="who-add">
          + Add another child
        </button>
      </div>
    </OnboardingLayout>
  );
}
