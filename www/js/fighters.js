// ---------- NEON FIGHTERS: the first stage of the next game (a demo) ----------
// Unlocked by beating O SISTEMA. A ship seen from above, built on the ARCO
// breaker (curved wings) with the player's emblem and colors, fires on its own
// (1 laser, up to 4 with the ? capsules) while the player drags it around. Hordes of enemies come
// in for about two and a half minutes, then the mother ship, A COLMEIA.
import { TAU, rgba, mix, neonStroke, glowText, neonTitle, view } from './render.js';
import { drawShip } from './platform.js';
import { drawAbilityIcon } from './game.js';
import { sfx, music, vibrate } from './audio.js';

const W = 720;
const SHIP_R = 22;          // the ship's hitbox (a bit smaller than the drawing)
const FIRE = [0.18, 0.14, 0.09];  // seconds between shots, per TIRO RÁPIDO level
const LASERS = 4;                  // the ship starts with 1 laser and gets up to 4
// laser layout per count: [x offset, sideways speed]
const GUNS = [null, [[0, 0]], [[-11, 0], [11, 0]], [[-18, -160], [0, 0], [18, 160]], [[-26, -240], [-9, 0], [9, 0], [26, 240]]];
const BOLT_V = 1150;
const SHIP_V = 1400, SHIP_ACC = 20;   // top speed (px/s) and how fast it gets there
const FOE_SHOT = '#ff3b5c';           // the tank's turret blinks this red before it fires
const DRONE_SHOT_V = 250, TANK_WARN = 0.4;
// ? capsules: fly across the screen; the player grabs them for a power
const CAP_FIRST = 6, CAP_EVERY = [8, 12], CAP_R = 20;
// ONDA DE CHOQUE: the demo's perk; kills charge it, the button fires it
const SHOCK_R = 380, SHOCK_T = 0.6, SHOCK_DMG = 3, SHOCK_BOSS = 18;
const CHARGE = { drone: 0.05, dart: 0.08, tank: 0.2, boss: 0.005 };
// the ground under the drones scrolls by: fields, then a forest, then the city where the mother ship waits
const GROUND_V = 110, ROW_H = 90;
const BIOMES = [[0, 'campo'], [45, 'floresta'], [95, 'cidade']];
const AVE = 70;   // half the width of the city avenue
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
const INTRO_T = 4.6;
const INTRO = ['> as máquinas tomaram o céu.', '> o breaker virou nave.', '> derrube a COLMEIA.'];
const HORDES = [[0, 'HORDA 1'], [30, 'HORDA 2'], [60, 'HORDA 3'], [95, 'HORDA 4'], [120, 'HORDA FINAL']];

export class Fighters {
  constructor(H, top, plat, col) {
    this.H = H; this.top = top; this.plat = plat; this.col = col;
    this.t = -INTRO_T;      // a short title before the first horda
    this.shipTaps = 0;
    this.ship = { x: W / 2, y: H - 260, tx: W / 2, ty: H - 260, vx: 0, vy: 0, hp: SHIELDS, inv: 0, fire: 0, guns: 1, rate: 0, tilt: 0 };
    this.bolts = []; this.foes = []; this.shots = []; this.parts = []; this.caps = []; this.floats = [];
    this.capT = CAP_FIRST;
    this.energy = 0; this.wave = null;
    this.next = WAVES.map((w) => w[0]);
    this.horde = -1;
    this.banner = null;
    this.score = 0;
    this.boss = null;
    this.state = 'play';   // play | won | lost
    this.endT = 0;
    this.shake = 0;
    this.rows = []; this.lanes = [];
    for (let x = -10; x < W; ) { const w = 120 + Math.random() * 130; this.lanes.push({ x, w, left: 0 }); x += w; }
    for (let y = H - ROW_H; y > -ROW_H * 2; y -= ROW_H) this.rows.push(this.makeRow(y, 'campo'));
    music.play('fighters');
  }

  // a touch sends the ship to the finger (a bit above it, so the finger never
  // covers it) and then it follows the drag; the mouse is followed without a click
  perkRect() { return { x: W - 112, y: this.H - 150, w: 84, h: 84 }; }
  press(x, y, mouse) {
    const r = this.perkRect();
    if (this.state === 'play' && x > r.x - 10 && x < r.x + r.w + 10 && y > r.y - 10 && y < r.y + r.h + 10) { this.usePerk(); this.btnTap = true; return; }
    if (this.t < 0 && Math.hypot(x - this.ship.x, y - this.ship.y) < 60 && ++this.shipTaps >= 5) {   // 5 taps on the ship in the opening
      this.shipTaps = 0; sfx.quack(); this.float('qua!', this.ship.x, this.ship.y - 50);
    }
    if (mouse) return;
    this.move(x, y, true);
    this.drag = { x, y, sx: this.ship.tx, sy: this.ship.ty };
  }
  move(x, y, mouse) {
    const s = this.ship;
    if (mouse) { s.tx = x; s.ty = y - 80; }
    else if (this.drag) { s.tx = this.drag.sx + (x - this.drag.x) * 1.15; s.ty = this.drag.sy + (y - this.drag.y) * 1.15; }
    s.tx = Math.max(36, Math.min(W - 36, s.tx));
    s.ty = Math.max(this.top + 120, Math.min(this.H - 120, s.ty));
  }
  release() {
    if (this.btnTap) { this.btnTap = false; return; }   // the finger that tapped the button lets go: the drag goes on
    this.drag = null;
  }

  // ---------- the ground ----------
  biome() { let b = BIOMES[0][1]; for (const [t, n] of BIOMES) if (this.t >= t) b = n; return b; }
  makeRow(y, kind) {
    const R = Math.random, row = { y, kind, items: [] }, it = row.items;
    if (kind === 'campo') {
      for (const L of this.lanes) {   // a patchwork of crop fields, 1 to 3 rows tall, now and then a little house
        if (L.left-- > 0) continue;
        if (R() < 0.12) { L.left = 0; it.push({ k: 'h', x: L.x + L.w / 2, y: 20 + R() * 50, s: 14 + R() * 6 }); continue; }
        const n = 1 + Math.floor(R() * 3); L.left = n - 1;
        it.push({ k: 'f', x: L.x + 5, w: L.w - 10, n, v: R() < 0.5 });
      }
      for (const L of this.lanes) if (R() < 0.15) it.push({ k: 't', x: L.x, y: R() * ROW_H, r: 9 + R() * 7 });   // lone trees between fields
    } else if (kind === 'floresta') {
      const n = 11 + Math.floor(R() * 5);
      for (let i = 0; i < n; i++) it.push({ k: 't', x: R() * W, y: R() * ROW_H, r: 14 + R() * 16 });
    } else {
      row.street = R() < 0.3;   // a cross street now and then; blocks of rooftops on both sides of the avenue
      if (!row.street) for (const [a, b] of [[0, W / 2 - AVE], [W / 2 + AVE, W]]) {
        let x = a + 6;
        while (x < b - 30) { const w = Math.min(b - 6 - x, 50 + R() * 80); it.push({ k: 'r', x, w, h: 50 + R() * 26, dot: R() < 0.5 }); x += w + 10; }
      }
    }
    return row;
  }
  updateGround(dt) {
    for (const r of this.rows) r.y += GROUND_V * dt;
    this.rows = this.rows.filter((r) => r.y < this.H + ROW_H * 3);   // a tall field reaches up from its row
    let top = Math.min(...this.rows.map((r) => r.y));
    while (top > -ROW_H) { top -= ROW_H; this.rows.push(this.makeRow(top, this.biome())); }
  }
  drawGround(c, col) {
    const faint = new Path2D(), lit = new Path2D();
    let dash = null;
    for (const row of this.rows) {
      const y0 = row.y;
      if (row.kind === 'cidade') {
        if (row.street) { for (const yy of [y0 + 20, y0 + ROW_H - 20]) { lit.moveTo(0, yy); lit.lineTo(W, yy); } }
        for (const xx of [W / 2 - AVE + 8, W / 2 + AVE - 8]) { lit.moveTo(xx, y0); lit.lineTo(xx, y0 + ROW_H); }
        (dash = dash || new Path2D()).moveTo(W / 2, y0); dash.lineTo(W / 2, y0 + ROW_H);
      }
      for (const q of row.items) {
        if (q.k === 'f') {
          const top = y0 + ROW_H - q.n * ROW_H + 5, bot = y0 + ROW_H - 5;
          if (bot < 0 || top > this.H) continue;
          lit.rect(q.x, top, q.w, bot - top);
          if (q.v) for (let x = q.x + 12; x < q.x + q.w - 4; x += 12) { faint.moveTo(x, top + 6); faint.lineTo(x, bot - 6); }
          else for (let y = top + 12; y < bot - 4; y += 12) { faint.moveTo(q.x + 6, y); faint.lineTo(q.x + q.w - 6, y); }
        } else if (q.k === 'h') {
          const s = q.s, x = q.x, y = y0 + q.y;
          lit.rect(x - s, y - s * 0.7, s * 2, s * 1.4); lit.moveTo(x - s, y - s * 0.7); lit.lineTo(x, y); lit.lineTo(x + s, y - s * 0.7);
          lit.moveTo(x, y); lit.lineTo(x - s, y + s * 0.7); lit.moveTo(x, y); lit.lineTo(x + s, y + s * 0.7);
        } else if (q.k === 't') {
          const y = y0 + q.y;
          lit.moveTo(q.x + q.r, y); lit.arc(q.x, y, q.r, 0, TAU);
          faint.moveTo(q.x + q.r * 0.45, y); faint.arc(q.x, y, q.r * 0.45, 0, TAU);
        } else if (q.k === 'r') {
          const y = y0 + (ROW_H - q.h) / 2;
          lit.rect(q.x, y, q.w, q.h); faint.rect(q.x + 6, y + 6, q.w - 12, q.h - 12);
          if (q.dot) faint.rect(q.x + q.w / 2 - 5, y + q.h / 2 - 5, 10, 10);
        }
      }
    }
    c.lineWidth = 1.2;
    c.strokeStyle = rgba(col, 0.1); c.stroke(faint);
    c.strokeStyle = rgba(col, 0.2); c.stroke(lit);
    if (dash) { c.save(); c.setLineDash([18, 22]); c.lineDashOffset = -(this.t * GROUND_V) % 40; c.strokeStyle = rgba(col, 0.25); c.lineWidth = 2; c.stroke(dash); c.restore(); }
  }

  // ---------- update ----------
  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    this.updateGround(dt);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const f of this.floats) { f.y -= 40 * dt; f.t -= dt; }
    this.floats = this.floats.filter((f) => f.t > 0);
    if (this.state !== 'play') { this.endT += dt; this.updateShots(dt); return; }

    const s = this.ship;
    const ox = s.x;
    // it heads for the finger with a short acceleration and a top speed, so dodging takes a little foresight
    const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
    const want = Math.min(SHIP_V, d * 14), wx = d > 0.5 ? (dx / d) * want : 0, wy = d > 0.5 ? (dy / d) * want : 0;
    s.vx += (wx - s.vx) * Math.min(1, dt * SHIP_ACC); s.vy += (wy - s.vy) * Math.min(1, dt * SHIP_ACC);
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.tilt += (Math.max(-1, Math.min(1, (s.x - ox) / (dt * 600))) - s.tilt) * Math.min(1, dt * 10);
    s.inv = Math.max(0, s.inv - dt);
    if (this.t < 0) return;

    // the ship fires on its own: 1 to 4 lasers (LASER +1), faster with TIRO RÁPIDO
    s.fire -= dt;
    if (s.fire <= 0) {
      s.fire = FIRE[s.rate];
      for (const [o, vx] of GUNS[s.guns]) this.bolts.push({ x: s.x + o, y: s.y - (vx ? 6 : 18), vx });
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
    this.updateWave(dt);
    this.updateCaps(dt);
  }

  // ---------- ? capsules ----------
  // one flies across the screen every 8 to 12 s (tanks drop one too); what it gives is a surprise
  updateCaps(dt) {
    const s = this.ship;
    if (!this.boss || this.boss.y > this.top) this.capT -= dt;
    if (this.capT <= 0) {
      this.capT = CAP_EVERY[0] + Math.random() * (CAP_EVERY[1] - CAP_EVERY[0]);
      const side = Math.random() < 0.5 ? -1 : 1;
      this.caps.push({ x: side < 0 ? -30 : W + 30, y: this.top + 120 + Math.random() * (this.H * 0.35), vx: -side * (130 + Math.random() * 50), vy: 45, t: Math.random() * 6 });
    }
    for (const q of this.caps) {
      q.t += dt;
      q.x += q.vx * dt; q.y += (q.vy + Math.sin(q.t * 3) * 60) * dt;
      if (Math.hypot(q.x - s.x, q.y - s.y) < CAP_R + SHIP_R + 6) { q.got = true; this.grab(q); }
    }
    this.caps = this.caps.filter((q) => !q.got && q.y < this.H + 40 && q.x > -60 && q.x < W + 60);
  }
  grab(q) {
    const s = this.ship;
    const pool = [];
    if (s.guns < LASERS) pool.push(['guns', 3]);
    if (s.rate < FIRE.length - 1) pool.push(['rate', 2]);
    if (s.hp < SHIELDS) pool.push(['shield', 1.2]);
    if (this.energy < 1) pool.push(['energy', 1.5]);
    let roll = Math.random() * pool.reduce((a, p) => a + p[1], 0), kind = 'points';
    for (const [k, w] of pool) { roll -= w; if (roll <= 0) { kind = k; break; } }
    const text = { guns: 'LASER +1', rate: 'TIRO RÁPIDO', shield: 'ESCUDO +1', energy: 'ONDA CARREGADA', points: '+200' }[kind];
    if (kind === 'guns') s.guns++;
    else if (kind === 'rate') s.rate++;
    else if (kind === 'shield') s.hp++;
    else if (kind === 'energy') this.energy = 1;
    else this.score += 200;
    this.float(text, s.x, s.y - 50);
    this.burst(q.x, q.y, 14);
    sfx.power(true);
  }

  // ---------- ONDA DE CHOQUE ----------
  charge(k) { const was = this.energy < 1; this.energy = Math.min(1, this.energy + k); if (was && this.energy >= 1) sfx.charge(); }
  usePerk() {
    if (this.energy < 1 || this.wave || this.state !== 'play' || this.t < 0) return;
    this.energy = 0;
    this.wave = { x: this.ship.x, y: this.ship.y, r: 0, t: 0, hit: new Set(), boss: false };
    this.shake = 0.5; sfx.blast(); vibrate(40);
  }
  updateWave(dt) {
    const w = this.wave;
    if (!w) return;
    w.t += dt; w.r = SHOCK_R * Math.min(1, w.t / SHOCK_T);
    for (const q of this.shots) if (Math.hypot(q.x - w.x, q.y - w.y) < w.r) q.dead = true;   // it wipes the enemy shots
    for (const e of this.foes) {
      if (e.dead || w.hit.has(e) || Math.hypot(e.x - w.x, e.y - w.y) > w.r + this.radius(e)) continue;
      w.hit.add(e); e.hp -= SHOCK_DMG; e.flash = 1;
      if (e.hp <= 0) { this.noCharge = true; this.kill(e, true); this.noCharge = false; }   // the wave's own kills don't refill it
    }
    const B = this.boss;
    if (B && !w.boss && Math.hypot(B.x - w.x, B.y - w.y) < w.r + 80) {
      w.boss = true; B.hp -= SHOCK_BOSS; B.flash = 1;
      if (B.hp <= 0) { this.win(); }
    }
    if (w.t > SHOCK_T + 0.25) this.wave = null;
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
    return Object.assign({ kind, x, y, x0: x, t: 0, hp, max: hp, flash: 0, amp: 70, f: 1.2, ph: 0, cd: 1.2 + Math.random() * 2, spin: Math.random() * TAU }, o);
  }

  updateFoes(dt) {
    const s = this.ship;
    for (const e of this.foes) {
      e.t += dt; e.flash = Math.max(0, e.flash - dt * 6);
      if (e.kind === 'drone') {
        e.y += 150 * dt;
        e.x = e.x0 + e.amp * Math.sin(e.t * e.f + e.ph);
        e.cd -= dt;   // every drone fires a slow shot straight down
        if (e.cd <= 0 && e.y > this.top + 40 && e.y < this.H - 300) { e.cd = 2.2 + Math.random() * 1.4; this.shots.push({ x: e.x, y: e.y + 14, vx: 0, vy: DRONE_SHOT_V, small: true }); }
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
        e.warn = e.cd < TANK_WARN && e.y < this.H - 300;   // the turret blinks right before it fires
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
      if (!this.noCharge) this.charge(CHARGE[e.kind]);
      if (e.kind === 'tank') this.caps.push({ x: e.x, y: e.y, vx: 0, vy: 110, t: 0 });   // a tank always leaves a ?
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
    s.hp--; s.inv = 1.6; s.guns = Math.max(1, s.guns - 1);   // a hit costs one laser
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
      b.dead = true; B.hp--; B.flash = 1; this.charge(CHARGE.boss);
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
    this.drawGround(c, col);

    for (const q of this.caps) {   // a ? capsule: a glowing pill that spins a little
      const r = CAP_R + 2 * Math.sin(q.t * 8);
      c.save(); c.translate(q.x, q.y); c.rotate(Math.sin(q.t * 2) * 0.25);
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = rgba(col, 0.25); c.fill();
      neonStroke(c, col, col, 2.8, -r, 0, r, 0, 1.1);
      c.beginPath(); c.arc(0, 0, r + 6 + 3 * Math.sin(q.t * 5), 0, TAU); c.strokeStyle = rgba(col, 0.25); c.lineWidth = 1.5; c.stroke();
      glowText(c, '?', 0, 1, 20, '#ffffff', col, 'center', 900, 0);
      c.restore();
    }
    if (this.wave) {   // ONDA DE CHOQUE: a ring that grows from the ship
      const w = this.wave, k = Math.max(0, 1 - Math.max(0, w.t - SHOCK_T) / 0.25);
      for (const f of [1, 0.86]) {
        c.beginPath(); c.arc(w.x, w.y, w.r * f, 0, TAU);
        c.strokeStyle = rgba(f === 1 ? '#ffffff' : col, 0.9 * k); c.lineWidth = f === 1 ? 5 : 2.5;
        c.shadowColor = col; c.shadowBlur = 22 * view.blur; c.stroke(); c.shadowBlur = 0;
      }
    }
    if (this.boss) this.drawBoss(c);
    for (const e of this.foes) this.drawFoe(c, e);

    c.lineCap = 'round';
    for (const b of this.bolts) {
      c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * 0.02, b.y + 22);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3.5; c.shadowColor = col; c.shadowBlur = 10 * view.blur; c.stroke(); c.shadowBlur = 0;
    }
    for (const q of this.shots) {   // enemy shots: round, in the theme color with a white core (the ship's lasers are streaks)
      const R = q.small ? 6 : 8;
      c.beginPath(); c.arc(q.x, q.y, R, 0, TAU); c.fillStyle = rgba(col, 0.35); c.fill();
      c.beginPath(); c.arc(q.x, q.y, R * 0.55, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
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
    if (e.kind === 'drone') {   // a quadcopter: a diamond body, four arms and spinning propellers
      for (const [ax, ay] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.moveTo(ax * 6, ay * 6); c.lineTo(ax * 17, ay * 17); }
      c.strokeStyle = rgba(col, 0.8); c.lineWidth = 2.2; c.stroke();
      const spin = e.spin + e.t * 38;
      for (const [ax, ay] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const px = ax * 17, py = ay * 17;
        c.beginPath(); c.arc(px, py, 8, 0, TAU); c.fillStyle = rgba(col, 0.1); c.fill();
        c.strokeStyle = rgba(col, 0.35); c.lineWidth = 1; c.stroke();
        const a = spin * (ax * ay);   // neighbours turn opposite ways
        c.beginPath(); c.moveTo(px - Math.cos(a) * 8, py - Math.sin(a) * 8); c.lineTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8);
        c.strokeStyle = rgba('#ffffff', 0.85); c.lineWidth = 2; c.stroke();
      }
      c.beginPath();
      c.moveTo(0, -11); c.lineTo(11, 0); c.lineTo(0, 11); c.lineTo(-11, 0); c.closePath();
      c.fillStyle = fill; c.fill();
      neonStroke(c, col, col, 2.4, -11, 0, 11, 0, 0.8 + k);
      c.beginPath(); c.arc(0, 0, 3.5, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
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
      const hot = e.warn && Math.floor(e.t * 16) % 2 === 0;   // blinks red right before the fan
      c.beginPath(); c.moveTo(0, 8); c.lineTo(0, 24); c.strokeStyle = hot ? FOE_SHOT : '#ffffff'; c.lineWidth = hot ? 6 : 4; c.stroke();
      if (hot) { c.beginPath(); c.arc(0, 26, 6, 0, TAU); c.fillStyle = rgba(FOE_SHOT, 0.6); c.fill(); }
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
    if (this.state === 'play') {   // ONDA DE CHOQUE: the ring fills with kills; tap when it is full
      const r = this.perkRect(), cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = 34, full = this.energy >= 1 && !this.wave;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU);
      c.fillStyle = rgba(col, full ? 0.25 + 0.1 * Math.sin(this.t * 6) : 0.06); c.fill();
      c.strokeStyle = rgba(col, 0.35); c.lineWidth = 2; c.stroke();
      c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * this.energy);
      neonStroke(c, col, col, 3.5, cx - R, cy, cx + R, cy, full ? 1.3 : 0.6);
      drawAbilityIcon(c, 'shock', cx, cy, 15, full ? '#ffffff' : rgba(col, 0.9));
      if (full) glowText(c, 'TOQUE', cx, cy - R - 14, 11, '#ffffff', col, 'center', 700, 2);
    }
    if (this.t < 0) {   // the title before the first horda
      c.globalAlpha = Math.min(1, (this.t + INTRO_T) / 0.5, -this.t / 0.4);
      let left = (this.t + INTRO_T) * 30;   // the intro is typed like the diary
      c.font = '22px Consolas, "Courier New", monospace'; c.textAlign = 'left';
      INTRO.forEach((ln, i) => {
        if (left <= 0) return;
        c.fillStyle = rgba(col, 0.95);
        c.fillText(ln.slice(0, Math.floor(left)), 70, H * 0.2 + i * 36);
        left -= ln.length + 8;
      });
      neonTitle(c, 'NEON', W / 2, H * 0.4, 96, col, col, 14);
      neonTitle(c, 'FIGHTERS', W / 2, H * 0.4 + 84, 52, mix(col, '#ffffff', 0.4), col, 14);
      glowText(c, 'ARRASTE PARA MOVER  ·  O TIRO É AUTOMÁTICO', W / 2, H * 0.4 + 150, 15, '#ffffff', col, 'center', 600, 3);
      glowText(c, 'PEGUE AS CÁPSULAS ?  ·  O BOTÃO SOLTA A ONDA DE CHOQUE', W / 2, H * 0.4 + 178, 13, rgba('#ffffff', 0.8), col, 'center', 500, 2);
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
