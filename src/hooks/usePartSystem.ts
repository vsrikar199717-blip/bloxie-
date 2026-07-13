import { useState, useCallback, useEffect, useRef } from 'react';
import {
  characterFamilies,
  getPartPath,
  getRandomFamily,
} from '../data/partLibrary';
import type { CharacterFamily, PartCategory, FamilyGroup } from '../data/partLibrary';
import type { Theme } from '../types/profile';

export type PartType = 'head' | 'body' | 'arm' | 'leg' | 'accessory';

export interface AwardedPart {
  id: string;
  path: string;
  partType: PartType;
  x: number;
  y: number;
  zIndex: number;
  isPlaced: boolean;
}

function getPartTypeFromPath(path: string): PartType {
  if (path.includes('/heads/')) return 'head';
  if (path.includes('/bodies/')) return 'body';
  if (path.includes('/body-parts/')) return 'arm';
  if (path.includes('/joints/')) return 'leg';
  if (path.includes('/accessories/')) return 'accessory';
  return 'accessory';
}

export interface PartTransform {
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

export const DEFAULT_TRANSFORM: PartTransform = {
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

export interface SessionPartsState {
  currentFamily: CharacterFamily;
  sessionHead: string;
  sessionBody: string;
  bodyPartsPool: string[];
  jointsPool: string[];
  accessoriesPool: string[];
  bodyPartsIndex: number;
  jointsIndex: number;
  accessoriesIndex: number;
  nextRewardStage: 'head' | 'body' | 'bodyPart' | 'joint' | 'accessory';
  accessoriesGivenForRobot: number;
  bodyPartsGivenForRobot: number;
  jointsGivenForRobot: number;
  familiesUsed: string[]; // track used family ids to avoid immediate repeats
}

export type WordPosition = 'phonics' | 'bonus';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const themeToGroup: Record<Theme, FamilyGroup> = {
  robot: 'robots',
  mystical: 'mythical-creatures',
  monster: 'monsters',
};

function getFamiliesForTheme(theme: Theme): CharacterFamily[] {
  const group = themeToGroup[theme];
  return characterFamilies.filter(f => f.group === group);
}

function pickNewFamily(excludeId?: string, theme?: Theme): CharacterFamily {
  if (theme) {
    const families = getFamiliesForTheme(theme);
    const available = excludeId
      ? families.filter(f => f.id !== excludeId)
      : families;
    if (available.length > 0) return pickRandom(available);
    return pickRandom(families);
  }
  return getRandomFamily(excludeId);
}

function initialiseSessionParts(theme: Theme): SessionPartsState {
  const families = getFamiliesForTheme(theme);
  const family = pickRandom(families);
  return {
    currentFamily: family,
    sessionHead: pickRandom(family.parts.heads),
    sessionBody: pickRandom(family.parts.bodies),
    bodyPartsPool: shuffleArray([...family.parts.bodyParts]),
    jointsPool: shuffleArray([...family.parts.joints]),
    accessoriesPool: shuffleArray([...family.parts.accessories]),
    bodyPartsIndex: 0,
    jointsIndex: 0,
    accessoriesIndex: 0,
    nextRewardStage: 'head',
    accessoriesGivenForRobot: 0,
    bodyPartsGivenForRobot: 0,
    jointsGivenForRobot: 0,
    familiesUsed: [family.id],
  };
}

// Switch to a new family, preserving familiesUsed history
function switchToNewFamily(state: SessionPartsState, theme?: Theme): SessionPartsState {
  // Try to avoid the current family; if all have been used, reset tracking
  const excludeId = state.currentFamily.id;
  const newFamily = pickNewFamily(excludeId, theme);
  return {
    currentFamily: newFamily,
    sessionHead: pickRandom(newFamily.parts.heads),
    sessionBody: pickRandom(newFamily.parts.bodies),
    bodyPartsPool: shuffleArray([...newFamily.parts.bodyParts]),
    jointsPool: shuffleArray([...newFamily.parts.joints]),
    accessoriesPool: shuffleArray([...newFamily.parts.accessories]),
    bodyPartsIndex: 0,
    jointsIndex: 0,
    accessoriesIndex: 0,
    nextRewardStage: 'head',
    accessoriesGivenForRobot: 0,
    bodyPartsGivenForRobot: 0,
    jointsGivenForRobot: 0,
    familiesUsed: [...state.familiesUsed, newFamily.id],
  };
}

/** A build restored from a saved session, handed in at mount. */
export interface RestoredParts {
  partsState: SessionPartsState;
  awardedParts: AwardedPart[];
  nextZIndex: number;
}

export function usePartSystem(theme: Theme = 'robot', restored?: RestoredParts) {
  const [partsState, setPartsState] = useState<SessionPartsState>(
    () => restored?.partsState ?? initialiseSessionParts(theme)
  );
  const [awardedParts, setAwardedParts] = useState<AwardedPart[]>(() => restored?.awardedParts ?? []);
  const [nextZIndex, setNextZIndex] = useState(() => restored?.nextZIndex ?? 0);

  // Reset when the theme changes — but not on the very first render, which
  // would throw away a restored build (and, before restore existed, silently
  // re-rolled the random family chosen by the initialiser).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPartsState(initialiseSessionParts(theme));
    setAwardedParts([]);
    setNextZIndex(0);
  }, [theme]);

  // Helper to build path using current family
  const familyPath = useCallback((
    family: CharacterFamily,
    category: PartCategory,
    filename: string
  ) => {
    return getPartPath(family, category, filename);
  }, []);

  // Get next accessory (with wrap-around)
  const getNextAccessory = useCallback((state: SessionPartsState): {
    path: string;
    newState: SessionPartsState
  } => {
    const family = state.currentFamily;
    if (state.accessoriesIndex < state.accessoriesPool.length) {
      return {
        path: familyPath(family, 'accessories', state.accessoriesPool[state.accessoriesIndex]),
        newState: {
          ...state,
          accessoriesIndex: state.accessoriesIndex + 1,
          accessoriesGivenForRobot: state.accessoriesGivenForRobot,
          nextRewardStage: state.nextRewardStage,
        },
      };
    }

    // Accessories exhausted - reshuffle and wrap
    const reshuffled = shuffleArray([...family.parts.accessories]);
    return {
      path: familyPath(family, 'accessories', reshuffled[0]),
      newState: {
        ...state,
        accessoriesPool: reshuffled,
        accessoriesIndex: 1,
        accessoriesGivenForRobot: state.accessoriesGivenForRobot,
        nextRewardStage: state.nextRewardStage,
      },
    };
  }, [familyPath]);

  // Get next body part (with wrap-around)
  const getNextBodyPart = useCallback((state: SessionPartsState): {
    path: string;
    newState: SessionPartsState
  } | null => {
    const family = state.currentFamily;
    if (state.bodyPartsIndex < state.bodyPartsPool.length) {
      return {
        path: familyPath(family, 'bodyParts', state.bodyPartsPool[state.bodyPartsIndex]),
        newState: {
          ...state,
          bodyPartsIndex: state.bodyPartsIndex + 1,
        },
      };
    }
    // Exhausted: reshuffle and take first
    const reshuffled = shuffleArray([...family.parts.bodyParts]);
    return {
      path: familyPath(family, 'bodyParts', reshuffled[0]),
      newState: {
        ...state,
        bodyPartsPool: reshuffled,
        bodyPartsIndex: 1,
      },
    };
  }, [familyPath]);

  // Get next joint (with wrap-around)
  const getNextJoint = useCallback((state: SessionPartsState): {
    path: string;
    newState: SessionPartsState
  } => {
    const family = state.currentFamily;
    if (state.jointsIndex < state.jointsPool.length) {
      return {
        path: familyPath(family, 'joints', state.jointsPool[state.jointsIndex]),
        newState: {
          ...state,
          jointsIndex: state.jointsIndex + 1,
        },
      };
    }
    const reshuffled = shuffleArray([...family.parts.joints]);
    return {
      path: familyPath(family, 'joints', reshuffled[0]),
      newState: {
        ...state,
        jointsPool: reshuffled,
        jointsIndex: 1,
      },
    };
  }, [familyPath]);

  // Get next phonics reward based on looping robot cadence
  const getNextPhonicsReward = useCallback((
    _position: WordPosition,
    state: SessionPartsState
  ): { path: string; newState: SessionPartsState } | null => {
    const family = state.currentFamily;

    switch (state.nextRewardStage) {
      case 'head':
        return {
          path: familyPath(family, 'heads', state.sessionHead),
          newState: { ...state, nextRewardStage: 'body' },
        };
      case 'body':
        return {
          path: familyPath(family, 'bodies', state.sessionBody),
          newState: { ...state, nextRewardStage: 'bodyPart' },
        };
      case 'bodyPart': {
        const bodyPartResult = getNextBodyPart(state);
        if (bodyPartResult) {
          const bodyCount = state.bodyPartsGivenForRobot + 1;
          const shouldShiftToJoint = bodyCount >= 4;
          return {
            path: bodyPartResult.path,
            newState: {
              ...bodyPartResult.newState,
              bodyPartsGivenForRobot: bodyCount,
              nextRewardStage: shouldShiftToJoint ? 'joint' : 'bodyPart',
            },
          };
        }
        // Fallback to accessory if no more body parts
        const result = getNextAccessory(state);
        const accessoriesGiven = state.accessoriesGivenForRobot + 1;
        const shouldReset = accessoriesGiven >= 3;
        const updatedState: SessionPartsState = shouldReset
          ? switchToNewFamily({
              ...result.newState,
              accessoriesGivenForRobot: accessoriesGiven,
            }, theme)
          : {
              ...result.newState,
              accessoriesGivenForRobot: accessoriesGiven,
              bodyPartsGivenForRobot: state.bodyPartsGivenForRobot,
              jointsGivenForRobot: state.jointsGivenForRobot,
              nextRewardStage: 'joint',
            };
        return { path: result.path, newState: updatedState };
      }
      case 'joint': {
        const jointResult = getNextJoint(state);
        const jointsCount = state.jointsGivenForRobot + 1;
        const shouldShiftToAccessory = jointsCount >= 2;
        return {
          path: jointResult.path,
          newState: {
            ...jointResult.newState,
            jointsGivenForRobot: jointsCount,
            nextRewardStage: shouldShiftToAccessory ? 'accessory' : 'joint',
          },
        };
      }
      case 'accessory': {
        const result = getNextAccessory(state);
        const accessoriesGiven = state.accessoriesGivenForRobot + 1;
        const shouldReset = accessoriesGiven >= 3;
        // When resetting, switch to a NEW family
        const updatedState: SessionPartsState = shouldReset
          ? switchToNewFamily(result.newState, theme)
          : {
              ...result.newState,
              accessoriesGivenForRobot: accessoriesGiven,
              bodyPartsGivenForRobot: state.bodyPartsGivenForRobot,
              jointsGivenForRobot: state.jointsGivenForRobot,
              nextRewardStage: 'accessory',
            };
        return { path: result.path, newState: updatedState };
      }
      default:
        return null;
    }
  }, [theme, familyPath, getNextAccessory, getNextBodyPart, getNextJoint]);

  const awardParts = useCallback((position: WordPosition): string[] => {
    const paths: string[] = [];
    let currentState = partsState;

    if (position === 'bonus') {
      // Bonus always awards 3 accessories, then may trigger new family
      for (let i = 0; i < 3; i++) {
        const result = getNextAccessory(currentState);
        paths.push(result.path);
        const accessoriesGiven = currentState.accessoriesGivenForRobot + 1;
        const shouldReset = accessoriesGiven >= 3;
        currentState = shouldReset
          ? switchToNewFamily(result.newState, theme)
          : {
              ...result.newState,
              accessoriesGivenForRobot: accessoriesGiven,
              nextRewardStage: 'accessory',
            };
      }
    } else {
      // Normal phonics word: deliver 1 part
      const result = getNextPhonicsReward(position, currentState);
      if (result) {
        paths.push(result.path);
        currentState = result.newState;
      }
    }

    setPartsState(currentState);

    const newParts: AwardedPart[] = paths.map((path, i) => ({
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
      path,
      partType: getPartTypeFromPath(path),
      x: 0,
      y: 0,
      zIndex: nextZIndex + i,
      isPlaced: false,
    }));

    setAwardedParts(prev => [...prev, ...newParts]);
    setNextZIndex(prev => prev + paths.length);

    return paths;
  }, [partsState, nextZIndex, theme, getNextAccessory, getNextPhonicsReward]);

  // Called when a set is completed (after story) - triggers new family
  const onSetComplete = useCallback(() => {
    setPartsState(prev => switchToNewFamily(prev, theme));
  }, [theme]);

  const placePart = useCallback((id: string, x: number, y: number) => {
    setAwardedParts(prev => prev.map(part =>
      part.id === id
        ? { ...part, x, y, isPlaced: true, zIndex: nextZIndex }
        : part
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const unplacePart = useCallback((id: string) => {
    setAwardedParts(prev => prev.map(part =>
      part.id === id
        ? { ...part, x: 0, y: 0, isPlaced: false }
        : part
    ));
  }, []);

  const movePart = useCallback((id: string, x: number, y: number) => {
    setAwardedParts(prev => prev.map(part =>
      part.id === id
        ? { ...part, x, y, zIndex: nextZIndex }
        : part
    ));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const clearParts = useCallback(() => {
    setAwardedParts([]);
    setNextZIndex(0);
  }, []);

  /** Reset build zone: switch to next unused family (or re-randomize if all used) */
  const resetPartSystem = useCallback(() => {
    setPartsState(prev => switchToNewFamily(prev, theme));
    setAwardedParts([]);
    setNextZIndex(0);
  }, [theme]);

  // Build the full ordered list of parts for the current family, from current position onward.
  // This reads the pools directly so it always matches what will actually be awarded.
  const getUpcomingForCurrentFamily = useCallback((): string[] => {
    const s = partsState;
    const family = s.currentFamily;
    const paths: string[] = [];

    // Walk the cadence from current stage forward
    let stage = s.nextRewardStage;
    let bpGiven = s.bodyPartsGivenForRobot;
    let jGiven = s.jointsGivenForRobot;
    let aGiven = s.accessoriesGivenForRobot;
    let bpIdx = s.bodyPartsIndex;
    let jIdx = s.jointsIndex;
    let aIdx = s.accessoriesIndex;

    const MAX = 12; // cap to prevent infinite loops
    for (let i = 0; i < MAX; i++) {
      switch (stage) {
        case 'head':
          paths.push(familyPath(family, 'heads', s.sessionHead));
          stage = 'body';
          break;
        case 'body':
          paths.push(familyPath(family, 'bodies', s.sessionBody));
          stage = 'bodyPart';
          break;
        case 'bodyPart':
          if (bpIdx < s.bodyPartsPool.length) {
            paths.push(familyPath(family, 'bodyParts', s.bodyPartsPool[bpIdx]));
            bpIdx++;
          }
          bpGiven++;
          if (bpGiven >= 4) stage = 'joint';
          break;
        case 'joint':
          if (jIdx < s.jointsPool.length) {
            paths.push(familyPath(family, 'joints', s.jointsPool[jIdx]));
            jIdx++;
          }
          jGiven++;
          if (jGiven >= 2) stage = 'accessory';
          break;
        case 'accessory':
          if (aIdx < s.accessoriesPool.length) {
            paths.push(familyPath(family, 'accessories', s.accessoriesPool[aIdx]));
            aIdx++;
          }
          aGiven++;
          if (aGiven >= 3) return paths; // family complete, stop
          break;
      }
    }
    return paths;
  }, [partsState, familyPath]);

  return {
    awardedParts,
    awardParts,
    onSetComplete,
    placePart,
    unplacePart,
    movePart,
    clearParts,
    resetPartSystem,
    getUpcomingForCurrentFamily,
    currentCategoryName: partsState.currentFamily.name,
    /** Everything needed to rebuild this exact build after a reload. */
    partsSnapshot: { partsState, awardedParts, nextZIndex },
  };
}
