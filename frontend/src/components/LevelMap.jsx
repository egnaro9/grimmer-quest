import React, { useState, useEffect } from 'react';
import { Star, Lock, Play, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { WORLDS, getLevelsInWorld, getWorldForLevel, WORLD_COLORS, getLevelConfig } from '../config/levels';

/**
 * Level Node Component - Represents a single level on the map
 */
const LevelNode = ({ level, levelConfig, currentLevel, onSelect, position }) => {
  const isCompleted = level < currentLevel;
  const isCurrent = level === currentLevel;
  const isUnlocked = level <= currentLevel;
  const isLocked = level > currentLevel;

  // Node state styling
  let nodeStyle = 'bg-slate-700 border-slate-600 text-slate-500';
  let innerStyle = '';
  
  if (isCompleted) {
    nodeStyle = 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-amber-900 cursor-pointer hover:scale-110';
    innerStyle = 'shadow-lg shadow-amber-500/30';
  } else if (isCurrent) {
    nodeStyle = 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-emerald-900 cursor-pointer hover:scale-110 animate-pulse';
    innerStyle = 'shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-400/50';
  } else if (isLocked) {
    nodeStyle = 'bg-slate-800/80 border-slate-700 text-slate-600';
  }

  return (
    <div 
      className={`relative flex flex-col items-center ${position}`}
      style={{ zIndex: isCurrent ? 20 : 10 }}
    >
      {/* Connection line to next node (rendered by parent) */}
      
      {/* Node circle */}
      <button
        data-testid={`level-node-${level}`}
        className={`
          w-14 h-14 rounded-full border-3 flex items-center justify-center
          transition-all duration-200 font-bold text-lg
          ${nodeStyle} ${innerStyle}
        `}
        onClick={() => isUnlocked && onSelect(level)}
        disabled={isLocked}
      >
        {isCompleted ? (
          <Star className="w-6 h-6 fill-current" />
        ) : isCurrent ? (
          <Zap className="w-6 h-6 fill-current" />
        ) : isLocked ? (
          <Lock className="w-5 h-5" />
        ) : (
          level
        )}
      </button>
      
      {/* Level number label */}
      <div className={`
        mt-1 text-xs font-bold
        ${isCompleted ? 'text-amber-400' : isCurrent ? 'text-emerald-400' : 'text-slate-500'}
      `}>
        {level}
      </div>
      
      {/* Current level indicator */}
      {isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
            YOU
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * World Tab Component
 */
const WorldTab = ({ world, isActive, isUnlocked, onClick }) => {
  const colors = WORLD_COLORS[world.color] || WORLD_COLORS.emerald;
  
  return (
    <button
      data-testid={`world-tab-${world.id}`}
      className={`
        px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1
        ${isActive 
          ? `${colors.node} text-white shadow-lg` 
          : isUnlocked 
            ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' 
            : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
        }
      `}
      onClick={() => isUnlocked && onClick(world.id)}
      disabled={!isUnlocked}
    >
      <span>{world.icon}</span>
      <span className="hidden sm:inline">{world.name}</span>
    </button>
  );
};

/**
 * Level Map Component - Main progression screen
 */
export const LevelMap = ({ 
  currentLevel, 
  onSelectLevel, 
  onClose,
  playerLives
}) => {
  const [selectedWorld, setSelectedWorld] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  
  // Determine which world the current level is in
  useEffect(() => {
    const world = getWorldForLevel(currentLevel);
    setSelectedWorld(world.id);
    setSelectedLevel(currentLevel);
  }, [currentLevel]);

  // Get levels for current world
  const worldLevels = getLevelsInWorld(selectedWorld);
  const currentWorld = WORLDS.find(w => w.id === selectedWorld) || WORLDS[0];
  const colors = WORLD_COLORS[currentWorld.color] || WORLD_COLORS.emerald;
  
  // Selected level config
  const selectedLevelConfig = getLevelConfig(selectedLevel);
  const isSelectedUnlocked = selectedLevel <= currentLevel;
  
  // Check which worlds are unlocked
  const getWorldUnlocked = (worldId) => {
    const world = WORLDS.find(w => w.id === worldId);
    return world && currentLevel >= world.levels[0];
  };

  // Handle level node selection
  const handleNodeSelect = (level) => {
    setSelectedLevel(level);
  };

  // Handle play button
  const handlePlay = () => {
    console.log('[LevelMap] Play clicked, level:', selectedLevel, 'lives:', playerLives, 'unlocked:', isSelectedUnlocked);
    if (isSelectedUnlocked && playerLives > 0) {
      onSelectLevel(selectedLevel);
    }
  };

  // Navigate between worlds
  const canGoPrev = selectedWorld > 1;
  const canGoNext = selectedWorld < WORLDS.length && getWorldUnlocked(selectedWorld + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Map Container */}
      <div className={`
        relative w-full max-w-lg bg-gradient-to-b ${colors.bg} 
        rounded-2xl border border-white/10 shadow-2xl overflow-hidden
      `}>
        {/* Header */}
        <div className="relative p-4 border-b border-white/10">
          <button
            data-testid="close-map-button"
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <span className="text-2xl">&times;</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-1">
              {currentWorld.icon} {currentWorld.name}
            </h2>
            <p className="text-sm text-slate-400">{currentWorld.description}</p>
          </div>
        </div>
        
        {/* World Tabs */}
        <div className="flex gap-1 p-2 bg-black/20 overflow-x-auto">
          {WORLDS.map(world => (
            <WorldTab
              key={world.id}
              world={world}
              isActive={selectedWorld === world.id}
              isUnlocked={getWorldUnlocked(world.id)}
              onClick={setSelectedWorld}
            />
          ))}
        </div>
        
        {/* Map Grid */}
        <div className="p-4 min-h-[280px]">
          {/* World navigation arrows */}
          <div className="flex justify-between mb-4">
            <button
              className={`p-2 rounded-full ${canGoPrev ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-slate-700 cursor-not-allowed'}`}
              onClick={() => canGoPrev && setSelectedWorld(prev => prev - 1)}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-slate-400 text-sm">
              Levels {currentWorld.levels[0]} - {currentWorld.levels[1]}
            </div>
            <button
              className={`p-2 rounded-full ${canGoNext ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-slate-700 cursor-not-allowed'}`}
              onClick={() => canGoNext && setSelectedWorld(prev => prev + 1)}
              disabled={!canGoNext}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Level nodes grid - 2 rows of 5 */}
          <div className="relative">
            {/* Path lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {/* Horizontal paths - Row 1 */}
              {[0, 1, 2, 3].map(i => (
                <line
                  key={`h1-${i}`}
                  x1={`${10 + i * 20 + 5}%`}
                  y1="25%"
                  x2={`${10 + (i + 1) * 20 - 5}%`}
                  y2="25%"
                  stroke={colors.node.replace('bg-', '#').replace('-500', '')}
                  strokeWidth="4"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                />
              ))}
              {/* Vertical connector between rows */}
              <line
                x1="90%"
                y1="30%"
                x2="90%"
                y2="70%"
                stroke={colors.node.replace('bg-', '#').replace('-500', '')}
                strokeWidth="4"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              {/* Horizontal paths - Row 2 (reversed) */}
              {[0, 1, 2, 3].map(i => (
                <line
                  key={`h2-${i}`}
                  x1={`${90 - i * 20 - 5}%`}
                  y1="75%"
                  x2={`${90 - (i + 1) * 20 + 5}%`}
                  y2="75%"
                  stroke={colors.node.replace('bg-', '#').replace('-500', '')}
                  strokeWidth="4"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                />
              ))}
            </svg>
            
            {/* Row 1: Levels 1-5 */}
            <div className="flex justify-around mb-8 relative" style={{ zIndex: 5 }}>
              {worldLevels.slice(0, 5).map((levelConfig, idx) => (
                <LevelNode
                  key={levelConfig.level}
                  level={levelConfig.level}
                  levelConfig={levelConfig}
                  currentLevel={currentLevel}
                  onSelect={handleNodeSelect}
                  position=""
                />
              ))}
            </div>
            
            {/* Row 2: Levels 6-10 (reversed for snake pattern) */}
            <div className="flex justify-around flex-row-reverse relative" style={{ zIndex: 5 }}>
              {worldLevels.slice(5, 10).map((levelConfig, idx) => (
                <LevelNode
                  key={levelConfig.level}
                  level={levelConfig.level}
                  levelConfig={levelConfig}
                  currentLevel={currentLevel}
                  onSelect={handleNodeSelect}
                  position=""
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Selected Level Info */}
        <div className="p-4 bg-black/30 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">
                Level {selectedLevel}
                {selectedLevel === currentLevel && (
                  <span className="ml-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}
                {selectedLevel < currentLevel && (
                  <span className="ml-2 text-xs bg-amber-500 text-amber-900 px-2 py-0.5 rounded-full">
                    COMPLETED
                  </span>
                )}
              </h3>
              <p className="text-slate-400 text-sm">{selectedLevelConfig.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-slate-500">Target</div>
              <div className="text-amber-400 font-bold">{selectedLevelConfig.targetScore.toLocaleString()}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-slate-500">Moves</div>
              <div className="text-white font-bold">{selectedLevelConfig.moves}</div>
            </div>
          </div>
          
          {isSelectedUnlocked ? (
            <button
              data-testid="play-selected-level"
              className={`
                w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2
                ${playerLives > 0 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
              onClick={handlePlay}
              disabled={playerLives <= 0}
            >
              <Play className="w-5 h-5" />
              {playerLives > 0 
                ? `Play Level ${selectedLevel}` 
                : 'No Lives Remaining'
              }
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-slate-700/50 text-slate-500 text-center font-bold flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Complete Level {selectedLevel - 1} to Unlock
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelMap;
