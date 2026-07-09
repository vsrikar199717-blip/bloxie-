import { useState, useCallback, useEffect } from 'react';
import type {
  AppStorage,
  ChildProfile,
  YearGroup,
  PhonicsPhase,
  Theme,
  ReadingAge,
} from '../types/profile';
import { getDefaultReadingAids } from '../types/profile';

const STORAGE_KEY = 'robot-reading-data';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Migration: Convert old readingAge to new yearGroup/phonicsPhase system
function migrateReadingAgeToYearGroup(readingAge: ReadingAge): {
  yearGroup: YearGroup;
  phonicsPhase: PhonicsPhase;
  includedPhases: PhonicsPhase[];
} {
  switch (readingAge) {
    case 'age4-5':
      return { yearGroup: 'Reception', phonicsPhase: 2, includedPhases: [2] };
    case 'age5-6':
      return { yearGroup: 'Year1', phonicsPhase: 5, includedPhases: [5] };
    case 'age6-7':
      return { yearGroup: 'Year2', phonicsPhase: 5, includedPhases: [2, 3, 4, 5] };
    case 'age7-8':
    case 'age8-9':
    case 'age9-10':
    case 'age10-11':
      // Older ages default to Year 2 with all phases
      return { yearGroup: 'Year2', phonicsPhase: 5, includedPhases: [2, 3, 4, 5] };
    default:
      return { yearGroup: 'Reception', phonicsPhase: 2, includedPhases: [2] };
  }
}

// Migrate a single profile from old format to new format
function migrateProfile(profile: any): ChildProfile {
  // If profile already has yearGroup, it's already migrated
  if (profile.yearGroup) {
    // Ensure all new fields exist with defaults
    return {
      ...profile,
      readingAids: profile.readingAids || getDefaultReadingAids(),
      enabledSounds: profile.enabledSounds || [],
      parentOverride: profile.parentOverride ?? false,
      visualPhonemeMarking: profile.visualPhonemeMarking ?? true,
      hasSeenParentGuide: profile.hasSeenParentGuide ?? false,
      wordHistory: (profile.wordHistory ?? []).map((a: any) => ({
        ...a,
        id: a.id ?? crypto.randomUUID(),
      })),
    };
  }

  // Migrate from old readingAge format
  const { yearGroup, phonicsPhase, includedPhases } = migrateReadingAgeToYearGroup(
    profile.readingAge || 'age4-5'
  );

  return {
    id: profile.id,
    name: profile.name,
    yearGroup,
    phonicsPhase,
    includedPhases,
    createdAt: profile.createdAt,
    lastPlayed: profile.lastPlayed,
    preferredTheme: profile.preferredTheme,
    progress: profile.progress,
    readingAids: getDefaultReadingAids(),
    enabledSounds: [],
    parentOverride: false,
    visualPhonemeMarking: true,
    hasSeenParentGuide: false,
    wordHistory: [],
  };
}

function loadStorage(): AppStorage | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Migrate all profiles
    const migratedProfiles = (parsed.profiles || []).map(migrateProfile);

    return {
      ...parsed,
      profiles: migratedProfiles,
    };
  } catch {
    return null;
  }
}

function saveStorage(storage: AppStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function getDefaultStorage(): AppStorage {
  return {
    profiles: [],
    activeProfileId: null,
    hasSeenPrivacyNotice: false,
  };
}

export interface AddProfileParams {
  name: string;
  yearGroup: YearGroup;
  phonicsPhase: PhonicsPhase;
  includedPhases: PhonicsPhase[];
}

export function useStorage() {
  const [storage, setStorage] = useState<AppStorage>(() => {
    return loadStorage() || getDefaultStorage();
  });

  // Persist to localStorage whenever storage changes
  useEffect(() => {
    saveStorage(storage);
  }, [storage]);

  const markPrivacyNoticeSeen = useCallback(() => {
    setStorage((prev) => ({
      ...prev,
      hasSeenPrivacyNotice: true,
    }));
  }, []);

  const addProfile = useCallback(
    ({ name, yearGroup, phonicsPhase, includedPhases }: AddProfileParams): ChildProfile => {
      const profile: ChildProfile = {
        id: generateUUID(),
        name: name.trim(),
        yearGroup,
        phonicsPhase,
        includedPhases,
        createdAt: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        readingAids: getDefaultReadingAids(),
        enabledSounds: [],
        parentOverride: false,
        visualPhonemeMarking: true,
        hasSeenParentGuide: false,
        wordHistory: [],
      };

      setStorage((prev) => ({
        ...prev,
        profiles: [...prev.profiles, profile],
        activeProfileId: profile.id,
      }));

      return profile;
    },
    []
  );

  const updateProfile = useCallback(
    (id: string, updates: Partial<Omit<ChildProfile, 'id' | 'createdAt'>>) => {
      setStorage((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === id
            ? {
                ...p,
                ...updates,
                lastPlayed: new Date().toISOString(),
              }
            : p
        ),
      }));
    },
    []
  );

  const deleteProfile = useCallback((id: string) => {
    setStorage((prev) => {
      const newProfiles = prev.profiles.filter((p) => p.id !== id);
      return {
        ...prev,
        profiles: newProfiles,
        activeProfileId:
          prev.activeProfileId === id ? newProfiles[0]?.id || null : prev.activeProfileId,
      };
    });
  }, []);

  const setActiveProfile = useCallback((id: string) => {
    setStorage((prev) => ({
      ...prev,
      activeProfileId: id,
    }));
  }, []);

  const setProfileTheme = useCallback(
    (id: string, theme: Theme) => {
      updateProfile(id, { preferredTheme: theme });
    },
    [updateProfile]
  );

  const markGuideAsSeen = useCallback(
    (id: string) => {
      updateProfile(id, { hasSeenParentGuide: true });
    },
    [updateProfile]
  );

  const updateReadingAids = useCallback(
    (id: string, readingAids: { lightbox: boolean; ruler: boolean }) => {
      updateProfile(id, { readingAids });
    },
    [updateProfile]
  );

  const deleteAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStorage(getDefaultStorage());
  }, []);

  const getActiveProfile = useCallback((): ChildProfile | null => {
    if (!storage.activeProfileId) return null;
    return storage.profiles.find((p) => p.id === storage.activeProfileId) || null;
  }, [storage]);

  const getProfileById = useCallback(
    (id: string): ChildProfile | null => {
      return storage.profiles.find((p) => p.id === id) || null;
    },
    [storage.profiles]
  );

  return {
    storage,
    profiles: storage.profiles,
    activeProfileId: storage.activeProfileId,
    hasSeenPrivacyNotice: storage.hasSeenPrivacyNotice,
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
  };
}
