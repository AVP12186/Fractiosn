# Dead Signal: Northbound

An original top-down, pixel-art zombie road adventure built with React, TypeScript, Canvas 2D, and Web Audio. Follow a mysterious evacuation broadcast through **100 northbound levels across 20 location themes**, from Blackwater to Dawn Array. All survivor sprites, infected animation frames, supply icons, landscapes, music, and sound effects are generated locally—no paid APIs or asset downloads are required. Character and UI textures use native 64 × 64 canvases with nearest-neighbor scaling.

## Private online co-op

Choose **PLAY WITH FRIENDS**, enter a call sign, and create a private lobby. Send its ten-character code or invite link to up to three friends. They open the same updated website, join the lobby, choose any of the ten classes, and mark **READY**. The host deploys when at least two players are connected and everyone is ready.

- The host's browser simulates the shared infected, bullets, receiver objectives, gear and health. Guests send bounded input commands, not positions or damage. Frames are sent at 20 Hz; input expires if packets stop arriving. Names render as text, and messages, capacities and game versions are validated.
- Supply cases give every squad member equipment and a medkit. There is no friendly fire. A downed survivor can be revived by a nearby teammate with **F** and one medkit. Securing a receiver heals/revives the whole squad. A squad wipe lets the host retry the last shared checkpoint.
- All players finish or skip each story scene before travel resumes. Gather all standing survivors at the northern gate to move to the next level.
- The host must keep their tab open. Opening the host's menu, switching away from their tab, or minimizing it pauses everyone. Guests' menus stop their own controls but do not pause combat. Host departure ends the room; there is no host migration, mid-mission joining, or reconnection to a running room. Co-op checkpoints live only for that room and never overwrite solo localStorage saves.
- Uses pinned **PeerJS 1.5.5**, its free public signaling service and browser WebRTC data channels. No application backend, account, webcam, microphone permission or Netlify server is needed. The existing static ZIP upload still works. The signaling service is an external dependency; restricted networks/NATs can prevent a peer connection. This is invite-code privacy, not authenticated accounts or public matchmaking. Production reliability on all networks would require operating signaling/TURN infrastructure.

`npm test` includes transport/session tests using an in-memory broker and co-op simulation/protocol tests, in addition to solo regressions. These are not a substitute for two-browser, cross-device or cross-network WebRTC playtesting; that end-to-end path has not yet been verified for this revision.

## The journey

- Continuous local encounters replace survival waves. Travel north, scavenge roadside cases, restore three receivers, then cross the northern gate.
- Each 39,000-unit route targets roughly five minutes including travel, combat, scavenging and three 18-second uplinks. This is a design target, not a timer: class, gear, dodging and play style change the duration.
- Twenty themes each provide five named, seeded route variants: cities, suburbs, forest, farms, hospital, flooded streets, rail yards, quarry, refinery, military outposts, laboratories, snow passes, observatory, dam and the array. These are procedural variations, not 100 hand-authored maps.
- An animated prologue, ten major story transitions including the ending, and shorter radio scenes connect the routes. Advance with Enter/Space or the on-screen button; cutscenes are skippable.
- Each tenth level has a charging relay guardian and a guaranteed legendary reward.
- Every level configures a distinct procedural music profile (tempo, transposition, mode, melody stride and timbre), not an external recorded track. The soundtrack eases back during cutscenes and pauses.
- Terrain and collision chunks use bounded caches; the entire campaign is never allocated as one bitmap.

## Loot and checkpoints

Supply cases offer common, uncommon, rare, epic and legendary gear. Weapon parts increase damage, vests increase maximum HP, boots increase speed, and charms add critical-hit chance. Stronger equipment auto-equips. Weaker finds become scrap. Cases also refill magazines and supply medkits. Use a medkit for 65 HP, or spend three scrap on a field dressing. Every fifth kill drops a 30-HP medical pickup.

Receivers and new locations save class, level, objective checkpoint, equipment, opened cases, supplies, score, kills and playtime in this browser's local storage. Death retries the last receiver with full health; it does not save loot found after that checkpoint. Continue from the menu resumes the saved class. Starting a new journey asks before replacing a checkpoint. Saves do not sync across devices or survive clearing site data.

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
| Interact with supply case / receiver / north gate | F / on-screen prompt |
| Medkit / craft dressing | H / touch medkit button |
| Route journal and equipment | Map button / pause menu |
| Pause | Escape |

Touch devices have a movement stick, nearest-target auto-aim firing, reload, dodge, ability, heal and context-sensitive interaction buttons. Music starts after a user interaction. Music, effects, volume, and screen shake can be adjusted in Settings. Settings and the personal best are stored locally, and play pauses when the tab loses focus.

## Classes

- **Assault:** M4 carbine; Overdrive grants six seconds of doubled fire rate and unlimited ammunition.
- **Medic:** Vector SMG; Second Wind restores health and pushes nearby infected back.
- **Engineer:** M870 shotgun; Sentry Turret deploys an automatic gun for twelve seconds.
- **Recon:** M14 marksman rifle; Ghost Protocol grants five seconds of invulnerability and increased movement speed.
- **Vanguard:** Belt-fed LMG; Iron Curtain absorbs incoming damage for five seconds.
- **Gunslinger:** Twin revolvers; High Noon fires six piercing shots and doubles damage for five seconds.
- **Pyro:** Dragonbreath SMG; Firestorm burns nearby infected and adds splash damage for seven seconds.
- **Ranger:** Rail crossbow; Heartseeker grants piercing, double-damage bolts for seven seconds.
- **Scavenger:** Salvaged PDW; Finders Keepers pulls in drops, heals and boosts speed.
- **Cryo:** Frostburst rifle; Absolute Zero slows nearby pursuers for six seconds.

## Publish / replace a Netlify deployment

Run `npm run build` and upload the **contents of `dist`** (or a ZIP with `index.html` at its root) to the existing Netlify project's **Deploys** page using its manual deployment area. Do not create a new project if you want to keep the same URL. No server, API keys or build step on Netlify are needed for this static bundle.

The simulation tests cover all classes, route/loot generation, terrain boundaries, objectives, guardians, persistence, combat, music profiles, and the final ending. They do not simulate an eight-hour human playthrough or verify audible output.

The previous Fraction Relic implementation remains in `src/App.tsx` and its supporting directories; the application entry point now opens Dead Signal.
