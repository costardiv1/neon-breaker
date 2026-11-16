// ---------- NEON FIGHTERS: the first stage of the next game (a demo) ----------
// Unlocked by beating O SISTEMA. A ship seen from above, built on the ARCO
// breaker (curved wings) with the player's emblem and colors, fires two
// lasers on its own while the player drags it around. Hordes of enemies come
// in for about two and a half minutes, then the mother ship, A COLMEIA.
import { TAU, rgba, mix, neonStroke, glowText, neonTitle, view } from './render.js';
import { drawShip } from './platform.js';
import { sfx, music, vibrate } from './audio.js';

const W = 720;
const SHIP_R = 22;          // the ship's hitbox (a bit smaller than the drawing)
const FIRE = [0.15, 0.13, 0.1];   // seconds between shots, per power level
const BOLT_V = 1150;
const BOSS_AT = 150;        // seconds into the stage when the mother ship comes
const BOSS_HP = 320;
const SHIELDS = 3;

// the hordes: [start, end, every (s), formation]
const WAVES = [
  [2, 22, 2.6, 'line'],
  [18, 50, 3.4, 'darts'],
  [30, 70, 2.4, 'snake'],
  [45, 110, 6, 'tank'],
  [60, 140, 2, 'line'],
  [75, 140, 2.8, 'vee'],
  [95, 140, 2.2, 'darts'],
  [110, 140, 4.5, 'tank'],
];
const HORDES = [[0, 'HORDA 1'], [30, 'HORDA 2'], [60, 'HORDA 3'], [95, 'HORDA 4'], [120, 'HORDA FINAL']];

export class Fighters {
  constructor(H, top, plat, col) {
    this.H = H; this.top = top; this.plat = plat; this.col = col;
    this.t = -2.6;          // a short title before the first horda
    this.ship = { x: W / 2, y: H - 260, tx: W / 2, ty: H - 260, hp: SHIELDS, inv: 0, fire: 0, lvl: 0, tilt: 0 };
    this.bolts = []; this.foes = []; this.shots = []; this.parts = []; this.orbs = []; this.floats = [];
    this.next = WAVES.map((w) => w[0]);
    this.horde = -1;
    this.banner = null;
    this.score = 0;
    this.boss = null;
    this.state = 'play';   // play | won | lost
    this.endT = 0;
    this.shake = 0;
    this.stars = [];
    for (let i = 0; i < 70; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, v: 60 + Math.random() * 260 });
    music.play('fighters');
  }

  // drag: the ship follows the finger's movement (not its position, so the
  // finger never covers it)
  press(x, y) { this.drag = { x, y, sx: this.ship.tx, sy: this.ship.ty }; }
  move(x, y, mouse) {
    const s = this.ship;
    if (mouse) { s.tx = x; s.ty = y - 80; }
    else if (this.drag) { s.tx = this.drag.sx + (x - this.drag.x) * 1.15; s.ty = this.drag.sy + (y - this.drag.y) * 1.15; }
    s.tx = Math.max(36, Math.min(W - 36, s.tx));
    s.ty = Math.max(this.top + 120, Math.min(this.H - 120, s.ty));
  }
  release() { this.drag = null; }

  // ---------- update ----------
  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    for (const st of this.stars) { st.y += st.v * dt; if (st.y > this.H) { st.y = 0; st.x = Math.random() * W; } }
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const f of this.floats) { f.y -= 40 * dt; f.t -= dt; }
    this.floats = this.floats.filter((f) => f.t > 0);
    if (this.state !== 'play') { this.endT += dt; this.updateShots(dt); return; }

    const s = this.ship;
    const ox = s.x;
    s.x += (s.tx - s.x) * Math.min(1, dt * 18);
    s.y += (s.ty - s.y) * Math.min(1, dt * 18);
    s.tilt += (Math.max(-1, Math.min(1, (s.x - ox) / (dt * 600))) - s.tilt) * Math.min(1, dt * 10);
    s.inv = Math.max(0, s.inv - dt);
    if (this.t < 0) return;

    // the ship fires on its own: two lasers, more with power
    s.fire -= dt;
    if (s.fire <= 0) {
      s.fire = FIRE[s.lvl];
      for (const o of [-13, 13]) this.bolts.push({ x: s.x + o, y: s.y - 18, vx: 0 });
      if (s.lvl >= 1) for (const o of [-1, 1]) this.bolts.push({ x: s.x + o * 26, y: s.y - 4, vx: o * 240 });
      sfx.shipShot();
    }
    for (const b of this.bolts) { b.x += b.vx * dt; b.y -= BOLT_V * dt; }
    this.bolts = this.bolts.filter((b) => b.y > this.top - 40 && !b.dead);

    // the hordes
    if (!this.boss) {
      const hz = HORDES.filter((h) => this.t >= h[0]).length - 1;
      if (hz > this.horde) { this.horde = hz; this.banner = { text: HORDES[hz][1], t: 1.8, max: 1.8 }; sfx.power(true); }
      WAVES.forEach((w, i) => {
        if (this.t >= this.next[i] && this.t < w[1]) { this.next[i] += w[2]; this.spawn(w[3]); }
      });
      if (this.t >= BOSS_AT - 4 && !this.alert) { this.alert = true; this.banner = { text: 'ALERTA', sub: 'NAVE-MÃE A CAMINHO', t: 3.5, max: 3.5 }; sfx.charge(); }
      if (this.t >= BOSS_AT && !this.foes.length) this.startBoss();
    }
    this.updateFoes(dt);
    this.updateShots(dt);
    for (const o of this.orbs) {
      o.y += 120 * dt; o.t += dt;
      if (Math.hypot(o.x - s.x, o.y - s.y) < 34) {
        o.got = true;
        if (s.lvl < 2) { s.lvl++; this.float(s.lvl === 1 ? 'TIRO TRIPLO' : 'TIRO RÁPIDO', s.x, s.y - 50); }
        else { this.score += 100; this.float('+100', s.x, s.y - 50); }
        sfx.power(true);
      }
    }
    this.orbs = this.orbs.filter((o) => !o.got && o.y < this.H + 30);
  }

  spawn(kind) {
    const y = this.top - 30;
    if (kind === 'line') {
      const n = 5 + Math.floor(Math.random() * 3), x0 = 90 + Math.random() * 60;
      for (let i = 0; i < n; i++) this.foes.push(this.foe('drone', x0 + i * ((W - 2 * x0) / (n - 1)), y - (i % 2) * 30, { ph: i * 0.6 }));
    } else if (kind === 'vee') {
      const cx = 180 + Math.random() * (W - 360);
      for (let i = -3; i <= 3; i++) this.foes.push(this.foe('drone', cx + i * 50, y - Math.abs(i) * 34, { ph: 0, amp: 30 }));
    } else if (kind === 'snake') {
      const side = Math.random() < 0.5 ? -1 : 1;
      for (let i = 0; i < 7; i++) this.foes.push(this.foe('drone', W / 2 + side * 150, y - i * 46, { ph: -i * 0.5, amp: 170, f: 1.6 }));
    } else if (kind === 'darts') {
      for (const sd of [-1, 1]) this.foes.push(this.foe('dart', W / 2 + sd * (150 + Math.random() * 120), y, {}));
    } else if (kind === 'tank') {
      this.foes.push(this.foe('tank', 140 + Math.random() * (W - 280), y, {}));
    }
  }

  foe(kind, x, y, o) {
    const hp = { drone: 1, dart: 2, tank: 10 }[kind];
    return Object.assign({ kind, x, y, x0: x, t: 0, hp, max: hp, flash: 0, amp: 70, f: 1.2, ph: 0, cd: 1.2 + Math.random() }, o);
  }

  updateFoes(dt) {
    const s = this.ship;
    for (const e of this.foes) {
      e.t += dt; e.flash = Math.max(0, e.flash - dt * 6);
      if (e.kind === 'drone') {
        e.y += 150 * dt;
        e.x = e.x0 + e.amp * Math.sin(e.t * e.f + e.ph);
      } else if (e.kind === 'dart') {
        if (e.t < 0.8) e.y += 160 * dt;   // comes in, takes aim...
        else {
          if (!e.vx && !e.vy) { const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy) || 1; e.vx = (dx / d) * 520; e.vy = (dy / d) * 520; sfx.deflect(); }
          e.x += e.vx * dt; e.y += e.vy * dt;   // ...and dives
        }
      } else if (e.kind === 'tank') {
        if (e.y < this.top + 200) e.y += 90 * dt;
        else if (e.t > 9) e.y += 120 * dt;
        e.x += Math.sin(e.t * 0.8) * 40 * dt;
        e.cd -= dt;
        if (e.cd <= 0 && e.y < this.H - 300) { e.cd = 1.7; this.aim(e.x, e.y + 20, 3, 0.25, 300); }
      }
      if (Math.hypot(e.x - s.x, e.y - s.y) < SHIP_R + this.radius(e)) { this.hurt(); if (e.kind !== 'tank') this.kill(e, false); }
    }
    for (const b of this.bolts) {
      for (const e of this.foes) {
        if (e.dead || Math.abs(b.x - e.x) > this.radius(e) || Math.abs(b.y - e.y) > this.radius(e) + 10) continue;
        b.dead = true; e.hp--; e.flash = 1;
        if (e.hp <= 0) this.kill(e, true); else sfx.brick(2);
        break;
      }
    }
    this.foes = this.foes.filter((e) => !e.dead && e.y < this.H + 60 && e.x > -60 && e.x < W + 60);
    if (this.boss) this.updateBoss(dt);
  }

  radius(e) { return e.kind === 'tank' ? 30 : e.kind === 'dart' ? 18 : 18; }

  kill(e, byShot) {
    e.dead = true;
    this.burst(e.x, e.y, e.kind === 'tank' ? 34 : 16);
    if (byShot) {
      const pts = { drone: 10, dart: 20, tank: 80 }[e.kind];
      this.score += pts;
      if (e.kind === 'tank' || Math.random() < 0.03) this.orbs.push({ x: e.x, y: e.y, t: 0 });
    }
    sfx.brk(e.kind === 'tank' ? 8 : 3);
    if (e.kind === 'tank') { this.shake = 0.4; vibrate(20); }
  }

  // n shots in a fan aimed at the ship
  aim(x, y, n, spread, v) {
    const s = this.ship, a0 = Math.atan2(s.y - y, s.x - x);
    for (let i = 0; i < n; i++) {
      const a = a0 + (i - (n - 1) / 2) * spread;
      this.shots.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
    }
  }

  updateShots(dt) {
    const s = this.ship;
    for (const q of this.shots) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (this.state === 'play' && Math.hypot(q.x - s.x, q.y - s.y) < SHIP_R - 4) { q.dead = true; this.hurt(); }
    }
    this.shots = this.shots.filter((q) => !q.dead && q.y > this.top - 40 && q.y < this.H + 40 && q.x > -40 && q.x < W + 40);
  }

  hurt() {
    const s = this.ship;
    if (s.inv > 0 || this.state !== 'play') return;
    s.hp--; s.inv = 1.6; s.lvl = Math.max(0, s.lvl - 1);
    this.shake = 0.9;
    this.burst(s.x, s.y, 20);
    sfx.hurt(); vibrate(70);
    if (s.hp <= 0) {
      this.state = 'lost'; this.endT = 0;
      if (this.onEnd) this.onEnd(this.score);
      this.burst(s.x, s.y, 60);
      sfx.over();
      music.play(null);
    }
  }

  // ---------- A COLMEIA: the mother ship ----------
  startBoss() {
    this.boss = { x: W / 2, y: this.top - 160, hp: BOSS_HP, t: 0, flash: 0, cd: 2.5, ring: 3.5, hatch: 5, rot: 0 };
    this.banner = { text: 'A COLMEIA', sub: 'NAVE-MÃE', t: 2.6, max: 2.6 };
    music.play('fighterBoss');
    sfx.fury();
  }

  updateBoss(dt) {
    const B = this.boss, rage = B.hp < BOSS_HP / 2;
    B.t += dt; B.flash = Math.max(0, B.flash - dt * 6); B.rot += dt * (rage ? 0.9 : 0.5);
    const yT = this.top + 200;
    if (B.y < yT) B.y += 110 * dt;
    else B.x = W / 2 + 190 * Math.sin(B.t * (rage ? 0.7 : 0.45));
    if (B.y >= yT - 1) {
      B.cd -= dt; B.ring -= dt; B.hatch -= dt;
      if (B.cd <= 0) { B.cd = rage ? 1.2 : 1.8; this.aim(B.x, B.y + 60, rage ? 5 : 3, 0.22, 330); }
      if (B.ring <= 0) {   // a ring of shots all around
        B.ring = rage ? 3.2 : 4.6;
        const n = rage ? 22 : 16;
        for (let i = 0; i < n; i++) { const a = B.rot + (i * TAU) / n; this.shots.push({ x: B.x, y: B.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220 }); }
        sfx.pulse();
      }
      if (B.hatch <= 0) {   // drones out of the hatch
        B.hatch = rage ? 4 : 6;
        for (const sd of [-1, 1]) this.foes.push(this.foe('drone', B.x + sd * 60, B.y + 40, { amp: 110, ph: sd }));
      }
    }
    for (const b of this.bolts) {
      if (b.dead || Math.hypot(b.x - B.x, b.y - B.y) > 78) continue;
      b.dead = true; B.hp--; B.flash = 1;
      if (Math.random() < 0.3) this.parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 160, life: 0.4, max: 0.4, c: '#ffffff' });
      if (B.hp === Math.floor(BOSS_HP / 2)) { this.banner = { text: 'FÚRIA', sub: 'A COLMEIA', t: 1.8, max: 1.8 }; this.shake = 0.8; sfx.fury(); }
      if (B.hp <= 0) { this.win(); return; }
    }
    if (Math.hypot(B.x - this.ship.x, B.y - this.ship.y) < 70 + SHIP_R) this.hurt();
  }

  win() {
    const B = this.boss;
    for (let i = 0; i < 6; i++) this.burst(B.x + (Math.random() - 0.5) * 140, B.y + (Math.random() - 0.5) * 100, 30);
    this.score += 1000 + this.ship.hp * 500;
    this.boss = null; this.foes = []; this.shots = [];
    this.state = 'won'; this.endT = 0;
    if (this.onEnd) this.onEnd(this.score);
    this.shake = 1.2;
    sfx.bossDie(); vibrate(200);
    music.play(null);
  }

  burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = 60 + Math.random() * 320, life = 0.4 + Math.random() * 0.5;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, c: i % 3 ? this.col : '#ffffff' });
    }
  }

  float(text, x, y) { this.floats.push({ text, x, y, t: 1.2 }); }

  // ---------- render ----------
  render(c, now) {
    const col = this.col, s = this.ship, H = this.H;
    c.save();
    if (this.shake > 0) c.translate((Math.random() * 2 - 1) * 10 * this.shake, (Math.random() * 2 - 1) * 10 * this.shake);
    // space: a grid that scrolls down and streaks of stars
    c.strokeStyle = rgba(col, 0.07); c.lineWidth = 1; c.beginPath();
    for (let x = 40; x < W; x += 80) { c.moveTo(x, 0); c.lineTo(x, H); }
    const off = (this.t * 120) % 80;
    for (let y = off - 80; y < H; y += 80) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    for (const st of this.stars) {
      c.globalAlpha = 0.2 + st.v / 500;
      c.fillStyle = st.v > 240 ? '#ffffff' : col;
      c.fillRect(st.x, st.y, 2, 2 + st.v / 60);
    }
    c.globalAlpha = 1;

    for (const o of this.orbs) {
      const r = 13 + 2 * Math.sin(o.t * 8);
      c.beginPath(); c.arc(o.x, o.y, r, 0, TAU); c.fillStyle = rgba(col, 0.25); c.fill();
      neonStroke(c, col, col, 2.5, o.x - r, o.y, o.x + r, o.y, 1);
      glowText(c, 'P', o.x, o.y + 1, 15, '#ffffff', col, 'center', 800, 2);
    }
    if (this.boss) this.drawBoss(c);
    for (const e of this.foes) this.drawFoe(c, e);

    c.lineCap = 'round';
    for (const b of this.bolts) {
      c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y + 22);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.5; c.shadowColor = col; c.shadowBlur = 10 * view.blur; c.stroke(); c.shadowBlur = 0;
    }
    for (const q of this.shots) {
      c.beginPath(); c.arc(q.x, q.y, 7, 0, TAU); c.fillStyle = rgba(col, 0.35); c.fill();
      c.beginPath(); c.arc(q.x, q.y, 4, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    }
    if (this.state !== 'lost' && (s.inv <= 0 || Math.floor(this.t * 14) % 2 === 0)) drawShip(c, this.plat, s.x, s.y, now, col, s.tilt);
    for (const p of this.parts) {
      c.globalAlpha = Math.max(0, p.life / p.max);
      c.fillStyle = p.c; c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    c.globalAlpha = 1;
    for (const f of this.floats) {
      c.globalAlpha = Math.min(1, f.t * 2);
      glowText(c, f.text, f.x, f.y, 18, '#ffffff', col, 'center', 700, 3);
    }
    c.globalAlpha = 1;
    c.restore();
    this.renderHud(c);
  }

  drawFoe(c, e) {
    const col = this.col, k = e.flash, fill = rgba(col, 0.15 + 0.5 * k);
    c.save(); c.translate(e.x, e.y);
    c.beginPath();
    if (e.kind === 'drone') {   // a diamond with a core
      c.moveTo(0, -16); c.lineTo(17, 0); c.lineTo(0, 16); c.lineTo(-17, 0); c.closePath();
      c.fillStyle = fill; c.fill();
      neonStroke(c, col, col, 2.4, -17, 0, 17, 0, 0.8 + k);
      c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    } else if (e.kind === 'dart') {   // an arrow pointing where it dives
      c.rotate(e.vx || e.vy ? Math.atan2(e.vy, e.vx) - Math.PI / 2 : 0);
      c.moveTo(0, 20); c.lineTo(14, -14); c.lineTo(0, -6); c.lineTo(-14, -14); c.closePath();
      c.fillStyle = fill; c.fill();
      neonStroke(c, col, col, 2.4, -14, 0, 14, 0, 0.9 + k);
    } else {   // tank: a hexagon with a turret
      for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 30, Math.sin(a) * 30); }
      c.closePath();
      c.fillStyle = fill; c.fill();
      neonStroke(c, col, col, 3, -30, 0, 30, 0, 0.9 + k);
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.moveTo(0, 8); c.lineTo(0, 24); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(-14, -36, 28 * (e.hp / e.max), 3);
    }
    c.restore();
  }

  drawBoss(c) {
    const B = this.boss, col = this.col, k = B.flash;
    c.save(); c.translate(B.x, B.y);
    // the hive: a big hexagon of cells around a core
    c.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 92, Math.sin(a) * 80); }
    c.closePath();
    c.fillStyle = '#000'; c.fill(); c.fillStyle = rgba(col, 0.12 + 0.35 * k); c.fill();
    neonStroke(c, col, col, 3.5, -92, 0, 92, 0, 1 + k);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = B.rot + (i * TAU) / 6, hx = Math.cos(a) * 50, hy = Math.sin(a) * 42;
      for (let q = 0; q < 6; q++) { const b = (q * TAU) / 6; c[q ? 'lineTo' : 'moveTo'](hx + Math.cos(b) * 16, hy + Math.sin(b) * 16); }
      c.closePath();
    }
    c.strokeStyle = rgba(col, 0.75); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(0, 0, 20 + 3 * Math.sin(B.t * 6), 0, TAU);
    c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 26 * view.blur; c.fill(); c.shadowBlur = 0;
    c.restore();
    // its health
    const bw = 420, x = W / 2 - bw / 2, y = this.top + 20;
    glowText(c, 'A COLMEIA', W / 2, y, 13, '#ffffff', col, 'center', 700, 4);
    c.beginPath(); c.rect(x, y + 14, bw, 9); c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = col; c.fillRect(x + 2, y + 16, (bw - 4) * Math.max(0, B.hp / BOSS_HP), 5);
  }

  renderHud(c) {
    const col = this.col, H = this.H, hy = this.top - 62;
    glowText(c, String(this.score), W / 2, hy, 36, '#ffffff', col, 'center', 700, 3);
    glowText(c, 'NEON FIGHTERS  ·  FASE 1', W / 2, hy + 36, 13, rgba(col, 0.85), col, 'center', 500, 4);
    for (let i = 0; i < SHIELDS; i++) {
      const x = 34 + i * 30, on = i < this.ship.hp;
      c.beginPath(); c.moveTo(x, hy - 18); c.lineTo(x + 11, hy - 12); c.lineTo(x + 9, hy + 2); c.lineTo(x, hy + 8); c.lineTo(x - 9, hy + 2); c.lineTo(x - 11, hy - 12); c.closePath();
      if (on) { c.fillStyle = rgba(col, 0.5); c.fill(); }
      c.strokeStyle = on ? col : rgba(col, 0.35); c.lineWidth = 2; c.stroke();
    }
    c.beginPath();
    c.moveTo(W - 56, hy - 14); c.lineTo(W - 56, hy + 14);
    c.moveTo(W - 40, hy - 14); c.lineTo(W - 40, hy + 14);
    neonStroke(c, col, col, 4, W - 56, hy - 14, W - 40, hy + 14, 0.7);
    if (this.t < 0) {   // the title before the first horda
      c.globalAlpha = Math.min(1, (this.t + 2.6) / 0.5, -this.t / 0.4);
      neonTitle(c, 'NEON', W / 2, H * 0.4, 96, col, col, 14);
      neonTitle(c, 'FIGHTERS', W / 2, H * 0.4 + 84, 52, mix(col, '#ffffff', 0.4), col, 14);
      glowText(c, 'ARRASTE PARA MOVER  ·  O TIRO É AUTOMÁTICO', W / 2, H * 0.4 + 150, 15, '#ffffff', col, 'center', 600, 3);
      c.globalAlpha = 1;
    }
    if (this.banner) {
      const b = this.banner, age = b.max - b.t;
      c.globalAlpha = Math.min(1, age / 0.3, b.t / 0.5);
      neonTitle(c, b.text, W / 2, H * 0.45, 50, col, col, 8);
      if (b.sub) glowText(c, b.sub, W / 2, H * 0.45 + 50, 18, '#ffffff', col, 'center', 700, 5);
      c.globalAlpha = 1;
    }
    if (this.state !== 'play' && this.endT > 0.8) {
      c.globalAlpha = Math.min(1, (this.endT - 0.8) / 0.6);
      c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(0, 0, W, H);
      if (this.state === 'won') {
        glowText(c, 'NAVE-MÃE DERRUBADA', W / 2, H * 0.27, 20, rgba(col, 0.9), col, 'center', 700, 6);
        neonTitle(c, 'NEON', W / 2, H * 0.36, 90, col, col, 14);
        neonTitle(c, 'FIGHTERS', W / 2, H * 0.36 + 78, 48, mix(col, '#ffffff', 0.4), col, 14);
        glowText(c, 'EM BREVE', W / 2, H * 0.36 + 140, 26, '#ffffff', col, 'center', 800, 8);
      } else {
        neonTitle(c, 'FIM DA DEMO', W / 2, H * 0.34, 56, col, col, 12);
        glowText(c, 'SUA NAVE CAIU', W / 2, H * 0.34 + 54, 18, '#ffffff', col, 'center', 600, 4);
      }
      glowText(c, this.score + ' PONTOS', W / 2, H * 0.56, 30, '#ffffff', col, 'center', 700, 3);
      if (this.best) glowText(c, this.newBest ? 'NOVO RECORDE!' : 'RECORDE  ' + this.best, W / 2, H * 0.56 + 40, 16, rgba(col, 0.9), col, 'center', 500, 4);
      c.globalAlpha = 1;
    }
  }
}
