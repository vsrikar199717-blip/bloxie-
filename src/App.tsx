import { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom';
import { useStorage } from './hooks/useStorage';
import { IntroScreen } from './components/Onboarding/IntroScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { WhoIsPlaying } from './components/Onboarding/WhoIsPlaying';
import { ThemeSelection } from './components/ThemeSelection/ThemeSelection';
import { ParentMode } from './components/Settings/ParentMode';
import { EditProfile } from './components/Settings/EditProfile';
import { SessionScreen } from './components/SessionScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ColorPicker } from './components/ColorPicker';
import { LabSessionPreview } from './components/LabSessionPreview';
import type { Theme, YearGroup, PhonicsPhase } from './types/profile';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

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
    updateReadingAids,
    deleteAllData,
  } = useStorage();

  // Where the user came from when they opened settings (to return to a session)
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  // Where to go after the loading screen finishes
  const pendingAfterLoad = useRef<string>('/session');

  const activeProfile = getActiveProfile();

  // ---- navigation handlers ----
  const handlePrivacyAccept = () => {
    markPrivacyNoticeSeen();
    navigate('/setup');
  };

  const handleAddChild = (profileData: {
    name: string;
    yearGroup: YearGroup;
    phonicsPhase: PhonicsPhase;
    includedPhases: PhonicsPhase[];
  }) => {
    addProfile(profileData);
    navigate('/theme');
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfile(id);
    navigate('/theme');
  };

  const handleSelectTheme = (theme: Theme) => {
    const profile = getActiveProfile();
    if (profile) setProfileTheme(profile.id, theme);
    // First-timers are guided by the in-dashboard walkthrough, not a separate screen
    pendingAfterLoad.current = '/session';
    // Ask for a reading colour once; after that it's remembered on the profile
    navigate(profile?.readingColor ? '/loading' : '/colour');
  };

  const handleChooseColor = (hex: string) => {
    const profile = getActiveProfile();
    if (profile) updateProfile(profile.id, { readingColor: hex });
    pendingAfterLoad.current = '/session';
    navigate('/loading');
  };

  // Hold on the loading screen for a beat, then proceed
  useEffect(() => {
    if (path !== '/loading') return;
    const t = setTimeout(() => navigate(pendingAfterLoad.current, { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [path, navigate]);

  const handleOpenSettings = () => {
    setPreviousPath(path);
    navigate('/parent');
  };

  const handleReturnToSession = () => {
    if (previousPath === '/session') {
      setPreviousPath(null);
      navigate('/session');
    }
  };

  const handleBackFromSettings = () => {
    if (profiles.length === 0) navigate('/setup');
    else if (profiles.length === 1) {
      setActiveProfile(profiles[0].id);
      navigate('/theme');
    } else navigate('/who');
  };

  const handleEditProfile = (id: string) => navigate(`/edit/${id}`);

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
    navigate('/parent');
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id);
    navigate(profiles.length <= 1 ? '/setup' : '/parent');
  };

  const handleDeleteAllData = () => {
    deleteAllData();
    navigate('/welcome');
  };

  const handleAddChildFromSettings = () => navigate('/setup');

  const handleChangeTheme = () => {
    setPreviousPath(path);
    navigate('/theme');
  };

  // ---- keep the session mounted while in settings, so the build isn't lost ----
  const [sessionStarted, setSessionStarted] = useState(false);
  const onSession = path === '/session';
  const inSettingsFlow = path === '/parent' || path.startsWith('/edit');

  useEffect(() => {
    if (onSession) setSessionStarted(true);
  }, [onSession]);

  const handleFinishSession = () => {
    setSessionStarted(false);
    navigate('/theme');
  };

  const keepSessionMounted =
    !!activeProfile &&
    (onSession || (sessionStarted && inSettingsFlow && previousPath === '/session'));

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Persistent session (hidden while in settings) */}
      {keepSessionMounted && (
        <div className={onSession ? '' : 'hidden'}>
          <SessionScreen
            bgColor={activeProfile.readingColor ?? '#FBF1BE'}
            onFinish={handleFinishSession}
            onOpenSettings={handleOpenSettings}
            onChangeTheme={handleChangeTheme}
            activeProfile={activeProfile}
            onUpdateReadingAids={updateReadingAids}
            onUpdatePhonemeMarking={(id, enabled) =>
              updateProfile(id, { visualPhonemeMarking: enabled })
            }
            onUpdateTheme={setProfileTheme}
            onUpdateProfile={updateProfile}
          />
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <IndexRedirect
              hasSeenPrivacyNotice={hasSeenPrivacyNotice}
              profileCount={profiles.length}
              firstProfileId={profiles[0]?.id}
              setActiveProfile={setActiveProfile}
            />
          }
        />

        {/* Intro: "Hey there" → "Welcome to Bloxie" in one continuous screen */}
        <Route path="/welcome" element={<IntroScreen onAccept={handlePrivacyAccept} />} />
        <Route path="/privacy" element={<Navigate to="/welcome" replace />} />

        <Route
          path="/setup"
          element={
            <ProfileSetup
              onComplete={handleAddChild}
              onOpenSettings={handleOpenSettings}
              showSettingsCog={profiles.length > 0}
            />
          }
        />

        <Route
          path="/who"
          element={
            <WhoIsPlaying
              profiles={profiles}
              onSelectProfile={handleSelectProfile}
              onAddChild={handleAddChildFromSettings}
              onOpenSettings={handleOpenSettings}
            />
          }
        />

        <Route
          path="/theme"
          element={
            activeProfile ? (
              <ThemeSelection
                childName={activeProfile.name}
                onSelectTheme={handleSelectTheme}
                onOpenSettings={handleOpenSettings}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Pick a reading colour once, before the first game */}
        <Route
          path="/colour"
          element={
            activeProfile ? (
              <ColorPicker onChoose={handleChooseColor} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="/loading" element={<LoadingScreen />} />

        {/* Rendered by the persistent block above */}
        <Route path="/session" element={activeProfile ? null : <Navigate to="/" replace />} />

        <Route
          path="/parent"
          element={
            <ParentMode
              profiles={profiles}
              onBack={handleBackFromSettings}
              onEditProfile={handleEditProfile}
              onAddChild={handleAddChildFromSettings}
              onDeleteAllData={handleDeleteAllData}
              isSessionActive={previousPath === '/session'}
              onReturnToSession={handleReturnToSession}
            />
          }
        />

        <Route
          path="/edit/:id"
          element={
            <EditProfileRoute
              getProfileById={getProfileById}
              onSave={handleSaveProfile}
              onDelete={handleDeleteProfile}
              onBack={() => navigate('/parent')}
            />
          }
        />

        {/* Reading Lab prototype */}
        <Route path="/lab" element={<LabSessionPreview />} />

        {/* Anything unknown → start */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/** Decides the first screen based on saved data. */
function IndexRedirect({
  hasSeenPrivacyNotice,
  profileCount,
  firstProfileId,
  setActiveProfile,
}: {
  hasSeenPrivacyNotice: boolean;
  profileCount: number;
  firstProfileId?: string;
  setActiveProfile: (id: string) => void;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasSeenPrivacyNotice) navigate('/welcome', { replace: true });
    else if (profileCount === 0) navigate('/setup', { replace: true });
    else if (profileCount === 1 && firstProfileId) {
      setActiveProfile(firstProfileId);
      navigate('/theme', { replace: true });
    } else navigate('/who', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Reads :id from the URL and loads that profile. */
function EditProfileRoute({
  getProfileById,
  onSave,
  onDelete,
  onBack,
}: {
  getProfileById: (id: string) => ReturnType<typeof useStorage>['profiles'][number] | null;
  onSave: Parameters<typeof EditProfile>[0]['onSave'];
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const { id } = useParams();
  const profile = id ? getProfileById(id) : null;
  if (!profile) return <Navigate to="/parent" replace />;
  return <EditProfile profile={profile} onSave={onSave} onDelete={onDelete} onBack={onBack} />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}
