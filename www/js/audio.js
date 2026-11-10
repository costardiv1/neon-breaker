// Synthesized "grid" sound design + a small step sequencer for the music.
// Detuned saws, resonant filter sweeps, noise bursts, delay + reverb.

const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]; // minor pentatonic
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicOn = true;
    this.playing = false;
    this.music = new Music(this);
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.build();
      }
      if (this.ctx.state === 'suspended' && this.focused !== false && !document.hidden) this.ctx.resume();
    } catch (e) { /* audio unavailable */ }
  }

  // Mute everything while the page is hidden / unfocused (suspends the clock too).
  // The master gain drops to zero first, so no tail (delay, reverb, engine
  // whine) escapes while the context takes a moment to suspend.
  setFocus(on) {
    on = on && !document.hidden;
    this.focused = on;
    if (!this.ctx) return;
    try {
      const g = this.master.gain, now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.value = 0;
      g.setValueAtTime(0, now);
      if (on) {
        g.setTargetAtTime(0.55, now, 0.05);
        this.ctx.resume();
      } else {
        this.ctx.suspend();
      }
    } catch (e) { /* ignore */ }
  }

  build() {
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.55;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);

    this.send = c.createGain();
    const delay = c.createDelay(1); delay.delayTime.value = 0.23;
    const fb = c.createGain(); fb.gain.value = 0.32;
    const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    this.send.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay);
    const dOut = c.createGain(); dOut.gain.value = 0.35; dlp.connect(dOut); dOut.connect(this.master);
    const verb = c.createConvolver(); verb.buffer = this.impulse(2.4);
    const vOut = c.createGain(); vOut.gain.value = 0.3;
    this.send.connect(verb); verb.connect(vOut); vOut.connect(this.master);

    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.musicOn ? 0.42 : 0;
    this.musicBus.connect(this.master);

    this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // engine: whine that rises with the platform's movement
    this.engGain = c.createGain(); this.engGain.gain.value = 0;
    this.engLp = c.createBiquadFilter(); this.engLp.type = 'lowpass'; this.engLp.Q.value = 9; this.engLp.frequency.value = 400;
    this.engOsc = [];
    for (const dt of [-10, 10]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 70; o.detune.value = dt;
      o.connect(this.engLp); o.start(); this.engOsc.push(o);
    }
    this.engLp.connect(this.engGain); this.engGain.connect(this.master);
  }

  impulse(sec) {
    const c = this.ctx, len = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
  }

  setEnabled(on) {
    // effects only: the music has its own switch (setMusic)
    this.enabled = on;
    if (this.engGain && !on) this.engGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  setMusic(on) {
    this.musicOn = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? (this.music.ducked ? 0.12 : 0.42) : 0, this.ctx.currentTime, 0.15);
  }

  voice({ f, to = null, dur = 0.2, type = 'sawtooth', detune = [0], vol = 0.2, filter = 'lowpass', ff = 4000,
    fto = null, q = 1, send = 0.3, delay = 0, attack = 0.005, at = null, out = null }) {
    if (!this.ctx || (!this.enabled && out !== this.musicBus)) return;
    const c = this.ctx, t = at ?? c.currentTime + delay;
    const flt = c.createBiquadFilter();
    flt.type = filter; flt.Q.value = q;
    flt.frequency.setValueAtTime(ff, t);
    if (fto) flt.frequency.exponentialRampToValueAtTime(fto, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    flt.connect(g); g.connect(out || this.master);
    if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(this.send); }
    for (const dt of detune) {
      const o = c.createOscillator();
      o.type = type;
      o.detune.value = dt;
      o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      o.connect(flt);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  noise({ dur = 0.2, vol = 0.2, filter = 'bandpass', ff = 3000, fto = 300, q = 2, send = 0.3, delay = 0, at = null, out = null }) {
    if (!this.ctx || (!this.enabled && out !== this.musicBus)) return;
    const c = this.ctx, t = at ?? c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const flt = c.createBiquadFilter(); flt.type = filter; flt.Q.value = q;
    flt.frequency.setValueAtTime(ff, t);
    flt.frequency.exponentialRampToValueAtTime(fto, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(out || this.master);
    if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(this.send); }
    src.start(t); src.stop(t + dur + 0.05);
  }

  setPlaying(on) {
    this.playing = on;
    if (this.ctx && !on) this.engGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  engine(speed) {
    if (!this.ctx || !this.playing || !this.enabled) return;
    const t = this.ctx.currentTime;
    const s = Math.min(speed, 2500);
    for (const o of this.engOsc) o.frequency.setTargetAtTime(70 + s * 0.16, t, 0.05);
    this.engLp.frequency.setTargetAtTime(300 + s * 1.6, t, 0.05);
    this.engGain.gain.setTargetAtTime(Math.min(0.06, s / 24000), t, 0.06);
  }

  // ---------- effects ----------
  note(i, base = 220) { return base * Math.pow(2, SCALE[Math.min(i, SCALE.length - 1)] / 12); }

  launch() {
    this.voice({ f: 90, to: 360, dur: 0.45, detune: [-12, 12], vol: 0.16, ff: 300, fto: 3200, q: 9, send: 0.4 });
    this.noise({ dur: 0.3, vol: 0.05, ff: 800, fto: 5000, q: 3 });
  }
  paddle() {
    this.voice({ f: 120, to: 50, dur: 0.22, type: 'sine', vol: 0.45, ff: 800, send: 0 });
    this.voice({ f: 220, dur: 0.18, detune: [-9, 9], vol: 0.16, ff: 3200, fto: 220, q: 14, send: 0.45 });
  }
  wall() {
    this.voice({ f: 1320, to: 990, dur: 0.07, type: 'square', vol: 0.035, filter: 'bandpass', ff: 1800, q: 6, send: 0.5 });
  }
  brick(combo) {
    const f = this.note(combo, 440);
    this.voice({ f, dur: 0.1, type: 'square', vol: 0.07, filter: 'bandpass', ff: f * 2, q: 5, send: 0.5 });
  }
  brk(combo) {
    const f = this.note(combo, 220);
    this.voice({ f: f * 2, to: f * 0.5, dur: 0.24, detune: [-15, 15], vol: 0.16, ff: 6000, fto: 200, q: 13, send: 0.5 });
    this.noise({ dur: 0.2, vol: 0.12, ff: 5000, fto: 400, q: 4, send: 0.4 });
  }
  power(good) {
    const steps = good ? [0, 2, 4, 5, 7] : [6, 4, 2, 0];
    steps.forEach((s, i) => this.voice({ f: this.note(s, good ? 330 : 165), dur: 0.16, detune: [-10, 10],
      vol: good ? 0.13 : 0.11, ff: good ? 4500 : 1500, fto: 400, q: 8, send: 0.6, delay: i * 0.065 }));
  }
  coin() {
    [0, 4, 7].forEach((st, i) => this.voice({ f: this.note(st, 880), dur: 0.09, type: 'square', vol: 0.06, ff: 7000, fto: 2000, q: 2, send: 0.4, delay: i * 0.045 }));
  }
  lose() {
    this.voice({ f: 330, to: 38, dur: 1.1, detune: [-20, 0, 20], vol: 0.2, ff: 3500, fto: 90, q: 16, send: 0.6 });
    this.noise({ dur: 0.9, vol: 0.16, ff: 6000, fto: 150, q: 3, send: 0.5 });
  }
  portal() {
    this.voice({ f: 180, to: 1400, dur: 0.22, type: 'sine', vol: 0.14, ff: 5000, send: 0.6 });
    this.voice({ f: 1400, to: 180, dur: 0.22, type: 'triangle', vol: 0.08, ff: 5000, send: 0.6, delay: 0.05 });
  }
  blast() {
    this.voice({ f: 140, to: 35, dur: 0.45, type: 'sine', vol: 0.5, ff: 900, send: 0.2 });
    this.noise({ dur: 0.4, vol: 0.2, filter: 'lowpass', ff: 3500, fto: 120, q: 1, send: 0.5 });
  }
  laser() {
    this.voice({ f: 2400, to: 700, dur: 0.09, type: 'square', vol: 0.025, filter: 'bandpass', ff: 2600, q: 3, send: 0.3 });
  }
  missile() {
    this.noise({ dur: 0.5, vol: 0.09, ff: 600, fto: 3000, q: 2, send: 0.3 });
    this.voice({ f: 200, to: 600, dur: 0.4, detune: [-10, 10], vol: 0.07, ff: 1500, q: 4, send: 0.3 });
  }
  clang() {
    this.voice({ f: 520, to: 480, dur: 0.18, type: 'square', vol: 0.06, filter: 'bandpass', ff: 1400, q: 10, send: 0.5 });
  }
  bossHit() {
    this.voice({ f: 90, to: 40, dur: 0.35, type: 'sine', vol: 0.5, ff: 800, send: 0.2 });
    this.voice({ f: 880, to: 220, dur: 0.25, detune: [-20, 20], vol: 0.12, ff: 5000, fto: 300, q: 12, send: 0.6 });
    this.noise({ dur: 0.25, vol: 0.14, ff: 4000, fto: 300, q: 3, send: 0.4 });
  }
  charge() {
    this.voice({ f: 110, to: 440, dur: 0.6, detune: [-15, 15], vol: 0.08, ff: 300, fto: 3000, q: 12, send: 0.5 });
  }
  deflect() {
    this.voice({ f: 600, to: 1500, dur: 0.15, type: 'triangle', vol: 0.08, ff: 4000, send: 0.5 });
  }
  capture() {
    this.voice({ f: 300, to: 80, dur: 0.6, detune: [-25, 25], vol: 0.12, ff: 2000, fto: 200, q: 10, send: 0.6 });
  }
  hurt() {
    this.voice({ f: 180, to: 70, dur: 0.3, type: 'square', vol: 0.1, ff: 1200, fto: 200, q: 6, send: 0.3 });
  }
  fury() {
    this.voice({ f: 55, to: 220, dur: 1.4, detune: [-30, 0, 30], vol: 0.22, ff: 200, fto: 4000, q: 14, send: 0.7 });
    this.noise({ dur: 1.2, vol: 0.12, ff: 300, fto: 6000, q: 2, send: 0.6 });
  }
  bossDie() {
    for (let i = 0; i < 6; i++) this.blastAt(i * 0.28);
    this.voice({ f: 440, to: 30, dur: 2.6, detune: [-30, 0, 30], vol: 0.2, ff: 5000, fto: 60, q: 16, send: 0.8 });
  }
  blastAt(d) {
    this.voice({ f: 150, to: 30, dur: 0.5, type: 'sine', vol: 0.45, ff: 900, send: 0.2, delay: d });
    this.noise({ dur: 0.45, vol: 0.18, filter: 'lowpass', ff: 4000, fto: 100, q: 1, send: 0.5, delay: d });
  }
  pulse() {
    this.voice({ f: 660, dur: 0.18, detune: [-6, 6], vol: 0.08, ff: 3000, fto: 500, q: 6, send: 0.6 });
  }
  click() {
    this.voice({ f: 1480, to: 740, dur: 0.06, type: 'square', vol: 0.05, filter: 'bandpass', ff: 2000, q: 4, send: 0.4 });
  }
  clear() {
    [0, 2, 4, 5, 7, 9, 10].forEach((s, i) => this.voice({ f: this.note(s, 262), dur: 0.3, detune: [-8, 8],
      vol: 0.12, ff: 5000, fto: 600, q: 6, send: 0.7, delay: i * 0.07 }));
  }
  // fake crash: a stuck-buffer buzz, then nothing
  crash() {
    for (let i = 0; i < 9; i++) {
      this.voice({ f: 110 + (i % 3) * 37, dur: 0.07, type: 'square', vol: 0.09, ff: 3000, q: 1, send: 0, delay: i * 0.085 });
      this.noise({ dur: 0.06, vol: 0.07, ff: 5000, q: 1, send: 0, delay: i * 0.085 });
    }
    this.voice({ f: 50, dur: 0.9, type: 'square', vol: 0.12, ff: 600, q: 1, send: 0, delay: 0.8 });
  }
  over() {
    this.voice({ f: 220, to: 30, dur: 2.2, detune: [-25, 0, 25], vol: 0.22, ff: 2500, fto: 60, q: 18, send: 0.7 });
    this.noise({ dur: 1.6, vol: 0.14, ff: 4000, fto: 100, q: 2, send: 0.6 });
  }
}

// ---------- music ----------
const I = {
  kick(s, t, v = 0.5) { s.voice({ f: 150, to: 42, dur: 0.28, type: 'sine', vol: v, ff: 1200, send: 0, attack: 0.002, at: t, out: s.musicBus }); },
  hat(s, t, open = false, v = 0.05) { s.noise({ dur: open ? 0.12 : 0.035, vol: v, filter: 'highpass', ff: 7000, fto: 9000, q: 0.7, send: 0.1, at: t, out: s.musicBus }); },
  snare(s, t) {
    s.noise({ dur: 0.16, vol: 0.12, filter: 'bandpass', ff: 2000, fto: 900, q: 1, send: 0.3, at: t, out: s.musicBus });
    s.voice({ f: 200, to: 140, dur: 0.1, type: 'triangle', vol: 0.08, send: 0, at: t, out: s.musicBus });
  },
  bass(s, t, m, dur, v = 0.14, ff = 900) { s.voice({ f: mtof(m), dur, detune: [-7, 7], vol: v, ff, fto: ff * 0.25, q: 5, send: 0.05, at: t, out: s.musicBus }); },
  arp(s, t, m, v = 0.045, type = 'square', ff = 3200) { s.voice({ f: mtof(m), dur: 0.16, type, vol: v, ff, fto: 600, q: 4, send: 0.55, at: t, out: s.musicBus }); },
  pad(s, t, ms, dur, v = 0.022) {
    for (const m of ms) s.voice({ f: mtof(m), dur, type: 'sawtooth', detune: [-9, 9], vol: v, ff: 900, fto: 500, q: 1, send: 0.7, attack: 0.6, at: t, out: s.musicBus });
  },
  lead(s, t, m, dur) { s.voice({ f: mtof(m), dur, detune: [-12, 12], vol: 0.05, ff: 4200, fto: 1200, q: 7, send: 0.6, at: t, out: s.musicBus }); },
};

const PROG1 = [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]]; // Am F C G
const PROG2 = [[38, [0, 3, 7]], [34, [0, 4, 7]], [31, [0, 3, 7]], [33, [0, 4, 7]]]; // Dm Bb Gm A

// World 1 "GRADE": driving octave bass + 16th arpeggio.
function gridTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG1[bar];
  if (i % 4 === 0) I.kick(s, t);
  if (i % 4 === 2) I.hat(s, t, true);
  else if (boss || fury) I.hat(s, t, false, 0.03);
  if (boss && (i === 4 || i === 12)) I.snare(s, t);
  if (i % 2 === 0) I.bass(s, t, root + (i % 4 === 2 ? 12 : 0), d * 1.7);
  const seq = [0, 1, 2, 1];
  I.arp(s, t, root + 24 + iv[seq[i % 4]] + (i >= 8 ? 12 : 0), boss ? 0.05 : 0.04, boss ? 'sawtooth' : 'square');
  if (i === 0) I.pad(s, t, iv.map((x) => root + 12 + x), d * 16);
  if (fury && i % 4 === 0) I.lead(s, t, root + 36 + iv[Math.floor(step / 4) % 3], d * 3);
}

// World 2 "NÚCLEO": slow heartbeat, long bass, delayed arpeggio.
function coreTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG2[bar];
  if (i === 0 || i === 3) I.kick(s, t, i === 0 ? 0.55 : 0.35);
  if (i === 8 || i === 11) I.kick(s, t, i === 8 ? 0.4 : 0.25);
  if (boss && (i === 4 || i === 12)) I.snare(s, t);
  if (i % 4 === 2) I.hat(s, t, false, 0.035);
  if (i === 0 || i === 8) I.bass(s, t, root, d * 7.5, 0.17, 500);
  if (boss || i % 2 === 0) I.arp(s, t, root + 24 + iv[(i >> 1) % 3] + 12 * (bar % 2), 0.04, boss ? 'sawtooth' : 'triangle', 2400);
  if (i === 0) I.pad(s, t, [root + 12 + iv[0], root + 12 + iv[1], root + 12 + iv[2], root + 24], d * 16, 0.02);
  if (fury && i % 8 === 0) I.lead(s, t, root + 31 + iv[Math.floor(step / 8) % 3], d * 6);
}

// World 3 "AURUM": frantic four-on-the-floor, rolling 16th acid bass,
// offbeat open hats and a relentless high arpeggio. Boss adds claps + lead.
const PROG3 = [[40, [0, 3, 7]], [36, [0, 4, 7]], [38, [0, 4, 7]], [35, [0, 4, 7]]]; // Em C D B
function corpTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG3[bar];
  if (i % 4 === 0) I.kick(s, t, 0.55);
  if (i % 4 === 2) I.hat(s, t, true, 0.06);
  else I.hat(s, t, false, 0.03);
  if (i === 4 || i === 12) I.snare(s, t);
  if (boss && (i === 14 || i === 15)) I.snare(s, t);
  const acid = 700 + 1400 * (0.5 + 0.5 * Math.sin(step * 0.35));
  I.bass(s, t, root + (i % 8 === 6 ? 12 : 0) + (i === 15 ? 7 : 0), d * 0.9, 0.13, acid);
  const seq = [0, 2, 1, 2, 0, 1, 2, 1];
  I.arp(s, t, root + 36 + iv[seq[i % 8]] + (i % 4 === 3 ? 12 : 0), 0.035, 'sawtooth', 4200);
  if (i === 0) I.pad(s, t, iv.map((x) => root + 24 + x), d * 16, 0.016);
  if ((boss || fury) && i % 2 === 0) I.lead(s, t, root + 48 + iv[(step >> 1) % 3], d * 1.6);
}

// District 4 "MADRUGADA": a broken breakbeat, a ticking clock on the hats,
// a deep sub bass and a sparse, echoing pluck. Boss adds the alarm.
const PROG4 = [[44, [0, 3, 7]], [40, [0, 4, 7]], [47, [0, 3, 7]], [42, [0, 4, 7]]]; // G#m E D#m F#
function nightTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG4[bar];
  if (i === 0 || i === 10 || (i === 7 && bar % 2)) I.kick(s, t, 0.55);
  if (i === 4 || i === 12) I.snare(s, t);
  if (boss && i === 15) I.snare(s, t);
  I.hat(s, t, false, i % 4 === 0 ? 0.045 : 0.02);          // the clock
  if (i === 0 || i === 6 || i === 10) I.bass(s, t, root, d * 5, 0.16, 420);
  if (i % 3 === 0) I.arp(s, t, root + 24 + iv[(step / 3 | 0) % 3] + (i > 8 ? 12 : 0), 0.04, 'triangle', 2600);
  if (i === 0) I.pad(s, t, iv.map((x) => root + 12 + x), d * 16, 0.02);
  if ((boss || fury) && i % 4 === 2) I.arp(s, t, root + 48 + (i % 8 === 2 ? 0 : 7), 0.035, 'square', 5000); // alarm
  if (fury && i % 8 === 0) I.lead(s, t, root + 36 + iv[(step >> 3) % 3], d * 5);
}

// District 5 "CÓDIGO-FONTE": straight 4/4, a square-wave bass in 8ths and a
// glitchy arpeggio that jumps octaves like data. Boss adds snare rolls.
const PROG5 = [[41, [0, 3, 7]], [44, [0, 4, 7]], [39, [0, 4, 7]], [46, [0, 3, 7]]]; // Fm G# D# A#m
function codeTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG5[bar];
  if (i % 4 === 0) I.kick(s, t, 0.55);
  if (i % 4 === 2) I.hat(s, t, true, 0.05); else I.hat(s, t, false, 0.025);
  if (i === 4 || i === 12) I.snare(s, t);
  if (boss && bar === 3 && i >= 12) I.snare(s, t);
  if (i % 2 === 0) s.voice({ f: mtof(root + (i % 8 === 4 ? 12 : 0)), dur: d * 1.6, type: 'square', vol: 0.06, ff: 1100, fto: 300, q: 3, send: 0.05, at: t, out: s.musicBus });
  const jump = ((step * 7) % 5 === 0) ? 24 : 12;
  I.arp(s, t, root + 24 + iv[(step * 5) % 3] + jump, 0.035, 'square', 3800);
  if (i === 0) I.pad(s, t, iv.map((x) => root + 12 + x), d * 16, 0.018);
  if ((boss || fury) && i % 2 === 1) I.lead(s, t, root + 48 + iv[(step >> 1) % 3], d * 1.2);
}

// District 6 "VIRAL": a bouncy offbeat bass and a short hook that keeps repeating,
// an octave up every other bar, like something being shared around.
const PROG6 = [[43, [0, 3, 7]], [46, [0, 4, 7]], [41, [0, 4, 7]], [48, [0, 3, 7]]]; // Gm A# F Cm
function viralTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG6[bar];
  if (i % 4 === 0) I.kick(s, t, 0.55);
  if (i % 4 === 2) { I.hat(s, t, true, 0.05); I.bass(s, t, root + 12, d * 1.4, 0.13, 1100); }
  else if (i % 2 === 1) I.hat(s, t, false, 0.025);
  if (i === 4 || i === 12) I.snare(s, t);
  if (boss && (i === 7 || i === 15)) I.snare(s, t);
  if (i === 0 || i === 8) I.bass(s, t, root, d * 1.8, 0.15, 700);
  const hook = [0, 2, 1, 2, 0, 2, 1, 0];
  if (boss || i % 2 === 0) I.arp(s, t, root + 24 + iv[hook[(i >> 1) % 8]] + (bar % 2 ? 12 : 0), 0.04, 'square', 3400);
  if (i === 0) I.pad(s, t, iv.map((x) => root + 12 + x), d * 16, 0.018);
  if ((boss || fury) && i % 4 === 3) I.lead(s, t, root + 48 + iv[(step >> 2) % 3], d * 1.5);
}

// District 7 "CENSURA": cold and mechanical. Outside boss fights the end of
// every fourth bar is cut to silence, as if the track itself were censored.
const PROG7 = [[37, [0, 3, 7]], [37, [0, 3, 7]], [40, [0, 4, 7]], [35, [0, 4, 7]]]; // C#m C#m E B
function censorTrack(s, step, t, d, fury, boss) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG7[bar];
  if (!boss && bar === 3 && i >= 12) return;
  if (i === 0 || i === 6 || i === 8) I.kick(s, t, 0.55);
  if (i === 4 || i === 12) I.snare(s, t);
  if (i % 2 === 0) I.hat(s, t, false, i % 4 === 2 ? 0.05 : 0.025);
  if (boss && i % 4 === 3) I.hat(s, t, true, 0.04);
  if (i === 0 || i === 3 || i === 8 || i === 11) I.bass(s, t, root, d * 2.4, 0.16, 520);
  if (i % 4 === 2) I.arp(s, t, root + 24 + iv[(step >> 2) % 3], 0.04, 'sawtooth', 2000);
  if (i === 0) I.pad(s, t, iv.map((x) => root + 12 + x), d * 16, 0.02);
  if ((boss || fury) && i % 8 === 4) I.lead(s, t, root + 36 + iv[(step >> 3) % 3], d * 3);
  if (fury && i % 2 === 1) I.arp(s, t, root + 48, 0.03, 'square', 5200);
}

function mapTrack(s, step, t, d) {
  const bar = Math.floor(step / 16) % 4, i = step % 16;
  const [root, iv] = PROG1[bar];
  if (i === 0) {
    I.pad(s, t, iv.map((x) => root + 12 + x).concat([root + 24]), d * 16, 0.02);
    I.bass(s, t, root, d * 12, 0.08, 400);
  }
  if (i % 4 === 0 && Math.random() < 0.7) I.arp(s, t, root + 36 + iv[Math.floor(Math.random() * 3)], 0.03, 'triangle', 2200);
}

const TRACKS = {
  // Tempo curve for the 10 districts: it rises fast at first and then levels
  // off, so the last one stays playable. District n: 118 132 150 152 154 156
  // 158 160 162 165; bosses +8 (fury plays 10% faster). From district 4 on the
  // intensity grows through the arrangement (layers, fills), not the tempo.
  map:   { bpm: 84,  fn: (s, st, t, d) => mapTrack(s, st, t, d) },
  w1:    { bpm: 118, fn: (s, st, t, d, f) => gridTrack(s, st, t, d, f, false) },
  boss1: { bpm: 126, fn: (s, st, t, d, f) => gridTrack(s, st, t, d, f, true) },
  w2:    { bpm: 132, fn: (s, st, t, d, f) => coreTrack(s, st, t, d, f, false) },
  boss2: { bpm: 140, fn: (s, st, t, d, f) => coreTrack(s, st, t, d, f, true) },
  w3:    { bpm: 150, fn: (s, st, t, d, f) => corpTrack(s, st, t, d, f, false) },
  boss3: { bpm: 158, fn: (s, st, t, d, f) => corpTrack(s, st, t, d, f, true) },
  w4:    { bpm: 152, fn: (s, st, t, d, f) => nightTrack(s, st, t, d, f, false) },
  boss4: { bpm: 160, fn: (s, st, t, d, f) => nightTrack(s, st, t, d, f, true) },
  w5:    { bpm: 154, fn: (s, st, t, d, f) => codeTrack(s, st, t, d, f, false) },
  boss5: { bpm: 162, fn: (s, st, t, d, f) => codeTrack(s, st, t, d, f, true) },
  w6:    { bpm: 156, fn: (s, st, t, d, f) => viralTrack(s, st, t, d, f, false) },
  boss6: { bpm: 164, fn: (s, st, t, d, f) => viralTrack(s, st, t, d, f, true) },
  w7:    { bpm: 158, fn: (s, st, t, d, f) => censorTrack(s, st, t, d, f, false) },
  boss7: { bpm: 166, fn: (s, st, t, d, f) => censorTrack(s, st, t, d, f, true) },
};

class Music {
  constructor(s) {
    this.s = s;
    this.track = null;
    this.step = 0;
    this.next = 0;
    this.fury = false;
    this.beats = [];
    this.beatLen = 0.5;
    this.ducked = false;
    this.timer = null;
  }

  play(name) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    this.next = 0;
    this.fury = false;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 30);
  }

  setFury(f) { this.fury = f; }

  duck(on) {
    if (this.ducked === on) return;
    this.ducked = on;
    if (this.s.ctx) this.s.setMusic(this.s.musicOn);
  }

  tick() {
    const c = this.s.ctx;
    if (!c || !this.track || !this.s.musicOn || c.state !== 'running' || document.hidden) return;
    const T = TRACKS[this.track];
    const d = 60 / (T.bpm * (this.fury ? 1.1 : 1)) / 4;
    if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.2) {
      if (this.step % 4 === 0) {
        this.beats.push(this.next);
        if (this.beats.length > 8) this.beats.shift();
        this.beatLen = d * 4;
      }
      T.fn(this.s, this.step, this.next, d, this.fury);
      this.next += d;
      this.step++;
    }
  }

  // 0 right on a beat, rising to 1 just before the next one.
  beatPhase() {
    const c = this.s.ctx;
    if (!c || !this.beats.length) return 1;
    const now = c.currentTime;
    let last = null;
    for (const b of this.beats) if (b <= now) last = b;
    if (last === null) return 1;
    return Math.min(1, (now - last) / this.beatLen);
  }
}

export const sfx = new Sfx();
export const music = sfx.music;

export const haptics = { on: true };
export function vibrate(ms) {
  if (!haptics.on) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ }
}
