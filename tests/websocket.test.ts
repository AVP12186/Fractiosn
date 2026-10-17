import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/index';
import type { LobbyState, ServerMessage } from '../src/types/multiplayer';

function connect(url: string) {
  const socket = new WebSocket(url);
  const messages: ServerMessage[] = [];
  const listeners = new Set<() => void>();
  socket.on('message', (raw) => { messages.push(JSON.parse(raw.toString())); listeners.forEach((notify) => notify()); });
  const next = (predicate: (message: ServerMessage) => boolean): Promise<ServerMessage> => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { listeners.delete(check); reject(new Error('Timed out waiting for WebSocket message')); }, 4000);
    const check = () => {
      const index = messages.findIndex(predicate);
      if (index >= 0) { clearTimeout(timer); listeners.delete(check); resolve(messages.splice(index, 1)[0]); }
    };
    listeners.add(check); check();
  });
  return { socket, next, send: (value: unknown) => socket.send(JSON.stringify(value)),
    state: async (predicate: (lobby: LobbyState) => boolean) => {
      const message = await next((m) => m.type === 'state' && predicate(m.lobby));
      return (message as Extract<ServerMessage, { type: 'state' }>).lobby;
    } };
}

test('real WebSocket clients create/join, ready/start, share combat and movement, and transfer host on disconnect', async (t) => {
  const service = await createGameServer({ assets: false, production: true });
  await new Promise<void>((resolve) => service.server.listen(0, '127.0.0.1', resolve));
  t.after(() => service.close());
  const address = service.server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `ws://127.0.0.1:${address.port}/coop`;
  const a = connect(url), b = connect(url), c = connect(url);
  t.after(() => { a.socket.terminate(); b.socket.terminate(); c.socket.terminate(); });
  const helloA = await a.next((m) => m.type === 'hello');
  const helloB = await b.next((m) => m.type === 'hello');
  await c.next((m) => m.type === 'hello');
  assert.ok(helloA.type === 'hello' && helloB.type === 'hello');
  a.send({ type: 'create', name: 'Host', difficulty: 'apprentice' });
  const waiting = await a.state((l) => l.players.length === 1);
  a.send({ type: 'ready', ready: true }); a.send({ type: 'start' });
  await a.next((m) => m.type === 'error' && m.message.includes('2 players'));
  b.send({ type: 'join', name: 'Friend', code: waiting.code });
  await b.state((l) => l.players.length === 2);
  b.send({ type: 'ready', ready: true });
  await a.state((l) => l.players.length === 2 && l.players.every((p) => p.ready));
  a.send({ type: 'start' });
  const playing = await b.state((l) => l.status === 'playing');
  const enemy = playing.room.enemies[0];
  a.send({ type: 'cast', enemyId: enemy.id, cardIds: ['c1'] });
  await b.state((l) => l.room.enemies[0].shield === null);
  b.send({ type: 'cast', enemyId: enemy.id, cardIds: ['c1'] });
  await a.state((l) => l.room.enemies[0].hp === enemy.hp - 2);
  b.send({ type: 'move', x: 3, z: 5 });
  await a.state((l) => l.players.find((p) => p.id === helloB.playerId)!.z < 6);
  c.send({ type: 'join', name: 'Late', code: waiting.code });
  await c.next((m) => m.type === 'error' && m.message.includes('started'));
  c.socket.send('{invalid json');
  await c.next((m) => m.type === 'error' && m.message === 'Invalid JSON.');
  c.send({ type: 'create', name: 'Other party', difficulty: 'grandmaster' });
  const other = await c.state((l) => l.status === 'waiting');
  assert.notEqual(other.code, waiting.code);
  a.socket.close();
  await b.state((l) => l.hostId === helloB.playerId && l.players.length === 1);
  b.send({ type: 'leave' }); await b.next((m) => m.type === 'left');
  c.send({ type: 'leave' }); await c.next((m) => m.type === 'left');
  assert.equal(service.game.lobbies.size, 0);
});
