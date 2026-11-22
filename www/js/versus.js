// ---------- 1x1: face to face against the AI ----------
// The player's platform at the bottom, the AI's (flipped) at the top and a
// band of bricks in the middle. There are two discs, one served by each side,
// so nobody stands waiting. Whoever lets a disc through their end loses a
// life and serves it again; the first to lose all of them loses the match.
// Breaking bricks gives points to whoever touched the disc last, sometimes
// drops a capsule toward them, and the band comes back when it is cleared.
// With `two`, a second person plays the top side on the same phone: each one
// drags on their own half of the screen.
import { TAU, rgba, neonStroke, glowText, neonTitle, view, roundRectPath, drawSprite } from './render.js';
import { drawPlatform, outAngle, SHAPES, paletteColors, samplePal, hitTransform } from './platform.js';
import { brickSprite, discSprite, drawTrail, trimTrail, tierTone, BALL_R, gfx } from './game.js';
import { sfx, music, vibrate } from './audio.js';

const W = 720, LEFT = 14, RIGHT = W - 14;
const LIVES = 7;
const HW = 86;               // half the width of both platforms
const PAD_GAP = 120;         // from each end of the field to its platform
const R = 12;                // the disc
const V0 = 500, V_STEP = 10, V_MAX = 740;   // disc speed: start, gain per hit, cap
// the AI plays like a person: it reacts late, speeds up and brakes (and
// sometimes overshoots), reads the disc better as it comes closer, sometimes
// starts the wrong way off a wall, and misses more when the disc is fast
const AI_VMAX = 700;         // top speed of the AI platform (px/s)
const AI_ACC = 2600;         // how hard it can speed up or brake (px/s²)
const AI_REACT = [0.12, 0.24];   // reaction time when a disc turns toward it (s)
const COLS = 9, ROWS = 4, BW = (W - 64 - 8 * (COLS - 1)) / COLS, BH = 28, GAP = 8;
const CR = 34;               // the rounded corners of the field, like the campaign's
const COUNT = 3;             // the countdown before a new band (s)

// the capsules: they fall from a broken brick toward whoever broke it
const CAP_CHANCE = 0.24, CAP_V = 230, CAP_W = 92, CAP_H = 30;
export const VS_CAPS = {
  // text: what the player reads when they catch it, and when the AI does;
  // two: what the one who caught it reads, with 2 players
  grow: { name: 'MAIOR', text: ['PLATAFORMA MAIOR', 'IA COM PLATAFORMA MAIOR'], two: 'PLATAFORMA MAIOR', t: 8 },
  shrink: { name: 'MENOR', text: ['IA ENCOLHEU', 'SUA PLATAFORMA ENCOLHEU'], two: 'O OUTRO ENCOLHEU', t: 8 },
  fast: { name: 'VELOZ', text: ['SEUS DISCOS MAIS RÁPIDOS', 'DISCOS DA IA MAIS RÁPIDOS'], two: 'SEUS DISCOS MAIS RÁPIDOS', t: 7 },
  shield: { name: 'ESCUDO', text: ['ESCUDO', 'IA COM ESCUDO'], two: 'ESCUDO', t: 0 },
  multi: { name: '+1 DISCO', text: ['MAIS UM DISCO', 'IA LANÇOU MAIS UM DISCO'], two: 'MAIS UM DISCO', t: 0 },
  invert: { name: 'INVERTE', text: ['IA COM CONTROLE INVERTIDO', 'SEU CONTROLE INVERTEU'], two: 'O OUTRO FICOU INVERTIDO', t: 4 },
};
const CAP_KEYS = Object.keys(VS_CAPS);

// the AI gets a color that stands apart from the player's theme
const warm = (c) => ['#ff7a1a', '#ff2d4a', '#ff45c0', '#ffd21f'].includes(c);
const side = () => ({ fx: { grow: 0, shrink: 0, fast: 0, invert: 0 }, shield: false, hw: HW, queue: 0, serveT: 0, pulses: [] });
const TRAIL = 420;   // the campaign's trail, scaled to this smaller disc

export class Versus {
  constructor(H, top, plat, col, two = false) {
    this.H = H; this.top = top; this.plat = plat; this.col = col; this.two = two;
    this.drags = new Map();   // pointer id -> { who, x }
    this.aiCol = warm(col) ? '#00e5ff' : '#ff2d4a';
    this.aiPlat = { shape: 0, pal: 7, emb: 3, disc: 0, trail: 0, dash: false, detail: true };
    this.bottom = H - 62;
    this.me = Object.assign(side(), { x: W / 2, tx: W / 2, y: this.bottom - PAD_GAP, lives: LIVES, pts: 0, hit: 0 });
    this.ai = Object.assign(side(), { x: W / 2, tx: W / 2, vx: 0, y: top + PAD_GAP, lives: LIVES, pts: 0, hit: 0, think: 0, lazy: 0 });
    this.balls = [];
    this.caps = [];
    this.bricks = []; this.parts = []; this.rings = []; this.floats = [];
    this.t = 0;
    this.state = 'play';   // play | won | lost
    this.endT = 0;
    this.shake = 0;
    this.banner = { text: '1 × 1', sub: two ? '2 JOGADORES' : 'CONTRA A IA', t: 1.8, max: 1.8 };
    this.refillT = 0;
    this.fillBand();
    this.serve('me');
    this.serve('ai');
    music.play('boss1');
  }

  get midY() { return (this.top + this.bottom) / 2; }
  side(who) { return who === 'me' ? this.me : this.ai; }

  // a new band; with `slow`, the bricks light up one at a time in a random order
  fillBand(slow = false) {
    const y0 = this.midY - (ROWS * BH + (ROWS - 1) * GAP) / 2;
    this.bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (Math.random() < 0.12) continue;   // a few holes, so each band is different
        const inner = r === 1 || r === 2;
        this.bricks.push({ x: 32 + c * (BW + GAP), y: y0 + r * (BH + GAP), w: BW, h: BH, hp: inner ? 2 : 1, max: inner ? 2 : 1, flash: 0, wait: 0, pop: 1 });
      }
    }
    if (slow) {
      const order = this.bricks.slice().sort(() => Math.random() - 0.5);
      order.forEach((q, i) => { q.wait = 0.15 + i * 0.07; q.pop = 0; });
    }
  }
  // a brick still waiting to light up is not there yet
  live(q) { return q.hp > 0 && q.wait <= 0; }

  // a disc waits on the platform of whoever serves; one at a time each, the
  // next one waits in line
  serve(who) {
    const p = this.side(who);
    if (this.balls.some((b) => b.held === who)) { p.queue++; return; }
    const b = { x: 0, y: 0, vx: 0, vy: 0, s: V0, own: who, held: who, wait: who !== 'ai' ? 0 : this.two ? 6 : 1.1 + Math.random() * 0.6, path: [], spin: 0, react: 0, err: 0, aim: 0, wrong: false };
    this.balls.push(b);
    this.place(b);
  }
  place(b) {
    const p = this.side(b.held);
    b.x = p.x; b.y = b.held === 'me' ? p.y - R - 6 : p.y + R + 6;
    b.path = [{ x: b.x, y: b.y }];
  }
  mark(b) { b.path.push({ x: b.x, y: b.y }); }   // a corner of the trail
  launch(b, k) {
    const who = b.held, th = k * 0.55, d = who === 'me' ? -1 : 1;
    b.vx = Math.sin(th) * b.s; b.vy = d * Math.cos(th) * b.s;
    b.held = null;
    if (who === 'me') this.aiRead(b);
    this.side(who).serveT = 0.7;   // the next disc in line comes a moment later
    sfx.launch();
  }

  // input: each finger moves the platform of the half it touched (the bottom
  // one only, against the AI); the mouse moves the bottom one; letting go serves
  press(x, y = this.H, id = 0) {
    if (this.state !== 'play') return;
    const who = this.two && y < this.midY ? 'ai' : 'me', p = this.side(who);
    this.drags.set(id, { who, x });
    if (!p.fx.invert) p.tx = this.clampX(p, x);
  }
  move(x, y, id, mouse, sens) {
    const d = this.drags.get(id);
    if (mouse && !d) { const me = this.me; me.tx = this.clampX(me, me.fx.invert > 0 ? W - x : x); return; }
    if (!d) return;
    const p = this.side(d.who);
    p.tx = this.clampX(p, p.tx + (x - d.x) * sens * (p.fx.invert > 0 ? -1 : 1));
    d.x = x;
  }
  release(id = 0) {
    const d = this.drags.get(id);
    this.drags.delete(id);
    const b = this.state === 'play' && this.balls.find((q) => q.held === (d ? d.who : 'me'));
    if (b) this.launch(b, (Math.random() - 0.5) * 0.6);
  }
  cancel(id) { this.drags.delete(id); }
  clampX(p, x) { return Math.max(LEFT + p.hw * 0.75, Math.min(RIGHT - p.hw * 0.75, x)); }

  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 3);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    for (const p of [this.me, this.ai]) p.hit = Math.max(0, p.hit - dt * 3);
    this.updateFx(dt);
    if (this.state !== 'play') { this.endT += dt; return; }
    for (const p of [this.me, this.ai]) {
      for (const k in p.fx) p.fx[k] = Math.max(0, p.fx[k] - dt);
      const want = HW * (p.fx.grow ? 1.35 : 1) * (p.fx.shrink ? 0.68 : 1);
      p.hw += (want - p.hw) * Math.min(1, dt * 8);
      p.serveT = Math.max(0, p.serveT - dt);
    }
    const me = this.me;
    me.x += (me.tx - me.x) * Math.min(1, dt * 22);
    if (this.two) this.ai.x += (this.ai.tx - this.ai.x) * Math.min(1, dt * 22);   // the second player
    else this.updateAi(dt);
    for (const who of ['me', 'ai']) {   // the next disc in line
      const p = this.side(who);
      if (p.queue > 0 && p.serveT <= 0 && !this.balls.some((b) => b.held === who)) { p.queue--; this.serve(who); }
    }
    for (const b of this.balls.slice()) {
      if (b.dead) continue;
      b.spin += dt * 9;
      if (b.held) {
        this.place(b);
        if (b.held === 'ai') { b.wait -= dt; if (b.wait <= 0) this.launch(b, (Math.random() - 0.5) * 1.2); }
      } else {
        const n = Math.max(1, Math.ceil((b.s * dt) / 8));
        for (let i = 0; i < n && !b.dead && this.state === 'play'; i++) this.step(b, dt / n);
        trimTrail(b.path, b.x, b.y, TRAIL);
      }
      if (this.state !== 'play') break;
    }
    this.balls = this.balls.filter((b) => !b.dead);
    this.updateCaps(dt);
    // the countdown to the new band, then the bricks light up one by one
    if (this.refillT > 0) {
      const n0 = Math.ceil(this.refillT);
      this.refillT -= dt;
      if (this.refillT <= 0) { this.fillBand(true); this.banner = { text: 'NOVA LEVA', t: 1.2, max: 1.2 }; sfx.pulse(); }
      else if (Math.ceil(this.refillT) !== n0) sfx.click();
    }
    let born = 0;
    for (const q of this.bricks) {
      if (q.wait > 0) { q.wait -= dt; if (q.wait <= 0) { q.flash = 1; born++; } }
      else q.pop = Math.min(1, q.pop + dt * 6);
    }
    if (born) sfx.brick(1);
    this.borderGlow = Math.max(0, (this.borderGlow || 0) - dt * 2.5);
  }

  // a disc turned toward the AI: it will take a moment to react, read it a
  // little off, and aim for a tip
  // (off the bricks it was already watching the disc: quicker and closer)
  aiRead(b, rebound = false) {
    const hard = (b.s - V0) / (V_MAX - V0), steep = Math.abs(b.vx) / Math.max(1, Math.hypot(b.vx, b.vy));
    b.react = this.t + (rebound ? 0.04 + Math.random() * 0.08 : AI_REACT[0] + Math.random() * (AI_REACT[1] - AI_REACT[0]) + (Math.random() < 0.08 + 0.12 * hard ? 0.22 : 0));
    b.err = (Math.random() - 0.5) * (55 + 100 * hard + 45 * steep) * (rebound ? 0.6 : 1);
    b.aim = (Math.random() - 0.5) * 1.6;
    b.wrong = this.walls(b, this.ai.y + R) > 0 && Math.random() < 0.25;
  }

  // The AI: it watches the disc that will reach it first. After a reaction
  // time it guesses where that disc will cross its line, off at first and
  // better as it comes closer, and aims for one of the tips to angle it back.
  // With time to spare it goes for the capsules falling toward it. It looks
  // again at uneven intervals, like eyes.
  updateAi(dt) {
    const ai = this.ai;
    ai.think -= dt;
    let inc = null, eta = Infinity;
    for (const b of this.balls) {
      if (b.held || b.dead || b.vy >= 0) continue;
      const e = (b.y - ai.y) / -b.vy;
      if (e < eta) { eta = e; inc = b; }
    }
    let cap = null, capEta = Infinity;
    for (const q of this.caps) {
      if (q.to !== 'ai') continue;
      const e = (q.y - ai.y) / CAP_V;
      if (e < capEta) { capEta = e; cap = q; }
    }
    const goCap = cap && (!inc || eta > capEta + 0.9);
    let vmax = AI_VMAX;
    if (ai.think <= 0) {
      ai.think = 0.08 + Math.random() * 0.14;
      const held = this.balls.find((b) => b.held === 'ai');
      if (goCap) ai.tx = cap.x;
      else if (inc && this.t >= inc.react) {
        const left = (inc.y - ai.y) / (this.me.y - ai.y);   // 1 just off the player, 0 at the AI
        if (inc.wrong && left > 0.45) {   // fooled by the wall: it goes where the disc points
          ai.tx = Math.max(LEFT + ai.hw, Math.min(RIGHT - ai.hw, inc.x + (inc.vx * (ai.y + R - inc.y)) / inc.vy));
        } else {
          inc.wrong = false;
          ai.tx = this.predict(inc, ai.y + R) + inc.err * (0.4 + 0.6 * Math.max(0, left)) - inc.aim * ai.hw * 0.7;
        }
      } else if (!inc && held) ai.tx = W / 2 + Math.sin(this.t * 1.3) * 120 + Math.sin(this.t * 3.1) * 30;
      else if (!inc) {   // nothing coming: it follows its own disc a little, or goes back toward the middle
        const own = this.balls.find((b) => !b.held && !b.dead && b.own === 'ai' && b.vy > 0);
        ai.tx = own ? W / 2 + (own.x - W / 2) * 0.6 : W / 2 + ai.lazy;
      }
      if (ai.fx.invert > 0) ai.tx = W - ai.tx;   // the controls are inverted: it goes the wrong way
    }
    if (!inc && !goCap) vmax *= 0.75;   // no hurry while nothing comes
    // speed up and brake toward the target (a spring with a little overshoot)
    const tx = ai.tx + Math.sin(this.t * 7.3) * 4;
    const want = Math.max(-vmax, Math.min(vmax, (tx - ai.x) * 7.5));
    const dv = want - ai.vx, a = AI_ACC * dt;
    ai.vx += Math.max(-a, Math.min(a, dv));
    ai.x += ai.vx * dt;
    const lo = LEFT + ai.hw * 0.75, hi = RIGHT - ai.hw * 0.75;
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
    const x = b.x + (b.vx * (y - b.y)) / b.vy;
    const lo = LEFT + R, hi = RIGHT - R, span = hi - lo;
    let u = (x - lo) % (2 * span); if (u < 0) u += 2 * span;
    return lo + (u > span ? 2 * span - u : u);
  }

  step(b, dt) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < LEFT + R) { b.x = LEFT + R; b.vx = Math.abs(b.vx); this.mark(b); sfx.wall(); this.borderGlow = 1; }
    if (b.x > RIGHT - R) { b.x = RIGHT - R; b.vx = -Math.abs(b.vx); this.mark(b); sfx.wall(); this.borderGlow = 1; }
    // the platforms
    const me = this.me, ai = this.ai;
    if (b.vy > 0 && b.y + R >= me.y && b.y + R <= me.y + 22 && Math.abs(b.x - me.x) < me.hw + R) this.bounce(b, me, 'me');
    else if (b.vy < 0 && b.y - R <= ai.y && b.y - R >= ai.y - 22 && Math.abs(b.x - ai.x) < ai.hw + R) this.bounce(b, ai, 'ai');
    // the bricks
    for (const q of this.bricks) {
      if (!this.live(q)) continue;
      const cx = Math.max(q.x, Math.min(b.x, q.x + q.w)), cy = Math.max(q.y, Math.min(b.y, q.y + q.h));
      const dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy > R * R) continue;
      const ox = Math.min(b.x + R - q.x, q.x + q.w - (b.x - R)), oy = Math.min(b.y + R - q.y, q.y + q.h - (b.y - R));
      const up = b.vy < 0;
      if (ox < oy) { b.vx = b.x < q.x + q.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
      else { b.vy = b.y < q.y + q.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
      this.mark(b);
      if (up !== b.vy < 0) this.slow(b);   // turned back: VELOZ only pushes it toward the other side
      if (!up && b.vy < 0) this.aiRead(b, b.own === 'ai');   // bounced back toward the AI
      this.hitBrick(q, b.own);
      break;
    }
    // the shields, then past an end: a life lost
    if (b.vy > 0 && b.y > this.bottom - 4 && me.shield) this.block(b, 'me');
    else if (b.vy < 0 && b.y < this.top + 4 && ai.shield) this.block(b, 'ai');
    else if (b.y > this.bottom + 30) this.score('me', b);
    else if (b.y < this.top - 30) this.score('ai', b);
  }

  // a disc sped up by VELOZ goes back to its normal speed
  slow(b) {
    if (!b.boost) return;
    b.boost = false; b.vx /= 1.3; b.vy /= 1.3;
  }

  // a shield sends the disc back once
  block(b, who) {
    this.side(who).shield = false;
    b.vy = -b.vy;
    this.slow(b);
    b.y = who === 'me' ? this.bottom - 4 : this.top + 4;
    this.mark(b);
    if (who === 'me') this.aiRead(b);
    this.ring(b.x, b.y, 90, this.tint(who));
    sfx.wall();
  }

  bounce(b, p, who) {
    const k = Math.max(-1, Math.min(1, (b.x - p.x) / p.hw)), si = who === 'me' ? this.plat.shape : this.aiPlat.shape;
    b.s = Math.min(V_MAX, b.s + V_STEP);
    b.boost = p.fx.fast > 0;   // VELOZ: the discs this side hits go faster toward the other side
    const s = b.s * (b.boost ? 1.3 : 1);
    const th = outAngle(si, k, p.hw), d = who === 'me' ? -1 : 1;
    b.vx = Math.sin(th) * s; b.vy = d * Math.cos(th) * s;
    b.y = who === 'me' ? p.y - R : p.y + R;
    b.own = who;
    this.mark(b);
    p.hit = 1;
    // the campaign's hit: the platform's line lights up around the contact, and sparks
    p.pulses.push({ u: b.x - p.x, t: 0 });
    const pal = this.pal(who);
    this.burst(b.x, p.y, 8, 0.6, [samplePal(pal, this.t * 0.22), samplePal(pal, this.t * 0.22 + 0.5)]);
    sfx.paddle();
    if (who === 'me') { this.aiRead(b); vibrate(10); }
    else this.ai.lazy = (Math.random() - 0.5) * 80;
  }

  hitBrick(q, own) {
    const tone = tierTone(this.col, q.hp), cx = q.x + q.w / 2, cy = q.y + q.h / 2;
    q.hp--; q.flash = 1;
    const who = this.side(own);
    if (q.hp > 0) { this.burst(cx, cy, 6, 0.6, [tone]); sfx.brick(1); return; }
    who.pts += 10;
    sfx.brk(2);
    // the campaign's break: the brick comes apart in squares, and sparks
    const n = Math.round(22 * gfx.fx);
    for (let i = 0; i < n; i++) {
      const x = q.x + Math.random() * q.w, y = q.y + Math.random() * q.h;
      const ang = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5), sp = 60 + Math.random() * 260, life = 0.35 + Math.random() * 0.45;
      this.parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, max: life, col: i % 3 ? tone : '#ffffff', sq: true });
    }
    this.burst(cx, cy, 8, 1, [tone]);
    if (Math.random() < CAP_CHANCE && this.caps.length < 2) this.drop(q.x + q.w / 2, q.y + q.h / 2, own);
    if (this.bricks.every((z) => z.hp <= 0) && this.refillT <= 0) this.refillT = COUNT;
  }

  // ---------- capsules ----------
  drop(x, y, to) {
    const list = CAP_KEYS.filter((k) => k !== 'multi' || this.balls.length < 3);
    this.caps.push({ x, y, to, kind: list[Math.floor(Math.random() * list.length)], t: 0 });
  }
  updateCaps(dt) {
    for (const q of this.caps) {
      q.t += dt;
      q.y += (q.to === 'me' ? 1 : -1) * CAP_V * dt;
      const p = this.side(q.to);
      if (Math.abs(q.y - p.y) < CAP_H / 2 + 8 && Math.abs(q.x - p.x) < p.hw + CAP_W / 2 - 10) { q.done = true; this.collect(q.to, q.kind); }
      else if (q.y > this.bottom + 40 || q.y < this.top - 40) q.done = true;
    }
    this.caps = this.caps.filter((q) => !q.done);
  }
  collect(who, kind) {
    const p = this.side(who), o = this.side(who === 'me' ? 'ai' : 'me'), def = VS_CAPS[kind];
    if (kind === 'grow') { p.fx.grow = def.t; p.fx.shrink = 0; }
    else if (kind === 'shrink') { o.fx.shrink = def.t; o.fx.grow = 0; }
    else if (kind === 'fast') p.fx.fast = def.t;
    else if (kind === 'shield') p.shield = true;
    else if (kind === 'invert') o.fx.invert = def.t;
    else if (kind === 'multi') {   // a new disc leaves the platform right away
      const b = { x: p.x, y: who === 'me' ? p.y - R - 6 : p.y + R + 6, vx: 0, vy: 0, s: V0, own: who, held: who, wait: 0, path: [], spin: 0, react: 0, err: 0, aim: 0, wrong: false };
      this.balls.push(b);
      this.mark(b);
      this.launch(b, (Math.random() - 0.5) * 1.2);
    }
    this.say(this.two ? def.two : def.text[who === 'me' ? 0 : 1], who, 1.3, 20);
    this.ring(p.x, p.y, 70, this.tint(who));
    sfx.power(who === 'me');
    if (who === 'me') vibrate(20);
  }

  // a disc went past `who`'s end
  score(who, b) {
    const p = this.side(who);
    b.dead = true;
    p.lives--;
    this.shake = 0.6;
    this.ring(b.x, who === 'me' ? this.bottom : this.top, 120, this.tint(who));
    this.burst(b.x, who === 'me' ? this.bottom : this.top, 16, 1, [this.tint(b.own), '#ffffff']);
    sfx.lose(); if (who === 'me') vibrate(60);
    if (p.lives <= 0) {
      this.state = who === 'me' ? 'lost' : 'won';
      for (const q of this.balls) q.dead = true;
      this.caps = [];
      if (this.state === 'won') sfx.clear(); else sfx.over();
      if (this.onEnd) this.onEnd(this.state === 'won');
      return;
    }
    this.say(who === 'me' || this.two ? '-1 VIDA' : 'PONTO!', who, 1.1, 24);
    this.serve(who);   // who lost the point serves that disc again
  }

  // a text by a side's platform; the top player's is upside down with 2 players
  say(text, who, t, fs) {
    const p = this.side(who), stack = this.floats.filter((f) => f.side === who).length;   // one under the other
    const y = who === 'me' ? p.y - 80 - stack * 34 : p.y + 90 + stack * 34;
    this.floats.push({ text, x: W / 2, y, t, max: t, col: who === 'me' ? this.col : this.aiCol, side: who, fs, flip: this.two && who === 'ai' });
  }
  ring(x, y, r, col = '#ffffff') { this.rings.push({ x, y, r, col, t: 0 }); }
  tint(who) { return who === 'me' ? this.col : this.aiCol; }
  pal(who) { return who === 'me' ? paletteColors(this.plat.pal, this.col) : [this.aiCol, '#ffffff', this.aiCol]; }
  // sparks, as in the campaign
  burst(x, y, n, power = 1, cols) {
    n = Math.round(n * gfx.fx);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * TAU, sp = (120 + Math.random() * 360) * power, life = 0.3 + Math.random() * 0.4;
      this.parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, max: life, col: cols[i % cols.length] });
    }
    if (this.parts.length > 500) this.parts.splice(0, this.parts.length - 500);
  }
  updateFx(dt) {
    const fr = Math.pow(0.04, dt);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= fr; p.vy *= fr; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const q of this.rings) q.t += dt / 0.45;
    this.rings = this.rings.filter((q) => q.t < 1);
    for (const p of [this.me, this.ai]) { for (const q of p.pulses) q.t += dt; p.pulses = p.pulses.filter((q) => q.t < 0.5); }
    for (const f of this.floats) { f.t -= dt; f.y += (f.flip ? 40 : -40) * dt; }
    this.floats = this.floats.filter((f) => f.t > 0);
    for (const q of this.bricks) q.flash = Math.max(0, q.flash - dt * 4);
  }

  // the campaign's bounce light: a stretch of the platform's own line around
  // the contact point, growing as it fades (dir -1: the top platform, facing down)
  renderPulses(c, p, si, dir) {
    if (!p.pulses.length) return;
    const pal = this.pal(p === this.me ? 'me' : 'ai'), sh = SHAPES[si];
    c.save();
    c.translate(p.x, p.y); c.scale(1, dir);
    hitTransform(c, si, p.hit || 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const q of p.pulses) {
      const k = q.t / 0.5, u = Math.max(-p.hw, Math.min(p.hw, q.u));
      const colA = samplePal(pal, this.t * 0.22 + ((u / p.hw + 1) / 2) * 0.8), half = 34 + 44 * k;
      c.beginPath();
      for (let i = -8; i <= 8; i++) {
        const uu = Math.max(-p.hw, Math.min(p.hw, u + (i / 8) * half)), y = sh.y(uu, p.hw);
        if (i === -8) c.moveTo(uu, y); else c.lineTo(uu, y);
      }
      for (const [w, al] of [[32, 0.1], [20, 0.18], [11, 0.3]]) { c.strokeStyle = rgba(colA, al * (1 - k)); c.lineWidth = w; c.stroke(); }
      c.globalAlpha = 1 - k;
      c.strokeStyle = '#ffffff'; c.lineWidth = 6;
      c.shadowColor = colA; c.shadowBlur = 24 * view.blur;
      c.stroke(); c.shadowBlur = 0; c.globalAlpha = 1;
    }
    c.restore();
  }

  render(c, now) {
    const col = this.col, ai = this.aiCol, H = this.H, top = this.top, bottom = this.bottom;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.save();
    if (this.shake > 0) c.translate((Math.random() - 0.5) * 14 * this.shake, (Math.random() - 0.5) * 14 * this.shake);
    // the field, like the campaign's: the grid and the rounded neon frame,
    // each half in its side's color, and the open ends dashed
    c.drawImage(this.fieldLayer().img, 0, 0, W, H);
    this.renderBorder(c);
    // the shields: a solid bar across the end, pulsing
    for (const [p, y, k] of [[this.me, bottom - 4, col], [this.ai, top + 4, ai]]) {
      if (!p.shield) continue;
      c.beginPath(); c.moveTo(LEFT + 4, y); c.lineTo(RIGHT - 4, y);
      neonStroke(c, k, '#ffffff', 5, LEFT, y, RIGHT, y, 0.9 + 0.3 * Math.sin(this.t * 6));
    }
    c.beginPath(); c.moveTo(LEFT, this.midY); c.lineTo(RIGHT, this.midY);
    c.save(); c.setLineDash([6, 14]); c.strokeStyle = rgba('#ffffff', 0.12); c.lineWidth = 2; c.stroke(); c.restore();
    // the bricks: the campaign's, fading with each hit; new ones pop in
    for (const q of this.bricks) {
      if (!this.live(q)) continue;
      const e = q.pop < 1 ? 1 + 1.7 * Math.pow(q.pop - 1, 3) + 0.7 * Math.pow(q.pop - 1, 2) : 1;
      c.globalAlpha = (0.45 + 0.55 * q.hp / q.max) * Math.min(1, q.pop * 2);
      if (e !== 1) { c.save(); c.translate(q.x + q.w / 2, q.y + q.h / 2); c.scale(e, e); c.translate(-q.x - q.w / 2, -q.y - q.h / 2); }
      drawSprite(c, brickSprite('n', q.hp, col), q.x, q.y);
      if (q.flash > 0) { roundRectPath(c, q.x + 1.5, q.y + 1.5, q.w - 3, q.h - 3, 5); c.fillStyle = rgba('#ffffff', 0.5 * q.flash); c.fill(); }
      if (e !== 1) c.restore();
      c.globalAlpha = 1;
    }
    // the countdown to the new band
    if (this.refillT > 0 && this.state === 'play') {
      const n = Math.ceil(this.refillT), f = this.refillT - Math.floor(this.refillT);
      c.globalAlpha = 0.35 + 0.65 * f;
      neonTitle(c, String(n), W / 2, this.midY + 30, 90 + 40 * (1 - f), col, col, 6);
      glowText(c, 'NOVA LEVA EM', W / 2, this.midY - 60, 16, rgba('#ffffff', 0.8), col, 'center', 700, 6);
      c.globalAlpha = 1;
    }
    // the capsules, in the color of whoever they fall to
    for (const q of this.caps) {
      const k = q.to === 'me' ? col : ai, x = q.x - CAP_W / 2, y = q.y - CAP_H / 2, r = CAP_H / 2;
      c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + CAP_W - r, y); c.arc(x + CAP_W - r, q.y, r, -Math.PI / 2, Math.PI / 2); c.lineTo(x + r, y + CAP_H); c.arc(x + r, q.y, r, Math.PI / 2, Math.PI * 1.5); c.closePath();
      c.fillStyle = rgba(k, 0.25); c.fill();
      neonStroke(c, k, '#ffffff', 2.4, x, y, x + CAP_W, y + CAP_H, 0.9 + 0.3 * Math.sin(q.t * 8));
      glowText(c, VS_CAPS[q.kind].name, q.x, q.y + 1, 12, '#ffffff', k, 'center', 800, 2);
    }
    // the platforms: the AI's is flipped, facing down
    drawPlatform(c, this.plat, this.me.x, this.me.y, this.me.hw, this.t, col, this.me.hit);
    c.save(); c.translate(this.ai.x, this.ai.y); c.scale(1, -1);
    drawPlatform(c, this.aiPlat, 0, 0, this.ai.hw, this.t, ai, this.ai.hit);
    c.restore();
    // the discs: the disc and trail picked in BREAKERS, each in the color of
    // whoever touched it last
    const ts = this.plat.trail || 0;
    c.globalCompositeOperation = 'lighter';
    for (const b of this.balls) {
      if (b.dead || b.held) continue;
      drawTrail(c, b.path, b.x, b.y, this.tint(b.own), TRAIL, R, ts, ts === 3 ? this.pal(b.own) : null, this.t);
    }
    c.globalCompositeOperation = 'source-over';
    this.renderPulses(c, this.me, this.plat.shape, 1);
    this.renderPulses(c, this.ai, this.aiPlat.shape, -1);
    for (const b of this.balls) {
      if (b.dead) continue;
      c.save(); c.translate(b.x, b.y); c.rotate(b.spin);
      drawSprite(c, discSprite(this.tint(b.own), BALL_R, this.plat.disc || 0), -R, -R, R / BALL_R);
      c.restore();
    }
    const blink = rgba('#ffffff', 0.6 + 0.3 * Math.sin(this.t * 4));
    if (this.state === 'play' && this.balls.some((b) => b.held === 'me')) glowText(c, 'SOLTE PARA LANÇAR', W / 2, this.me.y + 70, 14, blink, col, 'center', 600, 4);
    if (this.two && this.state === 'play' && this.balls.some((b) => b.held === 'ai')) this.upright(c, W / 2, this.ai.y - 66, true, () => glowText(c, 'SOLTE PARA LANÇAR', 0, 0, 14, blink, ai, 'center', 600, 4));
    // the effects on each side, by its platform
    for (const [p, y, k] of [[this.me, this.me.y + 98, col], [this.ai, this.ai.y - 90, ai]]) {
      const on = ['grow', 'shrink', 'fast', 'invert'].filter((f) => p.fx[f] > 0);
      if (!on.length) continue;
      const txt = on.map((f) => `${VS_CAPS[f].name} ${Math.ceil(p.fx[f])}`).join('   ');
      this.upright(c, p.x, y, this.two && p === this.ai, () => glowText(c, txt, 0, 0, 11, rgba('#ffffff', p.fx.invert > 0 ? 0.6 + 0.4 * Math.sin(this.t * 10) : 0.75), k, 'center', 700, 3));
    }
    // sparks and rings, as in the campaign
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (const p of this.parts) {
      const a = p.life / p.max;
      if (p.sq) { const s = 3 + 3 * a; c.fillStyle = rgba(p.col, a); c.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
      else { c.strokeStyle = rgba(p.col, a); c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); }
    }
    for (const q of this.rings) {
      c.beginPath(); c.arc(q.x, q.y, q.r * q.t + 4, 0, TAU);
      c.strokeStyle = rgba(q.col, 0.9 * (1 - q.t)); c.lineWidth = 3 * (1 - q.t) + 1; c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    for (const f of this.floats) {
      c.globalAlpha = Math.min(1, f.t / 0.4);
      this.upright(c, f.x, f.y, f.flip, () => glowText(c, f.text, 0, 0, f.fs || 24, '#ffffff', f.col, 'center', 800, 4));
    }
    c.globalAlpha = 1;
    c.restore();
    this.renderHud(c);
  }

  // draw at (x, y), upside down when `flip` (for the player on top)
  upright(c, x, y, flip, draw) {
    c.save(); c.translate(x, y); if (flip) c.rotate(Math.PI);
    draw(); c.restore();
  }

  // the grid and the steady frame, baked once
  fieldLayer() {
    const key = this.col + this.H + view.res + view.glow;
    if (this.grid && this.grid.key === key) return this.grid;
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * view.res); cv.height = Math.round(this.H * view.res);
    const c = cv.getContext('2d');
    c.setTransform(view.res, 0, 0, view.res, 0, 0);
    const top = this.top, bottom = this.bottom, mid = this.midY;
    c.save();
    roundRectPath(c, LEFT, top, RIGHT - LEFT, bottom - top, CR); c.clip();
    const step = 48;
    c.lineWidth = 1;
    for (let x = (W / 2) % step; x < W; x += step) {
      for (const [y0, y1, k] of [[top, mid, this.aiCol], [mid, bottom, this.col]]) {
        c.strokeStyle = rgba(k, Math.round((x - W / 2) / step) % 4 === 0 ? 0.11 : 0.05);
        c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
      }
    }
    for (let i = 1; mid + i * step < bottom || mid - i * step > top; i++) {
      for (const [y, k] of [[mid + i * step, this.col], [mid - i * step, this.aiCol]]) {
        if (y <= top || y >= bottom) continue;
        c.strokeStyle = rgba(k, i % 4 === 0 ? 0.11 : 0.05);
        c.beginPath(); c.moveTo(LEFT, y); c.lineTo(RIGHT, y); c.stroke();
      }
    }
    // each end glows a little in its side's color
    for (const [y0, y1, k] of [[bottom - 160, bottom, this.col], [top + 160, top, this.aiCol]]) {
      const gr = c.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, rgba(k, 0)); gr.addColorStop(1, rgba(k, 0.08));
      c.fillStyle = gr; c.fillRect(LEFT, Math.min(y0, y1), RIGHT - LEFT, 160);
    }
    c.restore();
    // the walls: a rounded neon frame, each half in its side's color
    for (const [k, down] of [[this.col, true], [this.aiCol, false]]) {
      this.wallPath(c, down);
      neonStroke(c, k, k, 3, 0, top, 0, bottom, 0.8);
    }
    this.grid = { key, img: cv };
    return this.grid;
  }
  // the two walls and corners of one half of the frame (the ends stay open)
  wallPath(c, down) {
    const top = this.top, bottom = this.bottom, mid = this.midY;
    c.beginPath();
    if (down) {
      c.moveTo(LEFT, mid); c.lineTo(LEFT, bottom - CR); c.arcTo(LEFT, bottom, LEFT + CR, bottom, CR);
      c.moveTo(RIGHT, mid); c.lineTo(RIGHT, bottom - CR); c.arcTo(RIGHT, bottom, RIGHT - CR, bottom, CR);
    } else {
      c.moveTo(LEFT, mid); c.lineTo(LEFT, top + CR); c.arcTo(LEFT, top, LEFT + CR, top, CR);
      c.moveTo(RIGHT, mid); c.lineTo(RIGHT, top + CR); c.arcTo(RIGHT, top, RIGHT - CR, top, CR);
    }
  }
  // per frame: light running along the walls, a flash when a disc hits them,
  // and the dashed open ends where a disc gets through
  renderBorder(c) {
    const top = this.top, bottom = this.bottom, g = this.borderGlow || 0;
    c.save();
    c.lineCap = 'round';
    for (const [k, down] of [[this.col, true], [this.aiCol, false]]) {
      c.setLineDash([120, 380]); c.lineDashOffset = -((this.t * 300) % 500);
      this.wallPath(c, down);
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.shadowColor = k; c.shadowBlur = 18 * view.blur; c.stroke();
      if (g > 0.02) {
        c.setLineDash([]); c.shadowBlur = 0;
        c.globalCompositeOperation = 'lighter';
        this.wallPath(c, down);
        c.strokeStyle = rgba(k, Math.min(1, g * 0.8)); c.lineWidth = 2 + g * 3; c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
    }
    c.shadowBlur = 0;
    c.setLineDash([20, 12]);
    for (const [y, k, d] of [[bottom, this.col, -1], [top, this.aiCol, 1]]) {
      c.lineDashOffset = d * this.t * 40;
      c.beginPath(); c.moveTo(LEFT + CR, y); c.lineTo(RIGHT - CR, y);
      neonStroke(c, k, k, 3, LEFT, 0, RIGHT, 0, 0.9);
    }
    c.restore();
  }

  renderHud(c) {
    const col = this.col, ai = this.aiCol, H = this.H, hy = this.top - 62;
    const lives = (x, n, k, dir) => {
      for (let i = 0; i < LIVES; i++) {
        const cx = x + dir * i * 24, on = i < n;
        c.beginPath(); c.moveTo(cx, hy - 10); c.lineTo(cx + 9, hy); c.lineTo(cx, hy + 10); c.lineTo(cx - 9, hy); c.closePath();
        if (on) { c.fillStyle = rgba(k, 0.55); c.fill(); }
        c.strokeStyle = on ? k : rgba(k, 0.3); c.lineWidth = 2; c.stroke();
      }
    };
    glowText(c, this.two ? 'J1' : 'VOCÊ', 24, hy - 26, 12, rgba(col, 0.9), col, 'left', 700, 3);
    lives(34, this.me.lives, col, 1);
    glowText(c, '1 × 1', W / 2, hy + 4, 30, '#ffffff', col, 'center', 700, 4);
    glowText(c, `${this.me.pts}  ·  ${this.ai.pts}`, W / 2, hy + 32, 12, rgba('#ffffff', 0.6), col, 'center', 500, 3);
    glowText(c, this.two ? 'J2' : 'IA', W - 102, hy - 26, 12, rgba(ai, 0.9), ai, 'right', 700, 3);
    lives(W - 106, this.ai.lives, ai, -1);
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
      const won = this.state === 'won', wk = won ? col : ai;
      if (this.two) {   // who won, and the same for the one on top, upside down
        neonTitle(c, won ? 'J1 VENCEU' : 'J2 VENCEU', W / 2, H * 0.34, 64, wk, wk, 10);
        glowText(c, 'O OUTRO FICOU SEM VIDAS', W / 2, H * 0.34 + 56, 18, '#ffffff', wk, 'center', 600, 4);
        this.upright(c, W / 2, this.top + 150, true, () => neonTitle(c, won ? 'J1 VENCEU' : 'J2 VENCEU', 0, 0, 44, wk, wk, 8));
      } else {
        neonTitle(c, won ? 'VITÓRIA' : 'DERROTA', W / 2, H * 0.34, 72, wk, wk, 12);
        glowText(c, won ? 'A IA FICOU SEM VIDAS' : 'A IA VENCEU ESTA', W / 2, H * 0.34 + 56, 18, '#ffffff', col, 'center', 600, 4);
      }
      glowText(c, `${this.me.lives} × ${this.ai.lives}`, W / 2, H * 0.47, 40, '#ffffff', col, 'center', 700, 6);
      if (this.record) glowText(c, `VITÓRIAS  ${this.record.w}  ·  DERROTAS  ${this.record.l}`, W / 2, H * 0.47 + 46, 15, rgba(col, 0.9), col, 'center', 500, 4);
      c.globalAlpha = 1;
    }
  }
}
