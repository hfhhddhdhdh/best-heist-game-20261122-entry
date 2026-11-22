// The Meridian Heist — synthesized sound effects, no audio files.
// The WebAudio context is created lazily on the first user gesture.

export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  }

  tone(freq, dur, type = 'sine', gain = 0.08, slideTo = null) {
    if (this.muted || !this.ctx) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur);
    } catch {
      // Sound is garnish; never let it break the game.
    }
  }

  pickup() { this.tone(880, 0.12, 'sine', 0.09, 1320); }
  safeCracked() { this.tone(523, 0.15, 'triangle', 0.1); setTimeout(() => this.tone(784, 0.2, 'triangle', 0.1), 120); }
  smoke() { this.tone(220, 0.35, 'sawtooth', 0.05, 90); }
  emp() { this.tone(1200, 0.25, 'square', 0.05, 120); }
  spotted() { this.tone(440, 0.18, 'square', 0.07, 660); }
  caught() { this.tone(330, 0.4, 'sawtooth', 0.09, 110); }
  levelComplete() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.09), i * 130)); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.09), i * 150)); }
  gameOver() { [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.07), i * 160)); }
}
