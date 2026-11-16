// Bosses: one per world, built around that world's mechanic.
// Each boss has a weak point, abilities that mess with the disc
// (deflect, capture & throw...) and 2 health bars; losing the first one
// triggers FURY mode.
import { TAU, rgba, neonStroke, view, glowText, neonTitle } from './render.js';
import { sfx, vibrate } from './audio.js';

const W = 720;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Disc vs axis-aligned rectangle; bounces and returns true on contact.
export function collideRect(b, x, y, w, h) {
  const r = b.r;
  if (b.x + r < x || b.x - r > x + w || b.y + r < y || b.y - r > y + h) return false;
  const qx = clamp(b.x, x, x + w), qy = clamp(b.y, y, y + h);
  const dx = b.x - qx, dy = b.y - qy;
  if (dx * dx + dy * dy > r * r) return false;
  if (dx === 0 && dy === 0) {
    const l = b.x - x, rt = x + w - b.x, t = b.y - y, bt = y + h - b.y;
    const m = Math.min(l, rt, t, bt);
    if (m === t) { b.vy = -Math.abs(b.vy); b.y = y - r; }
    else if (m === bt) { b.vy = Math.abs(b.vy); b.y = y + h + r; }
    else if (m === l) { b.vx = -Math.abs(b.vx); b.x = x - r; }
    else { b.vx = Math.abs(b.vx); b.x = x + w + r; }
  } else if (Math.abs(dx) > Math.abs(dy)) {
    b.vx = Math.sign(dx) * Math.abs(b.vx); b.x = qx + Math.sign(dx) * r;
  } else {
    b.vy = Math.sign(dy) * Math.abs(b.vy); b.y = qy + Math.sign(dy) * r;
  }
  return true;
}

// Disc vs circle (bounce outward). Returns true on contact.
function collideCircle(b, cx, cy, R) {
  const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
  if (d >= R + b.r || d === 0) return false;
  const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
  if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
  b.x = cx + nx * (R + b.r + 0.5); b.y = cy + ny * (R + b.r + 0.5);
  return true;
}

function poly(c, pts, close = true) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}

class Boss {
  constructor(g, name) {
    this.g = g;
    this.name = name;
    this.lives = 2;
    this.hpMax = 5;
    this.hp = this.hpMax;
    this.fury = false;
    this.t = 0;
    this.flash = 0;
    this.inv = 1.5;
    this.dead = false;
    this.deathT = 0;
    this.abilityT = 4;
    this.charge = null;
    this.coreCool = 0;
    this.tele = '';
  }

  // n hits on the weak point
  // minor = laser/missile chip damage: lighter feedback, no drops.
  damage(n, force = false, minor = false) {
    if (this.dead || (this.inv > 0 && !force)) return false;
    this.hp -= n;
    this.flash = minor ? Math.max(this.flash, 0.5) : 1;
    if (minor) { sfx.brick(6); this.g.score += 60; }
    else {
      sfx.bossHit();
      vibrate(25);
      this.g.shake = Math.max(this.g.shake, 0.45);
      this.g.score += 250;
      this.g.gainEnergy(0.2);
      this.g.emit('chip', 5);
      this.g.ring(this.cx, this.cy, 120);
      this.g.burst(this.cx, this.cy, 14, 1.2);
      if (Math.random() < 0.2) this.g.spawnDrop(this.cx, this.cy + 40);
    }
    if (this.hp <= 0) {
      if (this.lives === 2) { this.lives = 1; this.hp = this.hpMax; this.enterFury(); }
      else this.die();
    }
    return true;
  }

  enterFury() {
    this.fury = true;
    this.inv = 2.4;
    this.charge = null;
    this.abilityT = 2.5;
    this.g.onFury(this);
  }

  die() {
    this.g.emit('chip', 60);
    this.dead = true;
    this.deathT = 2.6;
    this.g.onBossDeath(this);
  }

  update(dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 4);
    this.inv = Math.max(0, this.inv - dt);
    this.coreCool = Math.max(0, this.coreCool - dt);
    if (this.dead) {
      this.deathT -= dt;
      if (Math.random() < dt * 14) {
        const x = this.cx + (Math.random() - 0.5) * 220, y = this.cy + (Math.random() - 0.5) * 120;
        this.g.ring(x, y, 60 + Math.random() * 80);
        this.g.burst(x, y, 10, 1.3);
      }
      return;
    }
    this.move(dt);
    if (!this.charge) {
      this.abilityT -= dt;
      if (this.abilityT <= 0) {
        const a = this.pickAbility();
        if (a) { this.charge = { a, t: 0.75, max: 0.75 }; this.tele = a; sfx.charge(); }
        else this.abilityT = 0.8;
      }
    } else {
      this.charge.t -= dt;
      if (this.charge.t <= 0) {
        this.exec(this.charge.a);
        this.charge = null;
        this.abilityT = this.fury ? 4.2 : 6.4;
      }
    }
    this.updateExtra(dt);
  }

  freeBalls() { return this.g.balls.filter((b) => !b.held && !b.cap); }

  shootAtPlayer(n) {
    const p = this.g.paddle;
    for (let i = 0; i < n; i++) {
      const tx = p.x + (i - (n - 1) / 2) * 90;
      const dx = tx - this.cx, dy = p.y - this.cy, d = Math.hypot(dx, dy);
      this.g.enemyShot(this.cx, this.cy + 20, (dx / d) * 380, (dy / d) * 380);
    }
  }

  // Release a captured disc toward the side of the field away from the platform.
  throwBall(b) {
    const p = this.g.paddle;
    const tx = p.x < W / 2 ? W - 90 - Math.random() * 60 : 90 + Math.random() * 60;
    const dx = tx - b.x, dy = this.g.bottom - b.y, d = Math.hypot(dx, dy);
    b.vx = (dx / d) * b.s; b.vy = (dy / d) * b.s;
    b.cap = null;
    b.path = [{ x: b.x, y: b.y }];
    this.g.fixAngle(b);
    sfx.launch();
  }
}

// ---------- WORLD 1: SENTINELA (slide) ----------
class Sentinel extends Boss {
  constructor(g) {
    super(g, 'SENTINELA');
    this.cx = W / 2;
    this.y0 = g.top + 150;
    this.hw = 108;
    this.hh = 26;
    this.coreR = 34;
    this.open = 1;
    this.cycle = 0;
    this.ph = 0;
    this.waves = [];
    this.plates = [];
    this.beam = null;
  }

  get cy() { return this.y0 + 44; }
  // where the boss stage's common bricks live
  get bandY() { return this.g.top + 150 + 215; }
  get coreOpen() { return this.open > 0.6; }

  move(dt) {
    this.ph += dt * (this.fury ? 0.6 : 0.36);
    this.cx = W / 2 + 200 * Math.sin(this.ph);
    this.y0 = this.g.top + 150 + (this.fury ? 14 * Math.sin(this.t * 2.2) : 0);
    const openT = this.fury ? 3.4 : 4.6, closedT = this.fury ? 1.0 : 0.7;
    this.cycle = (this.cycle + dt) % (openT + closedT);
    const target = this.cycle < openT && !this.charge ? 1 : 0;
    this.open += (target - this.open) * Math.min(1, dt * 9);
    // indestructible shield plate only in fury mode
    const n = this.fury ? 1 : 0, k = 0.9;
    this.plates = [];
    for (let i = 0; i < n; i++) {
      const px = this.cx + 170 * Math.sin(this.t * k + (i * TAU) / n);
      this.plates.push({ x: px - 30, y: this.y0 + 104, w: 60, h: 12 });
    }
  }

  updateExtra(dt) {
    for (const wv of this.waves) {
      wv.r += 720 * dt;
      for (const b of this.freeBalls()) {
        if (wv.hit.has(b)) continue;
        if (Math.abs(Math.hypot(b.x - this.cx, b.y - this.cy) - wv.r) < 26) {
          wv.hit.add(b);
          const a = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5);
          const cs = Math.cos(a), sn = Math.sin(a);
          const vx = b.vx * cs - b.vy * sn, vy = b.vx * sn + b.vy * cs;
          b.vx = vx; b.vy = vy;
          this.g.fixAngle(b);
          this.g.mark(b);
          this.g.ring(b.x, b.y, 50);
          sfx.deflect();
        }
      }
    }
    this.waves = this.waves.filter((w) => w.r < 900);
    if (this.beam) { this.beam.t -= dt; if (this.beam.t <= 0) this.beam = null; }
  }

  pickAbility() {
    const opts = ['deflect'];
    if (this.freeBalls().some((b) => b.y < this.y0 + 560)) opts.push('capture', 'capture');
    if (this.fury) opts.push('shots', 'shots');
    if (!this.g.bricks.some((b) => b.row === 99) && (this.fury || this.t > 14)) opts.push('summon');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'deflect') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'capture') {
      const list = this.freeBalls().sort((p, q) => Math.hypot(p.x - this.cx, p.y - this.cy) - Math.hypot(q.x - this.cx, q.y - this.cy));
      const b = list[0];
      if (!b) return;
      b.cap = { t: 0.8 };
      this.beam = { b, t: 0.8 };
      sfx.capture();
    } else if (a === 'shots') this.shootAtPlayer(3);
    else if (a === 'summon') this.g.summonRow(this.y0 + 175);
  }

  holdBall(b, dt) {
    const tx = this.cx, ty = this.y0 + 135;
    b.x += (tx - b.x) * Math.min(1, dt * 9);
    b.y += (ty - b.y) * Math.min(1, dt * 9);
    b.cap.t -= dt;
    if (b.cap.t <= 0) this.throwBall(b);
  }

  collide(b) {
    if (this.dead) return false;
    const ghost = !!this.g.effects.pierce;
    const hit = !ghost && collideRect(b, this.cx - this.hw, this.y0 - this.hh, this.hw * 2, this.hh * 2);
    if (hit) { sfx.clang(); this.g.ring(b.x, b.y, 40); return true; }
    if (!ghost) for (const pl of this.plates) {
      if (collideRect(b, pl.x, pl.y, pl.w, pl.h)) { sfx.clang(); return true; }
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  // Lasers / missiles. Returns 'core', 'armor' or null.
  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return this.coreOpen ? 'core' : 'armor';
    if (x > this.cx - this.hw - rad && x < this.cx + this.hw + rad && y > this.y0 - this.hh - rad && y < this.y0 + this.hh + rad) return 'armor';
    for (const pl of this.plates) if (x > pl.x - rad && x < pl.x + pl.w + rad && y > pl.y - rad && y < pl.y + pl.h + rad) return 'armor';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t;
    const x = this.cx, y = this.y0, hw = this.hw, hh = this.hh;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    const jit = this.fury ? 1.5 : 0;
    const J = () => (Math.random() - 0.5) * jit;
    // deflect waves
    for (const wv of this.waves) {
      c.beginPath(); c.arc(this.cx, this.cy, wv.r, 0, TAU);
      c.strokeStyle = rgba(col, Math.max(0, 0.7 * (1 - wv.r / 900)));
      c.lineWidth = 3;
      c.stroke();
    }
    // capture beam
    if (this.beam && this.beam.b) {
      const b = this.beam.b;
      c.save();
      c.setLineDash([8, 6]);
      c.lineDashOffset = -t * 80;
      c.beginPath(); c.moveTo(this.cx, this.cy + this.coreR); c.lineTo(b.x, b.y);
      neonStroke(c, col, col, 3, this.cx, this.cy, b.x, b.y, 1);
      c.restore();
    }
    // side fins
    c.beginPath();
    c.moveTo(x - hw, y - 6); c.lineTo(x - hw - 34 + J(), y - 18); c.lineTo(x - hw - 34 + J(), y + 10);
    c.moveTo(x + hw, y - 6); c.lineTo(x + hw + 34 + J(), y - 18); c.lineTo(x + hw + 34 + J(), y + 10);
    neonStroke(c, col, col, 2, x - hw, y, x + hw, y, 0.6);
    // hull
    const hull = [[x - hw, y - 6], [x - hw + 24, y - hh], [x + hw - 24, y - hh], [x + hw, y - 6], [x + hw - 44, y + hh], [x - hw + 44, y + hh]];
    poly(c, hull);
    c.fillStyle = rgba(col, 0.1 + this.flash * 0.3);
    c.fill();
    neonStroke(c, col, col, 3.5, x - hw, y, x + hw, y, glow);
    const inner = [[x - hw + 26, y - 4], [x - hw + 38, y - hh + 10], [x + hw - 38, y - hh + 10], [x + hw - 26, y - 4], [x + hw - 56, y + hh - 9], [x - hw + 56, y + hh - 9]];
    poly(c, inner);
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
    // eyes
    const eye = this.fury ? 1 : 0.6 + 0.4 * Math.sin(t * 3);
    c.fillStyle = rgba('#ffffff', eye);
    c.fillRect(x - 62, y - 10, 34, 5);
    c.fillRect(x + 28, y - 10, 34, 5);
    // sliding shield plates
    for (const pl of this.plates) {
      c.beginPath(); c.rect(pl.x, pl.y, pl.w, pl.h);
      c.fillStyle = rgba(col, 0.15); c.fill();
      neonStroke(c, col, col, 2.4, pl.x, pl.y, pl.x + pl.w, pl.y, 0.7);
    }
    // core + iris shutter
    const cy = this.cy, R = this.coreR;
    c.beginPath(); c.arc(x, cy, R, 0, TAU);
    c.fillStyle = rgba(col, 0.25); c.fill();
    c.beginPath(); c.arc(x, cy, R * 0.45 * (0.6 + 0.4 * this.open), 0, TAU);
    c.fillStyle = '#ffffff';
    c.shadowColor = col; c.shadowBlur = 20 * view.blur * (0.5 + this.open);
    c.fill(); c.shadowBlur = 0;
    const shut = 1 - this.open;
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6 + t * 0.6;
      const r0 = R * (1 - shut * 0.95);
      c.moveTo(x + Math.cos(a) * R, cy + Math.sin(a) * R);
      c.lineTo(x + Math.cos(a + 0.9) * r0, cy + Math.sin(a + 0.9) * r0);
    }
    c.strokeStyle = rgba(col, 0.9); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(x, cy, R, 0, TAU);
    neonStroke(c, col, col, 3, x - R, cy, x + R, cy, this.coreOpen ? 1.4 : 0.6);
    if (this.coreOpen && !this.dead) {
      c.beginPath(); c.arc(x, cy, R + 8 + 3 * Math.sin(t * 8), 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.35); c.lineWidth = 1.5; c.stroke();
    }
  }
}

// ---------- WORLD 2: SINGULARIDADE (gravity) ----------
class Singularity extends Boss {
  constructor(g) {
    super(g, 'SINGULARIDADE');
    this.coreR = 32;
    this.R = 82;
    this.th = 10;
    this.rot = 0;
    this.sign = 1;
    this.invT = 0;
    this.mini = [];
    this.ph = 0;
    this.cx = W / 2;
    this.cy = g.top + 310;
  }

  get bandY() { return this.g.top + 50; }

  get gap() { return this.fury ? 1.5 : 1.95; }

  move(dt) {
    this.ph += dt * (this.fury ? 1.5 : 1);
    this.cx = W / 2 + 150 * Math.sin(this.ph * 0.35);
    this.cy = this.g.top + 310 + 50 * Math.sin(this.ph * 0.5);
    this.rot += dt * (this.fury ? 1.2 : 0.65);
    if (this.invT > 0) { this.invT -= dt; if (this.invT <= 0) this.sign = 1; }
  }

  updateExtra(dt) {
    for (const m of this.mini) {
      m.t -= dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < 90 || m.x > W - 90) m.vx *= -1;
      if (m.y < this.g.top + 120 || m.y > this.g.paddle.y - 180) m.vy *= -1;
    }
    this.mini = this.mini.filter((m) => m.t > 0);
  }

  wells() {
    if (this.dead) return [];
    const list = [{ x: this.cx, y: this.cy, s: this.sign * (this.fury ? 4.2e6 : 3.0e6) }];
    for (const m of this.mini) list.push({ x: m.x, y: m.y, s: 2.5e6 });
    return list;
  }

  pickAbility() {
    const opts = ['invert'];
    if (this.freeBalls().some((b) => Math.hypot(b.x - this.cx, b.y - this.cy) < 320)) opts.push('capture', 'capture');
    if (this.fury) { opts.push('shots'); if (!this.mini.length) opts.push('mini', 'mini'); }
    if (this.g.mechs.includes('slide') && !this.g.bricks.some((b) => b.row === 99) && this.t > 10) opts.push('summon');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'invert') { this.sign = -1; this.invT = 2.0; this.g.ring(this.cx, this.cy, 300); sfx.pulse(); }
    else if (a === 'capture') {
      const b = this.freeBalls().sort((p, q) => Math.hypot(p.x - this.cx, p.y - this.cy) - Math.hypot(q.x - this.cx, q.y - this.cy))[0];
      if (!b) return;
      b.cap = { t: 1.1, ang: Math.atan2(b.y - this.cy, b.x - this.cx) };
      sfx.capture();
    } else if (a === 'mini') {
      for (let i = 0; i < 2; i++) {
        this.mini.push({ x: 150 + Math.random() * (W - 300), y: this.g.paddle.y - 300 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 80, t: 8 });
      }
      sfx.charge();
    } else if (a === 'shots') this.shootAtPlayer(3);
    else if (a === 'summon') this.g.summonRow(Math.min(this.cy + 190, this.g.paddle.y - 260));
  }

  holdBall(b, dt) {
    b.cap.ang += dt * 5.5;
    const tx = this.cx + Math.cos(b.cap.ang) * 135, ty = this.cy + Math.sin(b.cap.ang) * 135;
    b.x += (tx - b.x) * Math.min(1, dt * 10);
    b.y += (ty - b.y) * Math.min(1, dt * 10);
    if ((b.cap.gk = (b.cap.gk || 0) + 1) % 3 === 0) this.g.mark(b);
    b.cap.t -= dt;
    if (b.cap.t <= 0) this.throwBall(b);
  }

  inGap(x, y) {
    let a = Math.atan2(y - this.cy, x - this.cx) - this.rot;
    a = ((a % TAU) + TAU) % TAU;
    return a < this.gap;
  }

  collide(b) {
    if (this.dead) return false;
    const dx = b.x - this.cx, dy = b.y - this.cy, d = Math.hypot(dx, dy);
    // ring blocks only from the outside, except through the gap
    if (!this.g.effects.pierce && d > this.R && d < this.R + this.th / 2 + b.r && !this.inGap(b.x, b.y)) {
      const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
      if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
      b.x = this.cx + nx * (this.R + this.th / 2 + b.r + 0.5); b.y = this.cy + ny * (this.R + this.th / 2 + b.r + 0.5);
      sfx.clang();
      return true;
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreCool <= 0) { this.coreCool = 0.4; this.damage(this.g.ballDamage()); }
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    const d = Math.hypot(x - this.cx, y - this.cy);
    if (d < this.coreR + rad) return 'core';
    if (Math.abs(d - this.R) < this.th / 2 + rad && !this.inGap(x, y)) return 'armor';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y = this.cy;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    // accretion rings (move inward, or outward when inverted)
    for (let i = 0; i < 5; i++) {
      let k = (t * 0.45 + i / 5) % 1;
      if (this.sign < 0) k = 1 - k;
      c.beginPath(); c.arc(x, y, this.R + 12 + 170 * (1 - k), 0, TAU);
      c.strokeStyle = rgba(col, 0.25 * k);
      c.lineWidth = 1.5;
      c.stroke();
    }
    // mini wells
    for (const m of this.mini) {
      c.save(); c.translate(m.x, m.y); c.rotate(t * 3);
      c.setLineDash([6, 6]);
      c.beginPath(); c.arc(0, 0, 18, 0, TAU);
      neonStroke(c, col, col, 2, -18, 0, 18, 0, 0.7);
      c.restore();
      c.beginPath(); c.arc(m.x, m.y, 5, 0, TAU); c.fillStyle = '#fff'; c.fill();
    }
    // outer dashed orbit
    c.save(); c.translate(x, y); c.rotate(-t * 0.5);
    c.setLineDash([14, 12]);
    c.beginPath(); c.arc(0, 0, 135, 0, TAU);
    c.strokeStyle = rgba(col, 0.35); c.lineWidth = 1.5; c.stroke();
    c.restore();
    // armored ring with the gap
    c.beginPath(); c.arc(x, y, this.R, this.rot + this.gap, this.rot + TAU);
    neonStroke(c, col, col, this.th, x - this.R, y, x + this.R, y, glow);
    c.beginPath(); c.arc(x, y, this.R - 12, this.rot + this.gap + 0.1, this.rot + TAU - 0.1);
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
    // gap edge markers
    c.fillStyle = '#ffffff';
    for (const a of [this.rot, this.rot + this.gap]) {
      c.beginPath(); c.arc(x + Math.cos(a) * this.R, y + Math.sin(a) * this.R, 4, 0, TAU); c.fill();
    }
    if (this.fury) {
      c.beginPath();
      for (let k = 0; k < 12; k++) {
        const a = this.rot * -1.3 + (k * TAU) / 12;
        c.moveTo(x + Math.cos(a) * (this.R + 14), y + Math.sin(a) * (this.R + 14));
        c.lineTo(x + Math.cos(a + 0.12) * (this.R + 26 + Math.random() * 4), y + Math.sin(a + 0.12) * (this.R + 26));
      }
      c.strokeStyle = rgba(col, 0.8); c.lineWidth = 2; c.stroke();
    }
    // core (weak point)
    c.beginPath(); c.arc(x, y, this.coreR, 0, TAU);
    c.fillStyle = rgba(col, 0.3 + this.flash * 0.5); c.fill();
    neonStroke(c, col, col, 3, x - this.coreR, y, x + this.coreR, y, 1.2);
    c.beginPath(); c.arc(x, y, 9 + 2 * Math.sin(t * 6), 0, TAU);
    c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 24 * view.blur; c.fill(); c.shadowBlur = 0;
    if (this.sign < 0) {
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * TAU) / 8, r0 = this.coreR + 4 + ((t * 60) % 30);
        c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
        c.lineTo(x + Math.cos(a) * (r0 + 10), y + Math.sin(a) * (r0 + 10));
      }
      c.strokeStyle = rgba('#ffffff', 0.8); c.lineWidth = 2; c.stroke();
    }
  }
}

// ---------- CHAPTER 3: O SUPERVISOR (pressure) ----------
// A stepped corporate pyramid with a floating capstone: the all-seeing eye on
// top is the weak point, so the disc has to get ABOVE the pyramid to hit it.
class Supervisor extends Boss {
  constructor(g) {
    super(g, 'O SUPERVISOR');
    this.nT = 3;
    this.hpMax = 5;
    this.hp = this.hpMax;
    this.coreR = 30;
    this.cx = W / 2;
    this.ph = 0;
    this.sink = 0;
    this.open = 1;
    this.cycle = 0;
    this.waves = [];
    this.mini = [];
    this.beam = null;
  }

  get baseY() { return this.g.top + 340 + this.sink; }
  get tiers() {
    const out = [];
    for (let k = 0; k < this.nT; k++) {
      const w = 250 - k * 66;
      out.push({ x: this.cx - w / 2, y: this.baseY - (k + 1) * 32, w, h: 30 });
    }
    return out;
  }
  get cy() { return this.baseY - this.nT * 32 - 40; }
  get bandY() { return this.g.top + 340 + 120; }
  get coreOpen() { return this.open > 0.6; }

  move(dt) {
    this.ph += dt * (this.fury ? 0.55 : 0.32);
    this.cx = W / 2 + 140 * Math.sin(this.ph);
    // fury: the whole pyramid presses down on the player, then resets
    if (this.fury) { this.sink = Math.min(70, this.sink + dt * 6); }
    const openT = this.fury ? 3.2 : 4.2, closedT = this.fury ? 1.2 : 0.9;
    this.cycle = (this.cycle + dt) % (openT + closedT);
    const target = this.cycle < openT && !this.charge ? 1 : 0;
    this.open += (target - this.open) * Math.min(1, dt * 8);
  }

  damage(n, force, minor) {
    const ok = super.damage(n, force, minor);
    if (ok && !minor) this.sink = Math.max(0, this.sink - 50);
    return ok;
  }

  updateExtra(dt) {
    for (const wv of this.waves) {
      wv.r += 680 * dt;
      for (const b of this.freeBalls()) {
        if (wv.hit.has(b)) continue;
        if (Math.abs(Math.hypot(b.x - this.cx, b.y - this.cy) - wv.r) < 26) {
          wv.hit.add(b);
          const a = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
          const cs = Math.cos(a), sn = Math.sin(a);
          const vx = b.vx * cs - b.vy * sn, vy = b.vx * sn + b.vy * cs;
          b.vx = vx; b.vy = vy;
          this.g.fixAngle(b); this.g.mark(b); this.g.ring(b.x, b.y, 50);
          sfx.deflect();
        }
      }
    }
    this.waves = this.waves.filter((w) => w.r < 900);
    if (this.beam) { this.beam.t -= dt; if (this.beam.t <= 0) this.beam = null; }
    for (const m of this.mini) {
      m.t -= dt;
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < 90 || m.x > W - 90) m.vx *= -1;
      if (m.y < this.baseY + 60 || m.y > this.g.paddle.y - 200) m.vy *= -1;
    }
    this.mini = this.mini.filter((m) => m.t > 0);
  }

  wells() {
    if (this.dead) return [];
    return this.mini.map((m) => ({ x: m.x, y: m.y, s: 2.6e6 }));
  }

  pickAbility() {
    const opts = ['lobby'];
    if (this.freeBalls().length) opts.push('acquire', 'acquire');
    if (!this.mini.length && this.g.mechs.includes('gravity')) opts.push('debt');
    if (!this.g.bricks.some((b) => b.row === 99) && this.t > 10) opts.push('summon');
    if (this.fury) opts.push('shots', 'shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    const g = this.g;
    if (a === 'lobby') { this.waves.push({ r: 40, hit: new Set() }); sfx.pulse(); }
    else if (a === 'acquire') {
      const b = this.freeBalls().sort((p, q) => Math.hypot(p.x - this.cx, p.y - this.cy) - Math.hypot(q.x - this.cx, q.y - this.cy))[0];
      if (!b) return;
      b.cap = { t: 0.9 };
      this.beam = { b, t: 0.9 };
      g.float('ADQUIRIDO', this.cx, this.baseY + 40, 22);
      sfx.capture();
    } else if (a === 'debt') {
      for (let i = 0; i < 2; i++) {
        this.mini.push({ x: 150 + Math.random() * (W - 300), y: this.baseY + 160 + Math.random() * 120,
          vx: (Math.random() - 0.5) * 110, vy: (Math.random() - 0.5) * 70, t: 7 });
      }
      sfx.charge();
    } else if (a === 'summon') g.summonRow(this.baseY + 24);
    else if (a === 'shots') this.shootAtPlayer(5);
  }

  holdBall(b, dt) {
    const tx = this.cx, ty = this.baseY + 46;
    b.x += (tx - b.x) * Math.min(1, dt * 9);
    b.y += (ty - b.y) * Math.min(1, dt * 9);
    b.cap.t -= dt;
    if (b.cap.t <= 0) this.throwBall(b);
  }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce) {
      for (const t of this.tiers) if (collideRect(b, t.x, t.y, t.w, t.h)) { sfx.clang(); return true; }
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.4; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return this.coreOpen ? 'core' : 'armor';
    for (const t of this.tiers) if (x > t.x - rad && x < t.x + t.w + rad && y > t.y - rad && y < t.y + t.h + rad) return 'armor';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    for (const wv of this.waves) {
      c.beginPath(); c.arc(this.cx, this.cy, wv.r, 0, TAU);
      c.strokeStyle = rgba(col, Math.max(0, 0.6 * (1 - wv.r / 900))); c.lineWidth = 3; c.stroke();
    }
    if (this.beam && this.beam.b) {
      const b = this.beam.b;
      c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -t * 80;
      c.beginPath(); c.moveTo(this.cx, this.baseY); c.lineTo(b.x, b.y);
      neonStroke(c, col, col, 3, this.cx, this.baseY, b.x, b.y, 1);
      c.restore();
    }
    // debt wells
    for (const m of this.mini) {
      c.save(); c.translate(m.x, m.y); c.rotate(-t * 2.5);
      c.setLineDash([4, 5]);
      c.beginPath(); c.arc(0, 0, 20, 0, TAU);
      neonStroke(c, col, col, 2, -20, 0, 20, 0, 0.7);
      c.restore();
      c.beginPath(); c.arc(m.x, m.y, 5, 0, TAU); c.fillStyle = '#fff'; c.fill();
    }
    // stepped pyramid: every tier is a floor full of windows
    const jit = this.fury ? 1.2 : 0;
    this.tiers.forEach((tr, k) => {
      const x = tr.x + (Math.random() - 0.5) * jit;
      roundRectPath2(c, x, tr.y, tr.w, tr.h, 3);
      c.fillStyle = rgba(col, 0.08 + this.flash * 0.25); c.fill();
      neonStroke(c, col, col, 2.6, x, tr.y, x + tr.w, tr.y, glow * (0.6 + k * 0.12));
      c.fillStyle = rgba(col, 0.55);
      const n = Math.floor((tr.w - 20) / 14);
      for (let i = 0; i < n; i++) {
        if (Math.sin(i * 12.9898 + k * 78.233 + Math.floor(t * 1.5)) > 0.2) c.fillRect(x + 12 + i * 14, tr.y + 11, 7, 8);
      }
    });
    // floating capstone with the eye
    const x = this.cx, cy = this.cy, R = this.coreR;
    const apex = cy - 48, bl = this.baseY - this.nT * 32 - 8;
    c.beginPath(); c.moveTo(x, apex); c.lineTo(x + 46, bl); c.lineTo(x - 46, bl); c.closePath();
    c.fillStyle = rgba(col, 0.12 + this.flash * 0.3); c.fill();
    neonStroke(c, col, col, 3, x - 46, apex, x + 46, bl, glow + (this.coreOpen ? 0.5 : 0));
    // rays
    c.beginPath();
    for (let q = 0; q < 9; q++) {
      const a = -Math.PI / 2 + (q - 4) * 0.28;
      const r0 = 58, r1 = 78 + 6 * Math.sin(t * 4 + q);
      c.moveTo(x + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(x + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    c.strokeStyle = rgba(col, this.coreOpen ? 0.7 : 0.25); c.lineWidth = 2; c.stroke();
    // eye (lid closes while charging / on cycle)
    const o = Math.max(0.08, this.open);
    c.beginPath();
    c.moveTo(x - 24, cy); c.quadraticCurveTo(x, cy - 20 * o, x + 24, cy); c.quadraticCurveTo(x, cy + 20 * o, x - 24, cy);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.stroke();
    if (this.open > 0.3) {
      const px = x + Math.max(-8, Math.min(8, (this.g.paddle.x - x) * 0.03));
      c.beginPath(); c.arc(px, cy, 7 * o, 0, TAU);
      c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 20 * view.blur; c.fill(); c.shadowBlur = 0;
    }
    if (this.coreOpen && !this.dead) {
      c.beginPath(); c.arc(x, cy, R + 6 + 3 * Math.sin(t * 8), 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.3); c.lineWidth = 1.5; c.stroke();
    }
  }
}

// Disc vs thick segment (bounce off its normal). Returns true on contact.
function collideSeg(b, x0, y0, x1, y1, th) {
  const sx = x1 - x0, sy = y1 - y0, L2 = sx * sx + sy * sy || 1;
  const k = clamp(((b.x - x0) * sx + (b.y - y0) * sy) / L2, 0, 1);
  const qx = x0 + sx * k, qy = y0 + sy * k;
  const dx = b.x - qx, dy = b.y - qy, d = Math.hypot(dx, dy);
  if (d >= b.r + th || d === 0) return false;
  const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
  if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
  b.x = qx + nx * (b.r + th + 0.5); b.y = qy + ny * (b.r + th + 0.5);
  return true;
}

// ---------- WORLD 4: O RELÓGIO DE PONTO (phase) ----------
// A clock whose two hands sweep around the weak point in the center. The rim is
// dashed: the disc goes through it, only the hands and the 4 hour knobs block.
class Clock extends Boss {
  constructor(g) {
    super(g, 'O RELÓGIO DE PONTO');
    this.R = 96;
    this.coreR = 24;
    this.cx = W / 2;
    this.ph = 0;
    this.aH = -Math.PI / 2;
    this.aM = 0.4;
    this.waves = [];
    this.beam = null;
  }

  get cy() { return this.g.top + 230; }
  get bandY() { return this.g.top + 230 + this.R + 60; }
  get coreOpen() { return !this.charge; }

  hands() {
    const x = this.cx, y = this.cy, r0 = this.coreR + 4;
    return [{ a: this.aH, L: this.R - 30, w: 7 }, { a: this.aM, L: this.R - 4, w: 5 }].map((h) => ({
      ...h,
      x0: x + Math.cos(h.a) * r0, y0: y + Math.sin(h.a) * r0,
      x1: x + Math.cos(h.a) * h.L, y1: y + Math.sin(h.a) * h.L,
    }));
  }

  knobs() {
    return [0, 1, 2, 3].map((q) => {
      const a = -Math.PI / 2 + (q * Math.PI) / 2;
      return { x: this.cx + Math.cos(a) * this.R, y: this.cy + Math.sin(a) * this.R, r: 13 };
    });
  }

  move(dt) {
    this.ph += dt * (this.fury ? 0.5 : 0.3);
    this.cx = W / 2 + 150 * Math.sin(this.ph);
    this.aM += dt * (this.fury ? 1.6 : 0.95);
    this.aH -= dt * (this.fury ? 0.75 : 0.4);
  }

  updateExtra(dt) {
    for (const wv of this.waves) {
      wv.r += 700 * dt;
      for (const b of this.freeBalls()) {
        if (wv.hit.has(b)) continue;
        if (Math.abs(Math.hypot(b.x - this.cx, b.y - this.cy) - wv.r) < 26) {
          wv.hit.add(b);
          const a = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
          const cs = Math.cos(a), sn = Math.sin(a);
          const vx = b.vx * cs - b.vy * sn, vy = b.vx * sn + b.vy * cs;
          b.vx = vx; b.vy = vy;
          this.g.fixAngle(b); this.g.mark(b); this.g.ring(b.x, b.y, 50);
          sfx.deflect();
        }
      }
    }
    this.waves = this.waves.filter((w) => w.r < 900);
    if (this.beam) { this.beam.t -= dt; if (this.beam.t <= 0) this.beam = null; }
  }

  pickAbility() {
    const opts = ['tick', 'alarm'];
    if (this.freeBalls().some((b) => b.y < this.cy + 420)) opts.push('clockin', 'clockin');
    if (!this.g.bricks.some((b) => b.row === 99) && (this.fury || this.t > 14)) opts.push('summon');
    if (this.fury) opts.push('alarm');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    const g = this.g;
    if (a === 'tick') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'alarm') { g.float('ALARME', this.cx, this.cy + this.R + 30, 24); this.shootAtPlayer(this.fury ? 5 : 3); }
    else if (a === 'clockin') {
      const b = this.freeBalls().sort((p, q) => Math.hypot(p.x - this.cx, p.y - this.cy) - Math.hypot(q.x - this.cx, q.y - this.cy))[0];
      if (!b) return;
      b.cap = { t: 0.85 };
      this.beam = { b, t: 0.85 };
      g.float('BATEU O PONTO', this.cx, this.cy + this.R + 30, 22);
      sfx.capture();
    } else if (a === 'summon') g.summonRow(this.cy + this.R + 20);
  }

  holdBall(b, dt) {
    const tx = this.cx, ty = this.cy + this.R + 26;
    b.x += (tx - b.x) * Math.min(1, dt * 9);
    b.y += (ty - b.y) * Math.min(1, dt * 9);
    b.cap.t -= dt;
    if (b.cap.t <= 0) this.throwBall(b);
  }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce) {
      for (const h of this.hands()) if (collideSeg(b, h.x0, h.y0, h.x1, h.y1, h.w)) { sfx.clang(); this.g.ring(b.x, b.y, 36); return true; }
      for (const k of this.knobs()) if (collideCircle(b, k.x, k.y, k.r)) { sfx.clang(); return true; }
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.4; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return this.coreOpen ? 'core' : 'armor';
    for (const k of this.knobs()) if (Math.hypot(x - k.x, y - k.y) < k.r + rad) return 'armor';
    for (const h of this.hands()) {
      const sx = h.x1 - h.x0, sy = h.y1 - h.y0, L2 = sx * sx + sy * sy;
      const u = clamp(((x - h.x0) * sx + (y - h.y0) * sy) / L2, 0, 1);
      if (Math.hypot(x - h.x0 - sx * u, y - h.y0 - sy * u) < h.w + rad) return 'armor';
    }
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y = this.cy, R = this.R;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    const jit = this.fury ? 1.4 : 0, J = () => (Math.random() - 0.5) * jit;
    for (const wv of this.waves) {
      c.beginPath(); c.arc(x, y, wv.r, 0, TAU);
      c.strokeStyle = rgba(col, Math.max(0, 0.6 * (1 - wv.r / 900))); c.lineWidth = 3; c.stroke();
    }
    if (this.beam && this.beam.b) {
      const b = this.beam.b;
      c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -t * 80;
      c.beginPath(); c.moveTo(x, y + R); c.lineTo(b.x, b.y);
      neonStroke(c, col, col, 3, x, y, b.x, b.y, 1);
      c.restore();
    }
    // alarm bells (they shake while an ability charges)
    const shake = this.charge ? Math.sin(t * 60) * 0.25 : 0;
    for (const s of [-1, 1]) {
      const a = -Math.PI / 2 + s * 0.75, bx = x + Math.cos(a) * (R + 22), by = y + Math.sin(a) * (R + 22);
      c.save(); c.translate(bx, by); c.rotate(a + Math.PI / 2 + shake);
      c.beginPath(); c.arc(0, 0, 20, Math.PI, TAU); c.closePath();
      c.fillStyle = rgba(col, 0.12); c.fill();
      neonStroke(c, col, col, 2.4, -20, 0, 20, 0, glow * 0.7);
      c.restore();
    }
    // face: the rim is dashed because the disc passes through it
    c.beginPath(); c.arc(x + J(), y, R, 0, TAU);
    c.fillStyle = rgba(col, 0.06 + this.flash * 0.2); c.fill();
    c.save(); c.setLineDash([10, 8]); c.lineDashOffset = t * 12;
    c.beginPath(); c.arc(x + J(), y, R, 0, TAU);
    neonStroke(c, col, col, 2, x - R, y, x + R, y, glow * 0.6);
    c.restore();
    c.beginPath();
    for (let q = 0; q < 12; q++) {
      if (q % 3 === 0) continue;
      const a = (q * TAU) / 12;
      c.moveTo(x + Math.cos(a) * (R - 12), y + Math.sin(a) * (R - 12)); c.lineTo(x + Math.cos(a) * (R - 4), y + Math.sin(a) * (R - 4));
    }
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 2; c.stroke();
    for (const k of this.knobs()) {
      c.beginPath(); c.arc(k.x + J(), k.y, k.r, 0, TAU);
      c.fillStyle = rgba(col, 0.2); c.fill();
      neonStroke(c, col, col, 2.6, k.x - k.r, k.y, k.x + k.r, k.y, glow);
    }
    // digital time racing by
    const mins = Math.floor(((this.aM / TAU) * 60) % 60 + 60) % 60, hrs = Math.floor(3 + this.t / 20) % 24;
    glowText(c, String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0'), x, y + R * 0.5, 13, rgba('#ffffff', 0.8), col, 'center', 700, 2);
    // hands
    for (const h of this.hands()) {
      c.beginPath(); c.moveTo(h.x0, h.y0); c.lineTo(h.x1, h.y1);
      neonStroke(c, col, col, h.w * 1.3, h.x0, h.y0, h.x1, h.y1, glow);
      c.beginPath(); c.arc(h.x1, h.y1, 3, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    }
    // core
    c.beginPath(); c.arc(x, y, this.coreR, 0, TAU);
    c.fillStyle = rgba(col, 0.25); c.fill();
    neonStroke(c, col, col, 3, x - this.coreR, y, x + this.coreR, y, this.coreOpen ? 1.4 : 0.5);
    c.beginPath(); c.arc(x, y, this.coreOpen ? 9 + Math.sin(t * 6) * 1.5 : 4, 0, TAU);
    c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 18 * view.blur; c.fill(); c.shadowBlur = 0;
  }
}

// ---------- WORLD 5: A PATENTE (portals) ----------
// A padlock. The weak point is the keyhole under the body, open only part of
// the time. It turns bricks into "property" (indestructible for a while) and
// opens red portals that throw the disc back the way it came.
class Patent extends Boss {
  constructor(g) {
    super(g, 'A PATENTE');
    this.cx = W / 2;
    this.ph = 0;
    this.bw = 200;
    this.bh = 116;
    this.coreR = 26;
    this.open = 1;
    this.cycle = 0;
    this.portals = [];
    this.beam = null;
    this.lift = 0;
  }

  get y0() { return this.g.top + 190; }
  get cy() { return this.y0 + this.bh + 10; }
  get bandY() { return this.y0 + this.bh + 100; }
  get coreOpen() { return this.open > 0.6; }

  shackle() {
    const pts = [], R = 62, cy = this.y0 - this.lift;
    for (let q = 0; q <= 8; q++) {
      const a = Math.PI + (q * Math.PI) / 8;
      pts.push({ x: this.cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
    }
    return pts;
  }

  move(dt) {
    this.ph += dt * (this.fury ? 0.55 : 0.33);
    this.cx = W / 2 + 170 * Math.sin(this.ph);
    const openT = this.fury ? 3.2 : 4.2, closedT = this.fury ? 1.2 : 0.9;
    this.cycle = (this.cycle + dt) % (openT + closedT);
    const target = this.cycle < openT && !this.charge ? 1 : 0;
    this.open += (target - this.open) * Math.min(1, dt * 8);
    this.lift += ((this.coreOpen ? 14 : 0) - this.lift) * Math.min(1, dt * 6);
  }

  updateExtra(dt) {
    for (const P of this.portals) P.t -= dt;
    this.portals = this.portals.filter((P) => P.t > 0);
    for (const br of this.g.bricks) {
      if (br.reg === undefined) continue;
      br.reg -= dt;
      if (br.reg <= 0) { br.kind = 'n'; delete br.reg; br.flash = 1; }
    }
    if (this.beam) { this.beam.t -= dt; if (this.beam.t <= 0) this.beam = null; }
  }

  pickAbility() {
    const opts = ['register'];
    if (this.portals.length < (this.fury ? 2 : 1)) opts.push('portal', 'portal');
    if (this.freeBalls().some((b) => b.y < this.cy + 420)) opts.push('lawsuit');
    if (!this.g.bricks.some((b) => b.row === 99) && (this.fury || this.t > 14)) opts.push('summon');
    if (this.fury) opts.push('shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    const g = this.g;
    if (a === 'register') {
      const list = g.bricks.filter((b) => !b.dead && b.kind === 'n' && b.row !== 99).sort(() => Math.random() - 0.5).slice(0, this.fury ? 5 : 3);
      for (const br of list) { br.kind = 'wall'; br.reg = 6; br.flash = 1; }
      g.float('© REGISTRADO', this.cx, this.cy + 60, 22);
      sfx.clang();
    } else if (a === 'portal') {
      const ax = 140 + Math.random() * (W - 280);
      this.portals.push({ a: { x: ax, y: this.bandY + 170 }, b: { x: W - ax, y: g.paddle.y - 240 }, flip: true, t: 6 });
      g.float('PORTAL PRIVADO', W / 2, this.bandY + 120, 20);
      sfx.portal();
    } else if (a === 'lawsuit') {
      const b = this.freeBalls().sort((p, q) => Math.hypot(p.x - this.cx, p.y - this.cy) - Math.hypot(q.x - this.cx, q.y - this.cy))[0];
      if (!b) return;
      b.cap = { t: 0.85 };
      this.beam = { b, t: 0.85 };
      g.float('PROCESSADO', this.cx, this.cy + 60, 22);
      sfx.capture();
    } else if (a === 'summon') g.summonRow(this.cy + 70);
    else if (a === 'shots') this.shootAtPlayer(4);
  }

  holdBall(b, dt) {
    const tx = this.cx, ty = this.cy + 44;
    b.x += (tx - b.x) * Math.min(1, dt * 9);
    b.y += (ty - b.y) * Math.min(1, dt * 9);
    b.cap.t -= dt;
    if (b.cap.t <= 0) this.throwBall(b);
  }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce) {
      if (collideRect(b, this.cx - this.bw / 2, this.y0, this.bw, this.bh)) { sfx.clang(); this.g.ring(b.x, b.y, 40); return true; }
      for (const q of this.shackle()) if (collideCircle(b, q.x, q.y, 9)) { sfx.clang(); return true; }
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.4; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return this.coreOpen ? 'core' : 'armor';
    if (x > this.cx - this.bw / 2 - rad && x < this.cx + this.bw / 2 + rad && y > this.y0 - 70 && y < this.y0 + this.bh + rad) return 'armor';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y0 = this.y0, bw = this.bw, bh = this.bh;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    const jit = this.fury ? 1.4 : 0, J = () => (Math.random() - 0.5) * jit;
    if (this.beam && this.beam.b) {
      const b = this.beam.b;
      c.save(); c.setLineDash([8, 6]); c.lineDashOffset = -t * 80;
      c.beginPath(); c.moveTo(x, this.cy); c.lineTo(b.x, b.y);
      neonStroke(c, col, col, 3, x, this.cy, b.x, b.y, 1);
      c.restore();
    }
    // shackle (lifts a little while the keyhole is open)
    const sh = this.shackle();
    c.beginPath();
    c.moveTo(sh[0].x, y0 + 4);
    for (const q of sh) c.lineTo(q.x + J(), q.y);
    c.lineTo(sh[sh.length - 1].x, y0 + 4 - (this.lift > 4 ? this.lift : 0));
    neonStroke(c, col, col, 9, x - 62, y0, x + 62, y0, glow * 0.8);
    // body
    roundRectPath2(c, x - bw / 2 + J(), y0, bw, bh, 14);
    c.fillStyle = rgba(col, 0.1 + this.flash * 0.3); c.fill();
    neonStroke(c, col, col, 3.4, x - bw / 2, y0, x + bw / 2, y0 + bh, glow);
    roundRectPath2(c, x - bw / 2 + 12, y0 + 12, bw - 24, bh - 24, 8);
    c.strokeStyle = rgba(col, 0.45); c.lineWidth = 1.4; c.stroke();
    glowText(c, '©', x, y0 + bh * 0.42, 46, '#ffffff', col, 'center', 700, 0);
    c.font = '600 8px "Orbitron", sans-serif';
    glowText(c, 'TODOS OS DIREITOS RESERVADOS', x, y0 + bh - 20, 8, rgba('#ffffff', 0.6), col, 'center', 600, 1);
    // keyhole (weak point)
    const cy = this.cy, R = this.coreR, o = this.open;
    c.beginPath(); c.arc(x, cy, R, 0, TAU);
    c.fillStyle = rgba(col, 0.25); c.fill();
    neonStroke(c, col, col, 3, x - R, cy, x + R, cy, this.coreOpen ? 1.4 : 0.5);
    c.beginPath(); c.arc(x, cy - 5, 7, 0, TAU); c.moveTo(x - 4, cy); c.lineTo(x - 7, cy + 14); c.lineTo(x + 7, cy + 14); c.lineTo(x + 4, cy);
    c.fillStyle = rgba('#ffffff', 0.25 + 0.75 * o);
    c.shadowColor = col; c.shadowBlur = 18 * view.blur * o; c.fill(); c.shadowBlur = 0;
    if (this.coreOpen && !this.dead) {
      c.beginPath(); c.arc(x, cy, R + 7 + 3 * Math.sin(t * 8), 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.3); c.lineWidth = 1.5; c.stroke();
    }
  }
}

function roundRectPath2(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// Deflect waves shared by the bosses of districts 6 to 9: an expanding ring
// that bends the course of every disc it crosses.
function updateWaves(boss, dt) {
  for (const wv of boss.waves) {
    wv.r += 720 * dt;
    for (const b of boss.freeBalls()) {
      if (wv.hit.has(b)) continue;
      if (Math.abs(Math.hypot(b.x - boss.cx, b.y - boss.cy) - wv.r) < 26) {
        wv.hit.add(b);
        const a = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5);
        const cs = Math.cos(a), sn = Math.sin(a);
        const vx = b.vx * cs - b.vy * sn, vy = b.vx * sn + b.vy * cs;
        b.vx = vx; b.vy = vy;
        boss.g.fixAngle(b);
        boss.g.mark(b);
        boss.g.ring(b.x, b.y, 50);
        sfx.deflect();
      }
    }
  }
  boss.waves = boss.waves.filter((w) => w.r < 900);
}
function renderWaves(c, boss, col) {
  for (const wv of boss.waves) {
    c.beginPath(); c.arc(boss.cx, boss.cy, wv.r, 0, TAU);
    c.strokeStyle = rgba(col, Math.max(0, 0.7 * (1 - wv.r / 900)));
    c.lineWidth = 3;
    c.stroke();
  }
}

// ---------- DISTRICT 6: O ALGORITMO (contágio) ----------
// A core with satellites orbiting it: the disc has to slip between them.
class Algorithm extends Boss {
  constructor(g) {
    super(g, 'O ALGORITMO');
    this.coreR = 34;
    this.orbit = 98;
    this.satR = 17;
    this.rot = 0;
    this.ph = 0;
    this.cx = W / 2;
    this.cy = g.top + 320;
    this.waves = [];
  }

  get bandY() { return this.g.top + 50; }

  sats() {
    const n = this.fury ? 5 : 3, list = [];
    for (let i = 0; i < n; i++) {
      const a = this.rot + (i * TAU) / n;
      list.push({ x: this.cx + Math.cos(a) * this.orbit, y: this.cy + Math.sin(a) * this.orbit });
    }
    return list;
  }

  move(dt) {
    this.ph += dt;
    this.cx = W / 2 + 170 * Math.sin(this.ph * 0.45);
    this.cy = this.g.top + 320 + 44 * Math.sin(this.ph * 0.8);
    this.rot += dt * (this.fury ? 1.9 : 1.2);
  }

  updateExtra(dt) { updateWaves(this, dt); }

  pickAbility() {
    const opts = ['pulse', 'spam'];
    if (this.g.bricks.some((b) => b.row >= 100 && !b.dead && !b.inf)) opts.push('viral', 'viral');
    if (this.fury) opts.push('shots', 'shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'pulse') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'spam') { this.g.fillBand(4); this.g.ring(W / 2, this.bandY + 30, 300); }
    else if (a === 'viral') this.g.infectBand();
    else if (a === 'shots') this.shootAtPlayer(3);
  }

  holdBall(b) { this.throwBall(b); }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce) for (const s of this.sats()) {
      if (collideCircle(b, s.x, s.y, this.satR)) { sfx.clang(); this.g.ring(b.x, b.y, 40); return true; }
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    for (const s of this.sats()) if (Math.hypot(x - s.x, y - s.y) < this.satR + rad) return 'armor';
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return 'core';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y = this.cy, R = this.coreR;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    const jit = this.fury ? 2 : 0;
    renderWaves(c, this, col);
    // orbit and links
    c.save();
    c.setLineDash([4, 9]); c.lineDashOffset = -t * 30;
    c.beginPath(); c.arc(x, y, this.orbit, 0, TAU);
    c.strokeStyle = rgba(col, 0.35); c.lineWidth = 1.5; c.stroke();
    c.restore();
    const sats = this.sats();
    c.beginPath();
    for (const s of sats) { c.moveTo(x, y); c.lineTo(s.x, s.y); }
    c.strokeStyle = rgba(col, 0.3); c.lineWidth = 1.5; c.stroke();
    // satellites: small shields
    for (const s of sats) {
      const sx = s.x + (Math.random() - 0.5) * jit, sy = s.y + (Math.random() - 0.5) * jit;
      c.beginPath(); c.arc(sx, sy, this.satR, 0, TAU);
      c.fillStyle = rgba(col, 0.18); c.fill();
      neonStroke(c, col, col, 2.6, sx - this.satR, sy, sx + this.satR, sy, 0.8);
      c.beginPath(); c.arc(sx, sy, 4, 0, TAU); c.fillStyle = rgba('#ffffff', 0.8); c.fill();
    }
    // core: a hexagon turning the other way
    const hex = [];
    for (let k = 0; k < 6; k++) { const a = (k * TAU) / 6 - t * 0.7; hex.push([x + Math.cos(a) * R, y + Math.sin(a) * R]); }
    poly(c, hex);
    c.fillStyle = rgba(col, 0.2 + this.flash * 0.3); c.fill();
    neonStroke(c, col, col, 3.5, x - R, y, x + R, y, glow);
    c.beginPath(); c.arc(x, y, R * 0.42 + 2 * Math.sin(t * 6), 0, TAU);
    c.fillStyle = '#ffffff';
    c.shadowColor = col; c.shadowBlur = 22 * view.blur;
    c.fill(); c.shadowBlur = 0;
    if (!this.dead) {
      c.beginPath(); c.arc(x, y, R + 8 + 3 * Math.sin(t * 8), 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.3); c.lineWidth = 1.5; c.stroke();
    }
  }
}

// ---------- DISTRICT 7: O CENSOR (tarja) ----------
// A black bar with a lens in the middle; two plates slide apart to show it.
class Censor extends Boss {
  constructor(g) {
    super(g, 'O CENSOR');
    this.cx = W / 2;
    this.y0 = g.top + 160;
    this.hw = 150;
    this.hh = 24;
    this.coreR = 26;
    this.open = 0;
    this.cycle = 0;
    this.ph = 0;
    this.waves = [];
  }

  get cy() { return this.y0; }
  get bandY() { return this.g.top + 150 + 215; }
  get coreOpen() { return this.open > 0.6; }

  // the two halves of the bar: closed they meet in the middle, covering the lens
  plates() {
    const gap = (this.coreR + 14) * this.open, w = this.hw - gap;
    return [{ x: this.cx - this.hw, y: this.y0 - this.hh, w, h: this.hh * 2 }, { x: this.cx + gap, y: this.y0 - this.hh, w, h: this.hh * 2 }];
  }

  move(dt) {
    this.ph += dt * (this.fury ? 0.75 : 0.45);
    this.cx = W / 2 + 180 * Math.sin(this.ph);
    const openT = this.fury ? 2.6 : 3.6, closedT = this.fury ? 1.6 : 1.3;
    this.cycle = (this.cycle + dt) % (openT + closedT);
    const target = this.cycle < openT && !this.charge ? 1 : 0;
    this.open += (target - this.open) * Math.min(1, dt * 8);
  }

  updateExtra(dt) { updateWaves(this, dt); }

  pickAbility() {
    const opts = ['pulse', 'tarja'];
    if (!this.g.effects.dark) opts.push('blackout');
    if (this.fury) opts.push('shots', 'shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'pulse') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'tarja') { this.g.addBar(this.fury ? 9 : 7); sfx.capture(); }
    else if (a === 'blackout') {
      this.g.effects.dark = { type: 'dark', t: 4.5, max: 4.5, good: false };
      this.g.float('APAGÃO', W / 2, this.y0 + 120, 26);
      sfx.power(false);
    } else if (a === 'shots') this.shootAtPlayer(3);
  }

  holdBall(b) { this.throwBall(b); }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce) for (const pl of this.plates()) {
      if (pl.w > 0 && collideRect(b, pl.x, pl.y, pl.w, pl.h)) { sfx.clang(); this.g.ring(b.x, b.y, 40); return true; }
    }
    if (collideCircle(b, this.cx, this.y0, this.coreR)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    for (const pl of this.plates()) if (x > pl.x - rad && x < pl.x + pl.w + rad && y > pl.y - rad && y < pl.y + pl.h + rad) return 'armor';
    if (Math.hypot(x - this.cx, y - this.y0) < this.coreR + rad) return this.coreOpen ? 'core' : 'armor';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y = this.y0, R = this.coreR;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    const jit = this.fury ? 1.5 : 0;
    renderWaves(c, this, col);
    // antennas
    c.beginPath();
    for (const s of [-1, 1]) { c.moveTo(x + s * 96, y - this.hh); c.lineTo(x + s * 118, y - this.hh - 30); }
    neonStroke(c, col, col, 2, x - 118, y, x + 118, y, 0.6);
    // lens
    c.beginPath(); c.arc(x, y, R, 0, TAU);
    c.fillStyle = rgba(col, 0.25); c.fill();
    neonStroke(c, col, col, 3, x - R, y, x + R, y, this.coreOpen ? 1.4 : 0.5);
    c.beginPath(); c.arc(x, y, R * 0.42 * (0.5 + 0.5 * this.open), 0, TAU);
    c.fillStyle = '#ffffff';
    c.shadowColor = col; c.shadowBlur = 20 * view.blur * (0.4 + this.open);
    c.fill(); c.shadowBlur = 0;
    // the two plates: black, with "redacted" lines
    for (const pl of this.plates()) {
      if (pl.w <= 0) continue;
      const px = pl.x + (Math.random() - 0.5) * jit;
      c.beginPath(); c.rect(px, pl.y, pl.w, pl.h);
      c.fillStyle = '#000000'; c.fill();
      c.fillStyle = rgba(col, 0.12 + this.flash * 0.3); c.fill();
      neonStroke(c, col, col, 3, px, pl.y, px + pl.w, pl.y, glow);
      c.fillStyle = rgba('#ffffff', this.fury ? 0.85 : 0.55);
      c.fillRect(px + 12, pl.y + 13, Math.max(0, pl.w - 24), 5);
      c.fillRect(px + 12, pl.y + 28, Math.max(0, (pl.w - 24) * 0.6), 5);
    }
    if (this.coreOpen && !this.dead) {
      c.beginPath(); c.arc(x, y, R + 8 + 3 * Math.sin(t * 8), 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.35); c.lineWidth = 1.5; c.stroke();
    }
  }
}

// ---------- DISTRICT 8: O BLINDADO (blindagem) ----------
// A core behind a curved shield that turns to face the nearest disc:
// the opening is always on the far side, so the hit has to come around.
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
class Armored extends Boss {
  constructor(g) {
    super(g, 'O BLINDADO');
    this.coreR = 30;
    this.shR = 66;      // shield radius
    this.shW = 16;      // shield thickness
    this.face = Math.PI / 2;
    this.ph = 0;
    this.cx = W / 2;
    this.cy = g.top + 300;
    this.waves = [];
  }

  get bandY() { return this.g.top + 50; }
  get half() { return this.fury ? 1.45 : 1.2; }   // half the angle the shield covers

  move(dt) {
    this.ph += dt;
    this.cx = W / 2 + 160 * Math.sin(this.ph * 0.4);
    this.cy = this.g.top + 300 + 30 * Math.sin(this.ph * 0.7);
    let target = Math.PI / 2, bd = Infinity;
    for (const b of this.freeBalls()) {
      const d = Math.hypot(b.x - this.cx, b.y - this.cy);
      if (d < bd) { bd = d; target = Math.atan2(b.y - this.cy, b.x - this.cx); }
    }
    const turn = (this.fury ? 2.3 : 1.5) * dt;
    this.face += clamp(angDiff(target, this.face), -turn, turn);
  }

  updateExtra(dt) { updateWaves(this, dt); }

  inShield(x, y, rad) {
    const d = Math.hypot(x - this.cx, y - this.cy);
    if (Math.abs(d - this.shR) > this.shW / 2 + rad) return false;
    return Math.abs(angDiff(Math.atan2(y - this.cy, x - this.cx), this.face)) < this.half;
  }

  pickAbility() {
    const opts = ['pulse', 'armor'];
    if (this.fury) opts.push('shots', 'shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'pulse') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'armor') { this.g.armorBand(this.fury ? 4 : 3); sfx.capture(); }
    else if (a === 'shots') this.shootAtPlayer(3);
  }

  holdBall(b) { this.throwBall(b); }

  collide(b) {
    if (this.dead) return false;
    if (!this.g.effects.pierce && this.inShield(b.x, b.y, b.r)) {
      const dx = b.x - this.cx, dy = b.y - this.cy, d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
      if (d >= this.shR) {   // outside: bounce outward
        if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
        const R = this.shR + this.shW / 2 + b.r + 0.5;
        b.x = this.cx + nx * R; b.y = this.cy + ny * R;
      } else {               // inside: bounce back toward the core
        if (dot > 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
        const R = this.shR - this.shW / 2 - b.r - 0.5;
        b.x = this.cx + nx * R; b.y = this.cy + ny * R;
      }
      sfx.clang(); this.g.ring(b.x, b.y, 40);
      return true;
    }
    if (collideCircle(b, this.cx, this.cy, this.coreR)) {
      if (this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else sfx.clang();
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (this.inShield(x, y, rad)) return 'armor';
    if (Math.hypot(x - this.cx, y - this.cy) < this.coreR + rad) return 'core';
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, x = this.cx, y = this.cy, R = this.coreR;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    renderWaves(c, this, col);
    // faint track of the shield
    c.save();
    c.setLineDash([3, 10]); c.lineDashOffset = t * 20;
    c.beginPath(); c.arc(x, y, this.shR, 0, TAU);
    c.strokeStyle = rgba(col, 0.25); c.lineWidth = 1.5; c.stroke();
    c.restore();
    // core
    c.beginPath(); c.arc(x, y, R, 0, TAU);
    c.fillStyle = rgba(col, 0.2 + this.flash * 0.3); c.fill();
    neonStroke(c, col, col, 3.5, x - R, y, x + R, y, glow);
    c.beginPath(); c.arc(x, y, R * 0.42 + 2 * Math.sin(t * 6), 0, TAU);
    c.fillStyle = '#ffffff';
    c.shadowColor = col; c.shadowBlur = 22 * view.blur;
    c.fill(); c.shadowBlur = 0;
    // shield: a thick arc with rivets
    const a0 = this.face - this.half, a1 = this.face + this.half;
    c.beginPath(); c.arc(x, y, this.shR + this.shW / 2, a0, a1); c.arc(x, y, this.shR - this.shW / 2, a1, a0, true); c.closePath();
    c.fillStyle = rgba(col, 0.22 + this.flash * 0.2); c.fill();
    neonStroke(c, col, col, 3, x - this.shR, y, x + this.shR, y, glow);
    c.fillStyle = rgba('#ffffff', this.fury ? 0.95 : 0.7);
    for (let k = 0; k <= 6; k++) {
      const a = a0 + ((a1 - a0) * k) / 6;
      c.beginPath(); c.arc(x + Math.cos(a) * this.shR, y + Math.sin(a) * this.shR, 2.4, 0, TAU); c.fill();
    }
  }
}

// ---------- DISTRICT 9: O CONSELHO (segurança) ----------
// Three seats at a long table; only the one with the crown takes damage,
// and the crown changes hands now and then.
class Council extends Boss {
  constructor(g) {
    super(g, 'O CONSELHO');
    this.seatR = 30;
    this.real = 1;
    this.swapT = 3.2;
    this.swapBlink = 0;
    this.ph = 0;
    this.mx = W / 2;
    this.my = g.top + 230;
    this.cx = this.mx; this.cy = this.my;
    this.waves = [];
  }

  get bandY() { return this.g.top + 50; }

  seats() {
    const list = [];
    for (let i = 0; i < 3; i++) list.push({ x: this.mx + (i - 1) * 190, y: this.my + 22 * Math.sin(this.ph * 0.9 + i * 2.1) });
    return list;
  }

  move(dt) {
    this.ph += dt;
    this.mx = W / 2 + 90 * Math.sin(this.ph * 0.5);
    this.swapBlink = Math.max(0, this.swapBlink - dt);
    this.swapT -= dt;
    if (this.swapT <= 0) this.swap();
    const s = this.seats()[this.real];
    this.cx = s.x; this.cy = s.y;   // the crown is the boss: rings, drops and missiles go there
  }

  swap() {
    this.real = (this.real + 1 + Math.floor(Math.random() * 2)) % 3;
    this.swapT = this.fury ? 2.2 : 3.2;
    this.swapBlink = 0.5;
    sfx.charge();
  }

  updateExtra(dt) { updateWaves(this, dt); }

  pickAbility() {
    const opts = ['pulse', 'alarm', 'shuffle'];
    if (this.fury) opts.push('shots', 'shots');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    if (a === 'pulse') { this.waves.push({ r: 30, hit: new Set() }); sfx.pulse(); }
    else if (a === 'alarm') { this.g.addBeam(this.my + 130 + Math.random() * 120, this.fury ? 7 : 6); sfx.capture(); }
    else if (a === 'shuffle') this.swap();
    else if (a === 'shots') this.shootAtPlayer(3);
  }

  holdBall(b) { this.throwBall(b); }

  collide(b) {
    if (this.dead) return false;
    const seats = this.seats();
    for (let i = 0; i < 3; i++) {
      if (i !== this.real && this.g.effects.pierce) continue;
      if (!collideCircle(b, seats[i].x, seats[i].y, this.seatR)) continue;
      if (i === this.real && this.swapBlink <= 0 && this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else { sfx.clang(); this.g.ring(b.x, b.y, 40); }
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    const seats = this.seats();
    for (let i = 0; i < 3; i++) {
      if (Math.hypot(x - seats[i].x, y - seats[i].y) < this.seatR + rad) return i === this.real && this.swapBlink <= 0 ? 'core' : 'armor';
    }
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t, R = this.seatR;
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.6 * Math.sin(t * 30) : 0);
    renderWaves(c, this, col);
    const seats = this.seats();
    // the long table
    const ty = this.my + 70;
    c.beginPath(); c.moveTo(this.mx - 300, ty); c.lineTo(this.mx + 300, ty);
    neonStroke(c, col, col, 3, this.mx - 300, ty, this.mx + 300, ty, 0.7);
    for (let i = 0; i < 3; i++) {
      const s = seats[i], real = i === this.real, blink = real && this.swapBlink > 0 && Math.sin(t * 40) > 0;
      const on = real && !blink;
      // high-backed chair
      roundRectPath2(c, s.x - 34, s.y - 62, 68, 108, 14);
      c.fillStyle = rgba(col, on ? 0.14 : 0.05); c.fill();
      c.strokeStyle = rgba(col, on ? 0.7 : 0.3); c.lineWidth = 2; c.stroke();
      c.beginPath(); c.moveTo(s.x, s.y + R); c.lineTo(s.x, ty);
      c.strokeStyle = rgba(col, 0.35); c.lineWidth = 2; c.stroke();
      // head
      c.beginPath(); c.arc(s.x, s.y, R, 0, TAU);
      c.fillStyle = rgba(col, on ? 0.22 + this.flash * 0.3 : 0.08); c.fill();
      neonStroke(c, col, col, on ? 3.5 : 2, s.x - R, s.y, s.x + R, s.y, on ? glow : 0.4);
      if (on) {
        c.beginPath(); c.arc(s.x, s.y, R * 0.4 + 2 * Math.sin(t * 6), 0, TAU);
        c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 22 * view.blur; c.fill(); c.shadowBlur = 0;
        // crown
        const cy = s.y - R - 10;
        poly(c, [[s.x - 20, cy + 8], [s.x - 20, cy - 8], [s.x - 10, cy], [s.x, cy - 14], [s.x + 10, cy], [s.x + 20, cy - 8], [s.x + 20, cy + 8]]);
        c.fillStyle = rgba('#ffffff', 0.85); c.fill();
      } else {
        c.beginPath(); c.moveTo(s.x - 10, s.y); c.lineTo(s.x + 10, s.y);
        c.strokeStyle = rgba('#ffffff', 0.45); c.lineWidth = 2; c.stroke();
      }
    }
  }
}

// ---------- CHAPTER 10 (FINAL): O SISTEMA ----------
// The market's smiling executive: a pixel face in a suit, with dollar signs
// for eyes. The mouth, a notch at the bottom of the face between the cheeks,
// is the weak point: it opens to talk, and its market talk falls as
// candlesticks that become bricks (a hit pops the balloon first). The eyes
// fire lasers shaped like a chart line, and a deep breath pulls the discs in
// and spits them back out. Every hit knocks pixels off; in fury it glitches
// and pushes updates that swap the field's mechanic. Beaten, the market
// crashes and the executive shrinks into a little man who runs away.
const FPX = 14;
const FACE = [
  '.....#######.....',
  '...###########...',
  '..#############..',
  '.###############.',
  '#################',
  '#################',
  '#################',
  '#################',
  '#################',
  '.####.......####.',
  '..###.......###..',
  '...##.......##...',
];
const FACE_EYES = [[4, 5, 6], [10, 11, 12]];   // eye columns, on rows 4 and 5
const FACE_TALK = ['COMPRE!', 'O MERCADO SE AUTORREGULA', 'LUCRO RECORDE', 'VOLATILIDADE É OPORTUNIDADE', 'RISCO ZERO', 'INVISTA EM VOCÊ', 'SÓ SOBE!', 'CONFIE NO MERCADO'];
const FACE_FURY = ['VENDAM TUDO!', 'É SÓ UMA CORREÇÃO', 'NÃO ENTREM EM PÂNICO', 'CIRCUIT BREAKER!', 'RESGATE JÁ!'];
const FACE_DEATH = 6.5;   // seconds of the market crash, before the ending
const MOUTH_Y = 75, MOUTH_R = 32;   // the weak point, in the notch (it sticks out under the chin)
const NOTCH = [5, 11];               // the mouth's columns, on rows 9 to 11

class Face extends Boss {
  constructor(g) {
    super(g, 'O SISTEMA');
    this.hpMax = 6;
    this.hp = this.hpMax;
    this.coreR = MOUTH_R;
    this.cx = W / 2;
    this.y0 = g.top + 200;   // the middle of the face
    this.ph = 0;
    this.open = 0;
    this.cycle = 0;
    this.balloons = [];
    this.inhale = 0;
    this.shock = 0;
    this.talk = 0;
    this.look = 0;
    // the face's pixels, and the order they fall off in
    this.cells = [];
    FACE.forEach((row, r) => { for (let q = 0; q < row.length; q++) if (row[q] === '#') this.cells.push([q, r]); });
    const feat = (q, r) => (r >= 1 && r <= 5 && (FACE_EYES[0].includes(q) || FACE_EYES[1].includes(q)));
    let seed = 77;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    this.order = this.cells.filter(([q, r]) => !feat(q, r)).map((cl) => ({ cl, k: rnd() })).sort((a, b) => a.k - b.k).map((o) => o.cl[0] + ',' + o.cl[1]);
    this.gone = 0;
  }

  get cy() { return this.y0 + MOUTH_Y; }
  get bandY() { return this.g.top + 200 + 84 + 130; }
  get coreOpen() { return this.open > 0.6 && this.inhale <= 0; }
  // how many pixels are gone: more with every hit, all of them at the end
  get lostCells() {
    const taken = (this.lives === 2 ? 0 : this.hpMax) + (this.hpMax - this.hp);
    const f = this.dead ? 0.55 + 0.45 * Math.min(1, (FACE_DEATH - this.deathT) / 1.4) : (taken / (2 * this.hpMax)) * 0.55;
    return Math.floor(f * this.order.length);
  }

  move(dt) {
    this.ph += dt * (this.fury ? 0.5 : 0.3);
    this.cx = W / 2 + 140 * Math.sin(this.ph);
    this.y0 = this.g.top + 200 + 10 * Math.sin(this.t * 1.3);
    const openT = this.fury ? 2.6 : 3, closedT = this.fury ? 1.8 : 2.4;
    this.cycle = (this.cycle + dt) % (openT + closedT);
    const target = (this.cycle >= closedT && !this.charge) || this.inhale > 0 ? 1 : 0;
    this.open += (target - this.open) * Math.min(1, dt * 8);
    this.shock = Math.max(0, this.shock - dt);
    this.talk = Math.max(0, this.talk - dt);
    const b = this.freeBalls()[0];
    if (b) this.look += (clamp((b.x - this.cx) / 220, -1, 1) - this.look) * Math.min(1, dt * 6);
  }

  damage(n, force, minor) {
    const n0 = this.lostCells;
    const ok = super.damage(n, force, minor);
    if (!ok) return ok;
    if (!minor) this.shock = 0.7;
    this.shed(n0, this.lostCells);
    return ok;
  }

  // the pixels between n0 and n1 fly off the face
  shed(n0, n1) {
    for (let i = n0; i < n1; i++) {
      const [q, r] = this.order[i].split(',').map(Number);
      const x = this.cx + (q - 8) * FPX, y = this.y0 + (r - 6) * FPX;
      for (let k = 0; k < 3; k++) this.g.particles.push({ x, y, vx: (Math.random() - 0.5) * 260, vy: -60 + Math.random() * 280, life: 0.9, max: 0.9, col: k ? this.g.col : '#ffffff', sq: true });
    }
  }

  enterFury() {
    super.enterFury();
    this.g.startUpd(['portals', 'gravity', 'alarm'], 11);
  }

  die() {
    super.die();
    this.deathT = FACE_DEATH;
    this.ownDeath = true;   // the game draws the whole crash, without fading it out
    this.g.bricks = []; this.g.alive = 0;
    this.balloons = [];
    this.inhale = 0;
    sfx.marketCrash();
  }

  update(dt) {
    if (this.dead) {   // the market crash: the face falls apart, then the little man runs
      const n0 = this.lostCells;
      this.t += dt;
      this.deathT -= dt;
      this.shed(n0, this.lostCells);
      const k = FACE_DEATH - this.deathT;
      if (k < 1.6 && Math.random() < dt * 10) this.g.burst(this.cx + (Math.random() - 0.5) * 240, this.y0 + (Math.random() - 0.5) * 160, 8, 1.2);
      this.g.shake = Math.max(this.g.shake, k < 1.4 ? 0.5 : 0);
      return;
    }
    super.update(dt);
  }

  updateExtra(dt) {
    const g = this.g;
    // the deep breath: the discs are pulled to the mouth
    if (this.inhale > 0) {
      this.inhale -= dt;
      for (const b of this.freeBalls()) {
        const dx = this.cx - b.x, dy = this.cy - b.y, d = Math.hypot(dx, dy) || 1;
        if (d < MOUTH_R + b.r + 6) {
          b.cap = { t: 0.6 };
          this.inhale = 0;
          g.float('ENGOLIDO', this.cx, this.cy + 70, 22);
          sfx.capture();
          break;
        }
        if (d > 560) continue;
        b.vx += (dx / d) * 1300 * dt; b.vy += (dy / d) * 1300 * dt;
        const s = Math.hypot(b.vx, b.vy) || 1;
        b.vx = (b.vx / s) * b.s; b.vy = (b.vy / s) * b.s;
      }
    }
    // speech balloons: they hang beside the face, then fall and become bricks
    for (const L of this.balloons) {
      if (L.t > 0) {
        L.t -= dt;
        if (L.t <= 0) { const cx = L.x + L.w / 2; L.x = cx - 48; L.w = 96; L.y += L.h - 56; L.h = 56; L.candle = true; }   // the promise turns into candlesticks
        continue;
      }
      L.vy += 900 * dt;
      L.y += L.vy * dt;
      if (L.y + L.h >= this.bandY) { L.dead = true; this.drop(L); }
    }
    this.balloons = this.balloons.filter((L) => !L.dead);
  }

  // a balloon hit the bricks' band: up to 3 bricks under it
  drop(L) {
    const g = this.g, BWd = (W - 64 - 8 * 8) / 9, cols = [];
    for (let c = 0; c < 9; c++) { const x = 32 + c * (BWd + 8); if (x + BWd > L.x && x < L.x + L.w) cols.push(c); }
    let n = 0;
    for (const c of cols) {
      if (n >= 3) break;
      for (const r of [100, 101]) {
        if (g.bricks.some((b) => !b.dead && b.row === r && b.col === c)) continue;
        const x = 32 + c * (BWd + 8);
        g.bricks.push({ x, baseX: x, y: this.bandY + (r - 100) * 36, w: BWd, h: 28, hp: this.fury ? 2 : 1, kind: 'n', row: r, col: c, flash: 1, dead: false });
        g.alive++; n++;
        break;
      }
    }
    g.ring(L.x + L.w / 2, L.y + L.h / 2, 90);
    g.shake = Math.max(g.shake, 0.25);
    sfx.clang();
  }

  pop(L) {
    L.dead = true;
    for (let k = 0; k < 14; k++) this.g.particles.push({ x: L.x + Math.random() * L.w, y: L.y + Math.random() * L.h, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220, life: 0.6, max: 0.6, col: '#ffffff', sq: true });
    this.g.ring(L.x + L.w / 2, L.y + L.h / 2, 60);
    this.g.float('CALADO!', L.x + L.w / 2, L.y - 10, 18);
    sfx.brk(3);
  }

  pickAbility() {
    const opts = ['talk', 'talk', 'lasers'];
    if (this.freeBalls().some((b) => b.y > this.cy + 120)) opts.push('inhale');
    if (this.fury) opts.push('lasers', 'talk');
    if (this.balloons.length >= 2) return opts.filter((a) => a !== 'talk')[0] || 'lasers';
    return opts[Math.floor(Math.random() * opts.length)];
  }

  exec(a) {
    const g = this.g;
    if (a === 'talk') {
      const list = this.fury ? FACE_FURY : FACE_TALK;
      const text = list[Math.floor(Math.random() * list.length)];
      // long sentences break into two lines, at the space nearest the middle
      let lines = [text];
      if (text.length > 14) {
        let best = -1;
        for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2))) best = i;
        if (best > 0) lines = [text.slice(0, best), text.slice(best + 1)];
      }
      const w = Math.round(Math.max(...lines.map((q) => q.length)) * 9.6 + 28), h = lines.length > 1 ? 50 : 34;
      const right = this.cx < W / 2;
      let x = right ? this.cx + 130 : this.cx - 130 - w;
      x = clamp(x, 18, W - 18 - w);
      this.balloons.push({ text, lines, x, y: this.y0 - 70 - (h - 34), w, h, t: 1.8, vy: 0, right });
      this.talk = 1.2;
      sfx.charge();
    } else if (a === 'lasers') {
      const p = g.paddle;
      for (const s of [-1, 1]) {
        const ex = this.cx + s * 3 * FPX, ey = this.y0 - 1.5 * FPX;
        const dx = p.x - ex, dy = p.y - ey, a0 = Math.atan2(dy, dx);
        for (const o of this.fury ? [-0.18, 0.18] : [0]) { g.enemyShot(ex, ey, Math.cos(a0 + o) * 380, Math.sin(a0 + o) * 380); g.shots[g.shots.length - 1].zig = 22; }   // a chart line
      }
      sfx.laser();
    } else if (a === 'inhale') {
      this.inhale = 2.2;
      sfx.capture();
    }
  }

  holdBall(b, dt) {
    b.x += (this.cx - b.x) * Math.min(1, dt * 10);
    b.y += (this.cy - b.y) * Math.min(1, dt * 10);
    b.cap.t -= dt;
    if (b.cap.t <= 0) { this.throwBall(b); b.s *= 1.15; }
  }

  collide(b) {
    if (this.dead) return false;
    for (const L of this.balloons) if (!L.dead && collideRect(b, L.x, L.y, L.w, L.h)) { this.pop(L); return true; }
    if (collideCircle(b, this.cx, this.cy, MOUTH_R)) {
      if (this.coreOpen && this.coreCool <= 0) { this.coreCool = 0.35; this.damage(this.g.ballDamage()); }
      else { sfx.clang(); this.g.ring(b.x, b.y, 36); }
      return true;
    }
    if (this.g.effects.pierce) return false;
    const x = this.cx, y = this.y0;
    if (collideRect(b, x - 119, y - 91, 238, 126) || collideRect(b, x - 105, y + 35, 56, 49) || collideRect(b, x + 49, y + 35, 56, 49)
      || collideRect(b, x - 196, y + 42, 80, 56) || collideRect(b, x + 116, y + 42, 80, 56)) {
      sfx.clang(); this.g.ring(b.x, b.y, 36);
      return true;
    }
    return false;
  }

  hitShot(x, y, rad) {
    if (this.dead) return null;
    if (Math.hypot(x - this.cx, y - this.cy) < MOUTH_R + rad) return this.coreOpen ? 'core' : 'armor';
    const fx = this.cx, fy = this.y0;
    if (x > fx - 119 - rad && x < fx + 119 + rad && y > fy - 91 - rad && y < fy + 84 + rad) return 'armor';
    if (Math.abs(x - fx) < 196 + rad && y > fy + 42 - rad && y < fy + 98 + rad) return 'armor';   // the shoulders
    return null;
  }

  render(c) {
    const col = this.g.col, t = this.t;
    if (this.dead) { this.renderCrash(c, col); return; }
    this.drawSuit(c, this.cx, this.y0, col);
    // in fury the face glitches: a shifted copy flickers beside it
    if (this.fury && Math.sin(t * 11) > 0.6) {
      c.save(); c.globalAlpha *= 0.3;
      this.drawFace(c, this.cx + 9 * Math.sin(t * 37), this.y0 - 3, col);
      c.restore();
    }
    this.drawFace(c, this.cx, this.y0, col);
    // the deep breath: lines rushing into the mouth
    if (this.inhale > 0) {
      c.save(); c.setLineDash([10, 14]); c.lineDashOffset = t * 120;
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = Math.PI * 0.15 + (k / 7) * Math.PI * 0.7;
        c.moveTo(this.cx + Math.cos(a) * 190, this.cy + Math.sin(a) * 190); c.lineTo(this.cx + Math.cos(a) * 44, this.cy + Math.sin(a) * 44);
      }
      c.strokeStyle = rgba(col, 0.55); c.lineWidth = 2; c.stroke();
      c.restore();
    }
    for (const L of this.balloons) {
      const fall = L.t <= 0;
      if (L.candle) { drawCandles(c, L.x, L.y, L.w, L.h, col, t); continue; }
      c.save();
      if (fall) c.globalAlpha *= 0.75 + 0.25 * Math.sin(t * 30);
      roundRectPath2(c, L.x, L.y, L.w, L.h, 12);
      c.fillStyle = '#000'; c.fill();
      c.fillStyle = rgba(col, 0.14); c.fill();
      if (fall) c.setLineDash([6, 5]);
      neonStroke(c, col, col, 2.2, L.x, L.y, L.x + L.w, L.y + L.h, 0.8);
      c.setLineDash([]);
      if (!fall) {   // the tail points at the face
        const tx = L.right ? L.x : L.x + L.w, s = L.right ? -1 : 1;
        c.beginPath(); c.moveTo(tx, L.y + L.h - 12); c.lineTo(tx + s * 14, L.y + L.h + 6); c.lineTo(tx - s * 2, L.y + L.h - 2);
        c.strokeStyle = col; c.lineWidth = 2; c.stroke();
      }
      L.lines.forEach((q, i) => glowText(c, q, L.x + L.w / 2, L.y + L.h / 2 + 1 + (i - (L.lines.length - 1) / 2) * 16, 11, '#ffffff', col, 'center', 800, 2));
      c.restore();
    }
  }

  drawFace(c, x0, y0, col) {
    const t = this.t, lost = new Set(this.order.slice(0, this.lostCells));
    const has = (q, r) => FACE[r] && FACE[r][q] === '#' && !lost.has(q + ',' + r);
    const px = (q, r, inset = 1) => c.rect(x0 + (q - 8) * FPX - FPX / 2 + inset, y0 + (r - 6) * FPX - FPX / 2 + inset, FPX - inset * 2, FPX - inset * 2);
    // body: inner pixels faint, edge pixels bright and glowing
    const glow = 0.8 + this.flash * 1.2 + (this.charge ? 0.5 * Math.sin(t * 30) : 0);
    c.beginPath();
    for (const [q, r] of this.cells) if (has(q, r) && has(q - 1, r) && has(q + 1, r) && has(q, r - 1) && has(q, r + 1)) px(q, r);
    c.fillStyle = rgba(col, 0.2 + this.flash * 0.35); c.fill();
    c.beginPath();
    for (const [q, r] of this.cells) if (has(q, r) && !(has(q - 1, r) && has(q + 1, r) && has(q, r - 1) && has(q, r + 1))) px(q, r);
    c.fillStyle = rgba(col, Math.min(1, 0.6 + 0.2 * glow)); c.shadowColor = col; c.shadowBlur = 12 * glow * view.blur; c.fill(); c.shadowBlur = 0;
    // the mood: smiling, angry (charging or in fury) or shocked (just hit)
    const mood = this.shock > 0 ? 'shock' : this.charge || this.fury ? 'angry' : 'smile';
    c.beginPath();
    const brow = mood === 'shock' ? [[4, 1], [5, 1], [6, 1], [10, 1], [11, 1], [12, 1]]
      : mood === 'angry' ? [[4, 2], [5, 2], [6, 3], [10, 3], [11, 2], [12, 2]]
      : [[4, 2], [5, 2], [6, 2], [10, 2], [11, 2], [12, 2]];
    for (const [q, r] of brow) px(q, r, 2);
    // eyes (they follow the disc); they light up before the lasers
    const laser = this.charge && this.charge.a === 'lasers';
    for (const eye of FACE_EYES) for (const q of eye) for (const r of [4, 5]) px(q, r, 1);
    c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = (laser ? 22 : 8) * view.blur; c.fill(); c.shadowBlur = 0;
    const blink = !laser && mood !== 'shock' && (t % 4.2) > 4.05;
    if (blink) {
      c.beginPath();
      for (const eye of FACE_EYES) for (const q of eye) px(q, 4, 1);
      c.fillStyle = rgba(col, 0.9); c.fill();
    } else {   // dollar signs for pupils, looking at the disc
      c.font = '900 24px "Orbitron", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#000';
      for (const eye of FACE_EYES) c.fillText('$', x0 + (eye[1] - 8) * FPX + this.look * 7, y0 + (4.5 - 6) * FPX + 1);
      c.textBaseline = 'alphabetic';
    }
    if (laser) for (const s of [-1, 1]) {
      const k = 1 - this.charge.t / this.charge.max;
      c.beginPath(); c.arc(x0 + s * 3 * FPX, y0 - 1.5 * FPX, 40 * (1 - k) + 8, 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.8 * k); c.lineWidth = 2; c.stroke();
    }
    // the mouth, in the notch at the bottom
    const my = y0 + MOUTH_Y;
    const flap = this.talk > 0 ? 0.5 + 0.5 * Math.sin(t * 28) : 0;
    const op = Math.max(this.open, flap * 0.5);
    if (this.inhale > 0) {   // an O, teeth shut
      c.beginPath(); c.arc(x0, my - 4, 18, 0, TAU);
      c.fillStyle = '#000'; c.fill();
      neonStroke(c, col, col, 3, x0 - 18, my, x0 + 18, my, 1);
    } else if (op > 0.15) {   // open: a dark mouth with the core inside
      const h = 18 + 48 * op;
      roundRectPath2(c, x0 - 46, my - 36, 92, h, 12);
      c.fillStyle = '#000'; c.fill();
      c.strokeStyle = rgba(col, 0.9); c.lineWidth = 2.4; c.stroke();
      c.fillStyle = '#ffffff';
      for (const q of [-1, 0, 1]) c.fillRect(x0 + q * 22 - 6, my - 34, 12, 8);   // teeth
      if (this.coreOpen) {
        c.beginPath(); c.arc(x0, my, 12 + 2 * Math.sin(t * 8), 0, TAU);
        c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 24 * view.blur; c.fill(); c.shadowBlur = 0;
        c.beginPath(); c.arc(x0, my, MOUTH_R - 4, 0, TAU);
        c.strokeStyle = rgba(col, 0.5 + 0.3 * Math.sin(t * 6)); c.lineWidth = 2; c.stroke();
      }
    } else {   // shut: a pixel smile (a frown when angry) over a faint closed mouth
      c.beginPath();
      for (let q = NOTCH[0]; q <= NOTCH[1]; q++) for (let r = 9; r <= 11; r++) px(q, r, 1);
      c.fillStyle = rgba(col, 0.12); c.fill();
      c.beginPath();
      const lips = mood === 'angry' ? [[5, 11], [6, 10], [7, 9], [8, 9], [9, 9], [10, 10], [11, 11]]
        : mood === 'shock' ? [[7, 9], [8, 9], [9, 9], [6, 10], [10, 10], [7, 11], [8, 11], [9, 11]]
        : [[5, 9], [6, 10], [7, 11], [8, 11], [9, 11], [10, 10], [11, 9]];
      for (const [q, r] of lips) px(q, r, 1);
      c.fillStyle = '#ffffff'; c.shadowColor = col; c.shadowBlur = 10 * view.blur; c.fill(); c.shadowBlur = 0;
    }
  }
}

// candlesticks of a chart: filled ones went up, outlined ones went down
function drawCandles(c, x, y, w, h, col, t) {
  const n = 3, cw = w / n;
  for (let i = 0; i < n; i++) {
    const up = i % 2 === 0, bx = x + i * cw + cw * 0.2, bw = cw * 0.6, top = y + h * (up ? 0.22 : 0.3), bh = h * (up ? 0.56 : 0.42);
    c.beginPath(); c.moveTo(bx + bw / 2, y); c.lineTo(bx + bw / 2, y + h);
    c.strokeStyle = rgba(col, 0.9); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.rect(bx, top, bw, bh);
    c.fillStyle = up ? col : '#000'; c.fill();
    neonStroke(c, col, col, 2, bx, top, bx + bw, top, 0.6 + 0.3 * Math.sin(t * 9 + i));
  }
}

Face.prototype.drawSuit = function (c, x0, y0, col) {
  // shoulders and lapels beside the head, and a crooked tie over one shoulder
  for (const s of [-1, 1]) {
    const X = (u) => x0 + s * u;
    c.beginPath(); c.moveTo(X(112), y0 + 44); c.lineTo(X(170), y0 + 52); c.quadraticCurveTo(X(196), y0 + 58, X(196), y0 + 80); c.lineTo(X(196), y0 + 98); c.lineTo(X(112), y0 + 98); c.closePath();
    c.fillStyle = '#000'; c.fill(); c.fillStyle = rgba(col, 0.16 + this.flash * 0.3); c.fill();
    neonStroke(c, col, col, 2.6, X(112), y0 + 70, X(196), y0 + 70, 0.8);
    c.beginPath(); c.moveTo(X(114), y0 + 46); c.lineTo(X(146), y0 + 96); c.lineTo(X(150), y0 + 68);   // lapel
    c.strokeStyle = rgba('#ffffff', 0.75); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#ffffff'; c.fillRect(X(176) - 3, y0 + 80, 6, 6);   // a button
  }
  const a = -0.5 + 0.18 * Math.sin(this.t * 2.4) + (this.fury ? 0.25 * Math.sin(this.t * 9) : 0);
  c.save(); c.translate(x0 - 116, y0 + 50); c.rotate(a);
  c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.lineTo(4, 10); c.lineTo(-4, 10); c.closePath();
  c.moveTo(-4, 10); c.lineTo(4, 10); c.lineTo(10, 52); c.lineTo(0, 62); c.lineTo(-10, 52); c.closePath();
  c.fillStyle = '#ffffff'; c.fill();
  c.restore();
};

// the market crash: a chart in free fall, candles tipping over, the ticker in
// panic, and the executive shrinking into a little man who runs off screen
Face.prototype.renderCrash = function (c, col) {
  const g = this.g, k = FACE_DEATH - this.deathT, t = this.t;
  const top = g.top + 40, bot = g.dangerY - 40;
  // the chart: it climbs, then falls through the floor
  const fall = Math.min(1, Math.max(0, (k - 0.3) / 1.6));
  c.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, x = 40 + u * (W - 80);
    let y = bot - (bot - top) * 0.75 * u + 18 * Math.sin(i * 1.7);
    if (u > 0.6) y += (u - 0.6) / 0.4 * (bot - top + 400) * fall;
    c[i ? 'lineTo' : 'moveTo'](x, Math.min(y, g.H + 50));
  }
  c.save(); c.globalAlpha *= Math.min(1, k * 2);
  neonStroke(c, col, col, 4, 40, top, W - 40, bot, 1.2);
  c.restore();
  // candles all along, tipping over and falling, one after another
  for (let i = 0; i < 9; i++) {
    const d = Math.max(0, k - 0.4 - i * 0.12), x = 70 + i * 72, y = top + 60 + (i % 3) * 30 + 300 * d * d, rot = Math.min(1.5, d * 2) * (i % 2 ? 1 : -1);
    if (y > g.H) continue;
    c.save(); c.translate(x, y); c.rotate(rot); drawCandles(c, -21, -26, 42, 52, col, t); c.restore();
  }
  // the ticker in panic
  const ty = g.top + 300;
  c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(0, ty - 24, W, 48);
  c.beginPath(); c.moveTo(0, ty - 24); c.lineTo(W, ty - 24); c.moveTo(0, ty + 24); c.lineTo(W, ty + 24);
  neonStroke(c, col, col, 2, 0, ty, W, ty, 0.8);
  const msg = 'PÂNICO NA BOLSA   ▼ O SISTEMA -99,9%   ▼ CIRCUIT BREAKER   ▼ LUCRO NÃO ENCONTRADO   ';
  c.save(); c.beginPath(); c.rect(0, ty - 24, W, 48); c.clip();
  c.font = '800 20px "Orbitron", sans-serif';
  const mw = c.measureText(msg).width + msg.length * 2, off = -((k * 260) % mw);   // glowText adds 2 px between letters
  for (let x = off; x < W; x += mw) glowText(c, msg, x, ty + 1, 20, '#ffffff', col, 'left', 800, 2);
  c.restore();
  if (Math.sin(t * 12) > -0.3) neonTitle(c, '-99,9%', W / 2, ty + 100, 64, col, col, 8);
  // the executive: the face shrinks, then the little man runs away
  const shrink = Math.min(1, Math.max(0, (k - 0.6) / 1.4));
  if (shrink < 1) {
    c.save(); c.translate(this.cx, this.y0); c.scale(1 - shrink * 0.9, 1 - shrink * 0.9); c.translate(-this.cx, -this.y0);
    this.drawSuit(c, this.cx, this.y0, col);
    this.drawFace(c, this.cx, this.y0, col);
    c.restore();
  } else {
    const run = k - 2, dir = this.cx > W / 2 ? -1 : 1, x = this.cx + dir * (run * run * 60 + run * 120), y = this.y0 + 40, step = Math.sin(t * 26);
    if (x > -40 && x < W + 40) {
      c.save(); c.translate(x, y); c.scale(dir * 1.7, 1.7);
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 6); c.lineTo(-7 * step, 20); c.moveTo(0, 6); c.lineTo(7 * step, 20);   // legs
      c.moveTo(0, -6); c.lineTo(-9, 2 + 4 * step); c.moveTo(0, -6); c.lineTo(9, 2 - 4 * step); c.stroke();   // arms
      c.beginPath(); c.rect(-6, -10, 12, 17); c.fillStyle = col; c.fill();   // the little suit
      c.beginPath(); c.rect(-6, -24, 12, 12); c.fillStyle = col; c.fill();   // the little head
      c.fillStyle = '#000'; c.fillRect(-3, -20, 2, 3); c.fillRect(2, -20, 2, 3);
      c.fillStyle = '#ffffff'; c.fillRect(-1, -9, 2, 9);   // the tie
      c.beginPath(); c.arc(-12, -20 - 4 * Math.abs(step), 2.5, 0, TAU); c.fill();   // a drop of sweat
      c.restore();
      if (run < 1.6) glowText(c, 'NÃO FOI CULPA MINHA!', Math.max(130, Math.min(W - 130, x)), y - 64, 13, '#ffffff', col, 'center', 800, 3);
    }
  }
};

export function createBoss(type, g) {
  if (type === 'armored') return new Armored(g);
  if (type === 'council') return new Council(g);
  if (type === 'algorithm') return new Algorithm(g);
  if (type === 'censor') return new Censor(g);
  if (type === 'clock') return new Clock(g);
  if (type === 'patent') return new Patent(g);
  if (type === 'system') return new Face(g);
  if (type === 'supervisor') return new Supervisor(g);
  return type === 'sentinel' ? new Sentinel(g) : new Singularity(g);
}
