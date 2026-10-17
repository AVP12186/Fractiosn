import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoopGame } from '../server/game';
import { getCardsForDifficulty } from '../src/data/dungeonLevels';
import { addFractions, areFractionsEqual, fractionToString } from '../src/types/game';
import type { LobbyState } from '../src/types/multiplayer';

function setup() {
  let time = 100000;
  let updates = 0;
  const game = new CoopGame(() => { updates++; }, () => time);
  game.handle('a', { type: 'create', name: 'Avi', difficulty: 'grandmaster' });
  const lobby = [...game.lobbies.values()][0];
  game.handle('b', { type: 'join', name: 'Bea', code: lobby.code.toLowerCase() });
  const start = () => {
    game.handle('a', { type: 'ready', ready: true }); game.handle('b', { type: 'ready', ready: true }); game.handle('a', { type: 'start' });
  };
  return { game, lobby, start, advance: (ms = 800) => { time += ms; }, updates: () => updates };
}

function cardsFor(lobby: LobbyState) {
  const shield = lobby.room.enemies[0].shield;
  const cards = getCardsForDifficulty(lobby.difficulty);
  if (!shield) return [cards[0].id, cards[0].id];
  for (const a of cards) {
    if (areFractionsEqual(a.fraction, shield)) return [a.id];
    for (const b of cards) if (areFractionsEqual(addFractions(a.fraction, b.fraction), shield)) return [a.id, b.id];
  }
  throw new Error('No shield solution');
}

test('lobbies enforce capacity, host-only start, minimum players and ready checks', () => {
  const { game, lobby, start } = setup();
  assert.throws(() => game.handle('b', { type: 'start' }), /host/);
  assert.throws(() => game.handle('a', { type: 'start' }), /ready/);
  game.handle('c', { type: 'join', code: lobby.code, name: 'C' });
  game.handle('d', { type: 'join', code: lobby.code, name: 'D' });
  assert.throws(() => game.handle('e', { type: 'join', code: lobby.code, name: 'E' }), /full/);
  assert.throws(() => game.handle('a', { type: 'create', name: 'Again', difficulty: 'apprentice' }), /Leave/);
  game.leave('c'); game.leave('d'); start();
  assert.equal(lobby.status, 'playing');
  assert.throws(() => game.handle('e', { type: 'join', code: lobby.code, name: 'E' }), /started/);
  game.leave('a'); assert.equal(lobby.hostId, 'b');
  game.leave('b'); assert.equal(game.lobbies.size, 0);
});

test('server validates input, isolates lobbies, clamps moves, and rejects fabricated spell damage', () => {
  const { game, lobby, start, advance } = setup(); start();
  for (const message of [null, [], {}, { type: 'move', x: 'NaN', z: 0 }, { type: 'cast', enemyId: lobby.room.enemies[0].id, cardIds: ['forged'] }, { type: 'cast', enemyId: lobby.room.enemies[0].id, cardIds: ['c1', 'c1', 'c1'] }]) assert.throws(() => game.handle('a', message));
  assert.throws(() => game.handle('outsider', { type: 'cast' }), /join/);
  const a = lobby.players[0], before = { x: a.x, z: a.z };
  advance(100); game.handle('a', { type: 'move', x: 100000, z: -100000 });
  assert.ok(Math.hypot(a.x - before.x, a.z - before.z) <= 1.000001);
  game.handle('c', { type: 'create', name: 'C', difficulty: 'apprentice' });
  const other = game.members.get('c')!.lobby;
  assert.notEqual(other.code, lobby.code);
  assert.equal(other.status, 'waiting');
  assert.throws(() => game.handle('c', { type: 'ascend' }), /running/);
  assert.equal(lobby.room.floor, 1);
});

test('two teammates share shield breaks, HP, kills and simultaneous attacks; casts have cooldowns', () => {
  const { game, lobby, start, advance } = setup(); start();
  const enemy = lobby.room.enemies[0];
  game.handle('a', { type: 'cast', enemyId: enemy.id, cardIds: cardsFor(lobby) });
  assert.equal(enemy.shield, null);
  const hp = enemy.hp;
  game.handle('b', { type: 'cast', enemyId: enemy.id, cardIds: ['c1'] });
  assert.equal(enemy.hp, hp - 2);
  assert.throws(() => game.handle('b', { type: 'cast', enemyId: enemy.id, cardIds: ['c1'] }), /recharging/);
  while (lobby.room.enemies.some((e) => e.id === enemy.id)) {
    advance(); game.handle('a', { type: 'cast', enemyId: enemy.id, cardIds: ['c1', 'c1'] });
  }
  assert.throws(() => { advance(); game.handle('b', { type: 'cast', enemyId: enemy.id, cardIds: ['c1'] }); }, /defeated/);
});

test('server-generated defense questions block damage, time out, and enable nearby revives', () => {
  const { game, lobby, start, advance } = setup(); start();
  const a = lobby.players[0], b = lobby.players[1];
  lobby.room.enemies.forEach((e) => { e.x = a.x; e.z = a.z; });
  advance(20000); game.tick();
  assert.ok(a.defense);
  const answer = fractionToString(game.members.get('a')!.defense!.answer);
  game.handle('a', { type: 'defend', answer: a.defense!.options.indexOf(answer) });
  assert.equal(a.hp, 30);
  advance(20000); game.tick(); assert.ok(a.defense);
  advance(12001); game.tick(); assert.ok(a.hp < 30);
  a.hp = 0; a.defense = null; game.members.get('a')!.defense = null;
  assert.throws(() => game.handle('a', { type: 'cast', enemyId: 'x', cardIds: ['c1'] }), /down/);
  b.x = a.x + 10;
  assert.throws(() => game.handle('b', { type: 'revive', playerId: 'a' }), /within/);
  b.x = a.x; b.z = a.z;
  game.handle('b', { type: 'revive', playerId: 'a' }); assert.equal(a.hp, 10); assert.equal(b.potions, 1);
  game.handle('a', { type: 'heal' }); assert.equal(a.hp, 18); assert.equal(a.potions, 1);
  a.hp = 0; b.hp = 0; game.tick(); assert.equal(lobby.status, 'gameover');
});

test('co-op party can complete all 21 floors and Grandmaster boss phases without a progression softlock', () => {
  const { game, lobby, start, advance } = setup(); start();
  for (let floor = 1; floor <= 21; floor++) {
    assert.equal(lobby.room.floor, floor);
    let turns = 0;
    while (lobby.room.enemies.length) {
      assert.ok(++turns < 100);
      const enemy = lobby.room.enemies[0];
      const id = turns % 2 ? 'a' : 'b';
      const player = game.members.get(id)!.player;
      player.x = enemy.x; player.z = enemy.z;
      advance(); game.handle(id, { type: 'cast', enemyId: enemy.id, cardIds: cardsFor(lobby) });
    }
    if (floor < 21) {
      assert.ok(lobby.room.cleared && lobby.room.stairs?.active);
      assert.throws(() => game.handle('b', { type: 'ascend' }), /host/);
      lobby.players[0].hp = 0;
      game.handle('a', { type: 'ascend' });
      assert.ok(lobby.players[0].hp > 0);
    }
  }
  assert.equal(lobby.status, 'victory');
});
