import { useState, useEffect, useRef } from 'react';
import { useStorage } from './hooks/useStorage';
import { PrivacyNotice } from './components/Onboarding/PrivacyNotice';
import { ProfileSetup } from './components/ProfileSetup';
import { WhoIsPlaying } from './components/Onboarding/WhoIsPlaying';
import { GreetingScreen } from './components/Onboarding/GreetingScreen';
import { ThemeSelection } from './components/ThemeSelection/ThemeSelection';
import { ParentGuideScreen } from './components/ParentGuide/ParentGuideScreen';
import { ParentMode } from './components/Settings/ParentMode';
import { EditProfile } from './components/Settings/EditProfile';
import { SessionScreen } from './components/SessionScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { LabSessionPreview } from './components/LabSessionPreview';
import type { Theme, YearGroup, PhonicsPhase } from './types/profile';

type Screen =
  | 'privacy-notice'
  | 'welcome'
  | 'add-child'
  | 'who-is-playing'
  | 'theme-selection'
  | 'loading'
  | 'parent-guide'
  | 'session'
  | 'parent-mode'
  | 'edit-profile';

function App() {
  const {
    profiles,
    hasSeenPrivacyNotice,
    getActiveProfile,
    getProfileById,
    markPrivacyNoticeSeen,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    setProfileTheme,
    markGuideAsSeen,
    updateReadingAids,
    deleteAllData,
  } = useStorage();

  const [currentScreen, setCurrentScreen] = useState<Screen>('privacy-notice');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  // Where to go after the loading screen finishes
  const pendingAfterLoad = useRef<Screen>('session');

  // Determine initial screen based on storage state
  useEffect(() => {
    if (!hasSeenPrivacyNotice) {
      setCurrentScreen('privacy-notice');
    } else if (profiles.length === 0) {
      setCurrentScreen('welcome');
    } else if (profiles.length === 1) {
      // Auto-select single profile and go to theme selection
      setActiveProfile(profiles[0].id);
      setCurrentScreen('theme-selection');
    } else {
      setCurrentScreen('who-is-playing');
    }
  }, []); // Only run on mount

  const handlePrivacyAccept = () => {
    markPrivacyNoticeSeen();
    setCurrentScreen('welcome');
  };

  const handleWelcomeContinue = () => {
    setCurrentScreen('add-child');
  };

  const handleAddChild = (profileData: {
    name: string;
    yearGroup: YearGroup;
    phonicsPhase: PhonicsPhase;
    includedPhases: PhonicsPhase[];
  }) => {
    addProfile(profileData);
    setCurrentScreen('theme-selection');
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfile(id);
    setCurrentScreen('theme-selection');
  };

  const handleSelectTheme = (theme: Theme) => {
    const profile = getActiveProfile();
    if (profile) {
      setProfileTheme(profile.id, theme);
    }
    // Show the loading screen, then continue to the right destination
    pendingAfterLoad.current =
      profile && !profile.hasSeenParentGuide ? 'parent-guide' : 'session';
    setCurrentScreen('loading');
  };

  // Hold on the loading screen for a beat, then proceed
  useEffect(() => {
    if (currentScreen !== 'loading') return;
    const t = setTimeout(() => setCurrentScreen(pendingAfterLoad.current), 3000);
    return () => clearTimeout(t);
  }, [currentScreen]);

  const handleGuideComplete = () => {
    const profile = getActiveProfile();
    if (profile) {
      markGuideAsSeen(profile.id);
    }
    setCurrentScreen('session');
  };

  const handleOpenSettings = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('parent-mode');
  };

  const handleReturnToSession = () => {
    if (previousScreen === 'session') {
      setCurrentScreen('session');
      setPreviousScreen(null);
    }
  };

  const handleBackFromSettings = () => {
    // Recalculate the correct screen based on current state
    if (profiles.length === 0) {
      setCurrentScreen('add-child');
    } else if (profiles.length === 1) {
      setActiveProfile(profiles[0].id);
      setCurrentScreen('theme-selection');
    } else {
      setCurrentScreen('who-is-playing');
    }
  };

  const handleEditProfile = (id: string) => {
    setEditingProfileId(id);
    setCurrentScreen('edit-profile');
  };

  const handleSaveProfile = (
    id: string,
    updates: {
      name: string;
      yearGroup: YearGroup;
      phonicsPhase: PhonicsPhase;
      includedPhases: PhonicsPhase[];
      visualPhonemeMarking: boolean;
    }
  ) => {
    updateProfile(id, updates);
    setCurrentScreen('parent-mode');
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    // If no profiles left, go to add-child
    if (profiles.length <= 1) {
      setCurrentScreen('add-child');
    } else {
      setCurrentScreen('parent-mode');
    }
  };

  const handleDeleteAllData = () => {
    deleteAllData();
    setCurrentScreen('privacy-notice');
  };

  const handleAddChildFromSettings = () => {
    setCurrentScreen('add-child');
  };

  const handleFinishSession = () => {
    // Return to theme selection for same profile
    setCurrentScreen('theme-selection');
  };

  const handleChangeTheme = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('theme-selection');
  };

  const activeProfile = getActiveProfile();

  // Track if we've ever started a session (to keep it mounted)
  const [sessionStarted, setSessionStarted] = useState(false);

  // Track when session starts
  useEffect(() => {
    if (currentScreen === 'session') {
      setSessionStarted(true);
    }
  }, [currentScreen]);

  // Reset session when finishing (going back to theme selection)
  const handleFinishSessionWithReset = () => {
    setSessionStarted(false);
    handleFinishSession();
  };

  // Check if session should stay mounted
  // Keep mounted if: session started AND (showing session OR in settings flow from session)
  const inSettingsFlow = currentScreen === 'parent-mode' || currentScreen === 'edit-profile';
  const keepSessionMounted = sessionStarted && (currentScreen === 'session' || (inSettingsFlow && previousScreen === 'session'));

  // Prototype preview: open http://localhost:5173/#lab to try the Reading Lab
  if (typeof window !== 'undefined' && window.location.hash === '#lab') {
    return <LabSessionPreview />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {currentScreen === 'privacy-notice' && (
        <PrivacyNotice onAccept={handlePrivacyAccept} />
      )}

      {currentScreen === 'add-child' && (
        <ProfileSetup
          onComplete={handleAddChild}
          onOpenSettings={handleOpenSettings}
          showSettingsCog={profiles.length > 0}
        />
      )}

      {currentScreen === 'welcome' && (
        <GreetingScreen onContinue={handleWelcomeContinue} />
      )}

      {currentScreen === 'who-is-playing' && (
        <WhoIsPlaying
          profiles={profiles}
          onSelectProfile={handleSelectProfile}
          onAddChild={handleAddChildFromSettings}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {currentScreen === 'theme-selection' && activeProfile && (
        <ThemeSelection
          childName={activeProfile.name}
          onSelectTheme={handleSelectTheme}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {currentScreen === 'loading' && <LoadingScreen />}

      {currentScreen === 'parent-guide' && (
        <ParentGuideScreen onComplete={handleGuideComplete} />
      )}

      {/* Keep SessionScreen mounted but hidden when going to settings mid-session */}
      {keepSessionMounted && (
        <div className={currentScreen === 'session' ? '' : 'hidden'}>
          <SessionScreen
            onFinish={handleFinishSessionWithReset}
            onOpenSettings={handleOpenSettings}
            onChangeTheme={handleChangeTheme}
            activeProfile={activeProfile}
            onUpdateReadingAids={updateReadingAids}
            onUpdatePhonemeMarking={(id, enabled) => updateProfile(id, { visualPhonemeMarking: enabled })}
            onUpdateTheme={setProfileTheme}
            onUpdateProfile={updateProfile}
          />
        </div>
      )}

      {currentScreen === 'parent-mode' && (
        <ParentMode
          profiles={profiles}
          onBack={handleBackFromSettings}
          onEditProfile={handleEditProfile}
          onAddChild={handleAddChildFromSettings}
          onDeleteAllData={handleDeleteAllData}
          isSessionActive={previousScreen === 'session'}
          onReturnToSession={handleReturnToSession}
        />
      )}

      {currentScreen === 'edit-profile' && editingProfileId && (
        <EditProfile
          profile={getProfileById(editingProfileId)!}
          onSave={handleSaveProfile}
          onDelete={handleDeleteProfile}
          onBack={() => setCurrentScreen('parent-mode')}
        />
      )}
    </div>
  );
}

export default App;
