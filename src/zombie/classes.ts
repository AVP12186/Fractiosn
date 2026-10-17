export type ClassId = 'assault' | 'medic' | 'engineer' | 'recon';

export interface SurvivorClass {
  id: ClassId;
  name: string;
  role: string;
  description: string;
  weapon: string;
  ability: string;
  abilityDescription: string;
  color: string;
  health: number;
  speed: number;
  damage: number;
  fireRate: number;
  magazine: number;
  reload: number;
  cooldown: number;
  stats: [number, number, number];
}

export const CLASSES: SurvivorClass[] = [
  { id: 'assault', name: 'Assault', role: 'FRONTLINE FIGHTER', description: 'First in. Last one standing.', weapon: 'M4 Carbine', ability: 'Overdrive', abilityDescription: 'Double fire rate and unlimited ammo for 6 seconds.', color: '#e87345', health: 120, speed: 205, damage: 28, fireRate: .14, magazine: 30, reload: 1.6, cooldown: 18, stats: [5, 4, 3] },
  { id: 'medic', name: 'Medic', role: 'COMBAT LIFELINE', description: 'Keep a pulse. Keep fighting.', weapon: 'Vector SMG', ability: 'Second wind', abilityDescription: 'Restore 55 health and push nearby infected back.', color: '#8daa7a', health: 100, speed: 215, damage: 19, fireRate: .095, magazine: 35, reload: 1.35, cooldown: 20, stats: [3, 3, 4] },
  { id: 'engineer', name: 'Engineer', role: 'AREA DENIAL', description: 'Build the odds in your favor.', weapon: 'M870 Shotgun', ability: 'Sentry turret', abilityDescription: 'Deploy an automatic sentry that fights for 12 seconds.', color: '#d5af61', health: 140, speed: 178, damage: 22, fireRate: .58, magazine: 8, reload: 2.1, cooldown: 23, stats: [5, 5, 2] },
  { id: 'recon', name: 'Recon', role: 'SILENT HUNTER', description: 'One shot ahead of the horde.', weapon: 'M14 Marksman', ability: 'Ghost protocol', abilityDescription: 'Become untouchable and move faster for 5 seconds.', color: '#81a6ad', health: 85, speed: 245, damage: 78, fireRate: .43, magazine: 12, reload: 1.65, cooldown: 16, stats: [5, 2, 5] },
];

export const getClass = (id: ClassId) => CLASSES.find(c => c.id === id)!;

export type GameSettings = { music: boolean; sfx: boolean; shake: boolean; volume: number };
export const DEFAULT_SETTINGS: GameSettings = { music: true, sfx: true, shake: true, volume: .6 };
