import type { Difficulty, DungeonRoom, Fraction } from './game';

export interface CoopPlayer {
  id: string;
  name: string;
  ready: boolean;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  potions: number;
  defense: { prompt: string; options: string[]; deadline: number } | null;
}

export interface LobbyState {
  code: string;
  hostId: string;
  difficulty: Difficulty;
  status: 'waiting' | 'playing' | 'victory' | 'gameover';
  players: CoopPlayer[];
  room: DungeonRoom;
  notice: string;
  revision: number;
}

export type ClientMessage =
  | { type: 'create'; name: string; difficulty: Difficulty }
  | { type: 'join'; name: string; code: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'start' }
  | { type: 'move'; x: number; z: number }
  | { type: 'cast'; enemyId: string; cardIds: string[] }
  | { type: 'defend'; answer: number }
  | { type: 'heal' }
  | { type: 'revive'; playerId: string }
  | { type: 'ascend' }
  | { type: 'leave' };

export type ServerMessage =
  | { type: 'hello'; playerId: string }
  | { type: 'state'; lobby: LobbyState }
  | { type: 'error'; message: string }
  | { type: 'left' };

export interface DefenseAnswer {
  answer: Fraction;
  power: number;
}
