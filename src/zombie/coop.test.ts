import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { Peer } from 'peerjs';
import { CoopWorld } from './coop-world';
import { cleanName, Control, idleControl, makeCode, Member, readControl, readFrame, validCode } from './coop-model';
import { levelCaches, levelInfo } from './campaign';
import { CLASSES, ClassId } from './classes';
import { CoopSession } from './coop-session';

const members = (ids: ClassId[] = ['assault', 'medic']): Member[] => ids.map((classId, i) => ({ id: `player-${i}`, name: `Survivor ${i + 1}`, classId, ready: true }));
function world(ids?: ClassId[]) { const w = new CoopWorld(members(ids)); w.state.players.forEach(p => w.storyReady(p.id)); return w; }
function act(w: CoopWorld, i: number, actions: Control['actions']) { const p = w.state.players[i]; w.input(p.id, { ...idleControl(), seq: w.state.tick + 1, actions }); w.tick(.02); }
function ticks(w: CoopWorld, time: number) { for (let t = 0; t < time; t += .04) w.tick(.04); }
function place(p: { x: number; y: number }, point: { x: number; y: number }) { p.x = point.x; p.y = point.y; }

test('room codes use cryptographic random ten-character invite frequencies', () => {
  const codes = Array.from({ length: 100 }, makeCode);
  assert.equal(new Set(codes).size, 100); assert.ok(codes.every(validCode));
  assert.equal(validCode('ABC'), false); assert.equal(validCode('AAAAAAAAA0'), false);
  assert.equal(cleanName('<Avi>\n\t'), 'Avi'); assert.equal(cleanName(''), 'Survivor');
});
test('controls reject malformed, nonfinite and excessive commands', () => {
  assert.ok(readControl(idleControl()));
  for (const v of [null, {}, { ...idleControl(), x: NaN }, { ...idleControl(), x: 2 }, { ...idleControl(), aim: Infinity }, { ...idleControl(), seq: 1.5 }, { ...idleControl(), actions: Array(6).fill('heal') }, { ...idleControl(), actions: ['teleport'] }]) assert.equal(readControl(v), null);
  assert.deepEqual(readControl({ ...idleControl(), actions: ['heal', 'heal'] })?.actions, ['heal']);
});
test('all survivors finish the shared story before the world starts', () => {
  const w = new CoopWorld(members());
  w.storyReady('stranger'); assert.equal(w.state.sceneReady.length, 0);
  w.storyReady('player-0'); w.storyReady('player-0'); assert.equal(w.state.phase, 'story');
  w.tick(.05); assert.equal(w.state.time, 0);
  w.storyReady('player-1'); assert.equal(w.state.phase, 'playing');
  assert.ok(readFrame(JSON.parse(JSON.stringify(w.state))));
});
test('separate host-authoritative survivors move independently and expire lost inputs', () => {
  const w = world(), [a, b] = w.state.players, startA = { ...a }, startB = { ...b };
  w.input(a.id, { ...idleControl(), seq: 1, y: -1 }); w.input(b.id, { ...idleControl(), seq: 1, x: 1 });
  w.tick(.04); assert.ok(a.y < startA.y); assert.equal(a.x, startA.x); assert.equal(b.y, startB.y); assert.ok(b.x > startB.x);
  w.input(a.id, { ...idleControl(), seq: 0, y: 1 }); w.tick(.04); assert.ok(a.y < startA.y);
  ticks(w, 1); const stopped = a.y; ticks(w, .3); assert.equal(a.y, stopped);
  w.input('outsider', { ...idleControl(), seq: 100, x: 1 }); assert.equal(w.state.players.length, 2);
});
test('squad guns damage one shared infected world without friendly fire', () => {
  const w = world(), [p, friend] = w.state.players;
  w.state.zombies = [{ id: 900, x: p.x + 110, y: p.y, hp: 1, maxHp: 64, speed: 0, attack: 0, angle: 0, boss: false, kind: 'zombie' }];
  w.input(p.id, { ...idleControl(), seq: 1, fire: true, aim: 0 });
  ticks(w, .2); assert.equal(p.kills, 1); assert.ok(p.ammo < 30); assert.equal(friend.health, friend.maxHealth); assert.equal(w.state.zombies.length, 0);
});
test('supply cases give all squad members equipment exactly once', () => {
  const w = world(), cache = levelCaches(0)[0]; Object.assign(w.state.players[0], { x: cache.x, y: cache.y });
  act(w, 0, ['interact']); assert.equal(w.state.opened.length, 1);
  for (const p of w.state.players) { assert.equal(p.medkits, 4); assert.ok(Object.values(p.equipment).some(Boolean)); }
  act(w, 0, ['interact']); assert.equal(w.state.opened.length, 1); assert.equal(w.state.players[1].medkits, 4);
  assert.ok(readFrame(JSON.parse(JSON.stringify(w.state))));
});
test('downed survivors need a nearby living teammate and one medkit to revive', () => {
  const w = world(), [a, b] = w.state.players; b.health = 0; b.x = a.x; b.y = a.y;
  a.medkits = 0; act(w, 0, ['interact']); assert.equal(b.health, 0);
  a.medkits = 2; b.x += 200; act(w, 0, ['interact']); assert.equal(b.health, 0);
  b.x = a.x; act(w, 0, ['interact']); assert.equal(a.medkits, 1); assert.equal(b.health, Math.ceil(b.maxHealth / 2)); assert.ok(b.hurt > 0);
});
test('receiver defense is shared, needs proximity, and checkpoint retry restores squad loot', () => {
  const w = world(), [a, b] = w.state.players, cache = levelCaches(0)[0];
  Object.assign(a, { x: cache.x, y: cache.y }); act(w, 0, ['interact']); const gear = structuredClone(a.equipment);
  place(a, levelInfo(0).objectives[0]); a.hurt = 100;
  act(w, 0, ['interact']); assert.ok(w.state.searching);
  a.y += 300; w.tick(.04); assert.equal(w.state.searching, false); assert.equal(w.state.step, 0);
  place(b, levelInfo(0).objectives[0]); b.hurt = 100; act(w, 1, ['interact']);
  for (let i = 0; i < 451; i++) { w.state.zombies = []; w.tick(.04); }
  assert.equal(w.state.step, 1); assert.equal(w.state.searching, false);
  a.medkits = 0; a.equipment = { weapon: null, vest: null, boots: null, charm: null }; a.health = 0; b.health = 0;
  w.tick(.02); assert.equal(w.state.phase, 'defeat'); w.retry(); assert.equal(w.state.phase, 'playing'); assert.equal(w.state.step, 1);
  assert.deepEqual(w.state.players[0].equipment, gear); assert.equal(w.state.players[0].medkits, 4); assert.ok(w.state.players.every(p => p.health === p.maxHealth)); assert.equal(w.state.opened.length, 1);
});
test('all ten co-op abilities retain cooldowns and class-specific effects', () => {
  for (const c of CLASSES) {
    const w = world([c.id, 'medic']), [a, b] = w.state.players; a.health = Math.min(50, a.maxHealth); b.health = 20;
    act(w, 0, ['ability']); assert.ok(a.active > 0); assert.ok(a.ability > 0); const cooldown = a.ability;
    act(w, 0, ['ability']); assert.ok(a.ability < cooldown);
    if (c.id === 'medic') { assert.equal(b.health, 75); assert.equal(a.health, 100); }
    if (c.id === 'engineer') assert.equal(w.state.turrets.length, 1);
    if (c.id === 'gunslinger') assert.equal(w.state.bullets.length, 6);
    if (c.id === 'scavenger') assert.equal(a.health, 80);
    assert.ok(readFrame(JSON.parse(JSON.stringify(w.state))), `${c.id}: protocol roundtrip`);
  }
});
test('four-player live frames stay serializable and within protocol limits during combat', () => {
  const w = world(['engineer', 'gunslinger', 'cryo', 'medic']);
  for (let i = 0; i < 800; i++) {
    for (const p of w.state.players) w.input(p.id, { ...idleControl(), seq: i + 1, fire: true, autoAim: true, y: -.4, actions: i === 0 ? ['ability'] : [] });
    w.tick(.04);
    if (i % 20 === 0) assert.ok(readFrame(JSON.parse(JSON.stringify(w.state))), `Frame ${i} rejected`);
  }
  assert.ok(w.state.players.every(p => p.x >= 38 && p.y >= levelInfo(0).top));
  assert.ok(JSON.stringify(w.state).length < 160000);
});
test('north gates require all standing survivors and synchronize all 100 story transitions', () => {
  const w = world(), [a, b] = w.state.players;
  w.state.step = 3; Object.assign(a, levelInfo(0).exit); act(w, 0, ['interact']); assert.equal(w.state.phase, 'playing');
  for (let level = 0; level < 100; level++) {
    w.state.step = 3; w.state.players.forEach(p => Object.assign(p, levelInfo(level).exit));
    act(w, 0, ['interact']); assert.equal(w.state.phase, 'story'); assert.equal(w.state.scene, level + 1);
    w.storyReady(a.id); assert.equal(w.state.phase, 'story'); w.storyReady(b.id);
    assert.equal(w.state.phase, level === 99 ? 'victory' : 'playing');
    assert.equal(w.state.level, Math.min(99, level + 1)); assert.ok(readFrame(JSON.parse(JSON.stringify(w.state))));
  }
});
test('host pause stops shared simulation and clears held commands', () => {
  const w = world(), p = w.state.players[0]; w.input(p.id, { ...idleControl(), seq: 1, fire: true, y: -1 });
  const before = { x: p.x, y: p.y }; w.setPaused(true); ticks(w, 1); assert.equal(w.state.time, 0); assert.equal(p.ammo, 30);
  w.setPaused(false); w.tick(.04); assert.equal(p.y, before.y); assert.equal(p.x, before.x);
});
test('disconnecting a survivor removes their shots, frees story barrier and cannot resurrect on retry', () => {
  const w = new CoopWorld(members()); w.storyReady('player-0'); w.remove('player-1'); assert.equal(w.state.phase, 'playing');
  w.state.players[0].health = 0; w.tick(.02); w.retry(); assert.equal(w.state.players.length, 1);
});
test('malformed host snapshots cannot reach the renderer', () => {
  const s = world().state;
  for (const patch of [{ version: 2 }, { level: 100 }, { phase: 'elsewhere' }, { players: [] }, { step: 4 }, { search: NaN }, { zombies: Array(81).fill({}) }, { opened: [123] }, { players: [{ ...s.players[0], classId: 'evil' }] }, { players: [{ ...s.players[0], x: Infinity }] }, { players: [{ ...s.players[0], equipment: {} }] }]) assert.equal(readFrame({ ...s, ...patch }), null);
});

class Channel extends EventEmitter {
  open = false;
  dataChannel = { bufferedAmount: 0 };
  other!: Channel;
  constructor(public peer: string) { super(); }
  send(message: unknown) { if (this.open) queueMicrotask(() => { if (this.other.open) this.other.emit('data', structuredClone(message)); }); }
  close() { if (!this.open) return; this.open = false; this.emit('close'); if (this.other.open) { this.other.open = false; this.other.emit('close'); } }
}
class Broker {
  peers = new Map<string, FakePeer>();
  serial = 0;
  create = (id = `guest-${++this.serial}`) => new FakePeer(id, this) as unknown as Peer;
}
class FakePeer extends EventEmitter {
  destroyed = false;
  channels: Channel[] = [];
  constructor(public id: string, private broker: Broker) { super(); broker.peers.set(id, this); queueMicrotask(() => { if (!this.destroyed) this.emit('open', id); }); }
  connect(id: string) {
    const local = new Channel(id), remote = new Channel(this.id), destination = this.broker.peers.get(id);
    local.other = remote; remote.other = local; this.channels.push(local); destination?.channels.push(remote);
    queueMicrotask(() => {
      if (!destination || destination.destroyed) { this.emit('error', { type: 'peer-unavailable' }); return; }
      destination.emit('connection', remote); local.open = remote.open = true; remote.emit('open'); local.emit('open');
    });
    return local;
  }
  reconnect() {}
  destroy() { this.destroyed = true; this.broker.peers.delete(this.id); this.channels.forEach(c => c.close()); }
}
const sessions: CoopSession[] = [];
Object.assign(globalThis, { window: { setTimeout, setInterval } });
afterEach(() => sessions.splice(0).forEach(s => s.destroy()));
const settle = () => new Promise<void>(resolve => setImmediate(resolve));
async function room(broker: Broker, host: boolean, code = 'ABCDEFGHJK') { const s = new CoopSession(host, host ? 'Host' : 'Friend', 'assault', code, broker.create); sessions.push(s); await settle(); return s; }

test('two real session instances negotiate lobby membership, readiness and one authority', async () => {
  const broker = new Broker(), host = await room(broker, true), guest = await room(broker, false);
  assert.equal(host.view.status, 'lobby'); assert.equal(guest.view.members.length, 2);
  host.start(); assert.equal(host.view.status, 'lobby'); guest.select('medic', true); await settle();
  assert.equal(host.view.members[1].ready, false); guest.select('medic', true); await settle(); host.start(); await settle();
  assert.equal(guest.view.status, 'game'); assert.equal(guest.view.frame?.phase, 'story');
  host.storyReady(); guest.storyReady(); await settle(); host.advance(.04); host.publish(); await settle();
  assert.equal(guest.view.frame?.phase, 'playing');
  const before = guest.view.frame!.players[1].y;
  guest.control({ ...idleControl(), seq: 1, y: -1 }); await settle(); host.advance(.04); host.publish(); await settle();
  assert.ok(guest.view.frame!.players[1].y < before); assert.deepEqual(guest.view.frame, host.view.frame);
  guest.pause(true); assert.equal(host.view.frame?.paused, false);
  host.pause(true); await settle(); assert.equal(guest.view.frame?.paused, true);
  host.pause(false); await settle(); assert.equal(guest.view.frame?.paused, false);
});
test('lobby caps at four; deployment rejects late joiners and host departure closes guests', async () => {
  const broker = new Broker(), host = await room(broker, true);
  const guests = await Promise.all([room(broker, false), room(broker, false), room(broker, false)]); await settle();
  assert.equal(host.view.members.length, 4);
  const fifth = await room(broker, false); assert.equal(fifth.view.status, 'closed'); assert.match(fifth.view.error, /full/);
  for (const guest of guests) guest.select('assault', true); await settle(); host.start(); await settle();
  const late = await room(broker, false); assert.equal(late.view.status, 'closed'); assert.match(late.view.error, /deployed/);
  host.destroy(); await settle(); assert.ok(guests.every(s => s.view.status === 'closed'));
});
test('guests stop controls on stale frames but allow an intentionally paused host', async t => {
  let now = 1000; t.mock.method(performance, 'now', () => now);
  const broker = new Broker(), host = await room(broker, true), guest = await room(broker, false);
  guest.select('assault', true); await settle(); host.start(); await settle();
  assert.equal(guest.stale, false); now += 4000; assert.equal(guest.stale, true);
  host.pause(true); await settle(); now += 10000; assert.equal(guest.stale, false);
  host.pause(false); await settle(); assert.equal(guest.stale, false);
});
test('missing lobbies fail with useful errors and departing guests free lobby slots', async () => {
  const broker = new Broker(), missing = await room(broker, false); assert.equal(missing.view.status, 'closed'); assert.match(missing.view.error, /not found/);
  const host = await room(broker, true), guest = await room(broker, false); guest.destroy(); await settle(); assert.equal(host.view.members.length, 1);
  const replacement = await room(broker, false); assert.equal(replacement.view.members.length, 2);
});
