import { useEffect, useRef, useState } from 'react';
import { Heart, Radio, Users, X, Zap } from 'lucide-react';
import { Cinematic } from './Cinematic';
import { CoopCanvas } from './CoopCanvas';
import { CoopSession, RoomView } from './coop-session';
import { getClass } from './classes';
import { levelCaches, levelInfo, RARITY_COLORS } from './campaign';
import { TouchControls } from './TouchControls';

export function CoopGame({ session, view, onLeave }: { session: CoopSession; view: RoomView; onLeave: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), controls = useRef<CoopCanvas | null>(null);
  const [menu, setMenu] = useState(false);
  const hasFrame = !!view.frame;
  useEffect(() => {
    if (!canvas.current) return;
    const engine = new CoopCanvas(canvas.current!, session, () => setMenu(v => !v)); controls.current = engine;
    return () => { engine.destroy(); controls.current = null; };
  }, [session, hasFrame]);
  useEffect(() => { controls.current?.setMenu(menu); if (session.hosting) session.pause(menu); }, [menu, session]);
  const frame = view.frame, me = frame?.players.find(p => p.id === view.selfId);
  if (!frame || !me) return <div className="squad-shell"><p>Synchronizing the squad…</p></div>;
  const c = getClass(me.classId), info = levelInfo(frame.level), target = frame.step < 3 ? info.objectives[frame.step] : { ...info.exit, title: 'Gather the squad at the north gate' };
  const distance = Math.round(Math.hypot(me.x - target.x, me.y - target.y) / 100);
  const downed = frame.players.find(p => p.health <= 0 && p.id !== me.id && Math.hypot(p.x - me.x, p.y - me.y) < 110);
  const cache = levelCaches(frame.level).find(p => !frame.opened.includes(p.id) && Math.hypot(p.x - me.x, p.y - me.y) < 105);
  const prompt = downed ? `Revive ${downed.name} · 1 medkit` : cache ? 'Search case · Loot for everyone' : distance <= 1 ? frame.step < 3 ? frame.searching ? 'Defend the uplink together' : 'Activate receiver' : 'Travel north together' : '';
  const ready = frame.sceneReady.includes(me.id), showScene = frame.phase === 'story' && !ready;
  return <div className="game-screen journey-game coop-game" style={{ '--class-color': c.color } as React.CSSProperties}>
    <canvas className="game-canvas" ref={canvas} aria-label="Online co-op zombie adventure. WASD move, mouse aim and fire, F interact or revive, Q ability, H heal." />
    <header className="coop-topbar"><div className="journey-logo">DEAD<span>SIGNAL</span><small>PRIVATE CO-OP / {view.code}</small></div><div className="journey-location"><small>LEVEL {info.number}/100 · {info.region.name}</small><strong>{info.name}</strong></div><button className="icon-button" onClick={() => setMenu(true)} aria-label="Open squad menu"><Users size={20} /></button></header>
    <section className="coop-objective" aria-label="Shared mission"><span><Radio size={14} /> SQUAD OBJECTIVE <b>{frame.step}/3</b></span><strong>{target.title} <small>{distance}m ↑</small></strong>{frame.searching && <div className="uplink-bar"><i style={{ width: `${frame.search / 18 * 100}%` }} /><span>DEFEND UPLINK · {Math.ceil(18 - frame.search)}s</span></div>}<small>F: scavenge / revive · H: heal · Esc: squad menu</small></section>
    <aside className="coop-roster" aria-label="Squad health">{frame.players.map(p => <div key={p.id} className={p.health ? '' : 'downed'} style={{ '--member-color': getClass(p.classId).color } as React.CSSProperties}><span>{p.name}{p.id === me.id ? ' (YOU)' : ''}</span><small>{p.health ? `${Math.ceil(p.health)}/${p.maxHealth}` : 'DOWNED · F TO REVIVE'}</small><i style={{ width: `${p.health / p.maxHealth * 100}%` }} /></div>)}</aside>
    {me.notice && <div className="coop-notice" role="status">{me.notice}</div>}
    {prompt && me.health > 0 && frame.phase === 'playing' && !frame.paused && <button className="interact-prompt" disabled={frame.searching && !downed && !cache} onClick={() => controls.current?.interact()}><kbd>F</kbd>{prompt}</button>}
    {me.health <= 0 && frame.phase === 'playing' && <div className="coop-downed"><Heart size={20} /><strong>YOU’RE DOWN, NOT OUT.</strong><span>A teammate can approach and press F to revive you.<br />The next secured receiver also revives the squad.</span></div>}
    <div className="coop-bottom"><section className="health-panel"><div className="health-label"><Heart size={15} />{Math.ceil(me.health)}<span>/ {me.maxHealth}</span><span className="survivor-tag">{c.name}</span></div><div className="health-track"><i style={{ width: `${me.health / me.maxHealth * 100}%` }} /></div><small>{me.medkits} MEDKITS · {me.scrap} SCRAP</small></section><div className="ammo-panel"><strong>{me.reload ? '··' : me.ammo}<span> / {c.magazine}</span></strong><small>{me.reload ? 'RELOADING' : c.weapon}</small></div><button className="ability-panel" onClick={() => controls.current?.ability()} disabled={me.ability > 0}><Zap size={18} /><span>{c.ability}<b>{me.active ? 'ACTIVE' : me.ability ? `${Math.ceil(me.ability)}s` : 'READY · Q'}</b></span></button></div>
    <TouchControls engine={controls} /><button className="touch-heal" onClick={() => controls.current?.heal()}><Heart size={14} />HEAL</button>
    {(view.warning || session.stale) && <p className="coop-connection" role="status">{session.stale ? 'Waiting for the host… Controls stopped until synchronization returns.' : view.warning}</p>}
    {(menu || frame.paused) && frame.phase === 'playing' && <div className="pause-backdrop"><section className="pause-card coop-menu" role="dialog" aria-modal="true" aria-label="Squad menu"><span className="modal-eyebrow">PRIVATE SQUAD / {view.code}</span><h2>{frame.paused ? 'SIGNAL ON HOLD.' : 'STAY WITH YOUR SQUAD.'}</h2><p>{session.hosting ? 'As host, your menu pauses everyone. Keep this tab open to run the game.' : frame.paused ? 'The host paused the squad. Waiting for them to resume.' : 'Online play continues while you inspect your gear. This menu stops only your controls.'}</p><div className="gear-list">{Object.entries(me.equipment).map(([slot, gear]) => <div key={slot} style={{ borderColor: gear ? RARITY_COLORS[gear.rarity] : undefined }}><small>{slot.toUpperCase()}</small><strong>{gear?.name || 'Standard issue'}</strong>{gear && <span style={{ color: RARITY_COLORS[gear.rarity] }}>{gear.rarity} · +{gear.power}{slot === 'vest' ? ' HP' : '%'}</span>}</div>)}</div>{(session.hosting || !frame.paused) && <button className="primary-button" autoFocus onClick={() => { setMenu(false); session.pause(false); }}>BACK TO THE ROAD</button>}<button className="secondary-button" onClick={onLeave}><X size={16} />LEAVE SQUAD</button><small>Co-op checkpoints last only for this room. Your solo save is untouched.</small></section></div>}
    {(frame.phase === 'defeat' || frame.phase === 'victory') && <div className="pause-backdrop"><section className="pause-card" role="dialog" aria-label={frame.phase === 'defeat' ? 'Squad down' : 'Campaign complete'}><span className="modal-eyebrow">{frame.phase === 'defeat' ? 'THE SIGNAL IS NOT LOST' : 'ONE HUNDRED LIGHTS. TOGETHER.'}</span><h2>{frame.phase === 'defeat' ? 'SQUAD DOWN.' : 'FIRST LIGHT.'}</h2><p>{frame.phase === 'defeat' ? 'The host can bring everyone back at the last shared receiver checkpoint.' : 'The counter-signal is live. You brought your squad home.'}</p>{session.hosting && frame.phase === 'defeat' ? <button className="primary-button" onClick={() => session.retry()}>RETRY SQUAD CHECKPOINT</button> : frame.phase === 'defeat' ? <p>Waiting for the host to retry…</p> : null}<button className="secondary-button" onClick={onLeave}>LEAVE SQUAD</button></section></div>}
    {showScene && <Cinematic key={`${frame.scene}:${me.id}`} completed={frame.scene} survivor={me.classId} onFinish={() => session.storyReady()} />}
    {frame.phase === 'story' && ready && <div className="pause-backdrop"><section className="pause-card"><span className="modal-eyebrow">TRANSMISSION RECEIVED</span><h2>WAITING FOR THE SQUAD.</h2><p>{frame.sceneReady.length}/{frame.players.length} survivors ready. Everyone finishes or skips the cutscene before the journey continues.</p><button className="secondary-button" onClick={onLeave}>LEAVE SQUAD</button></section></div>}
  </div>;
}
