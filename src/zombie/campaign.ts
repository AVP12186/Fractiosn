import { CLASSES, ClassId } from './classes';

export const LEVEL_COUNT = 100;
export const LEVEL_HEIGHT = 39000;
export const JOURNEY_WORLD = { width: 2560, height: LEVEL_COUNT * LEVEL_HEIGHT };
export const SEARCH_SECONDS = 18;
export const SAVE_KEY = 'dead-signal-northbound-v2';
export type GearSlot = 'weapon' | 'vest' | 'boots' | 'charm';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Gear = { slot: GearSlot; name: string; rarity: Rarity; power: number };
export type Equipment = Record<GearSlot, Gear | null>;
export const emptyEquipment = (): Equipment => ({ weapon: null, vest: null, boots: null, charm: null });
export const RARITY_COLORS: Record<Rarity, string> = { common: '#c1c9b9', uncommon: '#9fc784', rare: '#80badc', epic: '#bc9de1', legendary: '#f2b66b' };
export const REGIONS = [
  { name: 'Blackwater', kind: 'city', ground: '#303a32', road: '#222d29', accent: '#c29067', landmark: 'THE QUARANTINE LINE' },
  { name: 'Ashen Suburbs', kind: 'town', ground: '#3c3b30', road: '#2d302a', accent: '#d5a978', landmark: 'HOMES WITHOUT VOICES' },
  { name: 'Ironwood Forest', kind: 'forest', ground: '#23372f', road: '#394034', accent: '#9cb783', landmark: 'THE TREES ARE LISTENING' },
  { name: 'Redwater Farms', kind: 'farm', ground: '#474936', road: '#3a3c2e', accent: '#c6ba78', landmark: 'THE LAST HARVEST' },
  { name: 'Hollow Creek', kind: 'town', ground: '#343b38', road: '#242e2c', accent: '#8eb9ad', landmark: 'FOLLOW THE RIVER' },
  { name: 'Mercy Hospital', kind: 'lab', ground: '#33433e', road: '#26332e', accent: '#9ac8bd', landmark: 'DO NO HARM' },
  { name: 'Sunken Boardwalk', kind: 'flood', ground: '#273d43', road: '#4a4c3b', accent: '#b1c2b5', landmark: 'THE TIDE TOOK EVERYTHING' },
  { name: 'Deadrail Junction', kind: 'rail', ground: '#383a35', road: '#292c29', accent: '#b99774', landmark: 'NO TRAINS NORTH' },
  { name: 'Dustfall Quarry', kind: 'desert', ground: '#514635', road: '#403b30', accent: '#d5b786', landmark: 'BURIED SECRETS' },
  { name: 'Cinder Refinery', kind: 'industrial', ground: '#38332d', road: '#282b27', accent: '#e7a46b', landmark: 'THE SKY IS BURNING' },
  { name: 'Drowned Crossing', kind: 'flood', ground: '#293b43', road: '#48504a', accent: '#8ebac9', landmark: 'A BRIDGE TOO FAR' },
  { name: 'Fort Halcyon', kind: 'military', ground: '#3e4436', road: '#2b332b', accent: '#bfbc83', landmark: 'ORDERS FROM THE DEAD' },
  { name: 'Glasshouse Labs', kind: 'lab', ground: '#304449', road: '#243138', accent: '#83bfc7', landmark: 'WHERE IT ALL BEGAN' },
  { name: 'Silent Pines', kind: 'forest', ground: '#283a35', road: '#37423a', accent: '#a1c8ae', landmark: 'SOMETHING FOLLOWS' },
  { name: 'Frostline Pass', kind: 'snow', ground: '#708482', road: '#4d6365', accent: '#d0e4db', landmark: 'BREATHE. KEEP CLIMBING.' },
  { name: 'Whiteout Station', kind: 'snow', ground: '#7b8b8f', road: '#52686b', accent: '#d4dfdf', landmark: 'A LIGHT IN THE STORM' },
  { name: 'The Observatory', kind: 'lab', ground: '#37454e', road: '#28353d', accent: '#b5b8dd', landmark: 'LOOK TO THE SKY' },
  { name: 'Raven Dam', kind: 'industrial', ground: '#344342', road: '#273837', accent: '#a5c9c1', landmark: 'POWER FOR ONE LAST SIGNAL' },
  { name: 'Northern Exclusion', kind: 'military', ground: '#46514b', road: '#303e39', accent: '#c3d1aa', landmark: 'BEYOND THE MAP' },
  { name: 'Dawn Array', kind: 'snow', ground: '#6d7b7f', road: '#3b5159', accent: '#f1c997', landmark: 'SOMEONE IS STILL LISTENING' },
] as const;
const ROUTES = ['Outskirts', 'Service Road', 'Lost Quarter', 'Old Highway', 'Northern Gate'];
const OBJECTIVES = [
  ['Restore the emergency relay', 'Recover the route ledger', 'Open the quarantine gate'],
  ['Scavenge a field battery', 'Decode the survivor beacon', 'Power the northern relay'],
  ['Search the ranger outpost', 'Copy the evacuation map', 'Activate the trail beacon'],
  ['Recover the supply manifest', 'Secure the medical cache', 'Broadcast the safe route'],
  ['Tune the river receiver', 'Retrieve the sealed dispatch', 'Restore the crossing signal'],
] as const;
export function levelInfo(index: number) {
  const region = REGIONS[Math.floor(index / 5)];
  const bottom = JOURNEY_WORLD.height - index * LEVEL_HEIGHT;
  const x = (step: number) => 1060 + ((index * 7 + step * 11) % 4) * 150;
  return { index, number: index + 1, region, name: `${region.name} / ${ROUTES[index % 5]}`, bottom, top: bottom - LEVEL_HEIGHT,
    spawn: { x: 1280, y: bottom - 350 }, exit: { x: 1280, y: bottom - LEVEL_HEIGHT + 400 },
    objectives: [9400, 19500, 29600].map((offset, step) => ({ x: x(step), y: bottom - offset, title: OBJECTIVES[Math.floor(index / 5) % 5][step], id: `${index}-${step}` })),
    boss: (index + 1) % 10 === 0, music: `Northbound ${String(index + 1).padStart(3, '0')} · ${['Ember', 'Static', 'Undertow', 'Frost', 'Dawn'][index % 5]}`,
    targetMinutes: 5,
  };
}
export function levelCaches(index: number) {
  const { bottom } = levelInfo(index);
  return Array.from({ length: 14 }, (_, i) => ({ id: `${index}:cache:${i}`, x: i % 2 ? 1770 : 790, y: bottom - 1400 - i * 2650, elite: i === 13 && (index + 1) % 5 === 0 }));
}
export function rollGear(level: number, seed: number, elite = false): Gear {
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const roll = ((seed * 16807 + 37) >>> 0) % 100;
  const tier = elite ? 4 : roll >= 97 ? 4 : roll >= 86 ? 3 : roll >= 62 ? 2 : roll >= 28 ? 1 : 0;
  const slot: GearSlot = (['weapon', 'vest', 'boots', 'charm'] as const)[seed % 4];
  const names = { weapon: ['Scrounger barrel', 'Ranger optic', 'Deadeye receiver', 'Phantom core', 'Dawnbreaker core'], vest: ['Patched vest', 'Patrol plating', 'Sentinel armor', 'Ghostweave', 'Aegis vest'], boots: ['Trail boots', 'Runner soles', 'Pathfinder boots', 'Specter treads', 'Northstar boots'], charm: ['Copper token', 'Lucky compass', 'Survivor sigil', 'Signal shard', 'Dawn heart'] };
  const power = slot === 'weapon' ? 12 + tier * 11 + level * 1.5 : slot === 'vest' ? 15 + tier * 15 + level * .6 : slot === 'boots' ? 4 + tier * 4 + level * .06 : 3 + tier * 3 + level * .04;
  return { slot, rarity: rarities[tier], name: names[slot][tier], power: Math.round(power) };
}
export type CampaignSave = { version: 2; classId: ClassId; level: number; step: number; equipment: Equipment; medkits: number; scrap: number; opened: string[]; score: number; kills: number; elapsed: number };
export function parseSave(raw: string | null): CampaignSave | null {
  try {
    const s = JSON.parse(raw || 'null') as CampaignSave;
    if (!s || s.version !== 2 || !CLASSES.some(c => c.id === s.classId) || !Number.isInteger(s.level) || s.level < 0 || s.level >= LEVEL_COUNT || !Number.isInteger(s.step) || s.step < 0 || s.step > 3) return null;
    if (![s.medkits, s.scrap, s.score, s.kills, s.elapsed].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0) || s.medkits > 9 || s.scrap > 999) return null;
    if (!Array.isArray(s.opened) || s.opened.length > 14 || !s.opened.every(v => typeof v === 'string' && levelCaches(s.level).some(c => c.id === v))) return null;
    if (!s.equipment || !(['weapon', 'vest', 'boots', 'charm'] as const).every(slot => { const g = s.equipment[slot]; return g === null || (g && g.slot === slot && typeof g.name === 'string' && g.name.length < 80 && Object.hasOwn(RARITY_COLORS, g.rarity) && Number.isFinite(g.power) && g.power > 0 && g.power < 500); })) return null;
    return s;
  } catch { return null; }
}

export type FilmFrame = { speaker: string; text: string; shot: 'road' | 'radio' | 'survivor' | 'lab' | 'tower' | 'dawn' };
export type Film = { title: string; subtitle: string; frames: FilmFrame[] };
const frame = (speaker: string, text: string, shot: FilmFrame['shot'] = 'road'): FilmFrame => ({ speaker, text, shot });
const ACTS: Record<number, Film> = {
  0: { title: 'A voice in the static', subtitle: 'PROLOGUE · DAY 19 AFTER THE FALL', frames: [frame('SURVIVOR', 'The cities went quiet in nineteen days. Then the dead learned to follow sound.'), frame('UNKNOWN BROADCAST', 'If you can hear this, travel north. One hundred relay posts. Follow the lights. I can help you.', 'radio'), frame('SURVIVOR', 'A child’s voice. The same message every night. No backup. No destination. Just a reason to move.')] },
  10: { title: 'A name in the dark', subtitle: 'ACT I · THE SIGNAL', frames: [frame('MAYA · FIELD RADIO', 'You actually came. I’m Maya. That voice belongs to my son, Eli. I recorded it before the quarantine.', 'survivor'), frame('SURVIVOR', 'You sent a child’s voice into a dead world?'), frame('MAYA', 'People stopped answering soldiers. They still answer a child. I’m at Mercy. Please keep coming.', 'radio')] },
  20: { title: 'The things we carry', subtitle: 'ACT II · THE LONG ROAD', frames: [frame('MAYA', 'The farms supplied the research program. Their last shipment never reached Mercy.'), frame('SURVIVOR', 'I found the shipment. And names on every crate. They weren’t shipping supplies. They were evacuating families.', 'survivor'), frame('MAYA', 'Then some of them made it out. Take the patient ledger north. It may be the only proof left.')] },
  30: { title: 'Mercy is not a place', subtitle: 'ACT III · THE DOCTOR', frames: [frame('MAYA', 'You made it. Eli isn’t here. He’s at Dawn Array, with the last evacuation team.', 'lab'), frame('SURVIVOR', 'On the hospital wall: a frequency diagram. The infected aren’t hunting voices. They’re following the emergency network.', 'lab'), frame('MAYA', 'Our warning system became their compass. I know how to stop it. But we need the original code from Glasshouse. I’ll stay on your radio.', 'radio')] },
  40: { title: 'Passengers', subtitle: 'ACT IV · THE LOST', frames: [frame('SURVIVOR', 'A dead train. A hundred empty seats. One working receiver.'), frame('ELI · RECORDING', 'Mum says being brave is being scared and still opening the door. If you find this, we went north.', 'radio'), frame('MAYA', 'He was alive when they left. That’s enough. That has to be enough.', 'survivor')] },
  50: { title: 'Across the fire', subtitle: 'ACT V · THE COST', frames: [frame('MAYA', 'The refinery guardian was a rescue worker. The network kept him moving long after everything else stopped.'), frame('SURVIVOR', 'We aren’t saving the world by killing everything in it. We’re saving it by giving the living a way through.'), frame('MAYA', 'The flood has taken the highway. Restore the crossing relays. I’ll guide the other survivors behind you.', 'radio')] },
  60: { title: 'Orders from the dead', subtitle: 'ACT VI · THE TRUTH', frames: [frame('FORT HALCYON ARCHIVE', 'PROJECT DAWN: neural carrier test approved. Emergency broadcast spectrum reassigned.', 'lab'), frame('SURVIVOR', 'They knew. The evacuation network was the experiment.'), frame('MAYA', 'And Glasshouse holds the shutdown key. Whatever you find there, bring it into the light.', 'radio')] },
  70: { title: 'The quiet frequency', subtitle: 'ACT VII · GLASSHOUSE', frames: [frame('MAYA', 'That’s it. The counter-signal. It won’t bring the dead back. It can stop the network from drawing them together.', 'lab'), frame('SURVIVOR', 'A route without a horde at the end. A chance to rebuild.'), frame('ELI · LIVE SIGNAL', 'Hello? Mum? There’s someone outside the array. They keep knocking. Please hurry.', 'radio')] },
  80: { title: 'A light in the whiteout', subtitle: 'ACT VIII · THE CLIMB', frames: [frame('MAYA', 'Eli is alive. The array is running on its final battery. The storm took the grid.'), frame('SURVIVOR', 'The observatory has a line to Raven Dam. If I restart it, we can power the counter-signal.'), frame('MAYA', 'Every relay you restored is guiding people north. You’re not walking alone anymore.', 'survivor')] },
  90: { title: 'One last transmission', subtitle: 'ACT IX · THE CHOICE TO HOPE', frames: [frame('SURVIVOR', 'Raven Dam lights up. A thousand windows answer across the valley.', 'tower'), frame('MAYA', 'Power is reaching Dawn Array. The old network is fighting the shutdown. Expect its strongest guardian.'), frame('ELI', 'I can see your lights. I’ll leave the door open.', 'radio')] },
  100: { title: 'Stay human', subtitle: 'EPILOGUE · FIRST LIGHT', frames: [frame('SURVIVOR', 'The guardian falls. The last relay connects. For the first time in nineteen days, the world stops screaming.', 'tower'), frame('MAYA', 'Counter-signal is live. Evacuation corridor is open. Eli… I’m coming.', 'radio'), frame('ELI', 'I knew someone would hear me.', 'survivor'), frame('SURVIVOR', 'The dead are still out there. But the road is ours again. One hundred lights. One way home.', 'dawn'), frame('DAWN NETWORK', 'To every survivor: travel north. You are not alone.', 'dawn')] },
};
export function filmFor(completed: number): Film {
  if (ACTS[completed]) return ACTS[completed];
  const next = levelInfo(Math.min(completed, 99));
  const messages = ['Your relay is live. Another family has a route out. Keep heading north.', 'I can see your marker moving. Search the supply cases before you leave this stretch.', 'The signal is clearer here. Something ahead is listening too. Stay alert.', 'You found the old route. There are lights in the distance. Follow them.', 'Another gate opens. Behind you, survivors are following the trail you made.'];
  return { title: completed % 5 === 0 ? next.region.name : 'Keep the signal alive', subtitle: `RELAY ${String(completed).padStart(3, '0')} SECURED · NEXT: ${next.name.toUpperCase()}`, frames: [frame(completed < 10 ? 'UNKNOWN BROADCAST' : 'MAYA · FIELD RADIO', messages[(completed - 1) % 5], completed % 5 === 0 ? 'road' : 'radio')] };
}
