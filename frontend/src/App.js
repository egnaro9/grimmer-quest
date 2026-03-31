import React, { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Heart, Coins, Trophy, Gift, ShoppingBag, Play, RotateCcw, Hammer, Shuffle, Sparkles, X, Volume2, VolumeX, Star, ChevronRight, Zap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Game constants
const BOARD_SIZE = 8;
const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple'];
const MOVES_PER_LEVEL = 30;
const LEVEL_SCORE_TARGETS = [1000, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000];

// Create initial board
const createBoard = () => {
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowArr = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowArr.push({
        type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        matched: false,
        falling: false
      });
    }
    board.push(rowArr);
  }
  // Remove initial matches
  return removeInitialMatches(board);
};

const removeInitialMatches = (board) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
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
  // Check horizontal
  let count = 1;
  if (col >= 2 && board[row][col-1]?.type === type && board[row][col-2]?.type === type) count = 3;
  // Check vertical
  if (row >= 2 && board[row-1]?.[col]?.type === type && board[row-2]?.[col]?.type === type) return true;
  return count >= 3;
};

const hasMatchAt = (board, row, col) => {
  const type = board[row][col].type;
  // Check horizontal
  if (col >= 2 && board[row][col-1]?.type === type && board[row][col-2]?.type === type) return true;
  // Check vertical
  if (row >= 2 && board[row-1]?.[col]?.type === type && board[row-2]?.[col]?.type === type) return true;
  return false;
};

// Gem component
const Gem = ({ gem, row, col, selected, onClick, onDragStart, onDragEnd, onDragEnter }) => {
  const gemClasses = `gem gem-${gem.type} w-full h-full flex items-center justify-center
    ${selected ? 'selected' : ''} 
    ${gem.matched ? 'matched' : ''} 
    ${gem.falling ? 'falling' : ''}`;

  const icons = {
    red: <div className="w-6 h-6 rotate-45 bg-white/30 rounded-sm" />,
    blue: <div className="w-6 h-6 rounded-full bg-white/30" />,
    green: <div className="w-5 h-5 bg-white/30" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />,
    yellow: <Star className="w-5 h-5 text-white/40 fill-white/30" />,
    purple: <div className="w-6 h-6 bg-white/30" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
  };

  return (
    <div
      data-testid={`gem-cell-${row}-${col}`}
      className={gemClasses}
      onClick={() => onClick(row, col)}
      onMouseDown={() => onDragStart(row, col)}
      onMouseUp={onDragEnd}
      onMouseEnter={() => onDragEnter(row, col)}
      onTouchStart={() => onDragStart(row, col)}
      onTouchEnd={onDragEnd}
    >
      {icons[gem.type]}
    </div>
  );
};

// HUD Component
const GameHUD = ({ lives, maxLives, nextLifeSeconds, coins, score, movesLeft, level, targetScore }) => {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    if (nextLifeSeconds === null || nextLifeSeconds === undefined) {
      setTimeDisplay('');
      return;
    }
    
    const interval = setInterval(() => {
      const mins = Math.floor(nextLifeSeconds / 60);
      const secs = nextLifeSeconds % 60;
      setTimeDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextLifeSeconds]);

  return (
    <div className="glass-strong rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Lives */}
        <div className="flex items-center gap-2" data-testid="lives-display">
          <Heart className="w-6 h-6 heart fill-current" />
          <span className="font-bold text-white text-lg">{lives}/{maxLives}</span>
          {timeDisplay && lives < maxLives && (
            <span className="text-xs text-slate-400">+1 in {timeDisplay}</span>
          )}
        </div>

        {/* Coins */}
        <div className="flex items-center gap-2" data-testid="coins-display">
          <Coins className="w-6 h-6 coin" />
          <span className="font-bold text-white text-lg">{coins.toLocaleString()}</span>
        </div>

        {/* Score */}
        <div className="score-display" data-testid="score-display">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Score</div>
          <div className="text-2xl font-bold">{score.toLocaleString()}</div>
        </div>

        {/* Level & Moves */}
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Level {level}</div>
          <div className="text-lg font-bold text-white">{movesLeft} moves</div>
        </div>

        {/* Progress to target */}
        <div className="w-32">
          <div className="text-xs text-slate-400 mb-1">Target: {targetScore.toLocaleString()}</div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
            />
          </div>
        </div>
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
const MainMenu = ({ player, onStartGame, onOpenShop, onOpenLeaderboard, onOpenDailyReward, dailyRewardAvailable }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-6xl lg:text-7xl font-black text-white drop-shadow-lg mb-2">
          GEM <span className="text-amber-400">CRUSH</span>
        </h1>
        <p className="text-slate-400 text-lg">Match 3 to crush!</p>
      </div>

      {/* Player info card */}
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

      {/* Menu buttons */}
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

        <div className="grid grid-cols-3 gap-3">
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
            data-testid="leaderboard-button"
            className="btn-3d bg-purple-600 text-white border-b-4 border-purple-800 flex flex-col items-center gap-1 py-3"
            onClick={onOpenLeaderboard}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs">Ranks</span>
          </button>
        </div>
      </div>

      {/* High score */}
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
const ShopModal = ({ player, prices, onClose, onPurchase, onWatchAd }) => {
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

        {/* Watch Ad section */}
        <div className="border-t border-white/10 pt-4">
          <p className="text-slate-400 text-sm text-center mb-3">Free Rewards</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              data-testid="watch-ad-coins"
              className="btn-3d btn-3d-green text-sm py-3"
              onClick={() => onWatchAd('coins')}
            >
              <Coins className="w-4 h-4 inline mr-1" />
              +20-50 Coins
            </button>
            <button
              data-testid="watch-ad-life"
              className="btn-3d btn-3d-red text-sm py-3"
              onClick={() => onWatchAd('life')}
            >
              <Heart className="w-4 h-4 inline mr-1" />
              +1 Life
            </button>
          </div>
          <p className="text-slate-500 text-xs text-center mt-2">Watch a short ad</p>
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
            const isLocked = day > status.next_reward_day || (day === status.next_reward_day && !status.can_claim);

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

// Game Over Modal
const GameOverModal = ({ won, score, targetScore, coinsEarned, newHighScore, onRestart, onMainMenu }) => {
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
      onSubmit(name.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content text-center">
        <h2 className="font-heading text-4xl font-bold text-white mb-2">
          GEM <span className="text-amber-400">CRUSH</span>
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
  // Game state
  const [board, setBoard] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_LEVEL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'gameover'
  const [gameWon, setGameWon] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [newHighScore, setNewHighScore] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [comboCount, setComboCount] = useState(0);

  // Player state
  const [player, setPlayer] = useState(null);
  const [showNameInput, setShowNameInput] = useState(true);
  
  // UI state
  const [showShop, setShowShop] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [shopPrices, setShopPrices] = useState({});
  const [dailyRewardStatus, setDailyRewardStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Drag state
  const dragStart = useRef(null);
  const isDragging = useRef(false);

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
    try {
      const res = await axios.post(`${API}/game/start?player_id=${player.id}`);
      if (res.data.success) {
        setPlayer(prev => ({ ...prev, lives: res.data.lives_remaining, power_ups: res.data.power_ups }));
        setBoard(createBoard());
        setScore(0);
        setMovesLeft(MOVES_PER_LEVEL);
        setComboCount(0);
        setGameState('playing');
        setGameWon(false);
        setNewHighScore(false);
        setActivePowerUp(null);
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

  // Get target score for current level
  const getTargetScore = () => {
    const level = player?.current_level || 1;
    return LEVEL_SCORE_TARGETS[Math.min(level - 1, LEVEL_SCORE_TARGETS.length - 1)];
  };

  // Check for matches
  const findMatches = useCallback((currentBoard) => {
    const matches = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const type = currentBoard[row][col].type;
        if (type && currentBoard[row][col + 1].type === type && currentBoard[row][col + 2].type === type) {
          matches.add(`${row}-${col}`);
          matches.add(`${row}-${col + 1}`);
          matches.add(`${row}-${col + 2}`);
          // Check for 4+ matches
          if (col + 3 < BOARD_SIZE && currentBoard[row][col + 3].type === type) {
            matches.add(`${row}-${col + 3}`);
          }
          if (col + 4 < BOARD_SIZE && currentBoard[row][col + 4].type === type) {
            matches.add(`${row}-${col + 4}`);
          }
        }
      }
    }
    
    // Check vertical matches
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const type = currentBoard[row][col].type;
        if (type && currentBoard[row + 1][col].type === type && currentBoard[row + 2][col].type === type) {
          matches.add(`${row}-${col}`);
          matches.add(`${row + 1}-${col}`);
          matches.add(`${row + 2}-${col}`);
          // Check for 4+ matches
          if (row + 3 < BOARD_SIZE && currentBoard[row + 3][col].type === type) {
            matches.add(`${row + 3}-${col}`);
          }
          if (row + 4 < BOARD_SIZE && currentBoard[row + 4][col].type === type) {
            matches.add(`${row + 4}-${col}`);
          }
        }
      }
    }
    
    return matches;
  }, []);

  // Process matches and cascade
  const processMatches = useCallback(async (currentBoard, isInitial = false) => {
    let newBoard = currentBoard.map(row => row.map(gem => ({ ...gem })));
    let totalMatched = 0;
    let cascadeCount = 0;
    
    const processOnce = async () => {
      const matches = findMatches(newBoard);
      
      if (matches.size === 0) return false;
      
      totalMatched += matches.size;
      cascadeCount++;
      
      // Mark matched gems
      matches.forEach(key => {
        const [row, col] = key.split('-').map(Number);
        newBoard[row][col].matched = true;
      });
      
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
        
        // Fill with new gems
        while (newCol.length < BOARD_SIZE) {
          newCol.push({
            type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
            id: `new-${col}-${Date.now()}-${Math.random()}`,
            matched: false,
            falling: true
          });
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
      // Calculate score with combo multiplier
      const baseScore = totalMatched * 10;
      const comboMultiplier = Math.min(cascadeCount, 5);
      const finalScore = baseScore * comboMultiplier;
      setScore(prev => prev + finalScore);
      setComboCount(cascadeCount);
      
      if (cascadeCount >= 3) {
        // Add shake effect for big combos
        document.querySelector('.game-board')?.classList.add('shake');
        setTimeout(() => {
          document.querySelector('.game-board')?.classList.remove('shake');
        }, 300);
      }
    }
    
    return newBoard;
  }, [findMatches]);

  // Swap gems
  const swapGems = useCallback(async (row1, col1, row2, col2) => {
    if (isProcessing) return;
    
    // Check if swap is valid (adjacent)
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    if (rowDiff + colDiff !== 1) return;
    
    setIsProcessing(true);
    
    // Perform swap
    const newBoard = board.map(row => row.map(gem => ({ ...gem })));
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;
    
    setBoard(newBoard);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Check for matches
    const matches = findMatches(newBoard);
    
    if (matches.size > 0) {
      // Valid move
      setMovesLeft(prev => prev - 1);
      await processMatches(newBoard);
    } else {
      // Invalid move - swap back
      const revertBoard = newBoard.map(row => row.map(gem => ({ ...gem })));
      const temp2 = revertBoard[row1][col1];
      revertBoard[row1][col1] = revertBoard[row2][col2];
      revertBoard[row2][col2] = temp2;
      setBoard(revertBoard);
    }
    
    setSelectedGem(null);
    setIsProcessing(false);
  }, [board, isProcessing, findMatches, processMatches]);

  // Handle gem click
  const handleGemClick = (row, col) => {
    if (isProcessing || gameState !== 'playing') return;
    
    // Handle power-up usage
    if (activePowerUp) {
      applyPowerUp(row, col);
      return;
    }
    
    if (selectedGem) {
      swapGems(selectedGem.row, selectedGem.col, row, col);
    } else {
      setSelectedGem({ row, col });
    }
  };

  // Drag handlers
  const handleDragStart = (row, col) => {
    if (isProcessing || gameState !== 'playing' || activePowerUp) return;
    dragStart.current = { row, col };
    isDragging.current = true;
  };

  const handleDragEnter = (row, col) => {
    if (!isDragging.current || !dragStart.current || isProcessing) return;
    
    const { row: startRow, col: startCol } = dragStart.current;
    if (startRow === row && startCol === col) return;
    
    const rowDiff = Math.abs(row - startRow);
    const colDiff = Math.abs(col - startCol);
    
    if (rowDiff + colDiff === 1) {
      isDragging.current = false;
      swapGems(startRow, startCol, row, col);
      dragStart.current = null;
    }
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    dragStart.current = null;
  };

  // Apply power-up to gem
  const applyPowerUp = async (row, col) => {
    if (!activePowerUp) return;
    
    setIsProcessing(true);
    
    try {
      await axios.post(`${API}/powerup/use`, {
        player_id: player.id,
        power_up_type: activePowerUp
      });
      
      const newBoard = board.map(r => r.map(gem => ({ ...gem })));
      
      if (activePowerUp === 'hammer') {
        // Remove single gem
        newBoard[row][col].matched = true;
        setBoard(newBoard);
        await processMatches(newBoard);
      } else if (activePowerUp === 'color_bomb') {
        // Remove all gems of same color
        const targetType = newBoard[row][col].type;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (newBoard[r][c].type === targetType) {
              newBoard[r][c].matched = true;
            }
          }
        }
        setBoard(newBoard);
        await processMatches(newBoard);
      } else if (activePowerUp === 'shuffle') {
        // Shuffle all gems
        const allGems = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            allGems.push(newBoard[r][c].type);
          }
        }
        // Fisher-Yates shuffle
        for (let i = allGems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
        }
        let idx = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            newBoard[r][c] = {
              ...newBoard[r][c],
              type: allGems[idx++],
              id: `shuffle-${r}-${c}-${Date.now()}`
            };
          }
        }
        setBoard(newBoard);
        await processMatches(newBoard);
      }
      
      // Update player power-ups locally
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
  };

  // Toggle power-up selection
  const togglePowerUp = (type) => {
    if (activePowerUp === type) {
      setActivePowerUp(null);
    } else if (player.power_ups[type] > 0) {
      setActivePowerUp(type);
      setSelectedGem(null);
    }
  };

  // Shop purchase
  const handlePurchase = async (itemType, quantity) => {
    try {
      const res = await axios.post(`${API}/shop/purchase`, {
        player_id: player.id,
        item_type: itemType,
        quantity: quantity
      });
      if (res.data.success) {
        setPlayer(res.data.player);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.response?.data?.detail || 'Purchase failed');
    }
  };

  // Watch ad
  const handleWatchAd = async (rewardType) => {
    try {
      // Simulate ad watching delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await axios.post(`${API}/ads/watch?player_id=${player.id}&reward_type=${rewardType}`);
      if (res.data.success) {
        alert(`You earned ${res.data.amount} ${res.data.reward_type}!`);
        await refreshPlayer();
      }
    } catch (err) {
      console.error('Ad watch error:', err);
    }
  };

  // Claim daily reward
  const handleClaimDailyReward = async () => {
    try {
      const res = await axios.post(`${API}/daily-reward/claim`, { player_id: player.id });
      if (res.data.success) {
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
          onOpenShop={() => setShowShop(true)}
          onOpenLeaderboard={() => {
            loadLeaderboard();
            setShowLeaderboard(true);
          }}
          onOpenDailyReward={() => {
            loadDailyRewardStatus(player.id);
            setShowDailyReward(true);
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
                  onClick={handleGemClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragEnter={handleDragEnter}
                />
              ))
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <button
              data-testid="quit-game-button"
              className="text-slate-400 hover:text-white text-sm"
              onClick={() => {
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
            setGameState('menu');
            refreshPlayer();
          }}
        />
      )}
      
      {showShop && (
        <ShopModal
          player={player}
          prices={shopPrices}
          onClose={() => setShowShop(false)}
          onPurchase={handlePurchase}
          onWatchAd={handleWatchAd}
        />
      )}
      
      {showDailyReward && (
        <DailyRewardModal
          status={dailyRewardStatus}
          onClose={() => setShowDailyReward(false)}
          onClaim={handleClaimDailyReward}
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
