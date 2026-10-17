# Dead Signal

An original top-down, pixel-art zombie survival game built with React, TypeScript, Canvas 2D, and Web Audio. All survivor sprites, infected animation frames, supply icons, city art, music, and sound effects are generated locally—no paid APIs or asset downloads are required. Character and UI textures use native 64 × 64 canvases with nearest-neighbor scaling.

## Run

Requires Node.js 24 and npm.

```sh
npm install
npm run dev
```

Vite serves the game on port 3000. `npm run lint`, `npm test`, and `npm run build` run the type check, engine regression tests, and production build respectively. `npm run preview -- --host 0.0.0.0` serves the production build.

## Controls

| Action | Control |
| --- | --- |
| Move | WASD / arrows |
| Aim / fire | Mouse / hold left click |
| Reload | R (unlimited reserve ammo) |
| Class ability | Q or E |
| Dodge | Space |
| Pause | Escape |

Touch devices have a movement stick, nearest-target auto-aim firing, reload, dodge, and ability buttons. Music starts after a user interaction. Music, effects, volume, and screen shake can be adjusted in Settings. Settings and the personal best are stored locally, and play pauses when the tab loses focus.

## Classes

- **Assault:** M4 carbine; Overdrive grants six seconds of doubled fire rate and unlimited ammunition.
- **Medic:** Vector SMG; Second Wind restores health and pushes nearby infected back.
- **Engineer:** M870 shotgun; Sentry Turret deploys an automatic gun for twelve seconds.
- **Recon:** M14 marksman rifle; Ghost Protocol grants five seconds of invulnerability and increased movement speed.

Clear increasingly difficult waves, collect medical and ammo drops, and survive as long as possible. Runners join from wave 2 and brutes from wave 3. Between waves, you recover 15 health and receive a fresh magazine.

The previous Fraction Relic implementation remains in `src/App.tsx` and its supporting directories; the application entry point now opens Dead Signal.
