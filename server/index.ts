import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import { CoopGame } from './game';
import type { ServerMessage } from '../src/types/multiplayer';

export async function createGameServer({ assets = true, production = process.env.NODE_ENV === 'production' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', (_req, res) => res.sendStatus(404));
  const server = createServer(app);
  const sockets = new Map<string, WebSocket>();
  const send = (socket: WebSocket, message: ServerMessage) => {
    if (socket.readyState === WebSocket.OPEN && socket.bufferedAmount < 1024 * 1024) socket.send(JSON.stringify(message));
  };
  const game = new CoopGame((lobby) => {
    for (const player of lobby.players) {
      const socket = sockets.get(player.id);
      if (socket) send(socket, { type: 'state', lobby });
    }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false });
  server.on('upgrade', (request, socket, head) => {
    if (request.url?.split('?')[0] !== '/coop') { if (production) socket.destroy(); return; }
    let allowed = !request.headers.origin;
    try {
      const origin = new URL(request.headers.origin || 'http://invalid');
      allowed ||= origin.host === request.headers.host || origin.origin === process.env.APP_URL;
    } catch { allowed = false; }
    if (!allowed || wss.clients.size >= 200) { socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws));
  });
  const alive = new Set<WebSocket>();
  wss.on('connection', (socket) => {
    const id = randomUUID();
    sockets.set(id, socket);
    alive.add(socket);
    send(socket, { type: 'hello', playerId: id });
    let windowStart = Date.now(), count = 0;
    socket.on('pong', () => alive.add(socket));
    socket.on('error', () => socket.terminate());
    socket.on('message', (raw, binary) => {
      if (Date.now() - windowStart > 1000) { windowStart = Date.now(); count = 0; }
      if (++count > 60) { socket.close(1008, 'Too many messages'); return; }
      if (binary) { send(socket, { type: 'error', message: 'Text messages only.' }); return; }
      try {
        const data = JSON.parse(raw.toString());
        game.handle(id, data);
        if (data.type === 'leave') send(socket, { type: 'left' });
      } catch (error) {
        send(socket, { type: 'error', message: error instanceof SyntaxError ? 'Invalid JSON.' : error instanceof Error ? error.message : 'Invalid action.' });
      }
    });
    socket.on('close', () => { sockets.delete(id); alive.delete(socket); game.leave(id); });
  });
  const tick = setInterval(() => game.tick(), 100);
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!alive.has(socket) || socket.bufferedAmount > 1024 * 1024) { socket.terminate(); continue; }
      alive.delete(socket); socket.ping();
    }
  }, 30000);
  let vite: Awaited<ReturnType<typeof import('vite')['createServer']>> | undefined;
  if (assets) {
    if (production) {
      const dist = fileURLToPath(new URL('../dist', import.meta.url));
      app.use(express.static(dist));
      app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
    } else {
      const { createServer: createViteServer } = await import('vite');
      vite = await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
      app.use(vite.middlewares);
    }
  }
  return { server, game, close: async () => {
    clearInterval(tick); clearInterval(heartbeat);
    for (const socket of wss.clients) socket.terminate();
    wss.close(); await vite?.close();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server } = await createGameServer();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => console.log(`Fraction Tower listening on port ${port}`));
}
