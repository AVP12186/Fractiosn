import { DungeonRoom, Difficulty, Fraction, BlockQuestion } from '../types/game';
import { SpellCard } from '../components/PokemonBattleView';
import { BlockDefenseQuestion } from '../components/BlockDefenseModal';

export function getMobTierLevel(type: string, floor: number): number {
  if (floor === 1) return 1;
  switch (type) {
    case 'slime':
      return Math.max(1, Math.round(floor * 0.38));
    case 'golem':
      return Math.max(1, Math.round(floor * 0.5));
    case 'chimera':
      return Math.max(1, Math.round(floor * 0.63));
    case 'wraith':
      return Math.max(1, Math.round(floor * 0.75));
    case 'wraithLord':
      return Math.max(1, Math.round(floor * 0.88));
    case 'gorgon':
    case 'boss':
    case 'crystalSpider':
    default:
      return floor;
  }
}

export function generateRoom(floor: number, difficulty: Difficulty): DungeonRoom {
  // FLOOR 6: FINAL BOSS - THE FRACTION COLOSSUS
  if (floor === 6) {
    return {
      floor: 6,
      title: 'Fraction Tower Apex (Floor 6)',
      subtitle: 'Final Sanctum of the Fraction Colossus',
      width: 28,
      height: 28,
      isBossRoom: true,
      cleared: false,
      torches: [
        { x: -10, z: -10, color: '#f59e0b', intensity: 2.2 },
        { x: 10, z: -10, color: '#f59e0b', intensity: 2.2 },
        { x: -10, z: 10, color: '#ef4444', intensity: 2.2 },
        { x: 10, z: 10, color: '#ef4444', intensity: 2.2 },
      ],
      gates: [],
      chests: [
        {
          id: 'apex_chest',
          x: 0,
          z: -8,
          opened: false,
          rewardText: 'The Sacred Relic of Wholes Reforged!',
          fractionBonus: { n: 1, d: 1 },
        },
      ],
      enemies: [
        {
          id: 'boss_colossus',
          type: 'boss',
          name: 'The Fraction Colossus (Lv.6)',
          level: 6,
          x: 0,
          z: -4,
          hp: 11,
          maxHp: 11,
          shield: { n: 3, d: 4 },
          attackCooldown: 6,
          lastAttackTime: Date.now(),
          speed: 0.8,
          color: '#f59e0b',
          size: 3.8,
          isBoss: true,
          bossPhase: 1,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 5: BOSS 2 - THE INFERNAL CHIMERA
  if (floor === 5) {
    return {
      floor: 5,
      title: 'Tower Floor 5: Magma Crucible',
      subtitle: 'Lair of the Infernal Chimera (Boss 2)',
      width: 26,
      height: 26,
      isBossRoom: true,
      cleared: false,
      stairs: { x: 0, z: -9, active: false },
      torches: [
        { x: -10, z: -10, color: '#ea580c', intensity: 2.0 },
        { x: 10, z: -10, color: '#ea580c', intensity: 2.0 },
        { x: -10, z: 10, color: '#facc15', intensity: 2.0 },
        { x: 10, z: 10, color: '#facc15', intensity: 2.0 },
      ],
      gates: [],
      chests: [
        {
          id: 'chest_5',
          x: -6,
          z: -5,
          opened: false,
          rewardText: 'Found Molten Elixir (+3/5 Arcane Core)!',
          fractionBonus: { n: 3, d: 5 },
        },
      ],
      enemies: [
        {
          id: 'boss_chimera',
          type: 'chimera',
          name: 'The Infernal Chimera (Lv.5)',
          level: 5,
          x: 0,
          z: -4,
          hp: 10,
          maxHp: 10,
          shield: { n: 3, d: 5 },
          attackCooldown: 6,
          lastAttackTime: Date.now(),
          speed: 1.0,
          color: '#ea580c',
          size: 3.4,
          isBoss: true,
          bossPhase: 1,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 4: CLOCKWORK FOUNDRY
  if (floor === 4) {
    return {
      floor: 4,
      title: 'Tower Floor 4: Clockwork Foundry',
      subtitle: 'Chamber of Unlike Fractions',
      width: 26,
      height: 26,
      isBossRoom: false,
      cleared: false,
      stairs: { x: 0, z: -9, active: false },
      torches: [
        { x: -9, z: -9, color: '#f59e0b', intensity: 1.6 },
        { x: 9, z: -9, color: '#f59e0b', intensity: 1.6 },
        { x: -9, z: 9, color: '#ef4444', intensity: 1.6 },
        { x: 9, z: 9, color: '#ef4444', intensity: 1.6 },
      ],
      gates: [],
      chests: [
        {
          id: 'chest_4',
          x: 7,
          z: -5,
          opened: false,
          rewardText: 'Found 1/6 Chrono Spark Card!',
          fractionBonus: { n: 1, d: 6 },
        },
      ],
      enemies: [
        {
          id: 'wraith_1',
          type: 'wraith',
          name: 'Shadow Wraith (Lv.3)',
          level: 3,
          x: -4,
          z: 2,
          hp: 8,
          maxHp: 8,
          shield: { n: 2, d: 3 },
          attackCooldown: 8,
          lastAttackTime: Date.now(),
          speed: 1.2,
          color: '#6366f1',
          size: 1.8,
          attackPower: 1,
        },
        {
          id: 'golem_2',
          type: 'golem',
          name: 'Obsidian Golem (Lv.2)',
          level: 2,
          x: 4,
          z: -2,
          hp: 7,
          maxHp: 7,
          shield: { n: 3, d: 4 },
          attackCooldown: 7,
          lastAttackTime: Date.now(),
          speed: 0.9,
          color: '#475569',
          size: 2.2,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 3: BOSS 1 - THE VOID GORGON
  if (floor === 3) {
    return {
      floor: 3,
      title: 'Tower Floor 3: The Gorgon Spire',
      subtitle: 'Lair of the Void Gorgon (Boss 1)',
      width: 26,
      height: 26,
      isBossRoom: true,
      cleared: false,
      stairs: { x: 0, z: -9, active: false },
      torches: [
        { x: -9, z: -9, color: '#10b981', intensity: 1.8 },
        { x: 9, z: -9, color: '#10b981', intensity: 1.8 },
        { x: -9, z: 9, color: '#a855f7', intensity: 1.8 },
        { x: 9, z: 9, color: '#a855f7', intensity: 1.8 },
      ],
      gates: [],
      chests: [
        {
          id: 'gorgon_chest',
          x: 5,
          z: -6,
          opened: false,
          rewardText: 'Gorgon Relic Key (+2/3 Mana)!',
          fractionBonus: { n: 2, d: 3 },
        },
      ],
      enemies: [
        {
          id: 'boss_gorgon',
          type: 'gorgon',
          name: 'The Void Gorgon (Lv.3)',
          level: 3,
          x: 0,
          z: -3,
          hp: 8,
          maxHp: 8,
          shield: { n: 2, d: 3 },
          attackCooldown: 7,
          lastAttackTime: Date.now(),
          speed: 0.9,
          color: '#10b981',
          size: 3.2,
          isBoss: true,
          bossPhase: 1,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 2: CRYSTAL LIBRARY
  if (floor === 2) {
    return {
      floor: 2,
      title: 'Tower Floor 2: Crystal Library',
      subtitle: 'Chamber of Equivalent Fractions',
      width: 24,
      height: 24,
      isBossRoom: false,
      cleared: false,
      stairs: { x: 0, z: -8, active: false },
      torches: [
        { x: -9, z: -9, color: '#a855f7', intensity: 1.5 },
        { x: 9, z: -9, color: '#a855f7', intensity: 1.5 },
        { x: -9, z: 9, color: '#38bdf8', intensity: 1.5 },
        { x: 9, z: 9, color: '#38bdf8', intensity: 1.5 },
      ],
      gates: [],
      chests: [
        {
          id: 'chest_2',
          x: -6,
          z: 4,
          opened: false,
          rewardText: 'Found 2/4 Prism Card!',
          fractionBonus: { n: 2, d: 4 },
        },
      ],
      enemies: [
        {
          id: 'golem_1',
          type: 'golem',
          name: 'Quartz Golem (Lv.2)',
          level: 2,
          x: 0,
          z: -1,
          hp: 7,
          maxHp: 7,
          shield: { n: 2, d: 4 },
          attackCooldown: 8,
          lastAttackTime: Date.now(),
          speed: 0.9,
          color: '#a855f7',
          size: 2.0,
          attackPower: 1,
        },
        {
          id: 'slime_3',
          type: 'slime',
          name: 'Prism Slime (Lv.1)',
          level: 1,
          x: 5,
          z: 3,
          hp: 6,
          maxHp: 6,
          shield: { n: 1, d: 3 },
          attackCooldown: 9,
          lastAttackTime: Date.now(),
          speed: 1.1,
          color: '#c084fc',
          size: 1.5,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 1: MOSSY BASEMENT
  if (floor === 1) {
    return {
      floor: 1,
      title: 'Tower Floor 1: Mossy Basement',
      subtitle: 'Chamber of Unit Fractions',
      width: 22,
      height: 22,
      isBossRoom: false,
      cleared: false,
      stairs: { x: 0, z: -8, active: false },
      torches: [],
      gates: [],
      chests: [],
      enemies: [
        {
          id: 'slime_1',
          type: 'slime',
          name: 'Moss Slime (Lv.1)',
          level: 1,
          x: -4,
          z: -2,
          hp: 5,
          maxHp: 5,
          shield: { n: 1, d: 2 },
          attackCooldown: 10,
          lastAttackTime: Date.now(),
          speed: 1.0,
          color: '#10b981',
          size: 1.4,
          attackPower: 1,
        },
        {
          id: 'slime_2',
          type: 'slime',
          name: 'Azure Slime (Lv.1)',
          level: 1,
          x: 4,
          z: 2,
          hp: 5,
          maxHp: 5,
          shield: { n: 1, d: 4 },
          attackCooldown: 9,
          lastAttackTime: Date.now(),
          speed: 1.1,
          color: '#38bdf8',
          size: 1.5,
          attackPower: 1,
        },
      ],
    };
  }

  // FLOOR 8: THE ABYSSAL SANCTUM (Hierarchy of Mobs: Gorgon Lv.8, Chimera Lv.5, Slimes Lv.3)
  if (floor === 8) {
    return {
      floor: 8,
      title: 'Tower Floor 8: The Abyssal Sanctum',
      subtitle: 'Hierarchy of the Gorgon Domain',
      width: 28,
      height: 28,
      isBossRoom: false,
      cleared: false,
      stairs: { x: 0, z: -9, active: false },
      torches: [
        { x: -10, z: -10, color: '#10b981', intensity: 2.0 },
        { x: 10, z: -10, color: '#ea580c', intensity: 2.0 },
        { x: -10, z: 10, color: '#38bdf8', intensity: 2.0 },
        { x: 10, z: 10, color: '#a855f7', intensity: 2.0 },
      ],
      gates: [],
      chests: [],
      enemies: [
        {
          id: 'gorgon_8',
          type: 'gorgon',
          name: 'The Void Gorgon (Lv.8)',
          level: 8,
          x: 0,
          z: -4,
          hp: 13,
          maxHp: 13,
          shield: { n: 2, d: 3 },
          attackCooldown: 6,
          lastAttackTime: Date.now(),
          speed: 1.0,
          color: '#10b981',
          size: 2.8,
          attackPower: 1,
        },
        {
          id: 'chimera_8',
          type: 'chimera',
          name: 'Infernal Chimera (Lv.5)',
          level: 5,
          x: -5,
          z: 2,
          hp: 10,
          maxHp: 10,
          shield: { n: 3, d: 5 },
          attackCooldown: 7,
          lastAttackTime: Date.now(),
          speed: 1.1,
          color: '#ea580c',
          size: 2.2,
          attackPower: 1,
        },
        {
          id: 'slime_8_1',
          type: 'slime',
          name: 'Moss Slime (Lv.3)',
          level: 3,
          x: 4,
          z: -2,
          hp: 8,
          maxHp: 8,
          shield: { n: 1, d: 2 },
          attackCooldown: 9,
          lastAttackTime: Date.now(),
          speed: 1.0,
          color: '#10b981',
          size: 1.4,
          attackPower: 1,
        },
        {
          id: 'slime_8_2',
          type: 'slime',
          name: 'Azure Slime (Lv.3)',
          level: 3,
          x: 5,
          z: 3,
          hp: 8,
          maxHp: 8,
          shield: { n: 1, d: 4 },
          attackCooldown: 9,
          lastAttackTime: Date.now(),
          speed: 1.1,
          color: '#38bdf8',
          size: 1.4,
          attackPower: 1,
        },
      ],
    };
  }

  // Randomly select enemies for floors 2-21 with proper tier hierarchy
  const enemies = [];
  const enemyTypes = ['slime', 'golem', 'wraith', 'gorgon', 'chimera'];
  
  if (floor >= 8) {
    enemyTypes.push('wraithLord');
  }
  if (floor >= 15) {
    enemyTypes.push('crystalSpider');
  }

  // Simplified: Add 2-4 enemies based on floor
  const numEnemies = Math.min(2 + Math.floor(floor / 3), 5);
  for (let i = 0; i < numEnemies; i++) {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const mobLevel = getMobTierLevel(type, floor);
    const mobHp = 5 + mobLevel;
    const displayName = type === 'wraithLord' ? 'Wraith Lord' : type === 'crystalSpider' ? 'Crystal Spider' : type.charAt(0).toUpperCase() + type.slice(1);
    enemies.push({
      id: `${type}_${i}_${Date.now()}`,
      type: type as any,
      name: `${displayName} (Lv.${mobLevel})`,
      level: mobLevel,
      x: Math.random() * 10 - 5,
      z: Math.random() * 10 - 5,
      hp: mobHp,
      maxHp: mobHp,
      shield: { n: 1, d: 2 },
      attackCooldown: Math.max(2, 10 - Math.min(floor, 7)),
      lastAttackTime: Date.now(),
      speed: 0.8 + (mobLevel * 0.05),
      color: type === 'gorgon' ? '#10b981' : type === 'chimera' ? '#ea580c' : type === 'slime' ? '#38bdf8' : type === 'golem' ? '#a855f7' : '#6366f1',
      size: type === 'gorgon' || type === 'chimera' ? 2.2 : type === 'golem' ? 1.8 : 1.4,
      attackPower: 1,
    });
  }

  return {
    floor,
    title: `Tower Floor ${floor}`,
    subtitle: 'Chamber of Trials',
    width: 20 + Math.floor(floor / 2),
    height: 20 + Math.floor(floor / 2),
    isBossRoom: false,
    cleared: false,
    stairs: { x: 0, z: -8, active: false },
    torches: [],
    gates: [],
    chests: [],
    enemies: enemies,
  };
}

export function getCardsForDifficulty(difficulty: Difficulty): SpellCard[] {
  if (difficulty === 'apprentice') {
    return [
      { id: 'c1', name: 'Ember', type: 'fire', fraction: { n: 1, d: 2 }, color: '#ef4444', bgGradient: 'from-red-900 to-rose-700' },
      { id: 'c2', name: 'Frost', type: 'frost', fraction: { n: 1, d: 4 }, color: '#38bdf8', bgGradient: 'from-blue-900 to-cyan-700' },
      { id: 'c3', name: 'Spark', type: 'lightning', fraction: { n: 1, d: 4 }, color: '#eab308', bgGradient: 'from-yellow-900 to-amber-700' },
      { id: 'c4', name: 'Leaf', type: 'arcane', fraction: { n: 1, d: 3 }, color: '#10b981', bgGradient: 'from-emerald-900 to-teal-700' },
      { id: 'c5', name: 'Shard', type: 'frost', fraction: { n: 2, d: 4 }, color: '#06b6d4', bgGradient: 'from-cyan-900 to-blue-700' },
    ];
  }
  if (difficulty === 'journeyman') {
    return [
      { id: 'c1', name: 'Flame', type: 'fire', fraction: { n: 1, d: 2 }, color: '#ef4444', bgGradient: 'from-red-900 to-rose-700' },
      { id: 'c2', name: 'Glacier', type: 'frost', fraction: { n: 1, d: 3 }, color: '#38bdf8', bgGradient: 'from-blue-900 to-cyan-700' },
      { id: 'c3', name: 'Cosmos', type: 'arcane', fraction: { n: 2, d: 3 }, color: '#a855f7', bgGradient: 'from-purple-900 to-indigo-700' },
      { id: 'c4', name: 'Bolt', type: 'lightning', fraction: { n: 1, d: 4 }, color: '#eab308', bgGradient: 'from-yellow-900 to-amber-700' },
      { id: 'c5', name: 'Nova', type: 'fire', fraction: { n: 3, d: 4 }, color: '#f97316', bgGradient: 'from-orange-900 to-red-700' },
      { id: 'c6', name: 'Breeze', type: 'arcane', fraction: { n: 1, d: 6 }, color: '#14b8a6', bgGradient: 'from-teal-900 to-cyan-700' },
    ];
  }
  // Grandmaster cards (too complex for Level 1 Slimes)
  return [
    { id: 'c1', name: 'Inferno', type: 'fire', fraction: { n: 7, d: 13 }, color: '#ef4444', bgGradient: 'from-red-900 to-rose-700' },
    { id: 'c2', name: 'Blizzard', type: 'frost', fraction: { n: 11, d: 17 }, color: '#38bdf8', bgGradient: 'from-blue-900 to-cyan-700' },
    { id: 'c3', name: 'Plasma', type: 'lightning', fraction: { n: 13, d: 19 }, color: '#eab308', bgGradient: 'from-yellow-900 to-amber-700' },
    { id: 'c4', name: 'Meteor', type: 'fire', fraction: { n: 17, d: 23 }, color: '#f97316', bgGradient: 'from-orange-900 to-red-700' },
    { id: 'c5', name: 'Abyss', type: 'arcane', fraction: { n: 19, d: 29 }, color: '#8b5cf6', bgGradient: 'from-purple-900 to-violet-700' },
    { id: 'c6', name: 'Shock', type: 'lightning', fraction: { n: 23, d: 31 }, color: '#facc15', bgGradient: 'from-amber-900 to-yellow-700' },
  ];
}

// DIVERSE BLOCK QUESTIONS IN BETWEEN FIGHTS
export function getBlockQuestionsForFloor(floor: number): BlockQuestion {
  const pool: Record<number, BlockQuestion> = {
    1: {
      id: 'q1',
      type: 'compare',
      prompt: 'Which fraction of the ancient rune is GREATER?',
      visualAidType: 'bar',
      fractionA: { n: 3, d: 4 },
      fractionB: { n: 2, d: 4 },
      options: [
        { label: '3/4 is Greater', value: '3/4', isCorrect: true },
        { label: '2/4 is Greater', value: '2/4', isCorrect: false },
        { label: 'They are Equal', value: 'equal', isCorrect: false },
        { label: 'Cannot tell', value: 'unknown', isCorrect: false },
      ],
      explanation: 'Both fractions share denominator 4. Since 3 slices is greater than 2 slices, 3/4 > 2/4!',
    },
    2: {
      id: 'q2',
      type: 'simplify',
      prompt: 'Reduce the fraction 4/8 to its simplest form:',
      visualAidType: 'pie',
      fractionA: { n: 4, d: 8 },
      options: [
        { label: '1/2', value: '1/2', isCorrect: true },
        { label: '2/3', value: '2/3', isCorrect: false },
        { label: '1/4', value: '1/4', isCorrect: false },
        { label: '3/4', value: '3/4', isCorrect: false },
      ],
      explanation: 'Divide numerator 4 and denominator 8 by 4: 4 ÷ 4 = 1, 8 ÷ 4 = 2. So 4/8 simplifies to 1/2!',
    },
    3: {
      id: 'q3',
      type: 'fraction_of',
      prompt: 'The Gorgon holds 12 crystals. What is 2/3 of 12?',
      visualAidType: 'group',
      fractionA: { n: 2, d: 3 },
      targetNumber: 12,
      options: [
        { label: '8 Crystals', value: '8', isCorrect: true },
        { label: '6 Crystals', value: '6', isCorrect: false },
        { label: '4 Crystals', value: '4', isCorrect: false },
        { label: '9 Crystals', value: '9', isCorrect: false },
      ],
      explanation: 'First find 1/3 of 12 (12 ÷ 3 = 4). Then multiply by 2 (4 × 2 = 8). 2/3 of 12 is 8!',
    },
    4: {
      id: 'q4',
      type: 'missing_number',
      prompt: 'Complete the equivalent fraction: 2/5 = ? / 15',
      visualAidType: 'bar',
      fractionA: { n: 2, d: 5 },
      fractionB: { n: 6, d: 15 },
      options: [
        { label: '6', value: '6', isCorrect: true },
        { label: '5', value: '5', isCorrect: false },
        { label: '8', value: '8', isCorrect: false },
        { label: '4', value: '4', isCorrect: false },
      ],
      explanation: 'Denominator 5 was multiplied by 3 to reach 15. Multiply numerator 2 by 3: 2 × 3 = 6!',
    },
    5: {
      id: 'q5',
      type: 'subtract',
      prompt: 'Subtract the molten mana: 5/6 - 2/6 = ?',
      visualAidType: 'bar',
      fractionA: { n: 5, d: 6 },
      fractionB: { n: 2, d: 6 },
      options: [
        { label: '3/6 (or 1/2)', value: '1/2', isCorrect: true },
        { label: '3/0', value: '3/0', isCorrect: false },
        { label: '2/6', value: '2/6', isCorrect: false },
        { label: '1/6', value: '1/6', isCorrect: false },
      ],
      explanation: 'Subtract the numerators with common denominator 6: 5 - 2 = 3. 3/6 simplifies to 1/2!',
    },
    6: {
      id: 'q6',
      type: 'compare',
      prompt: 'Colossus Final Trial: Which is larger: 2/3 or 3/4?',
      visualAidType: 'pie',
      fractionA: { n: 2, d: 3 },
      fractionB: { n: 3, d: 4 },
      options: [
        { label: '3/4 is Larger (9/12 vs 8/12)', value: '3/4', isCorrect: true },
        { label: '2/3 is Larger', value: '2/3', isCorrect: false },
        { label: 'Both are Equal', value: 'equal', isCorrect: false },
        { label: 'Depends on spell', value: 'depends', isCorrect: false },
      ],
      explanation: 'Find common denominator 12: 2/3 = 8/12, while 3/4 = 9/12. Since 9 > 8, 3/4 is larger!',
    },
  };

  return pool[floor] || pool[1];
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateBlockDefenseQuestion(
  enemyName: string,
  enemyType: string,
  floor: number
): BlockDefenseQuestion {
  const seed = Math.floor(Math.random() * 5);
  
  let question: BlockDefenseQuestion;
  
  if (floor <= 7) {
    if (seed === 0) {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} launches a sudden strike! Solve to raise Arc's Shield:`,
        fractionA: { n: 1, d: 4 },
        fractionB: { n: 2, d: 4 },
        operation: '+',
        options: [
          { fraction: { n: 3, d: 4 }, label: '3/4', isCorrect: true },
          { fraction: { n: 3, d: 8 }, label: '3/8', isCorrect: false },
          { fraction: { n: 1, d: 2 }, label: '1/2', isCorrect: false },
        ],
      };
    } else if (seed === 1) {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} lunges forward! Add fractions with like denominators:`,
        fractionA: { n: 1, d: 3 },
        fractionB: { n: 1, d: 3 },
        operation: '+',
        options: [
          { fraction: { n: 2, d: 3 }, label: '2/3', isCorrect: true },
          { fraction: { n: 2, d: 6 }, label: '2/6', isCorrect: false },
          { fraction: { n: 1, d: 6 }, label: '1/6', isCorrect: false },
        ],
      };
    } else {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} bounces! Simplify this fraction to hold your barrier:`,
        fractionA: { n: 2, d: 4 },
        operation: 'simplify',
        options: [
          { fraction: { n: 1, d: 2 }, label: '1/2', isCorrect: true },
          { fraction: { n: 1, d: 4 }, label: '1/4', isCorrect: false },
          { fraction: { n: 3, d: 4 }, label: '3/4', isCorrect: false },
        ],
      };
    }
  } else if (floor <= 14) {
    if (seed % 2 === 0) {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} casts a shadow wave! Subtract fractions:`,
        fractionA: { n: 4, d: 5 },
        fractionB: { n: 1, d: 5 },
        operation: '-',
        options: [
          { fraction: { n: 3, d: 5 }, label: '3/5', isCorrect: true },
          { fraction: { n: 3, d: 0 }, label: '3/0', isCorrect: false },
          { fraction: { n: 2, d: 5 }, label: '2/5', isCorrect: false },
        ],
      };
    } else {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} coils ready to strike! Which fraction is equivalent to 3/6?`,
        fractionA: { n: 3, d: 6 },
        operation: 'equiv',
        options: [
          { fraction: { n: 1, d: 2 }, label: '1/2', isCorrect: true },
          { fraction: { n: 2, d: 3 }, label: '2/3', isCorrect: false },
          { fraction: { n: 1, d: 3 }, label: '1/3', isCorrect: false },
        ],
      };
    }
  } else {
    // Floors 15-21 (Grandmaster Trials)
    if (seed % 2 === 0) {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} charges molten fury! Add unlike fractions (1/2 = 2/4):`,
        fractionA: { n: 1, d: 2 },
        fractionB: { n: 1, d: 4 },
        operation: '+',
        options: [
          { fraction: { n: 3, d: 4 }, label: '3/4', isCorrect: true },
          { fraction: { n: 2, d: 6 }, label: '2/6', isCorrect: false },
          { fraction: { n: 1, d: 4 }, label: '1/4', isCorrect: false },
        ],
      };
    } else {
      question = {
        id: `block_${Date.now()}`,
        attackerName: enemyName,
        attackerType: enemyType,
        prompt: `${enemyName} readies an ancient smash! Which fraction is larger?`,
        fractionA: { n: 3, d: 4 },
        fractionB: { n: 1, d: 2 },
        operation: 'equiv',
        options: [
          { fraction: { n: 3, d: 4 }, label: '3/4 is Larger', isCorrect: true },
          { fraction: { n: 1, d: 2 }, label: '1/2 is Larger', isCorrect: false },
          { fraction: { n: 2, d: 4 }, label: 'Equal', isCorrect: false },
        ],
      };
    }
  }

  return { ...question, options: shuffle(question.options) };
}
