/**
 * GLIMMER QUEST - Level Configuration
 * 
 * Data-driven level definitions for 50 levels.
 * Each level specifies target score, moves, obstacles, and difficulty.
 * 
 * Difficulty Progression:
 * - Levels 1-10:  Tutorial/Easy (no/minimal obstacles, generous moves)
 * - Levels 11-20: Medium (ice introduced, chains appear)
 * - Levels 21-35: Hard (more obstacles, blockers introduced, tighter moves)
 * - Levels 36-50: Expert (all obstacles, high targets, demanding)
 */

export const LEVELS = [
  // ============================================
  // TUTORIAL / EASY (Levels 1-10)
  // Focus: Learn mechanics, feel successful
  // ============================================
  {
    level: 1,
    targetScore: 800,
    moves: 35,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'tutorial',
    description: 'Welcome to Glimmer Quest!'
  },
  {
    level: 2,
    targetScore: 1200,
    moves: 35,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'tutorial',
    description: 'Match gems to score!'
  },
  {
    level: 3,
    targetScore: 1500,
    moves: 32,
    obstacles: { ice: 0, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Try matching 4 for special gems!'
  },
  {
    level: 4,
    targetScore: 1800,
    moves: 32,
    obstacles: { ice: 0.03, chain: 0, blocker: 0 }, // First ice (3%)
    difficulty: 'easy',
    description: 'Watch out for ice!'
  },
  {
    level: 5,
    targetScore: 2200,
    moves: 30,
    obstacles: { ice: 0.05, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Ice takes two matches to clear'
  },
  {
    level: 6,
    targetScore: 2600,
    moves: 30,
    obstacles: { ice: 0.06, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'More ice appears!'
  },
  {
    level: 7,
    targetScore: 3000,
    moves: 30,
    obstacles: { ice: 0.08, chain: 0, blocker: 0 },
    difficulty: 'easy',
    description: 'Create cascades for bonus points!'
  },
  {
    level: 8,
    targetScore: 3500,
    moves: 28,
    obstacles: { ice: 0.08, chain: 0.02, blocker: 0 }, // First chains (2%)
    difficulty: 'easy',
    description: 'Chains lock gems in place'
  },
  {
    level: 9,
    targetScore: 4000,
    moves: 28,
    obstacles: { ice: 0.08, chain: 0.03, blocker: 0 },
    difficulty: 'easy',
    description: 'Break chains to free gems!'
  },
  {
    level: 10,
    targetScore: 4500,
    moves: 28,
    obstacles: { ice: 0.10, chain: 0.04, blocker: 0 },
    difficulty: 'easy',
    description: 'First milestone reached!'
  },

  // ============================================
  // MEDIUM (Levels 11-20)
  // Focus: Introduce challenge, strategic thinking
  // ============================================
  {
    level: 11,
    targetScore: 5000,
    moves: 28,
    obstacles: { ice: 0.10, chain: 0.05, blocker: 0 },
    difficulty: 'medium',
    description: 'Things are heating up!'
  },
  {
    level: 12,
    targetScore: 5500,
    moves: 27,
    obstacles: { ice: 0.12, chain: 0.05, blocker: 0 },
    difficulty: 'medium',
    description: 'Plan your moves carefully'
  },
  {
    level: 13,
    targetScore: 6000,
    moves: 27,
    obstacles: { ice: 0.12, chain: 0.06, blocker: 0.01 }, // First blockers (1%)
    difficulty: 'medium',
    description: 'Blockers cannot be moved!'
  },
  {
    level: 14,
    targetScore: 6500,
    moves: 26,
    obstacles: { ice: 0.12, chain: 0.06, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Work around the blockers'
  },
  {
    level: 15,
    targetScore: 7000,
    moves: 26,
    obstacles: { ice: 0.14, chain: 0.07, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Halfway to twenty!'
  },
  {
    level: 16,
    targetScore: 7500,
    moves: 25,
    obstacles: { ice: 0.14, chain: 0.08, blocker: 0.02 },
    difficulty: 'medium',
    description: 'Double chains appear now'
  },
  {
    level: 17,
    targetScore: 8000,
    moves: 25,
    obstacles: { ice: 0.15, chain: 0.08, blocker: 0.03 },
    difficulty: 'medium',
    description: 'Use special gems wisely!'
  },
  {
    level: 18,
    targetScore: 8500,
    moves: 25,
    obstacles: { ice: 0.15, chain: 0.10, blocker: 0.03 },
    difficulty: 'medium',
    description: 'Chains are getting stronger'
  },
  {
    level: 19,
    targetScore: 9000,
    moves: 24,
    obstacles: { ice: 0.16, chain: 0.10, blocker: 0.03 },
    difficulty: 'medium',
    description: 'Almost to hard mode!'
  },
  {
    level: 20,
    targetScore: 10000,
    moves: 24,
    obstacles: { ice: 0.18, chain: 0.10, blocker: 0.04 },
    difficulty: 'medium',
    description: 'Second milestone reached!'
  },

  // ============================================
  // HARD (Levels 21-35)
  // Focus: Real challenge, strategic depth required
  // ============================================
  {
    level: 21,
    targetScore: 11000,
    moves: 24,
    obstacles: { ice: 0.18, chain: 0.12, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Welcome to hard mode!'
  },
  {
    level: 22,
    targetScore: 12000,
    moves: 23,
    obstacles: { ice: 0.20, chain: 0.12, blocker: 0.04 },
    difficulty: 'hard',
    description: 'Ice is everywhere!'
  },
  {
    level: 23,
    targetScore: 13000,
    moves: 23,
    obstacles: { ice: 0.20, chain: 0.14, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Chains bind tightly'
  },
  {
    level: 24,
    targetScore: 14000,
    moves: 22,
    obstacles: { ice: 0.22, chain: 0.14, blocker: 0.05 },
    difficulty: 'hard',
    description: 'Every move counts!'
  },
  {
    level: 25,
    targetScore: 15000,
    moves: 22,
    obstacles: { ice: 0.22, chain: 0.15, blocker: 0.06 },
    difficulty: 'hard',
    description: 'Quarter century level!'
  },
  {
    level: 26,
    targetScore: 16000,
    moves: 22,
    obstacles: { ice: 0.24, chain: 0.15, blocker: 0.06 },
    difficulty: 'hard',
    description: 'Frosty challenge ahead'
  },
  {
    level: 27,
    targetScore: 17000,
    moves: 21,
    obstacles: { ice: 0.24, chain: 0.16, blocker: 0.06 },
    difficulty: 'hard',
    description: 'Think before you swap'
  },
  {
    level: 28,
    targetScore: 18000,
    moves: 21,
    obstacles: { ice: 0.25, chain: 0.16, blocker: 0.07 },
    difficulty: 'hard',
    description: 'Obstacles multiply!'
  },
  {
    level: 29,
    targetScore: 19000,
    moves: 20,
    obstacles: { ice: 0.25, chain: 0.18, blocker: 0.07 },
    difficulty: 'hard',
    description: 'Fewer moves now!'
  },
  {
    level: 30,
    targetScore: 20000,
    moves: 20,
    obstacles: { ice: 0.26, chain: 0.18, blocker: 0.08 },
    difficulty: 'hard',
    description: 'Third milestone reached!'
  },
  {
    level: 31,
    targetScore: 21000,
    moves: 20,
    obstacles: { ice: 0.26, chain: 0.20, blocker: 0.08 },
    difficulty: 'hard',
    description: 'Chains dominate the board'
  },
  {
    level: 32,
    targetScore: 22000,
    moves: 19,
    obstacles: { ice: 0.28, chain: 0.20, blocker: 0.08 },
    difficulty: 'hard',
    description: 'Ice age incoming!'
  },
  {
    level: 33,
    targetScore: 23000,
    moves: 19,
    obstacles: { ice: 0.28, chain: 0.22, blocker: 0.09 },
    difficulty: 'hard',
    description: 'Almost to expert!'
  },
  {
    level: 34,
    targetScore: 24000,
    moves: 18,
    obstacles: { ice: 0.30, chain: 0.22, blocker: 0.09 },
    difficulty: 'hard',
    description: 'Precision required'
  },
  {
    level: 35,
    targetScore: 25000,
    moves: 18,
    obstacles: { ice: 0.30, chain: 0.24, blocker: 0.10 },
    difficulty: 'hard',
    description: 'Final hard level!'
  },

  // ============================================
  // EXPERT (Levels 36-50)
  // Focus: Mastery, all obstacles, tight constraints
  // ============================================
  {
    level: 36,
    targetScore: 27000,
    moves: 18,
    obstacles: { ice: 0.30, chain: 0.25, blocker: 0.10 },
    difficulty: 'expert',
    description: 'Welcome to expert mode!'
  },
  {
    level: 37,
    targetScore: 29000,
    moves: 17,
    obstacles: { ice: 0.32, chain: 0.25, blocker: 0.10 },
    difficulty: 'expert',
    description: 'Only the skilled survive'
  },
  {
    level: 38,
    targetScore: 31000,
    moves: 17,
    obstacles: { ice: 0.32, chain: 0.26, blocker: 0.11 },
    difficulty: 'expert',
    description: 'Chaos reigns!'
  },
  {
    level: 39,
    targetScore: 33000,
    moves: 16,
    obstacles: { ice: 0.34, chain: 0.26, blocker: 0.11 },
    difficulty: 'expert',
    description: 'Tight margins'
  },
  {
    level: 40,
    targetScore: 35000,
    moves: 16,
    obstacles: { ice: 0.34, chain: 0.28, blocker: 0.12 },
    difficulty: 'expert',
    description: 'Fourth milestone reached!'
  },
  {
    level: 41,
    targetScore: 37000,
    moves: 16,
    obstacles: { ice: 0.35, chain: 0.28, blocker: 0.12 },
    difficulty: 'expert',
    description: 'The elite levels begin'
  },
  {
    level: 42,
    targetScore: 39000,
    moves: 15,
    obstacles: { ice: 0.35, chain: 0.30, blocker: 0.12 },
    difficulty: 'expert',
    description: 'Chain overload!'
  },
  {
    level: 43,
    targetScore: 41000,
    moves: 15,
    obstacles: { ice: 0.36, chain: 0.30, blocker: 0.13 },
    difficulty: 'expert',
    description: 'Blockers everywhere'
  },
  {
    level: 44,
    targetScore: 43000,
    moves: 15,
    obstacles: { ice: 0.36, chain: 0.32, blocker: 0.13 },
    difficulty: 'expert',
    description: 'Near the summit'
  },
  {
    level: 45,
    targetScore: 45000,
    moves: 14,
    obstacles: { ice: 0.38, chain: 0.32, blocker: 0.14 },
    difficulty: 'expert',
    description: 'Five levels remain!'
  },
  {
    level: 46,
    targetScore: 47000,
    moves: 14,
    obstacles: { ice: 0.38, chain: 0.34, blocker: 0.14 },
    difficulty: 'expert',
    description: 'The final stretch'
  },
  {
    level: 47,
    targetScore: 49000,
    moves: 14,
    obstacles: { ice: 0.40, chain: 0.34, blocker: 0.15 },
    difficulty: 'expert',
    description: 'Almost legendary!'
  },
  {
    level: 48,
    targetScore: 52000,
    moves: 13,
    obstacles: { ice: 0.40, chain: 0.36, blocker: 0.15 },
    difficulty: 'expert',
    description: 'Penultimate challenge'
  },
  {
    level: 49,
    targetScore: 55000,
    moves: 13,
    obstacles: { ice: 0.42, chain: 0.36, blocker: 0.16 },
    difficulty: 'expert',
    description: 'One more to go!'
  },
  {
    level: 50,
    targetScore: 60000,
    moves: 12,
    obstacles: { ice: 0.45, chain: 0.38, blocker: 0.18 },
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
