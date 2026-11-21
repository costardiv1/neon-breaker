// ---------- 1x1: face to face against the AI ----------
// The player's platform at the bottom, the AI's (flipped) at the top and a
// band of bricks in the middle. Whoever lets the disc through their end loses
// a life; the first to lose all of them loses the match. Breaking bricks gives
// points to whoever touched the disc last, and the band comes back when it is
// cleared.
import { TAU, rgba, mix, neonStroke, glowText, neonTitle, view } from './render.js';
import { SHAPES, drawPlatform, outAngle } from './platform.js';
import { sfx, music, vibrate } from './audio.js';

const W = 720, LEFT = 14, RIGHT = W - 14;
const LIVES = 3;
const HW = 86;               // half the width of both platforms
const PAD_GAP = 120;         // from each end of the field to its platform
const R = 12;                // the disc
const V0 = 600, V_STEP = 12, V_MAX = 860;   // disc speed: start, gain per hit, cap
// the AI plays like a person: it reacts late, speeds up and brakes (and
// sometimes overshoots), reads the disc better as it comes closer, sometimes
// starts the wrong way off a wall, and misses more when the disc is fast
const AI_VMAX = 700;         // top speed of the AI platform (px/s)
const AI_ACC = 2600;         // how hard it can speed up or brake (px/s²)
const AI_REACT = [0.12, 0.24];   // reaction time after the player hits (s)
const COLS = 9, ROWS = 4, BW = (W - 64 - 8 * (COLS - 1)) / COLS, BH = 28, GAP = 8;

// the AI gets a color that stands apart from the player's theme
const warm = (c) => ['#ff7a1a', '#ff2d4a', '#ff45c0', '#ffd21f'].includes(c);

export class Versus {
  constructor(H, top, plat, col) {
    this.H = H; this.top = top; this.plat = plat; this.col = col;
    this.aiCol = warm(col) ? '#00e5ff' : '#ff2d4a';
    this.aiPlat = { shape: 0, pal: 7, emb: 3, disc: 0, trail: 0, dash: false, detail: true };
    this.bottom = H - 62;
    this.me = { x: W / 2, tx: W / 2, y: this.bottom - PAD_GAP, lives: LIVES, pts: 0, hit: 0 };
    this.ai = { x: W / 2, tx: W / 2, vx: 0, y: top + PAD_GAP, lives: LIVES, pts: 0, hit: 0, think: 0, err: 0, aim: 0, react: 0.3, wrong: false, lazy: 0 };
    this.ball = null;
    this.bricks = []; this.parts = []; this.rings = []; this.floats = [];
    this.t = 0;
    this.state = 'play';   // play | won | lost
    this.endT = 0;
    this.shake = 0;
    this.banner = { text: '1 × 1', sub: 'CONTRA A IA', t: 1.8, max: 1.8 };
    this.refillT = 0;
    this.fillBand();
    this.serve('me');
    music.play('boss1');
  }

  get midY() { return (this.top + this.bottom) / 2; }

  fillBand() {
    const y0 = this.midY - (ROWS * BH + (ROWS - 1) * GAP) / 2;
    this.bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (Math.random() < 0.12) continue;   // a few holes, so each band is different
        const inner = r === 1 || r === 2;
        this.bricks.push({ x: 32 + c * (BW + GAP), y: y0 + r * (BH + GAP), w: BW, h: BH, hp: inner ? 2 : 1, max: inner ? 2 : 1, flash: 0 });
      }
    }
  }

  // the disc waits on the platform of whoever serves
  serve(who) {
    this.ball = { x: 0, y: 0, vx: 0, vy: 0, s: V0, own: who, held: who, wait: who === 'ai' ? 1.1 : 0, trail: [] };
    this.place();
  }
  place() {
    const b = this.ball, p = b.held === 'me' ? this.me : this.ai;
    b.x = p.x; b.y = b.held === 'me' ? p.y - R - 6 : p.y + R + 6;
  }
  launch(who, k) {
    const b = this.ball;
    if (!b || b.held !== who) return;
    const th = k * 0.55, d = who === 'me' ? -1 : 1;
    b.vx = Math.sin(th) * b.s; b.vy = d * Math.cos(th) * b.s;
    b.held = null;
    sfx.launch();
  }

  // input: the platform follows the drag (or the mouse); letting go serves
  press(x) { this.drag = { x }; if (this.state === 'play') this.me.tx = x; }
  move(x, mouse, sens) {
    if (mouse) this.me.tx = x;
    else if (this.drag) { this.me.tx += (x - this.drag.x) * sens; this.drag.x = x; }
    this.me.tx = Math.max(LEFT + HW * 0.75, Math.min(RIGHT - HW * 0.75, this.me.tx));
  }
  release() {
    this.drag = null;
    if (this.state === 'play' && this.ball && this.ball.held === 'me') this.launch('me', (Math.random() - 0.5) * 0.6);
  }

  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    for (const p of [this.me, this.ai]) p.hit = Math.max(0, p.hit - dt * 3);
    this.updateFx(dt);
    if (this.state !== 'play') { this.endT += dt; return; }
    const me = this.me;
    me.x += (me.tx - me.x) * Math.min(1, dt * 22);
    this.updateAi(dt);
    const b = this.ball;
    if (b.held) {
      this.place();
      if (b.held === 'ai') { b.wait -= dt; if (b.wait <= 0) this.launch('ai', (Math.random() - 0.5) * 1.2); }
    } else {
      const n = Math.max(1, Math.ceil((b.s * dt) / 8));
      for (let i = 0; i < n && this.ball === b && !b.held; i++) this.step(b, dt / n);   // a point serves a new disc
      b.trail.push(b.x, b.y); if (b.trail.length > 24) b.trail.splice(0, 2);
    }
    if (this.refillT > 0) { this.refillT -= dt; if (this.refillT <= 0) { this.fillBand(); this.banner = { text: 'NOVA LEVA', t: 1.2, max: 1.2 }; } }
  }

  // The AI: after a reaction time it guesses where the disc will cross its
  // line, off at first and better as the disc comes closer, and aims for one
  // of the tips to angle it back. It looks again at uneven intervals, like eyes.
  updateAi(dt) {
    const ai = this.ai, b = this.ball;
    ai.react -= dt; ai.think -= dt;
    let vmax = AI_VMAX;
    if (ai.think <= 0) {
      ai.think = 0.08 + Math.random() * 0.14;
      if (b.held === 'ai') ai.tx = W / 2 + Math.sin(this.t * 1.3) * 120 + Math.sin(this.t * 3.1) * 30;
      else if (!b.held && b.vy < 0 && ai.react <= 0) {
        const left = (b.y - ai.y) / (this.me.y - ai.y);   // 1 just off the player, 0 at the AI
        if (ai.wrong && left > 0.45) {   // fooled by the wall: it goes where the disc points
          ai.tx = Math.max(LEFT + HW, Math.min(RIGHT - HW, b.x + (b.vx * (ai.y + R - b.y)) / b.vy));
        } else {
          ai.wrong = false;
          ai.tx = this.predict(b, ai.y + R) + ai.err * (0.4 + 0.6 * Math.max(0, left)) - ai.aim * HW * 0.7;
        }
      } else if (b.vy >= 0 && !b.held) ai.tx = W / 2 + (b.x - W / 2) * 0.35 + ai.lazy;   // the disc goes away: back toward the middle
    }
    if (b.vy >= 0 && !b.held) vmax *= 0.55;   // no hurry while the disc is away
    // speed up and brake toward the target (a spring with a little overshoot)
    const tx = ai.tx + Math.sin(this.t * 7.3) * 4;
    const want = Math.max(-vmax, Math.min(vmax, (tx - ai.x) * 7.5));
    const dv = want - ai.vx, a = AI_ACC * dt;
    ai.vx += Math.max(-a, Math.min(a, dv));
    ai.x += ai.vx * dt;
    const lo = LEFT + HW * 0.75, hi = RIGHT - HW * 0.75;
    if (ai.x < lo || ai.x > hi) { ai.x = Math.max(lo, Math.min(hi, ai.x)); ai.vx = 0; }
  }
  // how many walls the disc will hit before it reaches the line at y
  walls(b, y) {
    if (b.vy >= 0) return 0;
    const x = b.x + (b.vx * (y - b.y)) / b.vy, lo = LEFT + R, hi = RIGHT - R;
    return x < lo ? Math.ceil((lo - x) / (hi - lo)) : x > hi ? Math.ceil((x - hi) / (hi - lo)) : 0;
  }
  predict(b, y) {
    if (b.vy >= 0) return b.x;
    let x = b.x + (b.vx * (y - b.y)) / b.vy;
    const lo = LEFT + R, hi = RIGHT - R, span = hi - lo;
    let u = (x - lo) % (2 * span); if (u < 0) u += 2 * span;
    return lo + (u > span ? 2 * span - u : u);
  }

  step(b, dt) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < LEFT + R) { b.x = LEFT + R; b.vx = Math.abs(b.vx); sfx.wall(); }
    if (b.x > RIGHT - R) { b.x = RIGHT - R; b.vx = -Math.abs(b.vx); sfx.wall(); }
    // the platforms
    const me = this.me, ai = this.ai;
    if (b.vy > 0 && b.y + R >= me.y && b.y + R <= me.y + 22 && Math.abs(b.x - me.x) < HW + R) this.bounce(b, me, 'me');
    else if (b.vy < 0 && b.y - R <= ai.y && b.y - R >= ai.y - 22 && Math.abs(b.x - ai.x) < HW + R) this.bounce(b, ai, 'ai');
    // the bricks
    for (const q of this.bricks) {
      if (q.hp <= 0) continue;
      const cx = Math.max(q.x, Math.min(b.x, q.x + q.w)), cy = Math.max(q.y, Math.min(b.y, q.y + q.h));
      const dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy > R * R) continue;
      const ox = Math.min(b.x + R - q.x, q.x + q.w - (b.x - R)), oy = Math.min(b.y + R - q.y, q.y + q.h - (b.y - R));
      if (ox < oy) { b.vx = b.x < q.x + q.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
      else { b.vy = b.y < q.y + q.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
      this.hitBrick(q, b.own);
      break;
    }
    // past an end: a life lost
    if (b.y > this.bottom + 30) this.score('me');
    else if (b.y < this.top - 30) this.score('ai');
  }

  bounce(b, p, who) {
    const k = Math.max(-1, Math.min(1, (b.x - p.x) / HW)), si = who === 'me' ? this.plat.shape : this.aiPlat.shape;
    b.s = Math.min(V_MAX, b.s + V_STEP);
    const th = outAngle(si, k, HW), d = who === 'me' ? -1 : 1;
    b.vx = Math.sin(th) * b.s; b.vy = d * Math.cos(th) * b.s;
    b.y = who === 'me' ? p.y - R : p.y + R;
    b.own = who;
    p.hit = 1;
    this.ring(b.x, b.y, 40);
    sfx.paddle();
    if (who === 'me') {   // the AI gets ready for the next one: a reaction time, an error and a tip to aim with
      const ai = this.ai, hard = (b.s - V0) / (V_MAX - V0), steep = Math.abs(b.vx) / b.s;
      ai.react = AI_REACT[0] + Math.random() * (AI_REACT[1] - AI_REACT[0]) + (Math.random() < 0.08 + 0.12 * hard ? 0.22 : 0);
      ai.err = (Math.random() - 0.5) * (60 + 110 * hard + 50 * steep);
      ai.aim = (Math.random() - 0.5) * 1.6;
      ai.wrong = this.walls(b, ai.y + R) > 0 && Math.random() < 0.25;
      vibrate(10);
    } else this.ai.lazy = (Math.random() - 0.5) * 80;
  }

  hitBrick(q, own) {
    q.hp--; q.flash = 1;
    const who = own === 'me' ? this.me : this.ai, c = own === 'me' ? this.col : this.aiCol;
    if (q.hp > 0) { sfx.brick(1); return; }
    who.pts += 10;
    sfx.brk(2);
    for (let k = 0; k < 10; k++) this.parts.push({ x: q.x + Math.random() * q.w, y: q.y + Math.random() * q.h, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.6, max: 0.6, col: Math.random() < 0.4 ? '#ffffff' : c });
    if (this.bricks.every((z) => z.hp <= 0) && this.refillT <= 0) this.refillT = 1;
  }

  // the disc went past `who`'s end
  score(who) {
    const p = who === 'me' ? this.me : this.ai;
    p.lives--;
    this.shake = 0.6;
    this.ring(this.ball.x, who === 'me' ? this.bottom : this.top, 120);
    sfx.lose(); if (who === 'me') vibrate(60);
    if (p.lives <= 0) {
      this.state = who === 'me' ? 'lost' : 'won';
      this.ball = { ...this.ball, held: who, gone: true };
      if (this.state === 'won') sfx.clear(); else sfx.over();
      if (this.onEnd) this.onEnd(this.state === 'won');
      return;
    }
    this.floats.push({ text: who === 'me' ? '-1 VIDA' : 'PONTO!', x: W / 2, y: who === 'me' ? this.me.y - 80 : this.ai.y + 90, t: 1.1, max: 1.1, col: who === 'me' ? this.col : this.aiCol });
    this.serve(who);   // who lost the point serves the next one
  }

  ring(x, y, r) { this.rings.push({ x, y, r, t: 0 }); }
  updateFx(dt) {
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const q of this.rings) q.t += dt / 0.45;
    this.rings = this.rings.filter((q) => q.t < 1);
    for (const f of this.floats) { f.t -= dt; f.y -= 40 * dt; }
    this.floats = this.floats.filter((f) => f.t > 0);
    for (const q of this.bricks) q.flash = Math.max(0, q.flash - dt * 4);
  }

  render(c, now) {
    const col = this.col, ai = this.aiCol, H = this.H, top = this.top, bottom = this.bottom;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save();
    if (this.shake > 0) c.translate((Math.random() - 0.5) * 14 * this.shake, (Math.random() - 0.5) * 14 * this.shake);
    // the field: the walls, a line in the middle and each side's end in its color
    c.save(); c.globalAlpha = 0.06; c.strokeStyle = '#ffffff'; c.lineWidth = 1;
    c.beginPath();
    for (let x = LEFT + 46; x < RIGHT; x += 46) { c.moveTo(x, top); c.lineTo(x, bottom); }
    for (let y = top + 46; y < bottom; y += 46) { c.moveTo(LEFT, y); c.lineTo(RIGHT, y); }
    c.stroke(); c.restore();
    c.beginPath(); c.moveTo(LEFT, top - 10); c.lineTo(LEFT, bottom + 10); c.moveTo(RIGHT, top - 10); c.lineTo(RIGHT, bottom + 10);
    neonStroke(c, '#ffffff', '#ffffff', 2.4, LEFT, top, RIGHT, bottom, 0.5);
    c.save(); c.setLineDash([20, 12]);
    c.lineDashOffset = -this.t * 40;
    c.beginPath(); c.moveTo(LEFT, bottom + 10); c.lineTo(RIGHT, bottom + 10); neonStroke(c, col, col, 3, LEFT, 0, RIGHT, 0, 0.9);
    c.lineDashOffset = this.t * 40;
    c.beginPath(); c.moveTo(LEFT, top - 10); c.lineTo(RIGHT, top - 10); neonStroke(c, ai, ai, 3, LEFT, 0, RIGHT, 0, 0.9);
    c.restore();
    c.beginPath(); c.moveTo(LEFT, this.midY); c.lineTo(RIGHT, this.midY);
    c.save(); c.setLineDash([6, 14]); c.strokeStyle = rgba('#ffffff', 0.12); c.lineWidth = 2; c.stroke(); c.restore();
    // the bricks
    for (const q of this.bricks) {
      if (q.hp <= 0) continue;
      const k = q.hp / q.max;
      c.beginPath(); c.rect(q.x, q.y, q.w, q.h);
      c.fillStyle = rgba(mix(col, '#ffffff', 0.35 * k), 0.12 + 0.18 * k + 0.4 * q.flash); c.fill();
      neonStroke(c, col, mix(col, '#ffffff', 0.5 * k), 2, q.x, q.y, q.x + q.w, q.y + q.h, 0.5 + 0.5 * k + q.flash);
    }
    // the platforms: the AI's is flipped, facing down
    drawPlatform(c, this.plat, this.me.x, this.me.y, HW, this.t, col, this.me.hit);
    c.save(); c.translate(this.ai.x, this.ai.y); c.scale(1, -1);
    drawPlatform(c, this.aiPlat, 0, 0, HW, this.t, ai, this.ai.hit);
    c.restore();
    // the disc, in the color of whoever touched it last
    const b = this.ball;
    if (b && !b.gone) {
      const bc = b.own === 'me' ? col : ai;
      if (b.trail.length > 3) {
        c.beginPath(); c.moveTo(b.trail[0], b.trail[1]);
        for (let i = 2; i < b.trail.length; i += 2) c.lineTo(b.trail[i], b.trail[i + 1]);
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.strokeStyle = rgba(bc, 0.35); c.lineWidth = R; c.stroke();
      }
      c.beginPath(); c.arc(b.x, b.y, R, 0, TAU);
      c.fillStyle = '#ffffff'; c.shadowColor = bc; c.shadowBlur = 22 * view.blur; c.fill(); c.shadowBlur = 0;
      c.beginPath(); c.arc(b.x, b.y, R + 4, 0, TAU); c.strokeStyle = bc; c.lineWidth = 2; c.stroke();
      if (b.held === 'me' && this.state === 'play') glowText(c, 'SOLTE PARA LANÇAR', W / 2, this.me.y + 70, 14, rgba('#ffffff', 0.6 + 0.3 * Math.sin(this.t * 4)), col, 'center', 600, 4);
    }
    for (const p of this.parts) { c.globalAlpha = p.life / p.max; c.fillStyle = p.col; c.fillRect(p.x - 2, p.y - 2, 4, 4); }
    c.globalAlpha = 1;
    for (const q of this.rings) {
      c.beginPath(); c.arc(q.x, q.y, 10 + q.r * q.t, 0, TAU);
      c.strokeStyle = rgba('#ffffff', 0.6 * (1 - q.t)); c.lineWidth = 2; c.stroke();
    }
    for (const f of this.floats) { c.globalAlpha = Math.min(1, f.t / 0.4); glowText(c, f.text, f.x, f.y, 24, '#ffffff', f.col, 'center', 800, 4); }
    c.globalAlpha = 1;
    c.restore();
    this.renderHud(c);
  }

  renderHud(c) {
    const col = this.col, ai = this.aiCol, H = this.H, hy = this.top - 62;
    const lives = (x, n, k, dir) => {
      for (let i = 0; i < LIVES; i++) {
        const cx = x + dir * i * 30, on = i < n;
        c.beginPath(); c.moveTo(cx, hy - 12); c.lineTo(cx + 11, hy); c.lineTo(cx, hy + 12); c.lineTo(cx - 11, hy); c.closePath();
        if (on) { c.fillStyle = rgba(k, 0.55); c.fill(); }
        c.strokeStyle = on ? k : rgba(k, 0.3); c.lineWidth = 2; c.stroke();
      }
    };
    glowText(c, 'VOCÊ', 24, hy - 26, 12, rgba(col, 0.9), col, 'left', 700, 3);
    lives(38, this.me.lives, col, 1);
    glowText(c, '1 × 1', W / 2, hy + 4, 30, '#ffffff', col, 'center', 700, 4);
    glowText(c, `${this.me.pts}  ·  ${this.ai.pts}`, W / 2, hy + 32, 12, rgba('#ffffff', 0.6), col, 'center', 500, 3);
    glowText(c, 'IA', W - 102, hy - 26, 12, rgba(ai, 0.9), ai, 'right', 700, 3);
    lives(W - 110, this.ai.lives, ai, -1);
    c.beginPath();
    c.moveTo(W - 56, hy - 14); c.lineTo(W - 56, hy + 14);
    c.moveTo(W - 40, hy - 14); c.lineTo(W - 40, hy + 14);
    neonStroke(c, col, col, 4, W - 56, hy - 14, W - 40, hy + 14, 0.7);
    if (this.banner) {
      const b = this.banner, age = b.max - b.t;
      c.globalAlpha = Math.min(1, age / 0.3, b.t / 0.4);
      neonTitle(c, b.text, W / 2, this.midY - 70, 64, col, col, 10);
      if (b.sub) glowText(c, b.sub, W / 2, this.midY - 22, 18, '#ffffff', col, 'center', 700, 6);
      c.globalAlpha = 1;
    }
    if (this.state !== 'play' && this.endT > 0.6) {
      c.globalAlpha = Math.min(1, (this.endT - 0.6) / 0.5);
      c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, 0, W, H);
      const won = this.state === 'won';
      neonTitle(c, won ? 'VITÓRIA' : 'DERROTA', W / 2, H * 0.34, 72, won ? col : ai, won ? col : ai, 12);
      glowText(c, won ? 'A IA FICOU SEM VIDAS' : 'A IA VENCEU ESTA', W / 2, H * 0.34 + 56, 18, '#ffffff', col, 'center', 600, 4);
      glowText(c, `${this.me.lives} × ${this.ai.lives}`, W / 2, H * 0.47, 40, '#ffffff', col, 'center', 700, 6);
      if (this.record) glowText(c, `VITÓRIAS  ${this.record.w}  ·  DERROTAS  ${this.record.l}`, W / 2, H * 0.47 + 46, 15, rgba(col, 0.9), col, 'center', 500, 4);
      c.globalAlpha = 1;
    }
  }
}
