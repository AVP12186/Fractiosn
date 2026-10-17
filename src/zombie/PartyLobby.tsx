import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Radio, Users, X } from 'lucide-react';
import { CLASSES, ClassId, getClass } from './classes';
import { portrait } from './art';
import { audio } from './audio';
import { cleanName, validCode } from './coop-model';
import { CoopSession } from './coop-session';
import { CoopGame } from './CoopGame';
import './coop.css';

export function inviteCode(value = window.location.hash.slice(1)) {
  const query = new URLSearchParams(value).get('squad') || '';
  return validCode(query.toUpperCase()) ? query.toUpperCase() : '';
}
function Avatar({ id }: { id: ClassId }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { canvas.current?.getContext('2d')?.drawImage(portrait(id), 0, 0); }, [id]);
  return <canvas ref={canvas} width={64} height={64} className="pixel-sprite" aria-hidden="true" />;
}
function savedName() { try { return localStorage.getItem('dead-signal-call-sign') || ''; } catch { return ''; } }

export function PartyLobby({ selected, initialCode, onExit }: { selected: ClassId; initialCode: string; onExit: () => void }) {
  const [name, setName] = useState(savedName), [code, setCode] = useState(initialCode), [session, setSession] = useState<CoopSession | null>(null);
  const [, refresh] = useState(0), [notice, setNotice] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    if (!session) return;
    const unsubscribe = session.subscribe(() => refresh(n => n + 1));
    refresh(n => n + 1);
    return () => { unsubscribe(); session.destroy(); };
  }, [session]);
  const view = session?.view, self = view?.members.find(m => m.id === view.selfId);
  const connect = (host: boolean) => {
    void audio.unlock(); audio.play('click'); setError(''); setNotice('');
    if (!name.trim()) { setError('Choose a call sign first.'); return; }
    if (!host && !validCode(code)) { setError('Enter the ten-character code from your host.'); return; }
    try { localStorage.setItem('dead-signal-call-sign', cleanName(name)); } catch { /* Optional local preference. */ }
    try { setSession(new CoopSession(host, name, selected, host ? undefined : code)); } catch { setError('Online co-op needs a browser with WebRTC support. Try a current Chrome, Safari or Firefox.'); }
  };
  const leave = () => {
    if (session?.hosting && view && view.members.length > 1 && !window.confirm('Leave the squad? You are the host, so this ends the session for everyone.')) return;
    session?.destroy(); setSession(null); onExit();
  };
  const copy = async (link: boolean) => {
    if (!view) return;
    const url = new URL(window.location.href); url.hash = `squad=${view.code}`;
    try { await navigator.clipboard.writeText(link ? url.toString() : view.code); setNotice(link ? 'Invite link copied. Send it to your friends.' : 'Lobby code copied.'); }
    catch { setNotice('Copy is unavailable here. Select the lobby code below and copy it manually.'); }
  };
  if (session && view?.status === 'game') return <CoopGame session={session} view={view} onLeave={leave} />;
  const canStart = !!view && view.members.length >= 2 && view.members.every(m => m.ready);
  return <main className="squad-shell">
    <header className="squad-header"><button className="secondary-button" onClick={leave}><ArrowLeft size={15} />MAIN MENU</button><div className="journey-logo">DEAD<span>SIGNAL</span><small>NORTHBOUND / PRIVATE CO-OP</small></div><Users size={23} /></header>
    {!session ? <section className="squad-entry"><div className="squad-intro"><span className="modal-eyebrow"><Radio size={14} /> SAME SIGNAL. SAME ROAD.</span><h1>DON’T GO<br /><span>NORTH ALONE.</span></h1><p>Create a private squad for 2–4 survivors. Share a code, choose your classes, and take on the apocalypse together.</p><ul><li><Check size={14} />Shared infected, receivers and story</li><li><Check size={14} />Supply cases give loot to everyone</li><li><Check size={14} />Revive your friends with F + a medkit</li></ul><small>The host runs the game and must keep this tab open. Co-op room checkpoints are temporary; your solo save stays safe.</small></div><div className="squad-card"><span className="modal-eyebrow">YOUR SQUAD STARTS HERE</span><label htmlFor="call-sign">CALL SIGN</label><input id="call-sign" autoComplete="nickname" maxLength={18} placeholder="Your survivor name" value={name} onChange={e => setName(e.target.value)} /><button className="primary-button" onClick={() => connect(true)}><Users size={18} />CREATE PRIVATE LOBBY</button><div className="squad-divider">OR JOIN YOUR FRIENDS</div><form onSubmit={e => { e.preventDefault(); connect(false); }}><label htmlFor="lobby-code">LOBBY CODE</label><input id="lobby-code" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={10} placeholder="XXXXXXXXXX" value={code} onChange={e => setCode(e.target.value.replace(/[\s-]/g, '').toUpperCase())} /><button className="secondary-button" type="submit">JOIN LOBBY</button></form>{error && <p className="squad-error" role="alert">{error}</p>}<p className="squad-fine-print">Internet required. Uses PeerJS Cloud to connect browsers. Some school or restricted networks may block peer-to-peer play; try another network.</p></div></section> : view?.status === 'connecting' ? <section className="squad-card squad-connecting"><Radio size={32} /><span className="modal-eyebrow">TUNING THE FREQUENCY</span><h2>CONNECTING…</h2><p>Opening a secure peer connection. This can take a few seconds.</p><button className="secondary-button" onClick={() => setSession(null)}>CANCEL</button></section> : view?.status === 'closed' ? <section className="squad-card squad-connecting"><X size={32} /><h2>SIGNAL LOST.</h2><p className="squad-error" role="alert">{view.error}</p><button className="primary-button" onClick={() => setSession(null)}>BACK TO LOBBIES</button></section> : view && <>
      <section className="squad-lobby-title"><div><span className="modal-eyebrow">PRIVATE FREQUENCY / {view.members.length} OF 4 CONNECTED</span><h1>ASSEMBLE YOUR SQUAD.</h1><p>{session.hosting ? 'Send your code to friends. Everyone must be ready before you deploy.' : 'Choose your class, then signal ready. The host starts the journey.'}</p></div><div className="squad-invite"><label htmlFor="share-code">LOBBY CODE</label><input id="share-code" value={view.code} readOnly onFocus={e => e.target.select()} /><div><button onClick={() => void copy(false)}><Copy size={13} />COPY CODE</button><button onClick={() => void copy(true)}>INVITE LINK</button></div></div></section>
      <section className="squad-slots" aria-label="Lobby survivors">{Array.from({ length: 4 }, (_, i) => { const m = view.members[i]; return m ? <article className="squad-slot occupied" key={m.id} style={{ '--class-color': getClass(m.classId).color } as React.CSSProperties}><div className="slot-status"><span>0{i + 1} / {m.id === view.hostId ? 'HOST' : 'SURVIVOR'}</span><b className={m.ready ? 'ready' : ''}>{m.ready ? 'READY' : 'CHOOSING'}</b></div><Avatar id={m.classId} /><h3>{m.name}{m.id === view.selfId && <small>YOU</small>}</h3><p>{getClass(m.classId).name} · {getClass(m.classId).weapon}</p></article> : <article className="squad-slot empty" key={i}><span>0{i + 1} / OPEN FREQUENCY</span><Users size={32} /><h3>WAITING FOR SIGNAL</h3><p>Share your lobby code to fill this slot.</p></article>; })}</section>
      <section className="squad-loadout"><div><span className="modal-eyebrow">YOUR LOADOUT</span><h2>CHOOSE YOUR EDGE.</h2></div><div className="squad-classes">{CLASSES.map(c => <button key={c.id} aria-pressed={self?.classId === c.id} className={self?.classId === c.id ? 'selected' : ''} style={{ '--class-color': c.color } as React.CSSProperties} onClick={() => session.select(c.id)}><Avatar id={c.id} /><strong>{c.name}</strong><small>{c.ability}</small></button>)}</div>{self && <p><b>{getClass(self.classId).ability}:</b> {getClass(self.classId).abilityDescription}</p>}</section>
      <footer className="squad-deploy"><p>{session.hosting ? view.members.length < 2 ? 'Waiting for at least one friend to join.' : canStart ? 'All signals green. Your squad is ready.' : 'Waiting for every survivor to mark READY.' : self?.ready ? 'Ready. Waiting for the host to deploy.' : 'Choose a class, then mark yourself ready.'}<small>Host tab must stay open · No mid-mission joining · Solo saves unchanged</small></p>{session.hosting ? <button className="primary-button" disabled={!canStart} onClick={() => session.start()}>DEPLOY SQUAD <Users size={17} /></button> : <button className={self?.ready ? 'secondary-button' : 'primary-button'} onClick={() => self && session.select(self.classId, !self.ready)}>{self?.ready ? 'NOT READY' : 'READY UP'}<Check size={17} /></button>}</footer>
      {(notice || view.warning) && <p className="squad-status" role="status">{notice || view.warning}</p>}
    </>}
  </main>;
}
