import * as THREE from 'three';
import { CharacterConfig } from '../types/game';

/**
 * 64x64 Procedural Pixel Art Texture Factory
 * Generates true 64x64 retro sprites, mobs, bosses, and customizable player textures.
 * Uses NearestFilter for razor-sharp pixel edges. Zero external 404 image dependencies.
 */

function setupTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 64x64 Dungeon Floor Stone Bricks
export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 64, 64);

  const rowH = 16;
  const colors = ['#475569', '#3e4c62', '#435166', '#526179'];

  for (let r = 0; r < 4; r++) {
    const y = r * rowH;
    const offset = (r % 2) * 16;
    for (let c = -1; c < 3; c++) {
      const x = c * 32 + offset;
      const color = colors[(r + c + 4) % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, 30, 14);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(x + 1, y + 1, 30, 1.5);
      ctx.fillRect(x + 1, y + 1, 1.5, 14);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(x + 1, y + 13.5, 30, 1.5);
      ctx.fillRect(x + 29.5, y + 1, 1.5, 14);

      for (let i = 0; i < 8; i++) {
        const nx = x + 2 + Math.floor(Math.random() * 26);
        const ny = y + 2 + Math.floor(Math.random() * 10);
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(nx, ny, 2, 2);
      }
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, y, 64, 1.5);
  }

  // Ancient moss
  ctx.fillStyle = '#10b981';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(8, 12, 3, 2);
  ctx.fillRect(9, 14, 2, 2);
  ctx.fillRect(44, 36, 4, 3);
  ctx.globalAlpha = 1.0;

  return setupTexture(canvas);
}

// 64x64 Dungeon Wall Masonry
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#263143';
  ctx.fillRect(0, 0, 64, 64);

  const colors = ['#384457', '#313d4f', '#415066'];
  for (let y = 0; y < 64; y += 16) {
    const shift = (y / 16) % 2 === 0 ? 0 : 16;
    for (let x = -16; x < 64; x += 32) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(x + shift + 1, y + 1, 30, 14);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x + shift + 1, y + 1, 30, 1.5);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(x + shift + 1, y + 13.5, 30, 1.5);
      ctx.fillRect(x + shift + 29.5, y + 1, 1.5, 14);
    }
  }

  // Glowing fraction rune
  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(28, 22, 2, 6);
  ctx.fillRect(24, 30, 14, 2);
  ctx.fillRect(26, 34, 8, 2);
  ctx.fillRect(32, 36, 2, 2);
  ctx.fillRect(26, 38, 8, 2);
  ctx.globalAlpha = 1.0;

  return setupTexture(canvas);
}

// 64x64 TRUE CUSTOMIZABLE PLAYER SPRITE
export function createCustomPlayerTexture(config: CharacterConfig, animFrame = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const bob = animFrame % 2 === 1 ? 1 : 0;
  const robeColor = config.robeColor || '#2563eb';

  // Skin tone lookup
  const skinColors: Record<string, string> = {
    fair: '#fed7aa',
    tan: '#f59e0b',
    bronze: '#b45309',
    dark: '#451a03',
    goblin: '#4ade80',
    pale: '#e2e8f0',
  };
  const skinColor = skinColors[config.skinTone || 'fair'] || '#fed7aa';

  // Back Cape (if cape accessory chosen)
  if (config.accessory === 'cape') {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(16, 32 + bob, 32, 24);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(18, 34 + bob, 28, 20);
  }

  // 1. Wizard Cloak / Robe Body
  ctx.fillStyle = robeColor;
  ctx.fillRect(20, 32 + bob, 24, 22);
  // Cloak hem highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(22, 34 + bob, 20, 2);
  ctx.fillRect(20, 32 + bob, 2, 22);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(42, 32 + bob, 2, 22);

  // 2. Leather Belt & Golden Buckle
  ctx.fillStyle = '#78350f';
  ctx.fillRect(20, 44 + bob, 24, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(30, 43 + bob, 4, 5);

  // Mini Elemental Flasks on Belt (Fire, Frost, Lightning)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(22, 47 + bob, 3, 4);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(27, 47 + bob, 3, 4);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(39, 47 + bob, 3, 4);

  // 3. Boots
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(23, 54 + bob, 6, 7);
  ctx.fillRect(35, 54 + bob, 6, 7);
  ctx.fillStyle = '#334155';
  ctx.fillRect(23, 59 + bob, 7, 2);
  ctx.fillRect(35, 59 + bob, 7, 2);

  // 4. Head & Face
  ctx.fillStyle = skinColor;
  ctx.fillRect(24, 18 + bob, 16, 14);

  // Tousled Hair (under hat or visible if no hat)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(23, 16 + bob, 18, 4);
  ctx.fillRect(22, 18 + bob, 3, 8);
  ctx.fillRect(39, 18 + bob, 3, 8);

  // Eyes & Eyebrows
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(27, 24 + bob, 3, 3);
  ctx.fillRect(34, 24 + bob, 3, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(27, 24 + bob, 1, 1);
  ctx.fillRect(34, 24 + bob, 1, 1);

  // 5. Headwear Customization
  const hat = config.hatStyle || 'wizard';
  if (hat === 'crown') {
    // Golden Crown of Wholes with ruby gem
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 12 + bob, 20, 6);
    ctx.fillRect(22, 8 + bob, 4, 5);
    ctx.fillRect(30, 6 + bob, 4, 7);
    ctx.fillRect(38, 8 + bob, 4, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(31, 13 + bob, 2, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(23, 9 + bob, 2, 2);
    ctx.fillRect(39, 9 + bob, 2, 2);
  } else if (hat === 'cowl') {
    // Alchemist Cowl / Hood
    ctx.fillStyle = robeColor;
    ctx.fillRect(20, 14 + bob, 24, 7);
    ctx.fillRect(22, 8 + bob, 20, 8);
    ctx.fillRect(26, 4 + bob, 12, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(22, 19 + bob, 20, 2);
  } else if (hat === 'hood') {
    // Shadow Rogue Hood
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 12 + bob, 24, 10);
    ctx.fillRect(24, 6 + bob, 16, 8);
    ctx.fillStyle = robeColor;
    ctx.fillRect(28, 14 + bob, 8, 2);
  } else if (hat === 'helmet') {
    // Steel Knight Helmet with gold trim
    ctx.fillStyle = '#64748b';
    ctx.fillRect(20, 10 + bob, 24, 14);
    ctx.fillRect(24, 6 + bob, 16, 5);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(22, 12 + bob, 20, 3);
    // Dark Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 21 + bob, 16, 3);
    // Red Plume Crest
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(30, 2 + bob, 4, 6);
    ctx.fillRect(28, 4 + bob, 8, 3);
  } else if (hat === 'headband') {
    // Ninja Headband with long tails
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(22, 19 + bob, 20, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(30, 19 + bob, 4, 4); // Metal clan emblem
    // Trailing ribbon tails
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(17, 21 + bob, 5, 2);
    ctx.fillRect(15, 23 + bob, 4, 3);
    ctx.fillRect(13, 26 + bob, 4, 4);
  } else if (hat === 'horns') {
    // Fiery Demon Horns
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(22, 8 + bob, 4, 10);
    ctx.fillRect(20, 4 + bob, 4, 6);
    ctx.fillRect(38, 8 + bob, 4, 10);
    ctx.fillRect(40, 4 + bob, 4, 6);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(21, 5 + bob, 2, 4);
    ctx.fillRect(41, 5 + bob, 2, 4);
  } else if (hat === 'catears') {
    // Cute Neko Cat Ears
    ctx.fillStyle = robeColor;
    ctx.fillRect(22, 8 + bob, 6, 8);
    ctx.fillRect(24, 5 + bob, 4, 4);
    ctx.fillRect(36, 8 + bob, 6, 8);
    ctx.fillRect(36, 5 + bob, 4, 4);
    ctx.fillStyle = '#f472b6'; // Pink inside
    ctx.fillRect(24, 9 + bob, 3, 5);
    ctx.fillRect(37, 9 + bob, 3, 5);
  } else if (hat === 'halo') {
    // Golden Angelic Halo
    ctx.fillStyle = '#fde047';
    ctx.fillRect(24, 4 + bob, 16, 3);
    ctx.fillRect(22, 6 + bob, 3, 3);
    ctx.fillRect(39, 6 + bob, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(28, 4 + bob, 8, 2);
  } else if (hat === 'none') {
    // Wild Wizard Hair
    ctx.fillStyle = '#b45309';
    ctx.fillRect(22, 12 + bob, 20, 6);
    ctx.fillRect(26, 8 + bob, 12, 5);
    ctx.fillRect(20, 16 + bob, 4, 8);
    ctx.fillRect(40, 16 + bob, 4, 8);
  } else {
    // Classic Pointed Wizard Hat
    ctx.fillStyle = robeColor;
    ctx.fillRect(16, 17 + bob, 32, 4); // Wide Brim
    ctx.fillRect(22, 11 + bob, 20, 6);
    ctx.fillRect(26, 5 + bob, 12, 6);
    ctx.fillRect(30, 1 + bob, 5, 5);
    // Gold Hat Band
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 15 + bob, 20, 2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(30, 14 + bob, 4, 4); // Buckle
  }

  // 6. Accessory Customization
  const acc = config.accessory || 'none';
  if (acc === 'spectacles') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(26, 23 + bob, 5, 5);
    ctx.fillRect(33, 23 + bob, 5, 5);
    ctx.fillRect(30, 25 + bob, 4, 1);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(27, 24 + bob, 3, 3);
    ctx.fillRect(34, 24 + bob, 3, 3);
  } else if (acc === 'monocle') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(33, 23 + bob, 6, 6);
    ctx.fillRect(39, 26 + bob, 4, 1);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(34, 24 + bob, 4, 4);
  } else if (acc === 'visor') {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(25, 23 + bob, 14, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(27, 24 + bob, 4, 1);
  } else if (acc === 'amulet') {
    // Eye of Wholes Glowing Amulet
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(29, 36 + bob, 6, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(31, 38 + bob, 2, 2);
  } else if (acc === 'shield') {
    // Buckler Shield in Left Hand
    ctx.fillStyle = '#475569';
    ctx.fillRect(12, 34 + bob, 8, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(14, 37 + bob, 4, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(15, 39 + bob, 2, 2);
  } else if (acc === 'fairy') {
    // Floating Pixie Companion near shoulder
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(12, 14 + (bob === 1 ? 0 : 2), 4, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(10, 12 + (bob === 1 ? 0 : 2), 3, 4);
    ctx.fillRect(15, 12 + (bob === 1 ? 0 : 2), 3, 4);
  }

  // 7. Weapon / Catalyst Customization
  const wand = config.wandStyle || 'wood';
  if (wand === 'crystal') {
    // Crystal Staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(45, 18 + bob, 3, 34);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(43, 10 + bob, 7, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(45, 12 + bob, 3, 3);
  } else if (wand === 'gold') {
    // Golden Relic Blade
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(45, 16 + bob, 4, 24);
    ctx.fillRect(43, 40 + bob, 8, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(45, 43 + bob, 4, 5);
  } else if (wand === 'sword') {
    // Knight Steel Broadsword
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(46, 12 + bob, 3, 28);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(47, 10 + bob, 1, 28);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(43, 40 + bob, 9, 3); // Crossguard
    ctx.fillStyle = '#78350f';
    ctx.fillRect(46, 43 + bob, 3, 5); // Hilt
  } else if (wand === 'potion') {
    // Bubbling Alchemist Flask
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(44, 28 + bob, 6, 10);
    ctx.fillRect(46, 24 + bob, 2, 4);
    ctx.fillStyle = '#10b981'; // Green potion bubbling
    ctx.fillRect(45, 31 + bob, 4, 6);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(46, 32 + bob, 2, 2);
  } else if (wand === 'scythe') {
    // Void Reaper Scythe
    ctx.fillStyle = '#334155';
    ctx.fillRect(46, 12 + bob, 3, 38);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(36, 8 + bob, 12, 4);
    ctx.fillRect(32, 10 + bob, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(34, 11 + bob, 2, 2);
  } else if (wand === 'book') {
    // Ancient Floating Spellbook Grimoire
    ctx.fillStyle = '#831843';
    ctx.fillRect(44, 26 + bob, 8, 10);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(46, 27 + bob, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(47, 28 + bob, 2, 4);
  } else {
    // Classic Wooden Oak Wand
    ctx.fillStyle = '#a16207';
    ctx.fillRect(45, 24 + bob, 3, 22);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(44, 21 + bob, 5, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(45, 22 + bob, 2, 2);
  }

  const tex = setupTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 64x64 ENHANCED SLIME SPRITE
export function createSlime64Texture(colorHex = '#10b981', animFrame = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const squash = animFrame % 2 === 1 ? 2 : 0;

  // Slime Body Dome
  ctx.fillStyle = colorHex;
  ctx.fillRect(16, 26 + squash, 32, 24 - squash);
  ctx.fillRect(20, 20 + squash, 24, 8);
  ctx.fillRect(12, 34 + squash, 40, 16 - squash);

  // Shiny Glass Highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(22, 24 + squash, 14, 4);
  ctx.fillRect(16, 30 + squash, 6, 4);

  // Big Cute Eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(22, 36 + squash, 5, 8);
  ctx.fillRect(37, 36 + squash, 5, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(23, 37 + squash, 2, 3);
  ctx.fillRect(38, 37 + squash, 2, 3);

  // Floating Fraction Core Inside Slime (1/2 symbol visible inside!)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(30, 42 + squash, 4, 1); // fraction bar

  return setupTexture(canvas);
}

// 64x64 STONE GOLEM SPRITE
export function createGolem64Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  // Head Boulder
  ctx.fillStyle = '#475569';
  ctx.fillRect(22, 8, 20, 16);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(24, 10, 16, 3);

  // Glowing Amethyst Crystal Eye
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(28, 14, 8, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(30, 15, 4, 2);

  // Massive Torso & Runic Plates
  ctx.fillStyle = '#334155';
  ctx.fillRect(14, 24, 36, 24);
  ctx.fillStyle = '#475569';
  ctx.fillRect(18, 26, 28, 6);

  // Pulsating Amethyst Chest Core (Divided into 3 fraction segments)
  ctx.fillStyle = '#a855f7';
  ctx.fillRect(26, 32, 12, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(28, 35, 8, 3);

  // Heavy Rock Arms
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(6, 26, 8, 24);
  ctx.fillRect(50, 26, 8, 24);

  // Legs
  ctx.fillStyle = '#334155';
  ctx.fillRect(18, 48, 10, 14);
  ctx.fillRect(36, 48, 10, 14);

  return setupTexture(canvas);
}

// 64x64 BOSS 1: THE VOID GORGON
export function createGorgonBoss64Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  // Serpentine Snake Hair / Crowns
  ctx.fillStyle = '#10b981';
  ctx.fillRect(20, 2, 24, 8);
  ctx.fillRect(14, 6, 8, 12);
  ctx.fillRect(42, 6, 8, 12);
  ctx.fillRect(10, 14, 6, 10);
  ctx.fillRect(48, 14, 6, 10);
  // Red Snake Eyes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(16, 8, 2, 2);
  ctx.fillRect(46, 8, 2, 2);

  // Gorgon Face
  ctx.fillStyle = '#a7f3d0';
  ctx.fillRect(24, 16, 16, 14);

  // Petrifying Yellow Gaze Eyes
  ctx.fillStyle = '#eab308';
  ctx.fillRect(26, 20, 4, 4);
  ctx.fillRect(34, 20, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(27, 21, 2, 2);
  ctx.fillRect(35, 21, 2, 2);

  // Dark Mystic Robe Torso
  ctx.fillStyle = '#4c1d95';
  ctx.fillRect(20, 30, 24, 18);
  ctx.fillStyle = '#6d28d9';
  ctx.fillRect(24, 32, 16, 4);

  // Massive Coiled Serpentine Tail
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(12, 48, 40, 14);
  ctx.fillRect(16, 44, 32, 6);
  ctx.fillStyle = '#047857';
  ctx.fillRect(18, 50, 28, 4);

  return setupTexture(canvas);
}

// 64x64 FINAL BOSS: THE FRACTION COLOSSUS
export function createBoss64Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  // Horned Crown of Wholes
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 4, 24, 4);
  ctx.fillRect(16, 2, 6, 6);
  ctx.fillRect(42, 2, 6, 6);
  ctx.fillRect(28, 0, 8, 4);

  // Monolithic Titan Face
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(18, 8, 28, 18);
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, 9, 24, 3);

  // Glowing Molten Core Eyes
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(22, 14, 5, 3);
  ctx.fillRect(37, 14, 5, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(24, 15, 2, 1);
  ctx.fillRect(39, 15, 2, 1);

  // Colossal Obsidian Armor
  ctx.fillStyle = '#090d16';
  ctx.fillRect(12, 26, 40, 26);

  // Fractional 4-Quadrant Power Matrix on Chest
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(22, 30, 8, 8); // Top-left
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(34, 30, 8, 8); // Top-right
  ctx.fillStyle = '#10b981';
  ctx.fillRect(22, 40, 8, 8); // Bottom-left
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(34, 40, 8, 8); // Bottom-right

  // Division Grid Bars
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(31, 29, 2, 20);
  ctx.fillRect(21, 39, 22, 2);

  // Pauldrons
  ctx.fillStyle = '#475569';
  ctx.fillRect(6, 24, 8, 18);
  ctx.fillRect(50, 24, 8, 18);

  // Pedestal
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(16, 52, 32, 10);

  return setupTexture(canvas);
}

// 64x64 SHADOW WRAITH SPRITE
export function createShadowWraith64Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  // Floating Spectral Hood
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(20, 8, 24, 16);
  ctx.fillRect(24, 4, 16, 8);

  // Piercing Violet Eyes
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(25, 14, 4, 4);
  ctx.fillRect(35, 14, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(26, 15, 2, 2);
  ctx.fillRect(36, 15, 2, 2);

  // Shrouded Ethereal Body
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, 24, 32, 24);
  ctx.fillRect(12, 32, 8, 16); // Ghost arms
  ctx.fillRect(44, 32, 8, 16);

  // Spectral Tendril Tails
  ctx.fillStyle = '#312e81';
  ctx.fillRect(18, 48, 6, 12);
  ctx.fillRect(28, 48, 8, 15);
  ctx.fillRect(40, 48, 6, 12);

  return setupTexture(canvas);
}

// 64x64 CARVED STAIRCASE ASCENT TILES
export function createStairsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 64, 64);

  // 4 Graduated Stone Steps Ascending Upwards
  const steps = [
    { y: 48, h: 14, color: '#334155', hi: '#64748b' },
    { y: 34, h: 14, color: '#3e4c62', hi: '#94a3b8' },
    { y: 20, h: 14, color: '#475569', hi: '#cbd5e1' },
    { y: 6, h: 14, color: '#526078', hi: '#f1f5f9' },
  ];

  steps.forEach((step) => {
    ctx.fillStyle = step.color;
    ctx.fillRect(4, step.y, 56, step.h);
    // Step lip highlight
    ctx.fillStyle = step.hi;
    ctx.fillRect(4, step.y, 56, 2);
    // Shadow under lip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(4, step.y + step.h - 2, 56, 2);
  });

  // Glowing Upward Ascension Portal Aura at top
  ctx.fillStyle = '#f59e0b';
  ctx.globalAlpha = 0.85;
  ctx.fillRect(20, 2, 24, 6);
  ctx.fillRect(26, 0, 12, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(28, 2, 8, 2);
  ctx.globalAlpha = 1.0;

  return setupTexture(canvas);
}

// 32x32 Treasure Chest
export function createChestTexture(opened = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 32);

  if (!opened) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 10, 24, 18);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, 10, 24, 3);
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(4, 10, 3, 18);
    ctx.fillRect(25, 10, 3, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(14, 16, 4, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 17, 2, 2);
  } else {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(4, 16, 24, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 4, 24, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(12, 10, 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 11, 4, 4);
  }

  return setupTexture(canvas);
}

// 32x64 Rune Pillar with glowing fraction symbols
export function createPillarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 32, 64);

  ctx.fillStyle = '#334155';
  ctx.fillRect(2, 0, 28, 6);
  ctx.fillRect(2, 58, 28, 6);

  ctx.fillStyle = '#0f172a';
  for (let x = 6; x < 28; x += 6) {
    ctx.fillRect(x, 6, 2, 52);
  }

  ctx.fillStyle = '#38bdf8';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(12, 16, 8, 2);
  ctx.fillRect(14, 20, 4, 2);
  ctx.fillRect(10, 32, 12, 2);
  ctx.fillRect(14, 44, 4, 2);
  ctx.globalAlpha = 1.0;

  return setupTexture(canvas);
}

// 64x64 BOSS 2: THE INFERNAL CHIMERA (Floor 5 Boss)
export function createMagmaChimera64Texture(animFrame = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const flameBob = animFrame % 2 === 1 ? 1 : 0;

  // Blazing Horns
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(14, 4 - flameBob, 6, 12);
  ctx.fillRect(44, 4 - flameBob, 6, 12);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(16, 2 - flameBob, 3, 6);
  ctx.fillRect(45, 2 - flameBob, 3, 6);

  // Chimera Lion/Dragon Head
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(18, 12, 28, 18);
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(20, 14, 24, 6);

  // Blazing Magma Eyes
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(22, 18, 5, 4);
  ctx.fillRect(37, 18, 5, 4);
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(24, 19, 2, 2);
  ctx.fillRect(39, 19, 2, 2);

  // Molten Snout & Fangs
  ctx.fillStyle = '#431407';
  ctx.fillRect(24, 24, 16, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(26, 29, 2, 3);
  ctx.fillRect(36, 29, 2, 3);

  // Magma Core Chest & Obsidian Armor
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(12, 30, 40, 22);
  // Glowing magma fissures
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(20, 34, 24, 8);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(24, 36, 16, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(28, 37, 8, 2);

  // Heavy Claws
  ctx.fillStyle = '#78350f';
  ctx.fillRect(8, 38, 8, 18);
  ctx.fillRect(48, 38, 8, 18);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(8, 52, 8, 4);
  ctx.fillRect(48, 52, 8, 4);

  return setupTexture(canvas);
}

// 64x64 CUSTOMIZABLE PLAYER BACK SPRITE (For Pokemon Battle Arena Over-the-Shoulder View)
export function createCustomPlayerBackTexture(config: CharacterConfig, animFrame = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const bob = animFrame % 2 === 1 ? 1 : 0;
  const robeColor = config.robeColor || '#2563eb';

  // Cape Accessory (drapes over back)
  if (config.accessory === 'cape') {
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(16, 26 + bob, 32, 28);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(18, 28 + bob, 28, 24);
  }

  // 1. Wizard Cape / Back of Cloak
  ctx.fillStyle = robeColor;
  ctx.fillRect(18, 28 + bob, 28, 26);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(20, 30 + bob, 24, 24);

  // Cape Folds / Highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(22, 32 + bob, 3, 20);
  ctx.fillRect(39, 32 + bob, 3, 20);

  // 2. Leather Belt & Alchemist Satchel
  ctx.fillStyle = '#78350f';
  ctx.fillRect(18, 44 + bob, 28, 3);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(24, 46 + bob, 16, 7); // satchel pouch
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(30, 48 + bob, 4, 3); // buckle

  // 3. Boots Back
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(22, 54 + bob, 7, 7);
  ctx.fillRect(35, 54 + bob, 7, 7);

  // 4. Back of Head & Hair
  ctx.fillStyle = '#78350f'; // Hair
  ctx.fillRect(24, 18 + bob, 16, 12);

  // 5. Headwear Back
  const hat = config.hatStyle || 'wizard';
  if (hat === 'crown') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 12 + bob, 20, 6);
    ctx.fillRect(22, 8 + bob, 4, 5);
    ctx.fillRect(30, 6 + bob, 4, 7);
    ctx.fillRect(38, 8 + bob, 4, 5);
  } else if (hat === 'hood' || hat === 'cowl') {
    ctx.fillStyle = robeColor;
    ctx.fillRect(20, 10 + bob, 24, 16);
    ctx.fillRect(24, 6 + bob, 16, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(24, 16 + bob, 16, 6);
  } else if (hat === 'helmet') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(20, 10 + bob, 24, 14);
    ctx.fillRect(24, 6 + bob, 16, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(30, 2 + bob, 4, 6); // Red crest plume
  } else if (hat === 'headband') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(22, 19 + bob, 20, 4);
    // Ribbon knot in back
    ctx.fillRect(28, 22 + bob, 8, 4);
    ctx.fillRect(26, 25 + bob, 5, 6);
    ctx.fillRect(33, 25 + bob, 5, 6);
  } else if (hat === 'horns') {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(22, 8 + bob, 4, 10);
    ctx.fillRect(38, 8 + bob, 4, 10);
  } else if (hat === 'catears') {
    ctx.fillStyle = robeColor;
    ctx.fillRect(22, 8 + bob, 6, 8);
    ctx.fillRect(36, 8 + bob, 6, 8);
  } else if (hat === 'halo') {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(24, 4 + bob, 16, 3);
    ctx.fillRect(22, 6 + bob, 3, 3);
    ctx.fillRect(39, 6 + bob, 3, 3);
  } else if (hat === 'none') {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(22, 12 + bob, 20, 12);
  } else {
    // Pointed Wizard Hat Back
    ctx.fillStyle = robeColor;
    ctx.fillRect(16, 17 + bob, 32, 4); // Brim
    ctx.fillRect(22, 11 + bob, 20, 6);
    ctx.fillRect(26, 5 + bob, 12, 6);
    ctx.fillRect(30, 1 + bob, 5, 5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, 15 + bob, 20, 2);
  }

  // Left-hand Buckler or Fairy Companion
  if (config.accessory === 'shield') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 36 + bob, 8, 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(12, 39 + bob, 4, 6);
  } else if (config.accessory === 'fairy') {
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(10, 14 + (bob === 1 ? 0 : 2), 4, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(8, 12 + (bob === 1 ? 0 : 2), 3, 4);
    ctx.fillRect(13, 12 + (bob === 1 ? 0 : 2), 3, 4);
  }

  // 6. Wand / Weapon held forward in right hand
  const wand = config.wandStyle || 'wood';
  if (wand === 'crystal') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(46, 16 + bob, 3, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(44, 8 + bob, 7, 8);
  } else if (wand === 'gold') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(46, 12 + bob, 4, 28);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(46, 38 + bob, 4, 4);
  } else if (wand === 'sword') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(46, 10 + bob, 4, 30);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(43, 38 + bob, 10, 3);
  } else if (wand === 'potion') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(45, 26 + bob, 6, 10);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(46, 29 + bob, 4, 6);
  } else if (wand === 'scythe') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(46, 8 + bob, 3, 40);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(36, 6 + bob, 12, 4);
  } else if (wand === 'book') {
    ctx.fillStyle = '#831843';
    ctx.fillRect(44, 26 + bob, 8, 10);
  } else {
    ctx.fillStyle = '#a16207';
    ctx.fillRect(46, 20 + bob, 3, 22);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(45, 17 + bob, 5, 4);
  }

  const tex = setupTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Data URL Generators for 2D React DOM (Pokemon Battle View, Modals, UI)
export function getPlayerSpriteDataURL(config: CharacterConfig, animFrame = 0, isBack = false): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  if (isBack) {
    const tex = createCustomPlayerBackTexture(config, animFrame);
    ctx.drawImage(tex.image, 0, 0);
  } else {
    const tex = createCustomPlayerTexture(config, animFrame);
    ctx.drawImage(tex.image, 0, 0);
  }
  return canvas.toDataURL();
}

export function getMobSpriteDataURL(
  type: 'slime' | 'golem' | 'wraith' | 'gorgon' | 'chimera' | 'boss',
  color = '#10b981',
  animFrame = 0,
  isEngulfedInFire = false
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  let tex: THREE.CanvasTexture;
  if (type === 'slime') {
    tex = createSlime64Texture(color, animFrame);
  } else if (type === 'golem') {
    tex = createGolem64Texture();
  } else if (type === 'wraith') {
    tex = createShadowWraith64Texture();
  } else if (type === 'gorgon') {
    tex = createGorgonBoss64Texture();
  } else if (type === 'chimera') {
    tex = createMagmaChimera64Texture(animFrame);
  } else {
    tex = createBoss64Texture();
  }

  ctx.drawImage(tex.image, 0, 0);

  if (isEngulfedInFire) {
    // Add pixel fire overlay
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const size = Math.random() * 4 + 2;
      ctx.fillRect(x, y, size, size);
    }
  }

  return canvas.toDataURL();
}

// Compatibility Aliases for DungeonView and other components
export const createPlayerTexture = (config?: CharacterConfig, animFrame = 0): THREE.CanvasTexture =>
  createCustomPlayerTexture(config || { robeColor: '#2563eb', hatStyle: 'wizard', accessory: 'none', wandStyle: 'wood' }, animFrame);

export const createSlimeTexture = (color?: string, animFrame = 0): THREE.CanvasTexture =>
  createSlime64Texture(color || '#10b981', animFrame);

export const createGolemTexture = (): THREE.CanvasTexture => createGolem64Texture();
export const createBossTexture = (): THREE.CanvasTexture => createBoss64Texture();
export const createGorgonTexture = (): THREE.CanvasTexture => createGorgonBoss64Texture();
export const createWraithTexture = (): THREE.CanvasTexture => createShadowWraith64Texture();
export const createChimeraTexture = (animFrame = 0): THREE.CanvasTexture => createMagmaChimera64Texture(animFrame);

export function createLootGem64Texture(lootType: 'slime' | 'golem' | 'boss' = 'slime'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Background aura (dark translucent aura)
  const auraGrad = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
  auraGrad.addColorStop(0, lootType === 'slime' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)');
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(0, 0, 64, 64);

  // Outer Gold Rune Casing (Filigree border)
  ctx.fillStyle = '#78350f'; // Dark bronze outline
  ctx.fillRect(18, 10, 28, 44);
  ctx.fillRect(12, 16, 40, 32);
  ctx.fillRect(10, 22, 44, 20);

  ctx.fillStyle = '#b45309'; // Medium gold
  ctx.fillRect(19, 11, 26, 42);
  ctx.fillRect(13, 17, 38, 30);
  ctx.fillRect(11, 23, 42, 18);

  ctx.fillStyle = '#fbbf24'; // Bright gold highlight
  ctx.fillRect(20, 12, 24, 4);
  ctx.fillRect(14, 18, 4, 24);
  ctx.fillRect(46, 18, 4, 24);
  ctx.fillRect(20, 48, 24, 4);

  // Four Runic Corner Claws
  ctx.fillStyle = '#fef08a'; // Specular gold
  ctx.fillRect(18, 12, 4, 4);
  ctx.fillRect(42, 12, 4, 4);
  ctx.fillRect(18, 48, 4, 4);
  ctx.fillRect(42, 48, 4, 4);

  // Inner Socket Depth
  ctx.fillStyle = '#0f172a'; // Deep slate abyss
  ctx.fillRect(18, 18, 28, 28);
  ctx.fillRect(22, 14, 20, 36);

  // Central Gem (Diamond / Hexagonal facet)
  // Palette based on lootType
  const primaryColor = lootType === 'slime' ? '#10b981' : '#38bdf8';
  const deepColor = lootType === 'slime' ? '#064e3b' : '#0369a1';
  const lightColor = lootType === 'slime' ? '#6ee7b7' : '#7dd3fc';
  const whiteSpec = '#ffffff';

  // Facet Base
  ctx.fillStyle = deepColor;
  ctx.fillRect(22, 18, 20, 28);
  ctx.fillRect(26, 16, 12, 32);

  // Facet Midtone
  ctx.fillStyle = primaryColor;
  ctx.fillRect(24, 20, 16, 24);
  ctx.fillRect(28, 18, 8, 28);

  // Upper Facet Light
  ctx.fillStyle = lightColor;
  ctx.fillRect(26, 20, 12, 12);
  ctx.fillRect(24, 22, 6, 8);

  // Gem Highlights & Glint
  ctx.fillStyle = whiteSpec;
  ctx.fillRect(26, 20, 4, 4);
  ctx.fillRect(30, 24, 2, 2);
  ctx.fillRect(24, 24, 2, 2);

  // Glowing Magical Sparkles / Floating Glyphs
  ctx.fillStyle = '#fef08a';
  // Top left star
  ctx.fillRect(8, 12, 2, 6);
  ctx.fillRect(6, 14, 6, 2);
  // Bottom right star
  ctx.fillRect(52, 46, 2, 6);
  ctx.fillRect(50, 48, 6, 2);
  // Top right sparkle
  ctx.fillRect(50, 14, 3, 3);
  // Bottom left sparkle
  ctx.fillRect(10, 46, 3, 3);

  // Core energy pulse line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(27, 28, 10, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export function getLootGemSpriteDataURL(lootType: 'slime' | 'golem' | 'boss' = 'slime'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const tex = createLootGem64Texture(lootType);
  ctx.drawImage(tex.image, 0, 0);
  return canvas.toDataURL();
}

