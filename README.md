# Fraction Tower

React/Three.js fraction adventure with solo play and 2–4 player real-time co-op.

## Run

Use Node.js 24 (or a Vite-compatible Node.js 22.12+).

```sh
npm ci
npm run dev
```

Open port 3000. To play together, every player must open the **same running server**. On a LAN, use the host machine's network address, not each player's own localhost. Choose **Multiplayer → Create lobby**, share the six-character code or invite link, then ready up. The host starts once at least two players are present and everyone is ready.

```sh
npm run lint       # TypeScript, including the server and tests
npm test           # Math, shield reachability, balance, game simulation and real WebSocket clients
npm run build
npm start          # Production: Express serves dist and WebSockets on PORT (default 3000)
```

`npm run preview` previews the static build only; it does **not** provide multiplayer. No Gemini API key is required for gameplay.

## Gameplay and balance

- Solo chapter starts are unchanged: Apprentice floor 1, Journeyman floor 8, Grandmaster floor 15. All can ascend through floor 21; co-op starts on floor 1 for every rank.
- Stage difficulty is 3–4 on floors 1–3, 5–6 on floors 4–5, and 7–8 on floors 6+. Enemy health, attack power, movement and attack cooldowns derive from this rating, not an unbounded floor multiplier. Higher ranks choose the upper end of a band.
- Shields require one fraction card or the **sum of two** cards. Click a card twice to use two copies; a third click clears it. Equivalent fractions count. All decks can form every enemy and boss-phase shield, including Chimera's `3/5 = 1/5 + 2/5` and phase-three `5/6 = 1/2 + 1/3`.
- Previously, the Apprentice and Journeyman decks could not form **Infernal Chimera's 3/5** (floor 5 boss and floor 8 Chimera); Grandmaster's prime-denominator deck could not form any of the generated standard shields. Equality was already cross-multiplied correctly: missing reachable sums, not floating-point rounding, caused those invincible enemies.
- Boss phases now trigger at two-thirds and one-third of **maximum HP**, once each. The Colossus on floor 6 is a milestone; the final Colossus is on floor 21. Arena damage and broken shields persist when fleeing. Correct defense answers prevent all damage, and ascending restores health.

## Co-op rules and hosting

- The server owns enemy positions, shields, HP, boss phases, players' HP, revives, cooldowns and floor transitions. Clients submit card IDs, not claimed damage or fractions. Two players attacking the same monster are resolved sequentially against shared state.
- Select a monster, then cast using the belt. WASD/arrows, click-to-move and the joystick move your hero; green heroes are teammates. Enemies pursue the nearest living player. Solve incoming fraction prompts within 12 seconds to block attacks.
- Each player gets two potions per floor: heal 8 HP, or revive a downed ally within 3 world units with 10 HP. A party wipe ends the run. The host can ascend after the room is cleared, including if the host is downed; ascending restores the party.
- Disconnects remove that player and transfer host to a remaining member. Empty lobbies are deleted. Late joining and resuming an active run after disconnect are not supported; a disconnected player can rejoin a **waiting** lobby or create a new one. The remaining party can continue.
- Lobbies are anonymous, invite-code sessions, not authenticated private rooms. Names are display names only. State is in memory and is lost on server restart. This implementation is designed for **one long-running Node process**; multiple instances need a shared room service/sticky routing before scaling out.
- Public hosting requires HTTPS with WebSocket upgrades (`/coop`) forwarded to the same process. `APP_URL`, if set, must be the exact allowed public origin (e.g. `https://game.example.com`) when a reverse proxy changes the Host header. `PORT` selects the listening port. No deployment is performed by these changes.
- Payload size, message frequency, total clients/lobbies, movement speed and cast cooldowns are bounded. Heartbeats remove dead connections. This is not an account system, matchmaking service or persistent save backend.

`package-lock.json` is the npm dependency lockfile. The server uses the existing Express dependency plus `ws`; Vite runs as middleware in development so the client and WebSocket endpoint share one origin and port.
