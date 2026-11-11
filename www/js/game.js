import { view, TAU, rgba, mix, roundRectPath, neonStroke, makeSprite, drawSprite, glowText, neonTitle, drawVirus } from './render.js';
import { getStage, stageLabel, MECHS, TOTAL_STAGES, worldStart, worldCount } from './levels.js';
import { SHAPES, drawPlatform, hitTransform, paletteColors, samplePal, shapePoints } from './platform.js';
import { createBoss, collideRect } from './boss.js';
import { sfx, music, vibrate } from './audio.js';

export const W = 720;
export const BALL_R = 16;
export const BASE_HW = 86;
const PAD_TH = 8;
const PADDLE_OFF = 190;
const LEFT = 14, RIGHT = W - 14;
const CR = 34;
const BOTTOM_OFF = 62;
const COLS = 9, MARGIN = 32, GAP = 8, BH = 28;
const BW = (W - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
const TRAIL_LEN = 560;
const MAX_BALLS = 12;
const DROP_CHANCE = 0.13;
const WHITE = '#ffffff';
const COIN_COL = '#ffd84a';
const CORE_R = 20;
const MISSILE_R = 125;
const COIN_CHANCE = 0.07;   // coins: rare drops, caught with the platform, spent on cosmetics
const COIN_R = 13;
const PHASE_T = 2.8;   // FASE: seconds each group stays solid / out of phase
const PORTAL_R = 24;
const PORTAL_ALT = ['#ff45c0', '#ffd21f', '#2bff88'];   // colors of the 2nd, 3rd... pair of portals
const AUTO_LAUNCH = 10;   // seconds a disc may sit on the platform before it launches by itself
const BAR_H = 74;         // TARJA: height of a censor bar
const BEAM_ON = 2.4, BEAM_OFF = 2;   // SEGURANÇA: seconds a security beam stays on / off
export const HIT_T = 0.6;   // length of the platform's hit animation (s)
// graphics quality (set from the dev panel): particle amount and trail detail
export const gfx = { fx: 1, trail: 1, grid: 1 };
const BORDER_BASE = { flow: [3, 0.8], beat: [2.5, 0.5], scan: [2.5, 0.55] };

// Capsules. d = the district that introduces it: each district brings one good
// and one bad capsule, and keeps the ones from the districts before it.
export const POWERS = {
  wide:    { good: true,  d: 1, w: 2.6, label: 'PLATAFORMA +' },
  multi:   { good: true,  d: 2, w: 3,   label: 'MULTI' },
  life:    { good: true,  d: 3, w: 0.6, label: '+1 VIDA' },
  laser:   { good: true,  d: 4, w: 2.2, label: 'LASER' },
  missile: { good: true,  d: 5, w: 2,   label: 'MÍSSIL' },
  pierce:  { good: true,  d: 6, w: 1.6, label: 'PERFURAR' },
  mega:    { good: true,  d: 7, w: 1.8, label: 'MEGA DISCO' },
  slow:    { good: true,  d: 8, w: 1.8, label: 'LENTO' },
  ghost:   { good: true,  d: 9, w: 1.4, label: 'FANTASMA' },
  shrink:  { good: false, d: 1, w: 2,   label: 'PLATAFORMA -' },
  fast:    { good: false, d: 2, w: 2,   label: 'RÁPIDO' },
  mini:    { good: false, d: 3, w: 1.8, label: 'MINI DISCO' },
  dark:    { good: false, d: 4, w: 1.6, label: 'APAGÃO' },
  invert:  { good: false, d: 5, w: 1.5, label: 'INVERTIDO' },
  wobble:  { good: false, d: 6, w: 1.6, label: 'INSTÁVEL' },
  drag:    { good: false, d: 7, w: 1.6, label: 'PLATAFORMA LENTA' },
  repel:   { good: false, d: 8, w: 1.5, label: 'REPULSÃO' },
  blind:   { good: false, d: 9, w: 1.4, label: 'DISCO SUMIDO' },
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SHOCK_DEFLECT = 220;  // and how close the disc must be to be pushed

// Active perks (bought/evolved in BREAKERS > PERKS). One is equipped; it
// charges by breaking bricks and fires with a double tap or the HUD button.
export const ABILITIES = {
  shield:    { name: 'ESCUDO', desc: 'Uma barreira de energia embaixo da plataforma rebate o disco.', lv: ['7 s', '9 s', '11 s'], cost: [55, 125, 240] },
  shock:     { name: 'ONDA DE CHOQUE', desc: 'Uma onda sai de onde a plataforma está, danifica os blocos mais próximos e desvia o disco que estiver perto dela.', lv: ['4 blocos', '6 blocos', '8 blocos, dano 2'], cost: [70, 155, 280] },
  slow:      { name: 'CÂMERA LENTA', desc: 'O tempo desacelera e o disco anda na metade da velocidade.', lv: ['5,5 s', '7 s', '8,5 s'], cost: [155, 310, 530] },
  magnet:    { name: 'ÍMÃ', desc: 'Puxa o disco para a plataforma e o segura a cada toque. Solte para mirar e lançar.', lv: ['9 s', '12 s', '15 s'], cost: [55, 125, 240] },
  megalaser: { name: 'MEGA LASER', desc: 'Carrega 0,5 s no centro da plataforma e dispara um feixe que destrói tudo em linha reta. A plataforma fica travada enquanto dispara.', lv: ['feixe fino', 'feixe médio', 'feixe largo'], cost: [85, 170, 310] },
  bolt:      { name: 'RELÂMPAGO', desc: 'Um raio sai do disco e salta de bloco em bloco, danificando cada um. Também acerta o chefão.', lv: ['5 blocos', '7 blocos', '9 blocos, dano 2'], cost: [180, 365, 630] },
};
// Passive perks: always on while equipped (one at a time, besides the active one).
export const PASSIVES = {
  width:   { name: 'PLATAFORMA LARGA', desc: 'A plataforma fica mais larga.', lv: ['+8%', '+16%', '+24%'], cost: [195, 390, 670] },
  grana:   { name: 'GRANA', desc: 'Mais moedas caem dos blocos.', lv: ['+30%', '+60%', 'o dobro'], cost: [110, 225, 420] },
  recarga: { name: 'RECARGA', desc: 'O perk ativo carrega mais rápido.', lv: ['+25%', '+50%', '+80%'], cost: [140, 280, 505] },
  sorte:   { name: 'SORTE', desc: 'Caem menos cápsulas de desvantagem.', lv: ['-30%', '-55%', '-75%'], cost: [125, 250, 450] },
  vida:    { name: 'VIDA EXTRA', desc: 'Ganha 1 vida no começo de cada fase, até um limite.', lv: ['até 4 vidas', 'até 5 vidas', 'até 6 vidas'], cost: [210, 420, 730] },
  pesado:  { name: 'DISCO PESADO', desc: 'Depois de cada lançamento, os primeiros acertos dão dano dobrado.', lv: ['1º acerto', '2 acertos', '3 acertos'], cost: [170, 335, 590] },
};
const GRANA_MUL = [1, 1.3, 1.6, 2];
const RECARGA_MUL = [1, 1.25, 1.5, 1.8];
const SORTE_MUL = [1, 0.7, 0.45, 0.25];

export function tierTone(col, hp) {
  return hp === 1 ? mix(col, '#000000', 0.35) : hp === 2 ? col : hp === 3 ? mix(col, WHITE, 0.3) : mix(col, WHITE, 0.55);
}

// ---------- sprite cache ----------
const cache = new Map();
function cached(key, build) {
  const k = key + '@' + view.res + '@' + view.glow;
  let s = cache.get(k);
  if (!s) { s = build(view.res); cache.set(k, s); }
  return s;
}
export function clearSprites() { cache.clear(); }

// Disc looks (bought with coins in BREAKERS). Purely cosmetic.
export const DISCS = [
  { name: 'NÚCLEO', cost: 0 },
  { name: 'ANEL', cost: 25 },
  { name: 'ESTRELA', cost: 35 },
  { name: 'HÉLICE', cost: 50 },
  { name: 'HEXA', cost: 60 },
  { name: 'ÁTOMO', cost: 90 },
  { name: 'PLASMA', cost: 120 },
];

export function discSprite(col, r = BALL_R, style = 0) {
  return cached('disc' + col + r + '_' + style, (res) => makeSprite(r * 2, r * 2, 34, res, (c) => {
    const tint = mix(col, WHITE, 0.55);
    const glow = (b) => { c.shadowColor = col; c.shadowBlur = b * res * view.glow; };
    c.lineCap = 'round'; c.lineJoin = 'round';
    const poly = (n, rr, rot) => {
      c.beginPath();
      for (let q = 0; q < n; q++) { const a = rot + (q * TAU) / n; c[q ? 'lineTo' : 'moveTo'](r + Math.cos(a) * rr, r + Math.sin(a) * rr); }
      c.closePath();
    };
    const dot = (rr) => { c.beginPath(); c.arc(r, r, rr, 0, TAU); c.fillStyle = WHITE; c.fill(); };
    if (style !== 6 && style !== 4) { c.beginPath(); c.arc(r, r, r, 0, TAU); c.fillStyle = rgba(col, 0.16); c.fill(); }
    switch (style) {
      case 1: // ANEL: two clean rings
        glow(24); c.strokeStyle = tint; c.lineWidth = 3;
        c.beginPath(); c.arc(r, r, r - 1.8, 0, TAU); c.stroke();
        glow(10); c.strokeStyle = col; c.lineWidth = 2.4;
        c.beginPath(); c.arc(r, r, r * 0.5, 0, TAU); c.stroke();
        c.shadowBlur = 0; dot(r * 0.14);
        break;
      case 2: // ESTRELA
        glow(18); c.strokeStyle = rgba(col, 0.9); c.lineWidth = 1.6;
        c.beginPath(); c.arc(r, r, r - 1.5, 0, TAU); c.stroke();
        c.beginPath();
        for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + (q * TAU) / 10, rr = q % 2 ? r * 0.38 : r * 0.86; c[q ? 'lineTo' : 'moveTo'](r + Math.cos(a) * rr, r + Math.sin(a) * rr); }
        c.closePath(); glow(20); c.strokeStyle = tint; c.lineWidth = 2.6; c.stroke();
        c.shadowBlur = 0; dot(r * 0.16);
        break;
      case 3: // HÉLICE: three curved blades
        glow(14); c.strokeStyle = col; c.lineWidth = 1.6;
        c.beginPath(); c.arc(r, r, r - 1.5, 0, TAU); c.stroke();
        glow(20); c.strokeStyle = tint; c.lineWidth = 3;
        for (let q = 0; q < 3; q++) {
          const a = (q * TAU) / 3;
          c.beginPath(); c.moveTo(r, r);
          c.quadraticCurveTo(r + Math.cos(a + 0.9) * r * 0.9, r + Math.sin(a + 0.9) * r * 0.9, r + Math.cos(a) * (r - 3), r + Math.sin(a) * (r - 3));
          c.stroke();
        }
        c.shadowBlur = 0; dot(r * 0.2);
        break;
      case 4: // HEXA
        poly(6, r, Math.PI / 6); c.fillStyle = rgba(col, 0.16); c.fill();
        glow(24); c.strokeStyle = tint; c.lineWidth = 3; c.stroke();
        poly(6, r * 0.52, 0); glow(10); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
        c.shadowBlur = 0; dot(r * 0.18);
        break;
      case 5: // ÁTOMO: three orbits
        glow(16); c.strokeStyle = tint; c.lineWidth = 1.8;
        for (let q = 0; q < 3; q++) { c.beginPath(); c.ellipse(r, r, r - 1.5, r * 0.36, (q * Math.PI) / 3, 0, TAU); c.stroke(); }
        c.shadowBlur = 0; dot(r * 0.24);
        break;
      case 6: { // PLASMA: a glowing orb
        const g = c.createRadialGradient(r, r, 0, r, r, r);
        g.addColorStop(0, WHITE); g.addColorStop(0.35, tint); g.addColorStop(0.75, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0));
        glow(28); c.beginPath(); c.arc(r, r, r, 0, TAU); c.fillStyle = g; c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = rgba(WHITE, 0.6); c.lineWidth = 1.4;
        c.beginPath(); c.arc(r, r, r * 0.62, 0.3, 1.6); c.stroke();
        c.beginPath(); c.arc(r, r, r * 0.62, 3.4, 4.7); c.stroke();
        break;
      }
      default: // NÚCLEO (original)
        c.strokeStyle = tint; c.lineWidth = 3.2;
        glow(24);
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(r, r, r - 1.8, k * TAU / 3 + 0.22, (k + 1) * TAU / 3 - 0.22);
          c.stroke();
        }
        glow(12);
        c.strokeStyle = col; c.lineWidth = 2;
        c.beginPath(); c.arc(r, r, r * 0.6, 0, TAU); c.stroke();
        c.beginPath(); c.arc(r, r, r * 0.24, 0, TAU);
        c.fillStyle = WHITE; c.fill();
    }
    c.shadowBlur = 0;
  }));
}

function brickSprite(kind, hp, col) {
  return cached('brick' + kind + hp + col, (res) => makeSprite(BW, BH, 24, res, (c) => {
    if (kind === 'wall') {
      const t = mix(col, '#000000', 0.45);
      roundRectPath(c, 1.5, 1.5, BW - 3, BH - 3, 4);
      c.fillStyle = rgba(t, 0.18); c.fill();
      c.save(); c.clip();
      c.strokeStyle = rgba(col, 0.35); c.lineWidth = 1.5;
      c.beginPath();
      for (let x = -BH; x < BW + BH; x += 9) { c.moveTo(x, BH); c.lineTo(x + BH, 0); }
      c.stroke();
      c.restore();
      roundRectPath(c, 1.5, 1.5, BW - 3, BH - 3, 4);
      neonStroke(c, t, t, 2.6, 0, 0, BW, BH, 0.4);
      return;
    }
    const t = tierTone(col, hp);
    roundRectPath(c, 1.5, 1.5, BW - 3, BH - 3, 5);
    c.fillStyle = rgba(t, 0.05 + hp * 0.03);
    c.fill();
    neonStroke(c, t, t, 2.2 + hp * 0.35, 0, 0, BW, BH, 0.55 + hp * 0.15);
    c.strokeStyle = rgba(t, 0.7);
    c.lineWidth = 1.4;
    if (hp >= 2) { roundRectPath(c, 6, 6, BW - 12, BH - 12, 3); c.stroke(); }
    if (hp >= 3) { c.beginPath(); c.moveTo(14, BH / 2); c.lineTo(BW - 14, BH / 2); c.stroke(); }
    if (hp >= 4) {
      c.fillStyle = WHITE;
      for (const [nx, ny] of [[3, 3], [BW - 6, 3], [3, BH - 6], [BW - 6, BH - 6]]) c.fillRect(nx, ny, 3, 3);
    }
  }));
}

export function coinSprite() {
  return cached('coin', (res) => makeSprite(COIN_R * 2, COIN_R * 2, 20, res, (c) => {
    const r = COIN_R;
    c.beginPath(); c.arc(r, r, r - 1.5, 0, TAU);
    c.fillStyle = rgba(COIN_COL, 0.22); c.fill();
    neonStroke(c, COIN_COL, COIN_COL, 2.6, 0, 0, r * 2, r * 2, 0.8);
    c.beginPath();
    for (let q = 0; q < 6; q++) { const a = (q * TAU) / 6 + Math.PI / 6; c[q ? 'lineTo' : 'moveTo'](r + Math.cos(a) * r * 0.5, r + Math.sin(a) * r * 0.5); }
    c.closePath(); c.strokeStyle = WHITE; c.lineWidth = 2; c.stroke();
  }));
}

const DW = 52, DH = 26;
export function dropSprite(type, col) {
  return cached('drop' + type + col, (res) => makeSprite(DW, DH, 24, res, (c) => {
    const good = POWERS[type].good;
    if (good) roundRectPath(c, 1.5, 1.5, DW - 3, DH - 3, (DH - 3) / 2);
    else {
      const k = 9;
      c.beginPath();
      c.moveTo(k, 1.5); c.lineTo(DW - k, 1.5); c.lineTo(DW - 1.5, DH / 2); c.lineTo(DW - k, DH - 1.5);
      c.lineTo(k, DH - 1.5); c.lineTo(1.5, DH / 2); c.closePath();
    }
    c.fillStyle = rgba(col, 0.14);
    c.fill();
    neonStroke(c, col, col, 2.6, 0, 0, DW, DH, 0.9);
    c.strokeStyle = c.fillStyle = WHITE;
    c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
    const m = DH / 2, cx = DW / 2;
    const line = (pts) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
    switch (type) {
      case 'multi': for (const dx of [-10, 0, 10]) { c.beginPath(); c.arc(cx + dx, m, 3, 0, TAU); c.fill(); } break;
      case 'wide':
        line([cx - 13, m, cx + 13, m]);
        line([cx - 9, m - 5, cx - 14, m, cx - 9, m + 5]);
        line([cx + 9, m - 5, cx + 14, m, cx + 9, m + 5]);
        break;
      case 'shrink':
        line([cx - 14, m - 5, cx - 8, m, cx - 14, m + 5]);
        line([cx + 14, m - 5, cx + 8, m, cx + 14, m + 5]);
        line([cx - 3, m, cx + 3, m]);
        break;
      case 'slow':   // a clock
        c.beginPath(); c.arc(cx, m, 8, 0, TAU); c.stroke();
        line([cx, m - 5, cx, m, cx + 4, m + 2]);
        break;
      case 'fast':
        line([cx - 9, m - 6, cx - 3, m, cx - 9, m + 6]);
        line([cx + 1, m - 6, cx + 7, m, cx + 1, m + 6]);
        break;
      case 'pierce':
        c.beginPath(); c.arc(cx - 6, m, 4, 0, TAU); c.stroke();
        line([cx - 15, m, cx + 14, m]);
        line([cx + 9, m - 5, cx + 14, m, cx + 9, m + 5]);
        break;
      case 'laser':
        line([cx - 8, m + 7, cx - 8, m - 4]); line([cx + 8, m + 7, cx + 8, m - 4]);
        line([cx - 8, m - 8, cx - 8, m - 7]); line([cx + 8, m - 8, cx + 8, m - 7]);
        break;
      case 'missile':
        c.beginPath();
        c.moveTo(cx + 13, m); c.lineTo(cx + 5, m - 5); c.lineTo(cx - 9, m - 5); c.lineTo(cx - 9, m + 5); c.lineTo(cx + 5, m + 5); c.closePath();
        c.stroke();
        line([cx - 9, m - 5, cx - 14, m - 9]); line([cx - 9, m + 5, cx - 14, m + 9]);
        break;
      case 'mega': c.beginPath(); c.arc(cx, m, 8, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, m, 2.5, 0, TAU); c.fill(); break;
      case 'mini': c.beginPath(); c.arc(cx, m, 3.5, 0, TAU); c.fill(); line([cx - 14, m, cx - 8, m]); line([cx + 8, m, cx + 14, m]); break;
      case 'life': line([cx, m - 7, cx, m + 7]); line([cx - 7, m, cx + 7, m]); break;
      case 'dark':   // a crossed-out sun
        c.beginPath(); c.arc(cx, m, 5, 0, TAU); c.stroke();
        line([cx - 11, m + 8, cx + 11, m - 8]);
        break;
      case 'invert':   // two arrows pointing opposite ways
        line([cx - 13, m - 4, cx + 9, m - 4]); line([cx + 4, m - 8, cx + 9, m - 4]);
        line([cx + 13, m + 4, cx - 9, m + 4]); line([cx - 4, m + 8, cx - 9, m + 4]);
        break;
      case 'wobble':   // a wavy path
        c.beginPath(); c.moveTo(cx - 14, m);
        c.bezierCurveTo(cx - 9, m - 11, cx - 5, m + 11, cx, m);
        c.bezierCurveTo(cx + 5, m - 11, cx + 9, m + 11, cx + 14, m);
        c.stroke();
        break;
      case 'drag':   // a platform with a weight under it
        line([cx - 13, m - 5, cx + 13, m - 5]);
        line([cx, m - 5, cx, m + 2]);
        c.beginPath(); c.rect(cx - 5, m + 2, 10, 6); c.fill();
        break;
      case 'repel':   // two arrows pushed away from a platform
        line([cx - 13, m + 7, cx + 13, m + 7]);
        line([cx - 3, m + 2, cx - 11, m - 6]); line([cx - 11, m - 1, cx - 11, m - 6, cx - 6, m - 6]);
        line([cx + 3, m + 2, cx + 11, m - 6]); line([cx + 11, m - 1, cx + 11, m - 6, cx + 6, m - 6]);
        break;
      case 'blind':   // a closed eye
        c.beginPath(); c.arc(cx, m - 7, 12, 0.45, Math.PI - 0.45); c.stroke();
        line([cx - 6, m + 3, cx - 8, m + 7]); line([cx, m + 5, cx, m + 9]); line([cx + 6, m + 3, cx + 8, m + 7]);
        break;
      case 'ghost':
        c.lineWidth = 1.6;
        line([cx - 2, m - 8, cx - 2, m + 8]); line([cx + 3, m - 8, cx + 3, m + 8]);
        c.lineWidth = 2.4;
        c.setLineDash([3, 3]);
        c.beginPath(); c.arc(cx - 9, m, 5, 0, TAU); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.arc(cx + 11, m, 5, 0, TAU); c.stroke();
        break;
    }
  }));
}

export function drawAbilityIcon(c, type, x, y, s, color) {
  c.save();
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  if (type === 'megalaser') {
    c.moveTo(x, y + s); c.lineTo(x, y - s); c.stroke();
    c.beginPath(); c.moveTo(x - s * 0.6, y + s); c.lineTo(x + s * 0.6, y + s); c.stroke();
    c.beginPath(); c.arc(x, y + s * 0.3, s * 0.35, 0, TAU); c.fill();
  } else if (type === 'shock') {
    c.arc(x, y + s * 0.6, s * 0.4, Math.PI, TAU); c.stroke();
    c.beginPath(); c.arc(x, y + s * 0.6, s * 0.85, Math.PI, TAU); c.stroke();
    c.beginPath(); c.arc(x, y + s * 0.6, s * 1.3, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  } else if (type === 'shield') {
    c.moveTo(x - s, y - s * 0.6); c.lineTo(x, y - s); c.lineTo(x + s, y - s * 0.6); c.lineTo(x + s * 0.7, y + s * 0.5); c.lineTo(x, y + s); c.lineTo(x - s * 0.7, y + s * 0.5); c.closePath(); c.stroke();
  } else if (type === 'magnet') {
    c.arc(x, y - s * 0.1, s * 0.75, Math.PI, 0, false); c.lineTo(x + s * 0.75, y + s * 0.8);
    c.moveTo(x - s * 0.75, y - s * 0.1); c.lineTo(x - s * 0.75, y + s * 0.8); c.stroke();
    c.beginPath(); c.moveTo(x - s, y + s * 0.8); c.lineTo(x - s * 0.5, y + s * 0.8); c.moveTo(x + s * 0.5, y + s * 0.8); c.lineTo(x + s, y + s * 0.8); c.stroke();
  } else if (type === 'slow') {
    c.arc(x, y, s, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 0.65); c.moveTo(x, y); c.lineTo(x + s * 0.45, y + s * 0.2); c.stroke();
    c.beginPath(); c.moveTo(x - s * 1.35, y - s * 0.5); c.lineTo(x - s * 1.35, y + s * 0.5); c.stroke();
  } else if (type === 'bolt') {
    c.moveTo(x + s * 0.3, y - s); c.lineTo(x - s * 0.45, y + s * 0.1); c.lineTo(x + s * 0.15, y + s * 0.1); c.lineTo(x - s * 0.3, y + s); c.stroke();
    c.beginPath(); c.arc(x + s * 0.75, y - s * 0.55, s * 0.18, 0, TAU); c.arc(x - s * 0.8, y + s * 0.6, s * 0.18, 0, TAU); c.fill();
  } else if (type === 'width') {
    c.moveTo(x - s, y); c.lineTo(x + s, y);
    c.moveTo(x - s * 0.6, y - s * 0.4); c.lineTo(x - s, y); c.lineTo(x - s * 0.6, y + s * 0.4);
    c.moveTo(x + s * 0.6, y - s * 0.4); c.lineTo(x + s, y); c.lineTo(x + s * 0.6, y + s * 0.4); c.stroke();
  } else if (type === 'grana') {   // a coin with a mark
    c.arc(x, y, s, 0, TAU); c.stroke();
    c.beginPath(); c.arc(x, y, s * 0.62, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x, y - s * 0.35); c.lineTo(x, y + s * 0.35); c.stroke();
  } else if (type === 'recarga') {   // a circular arrow around a bolt
    c.arc(x, y, s, -Math.PI * 0.35, Math.PI * 1.35); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.45, y - s * 1.05); c.lineTo(x + s * 0.62, y - s * 0.68); c.lineTo(x + s * 0.2, y - s * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x + s * 0.12, y - s * 0.5); c.lineTo(x - s * 0.22, y + s * 0.05); c.lineTo(x + s * 0.18, y + s * 0.05); c.lineTo(x - s * 0.12, y + s * 0.5); c.stroke();
  } else if (type === 'sorte') {   // four-leaf clover
    for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.42 - s * 0.15, s * 0.36, 0, TAU); c.stroke(); }
    c.beginPath(); c.moveTo(x, y - s * 0.15); c.quadraticCurveTo(x + s * 0.1, y + s * 0.6, x + s * 0.4, y + s); c.stroke();
  } else if (type === 'vida') {   // heart
    c.moveTo(x, y + s * 0.85);
    c.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.55, y - s * 1.1, x, y - s * 0.35);
    c.bezierCurveTo(x + s * 0.55, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.85);
    c.stroke();
  } else if (type === 'pesado') {   // a heavy disc dropping
    c.arc(x, y - s * 0.2, s * 0.62, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x - s * 0.9, y + s * 0.65); c.lineTo(x - s * 0.9, y + s); c.moveTo(x, y + s * 0.65); c.lineTo(x, y + s * 1.05); c.moveTo(x + s * 0.9, y + s * 0.65); c.lineTo(x + s * 0.9, y + s); c.stroke();
  }
  c.restore();
}

// Trail looks (bought with coins in BREAKERS).
export const TRAILS = [
  { name: 'PADRÃO', cost: 0 },
  { name: 'FAÍSCAS', cost: 30 },
  { name: 'PRISMA', cost: 50 },
  { name: 'PALETA', cost: 60 },
  { name: 'HÉLICE DUPLA', cost: 70 },
  { name: 'ECO', cost: 95 },
  { name: 'DESLIGADO', cost: 0 },
];

// style: index in TRAILS; pal: platform palette colors (PALETA); t: time
export function drawTrail(c, path, hx, hy, col, maxLen = TRAIL_LEN, r = BALL_R, style = 0, pal = null, t = 0) {
  if (gfx.trail <= 0 || style === 6) return;
  const pts = path.concat([{ x: hx, y: hy }]);
  const n = pts.length;
  if (n < 2) return;
  maxLen *= Math.min(1, gfx.trail);
  const tint = mix(col, WHITE, 0.6);
  c.lineCap = 'round';
  const d = new Array(n);
  d[n - 1] = 0;
  for (let i = n - 2; i >= 0; i--) d[i] = d[i + 1] + Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
  let first = 0;
  while (first < n - 1 && d[first] > maxLen) first++;
  first = Math.max(0, first - 1);
  const fade = (dd) => { const m = Math.max(0, 1 - dd / maxLen); return m * m; };
  // points every `sp` px from the head backwards: fn(x, y, dist, normalX, normalY)
  const walk = (sp, fn) => {
    let tg = 0;
    for (let i = n - 1; i > first; i--) {
      const a = pts[i], b = pts[i - 1], L = d[i - 1] - d[i];
      if (L < 0.01) continue;
      while (tg <= d[i - 1] && tg <= maxLen) {
        const u = (tg - d[i]) / L;
        fn(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, tg, -(b.y - a.y) / L, (b.x - a.x) / L);
        tg += sp;
      }
    }
  };
  // classic tapered tube; colorAt(dist) picks the color of the wide passes
  const tube = (colorAt, lite = gfx.trail < 0.75) => {
    const passes = lite
      ? [[r * 0.9, 0.7, false], [Math.max(2, r * 0.19), 0.9, true]]
      : [[r * 1.7, 0.16, false], [r * 0.8, 0.8, false], [Math.max(2, r * 0.19), 0.9, true]];
    for (const [w, alpha, core] of passes) {
      c.lineWidth = w;
      for (let i = first; i < n - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (d[i] - d[i + 1] < 0.5) continue;
        const dm = (d[i] + d[i + 1]) / 2, m = fade(dm);
        if (m <= 0) continue;
        c.strokeStyle = core ? rgba(tint, alpha * m) : colorAt(dm, alpha * m);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
    }
  };
  const line = (w, color, alpha) => {
    c.lineWidth = w;
    for (let i = first; i < n - 1; i++) {
      const m = fade((d[i] + d[i + 1]) / 2);
      if (m <= 0 || d[i] - d[i + 1] < 0.5) continue;
      c.strokeStyle = rgba(color, alpha * m);
      c.beginPath(); c.moveTo(pts[i].x, pts[i].y); c.lineTo(pts[i + 1].x, pts[i + 1].y); c.stroke();
    }
  };
  switch (style) {
    case 1: // FAÍSCAS: a thin line and jittering sparks
      line(Math.max(2, r * 0.25), col, 0.6);
      walk(13, (x, y, dd, nx, ny) => {
        const m = fade(dd), j = Math.sin(dd * 0.37 + t * 31) * r * 0.55;
        const sz = 1.5 + r * 0.28 * Math.sqrt(m);
        c.fillStyle = rgba(Math.floor(dd / 13) % 2 ? WHITE : col, 0.95 * m);
        c.fillRect(x + nx * j - sz / 2, y + ny * j - sz / 2, sz, sz);
      });
      break;
    case 2: // PRISMA: the hue runs along the trail
      tube((dd, al) => `hsla(${(dd * 0.55 + t * 140) % 360},100%,62%,${al})`);
      break;
    case 3: { // PALETA: the platform's colors flow along the trail
      const P = pal && pal.length ? pal : [col, WHITE];
      tube((dd, al) => rgba(samplePal(P, dd / maxLen * 0.9 - t * 0.35), al));
      break;
    }
    case 4: { // HÉLICE DUPLA: two strands twisting around the path
      const A = [], B = [];
      walk(5, (x, y, dd, nx, ny) => {
        const o = Math.sin(dd * 0.07 - t * 10) * r * 0.75;
        A.push([x + nx * o, y + ny * o, dd]); B.push([x - nx * o, y - ny * o, dd]);
      });
      for (const [S, cc] of [[A, col], [B, tint]]) {
        c.lineWidth = Math.max(2, r * 0.22);
        for (let i = 0; i < S.length - 1; i++) {
          c.strokeStyle = rgba(cc, 0.9 * fade(S[i][2]));
          c.beginPath(); c.moveTo(S[i][0], S[i][1]); c.lineTo(S[i + 1][0], S[i + 1][1]); c.stroke();
        }
      }
      break;
    }
    case 5: // ECO: fading afterimages of the disc
      line(Math.max(2, r * 0.3), col, 0.35);
      walk(30, (x, y, dd) => {
        if (dd < 10) return;
        const m = fade(dd);
        c.beginPath(); c.arc(x, y, r * (0.55 + 0.45 * m), 0, TAU);
        c.strokeStyle = rgba(tint, 0.8 * m); c.lineWidth = 2; c.stroke();
      });
      break;
    default:
      tube((dd, al) => rgba(col, al));
  }
}

export function trimTrail(path, hx, hy, maxLen = TRAIL_LEN) {
  let total = 0;
  for (let i = 0; i < path.length; i++) {
    const n = path[i + 1] || { x: hx, y: hy };
    total += Math.hypot(n.x - path[i].x, n.y - path[i].y);
  }
  while (total > maxLen && path.length) {
    const a = path[0], n = path[1] || { x: hx, y: hy };
    const seg = Math.hypot(n.x - a.x, n.y - a.y);
    const ex = total - maxLen;
    if (seg <= ex && path.length > 1) { path.shift(); total -= seg; }
    else { const k = Math.min(1, ex / seg); a.x += (n.x - a.x) * k; a.y += (n.y - a.y) * k; total = maxLen; }
  }
}

function borderPath(c, top, bottom) {
  c.beginPath();
  c.moveTo(LEFT + CR, bottom);
  c.arcTo(LEFT, bottom, LEFT, bottom - CR, CR);
  c.lineTo(LEFT, top + CR);
  c.arcTo(LEFT, top, LEFT + CR, top, CR);
  c.lineTo(RIGHT - CR, top);
  c.arcTo(RIGHT, top, RIGHT, top + CR, CR);
  c.lineTo(RIGHT, bottom - CR);
  c.arcTo(RIGHT, bottom, RIGHT - CR, bottom, CR);
}

// Border sampled by arc length, so lights can travel along it.
function sampleBorder(top, bottom) {
  const xs = [], ys = [];
  const arc = (cx, cy, a0, a1) => { for (let k = 0; k <= 8; k++) { const a = a0 + ((a1 - a0) * k) / 8; xs.push(cx + Math.cos(a) * CR); ys.push(cy + Math.sin(a) * CR); } };
  const line = (x0, y0, x1, y1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8)); for (let k = 1; k < n; k++) { xs.push(x0 + ((x1 - x0) * k) / n); ys.push(y0 + ((y1 - y0) * k) / n); } };
  arc(LEFT + CR, bottom - CR, Math.PI / 2, Math.PI);
  line(LEFT, bottom - CR, LEFT, top + CR);
  arc(LEFT + CR, top + CR, Math.PI, Math.PI * 1.5);
  line(LEFT + CR, top, RIGHT - CR, top);
  arc(RIGHT - CR, top + CR, Math.PI * 1.5, Math.PI * 2);
  line(RIGHT, top + CR, RIGHT, bottom - CR);
  arc(RIGHT - CR, bottom - CR, 0, Math.PI / 2);
  const s = [0];
  for (let i = 1; i < xs.length; i++) s.push(s[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
  return { xs, ys, s, L: s[s.length - 1] };
}

// ---------- game ----------
export class Game {
  constructor(hooks) {
    this.hooks = hooks;
    this.H = 1280;
    this.top = 120;
    this.plat = { shape: 0, pal: 0, emb: 0 };
    this.col = '#00e5ff';
    this.t = 0;
    this.keys = { left: false, right: false };
    this.particles = [];
    this.floats = [];
    this.rings = [];
    this.pulses = [];
    this.padPulses = [];
    this.wells = [];
    this.portals = [];
    this.beams = [];
    this.bars = [];
    this.coins = [];
    this.borderGlow = 0;
    this.grid = null;
    this.bp = null;
    this.tutorial = false;
    this.speedMul = 1;
    this.furyMul = 1;
    this.infinite = false;
    this.dropChance = DROP_CHANCE;
    this.index = 0;
    this.ability = null;      // { type, lvl } active perk from BREAKERS
    this.passive = null;      // { type, lvl } passive perk from BREAKERS
    this.energy = 0;
    this.abil = null;         // running active perk state
  }

  get bottom() { return this.H - BOTTOM_OFF; }
  get mirror() { return !!this.effects && !!this.effects.invert; }   // INVERTIDO: controls are mirrored
  pLvl(k) { return this.passive && this.passive.type === k ? this.passive.lvl : 0; }
  get shape() { return SHAPES[this.plat.shape]; }
  get world() { return this.stage.world; }
  palette() { return paletteColors(this.plat.pal, this.col); }
  emit(name, data) { if (this.hooks.onEvent) this.hooks.onEvent(name, data); }

  setLayout(H, top) {
    this.H = H;
    this.top = top;
    this.grid = null;
    this.bp = sampleBorder(top, this.bottom);
    if (this.paddle) this.paddle.y = H - PADDLE_OFF;
  }

  setColor(col) { this.col = col; this.grid = null; }

  newGame(index = 0, score = 0) {
    this.index = index;
    this.score = score;   // the run's score carries over until a game over
    this.lives = 3;
    this.shake = 0;
    this.particles = [];
    this.floats = [];
    this.paddle = { x: W / 2, tx: W / 2, y: this.H - PADDLE_OFF, hw: BASE_HW, lastX: W / 2, speed: 0 };
    this.energy = 0;
    this.loadLevel();
  }

  get isLast() { return this.index >= TOTAL_STAGES - 1; }

  loadLevel() {
    const st = this.stage = getStage(this.index);
    this.mech = st.mech;
    this.mechs = st.mechs;
    this.mt = 0;
    this.press = 0;
    this.furyMul = 1;
    music.setFury(false);
    const y0 = this.top + 60;
    this.bricks = [];
    st.rows.forEach((row, r) => {
      for (let c = 0; c < COLS; c++) {
        const ch = row[c];
        let kind = 'n', hp = +ch || 0, inf = false;
        if (ch === 'V') { hp = 2; inf = true; }   // CONTÁGIO: an infected brick
        const armor = ch === 'B';                  // BLINDAGEM: shield on the underside
        if (armor) hp = 2;
        if (ch === 'X') { kind = 'wall'; hp = 1; }
        if (ch === 'E') { kind = 'exp'; hp = 1; }
        if (!hp) continue;
        const x = MARGIN + c * (BW + GAP);
        this.bricks.push({ x, baseX: x, y: y0 + r * (BH + GAP), w: BW, h: BH, hp, kind, inf, armor, row: r, col: c, flash: 0, dead: false });
      }
    });
    this.alive = this.bricks.filter((b) => b.kind !== 'wall').length;
    this.rows = [];
    if (this.mechs.includes('slide')) for (let r = 0; r < st.rows.length; r++) this.rows[r] = this.rowMotion(r);
    const lowY = this.bricks.length ? Math.max(...this.bricks.map((b) => b.y + b.h)) : this.top + 200;
    const span = this.H - PADDLE_OFF - lowY;
    this.wells = (st.wells || []).map(([xf, yf]) => ({ bx: W * xf, by: lowY + span * yf, x: W * xf, y: lowY + span * yf, s: 9e6, core: true, orbit: !!st.orbit }));
    // PORTAIS: pairs of gates in the open field
    this.portals = (st.portals || []).map(([x1, y1, x2, y2]) => ({ a: { x: W * x1, y: lowY + span * y1 }, b: { x: W * x2, y: lowY + span * y2 } }));
    // SEGURANÇA: security beams across part of the field; on, they bounce the disc
    this.beams = (st.beams || []).map(([x0, x1, yf, ph]) => ({ x0: Math.max(LEFT + 4, W * x0), x1: Math.min(RIGHT - 4, W * x1), y: lowY + span * yf, ph: ph || 0, on: false, warn: false }));
    // FASE: on every other row, alternating bricks drift in and out of phase
    if (this.mechs.includes('phase') && !st.boss) {
      for (const br of this.bricks) if (br.kind === 'n' && br.row % 2 === 1) br.phase = br.col % 2;
    }
    // TARJA: censor bars sweep the bricks (in boss fights only the boss calls them)
    this.bars = [];
    for (let i = 0; i < (st.bars || 0); i++) this.bars.push({ ph: i * 2.3 });
    this.barY0 = st.boss ? this.top + 430 : this.top + 52;
    this.barRange = st.boss ? 180 : Math.max(60, lowY - this.top - 52 - BAR_H + 30);
    this.viralT = 5;
    this.holdT = 0;
    this.boss = st.boss ? createBoss(st.boss.type, this) : null;
    this.bandT = 9;
    if (this.boss) this.fillBand(12);
    this.worldDone = false;
    this.blasts = [];
    this.bolts = [];
    this.missiles = [];
    this.shots = [];
    this.rings = [];
    this.pulses = [];
    this.padPulses = [];
    this.drops = [];
    this.coins = [];
    this.effects = {};
    this.laserCd = 0;
    this.abil = null;
    this.combo = 0;
    this.breaks = 0;
    this.clearT = 0;
    this.stageCoins = 0;     // coins caught in this stage (the ad doubles them)
    this.offered = false;
    this.rewardHold = false;
    // +1% disc speed per district on top of the per-stage ramp
    this.baseSpeed = Math.min(620 + this.index * 14, 880) * (1 + 0.01 * st.w);
    this.resetBall();
    const vl = this.pLvl('vida');
    if (vl && this.lives < 3 + vl) { this.lives++; this.float('+1 VIDA', W / 2, this.H - PADDLE_OFF - 120, 22); }
    const sub = st.name || (this.world.name + (this.mechs.length ? '  ·  ' + this.mechs.map((m) => MECHS[m].name).join(' + ') : ''));
    this.banner = { text: st.boss ? 'CHEFÃO' : stageLabel(this.index), sub: st.boss ? st.boss.name : sub, t: 2.4, max: 2.4 };
    music.play(st.boss ? this.world.bossMusic : this.world.music);
    this.emit('level');
  }

  rowMotion(r, rb = null) {
    rb = rb || this.bricks.filter((b) => b.row === r);
    if (!rb.length) return { A: 0 };
    const minX = Math.min(...rb.map((b) => b.baseX)), maxX = Math.max(...rb.map((b) => b.baseX + b.w));
    return { A: Math.max(0, Math.min(minX - (LEFT + 10), RIGHT - 10 - maxX)), sp: 0.7 + (r % 3) * 0.2, ph: r * 1.3 };
  }

  get dangerY() { return this.paddle.y - 120; }

  resetBall() {
    this.balls = [this.makeBall(this.paddle.x, this.paddle.y - BALL_R - 6, 0, 0, true)];
  }

  makeBall(x, y, vx, vy, held) {
    return { x, y, vx, vy, held, r: BALL_R * this.discScale(), s: this.baseSpeed * this.speedFactor(), path: [{ x, y }],
      spin: Math.random() * TAU, lost: false, gk: 0, cap: null };
  }

  speedFactor() {
    const e = this.effects.speed;
    return (e ? (e.type === 'slow' ? 0.72 : 1.3) : 1) * this.speedMul * this.furyMul;
  }

  sizeFactor() {
    const e = this.effects.size;
    const base = 1 + 0.08 * this.pLvl('width');
    if (!e) return base;
    return base * (e.lvl > 0 ? 1 + 0.22 * e.lvl : Math.pow(0.8, -e.lvl));
  }

  discScale() {
    const e = this.effects && this.effects.disc;
    return e ? (e.type === 'mega' ? 1.75 : 0.6) : 1;
  }

  get holding() { return this.balls.some((b) => b.held); }

  launch() {
    this.holdT = 0;
    let any = false;
    for (const b of this.balls) {
      if (!b.held) continue;
      // magnet: aim by where the disc sits on the platform
      const ang = b.hold ? clamp(b.hold / this.paddle.hw, -1, 1) * 0.9 : (Math.random() * 2 - 1) * 0.25;
      b.hold = 0;
      b.held = false;
      b.heavy = this.pLvl('pesado');
      b.vx = Math.sin(ang) * b.s;
      b.vy = -Math.cos(ang) * b.s;
      b.path = [{ x: b.x, y: b.y }];
      any = true;
    }
    if (any) sfx.launch();
  }

  mark(b) { b.pn = 0; b.path.push({ x: b.x, y: b.y }); }   // pn: portal jumps since the last bounce
  solid(br) { return !br.dead; }

  // ---------- update ----------
  update(dt) {
    this.t += dt;
    this.mt += dt;
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    this.shake = Math.max(0, this.shake - dt * 3);
    this.borderGlow = Math.max(0, this.borderGlow - dt * 2.5);

    for (const k in this.effects) {
      if (this.effects[k].ammo) continue;
      this.effects[k].t -= dt;
      if (this.effects[k].t <= 0) delete this.effects[k];
    }

    const p = this.paddle;
    const kdir = this.effects.invert ? -1 : 1;
    if (this.keys.left) p.tx -= 1000 * dt * kdir;
    if (this.keys.right) p.tx += 1000 * dt * kdir;
    p.hw += (BASE_HW * this.sizeFactor() - p.hw) * Math.min(1, dt * 10);
    const lo = LEFT + p.hw + 10, hi = RIGHT - p.hw - 10;
    p.tx = clamp(p.tx, lo, hi);
    if (this.abil && this.abil.type === 'megalaser') p.tx = p.x;   // MEGA LASER locks the platform in place
    p.x += (p.tx - p.x) * Math.min(1, dt * (this.effects.drag ? 4.5 : 30));   // PLATAFORMA LENTA
    if (p.hit) p.hit = Math.max(0, p.hit - dt / HIT_T);
    p.x = clamp(p.x, lo, hi);
    const inst = Math.abs(p.x - p.lastX) / dt;
    p.speed += (inst - p.speed) * Math.min(1, dt * 12);
    p.lastX = p.x;
    sfx.engine(p.speed);

    this.updateFx(dt);

    if (this.boss && this.boss.dead) {
      this.boss.update(dt);
      if (this.boss.deathT <= 0 && !this.worldDone) { this.worldDone = true; this.emit('worldClear'); }
      return;
    }

    if (this.clearT > 0 || this.rewardHold) {
      this.clearT -= dt;
      if (this.clearT <= 0) {
        if (!this.offered && this.stageCoins > 0 && !this.tutorial) {
          this.offered = true; this.rewardHold = true;
          this.emit('reward', this.stageCoins);
          return;
        }
        this.rewardHold = false;
        if (this.isLast) { this.worldDone = true; this.emit('worldClear'); return; }
        this.index++;
        this.loadLevel();
      }
      return;
    }

    this.updateMechanics(dt);
    if (this.boss) {
      this.boss.update(dt);
      // keep a supply of common bricks (power-up sources) during boss fights
      this.bandT -= dt;
      if (this.bandT <= 0) {
        this.bandT = this.boss.fury ? 7 : 9;
        const have = this.bricks.filter((b) => b.row >= 100 && !b.dead).length;
        if (have < 10) this.fillBand(4);
      }
    }

    // a disc left sitting on the platform launches by itself
    if (this.holding) { this.holdT += dt; if (this.holdT >= AUTO_LAUNCH) this.launch(); } else this.holdT = 0;

    const slow = this.abil && this.abil.type === 'slow' ? 0.5 : 1;   // CÂMERA LENTA
    const target = this.baseSpeed * this.speedFactor() * slow;
    const rTarget = BALL_R * this.discScale();
    // FANTASMA: the disc fades out as it nears the bricks and comes back on its way down
    let zoneY = -1e9;
    if (this.effects.ghost) {
      for (const br of this.bricks) if (!br.dead && br.y + br.h > zoneY) zoneY = br.y + br.h;
      if (this.boss && !this.boss.dead) zoneY = Math.max(zoneY, this.boss.cy + 60);
    }
    for (const b of this.balls) {
      if (b.fade === undefined) b.fade = 1;
      const hide = this.effects.ghost && !b.held && (b.y < zoneY || (b.vy < 0 && b.y < zoneY + 120));
      b.fade += ((hide ? 0 : 1) - b.fade) * Math.min(1, dt * 7);
      b.spin += dt * 9;
      b.r += (rTarget - b.r) * Math.min(1, dt * 8);
      if (b.held) { b.x = p.x + clamp(b.hold || 0, -p.hw * 0.8, p.hw * 0.8); b.y = p.y + Math.min(0, this.shape.y(0, p.hw)) - b.r - 6; b.path = [{ x: b.x, y: b.y }]; continue; }
      b.s += (target - b.s) * Math.min(1, dt * (slow < 1 ? 8 : 3));
      if (b.cap && this.boss) { this.boss.holdBall(b, dt); trimTrail(b.path, b.x, b.y); continue; }
      b.cap = null;
      this.moveBall(b, dt);
      this.checkPortals(b, dt);
      trimTrail(b.path, b.x, b.y);
    }

    this.updateWeapons(dt);
    this.updateAbility(dt);
    // the boss died during this step: its death already removed the discs, so
    // stop before the "no disc left" check below takes a life for it
    if (this.boss && this.boss.dead) return;

    for (const bl of this.blasts) { bl.t -= dt; if (bl.t <= 0) this.explode(bl.br); }
    this.blasts = this.blasts.filter((bl) => bl.t > 0);

    if (this.bricks.some((b) => b.dead)) this.bricks = this.bricks.filter((b) => !b.dead);
    for (const br of this.bricks) if (br.flash > 0) br.flash = Math.max(0, br.flash - dt * 5);

    if (!this.boss && this.alive <= 0 && !this.blasts.length) {
      this.clearT = 1.6;
      this.score += 10 * (this.index + 1);
      for (const b of this.balls) this.burst(b.x, b.y, 16);
      this.balls = [];
      this.drops = [];
      this.bolts = []; this.missiles = []; this.shots = [];
      this.collectCoins();
      sfx.clear();
      this.emit('chip', 10);
      this.emit('stageClear', this.index);
      this.emit('clear');
      return;
    }

    this.balls = this.balls.filter((b) => !b.lost);
    if (this.balls.length === 0) { this.loseLife(); return; }

    for (const d of this.drops) {
      d.y += 230 * dt;
      d.t += dt;
      if (!d.got && d.y + DH / 2 >= p.y - 30 && d.y - DH / 2 <= p.y + 34 && Math.abs(d.x - p.x) <= p.hw + DW / 2) {
        d.got = true;
        this.applyPower(d.type, d.n || 1);
      }
    }
    this.drops = this.drops.filter((d) => !d.got && d.y < this.bottom + 30);
    for (const q of this.coins) {
      q.vy = Math.min(300, q.vy + 520 * dt);
      q.y += q.vy * dt;
      q.t += dt;
      if (!q.got && q.y + COIN_R >= p.y - 30 && q.y - COIN_R <= p.y + 34 && Math.abs(q.x - p.x) <= p.hw + COIN_R) {
        q.got = true;
        this.stageCoins++;
        this.emit('coin', 1);
        sfx.coin();
        vibrate(10);
        this.float('+1 MOEDA', q.x, p.y - 60, 18);
        this.burst(q.x, p.y - 20, 6, 0.5, [COIN_COL, WHITE]);
      }
    }
    this.coins = this.coins.filter((q) => !q.got && q.y < this.bottom + 30);
  }

  // When a stage ends, coins still falling go straight to the player's wallet.
  collectCoins() {
    const left = this.coins.filter((q) => !q.got);
    this.coins = [];
    if (!left.length) return;
    for (const q of left) this.burst(q.x, q.y, 6, 0.5, [COIN_COL, WHITE]);
    this.stageCoins += left.length;
    this.emit('coin', left.length);
    sfx.coin();
    this.float('+' + left.length + (left.length > 1 ? ' MOEDAS' : ' MOEDA'), this.paddle.x, this.paddle.y - 60, 18);
  }

  updateMechanics(dt) {
    if (this.mechs.includes('slide') || this.rows[99]) {
      for (const br of this.bricks) {
        const r = this.rows[br.row];
        if (r && r.A) br.x = br.baseX + r.A * Math.sin(this.mt * r.sp + r.ph);
      }
    }
    // PRESSÃO: every brick creeps down; touching the alert line costs a life
    if (this.mechs.includes('descent') && !this.boss && this.bricks.length) {
      const v = 6 + this.stage.s * 0.7;
      let low = 0, high = Infinity;
      for (const br of this.bricks) {
        if (br.dead) continue;
        br.y += v * dt;
        low = Math.max(low, br.y + br.h); high = Math.min(high, br.y);
      }
      for (const q of this.beams) if (q.t === undefined) q.y += v * dt;
      this.press = clamp((low - (this.top + 200)) / (this.dangerY - (this.top + 200)), 0, 1);
      if (low >= this.dangerY && !this.holding) {
        const shift = Math.min(240, high - (this.top + 60));
        for (const br of this.bricks) br.y -= shift;
        for (const q of this.beams) if (q.t === undefined) q.y -= shift;
        this.float('PRESSÃO', W / 2, this.dangerY - 30, 30);
        this.ring(W / 2, this.dangerY, 400);
        this.balls = [];
        this.loseLife();
      }
    }
    for (const w of this.wells) {
      if (w.orbit) { w.x = W / 2 + 140 * Math.cos(this.mt * 0.6); w.y = w.by + 55 * Math.sin(this.mt * 0.6); }
    }
    // CONTÁGIO: while an infected brick lives, one of them grows a new brick now and then
    if (this.bricks.some((b) => b.inf && !b.dead)) {
      this.viralT -= dt;
      if (this.viralT <= 0) { this.viralT = this.boss ? 5 : 4.2; this.replicate(); }
    }
    // SEGURANÇA: fixed beams blink on and off; the boss's beams warn, stay on, then vanish
    if (this.beams.length) {
      for (const q of this.beams) {
        if (q.t !== undefined) { q.t -= dt; q.on = q.t < q.max - 0.8; q.warn = !q.on; continue; }
        const k = (this.mt + q.ph) % (BEAM_ON + BEAM_OFF);
        q.on = k < BEAM_ON; q.warn = !q.on && k > BEAM_ON + BEAM_OFF - 0.6;
      }
      this.beams = this.beams.filter((q) => q.t === undefined || q.t > 0);
    }
    // TARJA: temporary bars (called by the boss) run out
    if (this.bars.length) {
      for (const q of this.bars) if (q.t !== undefined) q.t -= dt;
      this.bars = this.bars.filter((q) => q.t === undefined || q.t > 0);
    }
    // FASE: each group spends PHASE_T seconds solid and PHASE_T out of phase
    const cyc = this.mt % (PHASE_T * 2), cur = cyc < PHASE_T ? 0 : 1;
    this.phaseWarn = PHASE_T - (cyc % PHASE_T) < 0.5;
    for (const br of this.bricks) if (br.phase !== undefined) br.out = br.phase === cur;
  }

  // CONTÁGIO: a random infected brick grows a common brick into a free cell next to it.
  replicate() {
    const inf = this.bricks.filter((b) => b.inf && !b.dead && !b.out);
    if (!inf.length) return;
    const src = inf[Math.floor(Math.random() * inf.length)];
    const dirs = [[0, -1], [0, 1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const r = src.row + dr, col = src.col + dc, y = src.y + dr * (BH + GAP);
      if (col < 0 || col >= COLS) continue;
      if (this.boss ? (r < 100 || r > 101) : (r < 0 || r > 11)) continue;
      if (y + BH > this.dangerY - 120) continue;
      if (this.bricks.some((b) => !b.dead && b.row === r && b.col === col)) continue;
      const step = dc * (BW + GAP);
      this.bricks.push({ x: src.x + step, baseX: src.baseX + step, y, w: BW, h: BH, hp: 1, kind: 'n', inf: false, row: r, col, flash: 1, dead: false });
      this.alive++;
      if (!this.boss && this.mechs.includes('slide')) this.rows[r] = this.rowMotion(r);
      this.ring(src.x + step + BW / 2, y + BH / 2, 60);
      return;
    }
  }

  // Boss ability: one of the common bricks of the boss stage becomes infected.
  infectBand() {
    const list = this.bricks.filter((b) => b.row >= 100 && !b.dead && !b.inf);
    if (!list.length) return;
    const br = list[Math.floor(Math.random() * list.length)];
    br.inf = true; br.hp = Math.max(br.hp, 2); br.flash = 1;
    this.ring(br.x + br.w / 2, br.y + br.h / 2, 90);
  }

  // Boss ability: some common bricks of the boss stage get a shield underneath.
  armorBand(n) {
    const list = this.bricks.filter((b) => b.row >= 100 && !b.dead && !b.armor && !b.inf);
    for (let i = 0; i < n && list.length; i++) {
      const br = list.splice(Math.floor(Math.random() * list.length), 1)[0];
      br.armor = true; br.hp = Math.max(br.hp, 2); br.flash = 1;
      this.ring(br.x + br.w / 2, br.y + br.h / 2, 70);
    }
  }

  // Boss ability: a security beam crosses part of the field for t seconds.
  addBeam(y, t) {
    if (this.beams.length >= 2) return;
    const w = (RIGHT - LEFT) * 0.55, x0 = LEFT + 4 + Math.random() * (RIGHT - LEFT - 8 - w);
    this.beams.push({ x0, x1: x0 + w, y, ph: 0, t, max: t, on: false, warn: true });
  }

  // Boss ability: a censor bar covers part of the field for t seconds.
  addBar(t) { if (this.bars.length < 2) this.bars.push({ ph: Math.random() * 6, t }); }
  barY(q) { return this.barY0 + this.barRange * (0.5 + 0.5 * Math.sin(this.mt * 0.55 + q.ph)); }

  portalColor(i) {
    if (i === 0) return this.col;
    const alt = PORTAL_ALT.filter((x) => x !== this.col.toLowerCase());
    return alt[(i - 1) % alt.length];
  }

  allPortals() {
    return this.boss && this.boss.portals ? this.portals.concat(this.boss.portals) : this.portals;
  }

  // A disc touching a gate comes out of its pair with the same velocity
  // (boss portals with flip send it back the way it came).
  checkPortals(b, dt) {
    if (b.pcd > 0) { b.pcd -= dt; return; }
    for (const P of this.allPortals()) {
      for (const [from, to] of [[P.a, P.b], [P.b, P.a]]) {
        if (Math.hypot(b.x - from.x, b.y - from.y) > PORTAL_R) continue;
        if (P.flip) { b.vx = -b.vx; b.vy = -b.vy; }
        let s = Math.hypot(b.vx, b.vy) || 1;
        b.pn = (b.pn || 0) + 1;
        if (b.pn >= 3) {
          b.pn = 0;
          b.vx += (to.x < W / 2 ? 1 : -1) * s * 0.6;
          const s2 = Math.hypot(b.vx, b.vy) || 1;
          b.vx = (b.vx / s2) * s; b.vy = (b.vy / s2) * s;
          this.fixAngle(b);
          s = Math.hypot(b.vx, b.vy) || 1;
        }
        b.x = to.x + (b.vx / s) * (PORTAL_R + 6);
        b.y = to.y + (b.vy / s) * (PORTAL_R + 6);
        b.path = [{ x: b.x, y: b.y }];
        b.pcd = 0.35;
        this.ring(from.x, from.y, 70); this.ring(to.x, to.y, 70);
        sfx.portal();
        return;
      }
    }
  }

  // Boss spawns a sliding row of 1-hit shield bricks.
  summonRow(y) {
    const rb = [];
    for (let c = 2; c <= 6; c++) {
      const x = MARGIN + c * (BW + GAP);
      const br = { x, baseX: x, y, w: BW, h: BH, hp: 1, kind: 'n', row: 99, col: c, flash: 1, dead: false };
      this.bricks.push(br); rb.push(br);
    }
    this.alive += rb.length;
    this.rows[99] = this.rowMotion(99, rb);
    this.rows[99].sp = 1.2;
    this.ring(W / 2, y + BH / 2, 300);
  }

  // Two rows of common bricks in a boss stage; adds up to n bricks in free slots.
  fillBand(n) {
    const y0 = this.boss.bandY;
    const free = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < COLS; c++) {
      if (!this.bricks.some((b) => !b.dead && b.row === 100 + r && b.col === c)) free.push([r, c]);
    }
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    for (const [r, c] of free.slice(0, n)) {
      const x = MARGIN + c * (BW + GAP);
      const hp = this.boss.fury && Math.random() < 0.3 ? 2 : 1;
      this.bricks.push({ x, baseX: x, y: y0 + r * (BH + GAP), w: BW, h: BH, hp, kind: 'n', row: 100 + r, col: c, flash: 1, dead: false });
      this.alive++;
    }
  }

  enemyShot(x, y, vx, vy) { this.shots.push({ x, y, vx, vy, t: 0 }); }

  updateWeapons(dt) {
    const p = this.paddle;
    // lasers: a fixed number of shots (each shot = both guns firing)
    const lz = this.effects.laser;
    if (lz) {
      this.laserCd -= dt;
      if (this.laserCd <= 0) {
        this.laserCd = 0.32;
        for (const s of [-1, 1]) this.bolts.push({ x: p.x + s * p.hw * 0.8, y: p.y - 10 });
        sfx.laser();
        if (--lz.t <= 0) delete this.effects.laser;
      }
    }
    for (const b of this.bolts) {
      for (let k = 0; k < 3 && !b.dead; k++) {
        b.y -= 1300 * dt / 3;
        if (b.y < this.top + 4) { b.dead = true; this.burst(b.x, this.top + 4, 3, 0.4); break; }
        const br = this.bricks.find((q) => !q.dead && !q.out && b.x > q.x - 2 && b.x < q.x + q.w + 2 && b.y > q.y && b.y < q.y + q.h);
        if (br) { b.dead = true; if (br.kind === 'wall' || br.armor) br.flash = 0.6; else this.damage(br, false); break; }
        if (this.boss) {
          const h = this.boss.hitShot(b.x, b.y, 4);
          if (h) { b.dead = true; if (h === 'core') this.boss.damage(0.34, false, true); else sfx.clang(); this.burst(b.x, b.y, 4, 0.5); break; }
        }
      }
    }
    this.bolts = this.bolts.filter((b) => !b.dead);
    // missiles
    for (const m of this.missiles) {
      // homing: straight at the boss core when no brick stands in the way,
      // otherwise toward the nearest breakable brick
      let tx = null, ty = null, bd = Infinity;
      const boss = this.boss && !this.boss.dead ? this.boss : null;
      if (boss && !this.blocked(m.x, m.y, boss.cx, boss.cy)) { tx = boss.cx; ty = boss.cy; }
      else {
        for (const q of this.bricks) {
          if (q.dead || q.out || q.kind === 'wall') continue;
          const qx = q.x + q.w / 2, qy = q.y + q.h / 2, d = (qx - m.x) ** 2 + (qy - m.y) ** 2;
          if (d < bd) { bd = d; tx = qx; ty = qy; }
        }
        if (tx === null && boss) { tx = boss.cx; ty = boss.cy; }
      }
      const sp = Math.min(1100, 320 + m.t * 1400);
      let ang = Math.atan2(m.vy, m.vx);
      if (tx !== null && m.t > 0.12) {
        let da = Math.atan2(ty - m.y, tx - m.x) - ang;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        const turn = 7 * dt;
        ang += clamp(da, -turn, turn);
      }
      m.vx = Math.cos(ang) * sp; m.vy = Math.sin(ang) * sp;
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.t += dt;
      const ex = m.x - Math.cos(ang) * 16, ey = m.y - Math.sin(ang) * 16;
      if (Math.random() < 0.8 * gfx.fx) this.particles.push({ x: ex + (Math.random() - 0.5) * 4, y: ey, vx: -Math.cos(ang) * 120 + (Math.random() - 0.5) * 60, vy: -Math.sin(ang) * 120, life: 0.35, max: 0.35, col: WHITE, sq: true });
      const hitBrick = this.bricks.some((q) => !q.dead && !q.out && m.x > q.x - 8 && m.x < q.x + q.w + 8 && m.y > q.y - 8 && m.y < q.y + q.h + 8);
      const hitBoss = this.boss && this.boss.hitShot(m.x, m.y, 12);
      const out = m.y < this.top + 12 || m.x < LEFT + 8 || m.x > RIGHT - 8 || m.y > this.bottom || m.t > 4;
      if (hitBrick || hitBoss || out) { m.dead = true; this.missileBlast(m.x, m.y); }
    }
    this.missiles = this.missiles.filter((m) => !m.dead);
    // boss shots
    for (const s of this.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
      if (Math.abs(s.x - p.x) < p.hw + 6 && Math.abs(s.y - (p.y + 4)) < 16) {
        s.dead = true;
        this.addSize(-1, 6);
        this.float('ATINGIDO', p.x, p.y - 70, 22);
        this.ring(s.x, s.y, 70);
        this.shake = Math.max(this.shake, 0.4);
        sfx.hurt(); vibrate(40);
      } else if (s.y > this.bottom + 20 || s.x < 0 || s.x > W) s.dead = true;
    }
    this.shots = this.shots.filter((s) => !s.dead);
  }

  // Is there a solid brick (walls included) on the straight line between two points?
  blocked(x0, y0, x1, y1) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 10));
    for (const q of this.bricks) {
      if (q.dead || q.out) continue;
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        if (x > q.x - 8 && x < q.x + q.w + 8 && y > q.y - 8 && y < q.y + q.h + 8) return true;
      }
    }
    return false;
  }

  missileBlast(x, y) {
    this.ring(x, y, MISSILE_R);
    this.ring(x, y, MISSILE_R * 0.6);
    this.burst(x, y, 26, 1.4);
    this.shake = Math.max(this.shake, 0.55);
    sfx.blast();
    for (const br of this.bricks) {
      if (br.dead || br.out || br.kind === 'wall') continue;
      if (Math.hypot(br.x + br.w / 2 - x, br.y + br.h / 2 - y) < MISSILE_R + 20) this.damage(br, false, 2);
    }
    if (this.boss && !this.boss.dead && Math.hypot(this.boss.cx - x, this.boss.cy - y) < MISSILE_R + this.boss.coreR) this.boss.damage(1, false, true);
  }

  updateFx(dt) {
    const fr = Math.pow(0.04, dt);
    for (const q of this.particles) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.vx *= fr; q.vy *= fr;
      q.life -= dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const f of this.floats) { f.y -= 50 * dt; f.t -= dt; }
    this.floats = this.floats.filter((f) => f.t > 0);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < r.max);
    for (const q of this.pulses) q.t += dt;
    this.pulses = this.pulses.filter((q) => q.t < 1);
    for (const q of this.padPulses) q.t += dt;
    this.padPulses = this.padPulses.filter((q) => q.t < 0.5);
  }

  borderHit(x, y) {
    this.borderGlow = Math.min(1, this.borderGlow + 0.6);
    const bp = this.bp;
    let best = 0, bd = Infinity;
    for (let i = 0; i < bp.xs.length; i += 2) {
      const d = (bp.xs[i] - x) ** 2 + (bp.ys[i] - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    this.pulses.push({ x, y, s: bp.s[best], t: 0 });
    if (this.pulses.length > 10) this.pulses.shift();
  }

  allWells() {
    return this.boss ? this.wells.concat(this.boss.wells ? this.boss.wells() : []) : this.wells;
  }

  moveBall(b, dt) {
    const sp = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / sp) * b.s;
    b.vy = (b.vy / sp) * b.s;
    const n = Math.max(1, Math.ceil((b.s * dt) / (Math.min(b.r, BALL_R) * 0.4)));
    const h = dt / n;
    const pierce = !!this.effects.pierce;
    const r = b.r;
    const top = this.top;
    if (this.effects.wobble) {
      const a = Math.sin(this.t * 7) * 1.6 * dt, cs = Math.cos(a), sn = Math.sin(a);
      const vx = b.vx * cs - b.vy * sn;
      b.vy = b.vx * sn + b.vy * cs; b.vx = vx;
      this.fixAngle(b);
      if (++b.gk % 6 === 0) this.mark(b);
    }
    const wells = this.allWells();
    const mag = this.abil && this.abil.type === 'magnet' && this.abil.t > 0;
    const rep = !!this.effects.repel;
    const beams = this.beams;
    for (let i = 0; i < n; i++) {
      if (wells.length) this.applyGravity(b, h, wells);
      if (mag && b.vy > 0) this.magnetPull(b, h);
      else if (rep && b.vy > 0) this.repelPush(b, h);
      const py = b.y;
      b.x += b.vx * h;
      b.y += b.vy * h;
      let hit = null;
      for (const q of beams) {
        if (!q.on || b.x < q.x0 - r || b.x > q.x1 + r) continue;
        if (b.vy > 0 && py + r <= q.y + 1 && b.y + r > q.y) { b.y = q.y - r; b.vy = -Math.abs(b.vy); }
        else if (b.vy < 0 && py - r >= q.y - 1 && b.y - r < q.y) { b.y = q.y + r; b.vy = Math.abs(b.vy); }
        else continue;
        this.fixAngle(b); this.mark(b); sfx.wall(); this.ring(b.x, q.y, 50);
        break;
      }
      if (b.y < top + CR && (b.x < LEFT + CR || b.x > RIGHT - CR)) {
        const cx = b.x < LEFT + CR ? LEFT + CR : RIGHT - CR, cy = top + CR;
        const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
        if (d > CR - r && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot > 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
          const rr = Math.max(1, CR - r);
          b.x = cx + nx * rr; b.y = cy + ny * rr;
          hit = [cx + nx * CR, cy + ny * CR];
        }
      } else {
        if (b.x < LEFT + r) { b.x = LEFT + r; b.vx = Math.abs(b.vx); hit = [LEFT, b.y]; }
        else if (b.x > RIGHT - r) { b.x = RIGHT - r; b.vx = -Math.abs(b.vx); hit = [RIGHT, b.y]; }
        if (b.y < top + r) { b.y = top + r; b.vy = Math.abs(b.vy); hit = [b.x, top]; }
      }
      if (hit) { this.fixAngle(b); this.mark(b); sfx.wall(); this.borderHit(hit[0], hit[1]); }
      if (this.boss && this.boss.collide(b)) { this.fixAngle(b); this.mark(b); if (b.cap) return; }
      if (b.vy > 0 && this.paddleHit(b)) { if (this.abil && this.abil.type === 'magnet' && this.abil.t > 0) { b.held = true; b.hold = b.x - this.paddle.x; return; } continue; }
      if (this.abil && this.abil.type === 'shield' && this.abil.t > 0 && b.vy > 0 && b.y > this.paddle.y + 52 - r) {
        b.y = this.paddle.y + 52 - r; b.vy = -Math.abs(b.vy); this.fixAngle(b); this.mark(b);
        this.ring(b.x, b.y + r, 60); sfx.wall();
      }
      this.brickHit(b, pierce);
      if (b.y > this.bottom + r * 2) { b.lost = true; break; }
    }
  }

  // ÍMÃ: a gentle pull toward the platform while the disc comes down
  magnetPull(b, h) {
    const p = this.paddle, dy = p.y - b.y;
    if (dy <= 0 || dy > 520) return;
    b.vx += clamp(p.x - b.x, -220, 220) * 3.2 * (1 - dy / 520) * h;
    const s = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / s) * b.s; b.vy = (b.vy / s) * b.s;
    if (++b.gk % 4 === 0) this.mark(b);
  }

  // REPULSÃO: the platform pushes a falling disc away from it
  repelPush(b, h) {
    const p = this.paddle, dy = p.y - b.y;
    if (dy <= 0 || dy > 420) return;
    const dx = b.x - p.x, dir = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
    b.vx += dir * 620 * (1 - dy / 420) * h;
    const s = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / s) * b.s; b.vy = (b.vy / s) * b.s;
    this.fixAngle(b);
    if (++b.gk % 4 === 0) this.mark(b);
  }

  applyGravity(b, h, wells) {
    for (const w of wells) {
      const dx = w.x - b.x, dy = w.y - b.y;
      const d2 = Math.max(dx * dx + dy * dy, 2500);
      const d = Math.sqrt(d2);
      if (w.core && d < CORE_R + b.r) {
        const nx = -dx / d, ny = -dy / d, dot = b.vx * nx + b.vy * ny;
        if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
        b.x = w.x + nx * (CORE_R + b.r + 0.5); b.y = w.y + ny * (CORE_R + b.r + 0.5);
        this.mark(b); sfx.wall(); this.ring(w.x, w.y, 90);
        continue;
      }
      const a = w.s / d2;
      b.vx += (dx / d) * a * h;
      b.vy += (dy / d) * a * h;
    }
    const s = Math.hypot(b.vx, b.vy) || 1;
    b.vx = (b.vx / s) * b.s; b.vy = (b.vy / s) * b.s;
    if (++b.gk % 3 === 0) this.mark(b);
  }

  fixAngle(b) {
    const min = b.s * 0.28;
    if (Math.abs(b.vy) < min) {
      b.vy = (b.vy < 0 ? -1 : 1) * min;
      b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(b.s * b.s - min * min);
    }
  }

  paddleHit(b) {
    const p = this.paddle;
    const r = b.r;
    if (b.y < p.y - 60 - r || b.y > p.y + 90 || Math.abs(b.x - p.x) > p.hw + r + 4) return false;
    const pts = shapePoints(this.plat.shape, p.x, p.y, p.hw, 20);
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const sx = x1 - x0, sy = y1 - y0, L2 = sx * sx + sy * sy;
      const k = clamp(((b.x - x0) * sx + (b.y - y0) * sy) / L2, 0, 1);
      const qx = x0 + sx * k, qy = y0 + sy * k;
      const d = Math.hypot(b.x - qx, b.y - qy);
      if (!best || d < best.d) {
        const L = Math.sqrt(L2);
        best = { d, qx, qy, nx: sy / L, ny: -sx / L };
      }
    }
    if (!best || best.d > r + PAD_TH / 2) return false;
    const { qx, qy, nx, ny } = best;
    if ((b.x - qx) * nx + (b.y - qy) * ny < -PAD_TH) return false;
    const dot = b.vx * nx + b.vy * ny;
    if (dot >= 0) return false;
    const sh = this.shape;
    const rvx = b.vx - 2 * dot * nx, rvy = b.vy - 2 * dot * ny;
    const thR = Math.atan2(rvx, -rvy);
    const kx = clamp((qx - p.x) / p.hw, -1, 1);
    const th = clamp(sh.aim * kx * sh.max + (1 - sh.aim) * thR, -sh.max, sh.max);
    b.vx = Math.sin(th) * b.s;
    b.vy = -Math.cos(th) * b.s;
    b.x = qx + nx * (r + PAD_TH / 2 + 0.5);
    b.y = qy + ny * (r + PAD_TH / 2 + 0.5);
    this.mark(b);
    this.combo = 0;
    sfx.paddle();
    this.padPulses.push({ u: qx - p.x, t: 0 });
    p.hit = 1;
    const pal = this.palette();
    this.burst(qx, qy, 8, 0.6, [samplePal(pal, this.t * 0.22), samplePal(pal, this.t * 0.22 + 0.5)]);
    this.emit('paddle');
    return true;
  }

  brickHit(b, pierce) {
    const ghost = !!this.effects.ghost;
    for (const br of this.bricks) {
      if (br.dead || br.out || (ghost && br.kind === 'wall')) continue;
      const bounce = !pierce || br.kind === 'wall' || (br.armor && b.vy < 0);
      if (bounce) {
        if (!collideRect(b, br.x, br.y, br.w, br.h)) continue;
        this.fixAngle(b);
        this.mark(b);
        if (br.armor && b.y > br.y + br.h) { br.flash = 0.6; sfx.wall(); this.ring(b.x, br.y + br.h, 40); return; }
      } else {
        const qx = clamp(b.x, br.x, br.x + br.w), qy = clamp(b.y, br.y, br.y + br.h);
        if ((b.x - qx) ** 2 + (b.y - qy) ** 2 > b.r * b.r) continue;
      }
      if (br.kind === 'wall') { br.flash = 0.6; sfx.wall(); return; }
      let amt = this.ballDamage();
      if (b.heavy > 0) { b.heavy--; amt *= 2; this.ring(br.x + br.w / 2, br.y + br.h / 2, 46); this.shake = Math.max(this.shake, 0.2); }
      this.damage(br, pierce, amt);
      if (bounce) return;
    }
  }

  // Damage a disc deals per hit: MEGA 2x, MINI 0.5x.
  ballDamage() {
    const e = this.effects.disc;
    return e ? (e.type === 'mega' ? 2 : 0.5) : 1;
  }

  // perk = true when an active perk dealt the damage: those kills do not recharge the perk.
  damage(br, full, amt = 1, perk = false) {
    if (br.dead || br.kind === 'wall') return;
    const tier = Math.ceil(br.hp);
    br.hp = full ? 0 : br.hp - amt;
    if (br.hp > 0 && br.hp < 1e-6) br.hp = 0;
    br.flash = 1;
    this.combo++;
    this.score += Math.min(this.combo, 20);
    const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
    const tone = tierTone(this.col, tier);
    this.emit('brick');
    if (br.hp <= 0) {
      br.dead = true;
      this.alive--;
      this.breaks++;
      if (!perk) this.gainEnergy(0.075);
      this.emit('chip', 1);
      this.score += 5 * tier;
      this.derez(br, tone);
      sfx.brk(this.combo);
      vibrate(8);
      if (this.combo >= 3) this.float('x' + this.combo, cx, cy, 24);
      if (br.kind === 'exp') this.blasts.push({ br, t: 0.12 });
      if (!this.tutorial && Math.random() < COIN_CHANCE * GRANA_MUL[this.pLvl('grana')]) this.coins.push({ x: cx, y: cy, vy: -140, t: Math.random() * 3 });
      if (this.tutorial && this.breaks === 3) this.spawnDrop(cx, cy, 'wide');
      else if (!this.tutorial && Math.random() < (this.boss ? Math.max(this.dropChance, 0.3) : this.dropChance)) this.spawnDrop(cx, cy);
    } else {
      this.burst(cx, cy, 6, 0.6, [tone]);
      sfx.brick(this.combo);
    }
  }

  explode(src) {
    const cx = src.x + src.w / 2, cy = src.y + src.h / 2;
    this.ring(cx, cy, 130);
    this.shake = Math.max(this.shake, 0.35);
    sfx.blast();
    for (const o of this.bricks) {
      if (o.dead || o === src) continue;
      if (Math.abs(o.x + o.w / 2 - cx) < (BW + GAP) * 1.5 && Math.abs(o.y + o.h / 2 - cy) < (BH + GAP) * 1.5) this.damage(o, false);
    }
  }

  derez(br, tone) {
    const n = Math.round(22 * gfx.fx);
    for (let i = 0; i < n; i++) {
      const x = br.x + Math.random() * br.w, y = br.y + Math.random() * br.h;
      const ang = Math.atan2(y - (br.y + br.h / 2), x - (br.x + br.w / 2)) + (Math.random() - 0.5);
      const sp = 60 + Math.random() * 260;
      const life = 0.35 + Math.random() * 0.45;
      this.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, max: life, col: i % 3 ? tone : WHITE, sq: true });
    }
    this.burst(br.x + br.w / 2, br.y + br.h / 2, 8, 1, [tone]);
  }

  ring(x, y, r) { this.rings.push({ x, y, r, t: 0, max: 0.45 }); }

  spawnDrop(x, y, forced = null) {
    let type = forced;
    if (!type) {
      // in boss fights lasers and missiles are much more likely
      const luck = SORTE_MUL[this.pLvl('sorte')];
      const wt = (k, v) => (this.boss && (k === 'laser' || k === 'missile') ? v.w * 3.5 : v.w) * (v.good ? 1 : luck);
      const pool = Object.entries(POWERS).filter(([k, v]) => v.d <= this.stage.w + 1 && !(k === 'life' && this.lives >= 6));
      const total = pool.reduce((s, [k, v]) => s + wt(k, v), 0);
      let roll = Math.random() * total;
      for (const [k, v] of pool) { roll -= wt(k, v); if (roll <= 0) { type = k; break; } }
    }
    if (!type) return;
    // platform +/- sometimes comes doubled
    const n = !forced && (type === 'wide' || type === 'shrink') && Math.random() < 0.3 ? 2 : 1;
    this.drops.push({ x, y, type, n, t: 0, got: false });
    this.emit('drop');
  }

  // Platform size is a level from -4 to +4; + and - stack and cancel out.
  addSize(delta, dur = 15) {
    const cur = this.effects.size ? this.effects.size.lvl : 0;
    const lvl = clamp(cur + delta, -4, 4);
    if (lvl === 0) delete this.effects.size;
    else this.effects.size = { type: lvl > 0 ? 'wide' : 'shrink', lvl, t: dur, max: dur, good: lvl > 0 };
    return lvl;
  }

  applyPower(type, n = 1) {
    const def = POWERS[type];
    const p = this.paddle;
    sfx.power(def.good);
    vibrate(def.good ? 15 : 30);
    if (def.good) this.score += 10 * n;
    if (type === 'wide' || type === 'shrink') {
      const lvl = this.addSize(type === 'wide' ? n : -n);
      this.float((n > 1 ? 'x2  ' : '') + 'PLATAFORMA ' + (lvl > 0 ? '+' + lvl : lvl < 0 ? '−' + -lvl : 'NORMAL'), p.x, p.y - 70, 24);
      return;
    }
    this.float(def.label, p.x, p.y - 70, 24);
    switch (type) {
      case 'multi': {
        if (this.holding) this.launch();
        const src = this.balls.filter((b) => !b.cap);
        for (const b of src) {
          for (const rot of [-0.45, 0.45]) {
            if (this.balls.length >= MAX_BALLS) break;
            const cs = Math.cos(rot), sn = Math.sin(rot);
            const nb = this.makeBall(b.x, b.y, b.vx * cs - b.vy * sn, b.vx * sn + b.vy * cs, false);
            nb.s = b.s; nb.r = b.r;
            this.fixAngle(nb);
            this.balls.push(nb);
          }
        }
        break;
      }
      case 'slow': case 'fast':
        this.effects.speed = { type, t: 10, max: 10, good: def.good }; break;
      case 'mega': case 'mini':
        this.effects.disc = { type, t: 12, max: 12, good: def.good }; break;
      case 'pierce':
        this.effects.pierce = { type, t: 8, max: 8, good: true }; break;
      case 'laser': {
        const left = this.effects.laser ? this.effects.laser.t : 0;
        const t = Math.min(14, left + 7);
        this.effects.laser = { type, t, max: Math.max(7, t), good: true, ammo: true };
        if (!left) this.laserCd = 0;
        break;
      }
      case 'ghost':
        this.effects.ghost = { type, t: 10, max: 10, good: true }; break;
      case 'dark': case 'invert': case 'wobble': case 'drag': case 'repel': case 'blind':
        this.effects[type] = { type, t: 8, max: 8, good: false }; break;
      case 'missile':
        this.missiles.push({ x: p.x, y: p.y - 20, vx: 0, vy: -320, t: 0 }); sfx.missile(); break;
      case 'life':
        this.lives = Math.min(6, this.lives + 1); break;
    }
  }

  onFury(boss) {
    this.furyMul = 1.12;
    this.banner = { text: 'MODO FÚRIA', sub: boss.name, t: 2.4, max: 2.4 };
    this.shake = 1;
    this.ring(boss.cx, boss.cy, 520);
    this.ring(boss.cx, boss.cy, 320);
    for (const b of this.balls) {
      if (b.held || b.cap) continue;
      const dx = b.x - boss.cx, dy = b.y - boss.cy, d = Math.hypot(dx, dy) || 1;
      b.vx = (dx / d) * b.s; b.vy = (dy / d) * b.s;
      this.fixAngle(b); this.mark(b);
    }
    sfx.fury();
    vibrate(120);
    music.setFury(true);
    this.emit('fury');
  }

  onBossDeath(boss) {
    this.score += 500;
    this.shake = 1.2;
    for (const b of this.balls) this.burst(b.x, b.y, 12);
    this.balls = [];
    this.drops = []; this.bolts = []; this.missiles = []; this.shots = [];
    this.collectCoins();
    const bonus = 20 + 5 * this.stage.w;   // bosses pay in coins too
    this.stageCoins += bonus;
    this.emit('coin', bonus);
    this.float('+' + bonus + ' MOEDAS', boss.cx, boss.cy + 110, 26);
    for (const br of this.bricks) br.dead = true;
    sfx.bossDie();
    vibrate(200);
    this.banner = { text: 'DERROTADO', sub: boss.name, t: 2.6, max: 2.6 };
    this.emit('stageClear', this.index);
  }

  loseLife() {
    if (!this.infinite) this.lives--;
    this.effects = {};
    this.drops = [];
    this.combo = 0;
    this.shake = 1;
    vibrate(60);
    if (this.lives <= 0) {
      this.lives = 0;
      sfx.over();
      this.hooks.onGameOver(this.score);
      return;
    }
    sfx.lose();
    this.resetBall();
  }

  burst(x, y, n, power = 1, cols = null) {
    n = Math.round(n * gfx.fx);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * TAU;
      const sp = (120 + Math.random() * 360) * power;
      const life = 0.3 + Math.random() * 0.4;
      const col = cols ? cols[i % cols.length] : (i % 2 ? this.col : WHITE);
      this.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life, max: life, col });
    }
    if (this.particles.length > 700) this.particles.splice(0, this.particles.length - 700);
  }

  float(text, x, y, size) {
    while (this.floats.some((f) => Math.abs(f.x - x) < 120 && Math.abs(f.y - y) < size + 6)) y -= size + 10;
    this.floats.push({ text, x: clamp(x, 110, W - 110), y, size, t: 1, max: 1 });
  }


  // ---------- active perks ----------
  gainEnergy(n) {
    if (!this.ability) return;
    const was = this.energy;
    this.energy = Math.min(1, this.energy + n * RECARGA_MUL[this.pLvl('recarga')]);
    if (was < 1 && this.energy >= 1) { sfx.power(true); this.float('PERK PRONTO', this.paddle.x, this.paddle.y - 100, 20); }
  }

  abilityRect() { return { x: RIGHT - 92, y: this.bottom - 92, w: 80, h: 80 }; }

  useAbility() {
    const a = this.ability;
    if (!a || this.energy < 1 || this.abil || this.clearT > 0) return false;
    this.energy = 0;
    const L = a.lvl;
    vibrate(30);
    if (a.type === 'megalaser') {
      this.abil = { type: 'megalaser', charge: 0.5, t: 0.45 + 0.15 * L, max: 0.45 + 0.15 * L, w: 30 + 10 * L, hitBoss: 0 };
      sfx.charge();
    } else if (a.type === 'shock') {
      // the wave starts where the platform is (it does not follow it) and
      // reaches the K nearest bricks; it only pushes the disc near the platform
      const p = this.paddle, K = 2 + 2 * L;
      const near = this.bricks.filter((q) => !q.dead && !q.out && q.kind !== 'wall')
        .map((q) => ({ q, d: Math.hypot(q.x + q.w / 2 - p.x, q.y + q.h / 2 - p.y) }))
        .sort((u, v) => u.d - v.d).slice(0, K);
      const R = Math.max(SHOCK_DEFLECT + 40, near.length ? near[near.length - 1].d + 30 : 0);
      this.abil = { type: 'shock', r: 0, R, cx: p.x, cy: p.y, t: 0.6, max: 0.6, targets: new Set(near.map((n) => n.q)), hit: new Set(), hitB: new Set(), dmg: L >= 3 ? 2 : 1 };
      sfx.pulse(); sfx.blast();
      this.shake = Math.max(this.shake, 0.5);
    } else if (a.type === 'shield') {
      this.abil = { type: 'shield', t: 5 + 2 * L, max: 5 + 2 * L };
      sfx.power(true);
    } else if (a.type === 'magnet') {
      this.abil = { type: 'magnet', t: 6 + 3 * L, max: 6 + 3 * L };
      sfx.capture();
    } else if (a.type === 'slow') {
      this.abil = { type: 'slow', t: 4 + 1.5 * L, max: 4 + 1.5 * L };
      sfx.capture();
    } else if (a.type === 'bolt') {
      // chain: from the disc to the nearest brick, then on to the nearest one from there
      const src = this.balls.find((b) => !b.cap) || { x: this.paddle.x, y: this.paddle.y - 30 };
      const pts = [{ x: src.x, y: src.y }], left = this.bricks.filter((q) => !q.dead && q.kind !== 'wall' && !q.out);
      let cx = src.x, cy = src.y;
      for (let n = 0; n < 3 + 2 * L && left.length; n++) {
        let bi = 0, bd = Infinity;
        left.forEach((q, i) => { const d = Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy); if (d < bd) { bd = d; bi = i; } });
        const q = left.splice(bi, 1)[0];
        cx = q.x + q.w / 2; cy = q.y + q.h / 2;
        pts.push({ x: cx, y: cy });
        this.damage(q, false, L >= 3 ? 2 : 1, true);
        this.burst(cx, cy, 6, 0.6);
      }
      if (this.boss && !this.boss.dead) { pts.push({ x: this.boss.cx, y: this.boss.cy }); this.boss.damage(0.5, false, true); }
      this.abil = { type: 'bolt', t: 0.5, max: 0.5, pts, seed: Math.random() * 100 };
      sfx.laser(); sfx.blast();
      this.shake = Math.max(this.shake, 0.4);
    }
    this.emit('ability');
    return true;
  }

  updateAbility(dt) {
    const A = this.abil;
    if (!A) return;
    const p = this.paddle;
    if (A.type === 'megalaser') {
      if (A.charge > 0) {
        A.charge -= dt;
        if (Math.random() < 0.9) {
          const a = Math.random() * TAU, d = 50 + Math.random() * 40;
          this.particles.push({ x: p.x + Math.cos(a) * d, y: p.y - 20 + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.5, vy: -Math.sin(a) * d * 2.5, life: 0.35, max: 0.35, col: WHITE });
        }
        if (A.charge <= 0) { sfx.laser(); sfx.blast(); this.shake = Math.max(this.shake, 0.6); }
        return;
      }
      A.t -= dt;
      const x0 = p.x - A.w / 2, x1 = p.x + A.w / 2;
      for (const br of this.bricks) {
        if (br.dead || br.out || br.kind === 'wall' || br.y > p.y) continue;
        if (br.x + br.w > x0 && br.x < x1) this.damage(br, true, 1, true);
      }
      if (this.boss && !this.boss.dead && A.hitBoss <= 0) {
        if (this.boss.hitShot(p.x, this.boss.cy, A.w / 2) === 'core') { this.boss.damage(1.5, false, true); A.hitBoss = 0.3; }
      }
      A.hitBoss -= dt;
      if (A.t <= 0) this.abil = null;
    } else if (A.type === 'shock') {
      A.t -= dt;
      A.r = A.R * (1 - A.t / A.max);
      const cx = A.cx, cy = A.cy;
      for (const br of this.bricks) {
        if (br.dead || A.hit.has(br) || !A.targets.has(br)) continue;
        const qx = clamp(cx, br.x, br.x + br.w), qy = clamp(cy, br.y, br.y + br.h);
        if (Math.hypot(qx - cx, qy - cy) < A.r) { A.hit.add(br); if (br.kind === 'wall') br.flash = 0.6; else if (!br.out) this.damage(br, false, A.dmg, true); }
      }
      for (const b of this.balls) {
        if (b.held || b.cap || A.hitB.has(b)) continue;
        const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy) || 1;
        if (d < A.r && d < SHOCK_DEFLECT) {
          A.hitB.add(b);
          // push the disc away from the platform, always upward
          b.vx = (dx / d) * b.s; b.vy = -Math.abs(dy / d) * b.s - b.s * 0.3;
          const sp = Math.hypot(b.vx, b.vy); b.vx = (b.vx / sp) * b.s; b.vy = (b.vy / sp) * b.s;
          this.fixAngle(b); this.mark(b); this.ring(b.x, b.y, 50);
        }
      }
      if (this.boss && !this.boss.dead && !A.boss && Math.hypot(this.boss.cx - cx, this.boss.cy - cy) < A.r) { A.boss = true; this.boss.damage(0.5, false, true); }
      if (A.t <= 0) this.abil = null;
    } else {
      A.t -= dt;
      if (A.t <= 0) {
        this.abil = null;
        if (A.type === 'magnet' && this.holding) this.launch();
      }
    }
  }

  renderAbility(c) {
    const A = this.abil, p = this.paddle, col = this.col;
    if (A && A.type === 'megalaser') {
      const top = this.top + 4;
      if (A.charge > 0) {
        const k = 1 - A.charge / 0.5;
        c.beginPath(); c.arc(p.x, p.y - 20, 6 + 18 * k, 0, TAU);
        c.fillStyle = rgba(WHITE, 0.5 + 0.5 * k); c.shadowColor = col; c.shadowBlur = 30 * view.blur * k; c.fill(); c.shadowBlur = 0;
        c.setLineDash([4, 8]);
        c.beginPath(); c.moveTo(p.x, p.y - 20); c.lineTo(p.x, top);
        c.strokeStyle = rgba(col, 0.25 + 0.4 * k); c.lineWidth = 1.5; c.stroke();
        c.setLineDash([]);
      } else {
        const k = A.t / A.max, w = A.w * (0.7 + 0.3 * Math.sin(this.t * 60));
        const g = c.createLinearGradient(p.x - w, 0, p.x + w, 0);
        g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.3, rgba(col, 0.6 * k)); g.addColorStop(0.5, rgba(WHITE, k));
        g.addColorStop(0.7, rgba(col, 0.6 * k)); g.addColorStop(1, rgba(col, 0));
        c.fillStyle = g;
        c.fillRect(p.x - w, top, w * 2, p.y - 20 - top);
        c.beginPath(); c.arc(p.x, p.y - 20, w * 0.7, 0, TAU); c.fillStyle = rgba(WHITE, 0.8 * k); c.fill();
      }
    } else if (A && A.type === 'shock') {
      const k = A.t / A.max;
      for (const f of [1, 0.85]) {
        c.beginPath(); c.arc(p.x, p.y, A.r * f, Math.PI, TAU);
        c.strokeStyle = rgba(f === 1 ? WHITE : col, 0.9 * k); c.lineWidth = f === 1 ? 4 : 2;
        c.shadowColor = col; c.shadowBlur = 20 * view.blur; c.stroke(); c.shadowBlur = 0;
      }
    } else if (A && A.type === 'shield') {
      const y = p.y + 52, k = Math.min(1, A.t / 1.2);
      c.save();
      c.globalAlpha = k * (A.t < 1.5 ? 0.5 + 0.5 * Math.sin(this.t * 20) : 1);
      c.beginPath(); c.moveTo(LEFT + 6, y); c.lineTo(RIGHT - 6, y);
      neonStroke(c, col, col, 3, LEFT, y, RIGHT, y, 1.1);
      c.setLineDash([10, 10]); c.lineDashOffset = -this.t * 80;
      c.beginPath(); c.moveTo(LEFT + 6, y + 8); c.lineTo(RIGHT - 6, y + 8);
      c.strokeStyle = rgba(col, 0.5); c.lineWidth = 1.5; c.stroke();
      c.restore();
    } else if (A && A.type === 'slow') {
      // a cold tint and a clock ring around the platform
      const k = Math.min(1, A.t / 0.6, (A.max - A.t) / 0.3);
      c.fillStyle = rgba(col, 0.05 * k); c.fillRect(LEFT, this.top, RIGHT - LEFT, this.bottom - this.top);
      c.save();
      c.setLineDash([2, 10]); c.lineDashOffset = -this.t * 6;
      c.beginPath(); c.arc(p.x, p.y, p.hw + 26, Math.PI, TAU);
      c.strokeStyle = rgba(col, 0.6 * k); c.lineWidth = 3; c.stroke();
      c.restore();
      c.beginPath(); c.arc(p.x, p.y, p.hw + 26, Math.PI, Math.PI + Math.PI * (A.t / A.max));
      c.strokeStyle = rgba(WHITE, 0.7 * k); c.lineWidth = 2; c.stroke();
    } else if (A && A.type === 'bolt') {
      const k = A.t / A.max;
      c.save();
      c.lineJoin = 'round'; c.lineCap = 'round';
      for (const [w, st] of [[5, rgba(col, 0.6 * k)], [2, rgba(WHITE, k)]]) {
        c.beginPath();
        A.pts.forEach((q, i) => {
          if (!i) { c.moveTo(q.x, q.y); return; }
          const a = A.pts[i - 1];
          for (let j = 1; j <= 4; j++) {
            const f = j / 4, jit = j < 4 ? Math.sin(A.seed + i * 7 + j * 3 + this.t * 40) * 14 : 0;
            c.lineTo(a.x + (q.x - a.x) * f + jit, a.y + (q.y - a.y) * f - jit * 0.5);
          }
        });
        c.strokeStyle = st; c.lineWidth = w; c.shadowColor = col; c.shadowBlur = 16 * view.blur; c.stroke();
      }
      c.restore();
    } else if (A && A.type === 'magnet') {
      c.save();
      c.setLineDash([3, 7]); c.lineDashOffset = this.t * 30;
      for (let i = 0; i < 3; i++) {
        const rr = p.hw + 10 + ((this.t * 40 + i * 14) % 42);
        c.beginPath(); c.ellipse(p.x, p.y, rr, rr * 0.35, 0, Math.PI, TAU);
        c.strokeStyle = rgba(col, 0.5 * (1 - ((this.t * 40 + i * 14) % 42) / 42)); c.lineWidth = 2; c.stroke();
      }
      c.restore();
    }
  }

  // HUD button with the equipped active perk, filling with energy.
  renderAbilityButton(c) {
    if (!this.ability) return;
    const r = this.abilityRect(), col = this.col;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = 30, full = this.energy >= 1 && !this.abil;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU);
    c.fillStyle = rgba(col, full ? 0.25 + 0.1 * Math.sin(this.t * 6) : 0.06); c.fill();
    c.strokeStyle = rgba(col, 0.35); c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * this.energy);
    neonStroke(c, col, col, 3.5, cx - R, cy, cx + R, cy, full ? 1.3 : 0.6);
    drawAbilityIcon(c, this.ability.type, cx, cy, 13, full ? WHITE : rgba(col, 0.9));
    if (full) glowText(c, 'TOQUE 2X', cx, cy - R - 14, 11, WHITE, col, 'center', 700, 2);
  }

  // ---------- dev helpers ----------
  devSkip() { if (this.isLast) return; this.index++; this.loadLevel(); }
  devRestart() { this.loadLevel(); }
  devClear() {
    if (this.boss) { this.boss.lives = 1; this.boss.hp = 0.01; this.boss.damage(1, true); return; }
    for (const b of this.bricks) if (b.kind !== 'wall' && !b.dead) { b.dead = true; this.alive--; }
  }
  devBoss() { this.index = worldStart(this.stage.w) + worldCount(this.stage.w) - 1; this.loadLevel(); }
  devBossHit(n) { if (this.boss) this.boss.damage(n, true); }
  devFury() { if (this.boss && !this.boss.fury) { this.boss.hp = 0.01; this.boss.damage(1, true); } }
  devDrop(type, n = 1) {
    const p = this.paddle;
    this.drops.push({ x: clamp(p.x, LEFT + 40, RIGHT - 40), y: Math.max(this.top + 30, p.y - 380), type, n, t: 0, got: false });
  }
  devAddBall() {
    const p = this.paddle;
    const a = (Math.random() - 0.5) * 1.2;
    const b = this.makeBall(p.x, p.y - 40, Math.sin(a) * this.baseSpeed, -Math.cos(a) * this.baseSpeed, false);
    this.balls.push(b);
  }

  // ---------- render ----------
  gridLayer() {
    const style = this.stage ? this.world.border : 'flow';
    const key = this.col + this.H + this.top + view.res + style + view.glow + gfx.grid;
    if (this.grid && this.grid.key === key) return this.grid;
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * view.res);
    cv.height = Math.round(this.H * view.res);
    const c = cv.getContext('2d');
    c.setTransform(view.res, 0, 0, view.res, 0, 0);
    const top = this.top, bottom = this.bottom;
    c.save();
    roundRectPath(c, LEFT, top, RIGHT - LEFT, bottom - top, CR);
    c.clip();
    const step = 48;
    for (let x = (W / 2) % step; x < W; x += step) {
      c.strokeStyle = rgba(this.col, (Math.round((x - W / 2) / step) % 4 === 0 ? 0.11 : 0.05) * gfx.grid);
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x, bottom); c.stroke();
    }
    for (let y = bottom, i = 0; y > top; y -= step, i++) {
      c.strokeStyle = rgba(this.col, (i % 4 === 0 ? 0.11 : 0.05) * gfx.grid);
      c.beginPath(); c.moveTo(LEFT, y); c.lineTo(RIGHT, y); c.stroke();
    }
    const g = c.createLinearGradient(0, bottom - 160, 0, bottom);
    g.addColorStop(0, rgba(this.col, 0));
    g.addColorStop(1, rgba(this.col, 0.08 * gfx.grid));
    c.fillStyle = g;
    c.fillRect(LEFT, bottom - 160, RIGHT - LEFT, 160);
    c.restore();
    // the steady part of the neon border is baked in; only the pulsing extra is drawn per frame
    const [bw, bg] = BORDER_BASE[style] || BORDER_BASE.flow;
    borderPath(c, top, bottom);
    neonStroke(c, this.col, this.col, bw, 0, top, 0, bottom, bg);
    this.grid = { key, img: cv };
    return this.grid;
  }

  // Extra light on top of the baked border (beat, hits, fury flicker). No blur: cheap.
  borderExtra(c, w, a) {
    if (a <= 0.02) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    borderPath(c, this.top, this.bottom);
    c.lineJoin = 'round';
    c.strokeStyle = rgba(this.col, Math.min(0.5, a * 0.3)); c.lineWidth = 6 + w * 3; c.stroke();
    c.strokeStyle = rgba(this.col, Math.min(1, a * 0.8)); c.lineWidth = 2 + w; c.stroke();
    c.restore();
  }

  // Stroke the part of the border between arc lengths s0 and s1.
  borderSeg(c, s0, s1) {
    const bp = this.bp;
    s0 = Math.max(0, s0); s1 = Math.min(bp.L, s1);
    if (s1 <= s0) return false;
    let i = 0;
    while (i < bp.s.length - 1 && bp.s[i + 1] < s0) i++;
    c.beginPath();
    c.moveTo(bp.xs[i], bp.ys[i]);
    for (; i < bp.s.length && bp.s[i] <= s1; i++) c.lineTo(bp.xs[i], bp.ys[i]);
    return true;
  }

  renderField(c) {
    const top = this.top, bottom = this.bottom, col = this.col;
    if (!this.bp) this.bp = sampleBorder(top, bottom);
    c.drawImage(this.gridLayer().img, 0, 0, W, this.H);
    const style = this.stage ? this.world.border : 'flow';
    const fury = this.boss && this.boss.fury && !this.boss.dead;
    const flick = fury ? 0.75 + Math.random() * 0.5 : 1;
    const white = (w, blur) => { c.lineCap = 'round'; c.strokeStyle = WHITE; c.lineWidth = w; c.shadowColor = col; c.shadowBlur = blur * view.blur; c.stroke(); c.shadowBlur = 0; };

    if (style === 'beat') {
      // World 2: the whole border throbs on the music beat, dashes drift around it,
      // impacts bloom outward from the hit point and linger.
      const beat = Math.exp(-music.beatPhase() * 6);
      this.borderExtra(c, beat * 2.5 + this.borderGlow * 2, (beat * 1.1 + this.borderGlow) * flick);
      c.save();
      c.setLineDash([34, 26]);
      c.lineDashOffset = this.t * 30;
      borderPath(c, top, bottom);
      c.globalAlpha = 0.25 + 0.45 * beat;
      white(2, 12);
      c.restore();
      for (const q of this.pulses) {
        const k = q.t;
        const half = 320 * (1 - Math.pow(1 - k, 3));
        if (this.borderSeg(c, q.s - half, q.s + half)) {
          c.globalAlpha = (1 - k) * 0.9;
          white(5, 22);
          c.globalAlpha = 1;
        }
        c.beginPath(); c.arc(q.x, q.y, 10 + k * 70, 0, TAU);
        c.strokeStyle = rgba(col, 0.6 * (1 - k)); c.lineWidth = 2; c.stroke();
      }
    } else if (style === 'scan') {
      // World 3: a surveillance scanline sweeps the field top to bottom;
      // impacts make the border glitch in dashed bursts around the hit height.
      this.borderExtra(c, this.borderGlow * 2, this.borderGlow * flick + (flick - 1));
      const ph = (this.t * 0.45) % 1;
      const sy = top + (bottom - top) * ph;
      c.save();
      c.beginPath(); c.rect(0, sy - 46, W, 92); c.clip();
      borderPath(c, top, bottom); white(3, 18);
      c.restore();
      c.beginPath(); c.moveTo(LEFT + 4, sy); c.lineTo(RIGHT - 4, sy);
      c.strokeStyle = rgba(col, 0.07); c.lineWidth = 2; c.stroke();
      for (const q of this.pulses) {
        const k = q.t;
        c.save();
        c.beginPath(); c.rect(0, q.y - 60 - k * 240, W, 120 + k * 480); c.clip();
        c.setLineDash([4 + Math.random() * 10, 6 + Math.random() * 14]);
        borderPath(c, top, bottom);
        c.globalAlpha = (1 - k) * 0.9;
        white(4, 20);
        c.restore();
      }
    } else {
      // World 1: two runners circle the border; impacts launch two light
      // pulses that race away from the hit point in both directions.
      this.borderExtra(c, this.borderGlow * 2, this.borderGlow * 0.9 * flick + (flick - 1));
      const P = this.bp.L;
      c.save();
      c.setLineDash([150, P / 2 - 150]);
      c.lineDashOffset = -((this.t * 380) % P);
      borderPath(c, top, bottom);
      white(2.5, 18);
      c.restore();
      for (const q of this.pulses) {
        const k = Math.min(1, q.t / 0.7);
        const d = 20 + q.t * 1100;
        c.globalAlpha = 1 - k;
        if (this.borderSeg(c, q.s - d - 90, q.s - d)) white(4, 20);
        if (this.borderSeg(c, q.s + d, q.s + d + 90)) white(4, 20);
        if (this.borderSeg(c, q.s - 30, q.s + 30)) white(6 * (1 - k) + 1, 24);
        c.globalAlpha = 1;
      }
    }
    c.save();
    c.setLineDash([6, 14]);
    c.lineDashOffset = this.t * 20;
    c.beginPath(); c.moveTo(LEFT + CR, bottom); c.lineTo(RIGHT - CR, bottom);
    c.strokeStyle = rgba(col, 0.35);
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  }

  renderMechanics(c) {
    const col = this.col, t = this.t;
    if (this.mechs.includes('descent') && !this.boss) {
      const y = this.dangerY, k = this.press || 0;
      c.save();
      c.setLineDash([14, 10]);
      c.lineDashOffset = -t * 30;
      c.beginPath(); c.moveTo(LEFT + 8, y); c.lineTo(RIGHT - 8, y);
      c.globalAlpha = 0.35 + 0.65 * k * (0.6 + 0.4 * Math.sin(t * (4 + k * 10)));
      neonStroke(c, col, col, 2 + k * 2, LEFT, y, RIGHT, y, 0.5 + k);
      c.restore();
    }
    for (const w of this.wells) {
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.5 + i / 4) % 1);
        c.beginPath(); c.arc(w.x, w.y, 150 * (1 - k) + CORE_R, 0, TAU);
        c.strokeStyle = rgba(col, 0.28 * k);
        c.lineWidth = 1.5;
        c.stroke();
      }
      c.save();
      c.translate(w.x, w.y);
      c.rotate(t * 1.2);
      c.setLineDash([10, 8]);
      c.beginPath(); c.arc(0, 0, CORE_R + 12, 0, TAU);
      neonStroke(c, col, col, 2, -30, 0, 30, 0, 0.6);
      c.restore();
      c.beginPath(); c.arc(w.x, w.y, CORE_R, 0, TAU);
      c.fillStyle = rgba(col, 0.2); c.fill();
      neonStroke(c, col, col, 3, w.x - 20, w.y, w.x + 20, w.y, 1);
      c.beginPath(); c.arc(w.x, w.y, 6 + Math.sin(t * 6) * 1.5, 0, TAU);
      c.fillStyle = WHITE; c.fill();
    }
    let pair = 0;
    for (const P of this.allPortals()) {
      // both gates of a pair share a color, so the player can tell where the disc comes out
      const tint = P.flip ? '#ff4060' : this.portalColor(pair++);
      for (const q of [P.a, P.b]) {
        c.save();
        c.translate(q.x, q.y);
        for (let i = 0; i < 3; i++) {
          c.rotate(t * (1.6 + i * 0.7) * (i % 2 ? -1 : 1));
          c.setLineDash([8 + i * 4, 6]);
          c.beginPath(); c.ellipse(0, 0, PORTAL_R - i * 6, (PORTAL_R - i * 6) * 0.82, 0, 0, TAU);
          c.strokeStyle = rgba(tint, 0.9 - i * 0.25); c.lineWidth = 2.4 - i * 0.5; c.stroke();
        }
        c.restore();
        c.beginPath(); c.arc(q.x, q.y, 4 + Math.sin(t * 7) * 1.5, 0, TAU); c.fillStyle = WHITE; c.fill();
      }
      if (P.flip && P.t !== undefined) {
        c.save(); c.setLineDash([3, 9]); c.lineDashOffset = -t * 40;
        c.beginPath(); c.moveTo(P.a.x, P.a.y); c.lineTo(P.b.x, P.b.y);
        c.strokeStyle = rgba(col, 0.25); c.lineWidth = 1.5; c.stroke(); c.restore();
      }
    }
    for (const r of this.rings) {
      const k = r.t / r.max;
      c.beginPath(); c.arc(r.x, r.y, r.r * k + 4, 0, TAU);
      c.strokeStyle = rgba(col, 0.9 * (1 - k));
      c.lineWidth = 3 * (1 - k) + 1;
      c.stroke();
    }
  }

  renderWeapons(c) {
    const col = this.col;
    c.lineCap = 'round';
    for (const b of this.bolts) {
      c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x, b.y + 26);
      c.strokeStyle = WHITE; c.lineWidth = 3.5;
      c.shadowColor = col; c.shadowBlur = 14 * view.blur;
      c.stroke();
    }
    c.shadowBlur = 0;
    for (const m of this.missiles) {
      c.save();
      c.translate(m.x, m.y);
      c.rotate(Math.atan2(m.vy, m.vx) + Math.PI / 2);
      c.beginPath();
      c.moveTo(0, -14); c.lineTo(6, -4); c.lineTo(6, 10); c.lineTo(-6, 10); c.lineTo(-6, -4); c.closePath();
      c.fillStyle = rgba(col, 0.3); c.fill();
      neonStroke(c, col, col, 2.2, 0, -14, 0, 10, 1);
      c.beginPath(); c.arc(0, 14, 4 + Math.random() * 3, 0, TAU);
      c.fillStyle = WHITE; c.fill();
      c.restore();
    }
    for (const s of this.shots) {
      c.save();
      c.translate(s.x, s.y); c.rotate(s.t * 8);
      c.beginPath(); c.moveTo(0, -9); c.lineTo(7, 0); c.lineTo(0, 9); c.lineTo(-7, 0); c.closePath();
      c.fillStyle = rgba(col, 0.35); c.fill();
      neonStroke(c, col, col, 2, -7, 0, 7, 0, 1);
      c.restore();
    }
  }

  renderPadPulses(c) {
    if (!this.padPulses.length) return;
    const p = this.paddle, pal = this.palette(), sh = this.shape;
    c.save();
    c.translate(p.x, p.y);
    hitTransform(c, this.plat.shape, p.hit || 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const q of this.padPulses) {
      const k = q.t / 0.5;
      const u = clamp(q.u, -p.hw, p.hw);
      const colA = samplePal(pal, this.t * 0.22 + ((u / p.hw + 1) / 2) * 0.8);
      // a stretch of the platform's own line around the contact point, growing as it fades
      const half = 34 + 44 * k;
      c.beginPath();
      for (let i = -8; i <= 8; i++) {
        const uu = clamp(u + (i / 8) * half, -p.hw, p.hw), y = sh.y(uu, p.hw);
        if (i === -8) c.moveTo(uu, y); else c.lineTo(uu, y);
      }
      for (const [w, al] of [[32, 0.1], [20, 0.18], [11, 0.3]]) { c.strokeStyle = rgba(colA, al * (1 - k)); c.lineWidth = w; c.stroke(); }
      c.globalAlpha = 1 - k;
      c.strokeStyle = WHITE; c.lineWidth = 6;
      c.shadowColor = colA; c.shadowBlur = 24 * view.blur;
      c.stroke(); c.shadowBlur = 0; c.globalAlpha = 1;
    }
    c.restore();
  }

  render(c, showHud = true) {
    const p = this.paddle;
    const col = this.col;
    c.save();
    if (this.shake > 0) c.translate((Math.random() * 2 - 1) * 10 * this.shake, (Math.random() * 2 - 1) * 10 * this.shake);

    this.renderField(c);
    this.renderMechanics(c);
    if (this.boss && (!this.boss.dead || this.boss.deathT > 1.2)) {
      c.globalAlpha = this.boss.dead ? (this.boss.deathT - 1.2) / 1.4 : 1;
      this.boss.render(c);
      c.globalAlpha = 1;
    }

    for (const br of this.bricks) {
      const s = brickSprite(br.kind, Math.ceil(br.hp), col);
      if (br.phase !== undefined) {
        const blink = this.phaseWarn ? 0.5 + 0.5 * Math.sin(this.t * 40) : 0;
        if (br.out) {
          c.globalAlpha = 0.16 + 0.3 * blink;
          drawSprite(c, s, br.x, br.y);
          c.globalAlpha = 0.7;
          c.save(); c.setLineDash([4, 5]); c.lineDashOffset = -this.t * 20;
          roundRectPath(c, br.x + 1.5, br.y + 1.5, br.w - 3, br.h - 3, 5);
          c.strokeStyle = rgba(col, 0.8); c.lineWidth = 1.5; c.stroke();
          c.restore();
          c.globalAlpha = 1;
          continue;
        }
        if (blink) c.globalAlpha = 1 - 0.45 * blink;
      }
      drawSprite(c, s, br.x, br.y);
      c.globalAlpha = 1;
      if (br.inf) {   // CONTÁGIO: a pulsing virus mark
        c.strokeStyle = c.fillStyle = WHITE; c.lineWidth = 1.6;
        drawVirus(c, br.x + br.w / 2, br.y + br.h / 2, 11.5 + Math.sin(this.t * 6 + br.col) * 1.2, this.t * 0.8);
      }
      if (br.armor) {   // BLINDAGEM: a bright plate on the underside
        const yb = br.y + br.h - 4;
        c.fillStyle = rgba(WHITE, 0.85);
        roundRectPath(c, br.x + 4, yb - 4, br.w - 8, 8, 3); c.fill();
        c.beginPath(); c.moveTo(br.x + 6, yb); c.lineTo(br.x + br.w - 6, yb);
        neonStroke(c, WHITE, col, 3, br.x, yb, br.x + br.w, yb, 1);
        c.fillStyle = rgba(col, 0.9);
        for (const fx of [0.22, 0.5, 0.78]) { c.beginPath(); c.arc(br.x + br.w * fx, yb, 1.8, 0, TAU); c.fill(); }
      }
      if (br.kind === 'exp') {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.25 + 0.25 * Math.sin(this.t * 6 + br.col);
        drawSprite(c, s, br.x, br.y);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
      if (br.flash > 0) {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = br.flash * 0.9;
        drawSprite(c, s, br.x, br.y);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
    }

    for (const d of this.drops) {
      const blink = POWERS[d.type].good ? 1 : 0.65 + 0.35 * Math.sin(d.t * 14);
      const sp = dropSprite(d.type, col), dy = Math.sin(d.t * 6) * 2;
      if (d.n > 1) {
        c.globalAlpha = blink * 0.55;
        drawSprite(c, sp, d.x - DW / 2 + 7, d.y - DH / 2 - 9 + dy);
      }
      c.globalAlpha = blink;
      drawSprite(c, sp, d.x - DW / 2, d.y - DH / 2 + dy);
      if (d.n > 1) glowText(c, 'x2', d.x + DW / 2 + 6, d.y + 7 + dy, 18, WHITE, col, 'left', 900);
      c.globalAlpha = 1;
    }

    for (const q of this.coins) {
      const sx = Math.abs(Math.cos(q.t * 5)), sp = coinSprite();
      c.save(); c.translate(q.x, q.y); c.scale(Math.max(0.15, sx), 1);
      drawSprite(c, sp, -COIN_R, -COIN_R);
      c.restore();
    }
    this.renderWeapons(c);
    this.renderAbility(c);
    if (this.effects.dark) {
      const e = this.effects.dark;
      c.fillStyle = `rgba(0,0,0,${0.84 * Math.min(1, e.t / 0.4, (e.max - e.t) / 0.25)})`;
      c.fillRect(LEFT + 3, this.top + 3, RIGHT - LEFT - 6, this.bottom - this.top - 6);
    }

    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (const q of this.particles) {
      const a = q.life / q.max;
      if (q.sq) {
        c.fillStyle = rgba(q.col, a);
        const s = 3 + 3 * a;
        c.fillRect(q.x - s / 2, q.y - s / 2, s, s);
      } else {
        c.strokeStyle = rgba(q.col, a);
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(q.x, q.y);
        c.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03);
        c.stroke();
      }
    }

    const pierce = !!this.effects.pierce;
    const bc = pierce ? mix(col, WHITE, 0.7) : col;
    const ts = this.plat.trail || 0, tp = ts === 3 ? this.palette() : null;
    const hidden = (b) => this.effects.blind && b.y < p.y - 280 && this.t % 1.1 > 0.16;
    for (const b of this.balls) {
      if (b.held || b.fade < 0.02 || hidden(b)) continue;
      c.globalAlpha = b.fade ?? 1;
      drawTrail(c, b.path, b.x, b.y, bc, TRAIL_LEN, b.r, ts, tp, this.t);
    }
    c.globalAlpha = 1;
    this.renderPadPulses(c);
    c.globalCompositeOperation = 'source-over';
    const ds = discSprite(bc, BALL_R, this.plat.disc || 0);
    const ghost = this.effects.ghost;
    for (const b of this.balls) {
      if (hidden(b)) continue;
      c.save();
      c.translate(b.x, b.y);
      c.rotate(b.spin);
      if (ghost) c.globalAlpha = (0.45 + 0.25 * Math.sin(this.t * 18)) * (b.fade ?? 1);
      drawSprite(c, ds, -b.r, -b.r, b.r / BALL_R);
      c.restore();
      if (ghost && (b.fade ?? 1) > 0.05) {
        c.save();
        c.globalAlpha = b.fade ?? 1;
        c.setLineDash([6, 6]);
        c.lineDashOffset = this.t * 40;
        c.beginPath(); c.arc(b.x, b.y, b.r + 7, 0, TAU);
        c.strokeStyle = rgba(WHITE, 0.75); c.lineWidth = 2; c.stroke();
        c.restore();
      }
      if (b.cap) {
        c.beginPath(); c.arc(b.x, b.y, b.r + 8 + 3 * Math.sin(this.t * 20), 0, TAU);
        c.strokeStyle = rgba(WHITE, 0.7); c.lineWidth = 2; c.stroke();
      }
    }

    drawPlatform(c, this.plat, p.x, p.y, p.hw, this.t, col, p.hit || 0);
    if (this.effects.laser) {
      for (const s of [-1, 1]) {
        const gx = p.x + s * p.hw * 0.8, gy = p.y + this.shape.y(s * p.hw * 0.8, p.hw);
        c.beginPath(); c.rect(gx - 4, gy - 18, 8, 14);
        c.fillStyle = rgba(col, 0.4); c.fill();
        neonStroke(c, col, col, 2, gx, gy - 18, gx, gy, 1);
      }
    }

    for (const q of this.beams) {
      const blink = q.warn ? 0.5 + 0.5 * Math.sin(this.t * 30) : 0;
      c.save();
      c.beginPath(); c.moveTo(q.x0, q.y); c.lineTo(q.x1, q.y);
      if (q.on) neonStroke(c, WHITE, col, 3.5, q.x0, q.y, q.x1, q.y, 1.2);
      else {
        c.setLineDash([6, 10]); c.lineDashOffset = -this.t * 30;
        c.strokeStyle = rgba(col, 0.22 + 0.5 * blink); c.lineWidth = 1.5; c.stroke();
      }
      c.restore();
      for (const x of [q.x0, q.x1]) {   // the emitters at both ends
        c.beginPath(); c.arc(x, q.y, 5, 0, TAU);
        c.fillStyle = q.on ? WHITE : rgba(col, 0.5 + 0.4 * blink); c.fill();
      }
    }

    for (const q of this.bars) {
      const by = this.barY(q), fade = q.t === undefined ? 1 : Math.min(1, q.t / 0.4);
      c.globalAlpha = fade;
      c.fillStyle = '#000000';
      c.fillRect(LEFT + 3, by, RIGHT - LEFT - 6, BAR_H);
      c.strokeStyle = rgba(col, 0.7); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(LEFT + 3, by); c.lineTo(RIGHT - 3, by); c.moveTo(LEFT + 3, by + BAR_H); c.lineTo(RIGHT - 3, by + BAR_H); c.stroke();
      for (let x = 70; x < W; x += 200) glowText(c, 'CENSURADO', x + ((this.t * 24) % 200) - 40, by + BAR_H / 2 + 1, 12, rgba(WHITE, 0.28), col, 'center', 700, 0);
      c.globalAlpha = 1;
    }

    let ey = p.y + 68;
    c.lineCap = 'round';
    c.lineWidth = 3;
    for (const k in this.effects) {
      const e = this.effects[k];
      const w = 110 * (e.t / e.max);
      c.strokeStyle = e.good ? col : mix(col, '#000000', 0.45);
      c.shadowColor = col;
      c.shadowBlur = 10 * view.blur;
      c.beginPath();
      c.moveTo(p.x - w / 2, ey);
      c.lineTo(p.x + w / 2, ey);
      c.stroke();
      if (e.lvl) {
        // one pip per stacked size level
        c.fillStyle = e.good ? WHITE : mix(col, '#000000', 0.3);
        const n = Math.abs(e.lvl);
        for (let i = 0; i < n; i++) c.fillRect(p.x + 64 + i * 9, ey - 3, 6, 6);
      }
      ey += 9;
    }
    c.shadowBlur = 0;
    c.restore();
    if (showHud) this.renderAbilityButton(c);

    for (const f of this.floats) {
      c.globalAlpha = Math.min(1, (f.t / f.max) * 1.5);
      glowText(c, f.text, f.x, f.y, f.size, WHITE, col, 'center', 700);
    }
    c.globalAlpha = 1;

    if (this.banner) {
      const bnr = this.banner;
      const age = bnr.max - bnr.t;
      c.globalAlpha = Math.min(1, age / 0.3, bnr.t / 0.5);
      neonTitle(c, bnr.text, W / 2, this.H * 0.5, 54, col, col, 6);
      if (bnr.sub) glowText(c, bnr.sub, W / 2, this.H * 0.5 + 56, 20, WHITE, col, 'center', 700, 6);
      c.globalAlpha = 1;
    } else if (this.holding && showHud) {
      c.globalAlpha = 0.45 + 0.35 * Math.sin(this.t * 4);
      glowText(c, 'SOLTE PARA LANÇAR', W / 2, this.H * 0.62, 18, WHITE, col, 'center', 500, 4);
      c.globalAlpha = 1;
      if (this.holdT > AUTO_LAUNCH - 5) glowText(c, 'LANÇANDO EM ' + Math.ceil(AUTO_LAUNCH - this.holdT), W / 2, this.H * 0.62 + 34, 15, WHITE, col, 'center', 700, 3);
    }
    if (this.clearT > 0) {
      c.globalAlpha = Math.min(1, (1.6 - this.clearT) / 0.3);
      neonTitle(c, 'LIMPO', W / 2, this.H * 0.5, 66, col, col, 10);
      c.globalAlpha = 1;
    }

    if (showHud) this.renderHud(c);
  }

  renderHud(c) {
    const col = this.col;
    const hy = this.top - 62;
    glowText(c, String(this.score), W / 2, hy, 36, WHITE, col, 'center', 700, 3);
    const sub = stageLabel(this.index) + '  ·  ' + (this.boss ? 'CHEFÃO' : this.world.name);
    glowText(c, sub, W / 2, hy + 36, 13, rgba(col, 0.85), col, 'center', 500, 4);
    const ds = discSprite(col, BALL_R, this.plat.disc || 0);
    for (let i = 0; i < Math.min(this.lives, 6); i++) drawSprite(c, ds, 30 + i * 30, hy - 9, 0.55);
    if (this.wallet) {
      drawSprite(c, coinSprite(), 30, hy + 18, 0.62);
      glowText(c, String(this.wallet()), 54, hy + 27, 15, WHITE, COIN_COL, 'left', 700, 1);
    }
    c.beginPath();
    c.moveTo(W - 56, hy - 14); c.lineTo(W - 56, hy + 14);
    c.moveTo(W - 40, hy - 14); c.lineTo(W - 40, hy + 14);
    neonStroke(c, col, col, 4, W - 56, hy - 14, W - 40, hy + 14, 0.7);
    if (this.boss && !this.boss.dead) this.renderBossBar(c);
  }

  renderBossBar(c) {
    const b = this.boss, col = this.col;
    const y = this.top + 26;
    glowText(c, b.name + (b.fury ? '  ·  FÚRIA' : ''), W / 2, y, 13, WHITE, col, 'center', 700, 4);
    const bw = 250, gap = 14, x0 = W / 2 - bw - gap / 2;
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * (bw + gap);
      const frac = i === 0 ? (b.lives === 2 ? b.hp / b.hpMax : 0) : (b.lives === 2 ? 1 : b.hp / b.hpMax);
      roundRectPath(c, x, y + 14, bw, 10, 5);
      c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
      if (frac > 0) {
        roundRectPath(c, x + 2, y + 16, (bw - 4) * Math.max(0, frac), 6, 3);
        c.fillStyle = i === 1 && b.lives === 2 ? rgba(col, 0.35) : col;
        c.shadowColor = col; c.shadowBlur = 10 * view.blur; c.fill(); c.shadowBlur = 0;
      }
    }
  }
}
