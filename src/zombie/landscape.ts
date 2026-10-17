import { JOURNEY_WORLD as WORLD, LEVEL_HEIGHT, REGIONS } from './campaign';
import { random } from './art';

export const CHUNK_HEIGHT = 768;
type Obstacle = { x: number; y: number; w: number; h: number };
const chunks = new Map<number, HTMLCanvasElement>();
const collisions = new Map<number, Obstacle[]>();
export function obstaclesForChunk(index: number): Obstacle[] {
  if (collisions.has(index)) return collisions.get(index)!;
  const seed = random(index * 389 + 73), y = index * CHUNK_HEIGHT;
  const level = Math.min(99, Math.max(0, Math.floor((WORLD.height - y - 1) / LEVEL_HEIGHT)));
  const kind = REGIONS[Math.floor(level / 5)].kind;
  const obstacles = kind === 'forest' || kind === 'snow' || kind === 'farm' ? Array.from({ length: 14 }, (_, i) => ({ x: i % 2 ? 1950 + seed() * 460 : 65 + seed() * 550, y: y + 45 + seed() * 600, w: 48, h: 48 })) : [{ x: 90 + seed() * 50, y: y + 90, w: 510, h: 260 }, { x: 1950, y: y + 430, w: 480, h: 240 }];
  collisions.set(index, obstacles); while (collisions.size > 12) collisions.delete(collisions.keys().next().value!);
  return obstacles;
}
export function obstaclesNear(y: number) {
  const index = Math.floor(y / CHUNK_HEIGHT);
  return [index - 1, index, index + 1].filter(n => n >= 0 && n * CHUNK_HEIGHT < WORLD.height).flatMap(obstaclesForChunk);
}
function chunk(index: number) {
  if (chunks.has(index)) return chunks.get(index)!;
  const canvas = document.createElement('canvas'); canvas.width = WORLD.width; canvas.height = CHUNK_HEIGHT;
  const c = canvas.getContext('2d')!, seed = random(index * 389 + 73);
  const y0 = index * CHUNK_HEIGHT;
  const level = Math.min(99, Math.max(0, Math.floor((WORLD.height - y0 - 1) / LEVEL_HEIGHT))), region = REGIONS[Math.floor(level / 5)];
  const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
  r(0, 0, WORLD.width, CHUNK_HEIGHT, region.ground);
  if (region.kind === 'flood') { r(0, 0, 700, CHUNK_HEIGHT, '#1f3741'); r(1860, 0, 700, CHUNK_HEIGHT, '#1f3741'); for (let i = 0; i < 80; i++) r(seed() < .5 ? seed() * 650 : 1900 + seed() * 650, seed() * CHUNK_HEIGHT, 25 + seed() * 70, 2, '#7da1a630'); }
  r(960, 0, 640, CHUNK_HEIGHT, region.road); r(948, 0, 7, CHUNK_HEIGHT, region.accent + '55'); r(1605, 0, 7, CHUNK_HEIGHT, region.accent + '55');
  for (let y = -(y0 % 150); y < CHUNK_HEIGHT; y += 150) { r(1274, y, 4, 70, region.accent + '65'); r(1283, y, 4, 70, region.accent + '35'); }
  if (region.kind === 'rail') for (const x of [760, 820, 1740, 1800]) { r(x, 0, 4, CHUNK_HEIGHT, '#9c9e8b'); for (let y = 0; y < CHUNK_HEIGHT; y += 45) r(x - 8, y, 24, 6, '#77664e'); }
  if (region.kind === 'farm') for (let x = 40; x < 740; x += 44) { r(x, 0, 13, CHUNK_HEIGHT, '#877b4855'); r(WORLD.width - x, 0, 13, CHUNK_HEIGHT, '#877b4855'); }
  for (let i = 0; i < 1100; i++) r(seed() * WORLD.width, seed() * CHUNK_HEIGHT, seed() > .9 ? 8 : 2, 2, seed() > .5 ? '#d5d5b50c' : '#050e0d24');
  for (const o of obstaclesForChunk(index)) {
    const y = o.y - y0;
    if (o.w === 48) {
      r(o.x + 20, y + 25, 10, 32, '#272b20'); r(o.x - 8, y - 15, 65, 52, '#132b24'); r(o.x, y - 24, 48, 48, region.kind === 'snow' ? '#b0c7bc' : '#3c5b3f'); r(o.x + 11, y - 26, 23, 20, region.kind === 'snow' ? '#d3e0d4' : '#58774b');
    } else {
      r(o.x + 14, y + 16, o.w, o.h, '#0d201b77'); r(o.x, y, o.w, o.h, region.kind === 'lab' ? '#657c75' : '#536054'); r(o.x, y, o.w, 10, region.accent); r(o.x + 12, y + 18, o.w - 24, o.h - 35, region.kind === 'lab' ? '#374e4b' : '#39473d');
      for (let x = o.x + 25; x < o.x + o.w - 30; x += 54) { r(x, y + o.h - 14, 30, 8, '#162b26'); r(x + 2, y + o.h - 12, 25, 3, seed() > .65 ? region.accent : '#526c60'); }
      r(o.x + 35, y + 40, 70, 55, '#243b33'); for (let j = 0; j < 5; j++) r(o.x + 42, y + 46 + j * 8, 55, 3, '#83908055');
      if (region.kind === 'lab') { r(o.x + o.w - 100, y + 50, 46, 13, '#9bc3b5'); r(o.x + o.w - 84, y + 34, 14, 46, '#9bc3b5'); }
      if (region.kind === 'industrial') { r(o.x + 155, y + 25, 30, 100, '#8b795d'); r(o.x + 220, y + 25, 30, 100, '#726951'); }
    }
  }
  if (index % 3 === 0) {
    const x = index % 2 ? 1400 : 1080, y = 360;
    r(x - 33, y - 64, 70, 140, '#101e19'); r(x - 28, y - 66, 56, 133, index % 4 ? '#566657' : '#8b7650'); r(x - 24, y - 30, 48, 31, '#1b3430'); r(x - 21, y - 26, 42, 3, '#8ca28b'); r(x - 25, y + 43, 50, 17, '#243a31'); r(x - 27, y - 64, 10, 5, '#d3c08c'); r(x + 17, y - 64, 10, 5, '#d3c08c');
  }
  if (index % 5 === 0) { c.fillStyle = region.accent + '70'; c.font = 'bold 20px monospace'; c.fillText('↑ NORTH / ' + String(level + 1).padStart(3, '0'), 1120, 170); }
  chunks.set(index, canvas);
  while (chunks.size > 6) chunks.delete(chunks.keys().next().value!);
  return canvas;
}
export function drawLandscape(ctx: CanvasRenderingContext2D, cameraY: number, viewHeight: number) {
  const first = Math.max(0, Math.floor((cameraY - viewHeight / 2) / CHUNK_HEIGHT));
  const last = Math.min(Math.ceil(WORLD.height / CHUNK_HEIGHT) - 1, Math.floor((cameraY + viewHeight / 2) / CHUNK_HEIGHT));
  for (let i = first; i <= last; i++) ctx.drawImage(chunk(i), 0, i * CHUNK_HEIGHT);
}
