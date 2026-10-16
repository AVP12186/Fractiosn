# Fraction Relic: Alchemist of the Shattered Realm

A 2.5D retro pixel-art dungeon crawler and alchemical adventure where players brew fraction spells, unlock ancient rune gates, and defeat multi-phase bosses across progressive difficulty tiers to reforge the shattered Fraction Relic.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following gameplay and architectural decisions synthesize your confirmed preferences:
> - **Genre Blend Confirmed**: Dungeon crawler exploration combined with potion-crafting RPG mechanics. Players explore chambers, collect fractional mana herbs, and brew exact fraction elixirs to break monster shields.
> - **2.5D Pixel Aesthetic Confirmed**: Rendered via Three.js with an isometric tilted camera, procedural pixel-art textures (using `NearestFilter`), and real-time point/directional lights casting authentic dynamic shadows.
> - **Combat & Boss Mechanics Confirmed**: Real-time player movement with hybrid fraction spell-casting (combining fractional ingredients into target spells) and multi-phase boss encounters with fraction-telegraphed shield mechanics.
> - **Difficulty Scaling**: Easy (unit fractions 1/2 to 1/8 and visual pie/beaker aids), Medium (proper & equivalent fractions, simple addition), and Hard (unlike denominators, mixed numbers, and rapid boss casting timers).

---

### 1. Overview & Core Concept

- **What It Does**: Puts the player in the boots of Arc, an apprentice alchemist in the shattered kingdom of Numeria. The Great Relic of Wholes was fractured into pieces. Arc must delve into dungeons, solve interactive fraction puzzles, defeat fraction-shielded elemental beasts, and defeat the Fraction Colossus boss by calculating, combining, and casting fraction spells.
- **Target Audience**: Students, gamers, and puzzle enthusiasts looking for an engaging, visually rich retro game that makes fraction arithmetic (identifying, simplifying, adding, and comparing fractions) tactile and rewarding.
- **Key Value**: Replaces dry fraction worksheets with high-stakes, exciting action-RPG mechanics—every fraction calculation directly yields a tangible gameplay effect (a blazing fireball, an ice shield, or an unlocked dungeon vault).

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Title & Difficulty Selection**: Start screen with pixel-art animated title, difficulty selector (Easy: Apprentice, Medium: Journeyman, Hard: Grandmaster), and optional CRT scanline / 64x64 pixelation toggle.
2. **Story Intro & Tutorial**: Brief pixelated story scroll with animated alchemist portrait explaining the shattered Fraction Relic and introducing Arc's fraction flask belt.
3. **Chamber Exploration**: Real-time movement (WASD / Arrows / Touch D-Pad) through dungeon rooms with torches casting dynamic point-light shadows across cobblestone floors, rune pillars, and fraction chests.
4. **Fraction Gates & Encounter Rooms**:
   - Slimes and elemental guardians protected by fractional barriers (e.g., $3/4$ Ice Ward).
   - Player combines fractional mana vials (e.g., $1/2 + 1/4 = 3/4$) in their alchemical flask to trigger spells.
   - Interactive visual fraction bar and circle dials update live to build spatial understanding.
5. **Boss Battle — The Fraction Colossus**:
   - Multi-phase boss fight with animated telegraphs (slam attacks, rotating fractional shield runes, fraction beam attacks).
   - Phase 1: Unit fraction shield disruption.
   - Phase 2: Equivalent fraction matching (simplify fractions on the fly).
   - Phase 3: Unlike denominator counter-spells with escalating difficulty and speed.
6. **Victory & Relic Reforging**: The relic shards snap together with pixel-particle pyrotechnics, performance breakdown (accuracy, speed, spells cast), and high score save.

#### Visual Identity & Theme
- **Aesthetic Direction**: 16-bit / 32-bit golden era dungeon crawler meets modern dynamic 3D lighting (reminiscent of Octopath Traveler / Enter the Gungeon).
- **Color Palette & Atmosphere**:
  - Dominant canvas: Deep dungeon obsidian (`#0b0f19`) and weathered flagstone gray (`#1e293b`).
  - Elemental Accents: Alchemical Ember Red (`#ef4444`), Mana Azure (`#38bdf8`), Verdant Moss (`#10b981`), and Relic Gold (`#f59e0b`).
  - Dynamic Lighting: Warm torch amber point-lights ($3000\text{K}$) with real-time shadow cones and soft ambient fill.
- **Typography**: Retro 8-bit / pixel display typography (`Press Start 2P` / `Silkscreen` via Google Fonts) for titles and damage numbers, paired with clean tabular numerals (`font-mono tabular-nums`) for fractional equations.
- **Audio Experience**: Procedural retro 8-bit sound effects synthesized via the Web Audio API (player footstep thuds, potion glug, spell whoosh, crystal chime, boss impact crash, victory fanfare).

---

### 3. Key Product Decisions & Trade-Offs

- **Rendering Engine: Three.js 2.5D Pixel World with PCFSoftShadowMap**:
  - *Chosen Approach*: Use Three.js with an orthographic or low-FOV perspective camera tilted at $45^\circ$, procedural pixel textures with `NearestFilter`, and active shadow mapping.
  - *Why*: Delivers authentic pixel art sprites while providing real-time 3D shadow volumes, dynamic torchlight bounce, and smooth camera scrolling.
  - *Alternatives Considered*: Pure 2D canvas raycasting (harder to manage complex 3D depth and shadow penumbras cleanly).
- **Fraction Mechanic: Alchemical Flask Spell Matrix**:
  - *Chosen Approach*: Combining fractional vials into target wholes or target fractions, supplemented with visual fraction bars (split bars and circular beakers) that visually fill up as components are combined.
  - *Why*: Bridges abstract numerical symbols ($a/b$) with concrete geometric volume representations.
- **State Persistence: Local Storage**:
  - *Chosen Approach*: Save game progress, unlocked difficulty badges, best dungeon clear times, and high scores in `localStorage`.
  - *Why*: Instant, zero-friction persistence across browser refreshes without requiring external account logins.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Root Container)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    │                                                               │
┌───▼───────────────────────────┐       ┌───────────────────────────▼───┐
│     Three.js 2.5D Engine      │       │     HUD & Alchemist Deck      │
│  (Scene, Camera, Shadows)     │       │     (DOM Layer, z-index 10)   │
├───┬───────────────────────────┤       ├───┬───────────────────────────┤
│ 1 │ Pixel World & Dungeon Grid│       │ 1 │ Health & Floor Progress   │
│ 2 │ Dynamic Torches & Shadows │       │ 2 │ Alchemical Flask (Mixer)  │
│ 3 │ Player & Monster Meshes   │       │ 3 │ Spell Casting Quick-Bar   │
│ 4 │ Particle & Spell FX       │       │ 4 │ Visual Fraction Bar / Pie │
└───┴───────────────────────────┘       └───┴───────────────────────────┘
                ▲                                       ▲
                └───────────────────┬───────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │     Game & Math State       │
                     │  - Difficulty Mode (E/M/H)  │
                     │  - Fraction Problem Engine  │
                     │  - Combat & Boss AI Loop    │
                     │  - Web Audio Sound Synth    │
                     └─────────────────────────────┘
```

#### Core Data Entities
- **Fraction**: `{ numerator: number, denominator: number }` with helper methods for simplification, addition, equivalence checking, and decimal value.
- **Problem**: `{ target: Fraction, type: 'match' | 'combine' | 'simplify' | 'boss_shield', visualAid: boolean, options: Fraction[] }`
- **Entity**: `{ id: string, x: number, z: number, hp: number, maxHp: number, shieldFraction?: Fraction, state: 'idle' | 'walk' | 'attack' | 'hit' }`
- **LevelSpec**: Room layout, enemies, fraction lock gates, chest rewards, and boss phase definitions.

#### Technical Dependencies
- `three` & `@types/three`: 3D rendering, mesh instancing, directional/point lights, and shadow maps.
- `lucide-react`: UI icon set for settings, sound toggles, and help modal.
- `motion`: Smooth transitions for UI overlays and victory modals.
