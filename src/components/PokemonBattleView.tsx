import React, { useState, useEffect, useRef } from 'react';
import {
  Enemy,
  Fraction,
  SpellType,
  CharacterConfig,
  fractionToString,
  areFractionsEqual,
  addFractions,
  reduceFraction,
  PetCompanion,
  toggleSpellCard,
  damageEnemy,
} from '../types/game';
import { FormattedFraction } from './FormattedFraction';
import { getPlayerSpriteDataURL, getMobSpriteDataURL, getLootGemSpriteDataURL } from '../graphics/pixelTextures';
import { sound } from '../audio/soundEngine';
import { shuffle } from '../data/dungeonLevels';
import {
  Flame,
  Snowflake,
  Zap,
  Sparkles,
  Swords,
  Footprints,
  ShieldAlert,
  Shield,
  Heart,
  RotateCcw,
  Plus,
  HeartCrack,
  FlaskConical,
  Wand2,
} from 'lucide-react';

export interface SpellCard {
  id: string;
  name: string;
  type: SpellType;
  fraction: Fraction;
  color: string;
  bgGradient: string;
}

interface PokemonBattleViewProps {
  enemy: Enemy;
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  characterConfig: CharacterConfig;
  availableCards: SpellCard[];
  onPlayerTakeDamage: (dmg: number) => void;
  onEnemyDefeated: (enemyId: string) => void;
  onFlee: () => void;
  onEnemyUpdated: (enemy: Enemy) => void;
  onHealPlayer?: () => void;
  playerArmor?: number;
  pet?: PetCompanion | null;
  tamingPotions?: number;
  onTameEnemy?: (enemy: Enemy) => void;
}

export const PokemonBattleView: React.FC<PokemonBattleViewProps> = ({
  enemy,
  playerHp,
  playerMaxHp,
  playerLevel,
  characterConfig,
  availableCards,
  onPlayerTakeDamage,
  onEnemyDefeated,
  onFlee,
  onEnemyUpdated,
  onHealPlayer,
  playerArmor = 1,
  pet = null,
  tamingPotions = 0,
  onTameEnemy,
}) => {
  const [currentEnemyHp, setCurrentEnemyHp] = useState(enemy.hp);
  const [enemyShield, setEnemyShield] = useState<Fraction | null>(enemy.shield);
  const [bossPhase, setBossPhase] = useState(enemy.bossPhase || 1);
  const timers = useRef<Set<number>>(new Set());
  const setTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => { timers.current.delete(id); callback(); }, delay);
    timers.current.add(id);
    return id;
  };
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    onEnemyUpdated({ ...enemy, hp: currentEnemyHp, shield: enemyShield, bossPhase });
  }, [currentEnemyHp, enemyShield, bossPhase]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [battleText, setBattleText] = useState(`Corrupted ${enemy.name.toUpperCase()} approached! ${enemy.shield ? 'Shatter their barrier first!' : 'Their barrier is already down!'}`);
  const [attackAnimation, setAttackAnimation] = useState<'slash' | 'explosion' | 'lightning' | 'heal' | null>(null);
  const [enemyShaking, setEnemyShaking] = useState(false);
  const [enemyFlashing, setEnemyFlashing] = useState(false);
  const [isEnemyEngulfed, setIsEnemyEngulfed] = useState(false);
  const [playerShaking, setPlayerShaking] = useState(false);
  const [enemyFainting, setEnemyFainting] = useState(false);
  const [playerLunging, setPlayerLunging] = useState(false);
  const [petLeaping, setPetLeaping] = useState(false);
  const [isCriticalHit, setIsCriticalHit] = useState(false);
  const [showTamePrompt, setShowTamePrompt] = useState(false);
  const [showLootModal, setShowLootModal] = useState(false);
  const [damageNumber, setDamageNumber] = useState<{ val: number | string; isPlayer: boolean; isHeal?: boolean; isCrit?: boolean } | null>(null);
  const [animFrame, setAnimFrame] = useState(0);
  const [turn, setTurn] = useState<'player' | 'player_acting' | 'enemy_turn' | 'ended'>('player');

  // Alchemist Belt State
  const [activeBeltTab, setActiveBeltTab] = useState<'cards' | 'potions'>('cards');
  const [potionStock, setPotionStock] = useState({
    healing: 2,
    acid: 1,
  });

  // Block Defense Reaction during enemy attack
  const [blockQuestion, setBlockQuestion] = useState<{
    prompt: string;
    options: { fraction: Fraction; label: string; isCorrect: boolean }[];
  } | null>(null);
  const [blockOutcome, setBlockOutcome] = useState<'pending' | 'blocked' | 'failed' | null>(null);

  // Idle cycle timer
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % 2);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    sound.playBattleIntro();
  }, []);

  // Calculate combined fraction from selected belt cards (preserves duplicate cards from double-click!)
  const selectedCards = selectedCardIds
    .map((id) => availableCards.find((c) => c.id === id))
    .filter((c): c is SpellCard => !!c);

  let combinedFraction: Fraction = { n: 0, d: 1 };
  if (selectedCards.length > 0) {
    combinedFraction = selectedCards.reduce((acc, card) => addFractions(acc, card.fraction), { n: 0, d: 1 });
  }

  // Card select toggle: 1 click -> Select 1x | 2 clicks -> Select 2x (Double-click) | 3 clicks -> Deselect
  const handleCardClick = (cardId: string) => {
    if (turn !== 'player') return;
    sound.playStep();

    setSelectedCardIds((selected) => toggleSpellCard(selected, cardId));
  };

  // Trigger Enemy Counter-Attack with Block Reaction
  const triggerEnemyAttack = (remainingEnemyHp: number) => {
    setTimeout(() => {
      setTurn('enemy_turn');
      const attackName = enemy.isBoss ? 'TITAN SLAM' : enemy.type === 'wraith' ? 'SHADOW CLAW' : 'POUNCE';
      setBattleText(`⚠️ ${enemy.name.toUpperCase()} charges ${attackName}! BLOCK TO TAKE LESS DAMAGE!`);
      setEnemyShaking(true);

      // Generate Fraction Block Question
      const numA = Math.floor(Math.random() * 2) + 1;
      const numB = 1;
      const den = 4;
      const sumNum = numA + numB;

      const correctFrac = { n: sumNum, d: den };
      const correctLabel = `${sumNum}/${den}`;

      setBlockQuestion({
        prompt: `Shield Rune: What is ${numA}/${den} + ${numB}/${den}?`,
        options: shuffle([
          { fraction: correctFrac, label: correctLabel, isCorrect: true },
          { fraction: { n: sumNum, d: 8 }, label: `${sumNum}/8`, isCorrect: false },
          { fraction: { n: Math.max(1, sumNum - 1), d: den }, label: `${Math.max(1, sumNum - 1)}/${den}`, isCorrect: false },
        ]),
      });
      setBlockOutcome('pending');
    }, 1200);
  };

  // Block response handler
  const handleAnswerBlock = (isCorrect: boolean) => {
    if (blockOutcome !== 'pending') return;

    const petDef = pet ? pet.defenseBonus : 0;

    if (isCorrect) {
      setBlockOutcome('blocked');
      sound.playShieldBlock();
      setBattleText('BLOCKED! Correct fraction — no damage!');
      setDamageNumber({ val: 0, isPlayer: true });
      setPlayerShaking(true);
      onPlayerTakeDamage(0);
    } else {
      setBlockOutcome('failed');
      sound.playPlayerHurt();
      const dmgTaken = Math.max(1, enemy.attackPower - petDef);
      setBattleText(`💥 BLOCK BROKEN! Direct hit from ${enemy.name.toUpperCase()}! Took ${dmgTaken} DMG!${petDef > 0 ? ` (Pet absorbed ${petDef} DMG!)` : ''}`);
      setDamageNumber({ val: dmgTaken, isPlayer: true });
      setPlayerShaking(true);
      onPlayerTakeDamage(dmgTaken);
    }

    setTimeout(() => {
      setPlayerShaking(false);
      setDamageNumber(null);
      setBlockQuestion(null);
      setBlockOutcome(null);
      setTurn('player');
      setBattleText(`What will ARC do with the Alchemist Belt?`);
    }, 1700);
  };

  // Pet Shield Smash: Stronger pet breaks the enemy barrier!
  const handlePetShieldSmash = () => {
    if (!enemyShield || !pet || turn !== 'player') return;
    const enemyLv = enemy.level || 1;
    if (pet.level > enemyLv) {
      sound.playShieldBreak();
      setEnemyShield(null);
      setEnemyShaking(true);
      setPetLeaping(true);
      setTimeout(() => setPetLeaping(false), 500);
      setTimeout(() => setEnemyShaking(false), 500);
      setBattleText(`🐾 ${pet.name} (Lv.${pet.level}) is stronger than ${enemy.name} (Lv.${enemyLv}) and SHATTERED their barrier! Their HP is now exposed!`);
    } else {
      setBattleText(`🐾 ${pet.name} (Lv.${pet.level}) is not strong enough to shatter ${enemy.name}'s (Lv.${enemyLv}) barrier! (Must be higher level)`);
    }
  };

  // Cast Alchemist Spell from Belt
  const handleExecuteAttack = () => {
    if (selectedCards.length === 0 || turn !== 'player') return;

    setTurn('player_acting');
    const leadType = selectedCards[0].type;
    sound.playSpellCast(leadType);

    setPlayerLunging(true);
    setBattleText(`Arc brewed ${fractionToString(combinedFraction)} ${leadType.toUpperCase()} SPELL!`);

    setTimeout(() => {
      setPlayerLunging(false);

      if (leadType === 'fire') {
        setAttackAnimation('explosion');
        setIsEnemyEngulfed(true);
        sound.playFireExplosion();
      } else if (leadType === 'frost') {
        setAttackAnimation('slash');
        sound.playFrostFreeze();
      } else {
        setAttackAnimation('lightning');
        sound.playLightningZap();
      }

      setEnemyFlashing(true);
      setEnemyShaking(true);

      setTimeout(() => {
        setIsEnemyEngulfed(false);
        setAttackAnimation(null);
        setEnemyShaking(false);

        // 1. BARRIER CHECK: If enemy has a barrier, it MUST be shattered before taking any HP damage!
        if (enemyShield) {
          const matchesShield = areFractionsEqual(combinedFraction, enemyShield);

          if (!matchesShield) {
            sound.playWrong();
            setBattleText(`❌ BARRIER BLOCKED IT! You must hit ${enemy.name}'s barrier with ${fractionToString(enemyShield)} first! (0 HP damage taken)`);
            setSelectedCardIds([]);
            setTimeout(() => {
              setEnemyFlashing(false);
              triggerEnemyAttack(currentEnemyHp);
            }, 800);
            return;
          } else {
            // Shield matched! The barrier absorbs the spell and breaks!
            sound.playShieldBreak();
            setEnemyShield(null);
            setBattleText(`💥 BARRIER SHATTERED! Arc matched ${fractionToString(enemyShield)} and broke ${enemy.name}'s barrier! Their HP is now vulnerable!`);
            setSelectedCardIds([]);
            setTimeout(() => {
              setEnemyFlashing(false);
              setTurn('player');
              setBattleText(`The barrier is DOWN! Cast your spells to damage ${enemy.name}'s exposed HP!`);
            }, 900);
            return;
          }
        }

        // 2. HP DAMAGE: Only hits HP when barrier is completely down!
        const baseDamage = playerLevel >= 60 
          ? Math.floor(Math.random() * 3) + 10 
          : playerLevel >= 6 
            ? 3 
            : 2;
        
        const petAtk = pet ? pet.attackBonus : 0;
        let finalDamage = (baseDamage * (selectedCards.length > 1 ? 1.5 : 1)) + (playerArmor || 0) + petAtk;

        // Two cards making one whole reward a deliberate combination, not every reduced sum.
        const reducedCombined = reduceFraction(combinedFraction);
        const isExactSimplest = selectedCards.length === 2 && areFractionsEqual(reducedCombined, { n: 1, d: 1 });

        let wasCrit = false;
        if (isExactSimplest) {
          finalDamage = Math.floor(finalDamage * 1.5);
          wasCrit = true;
          setIsCriticalHit(true);
          sound.playCriticalHit();
          setTimeout(() => setIsCriticalHit(false), 1200);
        }
        
        finalDamage = Math.max(1, Math.floor(finalDamage));

        const updatedEnemy = damageEnemy({ ...enemy, hp: currentEnemyHp, shield: enemyShield, bossPhase }, finalDamage);
        const nextHp = updatedEnemy.hp;
        setEnemyShield(updatedEnemy.shield);
        setBossPhase(updatedEnemy.bossPhase || 1);
        setCurrentEnemyHp(nextHp);
        setDamageNumber({ val: wasCrit ? `${finalDamage} CRIT!` : finalDamage, isPlayer: false, isCrit: wasCrit });
        setSelectedCardIds([]);

        setTimeout(() => {
          setEnemyFlashing(false);
          setDamageNumber(null);

          if (nextHp <= 0) {
            // Defeated!
            sound.playEnemyFaint();
            setEnemyFainting(true);
            setBattleText(`Corrupted ${enemy.name.toUpperCase()} fainted! 64x64 Loot dropped!`);
            setTurn('ended');

            setTimeout(() => {
              sound.playVictoryFanfare();
              setShowLootModal(true);
            }, 700);
          } else {
            if (wasCrit) {
              setBattleText(`⚡ CRITICAL HIT! Whole Combo (+50% DMG)! (${nextHp}/${enemy.maxHp} HP left)`);
            } else {
              setBattleText(`Spell hit ${enemy.name} for ${finalDamage} DMG! (${nextHp}/${enemy.maxHp} HP remaining)`);
            }
            triggerEnemyAttack(nextHp);
          }
        }, 500);
      }, 400);
    }, 450);
  };

  // Use Healing Elixir from Belt
  const handleDrinkPotion = () => {
    if (potionStock.healing <= 0 || turn !== 'player') return;
    setPotionStock((prev) => ({ ...prev, healing: prev.healing - 1 }));
    sound.playPotionDrink();
    setAttackAnimation('heal');
    setBattleText(`Arc drank a Healing Elixir from the belt! Restored +2 HP!`);
    setDamageNumber({ val: '+2 HP', isPlayer: true, isHeal: true });

    if (onHealPlayer) {
      onHealPlayer();
    }

    setTimeout(() => {
      setAttackAnimation(null);
      setDamageNumber(null);
      setTurn('player');
      setBattleText(`What will ARC do with the Alchemist Belt?`);
    }, 1200);
  };

  // Use Acid Flask from Belt
  const handleThrowAcid = () => {
    if (potionStock.acid <= 0 || turn !== 'player') return;
    if (!enemyShield) {
      setBattleText(`Enemy has no barrier shield to dissolve!`);
      return;
    }
    setPotionStock((prev) => ({ ...prev, acid: prev.acid - 1 }));
    sound.playSpellCast('fire');
    setBattleText(`Arc threw an Acid Flask from the belt! The barrier is completely dissolved!`);
    sound.playShieldBreak();
    setEnemyShield(null);
    setEnemyFlashing(true);

    setTimeout(() => {
      setEnemyFlashing(false);
      triggerEnemyAttack(currentEnemyHp);
    }, 1200);
  };

  const hpPercent = Math.max(0, Math.min(100, (currentEnemyHp / enemy.maxHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));

  // Sprite Data URLs for true 64x64 pixel rendering
  const enemySpriteSrc = getMobSpriteDataURL(enemy.type, enemy.color, animFrame, isEnemyEngulfed);
  const playerSpriteSrc = getPlayerSpriteDataURL(characterConfig, animFrame, true);

  return (
    /* OUTER CONTAINER: Leaves clean black gaps/margins around edges as requested */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 md:p-7 bg-black select-none font-retro overflow-hidden">
      
      {/* RETRO ARCADE BATTLE FRAME: Pure pixels, zero vector round corners */}
      <div className="relative w-full max-w-4xl h-[94vh] max-h-[790px] bg-slate-950 border-4 border-slate-700 shadow-[6px_6px_0px_#000,-2px_-2px_0px_#334155] flex flex-col justify-between overflow-hidden">
        
        {/* TOP STATUS BAR: Pure Pixel Header */}
        <header className="w-full bg-slate-900 border-b-4 border-amber-500/90 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 shadow-[0_2px_0px_#000]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 border border-black shadow-[1px_1px_0px_#000]" />
            <h2 className="font-pixel text-[10px] sm:text-xs text-amber-300 tracking-wider">
              POKÉMON ARENA · TOWER ENCOUNTER
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onFlee}
              disabled={turn !== 'player'}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white border-2 border-slate-600 font-pixel text-[9px] flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Footprints className="w-3 h-3 text-cyan-300" />
              <span>FLEE</span>
            </button>
          </div>
        </header>

        {/* BATTLE STAGE: Enemy Top-Right, Player Bottom-Left */}
        <div className="relative flex-1 w-full bg-[#0a0f1d] p-3 sm:p-5 flex flex-col justify-between overflow-hidden border-b-4 border-slate-800">
          
          {/* Subtle retro battlefield grid */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* 1. ENEMY SIDE (Top-Right) */}
          <div className="flex justify-end w-full relative z-10">
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 max-w-md w-full justify-end">
              
              {/* Stepped Pixel Stat Box */}
              <div className="w-60 sm:w-72 bg-slate-950 border-4 border-slate-700 p-2.5 shadow-[4px_4px_0px_#000]">
                <div className="flex justify-between items-center text-white">
                  <span className="font-pixel text-[10px] text-amber-300 truncate">{enemy.name.toUpperCase()}</span>
                  <span className="font-mono text-[9px] text-slate-400">Lv. {enemy.level || (enemy.isBoss ? 20 : 1)}</span>
                </div>

                {/* Stepped Pixel HP Bar */}
                <div className="mt-1.5 bg-slate-900 border-2 border-slate-700 p-1 flex items-center gap-1.5">
                  <span className="font-pixel text-[8px] text-amber-400 font-bold">HP</span>
                  <div className="flex-1 h-2.5 bg-slate-950 border border-slate-800 p-0.5 flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-300 text-right mt-0.5 font-bold">
                  {currentEnemyHp} / {enemy.maxHp} HP
                </div>

                {/* Shield Barrier Indicator */}
                {enemyShield ? (
                  <div className="mt-1 bg-amber-950/90 border-2 border-amber-500 px-2 py-0.5 flex items-center justify-between shadow-[2px_2px_0px_#000]">
                    <div className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span className="font-pixel text-[8px] text-amber-300">BARRIER SHIELD:</span>
                    </div>
                    <FormattedFraction fraction={enemyShield} size="xs" color="text-amber-200" showPieIndicator={true} />
                  </div>
                ) : (
                  <div className="mt-0.5 text-[8px] font-pixel text-emerald-400 text-right">
                    SHIELD SHATTERED (CRITICAL VULNERABLE)
                  </div>
                )}
              </div>

              {/* 64x64 Mob Sprite Display */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                {/* Stepped Pedestal Shadow */}
                <div className="absolute bottom-1 w-24 sm:w-32 h-6 bg-slate-900/90 border-2 border-slate-700 shadow-lg" />

                <img
                  src={enemySpriteSrc}
                  alt={enemy.name}
                  className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 object-contain pixelated transition-transform duration-100 ${
                    enemyShaking ? 'animate-shake' : ''
                  } ${enemyFlashing ? 'brightness-200 contrast-200' : ''} ${
                    enemyFainting ? 'translate-y-24 opacity-0 transition-all duration-1000' : ''
                  }`}
                />

                {damageNumber && !damageNumber.isPlayer && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 font-pixel text-xl text-rose-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-bounce">
                    -{damageNumber.val}
                  </div>
                )}

                {/* Ultra Cool Attack animations */}
                {attackAnimation === 'explosion' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-28 h-28 rounded-full bg-rose-600/60 border-4 border-amber-400 animate-ping shadow-[0_0_40px_#f43f5e]" />
                    <div className="absolute w-20 h-20 rounded-full bg-amber-500/80 border-2 border-white animate-pulse shadow-[0_0_30px_#f59e0b]" />
                    <div className="absolute font-pixel text-xs text-amber-300 animate-bounce">🔥 CRITICAL BLAST!</div>
                  </div>
                )}
                {attackAnimation === 'slash' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-32 h-2 bg-cyan-300 rotate-45 animate-ping shadow-[0_0_20px_#38bdf8]" />
                    <div className="absolute w-32 h-2 bg-white -rotate-45 animate-pulse shadow-[0_0_25px_#ffffff]" />
                    <div className="absolute font-pixel text-xs text-cyan-300 animate-bounce">❄️ FROST SLASH!</div>
                  </div>
                )}
                {attackAnimation === 'lightning' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-4 h-36 bg-amber-300 animate-pulse shadow-[0_0_35px_#f59e0b] skew-x-12" />
                    <div className="absolute w-2 h-28 bg-cyan-200 animate-ping shadow-[0_0_25px_#38bdf8] -skew-x-12" />
                    <div className="absolute font-pixel text-xs text-amber-400 animate-bounce">⚡ LIGHTNING ZAP!</div>
                  </div>
                )}
                {attackAnimation === 'heal' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-24 h-24 rounded-full bg-emerald-500/40 border-2 border-emerald-300 animate-ping" />
                    <div className="absolute font-pixel text-xs text-emerald-300 animate-bounce">✨ +2 HP HEAL!</div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 2. PLAYER SIDE (Bottom-Left) */}
          <div className="flex justify-start w-full relative z-10">
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-2 sm:gap-4 max-w-md w-full">
              
              {/* 64x64 Player Back View Sprite */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                <div className="absolute bottom-1 w-24 sm:w-32 h-6 bg-slate-900/90 border-2 border-slate-700 shadow-lg" />

                <img
                  src={playerSpriteSrc}
                  alt="Arc the Alchemist"
                  className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 object-contain pixelated transition-transform duration-200 ${
                    playerLunging ? 'translate-x-6 -translate-y-4 scale-110' : ''
                  } ${playerShaking ? 'animate-shake brightness-150' : ''}`}
                />

                {damageNumber && damageNumber.isPlayer && (
                  <div
                    className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 font-pixel text-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-bounce ${
                      damageNumber.isHeal ? 'text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {damageNumber.isHeal ? damageNumber.val : `-${damageNumber.val}`}
                  </div>
                )}
              </div>

              {/* Stepped Pixel Player Stat Box */}
              <div className="w-60 sm:w-72 bg-slate-950 border-4 border-slate-700 p-2.5 shadow-[4px_4px_0px_#000]">
                <div className="flex justify-between items-center text-white">
                  <span className="font-pixel text-[10px] text-cyan-300">ARC (ALCHEMIST)</span>
                  <span className="font-mono text-[9px] text-slate-400">Lv. {playerLevel}</span>
                </div>

                <div className="mt-1.5 bg-slate-900 border-2 border-slate-700 p-1 flex items-center gap-1.5">
                  <span className="font-pixel text-[8px] text-emerald-400 font-bold">HP</span>
                  <div className="flex-1 h-2.5 bg-slate-950 border border-slate-800 p-0.5 flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        playerHpPercent > 50 ? 'bg-emerald-500' : playerHpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${playerHpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-[9px] font-mono text-cyan-300 text-right mt-0.5 font-bold">
                  {playerHp} / {playerMaxHp} HP
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM ACTION CONSOLE & ALCHEMIST BELT (Pixel Styled, Never Cut Off) */}
        <footer className="w-full bg-slate-950 p-2.5 sm:p-3 shrink-0 flex flex-col gap-2">
          
          {/* Dialogue Strip */}
          <div className="w-full bg-slate-900 border-2 border-slate-700 p-2 min-h-[46px] flex items-center shadow-inner">
            <p className="text-[11px] sm:text-xs text-slate-100 font-retro leading-snug">
              {battleText}
            </p>
          </div>

          {/* MAIN INTERACTIVE AREA: BLOCK DEFENSE vs ALCHEMIST BELT */}
          {turn === 'enemy_turn' && blockQuestion ? (
            /* Emergency Block Reaction Prompt */
            <div className="bg-slate-900 border-4 border-amber-500 p-2.5 flex flex-col gap-2 shadow-[4px_4px_0px_#000] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400 font-pixel text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>BLOCK REACTION!</span>
                </div>
                <span className="text-[9px] text-slate-300 font-mono">
                  Pick the right fraction to raise your shield!
                </span>
              </div>

              <div className="text-center font-retro text-xs text-white">
                {blockQuestion.prompt}
              </div>

              {/* 3 Block Options with Fractions AT TOP */}
              <div className="grid grid-cols-3 gap-2">
                {blockQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    disabled={blockOutcome !== 'pending'}
                    onClick={() => handleAnswerBlock(opt.isCorrect)}
                    className={`p-2 border-2 font-pixel text-[10px] transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                      blockOutcome === 'blocked' && opt.isCorrect
                        ? 'border-emerald-400 bg-emerald-950 text-emerald-200'
                        : blockOutcome === 'failed' && !opt.isCorrect
                        ? 'border-rose-600 bg-rose-950 text-rose-300'
                        : 'border-slate-700 bg-slate-950 hover:border-amber-400 text-white'
                    }`}
                  >
                    <FormattedFraction fraction={opt.fraction} size="xs" showPieIndicator={true} color="text-amber-300 font-bold" />
                    <span className="text-[8px] font-mono">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Alchemist Belt Console with Tabs: Spell Cards & Potion Belt */
            <div className="flex flex-col gap-1.5">
              
              {/* Belt Mode Selector Bar */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveBeltTab('cards')}
                    className={`px-2.5 py-1 font-pixel text-[9px] border-2 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                      activeBeltTab === 'cards'
                        ? 'bg-amber-500 text-slate-950 font-bold border-black'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    SPELL DECK (CARDS)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBeltTab('potions')}
                    className={`px-2.5 py-1 font-pixel text-[9px] border-2 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 ${
                      activeBeltTab === 'potions'
                        ? 'bg-emerald-500 text-slate-950 font-bold border-black'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <FlaskConical className="w-3 h-3" />
                    <span>ALCHEMIST POTION BELT</span>
                  </button>
                </div>

                {/* Selected Mixture Preview */}
                {selectedCards.length > 0 && activeBeltTab === 'cards' && (
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 border border-cyan-800 font-mono text-[10px]">
                    <span className="text-cyan-300 font-bold">MIXTURE:</span>
                    <FormattedFraction fraction={combinedFraction} size="xs" showPieIndicator={true} color="text-cyan-200" />
                    {enemyShield && areFractionsEqual(combinedFraction, enemyShield) && (
                      <span className="text-[8px] font-pixel text-emerald-400 ml-1">SHIELD MATCH!</span>
                    )}
                  </div>
                )}
              </div>

              {/* TAB 1: SPELL CARDS (With Fractions At The VERY TOP Of Each Card!) */}
              {activeBeltTab === 'cards' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {availableCards.map((card) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        disabled={turn !== 'player'}
                        className={`relative shrink-0 flex flex-col items-center justify-between border-2 transition-all cursor-pointer w-[76px] sm:w-[86px] h-[92px] shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                          isSelected
                            ? 'border-cyan-300 bg-cyan-950 text-white -translate-y-1 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                            : 'border-slate-700 bg-slate-900/95 hover:border-amber-400 text-slate-200'
                        }`}
                      >
                        {selectedCardIds.filter(id => id === card.id).length === 2 && (
                          <div className="absolute -top-3 -right-2 bg-amber-400 text-black border-2 border-black font-pixel text-xs px-1.5 py-0.5 shadow-[2px_2px_0px_#000] z-20 animate-bounce">
                            2x
                          </div>
                        )}
                        {selectedCardIds.filter(id => id === card.id).length === 1 && (
                          <div className="absolute -top-2 -right-1 bg-cyan-400 text-black border border-black font-pixel text-[8px] px-1 shadow-[1px_1px_0px_#000] z-20">
                            1x
                          </div>
                        )}
                        {/* 1. TOP OF CARD: PROMINENT FRACTION FIRST! */}
                        <div className="w-full bg-slate-950 border-b border-slate-800 py-1 px-1 flex items-center justify-between">
                          <FormattedFraction
                            fraction={card.fraction}
                            size="sm"
                            showPieIndicator={true}
                            color="text-amber-300 font-bold"
                          />
                          {card.type === 'fire' ? (
                            <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : card.type === 'frost' ? (
                            <Snowflake className="w-3 h-3 text-cyan-300 shrink-0" />
                          ) : (
                            <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                          )}
                        </div>

                        {/* 2. MIDDLE: SPELL NAME */}
                        <div className="px-1 text-center font-retro text-[8px] sm:text-[9px] text-slate-200 truncate w-full">
                          {card.name}
                        </div>

                        {/* 3. BOTTOM: ELEMENT TYPE TAG */}
                        <div className="w-full bg-slate-950/80 py-0.5 text-center text-[7px] font-mono text-slate-400 uppercase">
                          {card.type}
                        </div>
                      </button>
                    );
                  })}

                  {/* CAST MOVE BUTTON */}
                  <button
                    onClick={handleExecuteAttack}
                    disabled={selectedCards.length === 0 || turn !== 'player'}
                    className="px-4 py-3 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-rose-500 disabled:opacity-40 text-white font-pixel text-[10px] border-2 border-amber-300 shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer h-[92px]"
                  >
                    <Swords className="w-4 h-4 text-yellow-300" />
                    <span>{selectedCards.length === 0 ? 'PICK CARDS' : 'CAST SPELL!'}</span>
                  </button>
                </div>
              )}

              {/* TAB 2: ALCHEMIST POTION BELT */}
              {activeBeltTab === 'potions' && (
                <div className="flex items-center gap-2 py-1">
                  {/* Healing Potion */}
                  <button
                    type="button"
                    onClick={handleDrinkPotion}
                    disabled={potionStock.healing <= 0 || turn !== 'player'}
                    className="flex-1 p-2 bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500 disabled:opacity-30 text-emerald-200 font-retro text-xs flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-pixel text-[9px] text-white">HEALING ELIXIR</div>
                        <div className="text-[9px] text-emerald-300">Restores +2 HP</div>
                      </div>
                    </div>
                    <span className="font-pixel text-[10px] text-emerald-400">
                      x{potionStock.healing}
                    </span>
                  </button>

                  {/* Acid Flask */}
                  <button
                    type="button"
                    onClick={handleThrowAcid}
                    disabled={potionStock.acid <= 0 || turn !== 'player' || !enemyShield}
                    className="flex-1 p-2 bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500 disabled:opacity-30 text-rose-200 font-retro text-xs flex items-center justify-between shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-rose-500/20 border border-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-pixel text-[9px] text-white">ACID FLASK</div>
                        <div className="text-[9px] text-rose-300">Dissolves Barrier</div>
                      </div>
                    </div>
                    <span className="font-pixel text-[10px] text-rose-400">
                      x{potionStock.acid}
                    </span>
                  </button>
                </div>
              )}

            </div>
          )}

        </footer>

        {/* 64x64 CUSTOM TEXTURED LOOT DROP MODAL */}
        {showLootModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-950 border-4 border-amber-400 p-4 sm:p-6 shadow-[8px_8px_0px_#000] flex flex-col items-center text-center gap-4">
              
              {/* Header Badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/90 border-2 border-amber-400 text-amber-300 font-pixel text-[11px] sm:text-xs tracking-wider shadow-[2px_2px_0px_#000]">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>VICTORY! 64x64 LOOT DROP</span>
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>

              {/* Custom 64x64 Pixel Art Loot Core Sprite */}
              <div className="relative p-3 bg-slate-900 border-4 border-slate-700 shadow-[4px_4px_0px_#000] flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent pointer-events-none animate-pulse" />
                <img
                  src={getLootGemSpriteDataURL(enemy.type === 'slime' ? 'slime' : 'golem')}
                  alt="64x64 Custom Loot Core"
                  className="w-20 h-20 sm:w-24 sm:h-24 pixelated object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Loot Item Name & Details */}
              <div>
                <h3 className="font-pixel text-xs sm:text-sm text-amber-300">
                  {enemy.type === 'slime' ? 'PRIMORDIAL SLIME CORE' : `${enemy.name.replace(/\(.*\)/, '').trim().toUpperCase()} CORE`}
                </h3>
                <p className="font-mono text-[9px] sm:text-[10px] text-slate-400 mt-1">
                  Authentic 64x64 Procedural Pixel Artifact · Fuses into Arc's battle equipment!
                </p>
              </div>

              {/* Stat Boosts Banner */}
              <div className="w-full bg-slate-900/90 border-2 border-slate-700 p-2.5 grid grid-cols-2 gap-2 shadow-inner">
                <div className="flex items-center gap-2 bg-rose-950/70 border border-rose-500/70 p-2">
                  <Swords className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="text-left">
                    <div className="font-pixel text-[8px] sm:text-[9px] text-white">DAMAGE POWER</div>
                    <div className="font-pixel text-[10px] sm:text-[11px] text-rose-300">+1 ATK BOOST</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-cyan-950/70 border border-cyan-500/70 p-2">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <div className="font-pixel text-[8px] sm:text-[9px] text-white">BLOCK POWER</div>
                    <div className="font-pixel text-[10px] sm:text-[11px] text-cyan-300">+1 ARMOR DEF</div>
                  </div>
                </div>
              </div>

              {/* Optional Special Taming Potion Action */}
              {tamingPotions > 0 && onTameEnemy && (
                <div className="w-full bg-indigo-950/80 border-2 border-indigo-500 p-2.5 flex flex-col items-center gap-1.5 shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-pixel text-[9px] sm:text-[10px]">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
                    <span>SPECIAL TAMING POTION ({tamingPotions} REMAINING FOR GAME)</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-slate-300 font-retro">
                    Give this potion to tame {enemy.name} into your pet! A higher level pet can smash shields in battle!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onTameEnemy(enemy);
                      setShowLootModal(false);
                      onEnemyDefeated(enemy.id);
                    }}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-pixel text-[9px] sm:text-[10px] border-2 border-indigo-300 shadow-[2px_2px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  >
                    🧪 TAME {enemy.name.toUpperCase()} WITH POTION
                  </button>
                </div>
              )}

              {/* Claim Loot Button */}
              <button
                type="button"
                onClick={() => {
                  setShowLootModal(false);
                  onEnemyDefeated(enemy.id);
                }}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-pixel text-[11px] sm:text-xs border-2 border-white shadow-[3px_3px_0px_#000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 font-bold"
              >
                ✨ CLAIM 64x64 LOOT (+1 DMG / +1 BLOCK)
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
