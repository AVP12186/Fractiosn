import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterConfig, Difficulty } from '../types/game';
import { fractionToString } from '../types/game';
import type { ClientMessage, LobbyState, ServerMessage } from '../types/multiplayer';
import { getCardsForDifficulty, getStageDifficulty } from '../data/dungeonLevels';
import { DungeonView } from '../graphics/DungeonView';
import { CardDeckHUD } from './CardDeckHUD';
import { VirtualJoystick } from './VirtualJoystick';

const button = 'border-2 border-cyan-600 bg-cyan-950 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed';
const input = 'w-full border-2 border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-cyan-400 outline-none';

export function Multiplayer({ characterConfig, onBack }: { characterConfig: CharacterConfig; onBack: () => void }) {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [connection, setConnection] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('lobby') || '');
  const [difficulty, setDifficulty] = useState<Difficulty>('apprentice');
  const [targetId, setTargetId] = useState('');
  const [joystick, setJoystick] = useState({ vx: 0, vz: 0 });
  const [recharging, setRecharging] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const goal = useRef({ x: 0, z: 6 });
  const rechargeTimer = useRef<number>(0);
  const previousFloor = useRef(0);

  useEffect(() => {
    let disposed = false;
    setConnection('connecting'); setLobby(null); setError(''); previousFloor.current = 0;
    const url = new URL('/coop', window.location.href);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    socket.current = ws;
    ws.onmessage = (event) => {
      if (disposed) return;
      const message: ServerMessage = JSON.parse(event.data);
      if (message.type === 'hello') { setPlayerId(message.playerId); setConnection('connected'); }
      else if (message.type === 'state') setLobby(message.lobby);
      else if (message.type === 'error') setError(message.message);
      else if (message.type === 'left') { setLobby(null); previousFloor.current = 0; }
    };
    ws.onclose = () => { if (!disposed) { setConnection('disconnected'); setError('Connection lost. Return to the lobby screen to create or rejoin a waiting lobby.'); } };
    ws.onerror = () => { if (!disposed) setError('Cannot reach the co-op server. Run the game with npm run dev or npm start, not a static preview.'); };
    return () => { disposed = true; ws.close(); window.clearTimeout(rechargeTimer.current); };
  }, [attempt]);

  const send = useCallback((message: ClientMessage) => {
    if (socket.current?.readyState !== WebSocket.OPEN) { setError('Not connected to the co-op server.'); return; }
    setError(''); socket.current.send(JSON.stringify(message));
  }, []);
  const me = lobby?.players.find((player) => player.id === playerId);
  const floor = lobby?.room.floor || 0;
  useEffect(() => {
    if (me && floor !== previousFloor.current) {
      goal.current = { x: me.x, z: me.z }; previousFloor.current = floor;
    }
  }, [floor, me]);

  useEffect(() => {
    if (lobby?.status !== 'playing' || !me || me.hp <= 0) return;
    const timer = window.setInterval(() => send({ type: 'move', ...goal.current }), 100);
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const vectors: Record<string, [number, number]> = { w: [0, -1], ArrowUp: [0, -1], s: [0, 1], ArrowDown: [0, 1], a: [-1, 0], ArrowLeft: [-1, 0], d: [1, 0], ArrowRight: [1, 0] };
      const vector = vectors[event.key];
      if (vector) { event.preventDefault(); goal.current = { x: goal.current.x + vector[0], z: goal.current.z + vector[1] }; }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.clearInterval(timer); window.removeEventListener('keydown', keydown); };
  }, [lobby?.status, !!me, me?.hp === 0, send]);

  const leave = () => { send({ type: 'leave' }); setLobby(null); previousFloor.current = 0; };
  const target = lobby?.room.enemies.find((enemy) => enemy.id === targetId) || lobby?.room.enemies[0];
  const host = lobby?.hostId === playerId;

  return <div className="fixed inset-0 z-[60] bg-slate-950 text-slate-100 font-mono overflow-y-auto">
    <header className="relative z-30 flex items-center justify-between gap-2 border-b-2 border-cyan-800 bg-slate-950 p-3">
      <h1 className="font-pixel text-sm text-cyan-300">FRACTION TOWER · CO-OP</h1>
      <button className={button} onClick={onBack}>Back to solo</button>
    </header>
    {error && <div role="alert" className="relative z-40 bg-rose-950 border border-rose-500 p-3 text-sm text-rose-100">{error}</div>}
    {connection !== 'connected' ? <section className="max-w-lg mx-auto p-6 space-y-4">
      <h2 className="text-xl">{connection === 'connecting' ? 'Connecting to co-op…' : 'Disconnected'}</h2>
      <p>Co-op needs a live connection to the same game server. Your solo progress is separate.</p>
      {connection === 'disconnected' && <button className={button} onClick={() => setAttempt((n) => n + 1)}>Reconnect to lobby screen</button>}
    </section> : !lobby ? <section className="max-w-xl mx-auto p-5 sm:p-10 space-y-6">
      <div><h2 className="text-2xl text-amber-300 mb-2">Climb together</h2><p className="text-slate-400">2–4 players. Shared monsters, fraction barriers and boss fights, in real time. Share a lobby code with friends on this server.</p></div>
      <label className="block">Your name<input className={`${input} mt-2`} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Alchemist name" /></label>
      <form className="border-2 border-slate-700 p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); send({ type: 'create', name, difficulty }); }}>
        <h3 className="text-lg text-cyan-300">Create a lobby</h3>
        <label className="block">Difficulty<select className={`${input} mt-2`} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
          <option value="apprentice">Apprentice</option><option value="journeyman">Journeyman</option><option value="grandmaster">Grandmaster</option>
        </select></label>
        <p className="text-xs text-slate-400">All co-op runs start at floor 1. Stages 1–3: 3–4 · 4–5: 5–6 · 6+: 7–8.</p>
        <button className={button} disabled={!name.trim()}>Create lobby</button>
      </form>
      <form className="border-2 border-slate-700 p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); send({ type: 'join', name, code }); }}>
        <h3 className="text-lg text-amber-300">Join friends</h3>
        <label className="block">Lobby code<input className={`${input} mt-2 uppercase tracking-widest`} value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC234" /></label>
        <button className={button} disabled={!name.trim() || code.trim().length !== 6}>Join lobby</button>
      </form>
    </section> : lobby.status === 'waiting' ? <section className="max-w-xl mx-auto p-5 sm:p-10 space-y-5">
      <h2 className="text-2xl text-amber-300">Lobby <span className="tracking-widest select-text">{lobby.code}</span></h2>
      <p className="text-slate-400">{lobby.difficulty} · {lobby.players.length}/4 players · Share the code to invite friends.</p>
      <button className={button} onClick={() => { const url = new URL(window.location.href); url.searchParams.set('lobby', lobby.code); navigator.clipboard?.writeText(url.href).catch(() => setError('Copy the lobby code above to invite friends.')); }}>Copy invite link</button>
      <ul className="space-y-2">{lobby.players.map((player) => <li key={player.id} className="flex justify-between border-2 border-slate-700 bg-slate-900 p-3 gap-2"><span>{player.name}{player.id === playerId ? ' (you)' : ''}{player.id === lobby.hostId ? ' · HOST' : ''}</span><span className={player.ready ? 'text-emerald-300' : 'text-amber-300'}>{player.ready ? 'READY' : 'NOT READY'}</span></li>)}</ul>
      <p className="text-sm text-slate-400" role="status">{lobby.notice}</p>
      <div className="flex flex-wrap gap-3"><button className={button} onClick={() => send({ type: 'ready', ready: !me?.ready })}>{me?.ready ? 'Not ready' : 'Ready up'}</button>
        {host && <button className={button} disabled={lobby.players.length < 2 || !lobby.players.every((p) => p.ready)} onClick={() => send({ type: 'start' })}>Start co-op</button>}
        <button className={button} onClick={leave}>Leave lobby</button></div>
    </section> : lobby.status !== 'playing' ? <section className="max-w-xl mx-auto p-10 space-y-5 text-center">
      <h2 className="text-3xl text-amber-300">{lobby.status === 'victory' ? 'TEAM VICTORY!' : 'PARTY FALLEN'}</h2><p>{lobby.notice}</p><button className={button} onClick={leave}>Return to lobbies</button>
    </section> : me && <>
      <div className="absolute inset-0 pt-16">
        <DungeonView key={floor} playerPos={{ x: me.x, z: me.z }} onMovePlayer={(pos) => { if (me.hp > 0) goal.current = pos; }}
          enemies={lobby.room.enemies} gates={lobby.room.gates} chests={[]} torches={lobby.room.torches}
          roomWidth={lobby.room.width} roomHeight={lobby.room.height} activeSpellProjectiles={[]} characterConfig={characterConfig}
          stairs={lobby.room.stairs} isBossRoom={lobby.room.isBossRoom} onTargetEnemy={(enemy) => setTargetId(enemy.id)}
          joystickVector={me.hp > 0 ? joystick : { vx: 0, vz: 0 }} multiplayer remotePlayers={lobby.players.filter((p) => p.id !== playerId)} />
      </div>
      <aside className="relative z-20 m-3 p-3 border-2 border-cyan-800 bg-slate-950/95 max-w-xs space-y-2 text-xs">
        <h2 className="text-cyan-300">Floor {floor}/21 · Difficulty {getStageDifficulty(floor, lobby.difficulty)}/10</h2>
        <p>Lobby: <span className="select-text">{lobby.code}</span> · WASD / arrows / click to move</p>
        {lobby.players.map((player) => <div key={player.id} className="flex items-center justify-between gap-2"><span>{player.name}{player.id === playerId ? ' (you)' : ''}: <strong className={player.hp > 0 ? 'text-emerald-300' : 'text-rose-300'}>{player.hp}/{player.maxHp} HP</strong></span>
          {player.hp === 0 && player.id !== playerId && <button className="border border-emerald-500 px-1" onClick={() => send({ type: 'revive', playerId: player.id })}>Revive</button>}</div>)}
        <div className="flex gap-2"><button className={button} disabled={me.hp <= 0 || me.hp === me.maxHp || !me.potions} onClick={() => send({ type: 'heal' })}>Heal ({me.potions})</button><button className={button} onClick={leave}>Leave</button></div>
        <p className="text-slate-400">Potions heal 8 HP or revive a nearby ally. Two per floor.</p>
        {me.hp <= 0 && <p className="text-rose-300">You are down. Ask a teammate to stand nearby and revive you.</p>}
        <div className="flex flex-wrap gap-1">{lobby.room.enemies.map((enemy) => <button key={enemy.id} aria-pressed={enemy.id === target?.id} className={`border p-1 ${enemy.id === target?.id ? 'border-amber-400 text-amber-200' : 'border-slate-600'}`} onClick={() => setTargetId(enemy.id)}>{enemy.name} · {enemy.hp} HP{enemy.shield ? ` · ${fractionToString(enemy.shield)}` : ' · exposed'}</button>)}</div>
      </aside>
      <div role="status" className="fixed top-20 left-1/2 -translate-x-1/2 z-20 max-w-sm bg-slate-950/90 border border-amber-700 p-2 text-xs text-amber-200 pointer-events-none">{lobby.notice}</div>
      {lobby.room.cleared && <div className="fixed inset-x-0 bottom-48 z-30 text-center"><div className="inline-block bg-slate-950 border-2 border-emerald-500 p-4"><p>Room cleared! Health and potions refresh upstairs.</p>{host ? <button className={`${button} mt-2`} onClick={() => send({ type: 'ascend' })}>Ascend together</button> : <p className="mt-2 text-amber-300">Waiting for the host to ascend…</p>}</div></div>}
      {me.defense && me.hp > 0 && <section role="dialog" aria-label="Block incoming attack" className="fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 border-4 border-rose-500 p-5 max-w-lg w-[90vw] space-y-4"><h2 className="text-rose-300">Block the incoming attack!</h2><p>{me.defense.prompt}</p><p className="text-xs text-slate-400">Answer within 12 seconds to take no damage.</p><div className="flex gap-3 flex-wrap">{me.defense.options.map((option, i) => <button className={button} key={i} onClick={() => send({ type: 'defend', answer: i })}>{option}</button>)}</div></section>}
      {me.hp > 0 && <VirtualJoystick onMoveVector={(vx, vz) => setJoystick({ vx, vz })} className="fixed bottom-6 left-6 z-20 pointer-events-auto" />}
      {target && <CardDeckHUD key={floor} cards={getCardsForDifficulty(lobby.difficulty)} targetFraction={target.shield} targetName={target.name}
        disabled={me.hp <= 0 || !!me.defense || recharging} onCastCard={(_fraction, _type, cardIds) => {
          send({ type: 'cast', enemyId: target.id, cardIds }); setRecharging(true);
          window.clearTimeout(rechargeTimer.current); rechargeTimer.current = window.setTimeout(() => setRecharging(false), 800);
        }} />}
    </>}
  </div>;
}
