import { ClassId, getClass } from './classes';

const cache = new Map<string, HTMLCanvasElement>();
export const WORLD = { width: 1920, height: 1280 };
export const OBSTACLES = [
  { x: 60, y: 65, w: 520, h: 260 }, { x: 1380, y: 55, w: 480, h: 290 },
  { x: 70, y: 1000, w: 430, h: 220 }, { x: 1440, y: 1010, w: 410, h: 210 },
  { x: 1270, y: 470, w: 85, h: 175 }, { x: 570, y: 840, w: 175, h: 80 },
  { x: 810, y: 330, w: 150, h: 35 }, { x: 1090, y: 930, w: 150, h: 35 },
];

export function random(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function canvas64(key: string, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d')!; ctx.imageSmoothingEnabled = false; draw(ctx); cache.set(key, c); return c;
}

export function portrait(id: ClassId, frame = 0) {
  return canvas64(`portrait-${id}-${frame}`, c => {
    const col = getClass(id).color;
    const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    const bob = frame % 2;
    c.translate(0, bob);
    r(15, 59, 38, 3, '#080e0d');
    // A 64 × 64 original survivor sprite, drawn on its native pixel grid.
    r(17, 24, 9, 23, '#171e1a'); r(15, 27, 5, 15, '#444936'); r(16, 29, 2, 10, '#68714d');
    r(25, 39, 10, 17, '#3c4436'); r(37, 39, 9, 18, '#303b31');
    r(26, 44, 3, 10, '#59604b'); r(38, 46, 3, 8, '#4c5745');
    r(24, 54, 12, 6, '#151e1c'); r(36, 55, 13, 5, '#111a18');
    r(24, 58, 12, 2, '#596052'); r(37, 58, 12, 2, '#424a40');
    r(23, 23, 25, 19, '#1b2520'); r(25, 25, 20, 14, '#4d5943');
    r(25, 25, 5, 12, '#727c54'); r(31, 26, 12, 12, '#384539');
    r(26, 26, 3, 4, col); r(32, 28, 5, 5, '#677054'); r(38, 28, 5, 5, '#626c50');
    r(32, 34, 5, 4, '#74765b'); r(38, 34, 5, 4, '#62694d'); r(24, 39, 23, 4, '#242b23');
    r(34, 40, 4, 3, '#a18c59');
    r(22, 25, 5, 12, col); r(44, 26, 6, 10, col); r(21, 31, 6, 8, '#a48e6b');
    r(23, 33, 7, 6, '#d1b18a'); r(44, 32, 7, 6, '#aa936d'); r(44, 36, 7, 4, '#252f27');
    r(28, 9, 16, 17, '#1c2723'); r(27, 12, 19, 8, '#a58c69');
    r(30, 18, 13, 7, '#bd9e75'); r(40, 17, 5, 6, '#89765b');
    r(29, 9, 16, 5, '#4b5944'); r(26, 13, 22, 5, '#5c684b');
    r(28, 10, 4, 4, '#7b835b'); r(30, 17, 14, 3, '#1e2c2a'); r(33, 18, 4, 1, '#90b2a1');
    r(27, 16, 3, 7, '#354737'); r(30, 22, 10, 3, '#3a4436');
    r(28, 34, 28, 5, '#141e1c'); r(35, 32, 16, 3, '#677267'); r(49, 34, 13, 2, '#929781');
    r(37, 37, 5, 8, '#26312b'); r(31, 35, 6, 3, '#c6a47c'); r(48, 35, 5, 4, '#a98c66');
    if (id === 'medic') {
      r(28, 9, 17, 7, '#b3b7a0'); r(35, 9, 3, 7, '#bd6551'); r(33, 11, 7, 3, '#bd6551');
      r(16, 28, 6, 11, '#9caa8b'); r(18, 31, 2, 5, '#c46149'); r(17, 32, 4, 2, '#c46149');
    }
    if (id === 'engineer') {
      r(27, 10, 19, 7, '#b58f43'); r(26, 15, 22, 3, '#d4ae5d'); r(33, 9, 4, 6, '#ddba68');
      r(25, 26, 3, 11, '#d1aa55'); r(42, 25, 3, 11, '#ac8c42'); r(16, 30, 3, 15, '#a58b53');
      r(48, 33, 14, 4, '#7d7357'); r(44, 38, 9, 3, '#7a5135');
    }
    if (id === 'recon') {
      r(26, 9, 20, 11, '#344c49'); r(29, 7, 13, 3, '#48645d'); r(28, 15, 17, 4, '#172724');
      r(31, 16, 11, 2, '#8ebaa5'); r(28, 22, 17, 5, '#607c70'); r(28, 25, 8, 3, '#405b51');
      r(33, 31, 26, 3, '#62776d'); r(42, 28, 8, 3, '#263c35'); r(59, 33, 5, 2, '#b8b8a0');
    }
  });
}

export function actor(kind: ClassId | 'zombie' | 'runner' | 'brute', frame = 0) {
  return canvas64(`actor-${kind}-${frame}`, c => {
    const infected = ['zombie', 'runner', 'brute'].includes(kind);
    const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    const step = frame % 4 < 2 ? 2 : -2;
    r(21 - step, 35, 10, 11, '#17221e'); r(32 + step, 35, 10, 11, '#1d2822');
    const body = infected ? kind === 'runner' ? '#76634b' : kind === 'brute' ? '#566448' : '#455648' : '#53604b';
    r(15, 22, 31, 18, '#16221c'); r(17, 23, 28, 14, body);
    r(18, 24, 8, 10, infected ? '#6c7760' : getClass(kind as ClassId).color);
    r(26, 27, 14, 13, infected ? '#35453a' : '#354635');
    r(28, 19, 19, 17, '#25352b'); r(29, 19, 16, 13, infected ? '#8c9a6b' : '#7a8961');
    r(30, 20, 7, 5, infected ? '#a4ad7c' : '#919b74'); r(40, 24, 7, 4, '#314132');
    if (infected) {
      r(42, 24, 4, 2, '#d2a361'); r(43, 28, 4, 3, '#602f27');
      r(33, 35, 20, 5, '#768a62'); r(32, 17, 19, 5, '#71835e');
      r(50, 35, 5, 5, '#a3a674'); r(48, 15, 5, 6, '#98a36d');
      r(22, 30, 4, 5, '#713f33');
    } else {
      r(33, 35, 16, 5, '#a68b68'); r(42, 22, 9, 5, '#ad926e');
      r(43, 29, 17, 5, '#172723'); r(48, 28, 10, 2, '#6e7b69'); r(58, 30, 6, 2, '#b6b49b');
      r(18, 24, 4, 11, '#86906a');
      if (kind === 'medic') { r(31, 21, 13, 8, '#b0b69a'); r(35, 21, 3, 8, '#b95d49'); r(32, 24, 10, 3, '#b95d49'); }
      if (kind === 'engineer') { r(30, 20, 15, 10, '#c2a151'); r(31, 21, 11, 3, '#e0bc66'); }
      if (kind === 'recon') { r(29, 19, 17, 14, '#46665d'); r(41, 24, 6, 3, '#9bb8a1'); }
    }
  });
}

export function uiIcon(type: 'cross' | 'ammo' | 'shield' | 'skull' | 'bolt') {
  return canvas64(`ui-${type}`, c => {
    const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    r(8, 8, 48, 48, '#17231e'); r(10, 10, 44, 44, '#25332a');
    if (type === 'cross') { r(25, 17, 14, 30, '#a6b994'); r(17, 25, 30, 14, '#a6b994'); r(27, 18, 3, 27, '#d1d8b2'); }
    if (type === 'ammo') for (let i = 0; i < 3; i++) { r(18 + i * 11, 23, 7, 23, '#b89b58'); r(20 + i * 11, 18, 3, 6, '#e0c384'); r(18 + i * 11, 39, 7, 3, '#786b44'); }
    if (type === 'shield') { r(18, 18, 28, 23, '#9ba990'); r(22, 40, 20, 5, '#9ba990'); r(28, 45, 8, 5, '#9ba990'); r(24, 22, 16, 16, '#344638'); }
    if (type === 'skull') { r(18, 17, 28, 25, '#c3c4aa'); r(23, 41, 18, 7, '#b0b39a'); r(22, 26, 7, 8, '#25332a'); r(35, 26, 7, 8, '#25332a'); r(30, 34, 4, 5, '#25332a'); r(27, 43, 3, 7, '#25332a'); r(35, 43, 3, 7, '#25332a'); }
    if (type === 'bolt') { c.fillStyle = '#e3ad62'; c.beginPath(); c.moveTo(33, 15); c.lineTo(20, 34); c.lineTo(30, 34); c.lineTo(26, 49); c.lineTo(45, 27); c.lineTo(34, 27); c.closePath(); c.fill(); }
  });
}

export function terrain() {
  if (cache.has('terrain')) return cache.get('terrain')!;
  const c = document.createElement('canvas'); c.width = WORLD.width; c.height = WORLD.height;
  const ctx = c.getContext('2d')!; const rand = random(739);
  const r = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.floor(x), Math.floor(y), w, h); };
  r(0, 0, c.width, c.height, '#27332c');
  for (let y = 0; y < c.height; y += 64) for (let x = 0; x < c.width; x += 64) {
    r(x + 1, y + 1, 62, 62, ['#2d3830', '#2b362f', '#2a352e'][Math.floor(rand() * 3)]);
    if (rand() > .5) r(x + 5, y + 58, 50, 2, '#354036');
  }
  r(0, 397, c.width, 440, '#232d29'); r(660, 0, 445, c.height, '#232d29');
  r(0, 386, 660, 10, '#5b604b'); r(1110, 386, 810, 10, '#5b604b');
  r(0, 839, 655, 10, '#535d48'); r(1110, 839, 810, 10, '#535d48');
  r(645, 0, 10, 386, '#535d48'); r(1110, 0, 10, 386, '#535d48');
  r(645, 848, 10, 432, '#535d48'); r(1110, 848, 10, 432, '#535d48');
  for (let x = 24; x < c.width; x += 120) { r(x, 608, 64, 4, '#646248'); r(x, 618, 64, 4, '#4b4d3a'); }
  for (let y = 20; y < c.height; y += 120) { if (y > 390 && y < 845) continue; r(880, y, 4, 64, '#646248'); }
  for (let x = 700; x < 1080; x += 52) { r(x, 433, 25, 55, '#6d7058'); r(x, 755, 25, 55, '#6d7058'); }
  for (let i = 0; i < 9500; i++) { const x = rand() * c.width, y = rand() * c.height; r(x, y, rand() > .95 ? 6 : 2, 2, rand() > .5 ? '#384139' : '#202b25'); }
  for (let i = 0; i < 100; i++) {
    const x = rand() * c.width, y = rand() * c.height;
    ctx.strokeStyle = '#19241e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y + 13); ctx.lineTo(x + 11, y + 31); ctx.lineTo(x + 28, y + 38); ctx.stroke();
  }
  const building = (x: number, y: number, w: number, h: number) => {
    r(x + 12, y + 20, w, h, '#131e19'); r(x, y, w, h, '#455044');
    r(x, y, w, 9, '#79806a'); r(x, y, 8, h, '#666f59'); r(x + w - 8, y, 8, h, '#1d2b23'); r(x, y + h - 9, w, 9, '#18271f');
    r(x + 14, y + 16, w - 28, h - 37, '#354138');
    for (let xx = x + 22; xx < x + w - 30; xx += 44) { r(xx, y + h - 8, 22, 9, '#14251f'); r(xx + 2, y + h - 6, 17, 3, rand() > .6 ? '#bda16b' : '#506659'); }
    for (let i = 0; i < 4; i++) { const xx = x + 30 + i * 94; r(xx, y + 30, 61, 52, '#26372d'); r(xx, y + 30, 59, 5, '#6f7860'); for (let j = 0; j < 5; j++) r(xx + 8, y + 40 + j * 6, 43, 2, '#1b2c23'); }
    r(x + w - 97, y + 115, 65, 70, '#4c5645'); r(x + w - 94, y + 119, 59, 62, '#2d3c31');
    ctx.strokeStyle = '#66705a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w - 65, y + 150, 22, 0, Math.PI * 2); ctx.stroke();
  };
  for (const o of OBSTACLES.slice(0, 4)) building(o.x, o.y, o.w, o.h);
  const car = (x: number, y: number, angle: number, col: string) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    r(-43, -80, 91, 180, '#14211b'); r(-44, -60, 9, 32, '#111b17'); r(35, -60, 9, 32, '#111b17'); r(-44, 40, 9, 32, '#111b17'); r(35, 40, 9, 32, '#111b17');
    r(-37, -82, 74, 168, col); r(-32, -76, 64, 43, '#667363'); r(-29, -30, 58, 39, '#162f2b'); r(-25, -26, 49, 4, '#729080');
    r(-29, 13, 58, 43, col); r(-27, 59, 54, 17, '#253c32'); r(-36, 80, 72, 6, '#9a9b7b');
    r(-31, -81, 15, 5, '#d9c491'); r(16, -81, 15, 5, '#d9c491'); r(-32, 78, 12, 5, '#9c4c36'); r(21, 78, 12, 5, '#9c4c36');
    r(8, -50, 13, 22, '#35483a'); r(-7, 20, 9, 14, '#7a6549'); ctx.restore();
  };
  car(1312, 555, 0, '#515d49'); car(657, 880, Math.PI / 2, '#766448');
  car(1575, 745, -.13, '#3c5148'); car(360, 570, .22, '#57483a');
  for (const o of OBSTACLES.slice(6)) {
    r(o.x + 5, o.y + 7, o.w, o.h, '#131f19'); r(o.x, o.y, o.w, o.h, '#8b8153');
    for (let i = 0; i < o.w; i += 30) { r(o.x + i, o.y + 5, 14, o.h - 10, '#303b2d'); }
    r(o.x, o.y, o.w, 4, '#beb084'); r(o.x, o.y + o.h - 4, o.w, 4, '#4d553c');
  }
  for (let i = 0; i < 170; i++) {
    const x = rand() * c.width, y = rand() * c.height;
    if (x > 660 && x < 1110 || y > 397 && y < 837) continue;
    for (let j = 0; j < 6; j++) { const xx = x + rand() * 28, yy = y + rand() * 24; r(xx, yy, 4, 3 + rand() * 7, ['#465940', '#536442', '#354b37'][j % 3]); }
  }
  for (const [x, y] of [[1170, 370], [535, 945], [1370, 370], [1175, 1000]]) {
    r(x + 4, y + 4, 26, 35, '#18261f'); r(x, y, 25, 32, '#664e34'); r(x, y + 4, 25, 3, '#9b7750'); r(x, y + 24, 25, 3, '#372f24');
  }
  ctx.save(); ctx.translate(1230, 795); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#7e8060'; ctx.font = 'bold 28px monospace'; ctx.fillText('EVAC →', 0, 0); ctx.restore();
  for (let i = 0; i < 35; i++) { const x = 200 + rand() * 1500, y = 400 + rand() * 440; r(x, y, 8 + rand() * 16, 3, '#553a2b'); r(x + 7, y - 4, 5, 12, '#4a3529'); }
  cache.set('terrain', c); return c;
}

export function drawActor(ctx: CanvasRenderingContext2D, kind: ClassId | 'zombie' | 'runner' | 'brute', x: number, y: number, angle: number, frame: number, scale = 1, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = '#08110c88'; ctx.beginPath(); ctx.ellipse(2, 7, 22 * scale, 13 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(angle); ctx.drawImage(actor(kind, frame), -32 * scale, -32 * scale, 64 * scale, 64 * scale); ctx.restore();
}
