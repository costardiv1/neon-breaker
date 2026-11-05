// Customizable platform: SHAPE (collision + bounce behaviour), PALETTE (colors
// that flow along the lines) and EMBLEM (animated symbol under the center).
import { view, mix, TAU } from './render.js';

// y(u, hw): downward offset of the surface at horizontal offset u (-hw..hw).
// aim: how much the hit position (vs. pure reflection) decides the angle.
// max: maximum outgoing angle from vertical (radians).
export const SHAPES = [
  { name: 'ARCO', desc: 'EQUILIBRADO', curve: 3, aim: 0.65, max: 1.05,
    y: (u) => { const R = 210; return R - Math.sqrt(R * R - u * u); } },
  { name: 'LÂMINA', desc: 'PRECISO', curve: 1, aim: 0.85, max: 0.85,
    y: (u, hw) => { const k = Math.abs(u) - (hw - 16); return k > 0 ? k * 0.9 : 0; } },
  { name: 'PONTA', desc: 'AGRESSIVO', curve: 5, aim: 0.4, max: 1.25,
    y: (u) => Math.abs(u) * 0.3 },
  { name: 'FERRADURA', desc: 'CURVA FORTE', curve: 4, aim: 0.5, max: 1.2,
    y: (u, hw) => { const R = Math.max(hw * 1.15, 100); return R - Math.sqrt(Math.max(0, R * R - u * u)); } },
  { name: 'ASA', desc: 'PONTAS DEVOLVEM', curve: 4, aim: 0.2, max: 1.15,
    y: (u, hw) => -22 * Math.pow(Math.abs(u) / hw, 3) },
];

export const PALETTES = [
  { name: 'PULSO', c: ['#00f0ff', '#ff3864'] },
  { name: 'BRASA', c: ['#ff8a00', '#1e90ff'] },
  { name: 'VENENO', c: ['#a6ff00', '#b026ff'] },
  { name: 'AURORA', c: ['#00ffa3', '#ff00b8', '#00c8ff'] },
  { name: 'SOLAR', c: ['#ffe500', '#ff5a00', '#6a3cff'] },
  { name: 'PRISMA', c: ['#ff2d4a', '#ffd21f', '#2bff88', '#00c8ff', '#a65cff'] },
  { name: 'GELO', c: ['#ffffff', '#7fe8ff', '#2a7bff'] },
  { name: 'SISTEMA', c: null }, // follows the game color
];

export const EMBLEMS = ['NENHUM', 'MIRA', 'NÚCLEO', 'TRIÂNGULO', 'HEXÁGONO', 'RAIO', 'COROA', 'SETAS'];

export function paletteColors(pi, theme) {
  return PALETTES[pi].c || [theme, '#ffffff', theme];
}

const smooth = (x) => x * x * (3 - 2 * x);
export function samplePal(pal, p) {
  p = ((p % 1) + 1) % 1;
  const f = p * pal.length;
  const i = Math.floor(f);
  return mix(pal[i % pal.length], pal[(i + 1) % pal.length], smooth(f - i));
}

function flowGradient(c, pal, x0, x1, ph) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, samplePal(pal, (k / 8) * 0.8 + ph));
  return g;
}

function neon(c, grad, ga, gb, w, glow = 1) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = grad;
  c.lineWidth = w;
  c.shadowColor = ga; c.shadowBlur = 22 * glow * view.blur; c.stroke();
  c.shadowColor = gb; c.shadowBlur = 9 * glow * view.blur; c.stroke();
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, w * 0.3);
  c.stroke();
}

function polyPath(c, pts) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
}

export function shapePoints(si, x, y, hw, n = 24, scale = 1, dy = 0) {
  const sh = SHAPES[si];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = (-hw + (2 * hw * i) / n) * scale;
    pts.push([x + u, y + dy + sh.y(u, hw * scale)]);
  }
  return pts;
}

// Outgoing angle (from vertical) for a straight-down disc hitting at k = -1..1.
export function outAngle(si, k, hw = 86) {
  const sh = SHAPES[si];
  const u = k * hw, e = 1;
  const dy = (sh.y(u + e, hw) - sh.y(u - e, hw)) / (2 * e);
  const len = Math.hypot(1, dy);
  const nx = dy / len, ny = -1 / len;
  const vx = 0, vy = 1, dot = vx * nx + vy * ny;
  const rvx = vx - 2 * dot * nx, rvy = vy - 2 * dot * ny;
  const thR = Math.atan2(rvx, -rvy);
  const th = sh.aim * k * sh.max + (1 - sh.aim) * thR;
  return Math.max(-sh.max, Math.min(sh.max, th));
}

// Each shape reacts to a hit in its own way. hit: 1 right after the hit -> 0.
//   ARCO jumps, LÂMINA blinks, PONTA gets sharper and springs back,
//   FERRADURA wobbles, ASA flaps its wings.
export function drawPlatform(c, plat, x, y, hw, t, theme, hit = 0) {
  if (hit <= 0) { platformBody(c, plat, x, y, hw, t, theme, 0); return; }
  // eased curves: a quick rise and a long, soft settle
  const u = 1 - hit, bell = Math.sin(Math.PI * Math.pow(u, 0.65)), fade = hit * hit;
  c.save();
  c.translate(x, y);
  switch (SHAPES[plat.shape].name) {
    case 'ARCO': c.translate(0, -14 * bell); break;
    case 'PONTA': c.scale(1 - 0.08 * bell, 1 + 0.9 * bell); break;
    case 'FERRADURA': c.rotate(Math.sin(u * 4 * Math.PI) * 0.06 * fade); break;
    case 'ASA': { const f = Math.sin(u * 3 * Math.PI) * Math.pow(hit, 1.4); c.scale(1 + 0.12 * Math.abs(f), 1 - 0.4 * f); break; }
    default: break;
  }
  platformBody(c, plat, 0, 0, hw, t, theme, hit);
  c.restore();
}

function platformBody(c, plat, x, y, hw, t, theme, hit) {
  const pal = paletteColors(plat.pal, theme);
  const ph = t * 0.22;
  const ga = samplePal(pal, ph), gb = samplePal(pal, ph + 0.5);
  const main = shapePoints(plat.shape, x, y, hw);
  const g1 = flowGradient(c, pal, x - hw, x + hw, ph);
  const g2 = flowGradient(c, pal, x - hw, x + hw, ph + 0.33);
  const g3 = flowGradient(c, pal, x - hw, x + hw, ph + 0.66);
  const pulse = 0.85 + 0.15 * Math.sin(t * 4);

  // under-structure: second rail + dashed data line
  const rail = shapePoints(plat.shape, x, y, hw, 20, 0.84, 10);
  polyPath(c, rail);
  neon(c, g2, gb, ga, 2.4, 0.5);
  const data = shapePoints(plat.shape, x, y, hw, 16, 0.6, 18);
  c.save();
  c.setLineDash([5, 7]);
  c.lineDashOffset = -t * 36;
  polyPath(c, data);
  neon(c, g3, ga, gb, 1.6, 0.4);
  c.restore();
  // struts linking main line and rail
  c.beginPath();
  for (const k of [-0.62, -0.25, 0.25, 0.62]) {
    const a = main[Math.round(((k + 1) / 2) * 24)];
    const b = rail[Math.round(((k / 0.84 + 1) / 2) * 20)] || rail[10];
    c.moveTo(a[0], a[1] + 3); c.lineTo(b[0], b[1]);
  }
  neon(c, g2, ga, gb, 1.4, 0.3);

  // details of each shape
  if (plat.detail !== false) shapeDetail(c, plat.shape, x, y, hw, t, g2, g3, ga, gb);

  // main line (solid, or dashed and flowing when the player picks it)
  polyPath(c, main);
  if (plat.dash) {
    c.save(); c.setLineDash([15, 8]); c.lineDashOffset = -t * 45;
    neon(c, g1, ga, gb, 7, pulse);
    c.restore();
  } else neon(c, g1, ga, gb, 7, pulse);
  // LÂMINA blinks white when hit
  if (hit > 0 && SHAPES[plat.shape].name === 'LÂMINA') {
    const a = (0.5 - 0.5 * Math.cos((1 - hit) * 4 * Math.PI)) * hit;   // two soft pulses
    polyPath(c, main);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; c.lineWidth = 10; c.lineCap = 'round'; c.stroke();
    c.restore();
  }

  // end nodes (diamonds)
  c.beginPath();
  for (const p of [main[0], main[main.length - 1]]) {
    c.moveTo(p[0], p[1] - 6); c.lineTo(p[0] + 5, p[1]); c.lineTo(p[0], p[1] + 6); c.lineTo(p[0] - 5, p[1]); c.closePath();
  }
  neon(c, g1, gb, ga, 2.2, 0.8);

  // light runners along the main line
  let L = 0;
  for (let i = 1; i < main.length; i++) L += Math.hypot(main[i][0] - main[i - 1][0], main[i][1] - main[i - 1][1]);
  c.save();
  c.setLineDash([22, L / 2 - 22]);
  c.lineDashOffset = -((t * 210) % L);
  polyPath(c, main);
  c.lineCap = 'round';
  c.strokeStyle = '#ffffff';
  c.lineWidth = 3;
  c.shadowColor = gb; c.shadowBlur = 18 * view.blur;
  c.stroke();
  c.restore();

  const ey = y + Math.max(0, SHAPES[plat.shape].y(0, hw)) + 40;
  if (EMBLEMS[plat.emb] !== 'NENHUM') emblemFrame(c, plat.shape, x, ey, t, g2, ga, gb);
  drawEmblem(c, plat.emb, x, ey, t, g1, ga, gb);
}

// Frame around the emblem, drawn in the style of each shape.
function emblemFrame(c, si, x, y, t, grad, ga, gb) {
  const R = 21;
  c.save();
  c.translate(x, y);
  c.beginPath();
  switch (SHAPES[si].name) {
    case 'ARCO': // two smooth arcs, top and bottom
      c.arc(0, 0, R, Math.PI * 1.15, Math.PI * 1.85);
      c.moveTo(Math.cos(Math.PI * 0.15) * R, Math.sin(Math.PI * 0.15) * R);
      c.arc(0, 0, R, Math.PI * 0.15, Math.PI * 0.85);
      break;
    case 'LÂMINA': // straight cut brackets
      c.moveTo(-R + 6, -R + 2); c.lineTo(-R, -R + 8); c.lineTo(-R, R - 8); c.lineTo(-R + 6, R - 2);
      c.moveTo(R - 6, -R + 2); c.lineTo(R, -R + 8); c.lineTo(R, R - 8); c.lineTo(R - 6, R - 2);
      break;
    case 'PONTA': // a diamond, pointing up and down
      c.moveTo(0, -R - 4); c.lineTo(R, 0); c.lineTo(0, R + 4); c.lineTo(-R, 0); c.closePath();
      break;
    case 'FERRADURA': // horseshoe open at the top
      c.arc(0, 0, R, Math.PI * 1.7, Math.PI * 1.3);
      break;
    case 'ASA': // two wings
      for (const s of [-1, 1]) {
        c.moveTo(s * 10, -R + 4); c.quadraticCurveTo(s * (R + 12), -4, s * 12, R - 2);
        c.moveTo(s * (R + 2), -8); c.lineTo(s * (R + 9), -12);
      }
      break;
  }
  neon(c, grad, ga, gb, 1.8, 0.55);
  if (SHAPES[si].name === 'FERRADURA') {
    c.fillStyle = '#ffffff';
    for (const a of [Math.PI * 1.7, Math.PI * 1.3]) { c.beginPath(); c.arc(Math.cos(a) * R, Math.sin(a) * R, 2.2, 0, TAU); c.fill(); }
  }
  c.restore();
}

// Extra decoration per shape, on top of the shared rail and dashed data line.
function shapeDetail(c, si, x, y, hw, t, g2, g3, ga, gb) {
  const sh = SHAPES[si];
  const yAt = (u) => y + sh.y(u, hw);
  const dashed = (pts, dash, gap, speed, w = 1.4, glow = 0.4) => {
    c.save(); c.setLineDash([dash, gap]); c.lineDashOffset = -t * speed;
    polyPath(c, pts); neon(c, g3, ga, gb, w, glow); c.restore();
  };
  switch (sh.name) {
    case 'ARCO': { // a second, faster dashed arc deeper below and a row of lights
      dashed(shapePoints(si, x, y, hw, 16, 0.36, 26), 3, 6, -50, 1.3, 0.35);
      c.fillStyle = '#ffffff';
      for (let q = -2; q <= 2; q++) {
        const u = q * hw * 0.22;
        c.globalAlpha = 0.35 + 0.65 * Math.max(0, Math.sin(t * 6 - q));
        c.beginPath(); c.arc(x + u, yAt(u) + 5, 1.6, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      break;
    }
    case 'LÂMINA': { // cooling vents under the blade + dashed edge glints at the tips
      c.beginPath();
      for (let q = -4; q <= 4; q++) { const u = q * hw * 0.16; c.moveTo(x + u, y + 5); c.lineTo(x + u + 4, y + 9); }
      neon(c, g2, ga, gb, 1.3, 0.3);
      for (const s of [-1, 1]) dashed([[x + s * (hw - 6), y - 4], [x + s * (hw + 10), y + 6]], 3, 3, 30, 1.4, 0.5);
      break;
    }
    case 'PONTA': { // a dashed chevron echo above the tip and a spike node
      const ech = shapePoints(si, x, y, hw, 12, 0.55, -10);
      dashed(ech, 5, 6, 40, 1.4, 0.4);
      c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 4, y - 2); c.lineTo(x, y + 5); c.lineTo(x - 4, y - 2); c.closePath();
      neon(c, g2, gb, ga, 1.8, 0.7);
      break;
    }
    case 'FERRADURA': { // dashed horns at both ends and rivets
      for (const s of [-1, 1]) {
        const u = s * hw, bx = x + u, by = yAt(u);
        dashed([[bx, by], [bx + s * 8, by - 14], [bx + s * 4, by - 26]], 4, 4, 30, 1.6, 0.5);
      }
      c.fillStyle = '#ffffff';
      for (const k of [-0.75, -0.35, 0.35, 0.75]) { const u = k * hw; c.beginPath(); c.arc(x + u, yAt(u) + 6, 1.8, 0, TAU); c.fill(); }
      break;
    }
    case 'ASA': { // dashed feathers along the wings
      for (const s of [-1, 1]) {
        for (let q = 0; q < 3; q++) {
          const u = s * hw * (0.45 + q * 0.2), yy = yAt(u);
          dashed([[x + u, yy + 4], [x + u + s * 10, yy + 16 + q * 4]], 3, 3, 24, 1.3, 0.4);
        }
      }
      break;
    }
  }
}

export function drawEmblem(c, ei, x, y, t, grad, ga, gb) {
  const name = EMBLEMS[ei];
  if (name === 'NENHUM') return;
  c.save();
  c.translate(x, y);
  switch (name) {
    case 'MIRA': {
      c.beginPath(); c.arc(0, 0, 8, 0, TAU);
      neon(c, grad, ga, gb, 2, 0.7);
      c.rotate(t * 0.45);
      c.beginPath();
      for (let k = 0; k < 4; k++) { const a = (k * TAU) / 4; c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); }
      neon(c, grad, gb, ga, 2, 0.6);
      c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fillStyle = '#fff'; c.fill();
      break;
    }
    case 'NÚCLEO': {
      c.beginPath(); c.arc(0, 0, 4 + Math.sin(t * 2.6), 0, TAU); c.fillStyle = '#fff';
      c.shadowColor = ga; c.shadowBlur = 14 * view.blur; c.fill(); c.shadowBlur = 0;
      c.save(); c.setLineDash([4, 4]); c.rotate(t * 0.8);
      c.beginPath(); c.arc(0, 0, 11, 0, TAU); neon(c, grad, gb, ga, 1.8, 0.6);
      c.restore();
      const a = t * 1.7;
      c.beginPath(); c.arc(Math.cos(a) * 11, Math.sin(a) * 11, 2.6, 0, TAU); c.fillStyle = gb; c.fill();
      break;
    }
    case 'TRIÂNGULO': {
      c.beginPath(); c.moveTo(0, -12); c.lineTo(11, 8); c.lineTo(-11, 8); c.closePath();
      neon(c, grad, ga, gb, 2.2, 0.8);
      const s = 0.8 + 0.25 * Math.sin(t * 2.2);
      c.beginPath(); c.moveTo(0, 5 * s); c.lineTo(4.5 * s, -2.5 * s); c.lineTo(-4.5 * s, -2.5 * s); c.closePath();
      neon(c, grad, gb, ga, 1.6, 0.6);
      break;
    }
    case 'HEXÁGONO': {
      c.rotate(t * 0.35);
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k * TAU) / 6; c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 12, Math.sin(a) * 12); }
      c.closePath();
      neon(c, grad, ga, gb, 2.2, 0.8);
      c.rotate(-t * 0.7);
      c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.moveTo(0, -6); c.lineTo(0, 6);
      neon(c, grad, gb, ga, 1.6, 0.5);
      break;
    }
    case 'RAIO': {
      const fl = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.4)) * (Math.sin(t * 0.9) > -0.85 ? 1 : 0.4);
      c.globalAlpha = fl;
      c.beginPath(); c.moveTo(3, -13); c.lineTo(-5, 1); c.lineTo(2, 1); c.lineTo(-3, 13); c.lineTo(6, -3); c.lineTo(-1, -3); c.closePath();
      neon(c, grad, ga, gb, 2, 0.9);
      break;
    }
    case 'COROA': {
      c.beginPath(); c.moveTo(-13, 8); c.lineTo(-13, -6); c.lineTo(-6, 1); c.lineTo(0, -10); c.lineTo(6, 1); c.lineTo(13, -6); c.lineTo(13, 8); c.closePath();
      neon(c, grad, ga, gb, 2, 0.8);
      c.fillStyle = '#fff';
      [[-13, -6], [0, -10], [13, -6]].forEach(([px, py], i) => {
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 2);
        c.beginPath(); c.arc(px, py - 3, 2.2, 0, TAU); c.fill();
      });
      break;
    }
    case 'SETAS': {
      const o = 3 * Math.sin(t * 2.4);
      c.beginPath();
      c.moveTo(-8 - o, -7); c.lineTo(-15 - o, 0); c.lineTo(-8 - o, 7);
      c.moveTo(8 + o, -7); c.lineTo(15 + o, 0); c.lineTo(8 + o, 7);
      neon(c, grad, ga, gb, 2.4, 0.8);
      c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fillStyle = '#fff'; c.fill();
      break;
    }
  }
  c.restore();
}
