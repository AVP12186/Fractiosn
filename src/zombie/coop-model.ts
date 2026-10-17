import { CLASSES, ClassId } from './classes';
import { Equipment, JOURNEY_WORLD, levelCaches, parseSave } from './campaign';

export const COOP_VERSION = 1;
export const MAX_SQUAD = 4;
export const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export type Member = { id: string; name: string; classId: ClassId; ready: boolean };
export type Action = 'reload' | 'ability' | 'dash' | 'interact' | 'heal';
export type Control = { seq: number; x: number; y: number; aim: number; autoAim: boolean; fire: boolean; actions: Action[] };
export const idleControl = (): Control => ({ seq: 0, x: 0, y: 0, aim: -Math.PI / 2, autoAim: false, fire: false, actions: [] });
export type Point = { x: number; y: number };
export type CoopPlayer = Member & Point & {
  angle: number; health: number; maxHealth: number; ammo: number; reload: number;
  ability: number; active: number; dash: number; dashTime: number; shot: number;
  hurt: number; flash: number; medkits: number; scrap: number; kills: number;
  equipment: Equipment; notice: string; noticeTime: number;
};
export type Infected = Point & { id: number; kind: 'zombie' | 'runner' | 'brute'; hp: number; maxHp: number; angle: number; speed: number; attack: number; boss: boolean };
export type Round = Point & { id: number; owner: string; vx: number; vy: number; damage: number; life: number; pierce: boolean; splash: boolean; hits: number[] };
export type Sentry = Point & { owner: string; time: number; shot: number; angle: number };
export type Drop = Point & { kind: 'cross' | 'ammo' | 'scrap'; time: number };
export type CoopFrame = {
  version: 1; tick: number; level: number; step: number; time: number;
  phase: 'story' | 'playing' | 'defeat' | 'victory'; scene: number; sceneReady: string[];
  paused: boolean; search: number; searching: boolean; bossDefeated: boolean;
  opened: string[]; players: CoopPlayer[]; zombies: Infected[]; bullets: Round[];
  turrets: Sentry[]; drops: Drop[];
};
export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const finite = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export const classId = (v: unknown): v is ClassId => CLASSES.some(c => c.id === v);
export const memberId = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v);
export const cleanName = (v: string) => v.replace(/[\x00-\x1f\x7f<>]/g, '').trim().slice(0, 18) || 'Survivor';
export const validCode = (v: string) => v.length === 10 && [...v].every(c => ROOM_ALPHABET.includes(c));
export function makeCode() {
  return [...crypto.getRandomValues(new Uint8Array(10))].map(n => ROOM_ALPHABET[n % ROOM_ALPHABET.length]).join('');
}
export const isMember = (v: unknown): v is Member & Record<string, unknown> => isRecord(v) && memberId(v.id) && typeof v.name === 'string' && v.name === cleanName(v.name) && classId(v.classId) && typeof v.ready === 'boolean';
export function readControl(v: unknown): Control | null {
  if (!isRecord(v) || !finite(v.seq, 0, Number.MAX_SAFE_INTEGER) || !Number.isInteger(v.seq) || !finite(v.x, -1, 1) || !finite(v.y, -1, 1) || !finite(v.aim, -Math.PI * 2, Math.PI * 2) || typeof v.fire !== 'boolean' || typeof v.autoAim !== 'boolean' || !Array.isArray(v.actions) || v.actions.length > 5 || !v.actions.every(a => ['reload', 'ability', 'dash', 'interact', 'heal'].includes(a))) return null;
  return { seq: v.seq, x: v.x, y: v.y, aim: v.aim, fire: v.fire, autoAim: v.autoAim, actions: [...new Set(v.actions)] as Action[] };
}
const point = (v: Record<string, unknown>) => finite(v.x, 0, JOURNEY_WORLD.width) && finite(v.y, 0, JOURNEY_WORLD.height);
const numbers = (v: Record<string, unknown>, keys: string[], max = 1e9) => keys.every(k => finite(v[k], 0, max));
export function readFrame(v: unknown): CoopFrame | null {
  if (!isRecord(v) || v.version !== COOP_VERSION || !finite(v.tick, 0, Number.MAX_SAFE_INTEGER) || !finite(v.level, 0, 99) || !Number.isInteger(v.level) || !finite(v.step, 0, 3) || !Number.isInteger(v.step) || !finite(v.time, 0, 1e9) || !['story', 'playing', 'defeat', 'victory'].includes(String(v.phase)) || !finite(v.scene, 0, 100) || typeof v.paused !== 'boolean' || typeof v.searching !== 'boolean' || typeof v.bossDefeated !== 'boolean' || !finite(v.search, 0, 18) || !Array.isArray(v.sceneReady) || v.sceneReady.length > MAX_SQUAD || !v.sceneReady.every(memberId) || !Array.isArray(v.opened) || v.opened.length > 14) return null;
  const caches = levelCaches(v.level);
  if (!v.opened.every(id => caches.some(c => c.id === id))) return null;
  if (!Array.isArray(v.players) || !v.players.length || v.players.length > MAX_SQUAD || !v.players.every(p => {
    if (!isRecord(p) || !isMember(p) || !point(p) || !finite(p.angle, -Math.PI * 2, Math.PI * 2) || !numbers(p, ['health', 'maxHealth', 'ammo', 'reload', 'ability', 'active', 'dash', 'dashTime', 'shot', 'hurt', 'flash', 'medkits', 'scrap', 'kills', 'noticeTime']) || typeof p.notice !== 'string' || p.notice.length > 200) return false;
    return !!parseSave(JSON.stringify({ version: 2, classId: p.classId, level: v.level, step: v.step, equipment: p.equipment, medkits: p.medkits, scrap: p.scrap, kills: p.kills, score: 0, elapsed: v.time, opened: [] }));
  }) || new Set(v.players.map(p => p.id)).size !== v.players.length) return null;
  const list = (key: string, max: number, check: (p: Record<string, unknown>) => boolean) => Array.isArray(v[key]) && (v[key] as unknown[]).length <= max && (v[key] as unknown[]).every(p => isRecord(p) && point(p) && check(p));
  if (!list('zombies', 80, p => Number.isInteger(p.id) && numbers(p, ['id', 'hp', 'maxHp', 'speed']) && finite(p.attack, -1, 1) && finite(p.angle, -Math.PI * 2, Math.PI * 2) && ['zombie', 'runner', 'brute'].includes(String(p.kind)) && typeof p.boss === 'boolean')) return null;
  if (!list('bullets', 256, p => memberId(p.owner) && numbers(p, ['id', 'damage', 'life']) && finite(p.vx, -1200, 1200) && finite(p.vy, -1200, 1200) && typeof p.pierce === 'boolean' && typeof p.splash === 'boolean' && Array.isArray(p.hits) && p.hits.length <= 80 && p.hits.every(n => finite(n, 0, 1e9)))) return null;
  if (!list('turrets', 12, p => memberId(p.owner) && numbers(p, ['time', 'shot']) && finite(p.angle, -Math.PI * 2, Math.PI * 2))) return null;
  if (!list('drops', 80, p => numbers(p, ['time']) && ['cross', 'ammo', 'scrap'].includes(String(p.kind)))) return null;
  return v as unknown as CoopFrame;
}
