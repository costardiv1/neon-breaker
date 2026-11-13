// ---------- little looping animations for the tutorial cards ----------
// drawDemo(c, key, x, y, w, h, t, k) draws a tiny scene inside the box: a
// mechanic, a perk, a capsule or a step of the tutorial, so the card can
// show how it works instead of explaining it in a long text.
import { view, TAU, rgba, roundRectPath, neonStroke, drawSprite, glowText, drawVirus } from './render.js';
import { dropSprite, drawAbilityIcon, drawChipIcon, coinSprite } from './game.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => u * u * (3 - 2 * u);
const seg = (u, a, b) => clamp01((u - a) / (b - a));
const tri = (s) => { const m = ((s % 2) + 2) % 2; return m < 1 ? m : 2 - m; };   // 0 → 1 → 0, period 2
const ALERT = '#ff4a6a';

// a point along a polyline, u from 0 to 1 by length
function along(pts, u) {
  const ls = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); ls.push(l); L += l; }
  let d = clamp01(u) * L;
  for (let i = 0; i < ls.length; i++) {
    if (d <= ls[i] || i === ls.length - 1) { const f = ls[i] ? Math.min(1, d / ls[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
    d -= ls[i];
  }
  return pts[pts.length - 1];
}

// ---- primitives ----
function brick(c, k, x, y, w, h, o = {}) {
  const a = o.a === undefined ? 1 : o.a;
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  const hp = o.hp || 1;
  roundRectPath(c, x, y, w, h, 5);
  c.fillStyle = o.flash ? 'rgba(255,255,255,0.55)' : rgba(k, 0.06 + 0.07 * hp); c.fill();
  if (o.dash) c.setLineDash([5, 5]);
  c.strokeStyle = o.flash ? '#ffffff' : rgba(k, 0.45 + 0.18 * hp); c.lineWidth = 2; c.stroke();
  c.setLineDash([]);
  if (o.wall) {
    c.save(); roundRectPath(c, x, y, w, h, 5); c.clip();
    c.strokeStyle = rgba(k, 0.7); c.lineWidth = 2; c.beginPath();
    for (let q = x - h; q < x + w; q += 10) { c.moveTo(q, y + h); c.lineTo(q + h, y); }
    c.stroke(); c.restore();
  }
  if (o.x) {
    c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath();
    c.moveTo(x + w / 2 - 7, y + h / 2 - 7); c.lineTo(x + w / 2 + 7, y + h / 2 + 7);
    c.moveTo(x + w / 2 + 7, y + h / 2 - 7); c.lineTo(x + w / 2 - 7, y + h / 2 + 7); c.stroke();
  }
  if (o.armor) { c.fillStyle = '#ffffff'; c.fillRect(x + 4, y + h - 5, w - 8, 4); }
  if (o.virus) { c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 1.6; drawVirus(c, x + w / 2, y + h / 2, h * 0.8, o.rot || 0); }
  if (o.leak) {
    const cx = x + w / 2, cy = y + h / 2;
    c.beginPath(); c.moveTo(cx, cy - 8); c.quadraticCurveTo(cx + 7, cy + 2, cx, cy + 7); c.quadraticCurveTo(cx - 7, cy + 2, cx, cy - 8);
    c.fillStyle = '#ffffff'; c.fill();
  }
  if (o.label) glowText(c, o.label, x + w / 2, y + h / 2 + 1, 12, '#ffffff', k, 'center', 700, 1);
  c.restore();
}
function disc(c, k, x, y, r = 8, a = 1) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#ffffff';
  c.shadowColor = k; c.shadowBlur = 12 * view.blur; c.fill(); c.shadowBlur = 0;
  c.beginPath(); c.arc(x, y, r + 4, 0, TAU); c.strokeStyle = rgba(k, 0.8); c.lineWidth = 2; c.stroke();
  c.restore();
}
// a disc moving along a path, with a short trail
function ball(c, k, pts, u, a = 1, du = 0.06) {
  const p = along(pts, u), q = along(pts, Math.max(0, u - du));
  c.save(); c.globalAlpha *= a * 0.45;
  c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(p[0], p[1]); c.strokeStyle = k; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
  c.restore();
  disc(c, k, p[0], p[1], 8, a);
  return p;
}
function pad(c, k, x, y, hw = 44, glow = 0.8) {
  c.beginPath(); c.moveTo(x - hw, y + 5); c.quadraticCurveTo(x, y - 9, x + hw, y + 5);
  neonStroke(c, k, k, 4, x - hw, y, x + hw, y, glow);
}
function finger(c, x, y, a = 1) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a;
  c.beginPath(); c.arc(x, y, 17, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.16)'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; c.stroke();
  c.restore();
}
function ring(c, k, x, y, r, a) {
  if (a <= 0.01 || r <= 0) return;
  c.save(); c.globalAlpha *= a; c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.strokeStyle = k; c.lineWidth = 2.5; c.shadowColor = k; c.shadowBlur = 10 * view.blur; c.stroke(); c.restore();
}
function arrow(c, k, x, y, dx, dy, a = 0.7) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = k; c.lineWidth = 2.5; c.lineCap = 'round'; c.lineJoin = 'round';
  const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy);
  c.moveTo(x + dx - ux * 8 - uy * 6, y + dy - uy * 8 + ux * 6); c.lineTo(x + dx, y + dy); c.lineTo(x + dx - ux * 8 + uy * 6, y + dy - uy * 8 - ux * 6);
  c.stroke(); c.restore();
}
function label(c, k, text, x, y, size = 13, a = 0.9) { glowText(c, text, x, y, size, rgba('#ffffff', a), k, 'center', 700, 2); }
function bolt(c, k, x0, y0, x1, y1, a = 1) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a; c.beginPath(); c.moveTo(x0, y0);
  for (let i = 1; i < 6; i++) { const f = i / 6; c.lineTo(lerp(x0, x1, f) + (i % 2 ? 7 : -7), lerp(y0, y1, f) + (i % 2 ? -4 : 4)); }
  c.lineTo(x1, y1); neonStroke(c, '#ffffff', k, 2.5, x0, y0, x1, y1, 0.9); c.restore();
}
// a row of n bricks centered at cx
function row(n, cx, bw, gap) { const out = []; for (let i = 0; i < n; i++) out.push(cx + (i - (n - 1) / 2) * (bw + gap) - bw / 2); return out; }

// ---- the scenes (local box coordinates, w × h) ----
const SCENES = {
  // tutorial
  welcome(c, k, w, h, t) {
    const u = (t / 3.2) % 1, bw = w * 0.13, bh = h * 0.12, xs = row(5, w / 2, bw, 8);
    xs.forEach((x, i) => brick(c, k, x, h * 0.1, bw, bh, { a: u > 0.12 + i * 0.16 ? 0 : 1 }));
    c.save(); c.setLineDash([6, 8]); c.beginPath(); c.moveTo(10, h * 0.95); c.lineTo(w - 10, h * 0.95);
    c.strokeStyle = rgba(ALERT, 0.5 + 0.3 * Math.sin(t * 6)); c.lineWidth = 2; c.stroke(); c.restore();
    pad(c, k, w / 2, h * 0.8);
    const s = u * 5, x = xs[Math.min(4, Math.floor(s))] + bw / 2;
    disc(c, k, x, lerp(h * 0.72, h * 0.1 + bh + 8, tri(s * 2)));
  },
  move(c, k, w, h, t) {
    const fx = w / 2 + w * 0.3 * Math.sin(t * 1.6);
    pad(c, k, fx, h * 0.62, 50);
    finger(c, fx, h * 0.85);
    arrow(c, k, w * 0.14, h * 0.85, -w * 0.08, 0, 0.5); arrow(c, k, w * 0.86, h * 0.85, w * 0.08, 0, 0.5);
  },
  launch(c, k, w, h, t) {
    const u = (t / 2.4) % 1, up = seg(u, 0.45, 0.95);
    pad(c, k, w / 2, h * 0.75, 50);
    disc(c, k, w / 2 + up * w * 0.12, lerp(h * 0.75 - 16, -10, ease(up)));
    finger(c, w / 2, h * 0.9 + up * 10, u < 0.45 ? 1 : 1 - seg(u, 0.45, 0.6));
    if (u < 0.45) label(c, k, 'SEGURE', w * 0.8, h * 0.9, 12, 0.7); else label(c, k, 'SOLTE', w * 0.8, h * 0.9, 12, 0.9);
  },
  bricks(c, k, w, h, t) {
    const u = (t / 3.2) % 1, bw = w * 0.2, bh = h * 0.16, x = w / 2 - bw / 2, y = h * 0.12;
    const hits = Math.floor(u * 4), hp = 3 - hits;
    const fu = (u * 4) % 1;
    brick(c, k, x, y, bw, bh, { hp: Math.max(1, hp), a: hp > 0 ? 1 : 0, flash: fu < 0.12 && hits > 0 && hp > 0, label: hp > 0 ? String(hp) : '' });
    if (hp <= 0) ring(c, k, w / 2, y + bh / 2, 20 + fu * 40, 1 - fu);
    disc(c, k, w / 2, lerp(y + bh + 10, h * 0.72, tri(fu * 2 + 1)));
    pad(c, k, w / 2, h * 0.8);
    [3, 2, 1].forEach((n, i) => brick(c, k, w * 0.06 + i * 52, h * 0.82, 44, 18, { hp: n, label: String(n), a: 0.75 }));
  },
  angle(c, k, w, h, t) {
    const u = (t / 2.6) % 1, px = w / 2, py = h * 0.8;
    pad(c, k, px, py, 60);
    ball(c, k, [[px + 46, -10], [px + 46, py - 14], [w * 0.98, h * 0.02]], u);
    c.save(); c.globalAlpha = 0.3; ball(c, k, [[px, -10], [px, py - 14], [px, -10]], u); c.restore();
    label(c, k, 'PONTA', px + 92, py + 4, 11, 0.8); label(c, k, 'MEIO', px - 86, py + 4, 11, 0.45);
  },
  caps(c, k, w, h, t) {
    const u = (t / 2.8) % 1, py = h * 0.82;
    const gy = lerp(-20, py - 14, seg(u, 0, 0.45)), by = lerp(-20, py - 14, seg(u, 0.2, 0.7));
    const wide = u > 0.45 ? 66 : 46;
    pad(c, k, w * 0.32, py, wide);
    pad(c, k, w * 0.72, py, u > 0.7 ? 32 : 46);
    if (u < 0.45) drawSprite(c, dropSprite('wide', k), w * 0.32 - 26, gy - 13);
    if (u > 0.2 && u < 0.7) { c.save(); c.globalAlpha = 0.55 + 0.45 * Math.sin(t * 14); drawSprite(c, dropSprite('shrink', k), w * 0.72 - 26, by - 13); c.restore(); }
    label(c, k, 'AJUDA', w * 0.32, h * 0.97, 11, 0.8); label(c, k, 'ATRAPALHA', w * 0.72, h * 0.97, 11, 0.8);
  },

  // mechanics
  slide(c, k, w, h, t) {
    const bw = w * 0.13, bh = h * 0.12;
    for (let r = 0; r < 2; r++) {
      const off = Math.sin(t * 1.8 + r * Math.PI) * w * 0.1;
      row(4, w / 2 + off, bw, 8).forEach((x) => brick(c, k, x, h * (0.12 + r * 0.2), bw, bh, { hp: 2 - r }));
    }
    arrow(c, k, w * 0.12, h * 0.25, -w * 0.07, 0); arrow(c, k, w * 0.88, h * 0.25, w * 0.07, 0);
    pad(c, k, w / 2, h * 0.86);
    disc(c, k, w * 0.54, lerp(h * 0.78, h * 0.5, tri(t * 1.1)));
  },
  gravity(c, k, w, h, t) {
    const wx = w * 0.5, wy = h * 0.48;
    for (let i = 0; i < 3; i++) { const r = 46 - ((t * 22 + i * 15) % 45); ring(c, k, wx, wy, r, (46 - r) / 46 * 0.7); }
    c.beginPath(); c.arc(wx, wy, 7, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    const u = (t / 2.6) % 1, bz = (q) => { const a = 1 - q; return [a * a * w * 0.08 + 2 * a * q * w * 0.72 + q * q * w * 0.12, a * a * h * 1.05 + 2 * a * q * h * 0.5 + q * q * h * -0.05]; };
    const pts = []; for (let i = 0; i <= 20; i++) pts.push(bz(i / 20));
    c.save(); c.setLineDash([3, 7]); c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = rgba(k, 0.3); c.lineWidth = 1.5; c.stroke(); c.restore();
    ball(c, k, pts, u);
  },
  walls(c, k, w, h, t) {
    const u = (t / 3) % 1, bw = w * 0.13, bh = h * 0.13, xs = row(5, w / 2, bw, 8), by = h * 0.16;
    const ub = seg(u, 0.5, 1);
    xs.forEach((x, i) => brick(c, k, x, by, bw, bh, { wall: i === 1 || i === 3, a: i === 2 && ub > 0.5 ? 0 : 1 }));
    const hitA = [xs[1] + bw / 2, by + bh + 8], hitB = [xs[2] + bw / 2, by + bh + 8];
    if (u < 0.5) {
      const ua = u / 0.5; ball(c, k, [[w * 0.2, h * 0.92], hitA, [w * 0.42, h * 0.92]], ua);
      if (Math.abs(ua - 0.5) < 0.1) label(c, k, 'NÃO QUEBRA', hitA[0], by - 10, 11, 0.9);
    } else {
      ball(c, k, [[w * 0.42, h * 0.92], hitB, [w * 0.66, h * 0.92]], ub);
      if (ub > 0.5) ring(c, k, hitB[0], by + bh / 2, 14 + (ub - 0.5) * 60, 1 - (ub - 0.5) * 2);
    }
  },
  portals(c, k, w, h, t) {
    const u = (t / 2.8) % 1, A = [w * 0.22, h * 0.45], B = [w * 0.78, h * 0.45];
    for (const [p, col] of [[A, k], [B, k]]) {
      c.save(); c.beginPath(); c.ellipse(p[0], p[1], 30, 11, 0, 0, TAU);
      c.fillStyle = rgba(col, 0.18 + 0.1 * Math.sin(t * 5)); c.fill(); neonStroke(c, col, '#ffffff', 2.5, p[0] - 30, p[1], p[0] + 30, p[1], 0.8); c.restore();
    }
    if (u < 0.45) ball(c, k, [[w * 0.36, h * 1.02], A], u / 0.45);
    else if (u > 0.52) ball(c, k, [B, [w * 0.95, h * -0.05]], (u - 0.52) / 0.48);
    arrow(c, k, w * 0.38, h * 0.3, w * 0.24, 0, 0.35);
  },
  blast(c, k, w, h, t) {
    const u = (t / 3.2) % 1, bw = w * 0.13, bh = h * 0.13, xs = row(5, w / 2, bw, 8), by = h * 0.16;
    const boom = seg(u, 0.32, 0.5), back = seg(u, 0.85, 1);
    xs.forEach((x, i) => {
      const near = i >= 1 && i <= 3;
      brick(c, k, x, by, bw, bh, { x: i === 2, flash: near && boom > 0 && boom < 1, a: near && boom >= 1 ? back : 1 });
    });
    if (boom > 0 && boom < 1) ring(c, k, w / 2, by + bh / 2, 20 + boom * (bw * 1.6), 1 - boom);
    if (u < 0.32) ball(c, k, [[w * 0.42, h * 0.95], [w / 2, by + bh + 8]], u / 0.32);
    else if (u < 0.75) ball(c, k, [[w / 2, by + bh + 8], [w * 0.62, h * 0.95]], (u - 0.32) / 0.43);
  },
  phase(c, k, w, h, t) {
    const u = (t / 2.6) % 1, bw = w * 0.13, bh = h * 0.12;
    row(4, w / 2, bw, 8).forEach((x) => brick(c, k, x, h * 0.1, bw, bh, { hp: 2 }));
    row(4, w / 2, bw, 8).forEach((x) => brick(c, k, x, h * 0.42, bw, bh, { dash: true, a: 0.5 + 0.15 * Math.sin(t * 4) }));
    ball(c, k, [[w * 0.4, h * 0.98], [w * 0.5, h * 0.1 + bh + 8], [w * 0.6, h * 0.98]], u);
    label(c, k, 'ATRAVESSA', w * 0.22, h * 0.72, 11, 0.7);
  },
  descent(c, k, w, h, t) {
    const u = (t / 4) % 1, bw = w * 0.13, bh = h * 0.12, line = h * 0.8;
    const y0 = lerp(h * 0.02, line - bh * 2 - 6, ease(seg(u, 0, 0.85)));
    for (let r = 0; r < 2; r++) row(5, w / 2, bw, 8).forEach((x) => brick(c, k, x, y0 + r * (bh + 6), bw, bh, { hp: 2 - r }));
    const hot = u > 0.85;
    c.save(); c.setLineDash([8, 6]); c.beginPath(); c.moveTo(12, line); c.lineTo(w - 12, line);
    c.strokeStyle = hot ? ALERT : rgba(ALERT, 0.55); c.lineWidth = hot ? 3 : 2; c.stroke(); c.restore();
    if (hot) label(c, k, '-1 VIDA', w / 2, line + 22, 13, 1);
    arrow(c, k, w * 0.06, h * 0.2, 0, h * 0.18, 0.5); arrow(c, k, w * 0.94, h * 0.2, 0, h * 0.18, 0.5);
  },
  viral(c, k, w, h, t) {
    const u = (t / 4) % 1, bw = w * 0.13, bh = h * 0.14, cx = w / 2 - bw / 2, cy = h * 0.4;
    const spots = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]];
    spots.forEach(([dx, dy], i) => {
      const a = seg(u, 0.1 + i * 0.12, 0.18 + i * 0.12);
      if (a <= 0) return;
      c.save(); const x = cx + dx * (bw + 8), y = cy + dy * (bh + 8);
      c.translate(x + bw / 2, y + bh / 2); c.scale(a, a); c.translate(-(x + bw / 2), -(y + bh / 2));
      brick(c, k, x, y, bw, bh, { a: u > 0.92 ? 1 - seg(u, 0.92, 1) : 1 }); c.restore();
    });
    brick(c, k, cx, cy, bw, bh, { hp: 2, virus: true, rot: t });
  },
  censor(c, k, w, h, t) {
    const u = (t / 3.6) % 1, bw = w * 0.12, bh = h * 0.11, by = h * 0.1;
    const xs = row(6, w / 2, bw, 6);
    xs.forEach((x, i) => brick(c, k, x, by, bw, bh, { leak: i === 5 }));
    xs.forEach((x) => brick(c, k, x, by + bh + 6, bw, bh, { hp: 2 }));
    const down = seg(u, 0.62, 0.72), up = seg(u, 0.92, 1);
    const ba = u < 0.62 ? 1 : u < 0.92 ? 1 - down : up;
    const bx = w * 0.28 + Math.sin(t * 1.4) * w * 0.06, bY = h * 0.48, BW = w * 0.42, BH = h * 0.14;
    if (ba > 0.01) {
      c.save(); c.globalAlpha = ba; c.fillStyle = '#000'; c.fillRect(bx, bY, BW, BH);
      c.strokeStyle = rgba('#ffffff', 0.5); c.lineWidth = 1.5; c.strokeRect(bx, bY, BW, BH);
      glowText(c, 'CENSURADO', bx + BW / 2, bY + BH / 2 + 1, 12, '#ffffff', k, 'center', 800, 3); c.restore();
    }
    if (u < 0.35) ball(c, k, [[w * 0.4, h * 1.02], [w * 0.45, bY + BH + 8], [w * 0.62, h * 1.02]], u / 0.35);
    else if (u < 0.75) ball(c, k, [[w * 0.62, h * 1.02], [xs[5] + bw / 2, by + bh + 8], [w * 0.7, h * 1.02]], (u - 0.35) / 0.4);
    if (u > 0.55 && u < 0.92) label(c, k, 'TARJAS CAEM', w * 0.5, h * 0.6, 12, 0.9 * (u < 0.62 ? seg(u, 0.55, 0.62) : 1));
  },
  armor(c, k, w, h, t) {
    const u = (t / 3.2) % 1, bw = w * 0.2, bh = h * 0.16, bx = w / 2 - bw / 2, by = h * 0.32;
    const broken = u > 0.75;
    brick(c, k, bx, by, bw, bh, { hp: 2, armor: true, a: broken ? 1 - seg(u, 0.75, 0.82) : 1 });
    if (u < 0.5) {
      const ua = u / 0.5; ball(c, k, [[w * 0.3, h * 1.02], [w / 2, by + bh + 8], [w * 0.7, h * 1.02]], ua);
      if (Math.abs(ua - 0.5) < 0.1) label(c, k, 'BLINDADO', w * 0.82, by + bh, 11, 0.9);
    } else {
      const ub = (u - 0.5) / 0.5; ball(c, k, [[w * 0.08, -10], [w / 2, by - 8], [w * 0.92, -10]], ub);
      if (broken) ring(c, k, w / 2, by + bh / 2, 20 + seg(u, 0.75, 1) * 40, 1 - seg(u, 0.75, 1));
    }
  },
  alarm(c, k, w, h, t) {
    const T = 2.4, u = (t % T) / T, on = u < 0.5, by = h * 0.45, bw = w * 0.13, bh = h * 0.12;
    row(5, w / 2, bw, 8).forEach((x) => brick(c, k, x, h * 0.08, bw, bh));
    c.save(); c.beginPath(); c.moveTo(w * 0.06, by); c.lineTo(w * 0.94, by);
    if (on) neonStroke(c, ALERT, ALERT, 3, w * 0.06, by, w * 0.94, by, 0.9);
    else { c.setLineDash([4, 10]); c.strokeStyle = rgba(ALERT, 0.35); c.lineWidth = 2; c.stroke(); }
    c.restore();
    for (const x of [w * 0.06, w * 0.94]) { c.beginPath(); c.arc(x, by, 5, 0, TAU); c.fillStyle = on ? ALERT : rgba(ALERT, 0.4); c.fill(); }
    const s = on ? u / 0.5 : (u - 0.5) / 0.5, top = on ? by + 10 : h * 0.08 + bh + 8;
    disc(c, k, w * 0.5, lerp(h * 0.95, top, tri(s * 2)));
    label(c, k, on ? 'LIGADO' : 'DESLIGADO', w * 0.84, by + 22, 11, 0.8);
  },

  // active perks
  shield(c, k, w, h, t) {
    const u = (t / 2.4) % 1, py = h * 0.58;
    pad(c, k, w * 0.62, py, 40);
    c.beginPath(); c.moveTo(w * 0.05, h * 0.88); c.lineTo(w * 0.95, h * 0.88);
    neonStroke(c, k, '#ffffff', 3, 0, h * 0.88, w, h * 0.88, 0.9 + 0.3 * Math.sin(t * 6));
    const p = ball(c, k, [[w * 0.1, -10], [w * 0.28, h * 0.88 - 12], [w * 0.46, -10]], u);
    if (Math.abs(u - 0.5) < 0.08) ring(c, k, p[0], h * 0.88, 14, 0.8);
  },
  shock(c, k, w, h, t) {
    const u = (t / 3) % 1, px = w / 2, py = h * 0.88, bw = w * 0.13, bh = h * 0.11;
    const wave = seg(u, 0.1, 0.55), R = wave * h * 0.85, back = seg(u, 0.85, 1);
    row(5, w / 2, bw, 8).forEach((x) => brick(c, k, x, h * 0.08, bw, bh, { hp: 2 }));
    row(5, w / 2, bw, 8).forEach((x, i) => {
      const cx = x + bw / 2, d = Math.hypot(cx - px, h * 0.3 + bh / 2 - py), near = i >= 1 && i <= 3;
      brick(c, k, x, h * 0.3, bw, bh, { flash: near && R > d && R < d + 30, a: near && R > d + 30 ? back : 1 });
    });
    if (wave > 0 && wave < 1) { c.save(); c.beginPath(); c.arc(px, py, R, Math.PI, TAU); c.globalAlpha = 1 - wave; neonStroke(c, k, '#ffffff', 3, px - R, py, px + R, py, 1); c.restore(); }
    pad(c, k, px, py, 44);
    const push = seg(u, 0.25, 0.55);
    disc(c, k, w * 0.3 - ease(push) * w * 0.14, h * 0.62 - ease(push) * h * 0.2);
  },
  slow(c, k, w, h, t) {
    const u = (t / 4) % 1, A = 8 / 3, s = u < 0.5 ? A * u : A * 0.5 + (A / 2) * (u - 0.5);
    const slowOn = u >= 0.5;
    const x = lerp(w * 0.08, w * 0.92, tri(s)), y = h * 0.45 + Math.sin(s * Math.PI * 2) * h * 0.18;
    disc(c, slowOn ? '#9fd8ff' : k, x, y, 9);
    drawAbilityIcon(c, 'slow', w * 0.5, h * 0.84, 16, rgba('#ffffff', slowOn ? 0.95 : 0.35));
    label(c, k, slowOn ? 'VELOCIDADE  ×0,5' : 'NORMAL', w * 0.5, h * 0.12, 12, slowOn ? 0.95 : 0.6);
  },
  magnet(c, k, w, h, t) {
    const u = (t / 3.4) % 1, py = h * 0.8;
    const px = w * 0.4 + ease(seg(u, 0.35, 0.65)) * w * 0.25;
    pad(c, k, px, py, 46);
    for (let i = 0; i < 3; i++) { const r = 12 + ((t * 30 + i * 12) % 36); c.save(); c.globalAlpha = (1 - r / 48) * 0.6; c.beginPath(); c.arc(px, py - 6, r, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = k; c.lineWidth = 2; c.stroke(); c.restore(); }
    if (u < 0.35) ball(c, k, [[w * 0.15, -10], [px, py - 16]], u / 0.35);
    else if (u < 0.7) { disc(c, k, px, py - 16); label(c, k, 'SEGURANDO', px, py - 46, 11, 0.85); }
    else ball(c, k, [[px, py - 16], [w * 0.9, -10]], (u - 0.7) / 0.3);
  },
  megalaser(c, k, w, h, t) {
    const u = (t / 3) % 1, px = w / 2, py = h * 0.88, bw = w * 0.12, bh = h * 0.1;
    const charge = seg(u, 0.05, 0.3), beam = u > 0.3 && u < 0.55, gone = u >= 0.38, back = seg(u, 0.85, 1);
    for (let r = 0; r < 3; r++) row(5, w / 2, bw, 6).forEach((x, i) => brick(c, k, x, h * (0.06 + r * 0.15), bw, bh, { hp: 3 - r, a: i === 2 && gone ? back : 1, flash: i === 2 && beam && !gone }));
    if (u < 0.3 && charge > 0) { c.beginPath(); c.arc(px, py - 10, 4 + charge * 12, 0, TAU); c.fillStyle = rgba('#ffffff', 0.6 + 0.4 * charge); c.shadowColor = k; c.shadowBlur = 20 * view.blur; c.fill(); c.shadowBlur = 0; }
    if (beam) { const f = 1 - seg(u, 0.45, 0.55); c.save(); c.globalAlpha = f; c.fillStyle = rgba(k, 0.35); c.fillRect(px - 20, 0, 40, py - 10); c.fillStyle = '#ffffff'; c.fillRect(px - 6, 0, 12, py - 10); c.restore(); }
    pad(c, k, px, py, 44);
  },
  bolt(c, k, w, h, t) {
    const u = (t / 3.2) % 1, bw = w * 0.12, bh = h * 0.11, back = seg(u, 0.85, 1);
    const B = [[0.2, 0.15], [0.45, 0.32], [0.7, 0.12], [0.85, 0.42], [0.55, 0.55]].map(([x, y]) => [w * x, h * y]);
    const at = [0.25, 0.33, 0.41, 0.49, 0.57];
    B.forEach(([x, y], i) => brick(c, k, x - bw / 2, y - bh / 2, bw, bh, { hp: 2, a: u > at[i] + 0.05 ? back : 1, flash: u > at[i] && u <= at[i] + 0.05 }));
    for (let i = 1; i < B.length; i++) if (u > at[i - 1] && u < at[i] + 0.06) bolt(c, k, B[i - 1][0], B[i - 1][1], B[i][0], B[i][1], 1 - seg(u, at[i], at[i] + 0.06));
    if (u < 0.25) ball(c, k, [[w * 0.1, h * 1.02], [B[0][0], B[0][1] + bh / 2 + 8]], u / 0.25);
  },
  // passive perks
  width(c, k, w, h, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 2), hw = 44 + g * 20;
    pad(c, k, w / 2, h * 0.6, hw);
    arrow(c, k, w / 2 - hw - 12, h * 0.6, -26, 0, 0.6 * g); arrow(c, k, w / 2 + hw + 12, h * 0.6, 26, 0, 0.6 * g);
    label(c, k, 'MAIS LARGA', w / 2, h * 0.86, 12, 0.7);
  },
  grana(c, k, w, h, t) {
    const u = (t / 2.6) % 1, bw = w * 0.13, bh = h * 0.12, xs = row(5, w / 2, bw, 8), py = h * 0.86;
    xs.forEach((x, i) => {
      const tb = 0.08 + i * 0.12, a = u > tb ? 0 : 1;
      brick(c, k, x, h * 0.1, bw, bh, { a });
      if (u > tb && i % 2 === 0) { const f = seg(u, tb, tb + 0.4); if (f < 1) drawSprite(c, coinSprite(), x + bw / 2 - 13, lerp(h * 0.16, py - 20, f) - 13, 0.85); }
    });
    pad(c, k, w / 2, py, w * 0.36);
  },
  recarga(c, k, w, h, t) {
    const u = (t / 2) % 1, f = ease(seg(u, 0, 0.75)), full = u > 0.75;
    const x = w * 0.18, y = h * 0.44, bw = w * 0.5, bh = 20;
    roundRectPath(c, x, y, bw, bh, 10); c.strokeStyle = rgba(k, 0.7); c.lineWidth = 2; c.stroke();
    roundRectPath(c, x + 3, y + 3, (bw - 6) * f, bh - 6, 7); c.fillStyle = full ? '#ffffff' : k; c.fill();
    c.beginPath(); c.arc(w * 0.82, y + bh / 2, 30, 0, TAU); c.strokeStyle = rgba(k, full ? 1 : 0.5); c.lineWidth = 2.5; c.stroke();
    drawAbilityIcon(c, 'shield', w * 0.82, y + bh / 2, 14, full ? '#ffffff' : rgba('#ffffff', 0.5));
    for (let i = 0; i < 3; i++) arrow(c, k, x + 20 + i * 28 + ((t * 60) % 28), y + bh + 22, 12, 0, 0.5);
    label(c, k, full ? 'PRONTO' : 'CARREGANDO', w * 0.43, y - 18, 12, 0.85);
  },
  sorte(c, k, w, h, t) {
    const py = h * 0.86;
    pad(c, k, w / 2, py, w * 0.36);
    [0.2, 0.4, 0.6, 0.8].forEach((xf, i) => {
      const u = ((t / 2.4) + i * 0.27) % 1, good = i % 2 === 0, y = lerp(-20, py - 14, u);
      const a = good ? 1 : 1 - seg(u, 0.25, 0.5);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a; drawSprite(c, dropSprite(good ? 'multi' : 'shrink', k), w * xf - 26, y - 13); c.restore();
      if (!good && u > 0.25 && u < 0.5) { c.save(); c.globalAlpha = a; c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * xf - 18, y - 12); c.lineTo(w * xf + 18, y + 12); c.stroke(); c.restore(); }
    });
  },
  vida(c, k, w, h, t) {
    const u = (t / 2.4) % 1, n = u > 0.4 ? 4 : 3, pop = seg(u, 0.4, 0.55);
    for (let i = 0; i < n; i++) disc(c, k, w / 2 + (i - 1.5) * 48, h * 0.45, i === 3 ? 6 + 3 * pop : 9);
    if (u > 0.4) label(c, k, '+1 VIDA', w / 2, h * 0.75, 15, 1 - seg(u, 0.85, 1));
    label(c, k, 'COMEÇO DA FASE', w / 2, h * 0.15, 11, 0.6);
  },
  pesado(c, k, w, h, t) {
    const u = (t / 2.6) % 1, bw = w * 0.2, bh = h * 0.16, bx = w / 2 - bw / 2, by = h * 0.18;
    const hit = u > 0.4;
    brick(c, k, bx, by, bw, bh, { hp: 2, label: hit ? '' : '2', a: hit ? 1 - seg(u, 0.4, 0.5) : 1 });
    if (hit) { ring(c, k, w / 2, by + bh / 2, 20 + seg(u, 0.4, 1) * 50, 1 - seg(u, 0.4, 1)); label(c, k, 'DANO ×2', w / 2, by + bh / 2, 16, 1 - seg(u, 0.8, 1)); }
    pad(c, k, w / 2, h * 0.88);
    if (u < 0.4) ball(c, k, [[w / 2, h * 0.88 - 16], [w / 2, by + bh + 8]], u / 0.4);
  },

  // perk tutorial
  ptPerks(c, k, w, h, t) {
    const u = (t / 2.6) % 1, n = 20 + Math.floor(u * 5) * 5;
    drawChipIcon(c, w * 0.78, h * 0.2, 18, k);
    glowText(c, String(n), w * 0.78 + 20, h * 0.2 + 1, 15, '#ffffff', k, 'left', 700, 1);
    for (let i = 0; i < 3; i++) { const f = ((u * 3) + i / 3) % 1; drawChipIcon(c, lerp(w * 0.2 + i * 40, w * 0.78, f), lerp(h * 0.8, h * 0.2, f), 14, rgba(k, 1 - f * 0.6)); }
    label(c, k, 'BREAKERS  ›  PERKS', w * 0.35, h * 0.2, 12, 0.7);
  },
  ptChips(c, k, w, h, t) {
    const u = (t / 2.4) % 1, bw = w * 0.15, bh = h * 0.14, xs = row(3, w / 2, bw, 30);
    xs.forEach((x, i) => {
      const tb = 0.1 + i * 0.25, f = seg(u, tb, tb + 0.4);
      brick(c, k, x, h * 0.45, bw, bh, { a: u > tb ? 0 : 1 });
      if (u > tb && f < 1) { c.save(); c.globalAlpha = 1 - f; drawChipIcon(c, x + bw / 2 - 12, h * 0.45 - f * h * 0.3, 14, k); glowText(c, '+1', x + bw / 2 + 6, h * 0.45 - f * h * 0.3 + 1, 14, '#ffffff', k, 'left', 700, 1); c.restore(); }
    });
  },
  ptActive(c, k, w, h, t) {
    const u = (t / 3.6) % 1, fill = ease(seg(u, 0, 0.55)), tap1 = seg(u, 0.6, 0.68), tap2 = seg(u, 0.7, 0.78), on = u > 0.78;
    const bx = w * 0.86, byy = h * 0.22;
    c.beginPath(); c.arc(bx, byy, 26, -Math.PI / 2, -Math.PI / 2 + TAU * fill); c.strokeStyle = k; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.arc(bx, byy, 26, 0, TAU); c.strokeStyle = rgba(k, 0.3); c.lineWidth = 1.5; c.stroke();
    drawAbilityIcon(c, 'shield', bx, byy, 12, fill >= 1 ? '#ffffff' : rgba('#ffffff', 0.5));
    if (u < 0.55) { const s = u / 0.55 * 4; disc(c, k, w * 0.4, lerp(h * 0.7, h * 0.15, tri(s * 2))); }
    for (const tp of [tap1, tap2]) if (tp > 0 && tp < 1) { finger(c, w * 0.45, h * 0.5, 1 - tp); ring(c, k, w * 0.45, h * 0.5, 18 + tp * 26, 1 - tp); }
    if (u > 0.58 && u < 0.8) label(c, k, 'TOQUE 2×', w * 0.45, h * 0.3, 13, 0.95);
    pad(c, k, w * 0.4, h * 0.78, 44);
    if (on) { c.beginPath(); c.moveTo(w * 0.05, h * 0.92); c.lineTo(w * 0.95, h * 0.92); neonStroke(c, k, '#ffffff', 3, 0, h * 0.92, w, h * 0.92, 0.9); }
  },
  ptPassive(c, k, w, h, t) {
    const g = 0.5 + 0.5 * Math.sin(t * 3);
    c.save(); c.globalAlpha = 0.25 + 0.2 * g; c.beginPath(); c.ellipse(w / 2, h * 0.7, 90, 22, 0, 0, TAU); c.fillStyle = k; c.fill(); c.restore();
    pad(c, k, w / 2, h * 0.7, 64, 1 + 0.5 * g);
    disc(c, k, w * 0.55, lerp(h * 0.62, h * 0.12, tri(t * 0.9)));
    label(c, k, 'SEMPRE LIGADO', w / 2, h * 0.92, 12, 0.75);
  },
  ptLevels(c, k, w, h, t) {
    const u = (t / 3) % 1, lvl = Math.min(3, Math.floor(u * 4));
    for (let q = 0; q < 3; q++) {
      const x = w / 2 - 75 + q * 55;
      c.beginPath(); c.rect(x, h * 0.42, 40, 16);
      if (q < lvl) { c.fillStyle = k; c.shadowColor = k; c.shadowBlur = 10 * view.blur; c.fill(); c.shadowBlur = 0; } else { c.strokeStyle = rgba(k, 0.6); c.lineWidth = 1.6; c.stroke(); }
    }
    label(c, k, lvl >= 3 ? 'MÁXIMO' : 'NÍVEL ' + lvl, w / 2, h * 0.72, 13, 0.85);
    if (lvl < 3) { const r = 7; c.beginPath(); c.arc(w / 2 + 110, h * 0.38, r, 0, TAU); c.fillStyle = 'rgba(255,216,74,0.85)'; c.fill(); c.fillStyle = '#000'; c.font = `900 11px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', w / 2 + 110, h * 0.38 + 1); c.textBaseline = 'alphabetic'; }
  },
};

// a capsule falling into the platform
function capsuleScene(c, k, w, h, t, type) {
  const u = (t / 2.2) % 1, py = h * 0.8, f = seg(u, 0, 0.6);
  pad(c, k, w / 2, py, 50, u > 0.6 && u < 0.75 ? 1.6 : 0.8);
  if (f < 1) drawSprite(c, dropSprite(type, k), w / 2 - 26, lerp(-14, py - 16, f) - 13);
  else ring(c, k, w / 2, py - 6, 20 + seg(u, 0.6, 1) * 40, 1 - seg(u, 0.6, 1));
}

export const hasDemo = (key) => !!key && (key.startsWith('cap:') || !!SCENES[key]);

export function drawDemo(c, key, x, y, w, h, t, k) {
  if (!hasDemo(key)) return;
  c.save();
  roundRectPath(c, x, y, w, h, 14);
  c.fillStyle = rgba(k, 0.05); c.fill();
  c.strokeStyle = rgba(k, 0.35); c.lineWidth = 1.5; c.stroke();
  c.clip();
  // faint grid, like the playfield
  c.strokeStyle = rgba(k, 0.08); c.lineWidth = 1; c.beginPath();
  for (let gx = x + 30; gx < x + w; gx += 30) { c.moveTo(gx, y); c.lineTo(gx, y + h); }
  for (let gy = y + 30; gy < y + h; gy += 30) { c.moveTo(x, gy); c.lineTo(x + w, gy); }
  c.stroke();
  c.translate(x, y);
  c.textBaseline = 'middle';
  if (key.startsWith('cap:')) capsuleScene(c, k, w, h, t, key.slice(4));
  else SCENES[key](c, k, w, h, t);
  c.restore();
}
