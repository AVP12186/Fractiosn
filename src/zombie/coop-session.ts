import Peer, { type DataConnection } from 'peerjs';
import { ClassId } from './classes';
import { cleanName, COOP_VERSION, Control, CoopFrame, isMember, isRecord, makeCode, MAX_SQUAD, Member, readControl, readFrame, validCode } from './coop-model';
import { CoopWorld } from './coop-world';

export type RoomView = {
  status: 'connecting' | 'lobby' | 'game' | 'closed'; code: string;
  selfId: string; hostId: string; members: Member[]; frame: CoopFrame | null;
  error: string; warning: string;
};
const peerId = (code: string) => `dead-signal-coop1-${code.toLowerCase()}`;

export class CoopSession {
  view: RoomView;
  private peer: Peer;
  private channels = new Map<string, DataConnection>();
  private listeners = new Set<() => void>();
  private cleanup: (() => void)[] = [];
  private closed = false;
  private world: CoopWorld | null = null;
  private lastPacket = performance.now();
  private hostAck = 0;
  private ping = 0;

  constructor(readonly hosting: boolean, name: string, selected: ClassId, code = makeCode(), createPeer: (id?: string) => Peer = id => id ? new Peer(id) : new Peer()) {
    if (!validCode(code)) throw new Error('Enter the ten-character lobby code.');
    name = cleanName(name);
    this.view = { status: 'connecting', code, selfId: '', hostId: peerId(code), members: [], frame: null, error: '', warning: '' };
    this.peer = createPeer(hosting ? peerId(code) : undefined);
    const initialTimeout = window.setTimeout(() => this.fail('Connection timed out. Check your internet, or try another network.'), 20000);
    this.cleanup.push(() => clearTimeout(initialTimeout));
    this.peer.on('open', id => {
      if (this.closed) return;
      this.change({ selfId: id });
      if (hosting) { clearTimeout(initialTimeout); this.change({ status: 'lobby', members: [{ id, name, classId: selected, ready: true }] }); }
      else this.attach(this.peer.connect(this.view.hostId, { reliable: true, serialization: 'json' }), { name, classId: selected }, () => clearTimeout(initialTimeout));
    });
    this.peer.on('connection', channel => {
      if (!hosting || this.closed) { channel.close(); return; }
      this.attach(channel);
    });
    this.peer.on('error', error => {
      if (this.closed) return;
      if (this.view.status === 'connecting') this.fail(error.type === 'peer-unavailable' ? 'Lobby not found. Check the code and ask the host to keep their lobby open.' : 'Could not connect to the lobby service. Try again or use another network.');
      else this.change({ warning: 'Lobby service interrupted. Existing players can keep playing; new invites may not connect.' });
    });
    this.peer.on('disconnected', () => {
      if (this.closed) return;
      this.change({ warning: 'Lobby signaling is offline. Existing peer connections may continue.' });
      if (!this.peer.destroyed) this.peer.reconnect();
    });
    const heartbeat = window.setInterval(() => {
      if (this.closed) return;
      if (hosting) this.broadcast({ type: 'heartbeat', ping: ++this.ping });
      else if (this.view.status !== 'connecting') {
        const now = performance.now();
        if (now - this.lastPacket > 15000 || this.view.status === 'game' && !this.view.frame?.paused && now - this.hostAck > 15000) this.fail('Connection to the host was lost. Return to the menu and join a new lobby.');
        else if (this.stale) this.change({});
      }
      if (hosting) for (const [id, channel] of this.channels) {
        const last = this.acks.get(id);
        if (last && performance.now() - last > 20000) { channel.close(); this.disconnected(id); }
      }
    }, 2000);
    this.cleanup.push(() => clearInterval(heartbeat));
  }

  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private change(patch: Partial<RoomView>) { this.view = { ...this.view, ...patch }; for (const listener of this.listeners) listener(); }
  private acks = new Map<string, number>();
  private send(channel: DataConnection, message: unknown) {
    if (!channel.open || channel.dataChannel?.bufferedAmount > 65536) return;
    try { channel.send(message); } catch { channel.close(); }
  }
  private broadcast(message: unknown) { for (const channel of this.channels.values()) this.send(channel, message); }
  private hostSend(message: unknown) { const channel = this.channels.get(this.view.hostId); if (channel) this.send(channel, message); }
  private lobby() { const message = { type: 'lobby', version: COOP_VERSION, members: this.view.members }; this.broadcast(message); }
  private reject(channel: DataConnection, message: string) {
    this.send(channel, { type: 'reject', message });
    const timer = window.setTimeout(() => channel.close(), 250); this.cleanup.push(() => clearTimeout(timer));
  }
  private attach(channel: DataConnection, identity?: { name: string; classId: ClassId }, accepted?: () => void) {
    let joined = false, count = 0, started = performance.now();
    const timeout = window.setTimeout(() => { if (!joined) channel.close(); }, 15000);
    this.cleanup.push(() => { clearTimeout(timeout); channel.close(); });
    channel.on('open', () => {
      if (this.closed) { channel.close(); return; }
      if (this.hosting) {
        if (this.view.status !== 'lobby') { this.reject(channel, 'This squad already deployed. Ask the host to create a new lobby.'); return; }
        if (this.channels.size >= MAX_SQUAD - 1 || this.channels.has(channel.peer)) { this.reject(channel, 'This lobby is full (four survivors).'); return; }
      }
      this.channels.set(channel.peer, channel); this.acks.set(channel.peer, performance.now());
      if (identity) this.send(channel, { type: 'hello', version: COOP_VERSION, member: { id: this.view.selfId, ...identity, ready: false } });
    });
    channel.on('data', (raw: unknown) => {
      if (this.closed || !isRecord(raw) || typeof raw.type !== 'string' || JSON.stringify(raw).length > 160000) return;
      const now = performance.now();
      if (now - started > 1000) { count = 0; started = now; }
      if (++count > 120) { channel.close(); return; }
      this.lastPacket = now;
      if (this.hosting) {
        if (raw.type === 'hello' && !joined) {
          if (raw.version !== COOP_VERSION) { this.reject(channel, 'Game versions differ. Everyone should refresh the same website.'); return; }
          if (this.view.status !== 'lobby' || this.view.members.length >= MAX_SQUAD || this.channels.get(channel.peer) !== channel || !isMember(raw.member) || raw.member.id !== channel.peer) { this.reject(channel, 'This lobby cannot accept another survivor.'); return; }
          joined = true; clearTimeout(timeout);
          this.change({ members: [...this.view.members, { id: channel.peer, name: raw.member.name, classId: raw.member.classId, ready: false }] }); this.lobby(); return;
        }
        if (!joined) return;
        this.acks.set(channel.peer, now);
        if (raw.type === 'pong') return;
        if (raw.type === 'member' && this.view.status === 'lobby' && isMember(raw.member) && raw.member.id === channel.peer) {
          const previous = this.view.members.find(m => m.id === channel.peer)!;
          const member = raw.member;
          this.change({ members: this.view.members.map(m => m.id === channel.peer ? { id: m.id, name: member.name, classId: member.classId, ready: previous.classId !== member.classId ? false : member.ready } : m) }); this.lobby();
        }
        if (raw.type === 'input') { const input = readControl(raw.input); if (input) this.world?.input(channel.peer, input); }
        if (raw.type === 'scene-ready') this.world?.storyReady(channel.peer);
      } else {
        if (channel.peer !== this.view.hostId) return;
        if (raw.type === 'reject' && typeof raw.message === 'string') { this.fail(raw.message.slice(0, 180)); return; }
        if (raw.type === 'heartbeat') { this.hostSend({ type: 'pong' }); return; }
        if (raw.type === 'lobby' && raw.version === COOP_VERSION && Array.isArray(raw.members) && raw.members.length <= MAX_SQUAD && raw.members.every(isMember) && raw.members.some(m => m.id === this.view.selfId) && raw.members[0]?.id === this.view.hostId && new Set(raw.members.map(m => m.id)).size === raw.members.length) {
          joined = true; clearTimeout(timeout); accepted?.(); this.change({ status: 'lobby', members: raw.members });
        }
        if (raw.type === 'frame' && joined) {
          const frame = readFrame(raw.frame);
          if (frame && frame.players.some(p => p.id === this.view.selfId) && (!this.view.frame || frame.tick > this.view.frame.tick)) { this.hostAck = now; this.change({ status: 'game', frame, members: frame.players.map(({ id, name, classId, ready }) => ({ id, name, classId, ready })) }); }
        }
      }
    });
    channel.on('close', () => {
      clearTimeout(timeout);
      if (this.closed || this.channels.get(channel.peer) !== channel) return;
      this.disconnected(channel.peer);
    });
    channel.on('error', () => { if (!this.closed) { channel.close(); this.disconnected(channel.peer); } });
  }

  private disconnected(id: string) {
    this.channels.delete(id); this.acks.delete(id);
    if (!this.hosting) { this.fail('The host left or the connection closed. This squad session has ended.'); return; }
    this.world?.remove(id);
    this.change({ members: this.view.members.filter(m => m.id !== id), warning: 'A teammate disconnected. Their slot is now empty.' });
    if (this.view.status === 'lobby') this.lobby();
    else this.publish();
  }
  select(classId: ClassId, ready = false) {
    const member = this.view.members.find(m => m.id === this.view.selfId); if (!member || this.view.status !== 'lobby') return;
    const updated = { ...member, classId, ready: this.hosting || ready };
    if (this.hosting) { this.change({ members: this.view.members.map(m => m.id === member.id ? updated : m) }); this.lobby(); }
    else this.hostSend({ type: 'member', member: updated });
  }
  start() {
    if (!this.hosting || this.view.status !== 'lobby' || this.view.members.length < 2 || !this.view.members.every(m => m.ready)) return;
    this.world = new CoopWorld(this.view.members); this.change({ status: 'game' }); this.publish();
  }
  control(input: Control) { if (this.hosting) this.world?.input(this.view.selfId, input); else this.hostSend({ type: 'input', input }); }
  storyReady() { if (this.hosting) { this.world?.storyReady(this.view.selfId); this.publish(); } else this.hostSend({ type: 'scene-ready' }); }
  pause(value: boolean) { if (this.hosting) { this.world?.setPaused(value); this.publish(); } }
  retry() { if (this.hosting && this.world?.state.phase === 'defeat') { this.world.retry(); this.publish(); } }
  advance(dt: number) { if (this.hosting && this.world) this.world.tick(dt); }
  publish() {
    if (!this.world) return;
    this.world.state.tick++;
    const frame = structuredClone(this.world.state);
    this.change({ frame }); this.broadcast({ type: 'frame', frame });
  }
  get stale() { return !this.hosting && this.view.status === 'game' && !this.view.frame?.paused && performance.now() - this.hostAck > 3000; }
  private fail(error: string) { if (this.closed) return; this.change({ status: 'closed', error }); this.destroy(); }
  destroy() {
    if (this.closed) return;
    this.closed = true; this.cleanup.splice(0).forEach(clean => clean());
    this.channels.clear(); this.peer.destroy();
  }
}
