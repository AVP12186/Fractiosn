import { randomInt } from 'node:crypto';
import { FINAL_FLOOR, generateRoom, getCardsForDifficulty, getStageDifficulty } from '../src/data/dungeonLevels';
import { addFractions, areFractionsEqual, damageEnemy, fractionToString, type Difficulty } from '../src/types/game';
import type { ClientMessage, CoopPlayer, DefenseAnswer, LobbyState } from '../src/types/multiplayer';

interface Member {
  lobby: LobbyState;
  player: CoopPlayer;
  lastCast: number;
  lastMove: number;
  defense: DefenseAnswer | null;
}

const difficulties: Difficulty[] = ['apprentice', 'journeyman', 'grandmaster'];
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class CoopGame {
  readonly lobbies = new Map<string, LobbyState>();
  readonly members = new Map<string, Member>();

  constructor(private publish: (lobby: LobbyState) => void, private now = Date.now) {}

  private name(value: unknown): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 20) throw new Error('Use a name of 1–20 characters.');
    return value.trim();
  }

  private changed(lobby: LobbyState) {
    lobby.revision++;
    this.publish(lobby);
  }

  private add(id: string, name: string, lobby: LobbyState) {
    const player: CoopPlayer = { id, name, ready: false, x: lobby.players.length * 2 - 1, z: 6,
      hp: 30, maxHp: 30, potions: 2, defense: null };
    lobby.players.push(player);
    this.members.set(id, { lobby, player, lastCast: -Infinity, lastMove: this.now(), defense: null });
    this.changed(lobby);
  }

  leave(id: string) {
    const member = this.members.get(id);
    if (!member) return;
    this.members.delete(id);
    const lobby = member.lobby;
    lobby.players = lobby.players.filter((player) => player.id !== id);
    if (!lobby.players.length) this.lobbies.delete(lobby.code);
    else {
      if (lobby.hostId === id) lobby.hostId = lobby.players[0].id;
      lobby.notice = `${member.player.name} left. Host: ${lobby.players.find((p) => p.id === lobby.hostId)!.name}.`;
      this.checkParty(lobby);
      this.changed(lobby);
    }
  }

  handle(id: string, data: unknown) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid message.');
    const message = data as ClientMessage;
    if (message.type === 'leave') { this.leave(id); return; }
    if (message.type === 'create' || message.type === 'join') {
      if (this.members.has(id)) throw new Error('Leave your current lobby first.');
      const name = this.name(message.name);
      if (message.type === 'create') {
        if (!difficulties.includes(message.difficulty)) throw new Error('Invalid difficulty.');
        if (this.lobbies.size >= 100) throw new Error('Server is full. Please try again later.');
        let code: string;
        do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); } while (this.lobbies.has(code));
        const lobby: LobbyState = { code, hostId: id, difficulty: message.difficulty, status: 'waiting',
          players: [], room: generateRoom(1, message.difficulty), notice: 'Ready up! The host can start with 2–4 players.', revision: 0 };
        this.lobbies.set(code, lobby);
        this.add(id, name, lobby);
      } else {
        if (typeof message.code !== 'string') throw new Error('Invalid lobby code.');
        const lobby = this.lobbies.get(message.code.trim().toUpperCase());
        if (!lobby) throw new Error('Lobby not found. Check the code.');
        if (lobby.status !== 'waiting') throw new Error('This game has already started.');
        if (lobby.players.length >= 4) throw new Error('Lobby is full (4 players).');
        this.add(id, name, lobby);
      }
      return;
    }

    const member = this.members.get(id);
    if (!member) throw new Error('Create or join a lobby first.');
    const { lobby, player } = member;
    if (message.type === 'ready') {
      if (lobby.status !== 'waiting' || typeof message.ready !== 'boolean') throw new Error('Cannot change ready status now.');
      player.ready = message.ready;
    } else if (message.type === 'start') {
      if (id !== lobby.hostId) throw new Error('Only the host can start.');
      if (lobby.status !== 'waiting' || lobby.players.length < 2 || !lobby.players.every((p) => p.ready)) throw new Error('At least 2 players must be present and everyone must be ready.');
      lobby.status = 'playing';
      lobby.notice = 'Work together! Match barriers, then cast to damage monsters.';
      lobby.room.enemies.forEach((enemy) => { enemy.lastAttackTime = this.now(); });
    } else {
      if (lobby.status !== 'playing') throw new Error('The game is not running.');
      if (player.hp <= 0 && message.type !== 'ascend') throw new Error('You are down! A teammate can revive you.');
      if (message.type === 'move') {
        if (!Number.isFinite(message.x) || !Number.isFinite(message.z)) throw new Error('Invalid position.');
        const elapsed = Math.min(0.25, Math.max(0, (this.now() - member.lastMove) / 1000));
        const maxDistance = 10 * elapsed;
        const dx = message.x - player.x, dz = message.z - player.z;
        const ratio = Math.min(1, maxDistance / (Math.hypot(dx, dz) || 1));
        player.x = Math.max(-lobby.room.width / 2 + 1.2, Math.min(lobby.room.width / 2 - 1.2, player.x + dx * ratio));
        player.z = Math.max(-lobby.room.height / 2 + 1.2, Math.min(lobby.room.height / 2 - 1.2, player.z + dz * ratio));
        member.lastMove = this.now();
        return;
      } else if (message.type === 'cast') {
        if (player.defense) throw new Error('Answer the incoming attack first.');
        if (this.now() - member.lastCast < 750) throw new Error('Spell recharging.');
        if (!Array.isArray(message.cardIds) || message.cardIds.length < 1 || message.cardIds.length > 2) throw new Error('Select 1 or 2 cards.');
        const deck = getCardsForDifficulty(lobby.difficulty);
        const cards = message.cardIds.map((cardId) => deck.find((card) => card.id === cardId));
        if (cards.some((card) => !card)) throw new Error('Unknown spell card.');
        const enemy = lobby.room.enemies.find((enemy) => enemy.id === message.enemyId);
        if (!enemy) throw new Error('That monster is already defeated.');
        if (Math.hypot(player.x - enemy.x, player.z - enemy.z) > 16) throw new Error('Move closer to the monster.');
        member.lastCast = this.now();
        const fraction = cards.reduce((sum, card) => addFractions(sum, card!.fraction), { n: 0, d: 1 });
        if (enemy.shield) {
          if (areFractionsEqual(fraction, enemy.shield)) {
            enemy.shield = null;
            lobby.notice = `${player.name} shattered ${enemy.name}'s barrier with ${fractionToString(fraction)}!`;
          } else lobby.notice = `${player.name}: ${fractionToString(fraction)} does not match ${fractionToString(enemy.shield)}. Try another sum!`;
        } else {
          const updated = damageEnemy(enemy, cards.length === 2 ? 3 : 2);
          Object.assign(enemy, updated);
          lobby.notice = `${player.name} hit ${enemy.name}!${enemy.hp === 0 ? ' Monster defeated!' : enemy.shield ? ' A new boss barrier appeared!' : ''}`;
          lobby.room.enemies = lobby.room.enemies.filter((enemy) => enemy.hp > 0);
          if (!lobby.room.enemies.length) {
            lobby.room.cleared = true;
            if (lobby.room.stairs) lobby.room.stairs.active = true;
            if (lobby.room.floor === FINAL_FLOOR) lobby.status = 'victory';
            lobby.players.forEach((p) => { p.defense = null; this.members.get(p.id)!.defense = null; });
            lobby.notice = lobby.status === 'victory' ? 'The tower is restored! Your team wins!' : 'Room cleared! The host can lead the team upstairs.';
          }
        }
      } else if (message.type === 'defend') {
        if (!player.defense || !member.defense || !Number.isInteger(message.answer) || !player.defense.options[message.answer]) throw new Error('No valid defense answer.');
        const correct = player.defense.deadline > this.now() && player.defense.options[message.answer] === fractionToString(member.defense.answer);
        player.hp = Math.max(0, player.hp - (correct ? 0 : member.defense.power));
        player.defense = null;
        member.defense = null;
        lobby.notice = correct ? `${player.name} blocked the attack!` : `${player.name} missed the block!`;
      } else if (message.type === 'heal' || message.type === 'revive') {
        if (player.potions <= 0) throw new Error('No potions left on this floor.');
        if (message.type === 'heal') {
          if (player.hp === player.maxHp) throw new Error('Health is already full.');
          player.hp = Math.min(player.maxHp, player.hp + 8);
          lobby.notice = `${player.name} healed 8 HP.`;
        } else {
          const teammate = lobby.players.find((p) => p.id === message.playerId && p.hp === 0);
          if (!teammate || Math.hypot(teammate.x - player.x, teammate.z - player.z) > 3) throw new Error('Stand within 3 steps of a downed teammate.');
          teammate.hp = 10;
          lobby.notice = `${player.name} revived ${teammate.name}!`;
        }
        player.potions--;
      } else if (message.type === 'ascend') {
        if (id !== lobby.hostId || !lobby.room.cleared || lobby.room.floor >= FINAL_FLOOR) throw new Error('Only the host can ascend after clearing the room.');
        lobby.room = generateRoom(lobby.room.floor + 1, lobby.difficulty);
        lobby.players.forEach((p, index) => {
          p.hp = Math.min(p.maxHp, Math.max(10, p.hp) + 8); p.potions = 2; p.x = index * 2 - 1; p.z = 6; p.defense = null;
          this.members.get(p.id)!.defense = null;
        });
        lobby.notice = `Floor ${lobby.room.floor}: difficulty ${getStageDifficulty(lobby.room.floor, lobby.difficulty)}/10.`;
      } else throw new Error('Unknown action.');
      this.checkParty(lobby);
    }
    this.changed(lobby);
  }

  private checkParty(lobby: LobbyState) {
    if (lobby.status === 'playing' && lobby.players.every((p) => p.hp <= 0)) {
      lobby.status = 'gameover'; lobby.notice = 'Your party has fallen. Leave and create a new lobby to try again.';
    }
  }

  tick(delta = 0.1) {
    const now = this.now();
    for (const lobby of this.lobbies.values()) {
      if (lobby.status !== 'playing') continue;
      for (const player of lobby.players) {
        const member = this.members.get(player.id)!;
        if (player.defense && player.defense.deadline <= now && member.defense) {
          player.hp = Math.max(0, player.hp - member.defense.power);
          player.defense = null; member.defense = null;
          lobby.notice = `${player.name} did not block in time!`;
        }
      }
      for (const enemy of lobby.room.enemies) {
        const target = lobby.players.filter((p) => p.hp > 0).sort((a, b) =>
          Math.hypot(a.x - enemy.x, a.z - enemy.z) - Math.hypot(b.x - enemy.x, b.z - enemy.z))[0];
        if (!target) break;
        const distance = Math.hypot(target.x - enemy.x, target.z - enemy.z);
        if (distance > 2) {
          const step = Math.min(distance - 2, enemy.speed * delta);
          enemy.x += (target.x - enemy.x) / distance * step;
          enemy.z += (target.z - enemy.z) / distance * step;
        }
        if (distance < 7 && now - enemy.lastAttackTime >= enemy.attackCooldown * 1000 && !target.defense) {
          const a = lobby.room.floor <= 3 ? { n: 1, d: 4 } : { n: 1, d: 3 };
          const b = lobby.room.floor <= 5 ? a : { n: 1, d: 6 };
          const answer = addFractions(a, b);
          const options = [fractionToString(answer), fractionToString({ n: answer.n + 1, d: answer.d }), fractionToString({ n: answer.n, d: answer.d * 2 })];
          const offset = randomInt(3);
          target.defense = { prompt: `${enemy.name}: ${fractionToString(a)} + ${fractionToString(b)} = ?`,
            options: [...options.slice(offset), ...options.slice(0, offset)], deadline: now + 12000 };
          this.members.get(target.id)!.defense = { answer, power: enemy.attackPower };
          enemy.lastAttackTime = now;
        }
      }
      this.checkParty(lobby);
      this.changed(lobby);
    }
  }
}
