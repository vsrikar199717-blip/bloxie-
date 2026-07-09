export type PartCategory = 'heads' | 'bodies' | 'bodyParts' | 'joints' | 'accessories';
export type FamilyGroup = 'robots' | 'mythical-creatures' | 'monsters';

export interface FamilyParts {
  heads: string[];
  bodies: string[];
  bodyParts: string[];
  joints: string[];
  accessories: string[];
}

export interface CharacterFamily {
  id: string;
  name: string;
  group: FamilyGroup;
  basePath: string; // e.g. '/assets/parts/robots/original'
  parts: FamilyParts;
}

function generateFiles(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${i + 1}.svg`);
}

export const characterFamilies: CharacterFamily[] = [
  // ===== ROBOTS =====
  {
    id: 'robot-original',
    name: 'Original Robot',
    group: 'robots',
    basePath: '/assets/parts/robots/original',
    parts: {
      heads: generateFiles(9),
      bodies: generateFiles(9),
      bodyParts: generateFiles(17),
      joints: generateFiles(9),
      accessories: [
        '1.svg', '2.svg', '3.svg', '4.svg', '5.svg',
        '7.svg', '8.svg', '9.svg', '10.svg', '11.svg',
        '12.svg', '13.svg', '14.svg', '15.svg', '16.svg',
        '17.svg', '18.svg', '19.svg', '20.svg', '21.svg',
        '22.svg', '23.svg', '24.svg', '25.svg',
      ],
    },
  },
  {
    id: 'robot-bot-2',
    name: 'Bot 2',
    group: 'robots',
    basePath: '/assets/parts/robots/bot-2',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(4),
      bodyParts: generateFiles(6),
      joints: generateFiles(5),
      accessories: generateFiles(4),
    },
  },
  {
    id: 'robot-toy',
    name: 'Toy Robot',
    group: 'robots',
    basePath: '/assets/parts/robots/toy',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(4),
      bodyParts: generateFiles(6),
      joints: generateFiles(5),
      accessories: generateFiles(3),
    },
  },
  {
    id: 'robot-household',
    name: 'Household Robot',
    group: 'robots',
    basePath: '/assets/parts/robots/household',
    parts: {
      heads: generateFiles(14),
      bodies: generateFiles(20),
      bodyParts: generateFiles(38),
      joints: generateFiles(14),
      accessories: generateFiles(28),
    },
  },

  // ===== MYTHICAL CREATURES =====
  {
    id: 'mythical-dragon',
    name: 'Dragon',
    group: 'mythical-creatures',
    basePath: '/assets/parts/mythical-creatures/dragon',
    parts: {
      heads: generateFiles(3),
      bodies: generateFiles(4),
      bodyParts: generateFiles(4),
      joints: generateFiles(4),
      accessories: generateFiles(7),
    },
  },
  {
    id: 'mythical-mermaids',
    name: 'Mermaids',
    group: 'mythical-creatures',
    basePath: '/assets/parts/mythical-creatures/mermaids',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(5),
      bodyParts: generateFiles(5),
      joints: generateFiles(5),
      accessories: generateFiles(5),
    },
  },
  {
    id: 'mythical-phoenix',
    name: 'Phoenix',
    group: 'mythical-creatures',
    basePath: '/assets/parts/mythical-creatures/phoenix',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(4),
      bodyParts: generateFiles(4),
      joints: generateFiles(6),
      accessories: generateFiles(5),
    },
  },

  // ===== MONSTERS =====
  {
    id: 'monster-chaos-core',
    name: 'Chaos Core',
    group: 'monsters',
    basePath: '/assets/parts/monsters/chaos-core',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(4),
      bodyParts: generateFiles(4),
      joints: generateFiles(5),
      accessories: generateFiles(6),
    },
  },
  {
    id: 'monster-ghosts',
    name: 'Ghosts',
    group: 'monsters',
    basePath: '/assets/parts/monsters/ghosts',
    parts: {
      heads: generateFiles(6),
      bodies: generateFiles(5),
      bodyParts: generateFiles(6),
      joints: generateFiles(7),
      accessories: generateFiles(5),
    },
  },
  {
    id: 'monster-weird-biology',
    name: 'Weird Biology',
    group: 'monsters',
    basePath: '/assets/parts/monsters/weird-biology',
    parts: {
      heads: generateFiles(4),
      bodies: generateFiles(4),
      bodyParts: generateFiles(7),
      joints: generateFiles(4),
      accessories: generateFiles(5),
    },
  },
];

// Legacy flat interface for backwards compat during transition
export interface PartLibrary {
  heads: string[];
  bodies: string[];
  arms: string[];
  legs: string[];
  accessories: string[];
}

// Helper to get full path for a part within a family
export function getPartPath(
  family: CharacterFamily,
  category: PartCategory,
  filename: string
): string {
  const categoryPaths: Record<PartCategory, string> = {
    heads: '/heads/',
    bodies: '/bodies/',
    bodyParts: '/body-parts/',
    joints: '/joints/',
    accessories: '/accessories/',
  };
  return `${family.basePath}${categoryPaths[category]}${filename}`;
}

// Get a random family, optionally excluding one by id
export function getRandomFamily(excludeId?: string): CharacterFamily {
  const available = excludeId
    ? characterFamilies.filter(f => f.id !== excludeId)
    : characterFamilies;
  return available[Math.floor(Math.random() * available.length)];
}
