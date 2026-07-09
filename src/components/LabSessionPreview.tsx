import { useState } from 'react';
import { SessionScreen } from './SessionScreen';
import { ColorPicker } from './ColorPicker';
import type { ChildProfile } from '../types/profile';

/**
 * Standalone preview of the full session (Lab reading + real building + story +
 * bonus + summary + aids) using an in-memory dummy profile, so /#lab is playable
 * without going through onboarding. The real app flow is untouched.
 */
const DUMMY_PROFILE: ChildProfile = {
  id: 'lab-preview',
  name: 'Mia',
  yearGroup: 'Year1',
  phonicsPhase: 3,
  includedPhases: [2, 3],
  createdAt: new Date().toISOString(),
  lastPlayed: new Date().toISOString(),
  preferredTheme: 'robot',
  readingAids: { lightbox: false, ruler: false },
  enabledSounds: [],
  parentOverride: false,
  visualPhonemeMarking: true,
  hasSeenParentGuide: true,
  wordHistory: [],
};

export function LabSessionPreview() {
  const [profile, setProfile] = useState<ChildProfile>(DUMMY_PROFILE);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const update = (updates: Partial<ChildProfile>) =>
    setProfile((p) => ({ ...p, ...updates }));

  // Choose a reading colour before the game starts
  if (!bgColor) {
    return <ColorPicker onChoose={setBgColor} />;
  }

  return (
    <SessionScreen
      bgColor={bgColor}
      activeProfile={profile}
      onFinish={() => window.location.reload()}
      onOpenSettings={() => {}}
      onChangeTheme={() => {}}
      onUpdateReadingAids={(_id, aids) => update({ readingAids: aids })}
      onUpdatePhonemeMarking={(_id, enabled) => update({ visualPhonemeMarking: enabled })}
      onUpdateTheme={(_id, theme) => update({ preferredTheme: theme })}
      onUpdateProfile={(_id, updates) => update(updates)}
    />
  );
}
