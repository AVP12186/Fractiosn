/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Difficulty,
  Fraction,
  Enemy,
  RuneGate,
  Chest,
  SpellType,
  PlayerStats,
  StoryChapter,
  CharacterConfig,
  BlockQuestion,
  addFractions,
  areFractionsEqual,
  reduceFraction,
  fractionToString,
} from './types/game';
import {
  generateRoom,
  getCardsForDifficulty,
  getBlockQuestionsForFloor,
  generateBlockDefenseQuestion,
} from './data/dungeonLevels';
import { DungeonView } from './graphics/DungeonView';
import { CardDeckHUD } from './components/CardDeckHUD';
import { PokemonBattleView } from './components/PokemonBattleView';
import { BossBattleHUD } from './components/BossBattleHUD';
import { FractionCodexModal } from './components/FractionCodexModal';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { BlockQuestionModal } from './components/BlockQuestionModal';
import { BlockDefenseModal, BlockDefenseQuestion } from './components/BlockDefenseModal';
import { HealthSpot } from './components/HealthSpot';
import { StoryModal } from './components/StoryModal';
import { VirtualJoystick } from './components/VirtualJoystick';
import { sound } from './audio/soundEngine';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Tv,
  Heart,
  Trophy,
  RotateCcw,
  Sparkles,
  Gamepad2,
  User,
  Footprints,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  // Game Configuration & Screen State
  const [screen, setScreen] = useState<'title' | 'story' | 'playing' | 'gameover' | 'victory'>('title');
  const [difficulty, setDifficulty] = useState<Difficulty>('apprentice');
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showJoystick, setShowJoystick] = useState(true);
  const [joystickVector, setJoystickVector] = useState({ vx: 0, vz: 0 });
  const [pokemonBattleEnemy, setPokemonBattleEnemy] = useState<Enemy | null>(null);
  const [activeStoryChapter, setActiveStoryChapter] = useState<StoryChapter | null>(null);

  // Character Customization with localStorage persistence
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(() => {
    try {
      const saved = localStorage.getItem('fraction_tower_hero_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return {
      robeColor: '#2563eb',
      hatStyle: 'wizard',
      accessory: 'none',
      wandStyle: 'wood',
    };
  });

  const handleUpdateCharacterConfig = (newConfig: CharacterConfig) => {
    setCharacterConfig(newConfig);
    try {
      localStorage.setItem('fraction_tower_hero_config', JSON.stringify(newConfig));
    } catch {
      // Ignored
    }
  };

  // Tower Trial Block Questions (between fights / for stairs)
  const [activeBlockQuestion, setActiveBlockQuestion] = useState<BlockQuestion | null>(null);
  const [showBlockQuestion, setShowBlockQuestion] = useState(false);

  // Live Mob Contact Block Defense System
  const [activeBlockDefenseQuestion, setActiveBlockDefenseQuestion] = useState<BlockDefenseQuestion | null>(null);
  const [showBlockDefenseModal, setShowBlockDefenseModal] = useState(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [lastDamageTime, setLastDamageTime] = useState(0);

  // Player & Level State
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 30,
    maxHp: 30,
    score: 0,
    floor: 1,
    relicShards: 0,
    potionsBrewed: 0,
    spellsCast: 0,
    accuracyStreak: 0,
    bestStreak: 0,
    level: 1,
    exp: 0,
    nextExp: 100,
    armor: 1,
    damageBonus: 0,
  });

  const [playerPos, setPlayerPos] = useState({ x: 0, z: 6 });
  const [currentRoom, setCurrentRoom] = useState(() => generateRoom(1, 'apprentice'));

  // Alchemical Flask State
  const [currentMixture, setCurrentMixture] = useState<Fraction>({ n: 0, d: 1 });
  const [selectedVials, setSelectedVials] = useState<Fraction[]>([]);
  const [targetEnemyId, setTargetEnemyId] = useState<string | null>(null);
  const [activeProjectiles, setActiveProjectiles] = useState<
    { type: SpellType; fraction: Fraction; targetEnemyId?: string; timestamp: number }[]
  >([]);

  // Boss telegraph timer
  const [bossTelegraphTimer, setBossTelegraphTimer] = useState(0);

  // Notification Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // High score tracking
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('fraction_tower_high_score') || '0', 10);
  });

  // Story definition archives
  const storyChapters: Record<string, StoryChapter> = {
    intro: {
      id: 1,
      speaker: 'Master Eldon',
      portrait: 'elder',
      text: 'Arc, welcome to Fraction Tower! The Great Relic of Wholes has shattered into fragments across 6 treacherous floors. Solve fraction trials, defeat corrupted guardians, and climb the ancient stairs to the Apex!',
    },
    bossGorgon: {
      id: 2,
      speaker: 'The Void Gorgon',
      portrait: 'gorgon',
      text: 'Hssss! You dare climb to Floor 3? My petrifying gaze seals away fractions! Match my serpentine barriers or turn into stone!',
    },
    bossChimera: {
      id: 3,
      speaker: 'The Infernal Chimera',
      portrait: 'colossus',
      text: 'Roaaar! Welcome to Floor 5: The Magma Crucible! My molten claws burn those who cannot reduce fractions into their true simplest form!',
    },
    bossColossus: {
      id: 4,
      speaker: 'The Fraction Colossus',
      portrait: 'colossus',
      text: 'Mortal alchemist! You have reached the Apex of Fraction Tower! My 4-quadrant power matrix embodies the ultimate fractions! Face my wrath!',
    },
    victoryStory: {
      id: 5,
      speaker: 'Arc the Alchemist',
      portrait: 'arc',
      text: 'The fragments resonate together in perfect harmony! The Great Relic of Wholes is reforged atop Fraction Tower! Numeria is saved!',
    },
  };

  // Start new run (clicking level starts game directly in current window)
  const startNewGame = (chosenDiff: Difficulty) => {
    setDifficulty(chosenDiff);
    const startingFloor = chosenDiff === 'apprentice' ? 1 : chosenDiff === 'journeyman' ? 8 : 15;
    const initialStats: PlayerStats = {
      hp: 30,
      maxHp: 30,
      score: 0,
      floor: startingFloor,
      relicShards: 0,
      potionsBrewed: 0,
      spellsCast: 0,
      accuracyStreak: 0,
      bestStreak: 0,
      level: startingFloor,
      exp: 0,
      nextExp: 100,
      armor: 1,
      damageBonus: 0,
    };
    setPlayerStats(initialStats);
    setPlayerPos({ x: 0, z: 6 });
    setCurrentRoom(generateRoom(startingFloor, chosenDiff));
    setCurrentMixture({ n: 0, d: 1 });
    setSelectedVials([]);
    setTargetEnemyId(null);
    setActiveProjectiles([]);
    setIsInvulnerable(false);
    setShowBlockDefenseModal(false);
    setActiveStoryChapter(storyChapters.intro);
    setScreen('story');
  };

  // Active targeted fraction
  const targetedEnemy = currentRoom.enemies.find((e) => e.id === targetEnemyId) || currentRoom.enemies[0] || null;
  const activeTargetFraction: Fraction | null = targetedEnemy?.shield || currentRoom.gates[0]?.requiredFraction || null;

  // Move player with keyboard or controls
  const handleMoveDelta = useCallback(
    (dx: number, dz: number) => {
      setPlayerPos((prev) => {
        const halfW = currentRoom.width / 2 - 1.2;
        const halfH = currentRoom.height / 2 - 1.2;
        const nx = Math.max(-halfW, Math.min(halfW, prev.x + dx));
        const nz = Math.max(-halfH, Math.min(halfH, prev.z + dz));
        return { x: nx, z: nz };
      });
      sound.playStep();
    },
    [currentRoom.width, currentRoom.height]
  );

  // Keyboard navigation with Chrome window scroll-prevention
  useEffect(() => {
    if (screen !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 1.2;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'w' || e.key === 'ArrowUp') handleMoveDelta(0, -step);
      else if (e.key === 's' || e.key === 'ArrowDown') handleMoveDelta(0, step);
      else if (e.key === 'a' || e.key === 'ArrowLeft') handleMoveDelta(-step, 0);
      else if (e.key === 'd' || e.key === 'ArrowRight') handleMoveDelta(step, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleMoveDelta]);

  // Mob Attack & Block Defense Handler
  const handleMobAttack = (enemy: Enemy) => {
    if (isInvulnerable || screen !== 'playing' || pokemonBattleEnemy || showBlockDefenseModal) return;
    const q = generateBlockDefenseQuestion(enemy.name, enemy.type, playerStats.floor);
    setActiveBlockDefenseQuestion(q);
    setShowBlockDefenseModal(true);
  };

  const handleResolveBlockDefense = (wasSaved: boolean) => {
    setShowBlockDefenseModal(false);
    setIsInvulnerable(true);
    setLastDamageTime(Date.now());

    const dmg = wasSaved ? Math.max(1, 2 - playerStats.armor) : Math.max(1, 4 - playerStats.armor);

    if (wasSaved) {
      showBanner(`🛡️ BLOCKED! Shield absorbed the brunt! Armor mitigated damage to ${dmg} DMG!`);
    } else {
      showBanner(`💥 BLOCK BROKEN! Direct hit! Armor mitigated damage to ${dmg} DMG!`);
    }

    setPlayerStats((prev) => {
      const nextHp = Math.max(0, prev.hp - dmg);
      if (nextHp <= 0) {
        setScreen('gameover');
      }
      return { ...prev, hp: nextHp };
    });

    // Temporary invulnerability shield so Arc can move away safely
    setTimeout(() => {
      setIsInvulnerable(false);
    }, 5000);
  };

  // Cast Spell Logic
  const handleCastSpell = (fraction: Fraction, spellType: SpellType) => {
    sound.playSpellCast(spellType);

    const timestamp = Date.now();
    setActiveProjectiles((prev) => [
      ...prev,
      {
        type: spellType,
        fraction,
        targetEnemyId: targetedEnemy?.id,
        timestamp,
      },
    ]);

    setPlayerStats((prev) => ({ ...prev, spellsCast: prev.spellsCast + 1 }));

    setTimeout(() => {
      if (!targetedEnemy) {
        showBanner(`Spell burst cast with ${fractionToString(fraction)}!`);
        return;
      }

      // Check against enemy shield
      if (targetedEnemy.shield) {
        const isMatch = areFractionsEqual(fraction, targetedEnemy.shield);
        if (isMatch) {
          sound.playShieldBreak();
          showBanner(`💥 SHATTERED ${targetedEnemy.name}'s Barrier with ${fractionToString(fraction)}! Their HP is now vulnerable!`);

          const updatedEnemies = currentRoom.enemies.map((e) => {
            if (e.id === targetedEnemy.id) {
              return { ...e, shield: null };
            }
            return e;
          });

          setPlayerStats((prev) => {
            const newStreak = prev.accuracyStreak + 1;
            const newScore = prev.score + 150 + newStreak * 25;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('fraction_tower_high_score', newScore.toString());
            }
            return {
              ...prev,
              score: newScore,
              accuracyStreak: newStreak,
              bestStreak: Math.max(prev.bestStreak, newStreak),
            };
          });

          setCurrentRoom((prev) => ({ ...prev, enemies: updatedEnemies }));
        } else {
          sound.playWrong();
          const targetStr = fractionToString(targetedEnemy.shield);
          const currentStr = fractionToString(fraction);
          showBanner(`❌ Barrier Shield Blocked It! Cast: ${currentStr} vs Required Barrier: ${targetStr} (0 damage)`);
          setPlayerStats((prev) => ({ ...prev, accuracyStreak: 0 }));
        }
      } else {
        // Barrier is down: damage HP!
        sound.playEnemyHurt();
        const dmg = Math.max(1, 2 + (playerStats.damageBonus || 0));
        let enemyDied = false;

        const updatedEnemies = currentRoom.enemies
          .map((e) => {
            if (e.id === targetedEnemy.id) {
              const newHp = Math.max(0, e.hp - dmg);
              if (newHp === 0) enemyDied = true;
              return { ...e, hp: newHp };
            }
            return e;
          })
          .filter((e) => e.hp > 0);

        if (enemyDied) {
          sound.playVictoryFanfare();
          showBanner(`✨ Defeated ${targetedEnemy.name}! 64x64 Loot Dropped: +1 Damage Power & +1 Block Power!`);
          setPlayerStats((prev) => ({
            ...prev,
            score: prev.score + 100,
            armor: prev.armor + 1,
            damageBonus: prev.damageBonus + 1,
          }));
        }

        setCurrentRoom((prev) => ({ ...prev, enemies: updatedEnemies }));

        if (targetedEnemy.isBoss) {
          handleBossPhaseProgression(Math.max(0, targetedEnemy.hp - dmg));
        }
      }
    }, 450);
  };

  // Boss Phase Transition Handler
  const handleBossPhaseProgression = (remainingHp: number) => {
    if (remainingHp <= 0) {
      sound.playVictoryFanfare();
      if (playerStats.floor === 6) {
        setPlayerStats((prev) => ({ ...prev, score: prev.score + 1500, relicShards: 6 }));
        setActiveStoryChapter(storyChapters.victoryStory);
        setScreen('story');
      } else {
        showBanner(`🏆 Boss Defeated! Tower Stairs Unlocked!`);
        if (currentRoom.stairs) {
          currentRoom.stairs.active = true;
        }
      }
      return;
    }

    const boss = currentRoom.enemies.find((e) => e.isBoss);
    if (!boss) return;

    if (remainingHp < 80 && (boss.bossPhase || 1) < 3) {
      boss.bossPhase = 3;
      boss.shield = difficulty === 'grandmaster' ? { n: 5, d: 6 } : { n: 3, d: 4 };
      sound.playBossRoar();
      showBanner('⚡ BOSS ENTERED PHASE 3: Unlike Denominators Barrier!');
    } else if (remainingHp < 140 && (boss.bossPhase || 1) < 2) {
      boss.bossPhase = 2;
      boss.shield = { n: 4, d: 6 };
      sound.playBossRoar();
      showBanner('⚡ BOSS ENTERED PHASE 2: Equivalent Fraction Barrier!');
    }
  };

  // Trigger Block Question when room mobs are wiped
  useEffect(() => {
    if (screen !== 'playing') return;

    if (currentRoom.enemies.length === 0 && !currentRoom.cleared) {
      currentRoom.cleared = true;
      sound.playChamberClear();

      if (playerStats.floor === 6) {
        sound.playVictoryFanfare();
        setActiveStoryChapter(storyChapters.victoryStory);
        setScreen('story');
        return;
      }

      // Pop up the Floor Trial Block Question
      setTimeout(() => {
        const q = getBlockQuestionsForFloor(playerStats.floor);
        setActiveBlockQuestion(q);
        setShowBlockQuestion(true);
      }, 1000);
    }
  }, [currentRoom.enemies.length, currentRoom.cleared, playerStats.floor, screen]);

  // Answer Block Question handler
  const handleAnswerBlockQuestion = (isCorrect: boolean) => {
    if (isCorrect) {
      setShowBlockQuestion(false);
      sound.playVictoryFanfare();
      showBanner(`🌟 Ancient Rune Block Shattered! Walk up the stairs to ascend!`);

      // Activate Stairs
      if (currentRoom.stairs) {
        currentRoom.stairs.active = true;
        setCurrentRoom((prev) => ({
          ...prev,
          stairs: { ...prev.stairs!, active: true },
        }));
      }

      setPlayerStats((prev) => ({
        ...prev,
        score: prev.score + 200,
        relicShards: prev.relicShards + 1,
      }));
    } else {
      showBanner('❌ Incorrect fraction! Review the visual diagram and try again!');
    }
  };

  // Handle Walking Up Actual Stairs
  const handleAscendStairs = () => {
    if (playerStats.floor >= 6) return;

    const nextFloor = playerStats.floor + 1;
    sound.playChamberClear();
    showBanner(`🚀 Ascending to Floor ${nextFloor} of Fraction Tower!`);

    setPlayerStats((prev) => ({
      ...prev,
      floor: nextFloor,
      score: prev.score + 250,
    }));

    setPlayerPos({ x: 0, z: 6 });
    setCurrentRoom(generateRoom(nextFloor, difficulty));

    // Story cutscenes for bosses
    if (nextFloor === 3) {
      setActiveStoryChapter(storyChapters.bossGorgon);
      setScreen('story');
    } else if (nextFloor === 5) {
      setActiveStoryChapter(storyChapters.bossChimera);
      setScreen('story');
    } else if (nextFloor === 6) {
      setActiveStoryChapter(storyChapters.bossColossus);
      setScreen('story');
    }
  };

  // Boss attack telegraph loop
  useEffect(() => {
    if (screen !== 'playing' || !currentRoom.isBossRoom) return;

    const interval = setInterval(() => {
      const boss = currentRoom.enemies.find((e) => e.isBoss);
      if (!boss || boss.hp <= 0) return;

      setBossTelegraphTimer((prev) => {
        if (prev >= 1) {
          handleMobAttack(boss);
          return 0;
        }
        return prev + 0.08;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [screen, currentRoom.isBossRoom, currentRoom.enemies, isInvulnerable]);

  // Chest Click Interactor
  const handleChestOpen = (chest: Chest) => {
    if (!chest.opened) {
      chest.opened = true;
      sound.playChestOpen();
      showBanner(`🎁 ${chest.rewardText}`);
      setPlayerStats((prev) => ({ ...prev, score: prev.score + 75 }));
    }
  };

  const availableCards = getCardsForDifficulty(difficulty);

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#080c14] select-none ${crtEnabled ? 'crt-overlay crt-vignette' : ''}`}>
      
      {/* Top Header / Browser-formatted Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-12 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between backdrop-blur-md select-none">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <span className="font-pixel text-xs text-amber-400 drop-shadow">FRACTION TOWER</span>
          <span className="text-slate-600 font-mono text-xs">·</span>
          <span className="text-xs text-slate-300 font-retro hidden sm:inline">
            Floor {playerStats.floor} / 6: {currentRoom.title}
          </span>
        </div>

        {/* Player Stats Zone */}
        <div className="flex items-center gap-4">
          {/* Relic Shards */}
          <div className="flex items-center gap-1.5 text-xs font-retro text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SHARDS: {playerStats.relicShards}/6</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 text-xs font-mono text-cyan-300 hidden md:flex">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tabular-nums">{playerStats.score} PTS</span>
          </div>
        </div>

        {/* Action Controls Zone */}
        <div className="flex items-center gap-2">
          {/* Character Customizer Button */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            title="Customize Arc's Appearance"
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] font-retro hidden lg:inline">HERO</span>
          </button>

          {/* Fraction Codex */}
          <button
            onClick={() => setShowCodex(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-cyan-300 transition-colors"
            title="Open Fraction Codex & Visualizer"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Virtual Joystick Toggle */}
          <button
            onClick={() => setShowJoystick(!showJoystick)}
            className={`p-1.5 rounded-lg transition-colors ${
              showJoystick ? 'bg-cyan-900/60 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Analog Joystick"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* CRT Scanlines Toggle */}
          <button
            onClick={() => setCrtEnabled(!crtEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${
              crtEnabled ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle CRT Retro Filter"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 3D Dungeon Stage */}
      <main className="w-full h-full pt-12 pb-24 relative overflow-hidden">
        {screen === 'playing' && (
          <DungeonView
            playerPos={playerPos}
            onMovePlayer={setPlayerPos}
            enemies={currentRoom.enemies}
            gates={currentRoom.gates}
            chests={currentRoom.chests}
            torches={currentRoom.torches}
            roomWidth={currentRoom.width}
            roomHeight={currentRoom.height}
            activeSpellProjectiles={activeProjectiles}
            characterConfig={characterConfig}
            stairs={currentRoom.stairs}
            onAscendStairs={handleAscendStairs}
            onTargetEnemy={(enemy) => {
              setTargetEnemyId(enemy.id);
              setPokemonBattleEnemy(enemy);
            }}
            onMobAttackPlayer={handleMobAttack}
            isInvulnerable={isInvulnerable}
            onInteractChest={handleChestOpen}
            isBossRoom={currentRoom.isBossRoom}
            joystickVector={joystickVector}
            isBattleActive={!!pokemonBattleEnemy}
          />
        )}
      </main>

      {/* DEDICATED HEALTH SPOT (Top-Left of Screen during gameplay) */}
      {screen === 'playing' && (
        <div className="fixed top-14 left-4 z-20">
          <HealthSpot
            hp={playerStats.hp}
            maxHp={playerStats.maxHp}
            floor={playerStats.floor}
            isInvulnerable={isInvulnerable}
            lastDamageTime={lastDamageTime}
            armor={playerStats.armor}
            damageBonus={playerStats.damageBonus}
          />
        </div>
      )}

      {/* Dynamic Boss HUD during Boss Room */}
      {screen === 'playing' && currentRoom.isBossRoom && currentRoom.enemies[0]?.isBoss && !pokemonBattleEnemy && (
        <BossBattleHUD
          boss={currentRoom.enemies[0]}
          telegraphTimer={bossTelegraphTimer}
          bossPhase={currentRoom.enemies[0].bossPhase || 1}
        />
      )}

      {/* Alchemist Spell Deck Bar (Positioned on the RIGHT - Shown during room exploration, Pokemon battle has dedicated bottom belt!) */}
      {screen === 'playing' && !pokemonBattleEnemy && (
        <CardDeckHUD
          cards={availableCards}
          targetFraction={activeTargetFraction}
          targetName={targetedEnemy?.name || 'Runic Beast'}
          onCastCard={(fraction, spellType) => {
            handleCastSpell(fraction, spellType);
          }}
          onOpenPokemonBattle={() => {
            if (targetedEnemy) {
              setPokemonBattleEnemy(targetedEnemy);
            } else if (currentRoom.enemies.length > 0) {
              setPokemonBattleEnemy(currentRoom.enemies[0]);
            } else {
              showBanner('No monsters remaining in this room!');
            }
          }}
        />
      )}

      {/* Retro Pokémon Red/Blue/Yellow Style Fullscreen Fight Screen with Multi-turn Block Reaction */}
      {pokemonBattleEnemy && (
        <PokemonBattleView
          enemy={pokemonBattleEnemy}
          playerHp={playerStats.hp}
          playerMaxHp={playerStats.maxHp}
          playerLevel={playerStats.floor * 4}
          characterConfig={characterConfig}
          availableCards={availableCards}
          onPlayerTakeDamage={(baseDmg) => {
            const actualDmg = Math.max(1, baseDmg - playerStats.armor);
            setLastDamageTime(Date.now());
            setPlayerStats((prev) => {
              const nextHp = Math.max(0, prev.hp - actualDmg);
              if (nextHp <= 0) {
                setPokemonBattleEnemy(null);
                setScreen('gameover');
              }
              return { ...prev, hp: nextHp };
            });
          }}
          playerArmor={playerStats.armor}
          onEnemyDefeated={(defeatedId) => {
            setPokemonBattleEnemy(null);
            setPlayerPos(prev => ({ x: prev.x + 2, z: prev.z + 2 }));
            showBanner(`✨ Loot Dropped! Runic Power Gem: +1 Armor & +1 Damage Boost!`);

            setCurrentRoom((prev) => ({
              ...prev,
              enemies: prev.enemies.filter((e) => e.id !== defeatedId),
            }));

            setPlayerStats((prev) => {
              const newScore = prev.score + (pokemonBattleEnemy.isBoss ? 500 : 200);
              if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('fraction_tower_high_score', newScore.toString());
              }
              return {
                ...prev,
                score: newScore,
                relicShards: prev.relicShards + (pokemonBattleEnemy.isBoss ? 1 : 0),
                armor: prev.armor + 1,
                damageBonus: prev.damageBonus + 1,
              };
            });
          }}
          onFlee={() => {
            setPokemonBattleEnemy(null);
            showBanner('Got away safely!');
          }}
          onHealPlayer={() => {
            setPlayerStats((prev) => ({
              ...prev,
              hp: Math.min(prev.maxHp, prev.hp + 2),
            }));
            showBanner('🧪 Drank Healing Elixir! Restored 2 HP!');
          }}
        />
      )}

      {/* Tower Trial Block Question in Between Fights (Unlocks Stairs) */}
      {showBlockQuestion && activeBlockQuestion && (
        <BlockQuestionModal
          question={activeBlockQuestion}
          isOpen={showBlockQuestion}
          onAnswer={handleAnswerBlockQuestion}
          onClose={() => setShowBlockQuestion(false)}
        />
      )}

      {/* Real-Time Mob Contact Attack Block Defense Modal */}
      {showBlockDefenseModal && activeBlockDefenseQuestion && (
        <BlockDefenseModal
          question={activeBlockDefenseQuestion}
          isOpen={showBlockDefenseModal}
          onBlockOutcome={handleResolveBlockDefense}
        />
      )}

      {/* Character Customizer Modal (accessible from header) */}
      <CharacterCustomizer
        isOpen={showCustomizer}
        config={characterConfig}
        onChangeConfig={handleUpdateCharacterConfig}
        onClose={() => setShowCustomizer(false)}
      />

      {/* Floating Notification Banner */}
      {bannerMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-cyan-500 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-xs font-retro text-cyan-200 select-none animate-bounce">
          {bannerMessage}
        </div>
      )}

      {/* Virtual Joystick (Anchored bottom-left, unobstructed) */}
      {showJoystick && screen === 'playing' && (
        <VirtualJoystick
          onMoveVector={(vx, vz) => setJoystickVector({ vx, vz })}
          className="fixed bottom-6 left-6 z-20 pointer-events-auto"
        />
      )}

      {/* Fraction Codex Modal */}
      <FractionCodexModal isOpen={showCodex} onClose={() => setShowCodex(false)} />

      {/* Story Chapter Dialog Modal */}
      {screen === 'story' && activeStoryChapter && (
        <StoryModal
          chapter={activeStoryChapter}
          onComplete={() => {
            if (activeStoryChapter.id === 5) {
              setScreen('victory');
            } else {
              setScreen('playing');
            }
          }}
        />
      )}

      {/* START TITLE SCREEN (Classic Layout with Small Button for Hero Customizer & Pixel Styling) */}
      {screen === 'title' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-slate-950 select-none overflow-y-auto font-retro">
          
          {/* Top Title Banner */}
          <div className="text-center max-w-2xl mt-4">
            <span className="text-[10px] sm:text-xs font-mono text-cyan-400 tracking-widest block mb-1">
              RETRO 2.5D ALCHEMY ADVENTURE · PROPER FRACTIONS · POKÉMON ARENA
            </span>
            <h1 className="font-pixel text-2xl sm:text-4xl text-amber-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.4)] leading-tight">
              FRACTION TOWER
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
              Ascend 6 Chambers · Answer Block Reactions to Save Health · Slay Bosses · Reforge Wholes
            </p>

            {/* Quick Action Buttons Row: Small Button for Customization & Codex */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => setShowCustomizer(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border-2 border-amber-500 font-pixel text-[10px] flex items-center gap-2 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Customize Arc's Robes, Hats, Weapons & Skin Tone"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>CUSTOMIZE HERO</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCodex(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border-2 border-cyan-500 font-pixel text-[10px] flex items-center gap-2 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Open Fraction Codex and Visual Aids"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>FRACTION CODEX</span>
              </button>
            </div>
          </div>

          {/* Central Chamber Selection Cards (Classic Clean Layout) */}
          <div className="w-full max-w-xl my-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5">
              <span className="text-xs font-pixel text-amber-400">CHOOSE TOWER EXPEDITION</span>
              <span className="text-[10px] font-mono text-slate-400">Select Rank to Climb</span>
            </div>

            {/* Apprentice Rank */}
            <button
              onClick={() => startNewGame('apprentice')}
              className="p-3 bg-slate-900 hover:bg-emerald-950/70 border-4 border-slate-700 hover:border-emerald-400 text-left transition-all group flex items-center justify-between shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <div>
                <div className="font-pixel text-xs text-emerald-400 group-hover:text-emerald-300">
                  APPRENTICE (FLOORS 1 - 7)
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-retro">
                  Slimes & Stone Golems. Like denominators (1/4, 2/4), pie slice aids.
                </div>
              </div>
              <span className="font-pixel text-[11px] text-emerald-400 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                ENTER →
              </span>
            </button>

            {/* Journeyman Rank */}
            <button
              onClick={() => startNewGame('journeyman')}
              className="p-3 bg-slate-900 hover:bg-cyan-950/70 border-4 border-slate-700 hover:border-cyan-400 text-left transition-all group flex items-center justify-between shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <div>
                <div className="font-pixel text-xs text-cyan-400 group-hover:text-cyan-300">
                  JOURNEYMAN (FLOORS 8 - 14)
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-retro">
                  Shadow Wraiths & Void Gorgon. Equivalent fractions, simplifying 2/4, 3/6.
                </div>
              </div>
              <span className="font-pixel text-[11px] text-cyan-400 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                ENTER →
              </span>
            </button>

            {/* Grandmaster Rank */}
            <button
              onClick={() => startNewGame('grandmaster')}
              className="p-3 bg-slate-900 hover:bg-rose-950/70 border-4 border-slate-700 hover:border-rose-400 text-left transition-all group flex items-center justify-between shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <div>
                <div className="font-pixel text-xs text-rose-400 group-hover:text-rose-300">
                  GRANDMASTER (FLOORS 15 - 21)
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-retro">
                  Infernal Chimera & Fraction Colossus. Unlike denominators, boss trials!
                </div>
              </div>
              <span className="font-pixel text-[11px] text-rose-400 group-hover:translate-x-1 transition-transform ml-2 shrink-0">
                ENTER →
              </span>
            </button>
          </div>

          {/* Bottom Bar: High score & Instructions */}
          <div className="w-full max-w-xl flex items-center justify-between gap-4 text-xs text-slate-400 font-mono border-t-2 border-slate-800 pt-3 pb-1 flex-wrap sm:flex-nowrap">
            <span>High Score: <strong className="text-cyan-300">{highScore}</strong> PTS</span>
            <span className="text-[10px] text-amber-400 font-pixel">ARROWS / WASD TO MOVE</span>
          </div>

        </div>
      )}

      {/* GAME OVER SCREEN */}
      {screen === 'gameover' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md select-none">
          <div className="text-center max-w-md bg-slate-950 border-2 border-rose-900 rounded-2xl p-6 shadow-2xl">
            <h2 className="font-pixel text-2xl text-rose-500 mb-2">RUN FALLEN</h2>
            <p className="font-retro text-xs text-slate-300 mb-4">
              Your alchemical flask cracked on Floor {playerStats.floor} of Fraction Tower.
            </p>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-1 mb-6">
              <div className="flex justify-between">
                <span>Final Score:</span>
                <span className="text-cyan-300 font-bold">{playerStats.score} PTS</span>
              </div>
              <div className="flex justify-between">
                <span>Best Streak:</span>
                <span className="text-emerald-400 font-bold">{playerStats.bestStreak}</span>
              </div>
              <div className="flex justify-between">
                <span>Spells Cast:</span>
                <span className="text-amber-300">{playerStats.spellsCast}</span>
              </div>
            </div>

            <button
              onClick={() => startNewGame(difficulty)}
              className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-retro flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART TOWER CLIMB</span>
            </button>
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {screen === 'victory' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md select-none">
          <div className="text-center max-w-lg bg-slate-950 border-2 border-amber-500 rounded-2xl p-6 shadow-2xl">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto animate-bounce mb-2" />
            <h2 className="font-pixel text-xl sm:text-2xl text-amber-400 mb-1">
              FRACTION TOWER CONQUERED!
            </h2>
            <p className="font-retro text-xs text-slate-300 mb-4">
              You climbed all 6 floors, shattered the trials, and reforged the Great Relic of Wholes!
            </p>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Rank Cleared:</span>
                <span className="text-amber-300 font-bold">{difficulty.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Score:</span>
                <span className="text-cyan-300 font-bold text-sm">{playerStats.score} PTS</span>
              </div>
              <div className="flex justify-between">
                <span>Relic Shards:</span>
                <span className="text-amber-400 font-bold">6 / 6 (COMPLETE)</span>
              </div>
              <div className="flex justify-between">
                <span>Best Streak:</span>
                <span className="text-emerald-400 font-bold">{playerStats.bestStreak} in a row</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('title')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-retro transition-all"
              >
                TITLE SCREEN
              </button>
              <button
                onClick={() => startNewGame(difficulty === 'apprentice' ? 'journeyman' : 'grandmaster')}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-retro flex items-center justify-center gap-1 shadow-lg transition-all active:scale-95"
              >
                <span>NEXT DIFFICULTY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
