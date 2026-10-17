import { DEFAULT_SETTINGS, GameSettings } from './classes';

export function musicProfile(level: number) {
  return { tempo: 80 + level * 7 % 37, transposition: level * 7 % 12, mode: level % 3, stride: level % 5 + 1, instrument: level % 2 ? 'sine' as const : 'triangle' as const };
}

class ApocalypseAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private effects?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private next = 0;
  private step = 0;
  private settings = DEFAULT_SETTINGS;
  private combat = false;
  private journey = 0;
  private noise?: AudioBuffer;

  async unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        const compressor = this.ctx.createDynamicsCompressor(); compressor.connect(this.master);
        this.music = this.ctx.createGain(); this.music.connect(compressor);
        this.effects = this.ctx.createGain(); this.effects.connect(compressor);
        this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.configure(this.settings);
        this.next = this.ctx.currentTime + .06;
        this.timer = setInterval(() => this.schedule(), 40);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch { /* Audio is optional when a browser disables Web Audio. */ }
  }

  configure(settings: GameSettings) {
    this.settings = settings;
    if (!this.ctx) return;
    this.master!.gain.setTargetAtTime(settings.volume, this.ctx.currentTime, .06);
    this.music!.gain.setTargetAtTime(settings.music ? .24 : 0, this.ctx.currentTime, .08);
    this.effects!.gain.setTargetAtTime(settings.sfx ? .65 : 0, this.ctx.currentTime, .03);
  }

  setCombat(value: boolean) { this.combat = value; }
  setJourney(level: number) { this.journey = level; this.step = 0; if (this.ctx) this.next = this.ctx.currentTime + .08; }

  private tone(frequency: number, time: number, duration: number, volume: number, type: OscillatorType, destination: AudioNode, endFrequency?: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(.001, time); gain.gain.linearRampToValueAtTime(volume, time + .006); gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    osc.connect(gain); gain.connect(destination); osc.start(time); osc.stop(time + duration + .02);
  }

  private hiss(time: number, duration: number, volume: number, frequency: number, destination: AudioNode) {
    if (!this.ctx || !this.noise) return;
    const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
    source.buffer = this.noise; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .6;
    gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    source.connect(filter); filter.connect(gain); gain.connect(destination); source.start(time); source.stop(time + duration);
  }

  private schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + .03;
    while (this.next < this.ctx.currentTime + .15) {
      const t = this.next, s = this.step % 64, beat = s % 16;
      const profile = musicProfile(this.journey);
      const root = [55, 43.654, 65.406, 49][(Math.floor(s / 16) + Math.floor(this.journey / 12)) % 4] * 2 ** (profile.transposition / 12);
      if (s % 4 === 0) {
        this.tone(root * (beat === 8 ? 2 : 1), t, .29, .4, 'triangle', this.music!);
        this.tone(120, t, .18, .6, 'sine', this.music!, 32);
      }
      if (beat === 4 || beat === 12) this.hiss(t, .13, .24, 1600, this.music!);
      if (s % 2 === 0) this.hiss(t, .035, s % 4 === 0 ? .1 : .055, 8500, this.music!);
      const notes = profile.mode === 0 ? [0, 3, 7, 10, 12, 15] : profile.mode === 1 ? [0, 2, 5, 7, 10, 14] : [0, 4, 7, 9, 12, 16];
      if ((this.combat || s % 2 === 0) && this.settings.music) {
        const semi = notes[(Math.floor(s / 2) * profile.stride + Math.floor(s / 16)) % notes.length];
        this.tone(root * 4 * 2 ** (semi / 12), t, .28 + this.journey % 4 * .06, this.combat ? .065 : .04, profile.instrument, this.music!);
      }
      if (beat === 0 && this.settings.music) {
        for (const ratio of [1, 1.1892, 1.4983]) this.tone(root * 2 * ratio, t, 2.1, .075, 'sine', this.music!);
      }
      this.next += 60 / profile.tempo / 4; this.step++;
    }
  }

  play(type: 'shoot' | 'shotgun' | 'hit' | 'hurt' | 'reload' | 'pickup' | 'ability' | 'wave' | 'click' | 'death') {
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime, out = this.effects!;
    if (type === 'shoot' || type === 'shotgun') {
      this.hiss(t, type === 'shotgun' ? .23 : .09, .46, 1900, out);
      this.tone(150, t, .09, .32, 'triangle', out, 40);
      this.tone(550, t, .035, .06, 'square', out, 100);
    } else if (type === 'hit') { this.hiss(t, .11, .22, 650, out); this.tone(95, t, .1, .18, 'triangle', out, 37); }
    else if (type === 'hurt') { this.tone(140, t, .2, .28, 'sawtooth', out, 45); this.hiss(t, .18, .12, 400, out); }
    else if (type === 'reload') { for (let i = 0; i < 3; i++) this.hiss(t + i * .13, .04, .16, 2000 + i * 1000, out); }
    else if (type === 'pickup' || type === 'ability') { for (let i = 0; i < 4; i++) this.tone(220 * 2 ** (i / 3), t + i * .075, .2, .15, 'triangle', out); }
    else if (type === 'wave') { for (let i = 0; i < 3; i++) this.tone(i === 2 ? 440 : 330, t + i * .19, .13, .13, 'square', out); }
    else if (type === 'death') { this.tone(200, t, 1.1, .3, 'sawtooth', out, 25); this.hiss(t, .6, .18, 400, out); }
    else this.tone(700, t, .045, .08, 'sine', out, 450);
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    void this.ctx?.close(); this.ctx = undefined;
  }
}

export const audio = new ApocalypseAudio();
