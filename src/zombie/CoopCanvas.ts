import { drawActor, uiIcon } from './art';
import { audio } from './audio';
import { levelCaches, levelInfo } from './campaign';
import { getClass } from './classes';
import { Action, CoopFrame, CoopPlayer, idleControl } from './coop-model';
import { CoopSession } from './coop-session';
import { drawLandscape } from './landscape';
import { GameControls } from './TouchControls';

export class CoopCanvas implements GameControls {
  private ctx: CanvasRenderingContext2D;
  private keys = new Set<string>();
  private touch = { x: 0, y: 0 };
  private pointer = { x: 0, y: 0, fire: false, autoAim: false };
  private actions: Action[] = [];
  private seq = 0;
  private raf = 0;
  private last = 0;
  private sendTime = 0;
  private frameTime = 0;
  private menu = false;
  private width = 0;
  private height = 0;
  private zoom = 1;
  private dpr = 1;
  private camera = { x: 1280, y: levelInfo(0).spawn.y };
  private shown = new Map<string, { x: number; y: number }>();
  private previous: CoopFrame | null = null;
  private observer: ResizeObserver;
  private removers: (() => void)[] = [];
  constructor(private canvas: HTMLCanvasElement, private session: CoopSession, private openMenu: () => void) {
    this.ctx = canvas.getContext('2d')!;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
    this.pointer.x = this.width / 2; this.pointer.y = this.height / 2 - 120;
    this.listen(window, 'keydown', e => {
      const event = e as KeyboardEvent;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((event.target as HTMLElement)?.tagName)) return;
      if (event.code === 'Escape' && !event.repeat) { this.reset(); this.openMenu(); return; }
      if (!this.active()) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      const action: Record<string, Action> = { KeyR: 'reload', KeyQ: 'ability', KeyE: 'ability', Space: 'dash', KeyF: 'interact', KeyH: 'heal' };
      if (!event.repeat && action[event.code]) this.action(action[event.code]);
    });
    this.listen(window, 'keyup', e => this.keys.delete((e as KeyboardEvent).code));
    this.listen(window, 'pointerup', () => { this.pointer.fire = false; });
    this.listen(window, 'blur', () => { this.reset(); if (session.hosting) session.pause(true); });
    this.listen(document, 'visibilitychange', () => { if (document.hidden) { this.reset(); if (session.hosting) session.pause(true); } });
    const pointer = (event: Event) => { const e = event as PointerEvent, rect = canvas.getBoundingClientRect(); this.pointer.x = e.clientX - rect.left; this.pointer.y = e.clientY - rect.top; this.pointer.autoAim = e.pointerType === 'touch'; };
    this.listen(canvas, 'pointermove', pointer);
    this.listen(canvas, 'pointerdown', e => { pointer(e); if (this.active()) this.pointer.fire = true; });
    this.listen(canvas, 'contextmenu', e => e.preventDefault());
    this.raf = requestAnimationFrame(t => this.loop(t));
  }
  private listen(target: EventTarget, event: string, listener: EventListener) { target.addEventListener(event, listener); this.removers.push(() => target.removeEventListener(event, listener)); }
  private resize() { const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height; this.dpr = Math.min(window.devicePixelRatio || 1, 2); this.canvas.width = this.width * this.dpr; this.canvas.height = this.height * this.dpr; this.zoom = Math.max(.6, Math.min(1.2, this.width / 1050, this.height / 760)); }
  private active() { const s = this.session.view.frame; return !this.menu && !this.session.stale && s?.phase === 'playing' && !s.paused && (s.players.find(p => p.id === this.session.view.selfId)?.health || 0) > 0; }
  setMenu(value: boolean) { this.menu = value; this.reset(); }
  private reset() { this.keys.clear(); this.touch = { x: 0, y: 0 }; this.pointer.fire = false; this.actions = []; this.session.control({ ...idleControl(), seq: ++this.seq }); }
  setMove(x: number, y: number) { if (this.active()) this.touch = { x, y }; }
  setFiring(value: boolean) { this.pointer.fire = value && this.active(); this.pointer.autoAim = true; }
  private action(action: Action) { if (this.active() && this.actions.length < 5) this.actions.push(action); }
  reload() { this.action('reload'); }
  ability() { this.action('ability'); }
  dash() { this.action('dash'); }
  interact() { this.action('interact'); }
  heal() { this.action('heal'); }
  private control() {
    const me = this.session.view.frame?.players.find(p => p.id === this.session.view.selfId);
    if (!this.active() || !me) { this.reset(); return; }
    let x = this.touch.x + +(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - +(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    let y = this.touch.y + +(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - +(this.keys.has('KeyW') || this.keys.has('ArrowUp'));
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
    this.session.control({ seq: ++this.seq, x, y, fire: this.pointer.fire, autoAim: this.pointer.autoAim, aim: Math.atan2((this.pointer.y - this.height / 2) / this.zoom + this.camera.y - me.y, (this.pointer.x - this.width / 2) / this.zoom + this.camera.x - me.x), actions: this.actions.splice(0) });
  }
  private sounds(s: CoopFrame) {
    const last = this.previous, me = s.players.find(p => p.id === this.session.view.selfId), before = last?.players.find(p => p.id === this.session.view.selfId);
    if (!last || last.level !== s.level) audio.setJourney(s.level);
    audio.setCombat(s.phase === 'playing' && !s.paused);
    if (me && before && s.tick !== last?.tick) {
      if (me.flash > before.flash) audio.play(getClass(me.classId).id === 'engineer' ? 'shotgun' : 'shoot');
      if (me.health < before.health) audio.play(me.health ? 'hurt' : 'death');
      if (me.reload > before.reload) audio.play('reload');
      if (me.active > before.active) audio.play('ability');
      if (me.kills > before.kills) audio.play('hit');
      if (s.opened.length > (last?.opened.length || 0) || s.step > (last?.step || 0)) audio.play('pickup');
    }
    this.previous = s;
  }
  private position(id: string, x: number, y: number, dt: number) {
    const p = this.shown.get(id) || { x, y }, snap = Math.hypot(p.x - x, p.y - y) > 350;
    p.x += (x - p.x) * (snap ? 1 : Math.min(1, dt * 22)); p.y += (y - p.y) * (snap ? 1 : Math.min(1, dt * 22)); this.shown.set(id, p); return p;
  }
  private draw(s: CoopFrame, dt: number) {
    const c = this.ctx, w = this.width, h = this.height, me = s.players.find(p => p.id === this.session.view.selfId);
    if (!me) return;
    const mine = this.position(me.id, me.x, me.y, dt); this.camera = { ...mine };
    const current = new Set(s.players.map(p => p.id).concat(s.zombies.map(z => `z${z.id}`))); for (const id of this.shown.keys()) if (!current.has(id)) this.shown.delete(id);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.imageSmoothingEnabled = false; c.fillStyle = '#111c16'; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.scale(this.zoom, this.zoom); c.translate(-this.camera.x, -this.camera.y); drawLandscape(c, this.camera.y, h / this.zoom);
    c.textAlign = 'center';
    for (const cache of levelCaches(s.level)) if (Math.abs(cache.y - this.camera.y) < h / this.zoom) { c.globalAlpha = s.opened.includes(cache.id) ? .25 : 1; c.drawImage(uiIcon('crate'), cache.x - 26, cache.y - 26, 52, 52); c.fillStyle = cache.elite ? '#f2b66b' : '#bdccac'; c.font = '10px monospace'; c.fillText(cache.elite ? 'SQUAD RELIC' : 'SQUAD SUPPLIES', cache.x, cache.y - 40); } c.globalAlpha = 1;
    const info = levelInfo(s.level), target = s.step < 3 ? info.objectives[s.step] : info.exit;
    for (const [i, node] of info.objectives.entries()) if (Math.abs(node.y - this.camera.y) < h / this.zoom) {
      const color = i < s.step ? '#a8c98a' : i === s.step ? '#efb574' : '#687c74'; c.fillStyle = '#18322a'; c.fillRect(node.x - 30, node.y - 40, 60, 70); c.strokeStyle = color; c.lineWidth = 2; c.strokeRect(node.x - 30, node.y - 40, 60, 70); c.fillStyle = color; c.fillRect(node.x - 20, node.y - 25, 40, 22); c.fillRect(node.x - 3, node.y - 80, 6, 43); c.fillRect(node.x - 18, node.y - 77, 36, 4); c.beginPath(); c.arc(node.x, node.y, 145, 0, Math.PI * 2); c.stroke(); c.font = '12px monospace'; c.fillText(i < s.step ? 'SIGNAL ONLINE' : `RECEIVER 0${i + 1}`, node.x, node.y - 100);
      if (s.searching && i === s.step) { c.lineWidth = 5; c.beginPath(); c.arc(node.x, node.y, 65, -Math.PI / 2, -Math.PI / 2 + s.search / 18 * Math.PI * 2); c.stroke(); }
    }
    if (Math.abs(info.exit.y - this.camera.y) < h / this.zoom) { c.fillStyle = s.step === 3 ? '#a8c98a' : '#b47c51'; c.fillRect(850, info.exit.y, 860, 8); c.font = '18px monospace'; c.fillText(s.step === 3 ? '↑ GATHER THE SQUAD · NORTH ↑' : 'RESTORE ALL 3 RECEIVERS', 1280, info.exit.y - 60); }
    for (const drop of s.drops) c.drawImage(uiIcon(drop.kind), drop.x - 16, drop.y - 16, 32, 32);
    const actors = s.zombies.map(z => ({ y: z.y, draw: () => { const pos = this.position(`z${z.id}`, z.x, z.y, dt); drawActor(c, z.kind, pos.x, pos.y, z.angle, Math.floor(s.time * 7) % 4, z.boss ? 2.1 : z.kind === 'brute' ? 1.3 : 1); if (z.hp < z.maxHp) { c.fillStyle = '#17251b'; c.fillRect(pos.x - 20, pos.y - 38, 40, 4); c.fillStyle = '#c17b53'; c.fillRect(pos.x - 20, pos.y - 38, 40 * z.hp / z.maxHp, 4); } } }));
    for (const p of s.players) actors.push({ y: p.y, draw: () => this.drawPlayer(p, dt, s.time) });
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    for (const t of s.turrets) { c.fillStyle = '#a5ad83'; c.fillRect(t.x - 15, t.y - 15, 30, 30); c.save(); c.translate(t.x, t.y); c.rotate(t.angle); c.fillStyle = '#cfb471'; c.fillRect(-8, -4, 35, 8); c.restore(); }
    c.lineWidth = 2;
    for (const b of s.bullets) { c.strokeStyle = b.splash ? '#f6a14e' : '#ffe1a1'; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * .014, b.y - b.vy * .014); c.stroke(); }
    this.arrow(target.x, target.y, '#f2bc7a', 88, me);
    for (const p of s.players) if (p.id !== me.id && (Math.abs(p.x - me.x) > w / this.zoom * .4 || Math.abs(p.y - me.y) > h / this.zoom * .35)) this.arrow(p.x, p.y, p.health ? getClass(p.classId).color : '#ed8d79', 125, me);
    c.restore();
    if (!this.pointer.autoAim && this.active()) { c.strokeStyle = '#e4e2b9'; c.lineWidth = 1.5; c.beginPath(); c.arc(this.pointer.x, this.pointer.y, 7, 0, Math.PI * 2); c.moveTo(this.pointer.x - 12, this.pointer.y); c.lineTo(this.pointer.x + 12, this.pointer.y); c.moveTo(this.pointer.x, this.pointer.y - 12); c.lineTo(this.pointer.x, this.pointer.y + 12); c.stroke(); }
  }
  private arrow(x: number, y: number, color: string, radius: number, me: CoopPlayer) { const c = this.ctx, angle = Math.atan2(y - me.y, x - me.x); c.save(); c.translate(me.x + Math.cos(angle) * radius, me.y + Math.sin(angle) * radius); c.rotate(angle); c.fillStyle = color; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -6); c.lineTo(-6, 6); c.fill(); c.restore(); }
  private drawPlayer(p: CoopPlayer, dt: number, time: number) {
    const c = this.ctx, pos = p.id === this.session.view.selfId ? this.camera : this.position(p.id, p.x, p.y, dt), color = getClass(p.classId).color;
    if (p.active) { c.strokeStyle = color + '99'; c.lineWidth = 2; c.beginPath(); c.arc(pos.x, pos.y, 36, 0, Math.PI * 2); c.stroke(); }
    drawActor(c, p.classId, pos.x, pos.y, p.angle, p.health ? Math.floor(time * 10) % 4 : 0, 1, p.health ? p.hurt && Math.floor(p.hurt * 15) % 2 ? .5 : 1 : .3);
    c.fillStyle = p.health ? color : '#ee9a7f'; c.font = 'bold 11px monospace'; c.fillText(p.health ? p.name : `${p.name} · REVIVE [F]`, pos.x, pos.y - 52);
    c.fillStyle = '#152219'; c.fillRect(pos.x - 24, pos.y - 43, 48, 4); c.fillStyle = color; c.fillRect(pos.x - 24, pos.y - 43, 48 * p.health / p.maxHealth, 4);
    if (p.flash) { c.save(); c.translate(pos.x, pos.y); c.rotate(p.angle); c.fillStyle = '#ffe7a6'; c.fillRect(31, -5, 18, 8); c.restore(); }
  }
  private loop(t: number) {
    const dt = this.last ? Math.min(.05, (t - this.last) / 1000) : 0; this.last = t;
    this.sendTime += dt; this.frameTime += dt;
    if (this.sendTime >= 1 / 30) { this.control(); this.sendTime = 0; }
    this.session.advance(dt);
    if (this.frameTime >= .05) { this.session.publish(); this.frameTime = 0; }
    const state = this.session.view.frame;
    if (state) { this.sounds(state); this.draw(state, dt); }
    this.raf = requestAnimationFrame(time => this.loop(time));
  }
  destroy() { cancelAnimationFrame(this.raf); this.observer.disconnect(); this.removers.splice(0).forEach(remove => remove()); this.reset(); audio.setCombat(false); }
}
