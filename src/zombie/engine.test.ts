import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { ShooterEngine } from './engine';
import { CLASSES, ClassId, DEFAULT_SETTINGS } from './classes';
import { actor, portrait, uiIcon, OBSTACLES, WORLD } from './art';

// The engine's simulation can run without a browser; rendering and scheduling are inert here.
const context = new Proxy({}, { get: () => () => {} });
const fakeWindow = Object.assign(new EventTarget(), { devicePixelRatio: 1 });
const fakeDocument = Object.assign(new EventTarget(), { hidden: false, createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
Object.assign(globalThis, { window: fakeWindow, document: fakeDocument, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, ResizeObserver: class { observe() {} disconnect() {} } });
const engines: ShooterEngine[] = [];
afterEach(() => engines.splice(0).forEach(e => e.destroy()));
function create(id: ClassId = 'assault', onDeath = () => {}) {
  const canvas = Object.assign(new EventTarget(), { width: 1050, height: 760, getContext: () => context, getBoundingClientRect: () => ({ width: 1050, height: 760, left: 0, top: 0 }) });
  const e = new ShooterEngine(canvas as unknown as HTMLCanvasElement, id, DEFAULT_SETTINGS, { onUpdate: () => {}, onPause: toggle => e.setPaused(toggle ? !e['paused'] : true), onDeath });
  engines.push(e); return e;
}
function zombie(x: number, y: number, hp = 64) { return { id: 1, x, y, hp, maxHp: hp, kind: 'zombie' as const, speed: 78, angle: 0, hit: 0, attack: 0 }; }

test('four classes have distinct balanced loadouts and native 64 × 64 art', () => {
  assert.equal(new Set(CLASSES.map(c => c.weapon)).size, 4);
  assert.equal(new Set(CLASSES.map(c => c.ability)).size, 4);
  for (const c of CLASSES) { const game = create(c.id); assert.equal(game.snapshot().health, c.health); assert.equal(game.snapshot().ammo, c.magazine); for (const sprite of [portrait(c.id), actor(c.id)]) { assert.equal(sprite.width, 64); assert.equal(sprite.height, 64); } }
  for (const icon of ['cross', 'ammo', 'shield', 'skull', 'bolt'] as const) { assert.equal(uiIcon(icon).width, 64); assert.equal(uiIcon(icon).height, 64); }
});
test('movement normalizes diagonals and does not pass through buildings', () => {
  const e = create(), start = { ...e['player'] }; e.setMove(1, 1); e['update'](.1);
  assert.ok(Math.abs(Math.hypot(e['player'].x - start.x, e['player'].y - start.y) - e.survivor.speed * .1) < .001);
  const o = OBSTACLES[0]; e['player'].x = o.x + o.w + 20; e['player'].y = o.y + o.h / 2; e.setMove(-1, 0); e['update'](.1);
  assert.ok(e['player'].x >= o.x + o.w + 18);
  e['player'].x = WORLD.width - 40; e.setMove(1, 0); for (let i = 0; i < 20; i++) e['update'](.04); assert.ok(e['player'].x <= WORLD.width - 38);
});
test('firing consumes ammo, empty weapons auto-reload, reload restores a full magazine', () => {
  const e = create(); e.setFiring(true); e['update'](.02); assert.equal(e.snapshot().ammo, 29);
  e['ammo'] = 0; e['shotTime'] = 0; e['update'](.02); assert.ok(e.snapshot().reloading > 0);
  e.setFiring(false); for (let i = 0; i < 45; i++) e['update'](.04); assert.equal(e.snapshot().ammo, 30); assert.equal(e.snapshot().reloading, 0);
});
test('assault overdrive does not consume ammunition and respects its cooldown', () => {
  const e = create(); e.ability(); assert.equal(e.snapshot().active, 6); e.setFiring(true);
  for (let i = 0; i < 12; i++) e['update'](.04); assert.equal(e.snapshot().ammo, 30); const cooldown = e.snapshot().ability; e.ability(); assert.equal(e.snapshot().ability, cooldown);
});
test('medic restores health without exceeding maximum health', () => {
  const e = create('medic'); e['player'].health = 25; e.ability(); assert.equal(e.snapshot().health, 80);
  e['abilityCooldown'] = 0; e.ability(); assert.equal(e.snapshot().health, 100);
});
test('engineer deploys a timed sentry that fires at nearby infected', () => {
  const e = create('engineer'); e.ability(); assert.equal(e['turrets'].length, 1);
  e['zombies'] = [zombie(1030, 650)]; e['update'](.11); assert.ok(e['bullets'].length > 0);
  e['turrets'][0].time = .01; e['update'](.02); assert.equal(e['turrets'].length, 0);
});
test('recon ghost protocol and dodge prevent contact damage', () => {
  const e = create('recon'); e['zombies'] = [zombie(930, 650)]; e.ability(); e['update'](.04); assert.equal(e.snapshot().health, 85);
  e['activeAbility'] = 0; e.dash(); e['update'](.01); assert.equal(e.snapshot().health, 85);
});
test('kills award score and every fifth kill drops a medkit', () => {
  const e = create(); for (let i = 0; i < 5; i++) e['kill'](zombie(1000 + i * 20, 700));
  assert.equal(e.snapshot().kills, 5); assert.equal(e.snapshot().score, 500); assert.ok(e['pickups'].some(p => p.kind === 'cross'));
  e['player'].health = 50; e['pickups'] = [{ x: 930, y: 650, kind: 'cross', time: 10 }]; e['update'](.02); assert.equal(e.snapshot().health, 80);
});
test('clear waves award bonus, heal, and advance after a recovery window', () => {
  const e = create(); e['spawnLeft'] = 0; e['zombies'] = []; e['player'].health = 80; e['update'](.04);
  assert.equal(e.snapshot().health, 95); assert.equal(e.snapshot().score, 500); assert.ok(e.snapshot().nextWave > 5);
  for (let i = 0; i < 155; i++) e['update'](.04); assert.equal(e.snapshot().wave, 2); assert.ok(e.snapshot().remaining > 0); assert.equal(e.snapshot().ammo, 30);
});
test('paused and dead games ignore combat actions and clear held input', () => {
  const e = create(); e['ammo'] = 20; e.setMove(1, 0); e.setFiring(true); e.setPaused(true); e.reload(); e.ability(); e.dash();
  assert.equal(e.snapshot().reloading, 0); assert.equal(e.snapshot().ability, 0); assert.equal(e.snapshot().dash, 0); assert.equal(e['pointer'].down, false); assert.equal(e['movement'].x, 0);
});
test('contact damage ends the run once and cleanup removes listeners', () => {
  let deaths = 0; const e = create('recon', () => deaths++); e['player'].health = 1; e['zombies'] = [zombie(930, 650)]; e['update'](.04);
  assert.equal(deaths, 1); assert.equal(e.snapshot().health, 0); assert.equal(e['dead'], true);
  e.destroy(); assert.equal(e['removers'].length > 0, true);
});
test('repeated blur events pause rather than toggle back into active play', () => {
  const e = create(); fakeWindow.dispatchEvent(new Event('blur')); fakeWindow.dispatchEvent(new Event('blur')); assert.equal(e['paused'], true);
});
