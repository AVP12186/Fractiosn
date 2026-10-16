export type Difficulty = 'apprentice' | 'journeyman' | 'grandmaster';

export interface Fraction {
  n: number; // numerator
  d: number; // denominator
}

export type SpellType = 'fire' | 'frost' | 'arcane' | 'lightning';

export interface CharacterConfig {
  robeColor: string;
  hatStyle: 'wizard' | 'cowl' | 'hood' | 'crown' | 'helmet' | 'headband' | 'horns' | 'catears' | 'halo' | 'none';
  skinTone?: 'fair' | 'tan' | 'bronze' | 'dark' | 'goblin' | 'pale';
  accessory: 'none' | 'spectacles' | 'monocle' | 'visor' | 'cape' | 'fairy' | 'shield' | 'amulet';
  wandStyle: 'wood' | 'crystal' | 'gold' | 'sword' | 'potion' | 'scythe' | 'book';
}

export type QuestionType =
  | 'compare' // Which is greater: 2/3 or 3/4?
  | 'simplify' // Reduce 4/8 to simplest form
  | 'missing_number' // 2/5 = ?/15
  | 'fraction_of' // What is 2/3 of 12?
  | 'add' // 1/4 + 2/4
  | 'subtract'; // 5/6 - 2/6

export interface BlockQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  visualAidType: 'pie' | 'bar' | 'group';
  fractionA: Fraction;
  fractionB?: Fraction;
  targetNumber?: number; // e.g. for fraction_of 12
  options: { label: string; value: string; isCorrect: boolean }[];
  explanation: string;
}

export interface Enemy {
  id: string;
  type: 'slime' | 'golem' | 'wraith' | 'gorgon' | 'chimera' | 'boss';
  name: string;
  level: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  shield: Fraction | null; // must solve this fraction to break shield
  spellVulnerability?: SpellType;
  attackCooldown: number;
  lastAttackTime: number;
  speed: number;
  color: string;
  size: number;
  isBoss?: boolean;
  bossPhase?: number;
  attackPower: number;
}

export interface PetCompanion {
  id: string;
  name: string;
  type: 'slime' | 'golem' | 'wraith' | 'gorgon' | 'chimera' | 'boss';
  level: number;
  color: string;
  attackBonus: number;
  defenseBonus: number;
}

export interface Stairs {
  x: number;
  z: number;
  active: boolean;
}

export interface RuneGate {
  id: string;
  x: number;
  z: number;
  requiredFraction: Fraction;
  opened: boolean;
  label: string;
}

export interface Chest {
  id: string;
  x: number;
  z: number;
  opened: boolean;
  rewardText: string;
  fractionBonus?: Fraction;
}

export interface Torch {
  x: number;
  z: number;
  color: string;
  intensity: number;
}

export interface DungeonRoom {
  floor: number;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  enemies: Enemy[];
  gates: RuneGate[];
  chests: Chest[];
  torches: Torch[];
  stairs?: Stairs;
  cleared: boolean;
  isBossRoom: boolean;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  score: number;
  floor: number;
  relicShards: number;
  potionsBrewed: number;
  spellsCast: number;
  accuracyStreak: number;
  bestStreak: number;
  level: number;
  exp: number;
  nextExp: number;
  armor: number;
  damageBonus: number;
}

export interface StoryChapter {
  id: number;
  speaker: string;
  portrait: 'arc' | 'elder' | 'colossus' | 'gorgon';
  text: string;
}

// -------------------------------------------------------------
// Fraction Math Utility Functions
// -------------------------------------------------------------

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return (Math.abs(a * b)) / gcd(a, b);
}

export function reduceFraction(f: Fraction): Fraction {
  if (f.n === 0) return { n: 0, d: 1 };
  const divisor = gcd(f.n, f.d);
  return {
    n: f.n / divisor,
    d: f.d / divisor,
  };
}

export function areFractionsEqual(a: Fraction, b: Fraction): boolean {
  return a.n * b.d === b.n * a.d;
}

export function compareFractions(a: Fraction, b: Fraction): number {
  const diff = a.n * b.d - b.n * a.d;
  if (diff > 0) return 1;
  if (diff < 0) return -1;
  return 0;
}

export function addFractions(a: Fraction, b: Fraction): Fraction {
  const commonD = lcm(a.d, b.d);
  const totalN = a.n * (commonD / a.d) + b.n * (commonD / b.d);
  return reduceFraction({ n: totalN, d: commonD });
}

export function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const commonD = lcm(a.d, b.d);
  const totalN = a.n * (commonD / a.d) - b.n * (commonD / b.d);
  return reduceFraction({ n: Math.max(0, totalN), d: commonD });
}

export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return reduceFraction({ n: a.n * b.n, d: a.d * b.d });
}

export function fractionToDecimal(f: Fraction): number {
  if (f.d === 0) return 0;
  return f.n / f.d;
}

export function fractionToString(f: Fraction): string {
  if (f.d === 1) return `${f.n}`;
  return `${f.n}/${f.d}`;
}
