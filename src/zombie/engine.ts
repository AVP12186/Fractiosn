import { ClassId, GameSettings, SurvivorClass, getClass } from './classes';
import { drawActor, OBSTACLES, terrain, uiIcon, WORLD } from './art';
import { audio } from './audio';

type Vec = { x: number; y: number };
type Zombie = Vec & { id: number; hp: number; maxHp: number; kind: 'zombie' | 'runner' | 'brute'; speed: number; angle: number; hit: number; attack: number };
type Bullet = Vec & { vx: number; vy: number; life: number; damage: number; friendly: boolean };
type Particle = Vec & { vx: number; vy: number; life: number; max: number; color: string; size: number };
type Pickup = Vec & { kind: 'cross' | 'ammo'; time: number };
export type Snapshot = { health: number; maxHealth: number; ammo: number; magazine: number; kills: number; wave: number; score: number; time: number; reloading: number; ability: number; active: number; remaining: number; nextWave: number; dash: number };
type Callbacks = { onUpdate: (state: Snapshot) => void; onPause: (toggle?: boolean) => void; onDeath: (state: Snapshot) => void };
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

export class ShooterEngine {
  readonly survivor: SurvivorClass;
  private ctx: CanvasRenderingContext2D;
  private keys = new Set<string>();
  private pointer = { x: 0, y: 0, down: false, touch: false };
  private movement = { x: 0, y: 0 };
  private player = { x: 930, y: 650, angle: -.6, health: 100, hurt: 0, flash: 0 };
  private camera = { x: 930, y: 650 };
  private zombies: Zombie[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private pickups: Pickup[] = [];
  private stains: (Vec & { size: number })[] = [];
  private turrets: (Vec & { time: number; shot: number; angle: number })[] = [];
  private ammo: number;
  private reloadTime = 0;
  private shotTime = 0;
  private abilityCooldown = 0;
  private activeAbility = 0;
  private dashCooldown = 0;
  private dashTime = 0;
  private wave = 1;
  private spawnLeft = 10;
  private spawnTimer = .8;
  private nextWave = 0;
  private kills = 0;
  private score = 0;
  private elapsed = 0;
  private shake = 0;
  private paused = false;
  private dead = false;
  private raf = 0;
  private last = 0;
  private hudTime = 0;
  private id = 0;
  private width = 0;
  private height = 0;
  private zoom = 1;
  private dpr = 1;
  private resizeObserver: ResizeObserver;
  private removers: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, id: ClassId, private settings: GameSettings, private callbacks: Callbacks) {
    this.survivor = getClass(id); this.ammo = this.survivor.magazine; this.player.health = this.survivor.health;
    this.ctx = canvas.getContext('2d')!;
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas); this.resize();
    this.pointer.x = this.width / 2 + 120; this.pointer.y = this.height / 2 - 120;
    this.listen(window, 'keydown', e => this.keydown(e as KeyboardEvent));
    this.listen(window, 'keyup', e => this.keys.delete((e as KeyboardEvent).code));
    this.listen(window, 'pointerup', () => this.pointer.down = false);
    this.listen(window, 'blur', () => { this.resetInput(); if (!this.paused && !this.dead) this.callbacks.onPause(); });
    this.listen(document, 'visibilitychange', () => { if (document.hidden && !this.paused && !this.dead) { this.resetInput(); this.callbacks.onPause(); } });
    this.listen(canvas, 'pointermove', e => this.movePointer(e as PointerEvent));
    this.listen(canvas, 'pointerdown', e => { this.movePointer(e as PointerEvent); this.pointer.down = true; this.pointer.touch = (e as PointerEvent).pointerType === 'touch'; });
    this.listen(canvas, 'contextmenu', e => e.preventDefault());
    audio.setCombat(true); audio.play('wave'); this.callbacks.onUpdate(this.snapshot());
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  private listen(target: EventTarget, name: string, cb: EventListener) {
    target.addEventListener(name, cb); this.removers.push(() => target.removeEventListener(name, cb));
  }
  private resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
    this.zoom = clamp(Math.min(this.width / 1050, this.height / 760), .6, 1.2);
  }
  private movePointer(e: PointerEvent) { const b = this.canvas.getBoundingClientRect(); this.pointer.x = e.clientX - b.left; this.pointer.y = e.clientY - b.top; }
  private keydown(e: KeyboardEvent) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
    if (e.code === 'Escape' && !e.repeat && !this.dead) { this.callbacks.onPause(true); return; }
    if (this.paused || this.dead) return;
    this.keys.add(e.code);
    if (e.code === 'KeyR') this.reload();
    if ((e.code === 'KeyQ' || e.code === 'KeyE') && !e.repeat) this.ability();
    if (e.code === 'Space' && !e.repeat) this.dash();
  }
  setPaused(value: boolean) { this.paused = value; this.resetInput(); audio.setCombat(!value); }
  configure(settings: GameSettings) { this.settings = settings; }
  setMove(x: number, y: number) { this.movement = { x, y }; }
  setFiring(value: boolean) { this.pointer.down = value; this.pointer.touch = true; }
  private resetInput() { this.keys.clear(); this.pointer.down = false; this.movement = { x: 0, y: 0 }; }
  snapshot(): Snapshot {
    return { health: Math.ceil(this.player.health), maxHealth: this.survivor.health, ammo: this.ammo, magazine: this.survivor.magazine, kills: this.kills, wave: this.wave, score: this.score, time: this.elapsed, reloading: this.reloadTime, ability: this.abilityCooldown, active: this.activeAbility, remaining: this.zombies.length + this.spawnLeft, nextWave: this.nextWave, dash: this.dashCooldown };
  }
  reload() {
    if (this.paused || this.dead || this.reloadTime > 0 || this.ammo === this.survivor.magazine) return;
    this.reloadTime = this.survivor.reload; audio.play('reload');
  }
  dash() {
    if (this.paused || this.dead || this.dashCooldown > 0) return;
    this.dashTime = .18; this.dashCooldown = 2.2;
    this.burst(this.player.x, this.player.y, '#9aab88', 8);
  }
  ability() {
    if (this.paused || this.dead || this.abilityCooldown > 0) return;
    this.abilityCooldown = this.survivor.cooldown; audio.play('ability');
    if (this.survivor.id === 'assault') { this.activeAbility = 6; this.reloadTime = 0; }
    if (this.survivor.id === 'medic') {
      this.player.health = Math.min(this.survivor.health, this.player.health + 55); this.activeAbility = 1;
      for (const z of this.zombies) if (distance(z, this.player) < 190) {
        const a = Math.atan2(z.y - this.player.y, z.x - this.player.x); this.move(z, Math.cos(a) * 110, Math.sin(a) * 110, 20); z.hit = .3;
      }
      this.burst(this.player.x, this.player.y, '#a4cd8e', 36);
    }
    if (this.survivor.id === 'engineer') { this.activeAbility = 12; this.turrets.push({ x: this.player.x, y: this.player.y, time: 12, shot: .1, angle: 0 }); }
    if (this.survivor.id === 'recon') { this.activeAbility = 5; this.burst(this.player.x, this.player.y, '#97c7c0', 30); }
    this.callbacks.onUpdate(this.snapshot());
  }
  private blocked(x: number, y: number, radius: number) {
    return OBSTACLES.some(o => x + radius > o.x && x - radius < o.x + o.w && y + radius > o.y && y - radius < o.y + o.h);
  }
  private move(entity: Vec, dx: number, dy: number, radius: number) {
    const x = clamp(entity.x + dx, radius + 20, WORLD.width - radius - 20);
    const y = clamp(entity.y + dy, radius + 20, WORLD.height - radius - 20);
    if (!this.blocked(x, entity.y, radius)) entity.x = x;
    if (!this.blocked(entity.x, y, radius)) entity.y = y;
  }
  private spawn() {
    let x = 0, y = 0;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, d = 470 + Math.random() * 230;
      x = clamp(this.player.x + Math.cos(a) * d, 35, WORLD.width - 35); y = clamp(this.player.y + Math.sin(a) * d, 35, WORLD.height - 35);
      if (!this.blocked(x, y, 30) && distance({ x, y }, this.player) > 320) break;
    }
    if (this.blocked(x, y, 30)) return;
    const roll = Math.random();
    const kind = this.wave > 2 && roll > .85 ? 'brute' : this.wave > 1 && roll > .59 ? 'runner' : 'zombie';
    const hp = (kind === 'brute' ? 190 : kind === 'runner' ? 44 : 64) + this.wave * 7;
    this.zombies.push({ id: this.id++, x, y, hp, maxHp: hp, kind, speed: (kind === 'runner' ? 150 : kind === 'brute' ? 63 : 78) + this.wave * 3, angle: 0, hit: 0, attack: 0 }); this.spawnLeft--;
  }
  private shoot(angle: number, from: Vec = this.player, turret = false) {
    const shotgun = this.survivor.id === 'engineer' && !turret;
    for (let i = 0; i < (shotgun ? 6 : 1); i++) {
      const a = angle + (Math.random() - .5) * (shotgun ? .4 : turret ? .035 : .055);
      this.bullets.push({ x: from.x + Math.cos(a) * 31, y: from.y + Math.sin(a) * 31, vx: Math.cos(a) * 960, vy: Math.sin(a) * 960, life: .78, damage: turret ? 20 : this.survivor.damage, friendly: true });
    }
    this.burst(from.x + Math.cos(angle) * 34, from.y + Math.sin(angle) * 34, '#f7c977', 4);
    if (!turret) { this.player.flash = .06; this.shake = shotgun ? 5 : 2.2; }
    audio.play(shotgun ? 'shotgun' : 'shoot');
  }
  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, speed = 30 + Math.random() * 170, life = .13 + Math.random() * .35; this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life, max: life, color, size: 2 + Math.random() * 3 }); }
  }
  private kill(z: Zombie) {
    this.kills++; this.score += z.kind === 'brute' ? 250 : z.kind === 'runner' ? 150 : 100;
    this.burst(z.x, z.y, '#9a623b', 14); this.stains.push({ x: z.x, y: z.y, size: 10 + Math.random() * 14 });
    if (this.stains.length > 200) this.stains.shift();
    if (this.kills % 5 === 0 || Math.random() < .11) this.pickups.push({ x: z.x, y: z.y, kind: this.kills % 5 === 0 ? 'cross' : 'ammo', time: 22 });
  }
  private update(dt: number) {
    this.elapsed += dt; this.shotTime -= dt; this.player.hurt = Math.max(0, this.player.hurt - dt); this.player.flash -= dt;
    this.abilityCooldown = Math.max(0, this.abilityCooldown - dt); this.activeAbility = Math.max(0, this.activeAbility - dt); this.dashCooldown = Math.max(0, this.dashCooldown - dt); this.dashTime = Math.max(0, this.dashTime - dt); this.shake = Math.max(0, this.shake - dt * 18);
    if (this.reloadTime > 0) { this.reloadTime -= dt; if (this.reloadTime <= 0) { this.ammo = this.survivor.magazine; this.reloadTime = 0; } }
    let dx = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) + this.movement.x;
    let dy = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) + this.movement.y;
    const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
    const ghost = this.survivor.id === 'recon' && this.activeAbility > 0;
    const speed = this.survivor.speed * (this.dashTime > 0 ? 3.7 : ghost ? 1.4 : 1);
    if (this.dashTime > 0 && len < .1) { dx = Math.cos(this.player.angle); dy = Math.sin(this.player.angle); }
    this.move(this.player, dx * speed * dt, dy * speed * dt, 18);
    let aimX = (this.pointer.x - this.width / 2) / this.zoom + this.camera.x;
    let aimY = (this.pointer.y - this.height / 2) / this.zoom + this.camera.y;
    if (this.pointer.touch && this.zombies.length) { const nearest = this.zombies.reduce((a, b) => distance(a, this.player) < distance(b, this.player) ? a : b); aimX = nearest.x; aimY = nearest.y; }
    this.player.angle = Math.atan2(aimY - this.player.y, aimX - this.player.x);
    if (this.pointer.down && this.shotTime <= 0 && this.reloadTime <= 0) {
      const overdrive = this.survivor.id === 'assault' && this.activeAbility > 0;
      if (this.ammo > 0 || overdrive) { this.shoot(this.player.angle); if (!overdrive) this.ammo--; this.shotTime = this.survivor.fireRate / (overdrive ? 2 : 1); }
      else this.reload();
    }
    if (this.spawnLeft > 0) { this.spawnTimer -= dt; if (this.spawnTimer <= 0) { this.spawn(); this.spawnTimer = Math.max(.22, .72 - this.wave * .04); } }
    if (this.spawnLeft === 0 && this.zombies.length === 0) {
      if (this.nextWave === 0) { this.nextWave = 6; this.player.health = Math.min(this.survivor.health, this.player.health + 15); this.score += this.wave * 500; }
      this.nextWave -= dt;
      if (this.nextWave <= 0) { this.wave++; this.spawnLeft = 7 + this.wave * 4; this.spawnTimer = .3; this.nextWave = 0; this.ammo = this.survivor.magazine; this.reloadTime = 0; audio.play('wave'); }
    }
    for (const z of this.zombies) {
      z.hit = Math.max(0, z.hit - dt); z.attack -= dt;
      const d = distance(z, this.player); z.angle = Math.atan2(this.player.y - z.y, this.player.x - z.x);
      let vx = Math.cos(z.angle), vy = Math.sin(z.angle);
      for (const other of this.zombies) { if (z.id === other.id) continue; const dd = distance(z, other); if (dd < 37 && dd > 0) { vx += (z.x - other.x) / dd * .65; vy += (z.y - other.y) / dd * .65; } }
      if (d > 26) {
        const before = { x: z.x, y: z.y }; this.move(z, vx * z.speed * dt, vy * z.speed * dt, 17);
        if (distance(before, z) < dt * z.speed * .35) this.move(z, -Math.sin(z.angle) * z.speed * dt, Math.cos(z.angle) * z.speed * dt, 17);
      }
      if (d < (z.kind === 'brute' ? 43 : 32) && z.attack <= 0 && this.player.hurt <= 0 && !ghost && this.dashTime <= 0) {
        this.player.health -= z.kind === 'brute' ? 25 : 12; this.player.hurt = .65; z.attack = .9; this.shake = 9; audio.play('hurt'); this.burst(this.player.x, this.player.y, '#cf6949', 8);
        if (this.player.health <= 0) { this.player.health = 0; this.dead = true; this.resetInput(); audio.play('death'); audio.setCombat(false); this.callbacks.onDeath(this.snapshot()); return; }
      }
    }
    for (const b of this.bullets) {
      b.life -= dt;
      const steps = 3;
      for (let i = 0; i < steps && b.life > 0; i++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (b.x < 0 || b.y < 0 || b.x > WORLD.width || b.y > WORLD.height || this.blocked(b.x, b.y, 1)) { b.life = 0; this.burst(b.x, b.y, '#9d9d71', 3); break; }
        for (const z of this.zombies) if (z.hp > 0 && distance(b, z) < (z.kind === 'brute' ? 26 : 21)) {
          z.hp -= b.damage; z.hit = .12; b.life = 0; this.burst(b.x, b.y, '#b4844b', 5); audio.play('hit');
          this.move(z, b.vx * .007, b.vy * .007, 18); if (z.hp <= 0) this.kill(z); break;
        }
      }
    }
    this.zombies = this.zombies.filter(z => z.hp > 0); this.bullets = this.bullets.filter(b => b.life > 0);
    for (const t of this.turrets) {
      t.time -= dt; t.shot -= dt;
      const target = this.zombies.filter(z => distance(z, t) < 510).sort((a, b) => distance(a, t) - distance(b, t))[0];
      if (target) { t.angle = Math.atan2(target.y - t.y, target.x - t.x); if (t.shot <= 0) { this.shoot(t.angle, t, true); t.shot = .2; } }
    }
    this.turrets = this.turrets.filter(t => t.time > 0);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0).slice(-400);
    for (const p of this.pickups) {
      p.time -= dt;
      if (distance(p, this.player) < 40) {
        if (p.kind === 'cross') this.player.health = Math.min(this.survivor.health, this.player.health + 30);
        else { this.ammo = this.survivor.magazine; this.reloadTime = 0; }
        p.time = 0; audio.play('pickup'); this.burst(p.x, p.y, '#bbc18b', 12);
      }
    }
    this.pickups = this.pickups.filter(p => p.time > 0);
    this.camera.x += (this.player.x - this.camera.x) * Math.min(1, dt * 7); this.camera.y += (this.player.y - this.camera.y) * Math.min(1, dt * 7);
    this.hudTime -= dt; if (this.hudTime <= 0) { this.hudTime = .08; this.callbacks.onUpdate(this.snapshot()); }
  }
  private draw() {
    const c = this.ctx, { width: w, height: h } = this;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.imageSmoothingEnabled = false; c.fillStyle = '#111c16'; c.fillRect(0, 0, w, h);
    c.save();
    const shake = this.settings.shake ? this.shake : 0;
    c.translate(w / 2 + (Math.random() - .5) * shake, h / 2 + (Math.random() - .5) * shake); c.scale(this.zoom, this.zoom); c.translate(-this.camera.x, -this.camera.y);
    c.drawImage(terrain(), 0, 0);
    for (const s of this.stains) { c.fillStyle = '#653f2b88'; c.fillRect(s.x - s.size, s.y - 4, s.size * 2, 8); c.fillRect(s.x - 5, s.y - s.size * .7, 12, s.size * 1.4); }
    for (const p of this.pickups) {
      if (p.time < 4 && Math.floor(p.time * 6) % 2) continue;
      c.fillStyle = '#a4c78315'; c.beginPath(); c.arc(p.x, p.y, 28 + Math.sin(this.elapsed * 4) * 3, 0, Math.PI * 2); c.fill();
      c.drawImage(uiIcon(p.kind), p.x - 18, p.y - 18 + Math.sin(this.elapsed * 4) * 3, 36, 36);
    }
    const moving = this.keys.size > 0 || Math.hypot(this.movement.x, this.movement.y) > .1;
    const entities = this.zombies.map(z => ({ y: z.y, draw: () => {
      drawActor(c, z.kind, z.x, z.y, z.angle, Math.floor(this.elapsed * (z.kind === 'runner' ? 12 : 7)) % 4, z.kind === 'brute' ? 1.3 : 1);
      if (z.hit > 0) { c.fillStyle = '#e6b17455'; c.beginPath(); c.arc(z.x, z.y, 21, 0, Math.PI * 2); c.fill(); }
      if (z.hp < z.maxHp) { c.fillStyle = '#152219'; c.fillRect(z.x - 19, z.y - 37, 38, 4); c.fillStyle = '#b56c43'; c.fillRect(z.x - 19, z.y - 37, 38 * z.hp / z.maxHp, 4); }
    } }));
    entities.push({ y: this.player.y, draw: () => {
      const p = this.player, ghost = this.survivor.id === 'recon' && this.activeAbility > 0;
      if (this.activeAbility > 0) { c.strokeStyle = `${this.survivor.color}88`; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, this.survivor.id === 'medic' ? 80 * (1 - this.activeAbility) + 28 : 35, 0, Math.PI * 2); c.stroke(); }
      c.strokeStyle = '#e4e5b822'; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, 27, 0, Math.PI * 2); c.stroke();
      drawActor(c, this.survivor.id, p.x, p.y, p.angle, moving ? Math.floor(this.elapsed * 12) % 4 : 0, 1, ghost ? .42 : p.hurt > 0 && Math.floor(p.hurt * 15) % 2 ? .5 : 1);
      if (p.flash > 0) { c.save(); c.translate(p.x, p.y); c.rotate(p.angle); c.fillStyle = '#ffe7a6'; c.fillRect(31, -5, 17, 8); c.fillStyle = '#e9ac59'; c.fillRect(37, -9, 5, 16); c.restore(); }
    } });
    entities.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    for (const t of this.turrets) {
      c.fillStyle = '#24362b'; c.fillRect(t.x - 17, t.y - 17, 34, 34); c.strokeStyle = '#c5a75e'; c.strokeRect(t.x - 15, t.y - 15, 30, 30);
      c.save(); c.translate(t.x, t.y); c.rotate(t.angle); c.fillStyle = '#acb28a'; c.fillRect(-10, -8, 23, 16); c.fillStyle = '#647860'; c.fillRect(7, -4, 26, 8); c.restore();
    }
    c.lineWidth = 2;
    for (const b of this.bullets) { c.strokeStyle = '#ffe1a1'; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * .014, b.y - b.vy * .014); c.stroke(); }
    for (const p of this.particles) { c.globalAlpha = Math.min(1, p.life / p.max * 2); c.fillStyle = p.color; c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); } c.globalAlpha = 1;
    // Peripheral arrows keep off-screen infected readable without revealing the entire arena.
    for (const z of this.zombies) {
      const sx = (z.x - this.camera.x) * this.zoom + w / 2, sy = (z.y - this.camera.y) * this.zoom + h / 2;
      if (sx > 28 && sx < w - 28 && sy > 100 && sy < h - 120) continue;
      const px = this.camera.x + (clamp(sx, 35, w - 35) - w / 2) / this.zoom;
      const py = this.camera.y + (clamp(sy, 110, h - 130) - h / 2) / this.zoom;
      c.save(); c.translate(px, py); c.rotate(Math.atan2(z.y - py, z.x - px)); c.fillStyle = '#d9854b'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-4, -5); c.lineTo(-4, 5); c.fill(); c.restore();
    }
    c.restore();
    const vignette = c.createRadialGradient(w / 2, h / 2, h * .15, w / 2, h / 2, Math.max(w, h) * .68); vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, '#050e0bba'); c.fillStyle = vignette; c.fillRect(0, 0, w, h);
    if (this.player.hurt > .4) { c.fillStyle = '#bb43251c'; c.fillRect(0, 0, w, h); }
    if (!this.pointer.touch && !this.paused && !this.dead) {
      const { x, y } = this.pointer; c.strokeStyle = this.reloadTime > 0 ? '#d2ab63' : '#e4e2b9'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.moveTo(x - 13, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 13, y); c.moveTo(x, y - 13); c.lineTo(x, y - 5); c.moveTo(x, y + 5); c.lineTo(x, y + 13); c.stroke();
    }
  }
  private loop(t: number) {
    const dt = this.last ? Math.min((t - this.last) / 1000, .04) : 0; this.last = t;
    if (!this.paused && !this.dead) this.update(dt);
    this.draw(); this.raf = requestAnimationFrame(time => this.loop(time));
  }
  destroy() { cancelAnimationFrame(this.raf); this.resizeObserver.disconnect(); this.removers.forEach(remove => remove()); audio.setCombat(false); }
}
