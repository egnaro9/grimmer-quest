import React, { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Heart, Coins, Trophy, Gift, ShoppingBag, Play, Hammer, Shuffle, Sparkles, X, Volume2, VolumeX, Star, Zap, Award, Lock, Snowflake, Link2 } from "lucide-react";
import { soundManager } from "./utils/soundManager";
import { useAdPlacement } from "./hooks/useAdPlacement";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Game constants
const BOARD_SIZE = 8;
const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple'];
const SPECIAL_TYPES = ['striped_h', 'striped_v', 'wrapped', 'color_bomb'];
const MOVES_PER_LEVEL = 30;
const LEVEL_CONFIGS = [
  { target: 1000, obstacles: [] },
  { target: 2000, obstacles: [] },
  { target: 3500, obstacles: ['ice'] },
  { target: 5000, obstacles: ['ice'] },
  { target: 7500, obstacles: ['ice', 'chain'] },
  { target: 10000, obstacles: ['ice', 'chain'] },
  { target: 15000, obstacles: ['ice', 'chain', 'blocker'] },
  { target: 20000, obstacles: ['ice', 'chain', 'blocker'] },
  { target: 30000, obstacles: ['ice', 'chain', 'blocker'] },
  { target: 50000, obstacles: ['ice', 'chain', 'blocker'] },
];

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_match', name: 'First Match', desc: 'Make your first match', icon: '⭐', threshold: 1 },
  { id: 'combo_master', name: 'Combo Master', desc: 'Get a 5x combo', icon: '🔥', threshold: 5 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '🌟', threshold: 5 },
  { id: 'level_10', name: 'Gem Champion', desc: 'Reach level 10', icon: '👑', threshold: 10 },
  { id: 'score_10k', name: 'High Scorer', desc: 'Score 10,000 in one game', icon: '💎', threshold: 10000 },
  { id: 'score_50k', name: 'Legend', desc: 'Score 50,000 in one game', icon: '🏆', threshold: 50000 },
  { id: 'daily_7', name: 'Dedicated', desc: '7-day login streak', icon: '📅', threshold: 7 },
  { id: 'special_gem', name: 'Special Touch', desc: 'Create a special gem', icon: '✨', threshold: 1 },
];

// Create initial board with obstacles
const createBoard = (level = 1) => {
  const config = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
  let board;
  let attempts = 0;
  
  do {
    board = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const rowArr = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        const gem = {
          type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
          matched: false,
          falling: false,
          special: null,
          ice: false,
          chain: 0,
          blocker: false,
        };
        
        // Add random obstacles based on level config (reduced for playability)
        if (config.obstacles.includes('ice') && Math.random() < 0.08) {
          gem.ice = true;
        }
        if (config.obstacles.includes('chain') && Math.random() < 0.05) {
          gem.chain = 1;
        }
        if (config.obstacles.includes('blocker') && Math.random() < 0.02) {
          gem.blocker = true;
          gem.type = 'blocker';
        }
        
        rowArr.push(gem);
      }
      board.push(rowArr);
    }
    board = removeInitialMatches(board);
    board = ensureValidMoves(board);
    attempts++;
  } while (!hasAnyValidMove(board) && attempts < 10);
  
  return board;
};

// Ensure there are valid moves by creating some deliberate patterns
const ensureValidMoves = (board) => {
  // Add a few guaranteed valid move setups
  const setupPositions = [
    { row: 2, col: 2 }, // Near top-left
    { row: 5, col: 5 }, // Near bottom-right
  ];
  
  setupPositions.forEach(pos => {
    const { row, col } = pos;
    if (row + 2 < BOARD_SIZE && col + 1 < BOARD_SIZE) {
      // Don't modify blockers
      if (board[row][col].blocker || board[row+1][col].blocker || board[row+2][col].blocker || board[row+1][col+1].blocker) return;
      
      // Create a setup where swapping creates a vertical match
      // Pattern:  X A
      //           X .
      //           A .   (swap A up to create XXX)
      const gemType = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      board[row][col].type = gemType;
      board[row+1][col].type = gemType;
      // The piece to swap is at row+2, col or row+1, col+1
      board[row+1][col+1].type = gemType;
    }
  });
  
  return board;
};

// Check if any valid move exists
const hasAnyValidMove = (board) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].blocker) continue;
      
      // Check swap right
      if (col + 1 < BOARD_SIZE && !board[row][col+1].blocker) {
        if (wouldCreateMatch(board, row, col, row, col + 1)) return true;
      }
      // Check swap down
      if (row + 1 < BOARD_SIZE && !board[row+1][col].blocker) {
        if (wouldCreateMatch(board, row, col, row + 1, col)) return true;
      }
    }
  }
  return false;
};

// Check if swapping two positions would create a match
const wouldCreateMatch = (board, row1, col1, row2, col2) => {
  // Temporarily swap
  const tempBoard = board.map(r => r.map(g => ({ ...g })));
  const temp = tempBoard[row1][col1];
  tempBoard[row1][col1] = tempBoard[row2][col2];
  tempBoard[row2][col2] = temp;
  
  // Check if either position now has a match
  return checkMatchAt(tempBoard, row1, col1) || checkMatchAt(tempBoard, row2, col2);
};

// Check if there's a match at a specific position
const checkMatchAt = (board, row, col) => {
  const type = board[row][col].type;
  if (type === 'blocker') return false;
  
  // Check horizontal
  let hCount = 1;
  for (let c = col - 1; c >= 0 && board[row][c].type === type; c--) hCount++;
  for (let c = col + 1; c < BOARD_SIZE && board[row][c].type === type; c++) hCount++;
  if (hCount >= 3) return true;
  
  // Check vertical
  let vCount = 1;
  for (let r = row - 1; r >= 0 && board[r][col].type === type; r--) vCount++;
  for (let r = row + 1; r < BOARD_SIZE && board[r][col].type === type; r++) vCount++;
  if (vCount >= 3) return true;
  
  return false;
};

const removeInitialMatches = (board) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].blocker) continue;
      while (hasMatchAt(board, row, col)) {
        const availableTypes = GEM_TYPES.filter(t => !wouldMatch(board, row, col, t));
        board[row][col].type = availableTypes.length > 0 
          ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
          : GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
      }
    }
  }
  return board;
};

const wouldMatch = (board, row, col, type) => {
  if (col >= 2 && board[row][col-1]?.type === type && board[row][col-2]?.type === type) return true;
  if (row >= 2 && board[row-1]?.[col]?.type === type && board[row-2]?.[col]?.type === type) return true;
  return false;
};

const hasMatchAt = (board, row, col) => {
  const type = board[row][col].type;
  if (type === 'blocker') return false;
  if (col >= 2 && board[row][col-1]?.type === type && board[row][col-2]?.type === type) return true;
  if (row >= 2 && board[row-1]?.[col]?.type === type && board[row-2]?.[col]?.type === type) return true;
  return false;
};

// Gem component with special effects
const Gem = ({ gem, row, col, selected, onSelect }) => {
  if (gem.blocker) {
    return (
      <div 
        data-testid={`gem-cell-${row}-${col}`}
        className="w-full h-full flex items-center justify-center bg-slate-700 rounded-lg border-2 border-slate-600"
      >
        <Lock className="w-5 h-5 text-slate-500" />
      </div>
    );
  }

  const baseClasses = `gem gem-${gem.type} w-full h-full flex items-center justify-center relative cursor-pointer
    ${selected ? 'selected ring-4 ring-amber-400 ring-opacity-80 scale-110' : ''} 
    ${gem.matched ? 'matched' : ''} 
    ${gem.falling ? 'falling' : ''}
    ${gem.special ? 'special-' + gem.special : ''}`;

  const icons = {
    red: <div className="w-6 h-6 rotate-45 bg-white/30 rounded-sm pointer-events-none" />,
    blue: <div className="w-6 h-6 rounded-full bg-white/30 pointer-events-none" />,
    green: <div className="w-5 h-5 bg-white/30 pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />,
    yellow: <Star className="w-5 h-5 text-white/40 fill-white/30 pointer-events-none" />,
    purple: <div className="w-6 h-6 bg-white/30 pointer-events-none" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
  };

  const specialIndicators = {
    striped_h: <div className="absolute inset-x-1 top-1/2 h-1 bg-white/60 rounded pointer-events-none" />,
    striped_v: <div className="absolute inset-y-1 left-1/2 w-1 bg-white/60 rounded pointer-events-none" />,
    wrapped: <div className="absolute inset-2 border-2 border-white/60 rounded-full pointer-events-none" />,
    color_bomb: <Sparkles className="absolute w-4 h-4 text-white animate-pulse pointer-events-none" />,
  };

  return (
    <div 
      className="relative w-full h-full"
      data-testid={`gem-cell-${row}-${col}`}
      onClick={() => onSelect(row, col)}
      style={{ cursor: 'pointer' }}
    >
      {/* Ice overlay */}
      {gem.ice && (
        <div className="absolute inset-0 bg-cyan-200/40 rounded-lg border-2 border-cyan-300/60 z-10 flex items-center justify-center pointer-events-none">
          <Snowflake className="w-4 h-4 text-cyan-200/80" />
        </div>
      )}
      
      {/* Chain overlay */}
      {gem.chain > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className={`absolute inset-1 border-4 ${gem.chain === 2 ? 'border-amber-600' : 'border-amber-400'} rounded-lg opacity-80`} />
          <Link2 className="w-4 h-4 text-amber-300" />
        </div>
      )}
      
      <div className={baseClasses}>
        {icons[gem.type]}
        {gem.special && specialIndicators[gem.special]}
      </div>
    </div>
  );
};

// HUD Component
const GameHUD = ({ lives, maxLives, nextLifeSeconds, coins, score, movesLeft, level, targetScore, soundOn, onToggleSound }) => {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    if (nextLifeSeconds === null || nextLifeSeconds === undefined || lives >= maxLives) {
      setTimeDisplay('');
      return;
    }
    
    let remaining = nextLifeSeconds;
    const interval = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextLifeSeconds, lives, maxLives]);

  return (
    <div className="glass-strong rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2" data-testid="lives-display">
          <Heart className="w-6 h-6 heart fill-current" />
          <span className="font-bold text-white text-lg">{lives}/{maxLives}</span>
          {timeDisplay && <span className="text-xs text-slate-400">+1 in {timeDisplay}</span>}
        </div>

        <div className="flex items-center gap-2" data-testid="coins-display">
          <Coins className="w-6 h-6 coin" />
          <span className="font-bold text-white text-lg">{coins.toLocaleString()}</span>
        </div>

        <div className="score-display" data-testid="score-display">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-2xl font-bold">{score.toLocaleString()}</div>
        </div>

        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Level {level}</div>
          <div className="text-lg font-bold text-white">{movesLeft} moves</div>
        </div>

        <div className="w-32">
          <div className="text-xs text-slate-400 mb-1">Target: {targetScore.toLocaleString()}</div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
            />
          </div>
        </div>

        <button 
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          data-testid="sound-toggle"
        >
          {soundOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>
      </div>
    </div>
  );
};

// Power-ups Bar
const PowerUpsBar = ({ powerUps, onUsePowerUp, activePowerUp }) => {
  const powerUpInfo = {
    hammer: { icon: Hammer, name: 'Hammer', desc: 'Remove any gem' },
    shuffle: { icon: Shuffle, name: 'Shuffle', desc: 'Shuffle all gems' },
    color_bomb: { icon: Zap, name: 'Color Bomb', desc: 'Remove all of one color' }
  };

  return (
    <div className="glass rounded-xl p-3 mb-4 flex items-center justify-center gap-4">
      {Object.entries(powerUpInfo).map(([key, info]) => {
        const Icon = info.icon;
        const count = powerUps[key] || 0;
        const isActive = activePowerUp === key;
        
        return (
          <button
            key={key}
            data-testid={`powerup-${key}`}
            className={`power-up-btn relative ${isActive ? 'ring-2 ring-amber-400' : ''}`}
            onClick={() => onUsePowerUp(key)}
            disabled={count === 0}
            title={info.desc}
          >
            <Icon className={`w-8 h-8 ${count > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Main Menu
const MainMenu = ({ player, onStartGame, onOpenShop, onOpenLeaderboard, onOpenDailyReward, onOpenAchievements, dailyRewardAvailable }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="font-heading text-6xl lg:text-7xl font-black text-white drop-shadow-lg mb-2">
          GLIMMER <span className="text-amber-400">QUEST</span>
        </h1>
        <p className="text-slate-400 text-lg">Match 3 to shine!</p>
      </div>

      <div className="glass-strong rounded-2xl p-6 mb-8 w-full max-w-sm">
        <div className="text-center mb-4">
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <p className="text-2xl font-bold text-white">{player?.player_name || 'Player'}</p>
        </div>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-400">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-bold">{player?.lives || 0}</span>
            </div>
            <p className="text-xs text-slate-500">Lives</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Coins className="w-5 h-5" />
              <span className="font-bold">{(player?.coins || 0).toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500">Coins</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">Lvl {player?.current_level || 1}</span>
            </div>
            <p className="text-xs text-slate-500">Level</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 w-full max-w-sm">
        <button
          data-testid="play-button"
          className="btn-3d btn-3d-gold w-full text-lg flex items-center justify-center gap-2"
          onClick={onStartGame}
          disabled={!player || player.lives <= 0}
        >
          <Play className="w-6 h-6" />
          PLAY LEVEL {player?.current_level || 1}
        </button>

        {player?.lives <= 0 && (
          <p className="text-red-400 text-center text-sm">No lives! Wait or buy more.</p>
        )}

        <div className="grid grid-cols-4 gap-3">
          <button
            data-testid="shop-button"
            className="btn-3d btn-3d-green flex flex-col items-center gap-1 py-3"
            onClick={onOpenShop}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs">Shop</span>
          </button>

          <button
            data-testid="daily-reward-button"
            className={`btn-3d flex flex-col items-center gap-1 py-3 relative ${dailyRewardAvailable ? 'btn-3d-gold' : 'bg-slate-700 text-slate-400'}`}
            onClick={onOpenDailyReward}
          >
            <Gift className="w-6 h-6" />
            <span className="text-xs">Daily</span>
            {dailyRewardAvailable && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            data-testid="achievements-button"
            className="btn-3d bg-emerald-600 text-white border-b-4 border-emerald-800 flex flex-col items-center gap-1 py-3"
            onClick={onOpenAchievements}
          >
            <Award className="w-6 h-6" />
            <span className="text-xs">Awards</span>
          </button>

          <button
            data-testid="leaderboard-button"
            className="btn-3d bg-purple-600 text-white border-b-4 border-purple-800 flex flex-col items-center gap-1 py-3"
            onClick={onOpenLeaderboard}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs">Ranks</span>
          </button>
        </div>
      </div>

      {player?.high_score > 0 && (
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">Personal Best</p>
          <p className="text-2xl font-bold text-amber-400">{player.high_score.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

// Shop Modal
const ShopModal = ({ player, prices, onClose, onPurchase, onWatchAd, isWatchingAd }) => {
  const items = [
    { id: 'lives', name: '+5 Lives', price: prices.lives * 5, icon: Heart, color: 'text-red-400', qty: 5 },
    { id: 'hammer', name: 'Hammer x3', price: prices.hammer * 3, icon: Hammer, color: 'text-amber-400', qty: 3 },
    { id: 'shuffle', name: 'Shuffle x3', price: prices.shuffle * 3, icon: Shuffle, color: 'text-blue-400', qty: 3 },
    { id: 'color_bomb', name: 'Color Bomb x3', price: prices.color_bomb * 3, icon: Zap, color: 'text-purple-400', qty: 3 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-3xl font-bold text-white">Shop</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-black/30 rounded-lg">
          <Coins className="w-6 h-6 text-amber-400" />
          <span className="text-xl font-bold text-white">{(player?.coins || 0).toLocaleString()}</span>
        </div>

        <div className="space-y-3 mb-6">
          {items.map(item => {
            const Icon = item.icon;
            const canAfford = (player?.coins || 0) >= item.price;
            
            return (
              <button
                key={item.id}
                data-testid={`buy-${item.id}`}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${canAfford ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 opacity-50'}`}
                onClick={() => canAfford && onPurchase(item.id, item.qty)}
                disabled={!canAfford}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${item.color}`} />
                  <span className="text-white font-bold">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{item.price}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-slate-400 text-sm text-center mb-3">Free Rewards (Watch Ad)</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              data-testid="watch-ad-coins"
              className="btn-3d btn-3d-green text-sm py-3"
              onClick={() => onWatchAd('coins')}
              disabled={isWatchingAd}
            >
              {isWatchingAd ? 'Loading...' : <>
                <Coins className="w-4 h-4 inline mr-1" />
                +20-50 Coins
              </>}
            </button>
            <button
              data-testid="watch-ad-life"
              className="btn-3d btn-3d-red text-sm py-3"
              onClick={() => onWatchAd('life')}
              disabled={isWatchingAd}
            >
              {isWatchingAd ? 'Loading...' : <>
                <Heart className="w-4 h-4 inline mr-1" />
                +1 Life
              </>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Daily Reward Modal
const DailyRewardModal = ({ status, onClose, onClaim }) => {
  if (!status) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-3xl font-bold text-white">Daily Rewards</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-6">
          {status.rewards.map((reward, idx) => {
            const day = idx + 1;
            const isClaimed = day <= status.current_streak && !status.can_claim;
            const isCurrent = day === status.next_reward_day && status.can_claim;

            return (
              <div
                key={day}
                className={`reward-day ${isCurrent ? 'current' : ''} ${isClaimed ? 'claimed' : ''}`}
              >
                <div className="text-xs text-slate-400 mb-1">Day {day}</div>
                <Coins className="w-5 h-5 mx-auto text-amber-400" />
                <div className="text-xs font-bold text-white mt-1">{reward.coins}</div>
                {Object.keys(reward.power_ups).length > 0 && (
                  <div className="text-xs text-purple-400">+items</div>
                )}
                {isClaimed && <div className="text-green-400 text-xs mt-1">✓</div>}
              </div>
            );
          })}
        </div>

        {status.can_claim ? (
          <button
            data-testid="claim-daily-reward"
            className="btn-3d btn-3d-gold w-full text-lg"
            onClick={onClaim}
          >
            <Gift className="w-5 h-5 inline mr-2" />
            Claim Day {status.next_reward_day} Reward!
          </button>
        ) : (
          <div className="text-center text-slate-400">
            <p>Come back tomorrow for your next reward!</p>
            <p className="text-sm mt-1">Current streak: {status.current_streak} days</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Achievements Modal
const AchievementsModal = ({ player, onClose }) => {
  const checkAchievement = (achievement) => {
    switch (achievement.id) {
      case 'level_5':
      case 'level_10':
        return (player?.current_level || 1) >= achievement.threshold;
      case 'score_10k':
      case 'score_50k':
        return (player?.high_score || 0) >= achievement.threshold;
      case 'daily_7':
        return (player?.daily_reward_streak || 0) >= achievement.threshold;
      default:
        return false;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-3xl font-bold text-white">Achievements</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {ACHIEVEMENTS.map(achievement => {
            const unlocked = checkAchievement(achievement);
            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 p-4 rounded-xl ${unlocked ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/5'}`}
              >
                <div className={`text-3xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${unlocked ? 'text-amber-400' : 'text-slate-400'}`}>
                    {achievement.name}
                  </p>
                  <p className="text-xs text-slate-500">{achievement.desc}</p>
                </div>
                {unlocked && <div className="text-green-400 text-xl">✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Leaderboard Modal
const LeaderboardModal = ({ leaderboard, currentPlayer, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-3xl font-bold text-white">Leaderboard</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto pr-2">
          {leaderboard.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No players yet. Be the first!</p>
          ) : (
            leaderboard.map((entry, idx) => (
              <div
                key={idx}
                className={`leaderboard-row ${idx < 3 ? 'top-3' : ''} ${entry.player_name === currentPlayer?.player_name ? 'ring-1 ring-amber-400' : ''}`}
              >
                <div className="w-8 font-bold text-lg">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div className="flex-1 ml-3">
                  <p className="font-bold text-white">{entry.player_name}</p>
                  <p className="text-xs text-slate-400">Level {entry.current_level}</p>
                </div>
                <div className="text-amber-400 font-bold">
                  {entry.high_score.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Game Over Modal with Watch Ad to Continue
const GameOverModal = ({ won, score, targetScore, coinsEarned, newHighScore, onRestart, onMainMenu, onWatchAdContinue, canContinue }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content text-center">
        <div className="mb-4">
          {won ? (
            <>
              <div className="text-6xl mb-2">🎉</div>
              <h2 className="font-heading text-4xl font-bold text-amber-400">Level Complete!</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-2">😢</div>
              <h2 className="font-heading text-4xl font-bold text-red-400">Out of Moves!</h2>
            </>
          )}
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="text-4xl font-bold text-white mb-2">{score.toLocaleString()}</div>
          <div className="text-slate-400">
            {won ? `Target: ${targetScore.toLocaleString()} ✓` : `Target: ${targetScore.toLocaleString()}`}
          </div>
          {newHighScore && (
            <div className="text-amber-400 font-bold mt-2 animate-pulse">🏆 New High Score!</div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-6 text-amber-400">
          <Coins className="w-5 h-5" />
          <span className="font-bold">+{coinsEarned} coins earned</span>
        </div>

        <div className="space-y-3">
          {!won && canContinue && (
            <button
              data-testid="watch-ad-continue"
              className="btn-3d bg-emerald-500 text-white border-b-4 border-emerald-700 w-full flex items-center justify-center gap-2"
              onClick={onWatchAdContinue}
            >
              <Play className="w-5 h-5" />
              Watch Ad for +5 Moves
            </button>
          )}
          <button
            data-testid="play-again-button"
            className="btn-3d btn-3d-gold w-full"
            onClick={onRestart}
          >
            {won ? 'Next Level' : 'Try Again'}
          </button>
          <button
            data-testid="main-menu-button"
            className="btn-3d bg-slate-700 text-white border-b-4 border-slate-800 w-full"
            onClick={onMainMenu}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

// Name Input Modal
const NameInputModal = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      soundManager.play('buttonClick');
      onSubmit(name.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content text-center">
        <h2 className="font-heading text-4xl font-bold text-white mb-2">
          GLIMMER <span className="text-amber-400">QUEST</span>
        </h2>
        <p className="text-slate-400 mb-6">Enter your name to start playing!</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            data-testid="player-name-input"
            className="w-full p-4 bg-black/40 border border-white/20 rounded-xl text-white text-center text-lg focus:outline-none focus:border-amber-400 mb-4"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            data-testid="start-game-button"
            className="btn-3d btn-3d-gold w-full text-lg"
            disabled={!name.trim()}
          >
            Start Playing!
          </button>
        </form>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  // Initialize sound
  useEffect(() => {
    soundManager.init();
  }, []);

  // Ad placement hook
  const { showRewardedAd, showInterstitialAd } = useAdPlacement();

  // Game state
  const [board, setBoard] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_LEVEL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameState, setGameState] = useState('menu');
  const [gameWon, setGameWon] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [newHighScore, setNewHighScore] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [comboCount, setComboCount] = useState(0);
  const [canContinue, setCanContinue] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Player state
  const [player, setPlayer] = useState(null);
  const [showNameInput, setShowNameInput] = useState(true);
  
  // UI state
  const [showShop, setShowShop] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [shopPrices, setShopPrices] = useState({});
  const [dailyRewardStatus, setDailyRewardStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Drag state
  const dragStart = useRef(null);
  const isDragging = useRef(false);

  // Toggle sound
  const toggleSound = () => {
    const newSoundOn = !soundOn;
    setSoundOn(newSoundOn);
    soundManager.setMuted(!newSoundOn);
  };

  // Load shop prices
  useEffect(() => {
    axios.get(`${API}/shop/prices`).then(res => setShopPrices(res.data)).catch(console.error);
  }, []);

  // Create or load player
  const handleCreatePlayer = async (name) => {
    try {
      const res = await axios.post(`${API}/player/create`, { player_name: name });
      setPlayer(res.data);
      setShowNameInput(false);
      loadDailyRewardStatus(res.data.id);
    } catch (err) {
      console.error('Error creating player:', err);
    }
  };

  // Refresh player data
  const refreshPlayer = async () => {
    if (!player?.id) return;
    try {
      const res = await axios.get(`${API}/player/${player.id}`);
      setPlayer(res.data);
    } catch (err) {
      console.error('Error refreshing player:', err);
    }
  };

  // Load daily reward status
  const loadDailyRewardStatus = async (playerId) => {
    try {
      const res = await axios.get(`${API}/daily-reward/status/${playerId}`);
      setDailyRewardStatus(res.data);
    } catch (err) {
      console.error('Error loading daily reward status:', err);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/leaderboard`);
      setLeaderboard(res.data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  // Start game
  const startGame = async () => {
    soundManager.play('buttonClick');
    try {
      const res = await axios.post(`${API}/game/start?player_id=${player.id}`);
      if (res.data.success) {
        setPlayer(prev => ({ ...prev, lives: res.data.lives_remaining, power_ups: res.data.power_ups }));
        setBoard(createBoard(player.current_level));
        setScore(0);
        setMovesLeft(MOVES_PER_LEVEL);
        setComboCount(0);
        setGameState('playing');
        setGameWon(false);
        setNewHighScore(false);
        setActivePowerUp(null);
        setCanContinue(true);
      }
    } catch (err) {
      console.error('Error starting game:', err);
      if (err.response?.status === 400) {
        alert('No lives remaining! Wait for regeneration or purchase more in the shop.');
      }
    }
  };

  // End game
  const endGame = async (won) => {
    setGameWon(won);
    const earned = Math.floor(score / 10);
    setCoinsEarned(earned);
    
    if (won) {
      soundManager.play('levelUp');
      // Show interstitial ad between levels
      await showInterstitialAd(`level_${player.current_level}_complete`);
    } else {
      soundManager.play('gameOver');
    }
    
    try {
      const res = await axios.post(`${API}/game/end`, {
        player_id: player.id,
        score: score,
        level: player.current_level,
        moves_used: MOVES_PER_LEVEL - movesLeft
      });
      
      setNewHighScore(res.data.new_high_score);
      await refreshPlayer();
    } catch (err) {
      console.error('Error ending game:', err);
    }
    
    setGameState('gameover');
  };

  // Watch ad to continue
  const handleWatchAdContinue = async () => {
    setIsWatchingAd(true);
    try {
      const result = await showRewardedAd('continue_game');
      if (result.completed) {
        soundManager.play('coinCollect');
        setMovesLeft(prev => prev + 5);
        setGameState('playing');
        setCanContinue(false); // Only allow one continue per game
      }
    } catch (err) {
      console.error('Error showing ad:', err);
    }
    setIsWatchingAd(false);
  };

  // Get target score for current level
  const getTargetScore = () => {
    const level = player?.current_level || 1;
    return LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)].target;
  };

  // Check for matches and create special gems
  const findMatches = useCallback((currentBoard) => {
    const matches = new Map(); // key -> { positions: [], length: number, direction: 'h' | 'v' }
    
    // Debug: Log board state
    console.log('Checking for matches on board:');
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowTypes = currentBoard[r].map(g => g.type[0]).join(' ');
      console.log(`Row ${r}: ${rowTypes}`);
    }
    
    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      let matchStart = 0;
      for (let col = 1; col <= BOARD_SIZE; col++) {
        const prevType = currentBoard[row][col - 1]?.type;
        const currType = col < BOARD_SIZE ? currentBoard[row][col]?.type : null;
        
        if (currType !== prevType || col === BOARD_SIZE || prevType === 'blocker') {
          const matchLength = col - matchStart;
          if (matchLength >= 3 && prevType !== 'blocker') {
            console.log(`Found horizontal match: row ${row}, cols ${matchStart}-${col-1}, type ${prevType}, length ${matchLength}`);
            for (let i = matchStart; i < col; i++) {
              const key = `${row}-${i}`;
              if (!matches.has(key)) {
                matches.set(key, { length: matchLength, direction: 'h', row, col: matchStart });
              } else {
                // Intersection - could create wrapped gem
                const existing = matches.get(key);
                existing.intersection = true;
              }
            }
          }
          matchStart = col;
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < BOARD_SIZE; col++) {
      let matchStart = 0;
      for (let row = 1; row <= BOARD_SIZE; row++) {
        const prevType = currentBoard[row - 1]?.[col]?.type;
        const currType = row < BOARD_SIZE ? currentBoard[row]?.[col]?.type : null;
        
        if (currType !== prevType || row === BOARD_SIZE || prevType === 'blocker') {
          const matchLength = row - matchStart;
          if (matchLength >= 3 && prevType !== 'blocker') {
            for (let i = matchStart; i < row; i++) {
              const key = `${i}-${col}`;
              if (!matches.has(key)) {
                matches.set(key, { length: matchLength, direction: 'v', row: matchStart, col });
              } else {
                const existing = matches.get(key);
                existing.intersection = true;
              }
            }
          }
          matchStart = row;
        }
      }
    }
    
    return matches;
  }, []);

  // Process matches and cascade
  const processMatches = useCallback(async (currentBoard, isInitial = false, swapPos = null) => {
    let newBoard = currentBoard.map(row => row.map(gem => ({ ...gem })));
    let totalMatched = 0;
    let cascadeCount = 0;
    
    const processOnce = async () => {
      const matches = findMatches(newBoard);
      
      if (matches.size === 0) return false;
      
      totalMatched += matches.size;
      cascadeCount++;
      
      // Determine special gems to create
      const specialGems = [];
      matches.forEach((info, key) => {
        const [row, col] = key.split('-').map(Number);
        
        // Check for special gem creation conditions
        if (info.length >= 5) {
          // 5+ match creates color bomb
          specialGems.push({ row, col, special: 'color_bomb', type: newBoard[row][col].type });
        } else if (info.intersection) {
          // L or T shape creates wrapped
          specialGems.push({ row, col, special: 'wrapped', type: newBoard[row][col].type });
        } else if (info.length === 4) {
          // 4 match creates striped
          const special = info.direction === 'h' ? 'striped_v' : 'striped_h';
          specialGems.push({ row, col, special, type: newBoard[row][col].type });
        }
      });
      
      // Mark matched gems (handle obstacles)
      matches.forEach((info, key) => {
        const [row, col] = key.split('-').map(Number);
        const gem = newBoard[row][col];
        
        // Handle ice - first match removes ice
        if (gem.ice) {
          gem.ice = false;
        } else if (gem.chain > 0) {
          // Handle chain - reduce chain level
          gem.chain--;
        } else {
          gem.matched = true;
        }
      });
      
      soundManager.play(cascadeCount > 1 ? 'combo' : 'match');
      setBoard([...newBoard.map(row => [...row])]);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Remove matched and drop
      for (let col = 0; col < BOARD_SIZE; col++) {
        const newCol = [];
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
          if (!newBoard[row][col].matched) {
            newCol.push(newBoard[row][col]);
          }
        }
        
        // Fill with new gems (check if special should be created)
        while (newCol.length < BOARD_SIZE) {
          const newGem = {
            type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
            id: `new-${col}-${Date.now()}-${Math.random()}`,
            matched: false,
            falling: true,
            special: null,
            ice: false,
            chain: 0,
            blocker: false,
          };
          
          // Check if this position should have a special gem
          const specialInfo = specialGems.find(s => 
            newCol.length === BOARD_SIZE - 1 - s.row && col === s.col
          );
          if (specialInfo) {
            newGem.special = specialInfo.special;
            newGem.type = specialInfo.type;
            soundManager.play('specialGem');
          }
          
          newCol.push(newGem);
        }
        
        // Place back in board (reversed)
        for (let row = 0; row < BOARD_SIZE; row++) {
          newBoard[row][col] = newCol[BOARD_SIZE - 1 - row];
        }
      }
      
      setBoard([...newBoard.map(row => [...row])]);
      
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Reset falling state
      newBoard = newBoard.map(row => row.map(gem => ({ ...gem, falling: false })));
      
      return true;
    };
    
    while (await processOnce()) {
      // Continue cascading
    }
    
    if (totalMatched > 0 && !isInitial) {
      const baseScore = totalMatched * 10;
      const comboMultiplier = Math.min(cascadeCount, 5);
      const finalScore = baseScore * comboMultiplier;
      setScore(prev => prev + finalScore);
      setComboCount(cascadeCount);
      
      if (cascadeCount >= 3) {
        document.querySelector('.game-board')?.classList.add('shake');
        setTimeout(() => {
          document.querySelector('.game-board')?.classList.remove('shake');
        }, 300);
      }
    }
    
    return newBoard;
  }, [findMatches]);

  // Activate special gem
  const activateSpecialGem = useCallback(async (board, row, col) => {
    const gem = board[row][col];
    if (!gem.special) return board;
    
    const newBoard = board.map(r => r.map(g => ({ ...g })));
    soundManager.play('powerUp');
    
    switch (gem.special) {
      case 'striped_h':
        // Clear entire row
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!newBoard[row][c].blocker) {
            newBoard[row][c].matched = true;
          }
        }
        break;
      case 'striped_v':
        // Clear entire column
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (!newBoard[r][col].blocker) {
            newBoard[r][col].matched = true;
          }
        }
        break;
      case 'wrapped':
        // Clear 3x3 area
        for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
            if (!newBoard[r][c].blocker) {
              newBoard[r][c].matched = true;
            }
          }
        }
        break;
      case 'color_bomb':
        // Clear all gems of the same color
        const targetType = gem.type;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (newBoard[r][c].type === targetType && !newBoard[r][c].blocker) {
              newBoard[r][c].matched = true;
            }
          }
        }
        break;
      default:
        break;
    }
    
    return newBoard;
  }, []);

  // Swap gems
  const swapGems = useCallback(async (row1, col1, row2, col2) => {
    console.log('swapGems called:', row1, col1, row2, col2);
    if (isProcessing) {
      console.log('Blocked: already processing');
      return;
    }
    
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    if (rowDiff + colDiff !== 1) {
      console.log('Blocked: not adjacent');
      return;
    }
    
    // Check if either gem is blocked
    if (board[row1][col1].blocker || board[row2][col2].blocker) {
      console.log('Blocked: blocker gem');
      return;
    }
    if (board[row1][col1].chain > 0 || board[row2][col2].chain > 0) {
      console.log('Blocked: chained gem');
      return;
    }
    
    setIsProcessing(true);
    setSelectedGem(null); // Clear selection immediately
    soundManager.play('swap');
    
    // Perform swap immediately
    let newBoard = board.map(row => row.map(gem => ({ ...gem })));
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;
    
    console.log('Board swapped, setting new board');
    setBoard(newBoard);
    
    // Wait for visual swap
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Check if either swapped gem is special
    if (newBoard[row1][col1].special) {
      newBoard = await activateSpecialGem(newBoard, row1, col1);
    }
    if (newBoard[row2][col2].special) {
      newBoard = await activateSpecialGem(newBoard, row2, col2);
    }
    
    // Check for matches
    const matches = findMatches(newBoard);
    console.log('Matches found:', matches.size);
    
    if (matches.size > 0 || newBoard[row1][col1].matched || newBoard[row2][col2].matched) {
      console.log('Valid move - processing matches');
      setMovesLeft(prev => prev - 1);
      await processMatches(newBoard, false, { row1, col1, row2, col2 });
    } else {
      // Invalid move - swap back with delay so user sees it
      console.log('No matches - reverting swap');
      await new Promise(resolve => setTimeout(resolve, 200));
      const revertBoard = newBoard.map(row => row.map(gem => ({ ...gem })));
      const temp2 = revertBoard[row1][col1];
      revertBoard[row1][col1] = revertBoard[row2][col2];
      revertBoard[row2][col2] = temp2;
      setBoard(revertBoard);
    }
    
    console.log('Swap complete');
    setIsProcessing(false);
  }, [board, isProcessing, findMatches, processMatches, activateSpecialGem]);

  // Apply power-up
  const applyPowerUp = useCallback(async (row, col) => {
    if (!activePowerUp) return;
    
    setIsProcessing(true);
    soundManager.play('powerUp');
    
    try {
      await axios.post(`${API}/powerup/use`, {
        player_id: player.id,
        power_up_type: activePowerUp
      });
      
      let newBoard = board.map(r => r.map(gem => ({ ...gem })));
      
      if (activePowerUp === 'hammer') {
        if (!newBoard[row][col].blocker) {
          newBoard[row][col].matched = true;
        }
        setBoard(newBoard);
        await processMatches(newBoard);
      } else if (activePowerUp === 'color_bomb') {
        const targetType = newBoard[row][col].type;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (newBoard[r][c].type === targetType && !newBoard[r][c].blocker) {
              newBoard[r][c].matched = true;
            }
          }
        }
        setBoard(newBoard);
        await processMatches(newBoard);
      } else if (activePowerUp === 'shuffle') {
        const allGems = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (!newBoard[r][c].blocker) {
              allGems.push(newBoard[r][c].type);
            }
          }
        }
        for (let i = allGems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
        }
        let idx = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (!newBoard[r][c].blocker) {
              newBoard[r][c] = {
                ...newBoard[r][c],
                type: allGems[idx++],
                id: `shuffle-${r}-${c}-${Date.now()}`
              };
            }
          }
        }
        setBoard(newBoard);
        await processMatches(newBoard);
      }
      
      setPlayer(prev => ({
        ...prev,
        power_ups: {
          ...prev.power_ups,
          [activePowerUp]: (prev.power_ups[activePowerUp] || 1) - 1
        }
      }));
      
    } catch (err) {
      console.error('Error using power-up:', err);
    }
    
    setActivePowerUp(null);
    setIsProcessing(false);
  }, [activePowerUp, board, player?.id, processMatches]);

  // Simple gem selection handler
  const handleGemSelect = useCallback((row, col) => {
    console.log('Gem clicked:', row, col, 'isProcessing:', isProcessing, 'gameState:', gameState);
    
    if (isProcessing) {
      console.log('Blocked: isProcessing');
      return;
    }
    if (gameState !== 'playing') {
      console.log('Blocked: not playing');
      return;
    }
    if (board[row][col].blocker) {
      console.log('Blocked: is blocker');
      return;
    }
    
    // Handle power-up usage
    if (activePowerUp) {
      console.log('Using power-up');
      applyPowerUp(row, col);
      return;
    }
    
    // If we have a selected gem
    if (selectedGem) {
      const rowDiff = Math.abs(row - selectedGem.row);
      const colDiff = Math.abs(col - selectedGem.col);
      
      console.log('Selected gem exists at', selectedGem.row, selectedGem.col, 'diff:', rowDiff, colDiff);
      
      if (row === selectedGem.row && col === selectedGem.col) {
        // Clicked same gem - deselect
        console.log('Deselecting');
        setSelectedGem(null);
      } else if (rowDiff + colDiff === 1) {
        // Adjacent gem - swap!
        console.log('Swapping!');
        swapGems(selectedGem.row, selectedGem.col, row, col);
      } else {
        // Not adjacent - select new gem
        console.log('Selecting new gem');
        setSelectedGem({ row, col });
      }
    } else {
      // No selection yet - select this gem
      console.log('First selection');
      setSelectedGem({ row, col });
    }
  }, [isProcessing, gameState, board, activePowerUp, selectedGem, swapGems, applyPowerUp]);

  // Toggle power-up selection
  const togglePowerUp = (type) => {
    soundManager.play('buttonClick');
    if (activePowerUp === type) {
      setActivePowerUp(null);
    } else if (player.power_ups[type] > 0) {
      setActivePowerUp(type);
      setSelectedGem(null);
    }
  };

  // Shop purchase
  const handlePurchase = async (itemType, quantity) => {
    soundManager.play('buttonClick');
    try {
      const res = await axios.post(`${API}/shop/purchase`, {
        player_id: player.id,
        item_type: itemType,
        quantity: quantity
      });
      if (res.data.success) {
        soundManager.play('coinCollect');
        setPlayer(res.data.player);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.response?.data?.detail || 'Purchase failed');
    }
  };

  // Watch ad
  const handleWatchAd = async (rewardType) => {
    setIsWatchingAd(true);
    try {
      const result = await showRewardedAd(`${rewardType}_reward_shop`);
      if (result.completed) {
        const res = await axios.post(`${API}/ads/watch?player_id=${player.id}&reward_type=${rewardType}`);
        if (res.data.success) {
          soundManager.play('coinCollect');
          alert(`You earned ${res.data.amount} ${res.data.reward_type}!`);
          await refreshPlayer();
        }
      }
    } catch (err) {
      console.error('Ad watch error:', err);
    }
    setIsWatchingAd(false);
  };

  // Claim daily reward
  const handleClaimDailyReward = async () => {
    soundManager.play('buttonClick');
    try {
      const res = await axios.post(`${API}/daily-reward/claim`, { player_id: player.id });
      if (res.data.success) {
        soundManager.play('coinCollect');
        alert(`Day ${res.data.day} reward claimed! +${res.data.coins_reward} coins`);
        await refreshPlayer();
        loadDailyRewardStatus(player.id);
      }
    } catch (err) {
      console.error('Claim daily reward error:', err);
    }
  };

  // Check win/lose condition
  useEffect(() => {
    if (gameState !== 'playing' || isProcessing) return;
    
    const targetScore = getTargetScore();
    
    if (score >= targetScore) {
      endGame(true);
    } else if (movesLeft <= 0) {
      endGame(false);
    }
  }, [score, movesLeft, gameState, isProcessing]);

  // Initial match check when board is created
  useEffect(() => {
    if (board && gameState === 'playing') {
      const matches = findMatches(board);
      if (matches.size > 0) {
        processMatches(board, true);
      }
    }
  }, [board?.toString()]);

  return (
    <div className="min-h-screen relative">
      <div className="magical-bg" />
      
      {showNameInput && (
        <NameInputModal onSubmit={handleCreatePlayer} />
      )}
      
      {!showNameInput && gameState === 'menu' && (
        <MainMenu
          player={player}
          onStartGame={startGame}
          onOpenShop={() => { soundManager.play('buttonClick'); setShowShop(true); }}
          onOpenLeaderboard={() => {
            soundManager.play('buttonClick');
            loadLeaderboard();
            setShowLeaderboard(true);
          }}
          onOpenDailyReward={() => {
            soundManager.play('buttonClick');
            loadDailyRewardStatus(player.id);
            setShowDailyReward(true);
          }}
          onOpenAchievements={() => {
            soundManager.play('buttonClick');
            setShowAchievements(true);
          }}
          dailyRewardAvailable={dailyRewardStatus?.can_claim}
        />
      )}
      
      {gameState === 'playing' && board && (
        <div className="p-4 max-w-lg mx-auto">
          <GameHUD
            lives={player?.lives || 0}
            maxLives={player?.max_lives || 5}
            nextLifeSeconds={player?.next_life_seconds}
            coins={player?.coins || 0}
            score={score}
            movesLeft={movesLeft}
            level={player?.current_level || 1}
            targetScore={getTargetScore()}
            soundOn={soundOn}
            onToggleSound={toggleSound}
          />
          
          <PowerUpsBar
            powerUps={player?.power_ups || {}}
            onUsePowerUp={togglePowerUp}
            activePowerUp={activePowerUp}
          />
          
          {activePowerUp && (
            <div className="text-center mb-2 text-amber-400 text-sm animate-pulse">
              Click a gem to use {activePowerUp.replace('_', ' ')}
            </div>
          )}
          
          {comboCount > 1 && (
            <div className="text-center mb-2 text-amber-400 font-bold animate-pulse">
              {comboCount}x COMBO!
            </div>
          )}
          
          <div 
            className="game-board mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              maxWidth: '400px',
              aspectRatio: '1'
            }}
            data-testid="game-board"
          >
            {board.map((row, rowIdx) => 
              row.map((gem, colIdx) => (
                <Gem
                  key={gem.id}
                  gem={gem}
                  row={rowIdx}
                  col={colIdx}
                  selected={selectedGem?.row === rowIdx && selectedGem?.col === colIdx}
                  onSelect={handleGemSelect}
                />
              ))
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <button
              data-testid="quit-game-button"
              className="text-slate-400 hover:text-white text-sm"
              onClick={() => {
                soundManager.play('buttonClick');
                setGameState('menu');
                refreshPlayer();
              }}
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      )}
      
      {gameState === 'gameover' && (
        <GameOverModal
          won={gameWon}
          score={score}
          targetScore={getTargetScore()}
          coinsEarned={coinsEarned}
          newHighScore={newHighScore}
          onRestart={startGame}
          onMainMenu={() => {
            soundManager.play('buttonClick');
            setGameState('menu');
            refreshPlayer();
          }}
          onWatchAdContinue={handleWatchAdContinue}
          canContinue={canContinue && !gameWon}
        />
      )}
      
      {showShop && (
        <ShopModal
          player={player}
          prices={shopPrices}
          onClose={() => setShowShop(false)}
          onPurchase={handlePurchase}
          onWatchAd={handleWatchAd}
          isWatchingAd={isWatchingAd}
        />
      )}
      
      {showDailyReward && (
        <DailyRewardModal
          status={dailyRewardStatus}
          onClose={() => setShowDailyReward(false)}
          onClaim={handleClaimDailyReward}
        />
      )}
      
      {showAchievements && (
        <AchievementsModal
          player={player}
          onClose={() => setShowAchievements(false)}
        />
      )}
      
      {showLeaderboard && (
        <LeaderboardModal
          leaderboard={leaderboard}
          currentPlayer={player}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}

export default App;
