/**
 * GLIMMER QUEST - Level Configuration
 * 
 * Data-driven level definitions for 50 levels.
 * Each level specifies target score, moves, obstacles, and difficulty.
 * 
 * PHASE 5: Difficulty Tuning Pass
 * ================================
 * Design Philosophy:
 * - Early levels (1-10): Confidence-building, ~100 points/move achievable
 * - Mid levels (11-20): Introduce friction, ~250 points/move target
 * - Hard levels (21-35): Strategic depth, ~500 points/move target
 * - Expert levels (36-49): Mastery required, ~800 points/move target
 * - Master level (50): Final challenge, hard but achievable
 * 
 * Obstacle Caps (to ensure playability):
 * - Max ice: 25%
 * - Max chain: 18%
 * - Max blocker: 8%
 * - Max combined: ~50% (leaves half the board playable)
 */

export const LEVELS = [
  // ============================================
  // WORLD 1: EMERALD GROVE (Levels 1-10)
  // Tutorial / Easy - Learn mechanics, feel successful
  // No obstacles until Level 6, very generous moves
  // ============================================
  {
    level: 1,
    targetScore: 500,
    moves: 40,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'tutorial',
    description: 'Welcome to Glimmer Quest!'
  },
  {
    level: 2,
    targetScore: 800,
    moves: 38,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'tutorial',
    description: 'Match 3 gems to score!'
  },
  {
    level: 3,
    targetScore: 1000,
    moves: 36,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'tutorial',
    description: 'Try matching 4 for special gems!'
  },
  {
    level: 4,
    targetScore: 1200,
    moves: 35,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Cascades give bonus points!'
  },
  {
    level: 5,
    targetScore: 1500,
    moves: 34,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Create combos for multipliers!'
  },
  {
    level: 6,
    targetScore: 1800,
    moves: 33,
    obstacles: { ice: 0.03, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Watch out for ice!'
  },
  {
    level: 7,
    targetScore: 2100,
    moves: 32,
    obstacles: { ice: 0.05, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Ice takes two matches to clear'
  },
  {
    level: 8,
    targetScore: 2400,
    moves: 32,
    obstacles: { ice: 0.06, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'More ice appears!'
  },
  {
    level: 9,
    targetScore: 2800,
    moves: 31,
    obstacles: { ice: 0.07, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Almost to World 2!'
  },
  {
    level: 10,
    targetScore: 3200,
    moves: 30,
    obstacles: { ice: 0.08, chain: 0.02, blocker: 0 },
    difficulty: 'easy',
    description: 'Chains lock gems in place!'
  },

  // ============================================
  // WORLD 2: CRYSTAL CAVES (Levels 11-20)
  // Medium - Introduce challenge, strategic thinking
  // Ice + chains, first blockers at Level 15
  // ============================================
  {
    level: 11,
    targetScore: 3600,
    moves: 30,
    obstacles: { ice: 0.08, chain: 0.03, blocker: 0 },
    difficulty: 'medium',
    description: 'Welcome to Crystal Caves!'
  },
  {
    level: 12,
    targetScore: 4000,
    moves: 29,
    obstacles: { ice: 0.09, chain: 0.04, blocker: 0 },
    difficulty: 'medium',
    description: 'Break chains to free gems'
  },
  {
    level: 13,
    targetScore: 4500,
    moves: 28,
    obstacles: { ice: 0.10, chain: 0.05, blocker: 0 },
    difficulty: 'medium',
    description: 'Plan your moves carefully'
  },
  {
    level: 14,
    targetScore: 5000,
    moves: 28,
    obstacles: { ice: 0.10, chain: 0.06, blocker: 0 },
    difficulty: 'medium',
    description: 'Double chains appear now'
  },
  {
    level: 15,
    targetScore: 5500,
    moves: 27,
    obstacles: { ice: 0.11, chain: 0.06, blocker: 0.01 },
    difficulty: 'medium',
    description: 'Blockers cannot be moved!'
  },
  {
    level: 16,
    targetScore: 6000,
    moves: 27,
    obstacles: { ice: 0.12, chain: 0.07, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Work around the blockers'
  },
  {
    level: 17,
    targetScore: 6500,
    moves: 26,
    obstacles: { ice: 0.12, chain: 0.08, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Use special gems wisely!'
  },
  {
    level: 18,
    targetScore: 7000,
    moves: 26,
    obstacles: { ice: 0.13, chain: 0.08, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Halfway to hard mode!'
  },
  {
    level: 19,
    targetScore: 7500,
    moves: 25,
    obstacles: { ice: 0.14, chain: 0.09, blocker: 0.03 },
    difficulty: 'medium',
    description: 'Almost to Volcanic Peaks!'
  },
  {
    level: 20,
    targetScore: 8000,
    moves: 25,
    obstacles: { ice: 0.14, chain: 0.10, blocker: 0.03 },
    difficulty: 'medium',
    description: 'Crystal Caves conquered!'
  },

  // ============================================
  // WORLD 3: VOLCANIC PEAKS (Levels 21-30)
  // Hard - Real challenge, strategic depth required
  // All obstacle types, moderate density
  // ============================================
  {
    level: 21,
    targetScore: 8500,
    moves: 25,
    obstacles: { ice: 0.14, chain: 0.10, blocker: 0.03 },
    difficulty: 'hard',
    description: 'Welcome to Volcanic Peaks!'
  },
  {
    level: 22,
    targetScore: 9000,
    moves: 24,
    obstacles: { ice: 0.15, chain: 0.10, blocker: 0.03 },
    difficulty: 'hard',
    description: 'The heat is rising!'
  },
  {
    level: 23,
    targetScore: 9500,
    moves: 24,
    obstacles: { ice: 0.15, chain: 0.11, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Every move counts!'
  },
  {
    level: 24,
    targetScore: 10000,
    moves: 24,
    obstacles: { ice: 0.16, chain: 0.11, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Think before you swap'
  },
  {
    level: 25,
    targetScore: 10500,
    moves: 23,
    obstacles: { ice: 0.16, chain: 0.12, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Quarter century milestone!'
  },
  {
    level: 26,
    targetScore: 11000,
    moves: 23,
    obstacles: { ice: 0.17, chain: 0.12, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Lava flows faster'
  },
  {
    level: 27,
    targetScore: 11500,
    moves: 23,
    obstacles: { ice: 0.17, chain: 0.13, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Obstacles multiply!'
  },
  {
    level: 28,
    targetScore: 12000,
    moves: 22,
    obstacles: { ice: 0.18, chain: 0.13, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Precision required'
  },
  {
    level: 29,
    targetScore: 12500,
    moves: 22,
    obstacles: { ice: 0.18, chain: 0.14, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Almost to the citadel!'
  },
  {
    level: 30,
    targetScore: 13000,
    moves: 22,
    obstacles: { ice: 0.19, chain: 0.14, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Volcanic Peaks conquered!'
  },

  // ============================================
  // WORLD 4: FROZEN CITADEL (Levels 31-40)
  // Expert - Mastery, all obstacles, tight but fair
  // Obstacle density plateaus, focus on score
  // ============================================
  {
    level: 31,
    targetScore: 13500,
    moves: 22,
    obstacles: { ice: 0.19, chain: 0.14, blocker: 0.05 },
    difficulty: 'expert',
    description: 'Welcome to the Citadel!'
  },
  {
    level: 32,
    targetScore: 14000,
    moves: 21,
    obstacles: { ice: 0.20, chain: 0.14, blocker: 0.05 },
    difficulty: 'expert',
    description: 'Ice dominates here'
  },
  {
    level: 33,
    targetScore: 14500,
    moves: 21,
    obstacles: { ice: 0.20, chain: 0.15, blocker: 0.06 },
    difficulty: 'expert',
    description: 'Chains bind tightly'
  },
  {
    level: 34,
    targetScore: 15000,
    moves: 21,
    obstacles: { ice: 0.21, chain: 0.15, blocker: 0.06 },
    difficulty: 'expert',
    description: 'Elite players only!'
  },
  {
    level: 35,
    targetScore: 15500,
    moves: 20,
    obstacles: { ice: 0.21, chain: 0.15, blocker: 0.06 },
    difficulty: 'expert',
    description: 'Halfway through expert!'
  },
  {
    level: 36,
    targetScore: 16000,
    moves: 20,
    obstacles: { ice: 0.22, chain: 0.16, blocker: 0.06 },
    difficulty: 'expert',
    description: 'Frozen fortress ahead'
  },
  {
    level: 37,
    targetScore: 16500,
    moves: 20,
    obstacles: { ice: 0.22, chain: 0.16, blocker: 0.06 },
    difficulty: 'expert',
    description: 'Combos are essential!'
  },
  {
    level: 38,
    targetScore: 17000,
    moves: 20,
    obstacles: { ice: 0.23, chain: 0.16, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Special gems save the day'
  },
  {
    level: 39,
    targetScore: 17500,
    moves: 19,
    obstacles: { ice: 0.23, chain: 0.17, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Almost to the stars!'
  },
  {
    level: 40,
    targetScore: 18000,
    moves: 19,
    obstacles: { ice: 0.24, chain: 0.17, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Frozen Citadel conquered!'
  },

  // ============================================
  // WORLD 5: CELESTIAL REALM (Levels 41-50)
  // Master - Final challenge, hard but achievable
  // Obstacle density caps, focus on skillful play
  // ============================================
  {
    level: 41,
    targetScore: 18500,
    moves: 19,
    obstacles: { ice: 0.24, chain: 0.17, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Ascend to the stars!'
  },
  {
    level: 42,
    targetScore: 19000,
    moves: 19,
    obstacles: { ice: 0.24, chain: 0.18, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Celestial beauty surrounds'
  },
  {
    level: 43,
    targetScore: 19500,
    moves: 18,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Starlight guides the way'
  },
  {
    level: 44,
    targetScore: 20000,
    moves: 18,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.07 },
    difficulty: 'expert',
    description: 'Near the summit!'
  },
  {
    level: 45,
    targetScore: 20500,
    moves: 18,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'expert',
    description: 'Five levels remain!'
  },
  {
    level: 46,
    targetScore: 21000,
    moves: 18,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'expert',
    description: 'The final stretch'
  },
  {
    level: 47,
    targetScore: 21500,
    moves: 17,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'master',
    description: 'Almost legendary!'
  },
  {
    level: 48,
    targetScore: 22000,
    moves: 17,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'master',
    description: 'Penultimate challenge'
  },
  {
    level: 49,
    targetScore: 22500,
    moves: 17,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'master',
    description: 'One more to go!'
  },
  {
    level: 50,
    targetScore: 25000,
    moves: 20,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.08 },
    difficulty: 'master',
    description: 'GLIMMER MASTER!'
  }
];

/**
 * Get level configuration by level number
 * Falls back to last level config for levels beyond 50
 */
export const getLevelConfig = (levelNumber) => {
  const index = Math.min(levelNumber - 1, LEVELS.length - 1);
  return LEVELS[Math.max(0, index)];
};

/**
 * Get total number of defined levels
 */
export const getTotalLevels = () => LEVELS.length;

/**
 * World definitions for map progression
 * Each world contains 10 levels
 */
export const WORLDS = [
  {
    id: 1,
    name: 'Emerald Grove',
    levels: [1, 10],
    theme: 'tutorial',
    color: 'emerald',
    icon: '🌲',
    description: 'Begin your journey in the peaceful grove'
  },
  {
    id: 2,
    name: 'Crystal Caves',
    levels: [11, 20],
    theme: 'medium',
    color: 'blue',
    icon: '💎',
    description: 'Venture into the sparkling depths'
  },
  {
    id: 3,
    name: 'Volcanic Peaks',
    levels: [21, 30],
    theme: 'hard',
    color: 'orange',
    icon: '🌋',
    description: 'Brave the fiery mountains'
  },
  {
    id: 4,
    name: 'Frozen Citadel',
    levels: [31, 40],
    theme: 'expert',
    color: 'cyan',
    icon: '🏔️',
    description: 'Conquer the icy fortress'
  },
  {
    id: 5,
    name: 'Celestial Realm',
    levels: [41, 50],
    theme: 'master',
    color: 'purple',
    icon: '✨',
    description: 'Ascend to the stars'
  }
];

/**
 * Get world for a specific level
 */
export const getWorldForLevel = (levelNumber) => {
  return WORLDS.find(w => levelNumber >= w.levels[0] && levelNumber <= w.levels[1]) || WORLDS[0];
};

/**
 * Get levels in a specific world
 */
export const getLevelsInWorld = (worldId) => {
  const world = WORLDS.find(w => w.id === worldId);
  if (!world) return [];
  const levels = [];
  for (let i = world.levels[0]; i <= world.levels[1]; i++) {
    levels.push(getLevelConfig(i));
  }
  return levels;
};

/**
 * Difficulty color mapping for UI
 */
export const DIFFICULTY_COLORS = {
  tutorial: 'text-green-400',
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-orange-500',
  expert: 'text-red-500',
  master: 'text-purple-500'
};

/**
 * Difficulty badge styles
 */
export const DIFFICULTY_BADGES = {
  tutorial: 'bg-green-500/20 text-green-400 border-green-500/40',
  easy: 'bg-green-600/20 text-green-500 border-green-600/40',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40',
  hard: 'bg-orange-500/20 text-orange-500 border-orange-500/40',
  expert: 'bg-red-500/20 text-red-500 border-red-500/40',
  master: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
};

/**
 * World theme colors for map
 */
export const WORLD_COLORS = {
  emerald: {
    bg: 'from-emerald-900/80 to-emerald-950/90',
    node: 'bg-emerald-500',
    path: 'bg-emerald-700',
    glow: 'shadow-emerald-500/50'
  },
  blue: {
    bg: 'from-blue-900/80 to-blue-950/90',
    node: 'bg-blue-500',
    path: 'bg-blue-700',
    glow: 'shadow-blue-500/50'
  },
  orange: {
    bg: 'from-orange-900/80 to-orange-950/90',
    node: 'bg-orange-500',
    path: 'bg-orange-700',
    glow: 'shadow-orange-500/50'
  },
  cyan: {
    bg: 'from-cyan-900/80 to-cyan-950/90',
    node: 'bg-cyan-500',
    path: 'bg-cyan-700',
    glow: 'shadow-cyan-500/50'
  },
  purple: {
    bg: 'from-purple-900/80 to-purple-950/90',
    node: 'bg-purple-500',
    path: 'bg-purple-700',
    glow: 'shadow-purple-500/50'
  }
};
