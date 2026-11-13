// Neon rendering helpers. All drawing happens in logical coordinates (720 wide);
// view.res is the device-pixel scale, needed because shadowBlur ignores transforms.
export const view = { res: 1, glow: 1, blur: 1 };
export const TAU = Math.PI * 2;
const FONT = '"Orbitron", "Segoe UI", Roboto, Arial, sans-serif';

// Blend two hex colors (t = 0 -> a, 1 -> b).
export function mix(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

export function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Without glow (NEON off, the phone default) the two glow passes of a neon
// stroke or title are the same plain line drawn twice: one is enough, unless
// the drawing is see-through or additive (then twice is brighter).
const opaque = (col) => typeof col === 'string' && col[0] === '#' && col.length === 7;
const once = (c) => view.blur <= 0 && c.globalAlpha >= 1 && c.globalCompositeOperation === 'source-over';

// Strokes the current path as a neon tube: gradient between two complementary
// colors, a double glow (one per color) and a bright thin core.
export function neonStroke(c, a, b, w, x0, y0, x1, y1, glow = 1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = g;
  c.lineWidth = w;
  if (!once(c) || !opaque(a) || !opaque(b)) {
    c.shadowColor = a;
    c.shadowBlur = 22 * glow * view.blur;
    c.stroke();
    c.shadowColor = b;
    c.shadowBlur = 10 * glow * view.blur;
    c.stroke();
    c.shadowBlur = 0;
  } else c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = Math.max(1, w * 0.3);
  c.stroke();
}

// Pre-renders a glowing shape into an offscreen canvas (cheap to blit every frame).
export function makeSprite(w, h, pad, res, draw) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil((w + pad * 2) * res);
  cv.height = Math.ceil((h + pad * 2) * res);
  const x = cv.getContext('2d');
  x.setTransform(res, 0, 0, res, pad * res, pad * res);
  draw(x);
  return { img: cv, w: w + pad * 2, h: h + pad * 2, pad };
}

export function drawSprite(c, s, x, y, scale = 1) {
  c.drawImage(s.img, x - s.pad * scale, y - s.pad * scale, s.w * scale, s.h * scale);
}

function setFont(c, size, weight, spacing) {
  c.font = `${weight} ${size}px ${FONT}`;
  if ('letterSpacing' in c) c.letterSpacing = spacing + 'px';
}

// Outlined neon lettering for titles.
export function neonTitle(c, text, x, y, size, a, b, spacing = 0) {
  c.save();
  setFont(c, size, 800, spacing);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const m = c.measureText(text).width;
  const g = c.createLinearGradient(x - m / 2, y - size / 2, x + m / 2, y + size / 2);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  c.lineJoin = 'round';
  c.strokeStyle = g;
  c.lineWidth = Math.max(2, size * 0.05);
  if (!once(c) || !opaque(a) || !opaque(b)) {
    c.shadowColor = a;
    c.shadowBlur = 24 * view.blur;
    c.strokeText(text, x, y);
    c.shadowColor = b;
    c.shadowBlur = 10 * view.blur;
    c.strokeText(text, x, y);
    c.shadowBlur = 0;
  } else c.strokeText(text, x, y);
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = Math.max(1, size * 0.014);
  c.strokeText(text, x, y);
  c.restore();
}

// Filled glowing text for HUD / labels.
export function glowText(c, text, x, y, size, fill, glow, align = 'center', weight = 600, spacing = 2) {
  c.save();
  setFont(c, size, weight, spacing);
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = fill;
  if (!once(c) || !opaque(fill)) {
    c.shadowColor = glow;
    c.shadowBlur = 14 * view.blur;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
  }
  c.fillText(text, x, y);
  c.restore();
}

// CONTÁGIO: a virus, a round body with knobbed spikes (s = outer radius).
// Uses the current strokeStyle / fillStyle / lineWidth.
export function drawVirus(c, x, y, s, rot = 0) {
  c.beginPath(); c.arc(x, y, s * 0.46, 0, TAU); c.stroke();
  c.beginPath(); c.arc(x, y, s * 0.17, 0, TAU); c.fill();
  c.beginPath();
  for (let q = 0; q < 8; q++) {
    const a = rot + (q * TAU) / 8, cs = Math.cos(a), sn = Math.sin(a);
    c.moveTo(x + cs * s * 0.46, y + sn * s * 0.46); c.lineTo(x + cs * s * 0.8, y + sn * s * 0.8);
  }
  c.stroke();
  c.beginPath();
  for (let q = 0; q < 8; q++) {
    const a = rot + (q * TAU) / 8, kx = x + Math.cos(a) * s * 0.88, ky = y + Math.sin(a) * s * 0.88;
    c.moveTo(kx + s * 0.13, ky); c.arc(kx, ky, s * 0.13, 0, TAU);
  }
  c.fill();
}
