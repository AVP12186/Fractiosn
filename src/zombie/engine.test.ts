import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ShooterEngine } from './engine';
import { CLASSES, ClassId, DEFAULT_SETTINGS } from './classes';
import { actor, portrait, uiIcon, WORLD } from './art';
import { CampaignSave, emptyEquipment, filmFor, LEVEL_COUNT, LEVEL_HEIGHT, levelCaches, levelInfo, parseSave, REGIONS, rollGear, SEARCH_SECONDS } from './campaign';
import { CHUNK_HEIGHT, drawLandscape, obstaclesForChunk, obstaclesNear } from './landscape';
import { audio, musicProfile } from './audio';

const context = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' || key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} });
const fakeWindow = Object.assign(new EventTarget(), { devicePixelRatio: 1 });
let canvasCount = 0;
const fakeDocument = Object.assign(new EventTarget(), { hidden: false, createElement: () => { canvasCount++; return { width: 0, height: 0, getContext: () => context }; } });
Object.assign(globalThis, { window: fakeWindow, document: fakeDocument, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, ResizeObserver: class { observe() {} disconnect() {} } });
const engines: ShooterEngine[] = [];
afterEach(() => engines.splice(0).forEach(e => e.destroy()));
function create(id: ClassId = 'assault', hooks: Partial<ConstructorParameters<typeof ShooterEngine>[3]> = {}, save?: CampaignSave) {
  const canvas = Object.assign(new EventTarget(), { width: 1050, height: 760, getContext: () => context, getBoundingClientRect: () => ({ width: 1050, height: 760, left: 0, top: 0 }) });
  const e = new ShooterEngine(canvas as unknown as HTMLCanvasElement, id, DEFAULT_SETTINGS, { onUpdate: () => {}, onPause: toggle => e.setPaused(toggle ? !e['paused'] : true), onDeath: () => {}, ...hooks }, save);
  engines.push(e); return e;
}
function zombie(x: number, y: number, hp = 64) { return { id: 1, x, y, hp, maxHp: hp, kind: 'zombie' as const, speed: 78, angle: 0, hit: 0, attack: 0 }; }
function tick(e: ShooterEngine, seconds: number) { for (let t = 0; t < seconds; t += .04) e['update'](.04); }
function at(e: ShooterEngine, point: { x: number; y: number }) { Object.assign(e['player'], point); e['camera'] = { ...point }; }

test('ten classes have distinct loadouts, abilities, and native 64 × 64 art', () => {
  assert.equal(CLASSES.length, 10); assert.equal(new Set(CLASSES.map(c => c.weapon)).size, 10); assert.equal(new Set(CLASSES.map(c => c.ability)).size, 10);
  for (const c of CLASSES) { const game = create(c.id); assert.equal(game.snapshot().health, c.health); assert.equal(game.snapshot().ammo, c.magazine); for (const sprite of [portrait(c.id), actor(c.id)]) { assert.equal(sprite.width, 64); assert.equal(sprite.height, 64); } }
  for (const icon of ['cross', 'ammo', 'shield', 'skull', 'bolt', 'crate', 'scrap'] as const) { assert.equal(uiIcon(icon).width, 64); assert.equal(uiIcon(icon).height, 64); }
});
test('100 unique northbound routes span 20 regions, with ordered reachable objectives and caches', () => {
  const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => levelInfo(i));
  assert.equal(new Set(levels.map(l => l.name)).size, 100); assert.equal(new Set(levels.map(l => l.region.name)).size, 20); assert.equal(levels.filter(l => l.boss).length, 10);
  const blocked = (p: { x: number; y: number }) => obstaclesNear(p.y).some(o => p.x + 40 > o.x && p.x - 40 < o.x + o.w && p.y + 40 > o.y && p.y - 40 < o.y + o.h);
  for (const l of levels) {
    assert.equal(l.number, l.index + 1); assert.equal(l.bottom - l.top, LEVEL_HEIGHT); assert.equal(l.targetMinutes, 5);
    const points = [l.spawn, ...l.objectives, l.exit]; for (let i = 1; i < points.length; i++) assert.ok(points[i].y < points[i - 1].y);
    for (const p of [...points, ...levelCaches(l.index)]) { assert.ok(!blocked(p), `${l.number}: blocked at ${JSON.stringify(p)}`); assert.ok(p.y > l.top && p.y < l.bottom); }
    if (l.index < 99) assert.ok(levelInfo(l.index + 1).spawn.y < l.exit.y);
  }
});
test('route lengths leave room for combat and scavenging in a roughly five-minute level', () => {
  const l = levelInfo(0), route = [l.spawn, ...l.objectives, l.exit];
  const length = route.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - route[i].x, p.y - route[i].y), 0);
  for (const c of CLASSES) { const baseTime = length / c.speed + 3 * SEARCH_SECONDS; assert.ok(baseTime > 200 && baseTime < 300); }
});
test('movement normalizes diagonals and collides with streamed buildings and world edges', () => {
  const e = create(), start = { ...e['player'] }; e.setMove(1, -1); e['update'](.1);
  assert.ok(Math.abs(Math.hypot(e['player'].x - start.x, e['player'].y - start.y) - e.survivor.speed * .1) < .001);
  const o = obstaclesNear(levelInfo(0).bottom - 1500).find(o => o.w > 50)!;
  at(e, { x: o.x + o.w + 20, y: o.y + o.h / 2 }); e.setMove(-1, 0); e['update'](.1); assert.ok(e['player'].x >= o.x + o.w + 18);
  at(e, { x: WORLD.width - 40, y: levelInfo(0).spawn.y }); e.setMove(1, 0); tick(e, .8); assert.ok(e['player'].x <= WORLD.width - 38);
});
test('terrain generation is deterministic and caches visible chunks instead of a campaign-sized canvas', () => {
  assert.deepEqual(obstaclesForChunk(320), obstaclesForChunk(320)); const before = canvasCount;
  for (let i = 0; i < 30; i++) drawLandscape(context as CanvasRenderingContext2D, i * CHUNK_HEIGHT + 200, 700);
  const count = canvasCount; drawLandscape(context as CanvasRenderingContext2D, 29 * CHUNK_HEIGHT + 200, 700); assert.equal(canvasCount, count); assert.ok(count - before < 40);
  const e = create(); assert.doesNotThrow(() => e['draw']());
});
test('firing consumes ammo, empty weapons auto-reload, and reload completes', () => {
  const e = create(); e.setFiring(true); e['update'](.02); assert.equal(e.snapshot().ammo, 29);
  e['ammo'] = 0; e['shotTime'] = 0; e['update'](.02); assert.ok(e.snapshot().reloading > 0); e.setFiring(false); tick(e, 1.8); assert.equal(e.snapshot().ammo, 30); assert.equal(e.snapshot().reloading, 0);
});
test('assault overdrive does not consume ammo and respects cooldown', () => {
  const e = create(); e.ability(); assert.equal(e.snapshot().active, 6); e.setFiring(true); tick(e, .48); assert.equal(e.snapshot().ammo, 30); const cooldown = e.snapshot().ability; e.ability(); assert.equal(e.snapshot().ability, cooldown);
});
test('medic heals without exceeding maximum health', () => {
  const e = create('medic'); e['player'].health = 25; e.ability(); assert.equal(e.snapshot().health, 80); e['abilityCooldown'] = 0; e.ability(); assert.equal(e.snapshot().health, 100);
});
test('engineer deploys a timed sentry that fires at nearby infected', () => {
  const e = create('engineer'); e.ability(); assert.equal(e['turrets'].length, 1); e['zombies'] = [zombie(e['player'].x + 100, e['player'].y)]; e['update'](.11); assert.ok(e['bullets'].length > 0); e['turrets'][0].time = .01; e['update'](.02); assert.equal(e['turrets'].length, 0);
});
test('recon ghost, vanguard shield, and dash prevent contact damage', () => {
  for (const id of ['recon', 'vanguard'] as const) { const e = create(id); e['zombies'] = [zombie(e['player'].x, e['player'].y)]; e.ability(); e['update'](.04); assert.equal(e.snapshot().health, e.survivor.health); e['activeAbility'] = 0; e.dash(); e['update'](.01); assert.equal(e.snapshot().health, e.survivor.health); }
});
test('gunslinger fans six piercing shots and ranger powers piercing bolts', () => {
  const g = create('gunslinger'); g.ability(); assert.equal(g['bullets'].length, 6); assert.ok(g['bullets'].every(b => b.pierce && b.damage >= g.survivor.damage * 2));
  const r = create('ranger'); r.ability(); r['shoot'](0); assert.equal(r['bullets'][0].pierce, true); assert.equal(r['bullets'][0].damage, 200);
});
test('pyro damages nearby infected and enables explosive ammunition', () => {
  const e = create('pyro'); e['zombies'] = [zombie(e['player'].x + 100, e['player'].y, 500)]; e.ability(); assert.equal(e['zombies'][0].hp, 350); e['shoot'](0); assert.equal(e['bullets'][0].splash, true);
});
test('scavenger heals and attracts drops, cryo slows pursuit', () => {
  const e = create('scavenger'); e['player'].health = 40; e['pickups'] = [{ x: e['player'].x + 500, y: e['player'].y, kind: 'ammo', time: 20 }]; e.ability(); assert.equal(e.snapshot().health, 70); assert.equal(e['pickups'][0].x, e['player'].x);
  const c = create('cryo'), pos = c['player']; c['zombies'] = [zombie(pos.x + 200, pos.y)]; c.ability(); const x = c['zombies'][0].x; c['update'](.1); assert.ok(x - c['zombies'][0].x < 2);
});
test('kills award score and every fifth kill drops a medical pickup', () => {
  const e = create(); for (let i = 0; i < 5; i++) e['kill'](zombie(e['player'].x + 50, e['player'].y)); assert.equal(e.snapshot().kills, 5); assert.equal(e.snapshot().score, 500); assert.ok(e['pickups'].some(p => p.kind === 'cross'));
  e['player'].health = 50; e['pickups'] = [{ ...e['player'], kind: 'cross', time: 10 }]; e['update'](.02); assert.equal(e.snapshot().health, 80);
});
test('northbound encounters continue without a wave-clear or recovery gate', () => {
  const e = create(); tick(e, 5); assert.ok(e['zombies'].length > 0); e['zombies'] = []; e['spawnTimer'] = .01; e['update'](.04); assert.ok(e['zombies'].length > 0); assert.equal(e.snapshot().level, 0); assert.equal(e.snapshot().step, 0);
});
test('supply cases grant loot only once, refill ammo, and add medkits', () => {
  const e = create(); at(e, levelCaches(0)[0]); e['ammo'] = 1; e.interact(); assert.equal(e['opened'].size, 1); assert.equal(e.snapshot().medkits, 4); assert.equal(e.snapshot().ammo, 30); assert.equal(Object.values(e.snapshot().equipment).filter(Boolean).length, 1);
  const score = e.snapshot().score; e.interact(); assert.equal(e.snapshot().score, score); assert.equal(e.snapshot().medkits, 4);
});
test('rarity is deterministic, all slots occur, and elite caches yield legendary gear', () => {
  const gear = Array.from({ length: 200 }, (_, i) => rollGear(20, i)); assert.equal(new Set(gear.map(g => g.rarity)).size, 5); assert.equal(new Set(gear.map(g => g.slot)).size, 4); assert.deepEqual(rollGear(50, 92), rollGear(50, 92)); assert.equal(rollGear(99, 25, true).rarity, 'legendary');
});
test('equipment modifies damage, health, speed, and weaker finds become scrap', () => {
  const e = create(); e['equip']({ slot: 'weapon', name: 'Test barrel', rarity: 'rare', power: 50 }); e['shoot'](0); assert.equal(e['bullets'][0].damage, 42);
  e['equip']({ slot: 'vest', name: 'Test armor', rarity: 'epic', power: 40 }); assert.equal(e.snapshot().maxHealth, 160); assert.equal(e.snapshot().health, 160);
  e['equip']({ slot: 'boots', name: 'Test boots', rarity: 'rare', power: 20 }); const y = e['player'].y; e.setMove(0, -1); e['update'](.1); assert.ok(Math.abs(y - e['player'].y - e.survivor.speed * 1.2 * .1) < .001);
  e['equip']({ slot: 'weapon', name: 'Weaker', rarity: 'common', power: 1 }); assert.equal(e.snapshot().scrap, 1); assert.equal(e.snapshot().equipment.weapon?.power, 50);
});
test('healing consumes medkits or three scrap, never resources at full health', () => {
  const e = create(); e.heal(); assert.equal(e.snapshot().medkits, 3); e['player'].health = 10; e.heal(); assert.equal(e.snapshot().health, 75); assert.equal(e.snapshot().medkits, 2);
  e['medkits'] = 0; e['scrap'] = 3; e.heal(); assert.equal(e.snapshot().health, 120); assert.equal(e.snapshot().scrap, 0);
});
test('receiver uplink requires proximity and 18 seconds, then saves a checkpoint', () => {
  let saved: CampaignSave | undefined; const e = create('assault', { onCheckpoint: s => saved = s }); const first = levelInfo(0).objectives[0]; e.interact(); assert.equal(e['searching'], false);
  at(e, first); e.interact(); assert.equal(e['searching'], true); e['player'].hurt = 1000; tick(e, 17); assert.equal(e.snapshot().step, 0); tick(e, 1.1); assert.equal(e.snapshot().step, 1); assert.equal(saved?.step, 1); assert.equal(saved?.level, 0);
});
test('leaving the receiver ring cancels the uplink rather than saving a remote objective', () => {
  const e = create(); at(e, levelInfo(0).objectives[0]); e.interact(); tick(e, 1); e['player'].y += 200; e['update'](.04); assert.equal(e['searching'], false); assert.equal(e.snapshot().step, 0);
});
test('north gate cannot skip objectives; completed routes trigger cutscenes and the next checkpoint', () => {
  let scene = -1, saved: CampaignSave | undefined;
  const e = create('assault', { onScene: n => scene = n, onCheckpoint: s => saved = s }); assert.equal(scene, 0); const time = e.snapshot().time; e.setMove(0, -1); tick(e, 1); assert.equal(e.snapshot().time, time);
  e.completeCinematic(); at(e, levelInfo(0).exit); e.interact(); assert.equal(e['pendingAdvance'], false); e['step'] = 3; e.interact(); assert.equal(scene, 1); assert.equal(e['locked'], true); e.completeCinematic(); assert.equal(e.snapshot().level, 1); assert.equal(e.snapshot().step, 0); assert.equal(saved?.level, 1); assert.equal(e['player'].y, levelInfo(1).spawn.y);
});
test('guardian gates every tenth level and guarantees a legendary reward', () => {
  const e = create(); e['level'] = 9; e['step'] = 2; at(e, levelInfo(9).objectives[2]); e['spawnTimer'] = 100; e['update'](.04); const boss = e['zombies'].find(z => z.boss)!; assert.ok(boss); e.interact(); assert.equal(e['searching'], false);
  e['damage'](boss, 10000); assert.equal(e['bossDefeated'], true); assert.ok(Object.values(e.snapshot().equipment).some(g => g?.rarity === 'legendary')); e.interact(); assert.equal(e['searching'], true);
});
test('saved checkpoints restore class, route, gear, supplies, totals and opened cases', () => {
  const e = create('cryo'); e['level'] = 54; e['step'] = 2; e['equip'](rollGear(54, 6, true)); e['opened'].add(levelCaches(54)[0].id); e['kills'] = 32; e['score'] = 4500; e['elapsed'] = 800; e['medkits'] = 5;
  const saved = parseSave(JSON.stringify(e.createSave())); assert.ok(saved); const loaded = create(saved.classId, {}, saved); assert.equal(loaded.snapshot().level, 54); assert.equal(loaded.snapshot().step, 2); assert.equal(loaded.snapshot().kills, 32); assert.equal(loaded.snapshot().medkits, 5); assert.equal(loaded.snapshot().health, loaded.snapshot().maxHealth); assert.deepEqual(loaded.snapshot().equipment, e.snapshot().equipment); assert.equal(loaded['opened'].size, 1);
});
test('malformed or unsupported campaign saves are rejected safely', () => {
  const good = create().createSave(); for (const raw of [null, '{broken', '{}', JSON.stringify({ ...good, level: 100 }), JSON.stringify({ ...good, step: -1 }), JSON.stringify({ ...good, classId: 'hacker' }), JSON.stringify({ ...good, medkits: 1000 }), JSON.stringify({ ...good, equipment: { ...emptyEquipment(), weapon: { slot: 'weapon', rarity: '__proto__', name: 'oops', power: 2 } } }), JSON.stringify({ ...good, opened: ['not-a-real-case'] })]) assert.equal(parseSave(raw), null);
});
test('all 100 levels configure distinct musical profiles and full story transitions', () => {
  assert.equal(new Set(Array.from({ length: 100 }, (_, i) => JSON.stringify(musicProfile(i)))).size, 100);
  for (let i = 0; i <= 100; i++) { const film = filmFor(i); assert.ok(film.title.length > 3); assert.ok(film.frames.length >= 1); assert.ok(film.frames.every(f => f.speaker && f.text.length > 20)); }
  for (let i = 0; i <= 100; i += 10) assert.ok(filmFor(i).frames.length >= 3); audio.setJourney(99); assert.equal(audio['journey'], 99); assert.equal(audio['step'], 0);
});
test('level 100 ending completes the campaign instead of starting level 101', () => {
  let victories = 0, scene = 0; const e = create('assault', { onScene: n => scene = n, onVictory: s => { assert.equal(s.completed, true); victories++; } }); e.completeCinematic(); e['level'] = 99; e['step'] = 3; at(e, levelInfo(99).exit); e.interact(); assert.equal(scene, 100); e.completeCinematic(); assert.equal(victories, 1); assert.equal(e.snapshot().level, 99); assert.equal(e.snapshot().completed, true); e.completeCinematic(); assert.equal(victories, 1);
});
test('paused, cinematic, completed, and dead states suppress combat and held input', () => {
  const e = create(); e['ammo'] = 20; e.setMove(1, 0); e.setFiring(true); e.setPaused(true); e.reload(); e.ability(); e.dash(); e.heal(); e.setFiring(true); e.setMove(1, 1); assert.equal(e.snapshot().reloading, 0); assert.equal(e.snapshot().ability, 0); assert.equal(e.snapshot().dash, 0); assert.equal(e['pointer'].down, false); assert.equal(e['movement'].x, 0);
  e.setPaused(false); e['locked'] = true; tick(e, .4); assert.equal(e.snapshot().time, 0); e['locked'] = false; e['won'] = true; tick(e, .4); assert.equal(e.snapshot().time, 0); e['won'] = false; e['dead'] = true; tick(e, .4); assert.equal(e.snapshot().time, 0);
});
test('contact damage ends the run once; repeated blur pauses without toggling back', () => {
  let deaths = 0; const e = create('recon', { onDeath: () => deaths++ }); e['player'].health = 1; e['zombies'] = [zombie(e['player'].x, e['player'].y)]; e['update'](.04); e['update'](.04); assert.equal(deaths, 1); assert.equal(e.snapshot().health, 0);
  const alive = create(); fakeWindow.dispatchEvent(new Event('blur')); fakeWindow.dispatchEvent(new Event('blur')); assert.equal(alive['paused'], true);
});
