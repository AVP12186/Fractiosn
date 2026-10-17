export type ClassId = 'assault' | 'medic' | 'engineer' | 'recon' | 'vanguard' | 'gunslinger' | 'pyro' | 'ranger' | 'scavenger' | 'cryo';

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
  { id: 'vanguard', name: 'Vanguard', role: 'LIVING FORTRESS', description: 'Be the last wall standing.', weapon: 'Belt-fed LMG', ability: 'Iron curtain', abilityDescription: 'Absorb all incoming damage for 5 seconds.', color: '#b5b8c6', health: 180, speed: 183, damage: 26, fireRate: .12, magazine: 60, reload: 2.8, cooldown: 24, stats: [4, 5, 2] },
  { id: 'gunslinger', name: 'Gunslinger', role: 'DEAD-EYE DRIFTER', description: 'Six reasons to keep walking.', weapon: 'Twin Revolvers', ability: 'High noon', abilityDescription: 'Fire a piercing six-shot fan, then deal double damage for 5 seconds.', color: '#d8a27c', health: 95, speed: 232, damage: 56, fireRate: .28, magazine: 12, reload: 1.4, cooldown: 18, stats: [5, 2, 4] },
  { id: 'pyro', name: 'Pyro', role: 'CONTROLLED CHAOS', description: 'Light a way through the dark.', weapon: 'Dragonbreath SMG', ability: 'Firestorm', abilityDescription: 'Burn nearby infected and empower shots with splash damage for 7 seconds.', color: '#f49c4e', health: 115, speed: 210, damage: 21, fireRate: .11, magazine: 32, reload: 1.8, cooldown: 22, stats: [4, 3, 3] },
  { id: 'ranger', name: 'Ranger', role: 'WILDERNESS STALKER', description: 'The long road is your home.', weapon: 'Rail Crossbow', ability: 'Heartseeker', abilityDescription: 'Piercing, double-damage bolts for 7 seconds.', color: '#8cb37b', health: 105, speed: 237, damage: 100, fireRate: .65, magazine: 7, reload: 1.6, cooldown: 19, stats: [5, 3, 5] },
  { id: 'scavenger', name: 'Scavenger', role: 'RESOURCE GHOST', description: 'Nothing left behind.', weapon: 'Salvaged PDW', ability: 'Finders keepers', abilityDescription: 'Pull in nearby drops, heal 30 HP, and sprint faster for 8 seconds.', color: '#cfba78', health: 110, speed: 225, damage: 23, fireRate: .13, magazine: 28, reload: 1.25, cooldown: 17, stats: [3, 3, 4] },
  { id: 'cryo', name: 'Cryo', role: 'COLD FRONT', description: 'Make the dead stand still.', weapon: 'Frostburst Rifle', ability: 'Absolute zero', abilityDescription: 'Slow all nearby infected to a crawl for 6 seconds.', color: '#88cbe1', health: 100, speed: 220, damage: 38, fireRate: .22, magazine: 24, reload: 1.5, cooldown: 20, stats: [4, 3, 4] },
];

export const getClass = (id: ClassId) => CLASSES.find(c => c.id === id)!;

export type GameSettings = { music: boolean; sfx: boolean; shake: boolean; volume: number };
export const DEFAULT_SETTINGS: GameSettings = { music: true, sfx: true, shake: true, volume: .6 };
