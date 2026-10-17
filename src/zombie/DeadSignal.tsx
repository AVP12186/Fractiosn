import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, Check, ChevronRight, Crosshair, Heart, Menu, Pause, Play, Radio, RotateCcw, Settings2, Skull, Target, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { CLASSES, ClassId, DEFAULT_SETTINGS, GameSettings, getClass } from './classes';
import { drawActor, portrait, random, terrain, uiIcon } from './art';
import { audio } from './audio';
import { Snapshot } from './engine';
import { JourneyGame as Game } from './JourneyGame';
import { CampaignSave, levelInfo, parseSave, SAVE_KEY } from './campaign';
import './dead-signal.css';
import './journey.css';

type Panel = 'guide' | 'settings' | null;
const storage = {
  get(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Private browsing may disable persistence. */ } },
};
function loadSettings(): GameSettings {
  try {
    const value = JSON.parse(storage.get('dead-signal-settings') || '{}');
    return { music: typeof value.music === 'boolean' ? value.music : true, sfx: typeof value.sfx === 'boolean' ? value.sfx : true, shake: typeof value.shake === 'boolean' ? value.shake : true, volume: typeof value.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : .6 };
  } catch { return DEFAULT_SETTINGS; }
}
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

function PixelSprite({ id, icon, className = '' }: { id?: ClassId; icon?: Parameters<typeof uiIcon>[0]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const ctx = ref.current?.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, 64, 64); ctx.drawImage(id ? portrait(id) : uiIcon(icon!), 0, 0); } }, [id, icon]);
  return <canvas className={`pixel-sprite ${className}`} width={64} height={64} ref={ref} aria-hidden="true" />;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'compact' : ''}`}><span className="brand-mark"><Crosshair size={25} strokeWidth={1.8} /><span /></span><span>DEAD<span className="brand-light">SIGNAL</span><small>STAY ALIVE. STAY HUMAN.</small></span></div>;
}

function MenuScene({ selected }: { selected: ClassId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    const rand = random(27), debris = Array.from({ length: 32 }, () => ({ x: rand() * 1000, y: rand() * 700, speed: 8 + rand() * 16 }));
    let frame = 0;
    const draw = (ms: number) => {
      const t = ms / 1000; ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 1000, 700);
      ctx.save(); ctx.translate(500, 350); ctx.scale(.75, .75); ctx.translate(-1080 + Math.sin(t * .08) * 9, -650);
      ctx.drawImage(terrain(), 0, 0);
      for (let i = 0; i < 13; i++) { const x = 580 + (i * 167 % 1000), y = 340 + (i * 113 % 690); drawActor(ctx, i % 4 === 0 ? 'runner' : 'zombie', x + Math.sin(t * .3 + i) * 12, y + Math.cos(t * .3 + i) * 12, Math.atan2(650 - y, 950 - x), Math.floor(t * 4 + i) % 4); }
      drawActor(ctx, selected, 940, 650, -.55, Math.floor(t * 1.5) % 2, 1.18);
      drawActor(ctx, 'medic', 855, 720, 2.6, 0, 1.05);
      drawActor(ctx, 'recon', 1010, 735, .1, 0, 1.05);
      const light = ctx.createRadialGradient(940, 650, 20, 940, 650, 360); light.addColorStop(0, '#e8bc741d'); light.addColorStop(1, 'transparent'); ctx.fillStyle = light; ctx.fillRect(550, 280, 800, 800);
      if (t % 3 < .11) { ctx.save(); ctx.translate(940, 650); ctx.rotate(-.55); ctx.fillStyle = '#ffd798'; ctx.fillRect(30, -5, 24, 9); ctx.fillRect(40, -10, 6, 19); ctx.restore(); }
      ctx.restore();
      ctx.fillStyle = '#09130d30'; ctx.fillRect(0, 0, 1000, 700);
      for (const p of debris) { ctx.fillStyle = '#cead7355'; const y = (p.y - t * p.speed % 750 + 750) % 750; ctx.fillRect(p.x + Math.sin(t * .4 + p.y) * 20, y, 2, 2); }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
  }, [selected]);
  return <div className="menu-scene" aria-label="Animated pixel-art view of the Blackwater quarantine zone" role="img">
    <canvas width={1000} height={700} ref={ref} />
    <div className="scene-scanlines" /><div className="scene-fade" />
    <div className="feed-label"><span className="live-dot" /> LIVE FEED <span>CAM_07 / 04:32 AM</span></div>
    <div className="scene-coordinate">34°07′12.8″N<br />118°19′08.2″W</div>
    <div className="target-reticle"><i /><i /><i /><i /><span>FRIENDLY</span></div>
    <div className="zone-stamp"><span className="zone-line" /><div><small>GROUND ZERO / SECTOR 07</small><strong>BLACKWATER</strong><span><span className="tiny-dot" /> QUARANTINE ACTIVE</span></div><div className="zone-number">07</div></div>
    <span className="scene-corner tl" /><span className="scene-corner br" />
  </div>;
}

function StatBars({ label, value }: { label: string; value: number }) {
  return <div className="stat-bars"><span>{label}</span><div>{[1, 2, 3, 4, 5].map(n => <i className={n <= value ? 'filled' : ''} key={n} />)}</div></div>;
}

function FieldGuide() {
  return <div className="field-guide"><div className="modal-eyebrow">SURVIVOR FIELD MANUAL / REV. 01</div><h2>Make every shot count.</h2><p>Follow a mysterious voice across 100 northbound locations and 20 regions. Restore three receivers per level, then reach the northern gate. Levels target about five minutes including travel, combat and scavenging; your pace will vary. The route and loot are procedurally varied.</p>
    <div className="guide-grid"><div><Crosshair /><h3>Keep moving</h3><p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys to move. Aim with your mouse. Hold left click to fire.</p></div><div><Zap /><h3>Use your edge</h3><p><kbd>Q</kbd> activates your class ability. <kbd>Space</kbd> dashes through danger. Each has a cooldown.</p></div><div><RotateCcw /><h3>Stay loaded</h3><p><kbd>R</kbd> reloads. Empty magazines auto-reload when you fire. Reserve ammo is unlimited.</p></div><div><Heart /><h3>Scavenge & survive</h3><p>Press F at supply cases for gear and medkits. Better equipment auto-equips; weaker finds become scrap. H heals using a medkit or 3 scrap. Receivers save your checkpoint.</p></div></div>
    <div className="guide-threats"><span>KNOW YOUR ENEMY</span><p><b>Walkers</b> overwhelm in numbers. <b>Runners</b> stalk later roads. <b>Brutes</b> guard dangerous locations. A <b>relay guardian</b> blocks every tenth level.</p></div>
    <div className="guide-note"><Radio size={17} /><span>On touch screens: left stick to move, hold FIRE to auto-aim at the nearest infected.</span></div>
  </div>;
}

function SettingsPanel({ settings, onChange }: { settings: GameSettings; onChange: (s: GameSettings) => void }) {
  return <div className="settings-panel"><div className="modal-eyebrow">PERSONAL CONFIGURATION</div><h2>Tune your frequency.</h2><p>Your settings are saved on this device.</p>
    {([{ key: 'music', label: 'Background music', description: 'Original dark synth survival soundtrack', icon: AudioLines }, { key: 'sfx', label: 'Sound effects', description: 'Weapons, impacts, pickups & alerts', icon: Volume2 }, { key: 'shake', label: 'Screen shake', description: 'A little more impact. A little less steady.', icon: Target }] as const).map(({ key, label, description, icon: Icon }) => <div className="setting-row" key={key}><Icon size={21} /><div><strong>{label}</strong><span>{description}</span></div><button className={`toggle ${settings[key] ? 'on' : ''}`} role="switch" aria-checked={settings[key]} aria-label={label} onClick={() => onChange({ ...settings, [key]: !settings[key] })}><span /></button></div>)}
    <label className="volume-label" htmlFor="master-volume">MASTER VOLUME <span>{Math.round(settings.volume * 100)}%</span></label><input id="master-volume" type="range" min="0" max="100" value={Math.round(settings.volume * 100)} onChange={e => onChange({ ...settings, volume: Number(e.target.value) / 100 })} />
    <div className="guide-note"><Radio size={17} /><span>Audio comes online after your first interaction. Headphones recommended.</span></div>
  </div>;
}



export default function DeadSignal() {
  const [selected, setSelected] = useState<ClassId>('assault'), [panel, setPanel] = useState<Panel>(null), [playing, setPlaying] = useState(false), [settings, setSettings] = useState(loadSettings);
  const [best, setBest] = useState(() => Math.max(0, Number(storage.get('dead-signal-best')) || 0));
  const [audioStarted, setAudioStarted] = useState(false);
  const [checkpoint, setCheckpoint] = useState(() => parseSave(storage.get(SAVE_KEY)));
  const [resume, setResume] = useState<CampaignSave | undefined>();
  const selectedClass = getClass(selected);
  useEffect(() => { audio.configure(settings); storage.set('dead-signal-settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => () => audio.dispose(), []);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const close = document.querySelector<HTMLButtonElement>('.modal-close'); close?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { e.stopImmediatePropagation(); setPanel(null); }
      if (e.key === 'Tab') {
        const focusable = [...document.querySelectorAll<HTMLElement>('.modal-card button, .modal-card input, .modal-card a')].filter(el => !el.hasAttribute('disabled'));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', key, true); return () => { window.removeEventListener('keydown', key, true); previous?.focus(); };
  }, [panel]);
  const interact = () => { void audio.unlock(); setAudioStarted(true); audio.play('click'); };
  const open = (p: Panel) => { interact(); setPanel(p); };
  const deploy = () => { interact(); if (checkpoint && !window.confirm('Start a new journey? This replaces your existing campaign checkpoint. Choose Continue to keep your current progress.')) return; setResume(undefined); setPlaying(true); };
  const save = (s: CampaignSave) => { storage.set(SAVE_KEY, JSON.stringify(s)); setCheckpoint(s); };
  const updateSettings = (s: GameSettings) => { interact(); setSettings(s); };
  const result = (s: Snapshot) => { if (s.score > best) { setBest(s.score); storage.set('dead-signal-best', String(s.score)); } };
  return <div className="dead-signal">
    {playing ? <Game selected={selected} settings={settings} resume={resume} onCheckpoint={save} onExit={() => { interact(); setPlaying(false); }} openSettings={() => open('settings')} onResult={result} /> : <div className="menu-shell">
      <header className="site-header"><a className="brand-link" href="#" aria-label="Dead Signal home" onClick={e => { e.preventDefault(); interact(); setPanel(null); }}><Brand /></a><nav aria-label="Main navigation"><button className={panel === null ? 'active' : ''} onClick={() => { interact(); setPanel(null); }}>PLAY<span /></button><button onClick={() => open('guide')}>FIELD GUIDE</button><button onClick={() => open('settings')}>SETTINGS</button></nav><div className="header-status"><span className="live-dot" /> OFFLINE. NOT ALONE.<span className="version">V.2.0</span></div><button className="mobile-menu icon-button" aria-label="Open field guide" onClick={() => open('guide')}><Menu /></button></header>
      <main><section className="hero"><MenuScene selected={selected} /><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />THE END WAS ONLY THE BEGINNING</div><h1>ONE SIGNAL.<br />GO <span>NORTH.</span></h1><p>100 locations. Ten survivors. One voice in the static.<br className="desktop-break" /> Scavenge the long road. Find the truth. Stay human.</p><div className="hero-actions"><button className="primary-button deploy-button" onClick={deploy}><Crosshair size={19} />BEGIN THE JOURNEY<ArrowUpRight size={21} /></button>{checkpoint && <button className="continue-campaign" onClick={() => { interact(); setResume(checkpoint); setPlaying(true); }}><Play size={14} />CONTINUE · LEVEL {checkpoint.level + 1}<small>{levelInfo(checkpoint.level).region.name} · {getClass(checkpoint.classId).name}</small></button>}<span className="mode-note">STORY CAMPAIGN <i /> 100 LEVELS</span></div><button className="how-to" onClick={() => open('guide')}><span><Play size={10} fill="currentColor" /></span>First time out there? <b>Read the field guide</b><ChevronRight size={14} /></button><div className="hero-specs"><span><span className="pixel-dot-grid">▦</span>64 × 64 PIXEL ART</span><span><AudioLines size={14} />ORIGINAL SOUNDTRACK</span><span><Skull size={14} />CHECKPOINT SAVES</span></div></div></section>
      <section className="class-section" aria-labelledby="classes-heading"><div className="section-heading"><div><span className="section-index">01 /</span><h2 id="classes-heading">CHOOSE YOUR SURVIVOR<span>Choose your edge.</span></h2></div><span className="class-count"><span className="live-dot" />10 CLASSES. ONE WAY NORTH.</span></div><div className="class-grid">{CLASSES.map((c, index) => <button key={c.id} className={`class-card ${selected === c.id ? 'selected' : ''}`} aria-pressed={selected === c.id} onClick={() => { interact(); setSelected(c.id); }} style={{ '--class-color': c.color } as React.CSSProperties}><div className="card-top"><span>{String(index + 1).padStart(2, '0')}<span> / {c.role}</span></span><span className="select-indicator">{selected === c.id ? <Check size={10} strokeWidth={3} /> : <span />}</span></div><div className="class-card-main"><div><h3>{c.name}</h3><p>{c.description}</p><span className="weapon-tag"><Crosshair size={11} />{c.weapon}</span></div><div className="portrait-platform"><PixelSprite id={c.id} /><span /></div></div><div className="card-divider" /><div className="card-bottom"><span>{c.id === 'assault' ? <Zap size={13} /> : c.id === 'medic' ? <Heart size={13} /> : c.id === 'engineer' ? <Settings2 size={13} /> : <Target size={13} />}{c.ability}</span><span className="selected-label">{selected === c.id ? 'SELECTED' : 'SELECT CLASS'}<ArrowUpRight size={12} /></span></div></button>)}</div>
      <div className="loadout-bar"><div className="loadout-description"><span className="loadout-icon"><Zap size={17} /></span><p><strong>{selectedClass.ability}</strong><span>{selectedClass.abilityDescription}</span></p><kbd>Q</kbd></div><div className="loadout-stats"><StatBars label="FIREPOWER" value={selectedClass.stats[0]} /><StatBars label="ARMOR" value={selectedClass.stats[1]} /><StatBars label="MOBILITY" value={selectedClass.stats[2]} /></div></div></section>
      </main><footer className="site-footer"><div className="footer-transmission"><Radio size={15} /><span>IF YOU CAN HEAR THIS, YOU’RE STILL ALIVE.</span></div><div className="footer-best">PERSONAL BEST <span>{best ? best.toLocaleString() : '—'}</span></div><button className={`music-control ${settings.music && audioStarted ? 'is-playing' : ''}`} onClick={() => { interact(); if (!audioStarted) setSettings(s => ({ ...s, music: true })); else setSettings(s => ({ ...s, music: !s.music })); }} aria-label={settings.music && audioStarted ? 'Mute background music' : 'Enable background music'}><span className="equalizer"><i /><i /><i /><i /></span><span>{settings.music && audioStarted ? 'NOW PLAYING' : 'SOUNDTRACK'}<b>Northbound / Original score</b></span>{settings.music && audioStarted ? <Volume2 size={16} /> : <VolumeX size={16} />}</button></footer>
    </div>}
    {panel && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setPanel(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={panel === 'guide' ? 'Field guide' : 'Settings'}><button className="icon-button modal-close" aria-label="Close dialog" onClick={() => setPanel(null)}><X size={21} /></button>{panel === 'guide' ? <FieldGuide /> : <SettingsPanel settings={settings} onChange={updateSettings} />}</section></div>}
  </div>;
}
