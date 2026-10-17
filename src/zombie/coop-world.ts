import { getClass } from './classes';
import { emptyEquipment, JOURNEY_WORLD, levelCaches, levelInfo, rollGear, SEARCH_SECONDS } from './campaign';
import { obstaclesNear } from './landscape';
import { Action, Control, CoopFrame, CoopPlayer, idleControl, Infected, Member, Point } from './coop-model';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export class CoopWorld {
  state: CoopFrame;
  private controls = new Map<string, { input: Control; at: number }>();
  private clock = 0;
  private serial = 0;
  private spawnTime = 4;
  private encountered = new Set<number>();
  private checkpoint: CoopFrame;

  constructor(members: Member[]) {
    if (!members.length || members.length > 4) throw new Error('A squad needs 1–4 survivors.');
    const spawn = levelInfo(0).spawn;
    this.state = { version: 1, tick: 0, level: 0, step: 0, time: 0, phase: 'story', scene: 0, sceneReady: [], paused: false, search: 0, searching: false, bossDefeated: false, opened: [], zombies: [], bullets: [], turrets: [], drops: [], players: members.map((m, i) => {
      const c = getClass(m.classId);
      return { ...m, x: spawn.x + (i - (members.length - 1) / 2) * 55, y: spawn.y, angle: -Math.PI / 2, health: c.health, maxHealth: c.health, ammo: c.magazine, reload: 0, ability: 0, active: 0, dash: 0, dashTime: 0, shot: 0, hurt: 2, flash: 0, medkits: 3, scrap: 0, kills: 0, equipment: emptyEquipment(), notice: '', noticeTime: 0 };
    }) };
    this.checkpoint = structuredClone(this.state);
  }

  input(id: string, input: Control) {
    if (!this.state.players.some(p => p.id === id)) return;
    const previous = this.controls.get(id);
    if (previous && input.seq <= previous.input.seq) return;
    const allowed = this.state.phase === 'playing' && !this.state.paused;
    this.controls.set(id, { input: { ...input, actions: allowed ? [...(previous?.input.actions || []), ...input.actions].slice(0, 5) : [], fire: allowed && input.fire, x: allowed ? input.x : 0, y: allowed ? input.y : 0 }, at: this.clock });
  }

  remove(id: string) {
    this.state.players = this.state.players.filter(p => p.id !== id);
    this.state.bullets = this.state.bullets.filter(b => b.owner !== id);
    this.state.turrets = this.state.turrets.filter(t => t.owner !== id);
    this.controls.delete(id);
    if (this.state.phase === 'story') this.finishStory();
  }

  storyReady(id: string) {
    if (this.state.phase !== 'story' || !this.state.players.some(p => p.id === id)) return;
    if (!this.state.sceneReady.includes(id)) this.state.sceneReady.push(id);
    this.finishStory();
  }

  private finishStory() {
    const s = this.state;
    if (!s.players.length || !s.players.every(p => s.sceneReady.includes(p.id))) return;
    if (s.scene === 100) { s.phase = 'victory'; return; }
    if (s.scene > s.level) {
      s.level = s.scene; s.step = 0; s.opened = []; s.bossDefeated = false;
      const spawn = levelInfo(s.level).spawn;
      s.players.forEach((p, i) => { p.x = spawn.x + (i - (s.players.length - 1) / 2) * 55; p.y = spawn.y; });
    }
    s.phase = 'playing'; s.sceneReady = []; this.secureCheckpoint();
  }

  setPaused(paused: boolean) { this.state.paused = paused; this.clearInputs(); }
  private clearInputs() { for (const [id, control] of this.controls) this.controls.set(id, { input: { ...idleControl(), seq: control.input.seq }, at: this.clock }); }
  retry() {
    const connected = new Set(this.state.players.map(p => p.id));
    const tick = this.state.tick;
    this.state = structuredClone(this.checkpoint);
    this.state.players = this.state.players.filter(p => connected.has(p.id));
    this.state.phase = 'playing'; this.state.paused = false; this.state.tick = tick + 1;
    this.state.zombies = []; this.state.bullets = []; this.state.turrets = []; this.state.drops = [];
    this.state.searching = false; this.state.search = 0;
    this.clearInputs(); this.spawnTime = 4; this.encountered.clear();
    for (const p of this.state.players) this.notice(p, 'SQUAD RESTORED · Last receiver checkpoint');
  }

  private secureCheckpoint() {
    const s = this.state, target = s.step ? levelInfo(s.level).objectives[s.step - 1] : levelInfo(s.level).spawn;
    for (const [i, p] of s.players.entries()) {
      if (p.health <= 0) { p.x = target.x + i * 42; p.y = target.y + 140; }
      p.health = p.maxHealth; p.hurt = 2; p.reload = 0; p.ammo = getClass(p.classId).magazine;
      this.notice(p, 'RECEIVER CHECKPOINT · Squad healed and revived');
    }
    this.checkpoint = structuredClone(s);
    this.checkpoint.players.forEach((p, i) => { p.x = target.x + (i - (s.players.length - 1) / 2) * 48; p.y = target.y + (s.step ? 160 : 0); });
    this.spawnTime = 4;
  }

  target() { const s = this.state, info = levelInfo(s.level); return s.step < 3 ? info.objectives[s.step] : { ...info.exit, title: s.level === 99 ? 'Transmit the counter-signal together' : 'Gather the squad at the north gate' }; }
  private notice(p: CoopPlayer, text: string) { p.notice = text; p.noticeTime = 4; }
  private blocked(x: number, y: number, r: number) { return obstaclesNear(y).some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h); }
  private move(p: Point, dx: number, dy: number, r: number) {
    const info = levelInfo(this.state.level), x = clamp(p.x + dx, 38, JOURNEY_WORLD.width - 38), y = clamp(p.y + dy, info.top + (this.state.step < 3 ? 680 : 100) + r, info.bottom - 38);
    if (!this.blocked(x, p.y, r)) p.x = x;
    if (!this.blocked(p.x, y, r)) p.y = y;
  }

  private equip(p: CoopPlayer, seed: number, elite = false) {
    const gear = rollGear(this.state.level, seed, elite), old = p.equipment[gear.slot];
    if (!old || gear.power > old.power) {
      p.equipment[gear.slot] = gear;
      p.maxHealth = getClass(p.classId).health + (p.equipment.vest?.power || 0);
      if (gear.slot === 'vest' && p.health > 0) p.health = Math.min(p.maxHealth, p.health + gear.power - (old?.power || 0));
      this.notice(p, `${gear.rarity.toUpperCase()} · ${gear.name} equipped`);
    } else { p.scrap = Math.min(999, p.scrap + (gear.rarity === 'legendary' ? 5 : 1)); this.notice(p, `${gear.name} salvaged · +SCRAP`); }
  }

  private act(p: CoopPlayer, action: Action) {
    const c = getClass(p.classId), s = this.state;
    if (p.health <= 0) return;
    if (action === 'reload' && !p.reload && p.ammo < c.magazine) p.reload = c.reload;
    if (action === 'dash' && !p.dash) { p.dash = 2.2; p.dashTime = .18; }
    if (action === 'heal' && p.health < p.maxHealth) {
      if (p.medkits > 0) p.medkits--; else if (p.scrap >= 3) p.scrap -= 3; else { this.notice(p, 'Search supply cases for medkits or 3 scrap.'); return; }
      p.health = Math.min(p.maxHealth, p.health + 65);
    }
    if (action === 'ability' && !p.ability) {
      p.ability = c.cooldown;
      p.active = ({ assault: 6, medic: 1, engineer: 12, recon: 5, vanguard: 5, gunslinger: 5, pyro: 7, ranger: 7, scavenger: 8, cryo: 6 })[p.classId];
      if (p.classId === 'assault') p.reload = 0;
      if (p.classId === 'medic') for (const friend of s.players) if (friend.health > 0 && distance(friend, p) < 240) friend.health = Math.min(friend.maxHealth, friend.health + 55);
      if (p.classId === 'medic') for (const z of s.zombies) if (distance(z, p) < 190) { const a = Math.atan2(z.y - p.y, z.x - p.x); this.move(z, Math.cos(a) * 110, Math.sin(a) * 110, 20); }
      if (p.classId === 'engineer' && s.turrets.length < 12) s.turrets.push({ x: p.x, y: p.y, owner: p.id, time: 12, shot: 0, angle: p.angle });
      if (p.classId === 'gunslinger') for (let i = 0; i < 6; i++) this.shoot(p, p.angle + (i - 2.5) * .16);
      if (p.classId === 'pyro') for (const z of s.zombies) if (distance(z, p) < 280) this.damage(z, 150 * (1 + (p.equipment.weapon?.power || 0) / 100), p);
      if (p.classId === 'scavenger') { p.health = Math.min(p.maxHealth, p.health + 30); for (const drop of s.drops) if (distance(drop, p) < 850) { drop.x = p.x; drop.y = p.y; } }
    }
    if (action !== 'interact') return;
    const downed = s.players.find(friend => friend.health <= 0 && friend.id !== p.id && distance(friend, p) < 110);
    if (downed) {
      if (!p.medkits) { this.notice(p, 'Reviving a teammate costs one medkit.'); return; }
      p.medkits--; downed.health = Math.ceil(downed.maxHealth * .5); downed.hurt = 3; this.notice(downed, `${p.name} revived you!`); this.notice(p, `${downed.name} is back on their feet.`); return;
    }
    const cache = levelCaches(s.level).find(cache => !s.opened.includes(cache.id) && distance(cache, p) < 105);
    if (cache) {
      s.opened.push(cache.id);
      for (const friend of s.players) {
        this.equip(friend, s.level * 31 + Number(cache.id.split(':').pop()) + 1, cache.elite);
        friend.medkits = Math.min(9, friend.medkits + 1); friend.ammo = getClass(friend.classId).magazine; friend.reload = 0;
      }
      return;
    }
    if (distance(this.target(), p) > 145) return;
    if (s.step < 3) {
      if (s.step === 2 && levelInfo(s.level).boss && !s.bossDefeated) { this.notice(p, 'Defeat the relay guardian first.'); return; }
      s.searching = true;
    } else {
      if (!s.players.every(friend => friend.health <= 0 || distance(friend, this.target()) < 450)) { this.notice(p, 'Gather all standing teammates at the north gate.'); return; }
      s.phase = 'story'; s.scene = s.level + 1; s.sceneReady = []; s.searching = false; s.search = 0; s.zombies = []; s.bullets = []; s.turrets = []; s.drops = []; this.clearInputs();
    }
  }

  private shoot(p: CoopPlayer, angle: number, sentry?: Point) {
    const s = this.state, c = getClass(p.classId), count = p.classId === 'engineer' && !sentry ? 6 : 1, origin = sentry || p;
    for (let i = 0; i < count && s.bullets.length < 256; i++) {
      const a = angle + (Math.random() - .5) * (count > 1 ? .4 : .045), empowered = !sentry && p.active > 0 && ['gunslinger', 'ranger'].includes(p.classId);
      const critical = Math.random() * 100 < (p.equipment.charm?.power || 0);
      s.bullets.push({ id: this.serial++, owner: p.id, x: origin.x + Math.cos(a) * 31, y: origin.y + Math.sin(a) * 31, vx: Math.cos(a) * 1100, vy: Math.sin(a) * 1100, life: 1, damage: (sentry ? 20 : c.damage) * (1 + (p.equipment.weapon?.power || 0) / 100) * (empowered || critical ? 2 : 1), pierce: empowered, splash: !sentry && p.active > 0 && p.classId === 'pyro', hits: [] });
    }
    if (!sentry) p.flash = .07;
  }

  private spawn(near: Point, boss = false) {
    const s = this.state, info = levelInfo(s.level);
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2, d = 500 + Math.random() * 220, pos = { x: clamp(near.x + Math.cos(angle) * d, 40, JOURNEY_WORLD.width - 40), y: clamp(near.y + Math.sin(angle) * d, info.top + 740, info.bottom - 40) };
      if (this.blocked(pos.x, pos.y, 30) || s.players.some(p => p.health > 0 && distance(pos, p) < 300)) continue;
      const roll = Math.random(), kind = boss || s.level >= 3 && roll > .85 ? 'brute' : s.level >= 1 && roll > .59 ? 'runner' : 'zombie';
      const hp = boss ? (850 + s.level * 13) * (1 + (s.players.length - 1) * .35) : (kind === 'brute' ? 190 : kind === 'runner' ? 44 : 64) * (1 + s.level * .025);
      s.zombies.push({ ...pos, id: this.serial++, kind, hp, maxHp: hp, boss, angle: 0, attack: 0, speed: boss ? 104 : (kind === 'brute' ? 63 : kind === 'runner' ? 150 : 78) + Math.min(32, s.level * .35) }); return;
    }
  }

  private damage(z: Infected, amount: number, owner: CoopPlayer) {
    if (z.hp <= 0) return;
    z.hp = Math.max(0, z.hp - amount);
    if (z.hp > 0) return;
    owner.kills++;
    if (z.boss) { this.state.bossDefeated = true; for (const p of this.state.players) this.equip(p, this.state.level * 31 + 400, true); }
    if (this.state.drops.length < 80 && (owner.kills % 5 === 0 || Math.random() < .3)) this.state.drops.push({ x: z.x, y: z.y, kind: owner.kills % 5 === 0 ? 'cross' : owner.kills % 2 ? 'scrap' : 'ammo', time: 30 });
  }

  tick(dt: number) {
    dt = clamp(dt, 0, .05); this.clock += dt; this.state.tick++;
    const s = this.state;
    if (s.paused || s.phase !== 'playing') return;
    s.time += dt;
    for (const p of s.players) {
      for (const key of ['reload', 'ability', 'active', 'dash', 'dashTime', 'shot', 'hurt', 'flash', 'noticeTime'] as const) {
        const previous = p[key]; p[key] = Math.max(0, p[key] - dt);
        if (key === 'reload' && previous > 0 && !p.reload) p.ammo = getClass(p.classId).magazine;
      }
      if (!p.noticeTime) p.notice = '';
      const entry = this.controls.get(p.id), input = entry && this.clock - entry.at < .45 ? entry.input : idleControl();
      const actions = input.actions; input.actions = [];
      if (p.health <= 0) continue;
      for (const action of actions) { if (s.phase !== 'playing') break; this.act(p, action); }
      if (s.phase !== 'playing') return;
      const c = getClass(p.classId), len = Math.max(1, Math.hypot(input.x, input.y));
      const speed = c.speed * (1 + (p.equipment.boots?.power || 0) / 100) * (p.dashTime ? 3.7 : p.active && ['recon', 'scavenger'].includes(p.classId) ? 1.45 : 1);
      let dx = input.x / len, dy = input.y / len;
      if (p.dashTime && !dx && !dy) { dx = Math.cos(p.angle); dy = Math.sin(p.angle); }
      this.move(p, dx * speed * dt, dy * speed * dt, 18); p.angle = input.aim;
      if (input.autoAim && s.zombies.length) { const nearest = s.zombies.reduce((a, b) => distance(a, p) < distance(b, p) ? a : b); p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x); }
      if (input.fire && !p.shot && !p.reload) {
        const overdrive = p.classId === 'assault' && p.active > 0;
        if (p.ammo || overdrive) { this.shoot(p, p.angle); if (!overdrive) p.ammo--; p.shot = c.fireRate / (overdrive ? 2 : 1); }
        else p.reload = c.reload;
      }
    }
    const living = s.players.filter(p => p.health > 0);
    if (!living.length) { s.phase = 'defeat'; this.clearInputs(); return; }
    const target = this.target(), closest = (to: Point) => living.reduce((a, b) => distance(a, to) < distance(b, to) ? a : b);
    this.spawnTime -= dt;
    if (this.spawnTime <= 0) { if (s.zombies.length < Math.min(60, 10 + living.length * 5 + Math.floor(s.level / 8))) this.spawn(living[Math.floor(Math.random() * living.length)]); this.spawnTime = (s.searching ? 2.2 : 3.8) / (1 + (living.length - 1) * .4); }
    if (s.step < 3 && !this.encountered.has(s.step) && distance(closest(target), target) < 800) { this.encountered.add(s.step); for (let i = 0; i < 2 + living.length; i++) this.spawn(target); }
    if (levelInfo(s.level).boss && s.step === 2 && !s.bossDefeated && !s.zombies.some(z => z.boss) && distance(closest(target), target) < 850) this.spawn(target, true);
    if (s.searching) {
      if (!living.some(p => distance(p, target) < 160)) { s.search = 0; s.searching = false; }
      else { s.search = Math.min(SEARCH_SECONDS, s.search + dt); if (s.search >= SEARCH_SECONDS) { s.step++; s.search = 0; s.searching = false; this.secureCheckpoint(); } }
    }
    for (const z of s.zombies) {
      if (z.hp <= 0) continue;
      const p = closest(z), d = distance(z, p); z.angle = Math.atan2(p.y - z.y, p.x - z.x); z.attack = Math.max(0, z.attack - dt);
      const slow = living.some(friend => friend.classId === 'cryo' && friend.active > 0 && distance(friend, z) < 650);
      let vx = Math.cos(z.angle), vy = Math.sin(z.angle);
      for (const other of s.zombies) { const dd = distance(z, other); if (dd > 0 && dd < 37) { vx += (z.x - other.x) / dd * .65; vy += (z.y - other.y) / dd * .65; } }
      const speed = z.speed * (slow ? .12 : z.boss && Math.sin(s.time * .85) > .8 ? 2.2 : 1);
      if (d > 26) { const before = { x: z.x, y: z.y }; this.move(z, vx * speed * dt, vy * speed * dt, 17); if (distance(z, before) < speed * dt * .35) this.move(z, -Math.sin(z.angle) * speed * dt, Math.cos(z.angle) * speed * dt, 17); }
      if (d < (z.boss ? 62 : z.kind === 'brute' ? 43 : 32) && !z.attack && !p.hurt && !p.dashTime && !(p.active && ['recon', 'vanguard'].includes(p.classId))) {
        p.health = Math.max(0, p.health - (z.boss ? 32 : z.kind === 'brute' ? 25 : 12)); p.hurt = .65; z.attack = .9;
        if (!p.health) this.notice(p, 'DOWNED · A teammate can revive you with F + 1 medkit');
      }
    }
    for (const b of s.bullets) {
      b.life = Math.max(0, b.life - dt);
      const owner = s.players.find(p => p.id === b.owner); if (!owner) { b.life = 0; continue; }
      for (let i = 0; i < 3 && b.life > 0; i++) {
        b.x += b.vx * dt / 3; b.y += b.vy * dt / 3;
        if (b.x < 0 || b.x > JOURNEY_WORLD.width || b.y < 0 || b.y > JOURNEY_WORLD.height || this.blocked(b.x, b.y, 1)) { b.life = 0; break; }
        for (const z of s.zombies) if (z.hp > 0 && !b.hits.includes(z.id) && distance(z, b) < (z.boss ? 43 : z.kind === 'brute' ? 26 : 21)) {
          b.hits.push(z.id); this.damage(z, b.damage, owner);
          if (b.splash) for (const other of s.zombies) if (other.id !== z.id && distance(other, z) < 95) this.damage(other, b.damage * .65, owner);
          if (!b.pierce) { b.life = 0; break; }
        }
      }
    }
    s.zombies = s.zombies.filter(z => z.hp > 0 && (z.boss || distance(closest(z), z) < 1500)); s.bullets = s.bullets.filter(b => b.life > 0);
    for (const turret of s.turrets) {
      turret.time = Math.max(0, turret.time - dt); turret.shot = Math.max(0, turret.shot - dt);
      const owner = s.players.find(p => p.id === turret.owner), z = s.zombies.find(z => distance(z, turret) < 510);
      if (owner && z) { turret.angle = Math.atan2(z.y - turret.y, z.x - turret.x); if (!turret.shot) { this.shoot(owner, turret.angle, turret); turret.shot = .2; } }
    }
    s.turrets = s.turrets.filter(t => t.time > 0);
    for (const drop of s.drops) {
      drop.time -= dt;
      const p = living.find(p => distance(drop, p) < 40);
      if (!p) continue;
      if (drop.kind === 'cross') p.health = Math.min(p.maxHealth, p.health + 30); else if (drop.kind === 'ammo') { p.ammo = getClass(p.classId).magazine; p.reload = 0; } else p.scrap = Math.min(999, p.scrap + 1);
      drop.time = 0;
    }
    s.drops = s.drops.filter(p => p.time > 0 && distance(closest(p), p) < 1700);
    if (s.players.every(p => p.health <= 0)) { s.phase = 'defeat'; this.clearInputs(); }
  }
}
