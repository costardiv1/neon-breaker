import { view, rgba, mix, roundRectPath, neonStroke, neonTitle, glowText, drawSprite, TAU } from './render.js';
import { Game, W, BALL_R, BASE_HW, POWERS, ABILITIES, WIDTH_COST, drawAbilityIcon, gfx, HIT_T, coinSprite, DISCS, TRAILS, discSprite, drawTrail, trimTrail, clearSprites, tierTone } from './game.js';
import { SHAPES, PALETTES, EMBLEMS, drawPlatform, outAngle, paletteColors } from './platform.js';
import { MECHS, WORLDS, TOTAL_STAGES, getStage, stageLabel, worldMechs, worldStart, worldCount } from './levels.js';
import { THEMES } from './themes.js';
import { sfx, music, haptics } from './audio.js';

// ---------- persistence ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('nb_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nb_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const safeEl = document.getElementById('safe');
const BODY_FONT = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
export const VERSION = '1.0';

let H = 1280;
let safeTop = 0;
let scene = 'menu';   // menu | map | plat | shop | colors | options | dev | play | pause | over | card | world | crash
let colorIndex = Math.min(store.get('color', 0), THEMES.length - 1);
const savedPlat = store.get('plat', {});
const plat = {
  shape: Math.min(savedPlat.shape || 0, SHAPES.length - 1),
  pal: Math.min(savedPlat.pal || 0, PALETTES.length - 1),
  emb: Math.min(savedPlat.emb ?? 1, EMBLEMS.length - 1),
  disc: Math.min(savedPlat.disc || 0, DISCS.length - 1),
  trail: Math.min(savedPlat.trail || 0, TRAILS.length - 1),
  dash: !!savedPlat.dash,                 // dashed main line
  detail: savedPlat.detail !== false,     // extra decoration of each shape
};
let best = store.get('best', 0);
let prog = store.get('prog', 0);          // number of stages cleared
let seen = store.get('seen', {});         // mechanic / boss intro cards already shown
let chips = store.get('chips', 0);        // currency for the platform workshop
const upg = Object.assign({ megalaser: 0, shock: 0, shield: 0, magnet: 0, width: 0 }, store.get('upg', {}));
let equip = store.get('equip', null);     // equipped platform ability
let coins = store.get('coins', 0);        // caught in play (rare drops), spent on colors and emblems
// cosmetics owned; the ones already in use when this was introduced stay free
const owned = Object.assign({ pal: [...new Set([0, PALETTES.length - 1, plat.pal])], emb: [...new Set([0, 1, plat.emb])], disc: [0], trail: [0] },
  store.get('owned', {}));
const saveChips = () => {
  store.set('chips', chips); store.set('upg', upg); store.set('equip', equip);
  store.set('coins', coins); store.set('owned', owned);
};
let newShape = null;                      // shape unlocked by the boss just beaten
let lastScore = 0;
let newBest = false;
sfx.enabled = store.get('sound', true);
sfx.musicOn = store.get('music', true);

const DROP_STEPS = [0.13, 0.25, 0.5, 1];
const opts = Object.assign({ vibe: true, sens: 1.25, dev: false, inf: false, speed: 1, startStage: 0, fps: false, drop: 0, unlock: false },
  store.get('opts', {}));
if (!(opts.startStage >= 0 && opts.startStage < TOTAL_STAGES)) opts.startStage = 0;

// graphics quality (dev panel > VISUAL). Phones start lighter: less neon glow,
// lower render resolution and fewer particles.
// PC: everything at maximum. Phone: everything at maximum except the neon glow
// (off: it is the heaviest effect) and the field texture at 150%.
const GFX_PC = { glow: 1.5, res: 1, fx: 1.5, trail: 1, grid: 2 };
const GFX_MOBILE = { glow: 0, res: 1, fx: 1.5, trail: 1, grid: 1.5 };
const MOBILE = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
const GFX_VER = 2;        // bump to reset everyone's graphics to the new defaults
if (opts.gfxV !== GFX_VER) { opts.gfx = null; opts.gfxV = GFX_VER; }
opts.gfx = Object.assign({}, MOBILE ? GFX_MOBILE : GFX_PC, opts.gfx || {});
// player-facing options: QUALIDADE (everything but the neon) and NEON
const QUALITY = [
  { name: 'BAIXA', res: 0.6, fx: 0.5, trail: 0.6, grid: 0.8 },
  { name: 'MÉDIA', res: 0.8, fx: 1, trail: 1, grid: 1.2 },
  { name: 'ALTA', res: 1, fx: 1.5, trail: 1, grid: MOBILE ? 1.5 : 2 },
];
const NEON = [{ name: 'DESLIGADO', v: 0 }, { name: 'BAIXO', v: 0.5 }, { name: 'MÉDIO', v: 1 }, { name: 'ALTO', v: 1.5 }];
const qualityIndex = () => QUALITY.findIndex((q) => ['res', 'fx', 'trail', 'grid'].every((k) => Math.abs(q[k] - opts.gfx[k]) < 0.001));
const neonIndex = () => NEON.findIndex((q) => Math.abs(q.v - opts.gfx.glow) < 0.001);
function applyGfx() {
  view.glow = opts.gfx.glow;
  view.blur = view.res * view.glow;
  gfx.fx = opts.gfx.fx; gfx.trail = opts.gfx.trail; gfx.grid = opts.gfx.grid;
}
applyGfx();

const col = () => THEMES[colorIndex].c;
const unlocked = (i) => i <= prog || (opts.dev && opts.unlock);
// each boss beaten unlocks the next platform shape
function bossesBeaten() {
  let n = 0;
  for (let w = 0; w < WORLDS.length; w++) if (!WORLDS[w].soon && prog > worldStart(w) + worldCount(w) - 1) n++;
  return n;
}
if (plat.shape > bossesBeaten()) plat.shape = 0;

// ---------- tutorial ----------
const TUT = [
  { on: 'start', title: 'BEM-VINDO', focus: 'void',
    text: 'Destrua todos os blocos. Não deixe o disco cair.' },
  { on: 'start', title: 'MOVER', focus: 'paddle',
    text: 'Toque ou arraste o dedo para mover a plataforma.' },
  { on: 'start', title: 'LANÇAR', focus: 'ball',
    text: 'Solte o dedo para lançar o disco.' },
  { on: 'brick', title: 'BLOCOS', focus: 'brick',
    text: 'Blocos mais claros aguentam mais batidas.' },
  { on: 'paddle', title: 'ÂNGULO', focus: 'paddle',
    text: 'Bater nas pontas da plataforma inclina o disco.' },
  { on: 'drop', title: 'PODERES', focus: 'drop',
    text: 'Cápsulas redondas ajudam. As que piscam atrapalham.' },
  { on: 'clear', title: 'DISTRITOS', focus: null,
    text: 'Fase limpa! Cada distrito traz uma mecânica nova e um chefão no fim.' },
];
let tut = null;
let card = null;

function fire(e) {
  tut.fired.add(e);
  if (scene === 'play') nextTut();
}

function nextTut() {
  const i = TUT.findIndex((s, k) => !tut.shown.has(k) && tut.fired.has(s.on));
  if (i < 0) return false;
  card = { ...TUT[i], kicker: `TUTORIAL  ${i + 1}/${TUT.length}`, idx: i };
  showCard();
  return true;
}

function showCard() { drag = null; setScene('card'); }

function closeCard() {
  const c = card;
  card = null;
  if (c && c.idx !== undefined && tut) {
    tut.shown.add(c.idx);
    if (tut.shown.size === TUT.length) { store.set('tutDone', true); tut = null; game.tutorial = false; }
    else if (nextTut()) return;
  }
  setScene('play');
}

function skipTutorial() {
  store.set('tutDone', true);
  tut = null;
  card = null;
  game.tutorial = false;
  setScene('play');
}

function markSeen(k) { seen[k] = true; store.set('seen', seen); }

const game = new Game({
  onGameOver(score) {
    lastScore = score;
    newBest = score > best;
    if (newBest) { best = score; store.set('best', best); }
    setScene('over');
  },
  onEvent(e, data) {
    if (e === 'level') {
      if (tut && game.index === 0) { fire('start'); return; }
      const st = game.stage;
      if (st.boss && !seen['boss_' + st.boss.type]) {
        markSeen('boss_' + st.boss.type);
        card = { kicker: `DISTRITO ${st.w + 1}  ·  CHEFÃO`, title: st.boss.name, text: st.boss.text, focus: 'boss' };
        showCard();
      } else if (st.mech && !seen[st.mech]) {
        markSeen(st.mech);
        const extra = st.w > 0 ? ' Continuam valendo: ' + worldMechs(st.w - 1).map((m) => MECHS[m].name).join(', ') + '.' : '';
        card = { kicker: `DISTRITO ${st.w + 1}  ·  NOVA MECÂNICA`, title: MECHS[st.mech].name, text: MECHS[st.mech].text + extra, focus: 'mech' };
        showCard();
      }
      return;
    }
    if (e === 'chip') { chips += data; return; }
    if (e === 'coin') { coins += data; return; }
    if (e === 'stageClear') {
      const nb0 = bossesBeaten();
      prog = Math.max(prog, data + 1); store.set('prog', prog);
      const nb1 = bossesBeaten();
      if (nb1 > nb0 && SHAPES[nb1]) newShape = SHAPES[nb1].name;
      saveChips();
      return;
    }
    if (e === 'worldClear') {
      saveChips();
      if (game.world.final) { startCrash(); return; }
      lastScore = game.score;
      if (game.score > best) { best = game.score; store.set('best', best); }
      setScene('world');
      return;
    }
    if (tut) fire(e);
  },
});
game.plat = plat;
game.wallet = () => coins;
game.setColor(col());
window.__nb = { game, render: () => render(), go: (s) => setScene(s), crash: () => startCrash(), get scene() { return scene; } }; // debug handle

function applyOpts() {
  store.set('opts', opts);
  haptics.on = opts.vibe;
  game.infinite = opts.dev && opts.inf;
  game.speedMul = opts.dev ? opts.speed : 1;
  game.dropChance = opts.dev ? DROP_STEPS[opts.drop] : DROP_STEPS[0];
}
applyOpts();

// ---------- in-game dev panel state ----------
let devOpen = false;
let devTab = 0;
let freeze = false;
let drag = null;

const IN_GAME = ['play', 'pause', 'over', 'card', 'world', 'crash'];
function setScene(s) {
  if (s !== 'play') saveChips();
  if (s === 'map' && scene !== 'map') focusMap();
  if (s === 'plat' && scene !== 'plat') openPlat();
  showGateInput(s === 'devgate' && !opts.dev);
  scene = s;
  sfx.setPlaying(s === 'play');
  if (s === 'crash') music.play(null);
  else if (!IN_GAME.includes(s)) music.play('map');
  music.duck(s === 'pause' || s === 'card' || s === 'over');
  if (s !== 'play') devOpen = false;
}
setScene('menu');

// ---------- layout ----------
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const Hl = Math.max(1100, Math.min(1650, (W * vh) / vw));
  let cssW = vw, cssH = (vw * Hl) / W;
  if (cssH > vh) { cssH = vh; cssW = (vh * W) / Hl; }
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const dpr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, 2.5) * opts.gfx.res);
  view.res = (cssW * dpr) / W;
  view.blur = view.res * view.glow;
  canvas.width = Math.round(W * view.res);
  canvas.height = Math.round(Hl * view.res);
  H = Hl;
  safeTop = (parseFloat(getComputedStyle(safeEl).paddingTop) || 0) * (W / cssW);
  game.setLayout(H, safeTop + 130);
  clearSprites();
}
window.addEventListener('resize', () => { resize(); if (gateInput && gateInput.style.display !== 'none') placeGateInput(); });
resize();
try { for (const w of [500, 700, 800, 900]) document.fonts.load(`${w} 32px Orbitron`); } catch (e) { /* ignore */ }

// ---------- buttons ----------
let buttons = [];
let pressed = null;

function btn(x, y, w, h, label, fn, o = {}) {
  return { x: x - w / 2, y: y - h / 2, w, h, label, fn, ...o };
}

const onOff = (v, f = false) => (v ? (f ? 'LIGADA' : 'LIGADO') : (f ? 'DESLIGADA' : 'DESLIGADO'));
const stageName = (i) => { const st = getStage(i); return stageLabel(i) + '  ·  ' + (st.boss ? st.boss.name : st.world.name); };

// ---------- sliders (dev settings) ----------
const pct = (v) => Math.round(v * 100) + '%';
const SL = {
  speed: { min: 0.3, max: 2.5, step: 0.05, get: () => opts.speed, set: (v) => { opts.speed = v; }, fmt: pct },
  sens: { min: 0.5, max: 2.5, step: 0.1, get: () => opts.sens, set: (v) => { opts.sens = v; }, fmt: (v) => v.toFixed(1) + 'x' },
  drop: { min: 0, max: DROP_STEPS.length - 1, step: 1, get: () => opts.drop, set: (v) => { opts.drop = v; }, fmt: (v) => pct(DROP_STEPS[v]) },
  stage: { min: 0, max: TOTAL_STAGES - 1, step: 1, get: () => opts.startStage, set: (v) => { opts.startStage = v; }, fmt: (v) => stageName(v) },
};
function setGfx() {
  const res = view.res;
  applyGfx();
  store.set('opts', opts);
  resize();               // render scale; also clears the cached sprites
  if (view.res === res) clearSprites();
}
const gfxSl = (key, min, max) => ({ min, max, step: 0.05, get: () => opts.gfx[key], set: (v) => { opts.gfx[key] = v; }, fmt: pct, after: setGfx });
function presetGfx(p) { Object.assign(opts.gfx, p); setGfx(); }
let slide = null;         // slider being dragged: { b, id }
function setSlider(b, p) {
  const s = b.slider, pad = 22;
  const u = clampN((p.x - b.x - pad) / (b.w - pad * 2), 0, 1);
  const v = clampN(+(Math.round((s.min + u * (s.max - s.min)) / s.step) * s.step).toFixed(4), s.min, s.max);
  if (v === s.get()) return;
  s.set(v);
  if (s.after) s.after(); else applyOpts();
}
function drawSlider(c, b) {
  const k = col(), s = b.slider, pad = 22, active = slide && slide.b.label === b.label;
  roundRectPath(c, b.x, b.y, b.w, b.h, 12);
  c.fillStyle = rgba(k, active ? 0.16 : 0.05); c.fill();
  c.strokeStyle = rgba(k, 0.45); c.lineWidth = 1.5; c.stroke();
  const x0 = b.x + pad, x1 = b.x + b.w - pad, ty = b.y + b.h - Math.min(18, b.h * 0.3);
  const u = (s.get() - s.min) / (s.max - s.min), kx = x0 + (x1 - x0) * u;
  const ly = b.y + Math.max(17, b.h * 0.32);
  glowText(c, b.label, x0, ly, b.h > 60 ? 15 : 12, rgba('#ffffff', 0.85), k, 'left', 600, 2);
  glowText(c, s.fmt(s.get()), x1, ly, b.h > 60 ? 16 : 13, '#ffffff', k, 'right', 700, 1);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, ty); c.lineTo(x1, ty); c.strokeStyle = rgba(k, 0.22); c.lineWidth = 6; c.stroke();
  c.beginPath(); c.moveTo(x0, ty); c.lineTo(kx, ty); c.strokeStyle = k; c.stroke();
  c.beginPath(); c.arc(kx, ty, active ? 12 : 9, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
  c.strokeStyle = k; c.lineWidth = 2; c.stroke();
}

function optionRows() {
  if (scene === 'options') {
    const rows = [
      { label: 'SOM', val: () => onOff(sfx.enabled), tap: () => { sfx.setEnabled(!sfx.enabled); store.set('sound', sfx.enabled); } },
      { label: 'MÚSICA', val: () => onOff(sfx.musicOn, true), tap: () => { sfx.setMusic(!sfx.musicOn); store.set('music', sfx.musicOn); } },
      { label: 'VIBRAÇÃO', val: () => onOff(opts.vibe, true), tap: () => { opts.vibe = !opts.vibe; } },
      { label: 'SENSIBILIDADE', val: () => opts.sens.toFixed(1) + 'x', step: (d) => { opts.sens = clampN(Math.round((opts.sens + d * 0.1) * 10) / 10, 0.5, 2.5); } },
      { label: 'QUALIDADE', val: () => (qualityIndex() < 0 ? 'PERSONAL.' : QUALITY[qualityIndex()].name), step: (d) => {
        const i = qualityIndex(), n = QUALITY.length;
        const q = QUALITY[i < 0 ? (d > 0 ? n - 1 : 0) : (i + d + n) % n];
        presetGfx({ res: q.res, fx: q.fx, trail: q.trail, grid: q.grid });
      }, wide: true },
      { label: 'NEON', val: () => (neonIndex() < 0 ? pct(opts.gfx.glow) : NEON[neonIndex()].name), step: (d) => {
        const i = neonIndex(), n = NEON.length;
        presetGfx({ glow: NEON[i < 0 ? 2 : (i + d + n) % n].v });
      }, wide: true },
      { label: 'TUTORIAL', val: () => 'REVER', tap: () => { store.set('tutDone', false); startGame(0); } },
      { label: 'CRÉDITOS', val: () => 'VER  ›', tap: () => setScene('credits') },
    ];
    if (opts.dev) {
      rows.push({ label: 'MODO DEV', val: () => onOff(true), tap: () => { opts.dev = false; } });
      rows.push({ label: 'CONFIG. DEV', val: () => 'ABRIR  ›', tap: () => setScene('dev') });
    }
    return rows;
  }
  return [
    { label: 'VIDAS INFINITAS', val: () => onOff(opts.inf, true), tap: () => { opts.inf = !opts.inf; } },
    { label: 'DESBLOQUEAR TUDO', val: () => onOff(opts.unlock), tap: () => { opts.unlock = !opts.unlock; } },
    { label: 'VELOCIDADE', slider: SL.speed },
    { label: 'FASE', slider: SL.stage },
    { label: 'DROPS', slider: SL.drop },
    { label: 'MOSTRAR FPS', val: () => onOff(opts.fps), tap: () => { opts.fps = !opts.fps; } },
    { label: 'RESETAR PROGRESSO', val: () => (performance.now() - resetArm < 3000 ? 'TOQUE DE NOVO' : 'RESETAR'), tap: () => {
      if (performance.now() - resetArm < 3000) { resetArm = 0; resetProgress(); } else resetArm = performance.now();
    } },
    { label: 'JOGAR NA FASE', val: () => stageLabel(opts.startStage), tap: () => startGame(opts.startStage) },
  ];
}

// Wipes progress, chips, coins and everything bought with them.
function resetProgress() {
  best = 0; seen = {}; prog = 0; chips = 0; coins = 0; equip = null;
  for (const k in upg) upg[k] = 0;
  Object.assign(owned, { pal: [0, PALETTES.length - 1], emb: [0, 1], disc: [0], trail: [0] });
  Object.assign(plat, { shape: 0, pal: 0, emb: 1, disc: 0, trail: 0, dash: false, detail: true });
  store.set('best', 0); store.set('seen', {}); store.set('tutDone', false); store.set('prog', 0); store.set('plat', plat);
  saveChips();
  optMsg = { text: 'PROGRESSO RESETADO', t: performance.now() / 1000 };
}
let resetArm = 0;          // first tap arms the reset, the second confirms it
let optMsg = null;

function optionButtons() {
  const list = [];
  const rows = optionRows();
  const stepY = Math.min(scene === 'options' ? 84 : 90, (H - 190 - (safeTop + 200)) / Math.max(1, rows.length - 1));
  rows.forEach((row, i) => {
    const y = safeTop + 200 + i * stepY;
    const done = (fn) => () => { fn(); applyOpts(); };
    if (row.slider) {
      list.push({ x: W / 2 - 320, y: y - 37, w: 640, h: 74, label: row.label, slider: row.slider, fn: () => {} });
    } else if (row.step) {
      list.push(btn(W / 2, y, 640, 74, row.label, null, { optRow: row }));
      list.push(btn(W / 2 + (row.wide ? 10 : 120), y, 64, 64, '', done(() => row.step(-1)), { arrow: -1 }));
      list.push(btn(W / 2 + 280, y, 64, 64, '', done(() => row.step(1)), { arrow: 1 }));
    } else {
      list.push(btn(W / 2, y, 640, 74, row.label, done(row.tap), { optRow: row }));
    }
  });
  return list;
}

// ---------- world map: an isometric neon city ----------
// The route is a street that zigzags down through 10 districts. Each district's
// boss stands at the gate in the fence that leads to the next one.
const TW = 36, TH = 18, RUN = 12, J0 = 6;
const isoXY = (i, j) => ({ x: W / 2 + (i - j) * TW, y: 70 + (i + j - J0) * TH });
const DSEG = (w) => (WORLDS[w].soon ? 12 : worldCount(w) * 6);
let isoCache = null;
function isoData() {
  if (isoCache) return isoCache;
  const total = WORLDS.reduce((n, _, w) => n + DSEG(w), 0);
  const path = [];
  let i = 0, j = J0;
  for (let t = 0; t < total; t++) {
    path.push({ i, j, ...isoXY(i, j) });
    if (Math.floor(t / RUN) % 2 === 0) i++; else j++;
  }
  const dist = [];
  let t0 = 0;
  WORLDS.forEach((wd, w) => { const n = DSEG(w); dist.push({ w, t0, t1: t0 + n, gate: t0 + n - 3 }); t0 += n; });
  const nodes = [];
  WORLDS.forEach((wd, w) => {
    if (wd.soon) return;
    for (let k = 0; k < worldCount(w); k++) { const t = dist[w].t0 + 3 + 6 * k; nodes.push({ t, ...path[t], boss: k === worldCount(w) - 1, w }); }
  });
  isoCache = { path, dist, nodes, total, height: path[total - 1].y + 260 };
  return isoCache;
}
const mapViewTop = () => safeTop + 130;
const mapViewH = () => H - 150 - mapViewTop();
let mapScroll = 0;
const clampScroll = (v) => clampN(v, 0, Math.max(0, isoData().height - mapViewH()));
function focusMap() {
  const D = isoData(), n = D.nodes[Math.min(prog, D.nodes.length - 1)];
  mapScroll = clampScroll(n.y - mapViewH() * 0.45);
}
function nodePos(i) {
  const n = isoData().nodes[i];
  return { x: n.x, y: n.y + mapViewTop() - mapScroll, boss: n.boss };
}

function mapButtons() {
  const list = [];
  const top = mapViewTop(), bot = top + mapViewH();
  for (let i = 0; i < TOTAL_STAGES; i++) {
    const p = nodePos(i);
    if (p.y < top + 24 || p.y > bot - 24) continue;
    const r = p.boss ? 46 : 38;
    list.push({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2, node: i, fn: unlocked(i) ? () => startGame(i) : null });
  }
  return list;
}

// ---------- platform workshop ----------
const SHOP = ['megalaser', 'shock', 'shield', 'magnet', 'width'];
let shopMsg = null;
const shopTop = () => safeTop + 250;
const shopRowH = () => Math.min(132, (H - 190 - shopTop()) / SHOP.length);
const shopInfo = (k) => (k === 'width'
  ? { name: 'PLATAFORMA LARGA', desc: 'Cada nível deixa a plataforma 8% mais larga, para sempre.', cost: WIDTH_COST }
  : ABILITIES[k]);
function buy(k) {
  const lvl = upg[k], info = shopInfo(k);
  if (lvl >= 3) return;
  const cost = info.cost[lvl];
  if (chips < cost) { shopMsg = { text: 'CHIPS INSUFICIENTES', t: performance.now() / 1000 }; return; }
  chips -= cost;
  upg[k] = lvl + 1;
  if (k !== 'width' && !equip) equip = k;
  sfx.power(true);
  shopMsg = { text: (lvl ? 'EVOLUÍDO: ' : 'COMPRADO: ') + info.name, t: performance.now() / 1000 };
  saveChips();
}
function shopButtons() {
  const list = [], rh = shopRowH();
  SHOP.forEach((k, i) => {
    const y = shopTop() + i * rh + rh / 2, lvl = upg[k], info = shopInfo(k);
    const ab = k !== 'width';
    const label = lvl >= 3 ? 'MÁXIMO' : (lvl ? 'EVOLUIR  ' : 'COMPRAR  ') + info.cost[lvl];
    list.push(btn(W - 128, ab && lvl ? y - 24 : y, 184, 46, label, lvl >= 3 ? null : () => buy(k), { fs: 14 }));
    if (ab && lvl) list.push(btn(W - 128, y + 26, 184, 40, equip === k ? 'EQUIPADO' : 'EQUIPAR', () => { equip = equip === k ? null : k; saveChips(); }, { fs: 13, on: equip === k }));
  });
  return list;
}
function renderShop(c, now) {
  const k = col(), rh = shopRowH();
  SHOP.forEach((key, i) => {
    const y = shopTop() + i * rh, info = shopInfo(key), lvl = upg[key];
    roundRectPath(c, 24, y + 4, W - 48, rh - 12, 16);
    c.fillStyle = rgba(k, equip === key ? 0.1 : 0.03); c.fill();
    neonStroke(c, k, k, equip === key ? 2.5 : 1.5, 24, y, W - 24, y + rh, equip === key ? 0.9 : 0.35);
    const cy = y + rh / 2;
    c.beginPath(); c.arc(70, cy, 28, 0, TAU);
    c.strokeStyle = rgba(k, lvl ? 0.9 : 0.35); c.lineWidth = 2; c.stroke();
    drawAbilityIcon(c, key, 70, cy, 13, lvl ? '#ffffff' : rgba(k, 0.5));
    glowText(c, info.name, 118, y + 34, 17, '#ffffff', k, 'left', 700, 2);
    for (let q = 0; q < 3; q++) {
      c.beginPath(); c.rect(118 + q * 22, y + 50, 14, 8);
      if (q < lvl) { c.fillStyle = k; c.fill(); } else { c.strokeStyle = rgba(k, 0.5); c.lineWidth = 1.5; c.stroke(); }
    }
    c.font = `500 14px ${BODY_FONT}`;
    c.fillStyle = 'rgba(255,255,255,0.72)';
    c.textAlign = 'left';
    wrap(c, info.desc, 330).slice(0, Math.max(1, Math.floor((rh - 74) / 18))).forEach((ln, li) => c.fillText(ln, 118, y + 80 + li * 18));
  });
  if (!platMsg(c, now, H - 150)) {
    c.font = `500 14px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.6)'; c.textAlign = 'center';
    c.fillText('Equipe um poder. Ele carrega quebrando blocos; use com toque duplo.', W / 2, H - 150);
  }
}
function platMsg(c, now, y) {
  if (!shopMsg || now - shopMsg.t >= 1.8) return false;
  c.globalAlpha = Math.min(1, (1.8 - (now - shopMsg.t)) * 2);
  glowText(c, shopMsg.text, W / 2, y, 16, '#ffffff', col(), 'center', 700, 3);
  c.globalAlpha = 1;
  return true;
}

// ---------- platform screen: shape, colors, emblem and powers ----------
// Shapes unlock as bosses fall; colors and emblems are bought with coins.
const PLAT_TABS = ['FORMATO', 'CORES', 'EMBLEMA', 'DISCO', 'RASTRO', 'PODERES'];
const POW_TAB = 5;
const PAL_COST = [0, 25, 30, 40, 50, 90, 60, 0];
const EMB_COST = [0, 0, 150, 180, 220, 260, 450, 320];
let platTab = 0;
const browse = { shape: 0, pal: 0, emb: 0, disc: 0, trail: 0 };
const CATS = {
  shape: { n: () => SHAPES.length, name: (i) => SHAPES[i].name },
  pal: { n: () => PALETTES.length, name: (i) => PALETTES[i].name, cost: (i) => PAL_COST[i] ?? 60 },
  emb: { n: () => EMBLEMS.length, name: (i) => EMBLEMS[i], cost: (i) => EMB_COST[i] ?? 250 },
  disc: { n: () => DISCS.length, name: (i) => DISCS[i].name, cost: (i) => DISCS[i].cost },
  trail: { n: () => TRAILS.length, name: (i) => TRAILS[i].name, cost: (i) => TRAILS[i].cost },
};
const catKey = () => ['shape', 'pal', 'emb', 'disc', 'trail'][platTab];
const catN = (key) => CATS[key].n();
const catName = (key, i) => CATS[key].name(i);
const itemCost = (key, i) => CATS[key].cost(i);
function itemOpen(key, i) {
  if (opts.dev && opts.unlock) return true;
  return key === 'shape' ? i <= bossesBeaten() : itemCost(key, i) === 0 || owned[key].includes(i);
}
function shapeNeed(i) {
  const wd = WORLDS[i - 1], b = wd && wd.boss;
  return 'DERROTE ' + (b && !wd.soon ? b.name : 'O CHEFÃO DO DISTRITO ' + i);
}
function openPlat() { for (const k in browse) browse[k] = plat[k]; }
function browseItem(d) {
  const key = catKey(), n = catN(key);
  browse[key] = (browse[key] + d + n) % n;
  if (itemOpen(key, browse[key])) { plat[key] = browse[key]; store.set('plat', plat); }
}
function buyItem() {
  const key = catKey(), i = browse[key], cost = itemCost(key, i);
  if (coins < cost) { shopMsg = { text: 'MOEDAS INSUFICIENTES', t: performance.now() / 1000 }; return; }
  coins -= cost;
  owned[key].push(i);
  plat[key] = i; store.set('plat', plat);
  sfx.power(true);
  shopMsg = { text: 'COMPRADO: ' + catName(key, i), t: performance.now() / 1000 };
  saveChips();
}
const platSelY = () => safeTop + 690;
function platButtons() {
  const list = [], cx = W / 2, tw = (W - 48) / PLAT_TABS.length;
  PLAT_TABS.forEach((t, i) => list.push({ x: 24 + i * tw + 4, y: safeTop + 166, w: tw - 6, h: 54, label: t, fn: () => { platTab = i; openPlat(); }, ptab: i }));
  if (opts.dev) list.push(btn(cx, safeTop + 124, 120, 36, '+ DEV', () => { chips += 500; coins += 100; saveChips(); }, { small: true }));
  if (platTab === POW_TAB) list.push(...shopButtons());
  else {
    const y = platSelY(), key = catKey(), i = browse[key];
    list.push(btn(cx - 270, y, 84, 84, '', () => browseItem(-1), { arrow: -1 }));
    list.push(btn(cx + 270, y, 84, 84, '', () => browseItem(1), { arrow: 1 }));
    if (key !== 'shape' && !itemOpen(key, i)) list.push(btn(cx, y + 125, 420, 72, 'COMPRAR  ·  ' + itemCost(key, i) + ' MOEDAS', buyItem, { fs: 17 }));
    if (key === 'shape') {
      const tog = (k2) => () => { plat[k2] = !plat[k2]; store.set('plat', plat); };
      list.push(btn(cx - 140, y + 190, 260, 56, 'LINHA: ' + (plat.dash ? 'TRACEJADA' : 'SÓLIDA'), tog('dash'), { fs: 13 }));
      list.push(btn(cx + 140, y + 190, 260, 56, 'DETALHES: ' + (plat.detail ? 'SIM' : 'NÃO'), tog('detail'), { fs: 13 }));
    }
  }
  list.push(btn(cx, H - 80, 400, 76, 'VOLTAR', () => setScene('menu')));
  return list;
}
function renderPlatScreen(c, now) {
  const k = col();
  neonTitle(c, 'PLATAFORMA', W / 2, safeTop + 66, 44, k, k, 10);
  drawSprite(c, coinSprite(), 36, safeTop + 111);
  glowText(c, coins + ' MOEDAS', 72, safeTop + 124, 17, '#ffffff', '#ffd84a', 'left', 700, 2);
  c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2; c.strokeRect(W - 60, safeTop + 113, 22, 22); c.strokeRect(W - 54, safeTop + 119, 10, 10);
  glowText(c, chips + ' CHIPS', W - 70, safeTop + 124, 17, '#ffffff', k, 'right', 700, 2);
  if (platTab === POW_TAB) { renderShop(c, now); return; }
  const key = catKey(), i = browse[key], open = itemOpen(key, i), n = catN(key);
  const pv = Object.assign({}, plat, { [key]: i });
  const px = W / 2, py = safeTop + 400, S = 1.6, sh = SHAPES[pv.shape];
  if (key === 'shape') {
    c.save();
    c.setLineDash([6, 8]);
    c.lineDashOffset = -now * 40;
    for (const kx of [-0.9, -0.5, 0, 0.5, 0.9]) {
      const u = kx * BASE_HW;
      const sx = px + u * S, sy = py + sh.y(u, BASE_HW) * S - 14;
      const th = outAngle(pv.shape, kx);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.sin(th) * 150, sy - Math.cos(th) * 150);
      c.strokeStyle = rgba(k, open ? 0.55 : 0.25); c.lineWidth = 2; c.stroke();
    }
    c.restore();
  }
  if (key === 'disc' || key === 'trail') {
    // a disc flying a figure-eight, with the browsed look
    const at = (tt) => ({ x: px + 200 * Math.sin(tt * 1.7), y: py - 10 + 95 * Math.sin(tt * 3.4) });
    const path = [];
    for (let q = 60; q >= 1; q--) path.push(at(now - q * 0.012));
    const h = at(now);
    if (!open) c.globalAlpha = 0.45;
    drawTrail(c, path, h.x, h.y, k, 520, BALL_R * 1.3, pv.trail, paletteColors(pv.pal, k), now);
    c.save(); c.translate(h.x, h.y); c.rotate(now * 8);
    drawSprite(c, discSprite(k, BALL_R, pv.disc), -BALL_R * 1.3, -BALL_R * 1.3, 1.3);
    c.restore();
    c.globalAlpha = 1;
  } else {
    c.save();
    c.translate(px, py);
    c.scale(S, S);
    if (!open) c.globalAlpha = 0.4;
    // replays the shape's hit animation every 3.2 s
    drawPlatform(c, pv, 0, 0, BASE_HW, now, k, Math.max(0, 1 - (now % 3.2) / HIT_T));
    c.restore();
  }
  if (key === 'shape') {
    glowText(c, sh.desc, W / 2, safeTop + 535, 17, '#ffffff', k, 'center', 700, 5);
    for (let q = 0; q < 5; q++) {
      const x = W / 2 + 70 + q * 22, y = safeTop + 568;
      c.beginPath(); c.arc(x, y, 6, 0, TAU);
      if (q < sh.curve) { c.fillStyle = k; c.fill(); } else { c.strokeStyle = rgba(k, 0.4); c.lineWidth = 1.5; c.stroke(); }
    }
    glowText(c, 'DESVIO', W / 2 + 40, safeTop + 568, 14, rgba(k, 0.85), k, 'right', 500, 4);
  }
  const y = platSelY();
  glowText(c, PLAT_TABS[platTab] + '  ' + (i + 1) + '/' + n, W / 2, y - 34, 13, rgba(k, 0.75), k, 'center', 500, 5);
  glowText(c, catName(key, i), W / 2, y + 2, 26, open ? '#ffffff' : rgba('#ffffff', 0.55), k, 'center', 700, 4);
  for (let q = 0; q < n; q++) {
    const x = W / 2 + (q - (n - 1) / 2) * 20, yy = y + 44;
    c.beginPath(); c.arc(x, yy, q === i ? 6 : 4, 0, TAU);
    if (itemOpen(key, q)) { c.fillStyle = q === i ? '#ffffff' : k; c.fill(); } else { c.strokeStyle = rgba(k, 0.6); c.lineWidth = 1.5; c.stroke(); }
  }
  if (open) glowText(c, 'EQUIPADO', W / 2, y + 100, 16, k, k, 'center', 700, 6);
  else if (key === 'shape') {
    glowText(c, 'BLOQUEADO', W / 2, y + 96, 16, rgba(k, 0.9), k, 'center', 700, 6);
    glowText(c, shapeNeed(i) + ' PARA LIBERAR', W / 2, y + 126, 13, '#ffffff', k, 'center', 500, 3);
  }
  if (!platMsg(c, now, y + 200) && key !== 'shape') {
    c.font = `500 14px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.6)'; c.textAlign = 'center';
    c.fillText('Moedas caem dos blocos de vez em quando. Pegue com a plataforma.', W / 2, y + 200);
  }
}

// ---------- ending: the game pretends to crash ----------
const CRASH_END = 14.2;
const CRASH_LINES = [
  '*** FALHA CRÍTICA ***',
  '',
  'O_SISTEMA.EXE parou de responder.',
  'erro 0x0000: LUCRO não encontrado',
  '',
  '> reiniciando O SISTEMA...',
  '  falha.',
  '> reiniciando O SISTEMA...',
  '  falha.',
  '> reiniciando O SISTEMA...',
  '',
  'não há SISTEMA para reiniciar.',
];
let crash = { t0: 0, snap: null };
function startCrash() {
  const snap = document.createElement('canvas');
  snap.width = canvas.width; snap.height = canvas.height;
  try { snap.getContext('2d').drawImage(canvas, 0, 0); } catch (e) { /* ignore */ }
  crash = { t0: performance.now() / 1000, snap };
  sfx.crash();
  setScene('crash');
}
function renderCrash(c, now) {
  const t = now - crash.t0, k = col();
  if (t < 1.4) {
    // frozen last frame, torn into shifting slices
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const cw = canvas.width, ch = canvas.height;
    if (crash.snap) c.drawImage(crash.snap, 0, 0);
    for (let q = 0; q < 16; q++) {
      const y = Math.random() * ch, h = 4 + Math.random() * ch * 0.06, dx = (Math.random() - 0.5) * cw * 0.12;
      if (crash.snap) c.drawImage(crash.snap, 0, y, cw, h, dx, y, cw, h);
      if (Math.random() < 0.3) { c.fillStyle = Math.random() < 0.5 ? rgba(k, 0.5) : 'rgba(255,255,255,0.4)'; c.fillRect(0, y, cw, h * 0.3); }
    }
    c.restore();
    return;
  }
  if (t < 2) return;
  const fade = t > 9 ? Math.max(0, 1 - (t - 9)) : 1;
  if (fade > 0) {
    c.globalAlpha = fade;
    c.font = '20px Consolas, "Courier New", monospace';
    c.textAlign = 'left';
    c.fillStyle = '#c8c8c8';
    const n = Math.min(CRASH_LINES.length, Math.floor((t - 2) / 0.45) + 1);
    let y = safeTop + 150;
    for (let q = 0; q < n; q++) { c.fillText(CRASH_LINES[q], 40, y); y += 34; }
    if (Math.floor(t * 2.5) % 2 === 0) c.fillRect(40 + (n === CRASH_LINES.length ? c.measureText(CRASH_LINES[n - 1]).width + 6 : 0), y - 54 + (n === CRASH_LINES.length ? 0 : 34), 12, 22);
    c.globalAlpha = 1;
  }
  if (t > 10.2) {
    c.globalAlpha = Math.min(1, (t - 10.2) / 0.8);
    neonTitle(c, 'O SISTEMA CAIU.', W / 2, H * 0.4, 42, k, k, 8);
    c.globalAlpha = 1;
  }
  if (t > 11.4) {
    c.globalAlpha = Math.min(1, (t - 11.4) / 1);
    glowText(c, 'ele só parecia grande demais para cair.', W / 2, H * 0.4 + 64, 15, 'rgba(255,255,255,0.8)', k, 'center', 500, 2);
    c.globalAlpha = 1;
  }
  if (t > 12.4) {
    c.globalAlpha = Math.min(1, (t - 12.4) / 1);
    glowText(c, 'OBRIGADO POR JOGAR', W / 2, H * 0.58, 20, '#ffffff', k, 'center', 700, 6);
    c.globalAlpha = 1;
  }
  if (t > 13.4) {
    c.globalAlpha = Math.min(1, (t - 13.4) / 1.2) * 0.75;
    glowText(c, 'VINICODE', W / 2, H * 0.64, 13, rgba(k, 0.9), k, 'center', 600, 10);
    c.globalAlpha = 1;
  }
}

// ---------- credits ----------
const CREDITS = [
  ['Google Fonts', ', licença SIL Open Font License 1.1: Orbitron (Matt McInerney).'],
  ['Textos do jogo', ': fonte do seu sistema (Segoe UI, Roboto ou Helvetica).'],
  ['Gráficos, efeitos, sons e músicas', ': gerados por código no próprio jogo, sem arquivos de imagem ou áudio.'],
  ['Inspiração', ': os quebra-blocos clássicos e a estética neon de Tron.'],
];
// wraps a bold lead + regular text; returns the y after the last line
function richWrap(c, lead, rest, x, y, maxW, size, lh) {
  const words = [];
  for (const w of lead.split(' ')) words.push([w, 700]);
  rest.split(' ').forEach((w, i) => { if (i === 0 && words.length) words[words.length - 1][0] += w; else words.push([w, 400]); });
  let cx = x;
  c.textAlign = 'left';
  for (const [w, wt] of words) {
    c.font = `${wt} ${size}px ${BODY_FONT}`;
    const ww = c.measureText(w + ' ').width;
    if (cx + ww - x > maxW && cx > x) { cx = x; y += lh; }
    c.fillStyle = wt === 700 ? '#ffffff' : 'rgba(255,255,255,0.78)';
    c.fillText(w, cx, y);
    cx += ww;
  }
  return y + lh;
}
// small pixel mascot drawn next to "Claude Code"
function pixelBot(c, x, y, s) {
  const rows = ['..XXXXXX..', 'XXX.XX.XXX', '..XXXXXX..', '..X.X.X.X.'];
  c.fillStyle = '#d97757';
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'X') c.fillRect(x + i * s, y + j * s, s, s); });
}
function renderCredits(c) {
  const k = col(), cx = W / 2;
  neonTitle(c, 'CRÉDITOS', cx, safeTop + 105, 46, k, k, 12);
  let y = safeTop + 215;
  // "Feito por Vinícius Costardi e Claude Code"
  const parts = [['Feito por ', 400], ['Vinícius Costardi', 700], [' e ', 400], ['Claude Code', 700]];
  c.textBaseline = 'middle';
  let total = 0;
  for (const [t, w] of parts) { c.font = `${w} 26px ${BODY_FONT}`; total += c.measureText(t).width; }
  let x = cx - (total + 46) / 2;
  for (const [t, w] of parts) { c.font = `${w} 26px ${BODY_FONT}`; c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.fillText(t, x, y); x += c.measureText(t).width; }
  pixelBot(c, x + 12, y - 8, 4);
  c.textAlign = 'center';
  c.font = `400 24px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.9)';
  c.fillText('Desenvolvido em vibe code', cx, y + 42);
  c.fillText('Versão ' + VERSION, cx, y + 80);
  y += 165;
  glowText(c, 'ASSETS DE TERCEIROS', cx, y, 17, k, k, 'center', 700, 5);
  y += 50;
  for (const [lead, rest] of CREDITS) {
    c.beginPath(); c.arc(58, y - 2, 4, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    y = richWrap(c, lead, rest, 76, y, W - 76 - 52, 21, 31) + 14;
  }
  c.textBaseline = 'alphabetic';
}

// ---------- dev mode gate (5 taps on the version, then the password) ----------
const DEV_PASS = 'VINICODE';
var gateMsg = null;   // var: setScene() runs before this line at startup
var gateInput = null;
function showGateInput(on) {
  if (!on && !gateInput) return;
  if (!gateInput) {
    gateInput = document.createElement('input');
    gateInput.type = 'password';
    gateInput.autocomplete = 'off';
    gateInput.spellcheck = false;
    gateInput.maxLength = 16;
    gateInput.setAttribute('aria-label', 'Senha do modo dev');
    gateInput.style.cssText = 'position:fixed;z-index:5;display:none;box-sizing:border-box;background:#000;color:#fff;text-align:center;'
      + 'font-family:Orbitron,"Segoe UI",sans-serif;letter-spacing:0.3em;outline:none;border-radius:12px;padding:0 12px;';
    gateInput.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryDevPassword(); });
    document.body.appendChild(gateInput);
  }
  gateInput.style.display = on ? 'block' : 'none';
  if (on) { gateInput.value = ''; placeGateInput(); setTimeout(() => { try { gateInput.focus(); } catch (e) { /* ignore */ } }, 50); }
  else gateInput.blur();
}
function placeGateInput() {
  const r = canvas.getBoundingClientRect(), s = r.width / W, k = col();
  const w = 420 * s, h = 70 * s;
  Object.assign(gateInput.style, { left: r.left + (W / 2) * s - w / 2 + 'px', top: r.top + (safeTop + 520) * s - h / 2 + 'px', width: w + 'px', height: h + 'px',
    fontSize: 26 * s + 'px', border: Math.max(1, 2 * s) + 'px solid ' + k, boxShadow: '0 0 ' + 14 * s + 'px ' + k });
}
function tryDevPassword() {
  const ok = gateInput && gateInput.value.trim().toUpperCase() === DEV_PASS;
  gateMsg = { text: ok ? 'MODO DEV ATIVADO' : 'SENHA INCORRETA', ok, t: performance.now() / 1000 };
  if (ok) {
    opts.dev = true; applyOpts(); sfx.power(true);
    showGateInput(false);
    setTimeout(() => { if (scene === 'devgate') setScene('options'); }, 1300);
  } else { sfx.power(false); if (gateInput) { gateInput.value = ''; gateInput.focus(); } }
}
function renderDevGate(c, now) {
  const k = col();
  neonTitle(c, 'MODO DEV', W / 2, safeTop + 230, 54, k, k, 12);
  if (opts.dev && !(gateMsg && gateMsg.ok && now - gateMsg.t < 1.3)) {
    glowText(c, 'O modo dev está ativo.', W / 2, safeTop + 380, 20, '#ffffff', k, 'center', 500, 2);
  } else if (!opts.dev) {
    glowText(c, 'Digite a senha', W / 2, safeTop + 420, 20, 'rgba(255,255,255,0.85)', k, 'center', 500, 3);
    if (gateInput && gateInput.style.display !== 'none') placeGateInput();
  }
  if (gateMsg && now - gateMsg.t < 2) {
    c.globalAlpha = Math.min(1, (2 - (now - gateMsg.t)) * 2);
    glowText(c, gateMsg.text, W / 2, safeTop + 760, 20, gateMsg.ok ? '#ffffff' : '#ff4060', gateMsg.ok ? k : '#ff4060', 'center', 700, 4);
    c.globalAlpha = 1;
  }
}

// ---------- in-game dev panel ----------
const DEV_TABS = ['PODERES', 'DEBUFFS', 'DISCO', 'FASE', 'JOGO', 'VISUAL'];
const devToggleRect = () => ({ x: W - 112, y: game.top - 42, w: 84, h: 30 });

function devItems() {
  const pw = (k) => ({ label: POWERS[k].label, fn: () => game.applyPower(k) });
  const set = (fn) => () => { fn(); applyOpts(); };
  switch (devTab) {
    case 0: return ['multi', 'wide', 'slow', 'pierce', 'laser', 'missile', 'mega', 'ghost', 'life'].map(pw)
      .concat([{ label: 'PLAT. + x2', fn: () => game.applyPower('wide', 2) }]);
    case 1: return ['shrink', 'fast', 'mini'].map(pw)
      .concat([{ label: 'PLAT. - x2', fn: () => game.applyPower('shrink', 2) }]);
    case 2: return [
      { label: 'VELOCIDADE', slider: SL.speed },
      { label: '+1 DISCO', fn: () => game.devAddBall() },
      { label: 'LANÇAR', fn: () => game.launch() },
      { label: 'RESETAR DISCO', fn: () => game.resetBall() },
      { label: 'LIMPAR EFEITOS', fn: () => { game.effects = {}; } },
    ];
    case 3: return [
      { label: 'PULAR FASE', fn: () => game.devSkip() },
      { label: 'REINICIAR', fn: () => game.devRestart() },
      { label: game.boss ? 'MATAR CHEFÃO' : 'LIMPAR BLOCOS', fn: () => game.devClear() },
      { label: 'IR P/ CHEFÃO', fn: () => game.devBoss() },
      { label: 'CHEFÃO -3', fn: () => game.devBossHit(3) },
      { label: 'MODO FÚRIA', fn: () => game.devFury() },
      { label: freeze ? 'DESCONGELAR' : 'CONGELAR', fn: () => { freeze = !freeze; } },
      { label: 'IR AO MAPA', fn: () => setScene('map') },
    ];
    case 4: return [
      { label: 'VIDAS ∞: ' + (opts.inf ? 'SIM' : 'NÃO'), fn: set(() => { opts.inf = !opts.inf; }) },
      { label: '+1 VIDA', fn: () => { game.lives = Math.min(6, game.lives + 1); } },
      { label: 'ENERGIA CHEIA', fn: () => { game.energy = 1; } },
      { label: '+500 CHIPS', fn: () => { chips += 500; saveChips(); } },
      { label: '+100 MOEDAS', fn: () => { coins += 100; saveChips(); } },
      { label: 'TESTAR FINAL', fn: () => startCrash() },
      { label: '» ' + SHAPES[plat.shape].name, fn: () => cycle('shape', 1, SHAPES.length) },
      { label: '» ' + PALETTES[plat.pal].name, fn: () => cycle('pal', 1, PALETTES.length) },
      { label: '» ' + EMBLEMS[plat.emb], fn: () => cycle('emb', 1, EMBLEMS.length) },
      { label: 'FPS: ' + (opts.fps ? 'SIM' : 'NÃO'), fn: set(() => { opts.fps = !opts.fps; }) },
      { label: 'DROPS', slider: SL.drop },
      { label: 'SENSIBILIDADE', slider: SL.sens },
    ];
    default: return [
      { label: 'BRILHO DO NEON', slider: gfxSl('glow', 0, 1.5) },
      { label: 'RESOLUÇÃO', slider: gfxSl('res', 0.4, 1) },
      { label: 'PARTÍCULAS', slider: gfxSl('fx', 0, 1.5) },
      { label: 'RASTRO DO DISCO', slider: gfxSl('trail', 0, 1) },
      { label: 'TEXTURA (GRADE DO CAMPO)', slider: gfxSl('grid', 0, 2) },
      { label: 'PADRÃO CELULAR', fn: () => presetGfx(GFX_MOBILE) },
      { label: 'PADRÃO PC', fn: () => presetGfx(GFX_PC) },
      { label: 'FPS: ' + (opts.fps ? 'SIM' : 'NÃO'), fn: set(() => { opts.fps = !opts.fps; }) },
    ];
  }
}

function devPanel() {
  const x = 24, y = game.top + 48, w = W - 48;
  const list = [];
  const tw = w / DEV_TABS.length;
  DEV_TABS.forEach((t, i) => list.push({ x: x + i * tw + 3, y: y + 8, w: tw - 6, h: 40, label: t, fn: () => { devTab = i; }, tab: i }));
  // buttons go 3 per row; a slider takes a whole row
  let ry = y + 60, cn = 0;
  const cw = (w - 24) / 3;
  for (const it of devItems()) {
    if (it.slider) {
      if (cn) { ry += 58; cn = 0; }
      list.push({ x: x + 12, y: ry, w: w - 32, h: 52, label: it.label, slider: it.slider, fn: () => {} });
      ry += 58;
    } else {
      list.push({ x: x + 12 + cn * cw, y: ry, w: cw - 8, h: 50, label: it.label, fn: it.fn, small: true });
      if (++cn === 3) { cn = 0; ry += 58; }
    }
  }
  if (cn) ry += 58;
  return { rect: { x, y, w, h: ry - y + 6 }, list };
}

function layout() {
  const cx = W / 2, bw = 400, bh = 76;
  switch (scene) {
    case 'menu': {
      const y = H * 0.46;
      return [
        btn(cx, y, bw, bh, 'JOGAR', () => setScene('map'), { big: true }),
        btn(cx, y + 100, bw, bh, 'PLATAFORMA', () => setScene('plat')),
        btn(cx, y + 200, bw, bh, 'COR', () => setScene('colors')),
        btn(cx, y + 300, bw, bh, 'OPÇÕES', () => setScene('options')),
      ];
    }
    case 'map': {
      const list = mapButtons();
      list.push(btn(cx, H - 90, bw, bh, 'VOLTAR', () => setScene('menu')));
      return list;
    }
    case 'crash': {
      const t = performance.now() / 1000 - crash.t0;
      return t > CRASH_END ? [btn(cx, H * 0.72, bw, bh, 'MENU', () => setScene('menu'), { big: true })] : [];
    }
    case 'options':
    case 'dev': {
      const list = optionButtons();
      list.push(btn(cx, H - 90, bw, bh, 'VOLTAR', () => setScene(scene === 'dev' ? 'options' : 'menu')));
      return list;
    }
    case 'plat': return platButtons();
    case 'credits': return [btn(cx, H - 90, bw, bh, 'VOLTAR', () => setScene('options'))];
    case 'devgate': {
      const y = safeTop + 640;
      if (opts.dev) return [btn(cx, y, 400, 72, 'DESATIVAR', () => { opts.dev = false; applyOpts(); gateMsg = { text: 'MODO DEV DESATIVADO', ok: true, t: performance.now() / 1000 }; }), btn(cx, H - 90, bw, bh, 'VOLTAR', () => setScene('menu'))];
      return [btn(cx, y, 400, 72, 'CONFIRMAR', tryDevPassword, { big: true }), btn(cx, H - 90, bw, bh, 'VOLTAR', () => setScene('menu'))];
    }
    case 'colors': {
      const list = THEMES.map((t, i) => btn(cx + (i % 2 ? 160 : -160), safeTop + 270 + Math.floor(i / 2) * 150, 300, 126, t.name,
        () => { colorIndex = i; game.setColor(t.c); store.set('color', i); }, { theme: i }));
      list.push(btn(cx, H - 120, bw, bh, 'VOLTAR', () => setScene('menu')));
      return list;
    }
    case 'pause':
      return [
        btn(cx, H * 0.48, bw, bh, 'CONTINUAR', () => setScene('play'), { big: true }),
        btn(cx, H * 0.48 + 100, bw, bh, 'MAPA', () => setScene('map')),
        btn(cx, H * 0.48 + 200, bw, bh, 'MENU', () => setScene('menu')),
      ];
    case 'over':
      return [
        btn(cx, H * 0.6, bw, bh, 'TENTAR DE NOVO', () => startGame(game.index), { big: true }),
        btn(cx, H * 0.6 + 100, bw, bh, 'MAPA', () => setScene('map')),
      ];
    case 'world': {
      const next = game.index + 1;
      const list = [];
      if (next < TOTAL_STAGES) list.push(btn(cx, H * 0.62, bw, bh, 'PRÓXIMO DISTRITO', () => startGame(next), { big: true, fs: 20 }));
      list.push(btn(cx, H * 0.62 + 100, bw, bh, 'MAPA', () => setScene('map')));
      return list;
    }
    case 'card': {
      const box = cardBox();
      const y = box.y + box.h - 62;
      if (card && card.idx !== undefined) {
        return [
          btn(cx - 140, y, 250, 70, 'PULAR TUTORIAL', skipTutorial, { fs: 15 }),
          btn(cx + 140, y, 250, 70, 'CONTINUAR', closeCard, { big: true }),
        ];
      }
      return [btn(cx, y, 340, 70, 'CONTINUAR', closeCard, { big: true })];
    }
    default:
      return [];
  }
}

function inside(b, p) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }

function startGame(index = 0) {
  game.plat = plat;
  game.setColor(col());
  applyOpts();
  game.ability = equip && upg[equip] ? { type: equip, lvl: upg[equip] } : null;
  game.widthLvl = upg.width;
  newShape = null;
  const firstTime = index === 0 && !store.get('tutDone', false);
  tut = firstTime ? { fired: new Set(), shown: new Set() } : null;
  game.tutorial = firstTime;
  card = null;
  freeze = false;
  setScene('play');
  game.newGame(index);
}

// ---------- input ----------
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

function hitPause(p) { return p.x > W - 110 && p.y < game.top - 46 && !(opts.dev && inside(devToggleRect(), p)); }

canvas.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  const p = toLogical(e);
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (scene === 'play') {
    if (hitPause(p)) { setScene('pause'); sfx.click(); return; }
    if (opts.dev && inside(devToggleRect(), p)) { devOpen = !devOpen; sfx.click(); return; }
    if (devOpen) {
      const dp = devPanel();
      if (inside(dp.rect, p)) {
        const b = dp.list.find((q) => inside(q, p));
        if (b && b.slider) { slide = { b, id: e.pointerId }; setSlider(b, p); }
        else if (b) { sfx.click(); b.fn(); }
        return;
      }
    }
    if (game.ability && inside(game.abilityRect(), p)) { game.useAbility(); return; }
    // double tap anywhere fires the platform ability
    const tn = performance.now();
    if (tn - lastTap.t < 300 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 90) { game.useAbility(); lastTap.t = 0; }
    else lastTap = { t: tn, x: p.x, y: p.y };
    drag = { id: e.pointerId, lastX: p.x, type: e.pointerType };
    game.paddle.tx = p.x;   // the platform rushes to where the finger touched, then follows the drag
  } else {
    // secret: 5 taps on the version number open the dev mode gate
    if (scene === 'menu' && p.x > W - 150 && p.y > H - 60) {
      const tn = performance.now();
      verTaps.n = tn - verTaps.t < 1500 ? verTaps.n + 1 : 1;
      verTaps.t = tn;
      if (verTaps.n >= 5) { verTaps.n = 0; gateMsg = null; setScene('devgate'); sfx.power(true); }
      return;
    }
    buttons = layout();
    const sb = buttons.find((b) => b.slider && inside(b, p));
    if (sb) { slide = { b: sb, id: e.pointerId }; setSlider(sb, p); return; }
    pressed = buttons.find((b) => b.fn && inside(b, p)) || null;
    if (scene === 'map' && p.y > mapViewTop() && p.y < mapViewTop() + mapViewH()) mapDrag = { y: p.y, s0: mapScroll, moved: false };
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (slide) { if (slide.id === e.pointerId) setSlider(slide.b, toLogical(e)); return; }
  if (scene === 'map' && mapDrag) {
    const dy = toLogical(e).y - mapDrag.y;
    if (Math.abs(dy) > 10) mapDrag.moved = true;
    if (mapDrag.moved) mapScroll = clampScroll(mapDrag.s0 - dy);
    return;
  }
  if (scene !== 'play') return;
  const p = toLogical(e);
  if (e.pointerType === 'mouse') { if (!(devOpen && inside(devPanel().rect, p))) game.paddle.tx = p.x; return; }
  if (drag && drag.id === e.pointerId) {
    game.paddle.tx += (p.x - drag.lastX) * opts.sens;
    drag.lastX = p.x;
  }
});

canvas.addEventListener('pointerup', (e) => {
  const p = toLogical(e);
  if (slide && slide.id === e.pointerId) { slide = null; pressed = null; return; }
  if (scene === 'play') {
    if (drag && drag.id === e.pointerId) { game.launch(); drag = null; }
    return;
  }
  if (mapDrag) { const moved = mapDrag.moved; mapDrag = null; if (moved) { pressed = null; return; } }
  if (pressed && inside(pressed, p)) { sfx.click(); pressed.fn(); }
  pressed = null;
});

canvas.addEventListener('pointercancel', () => { drag = null; pressed = null; mapDrag = null; slide = null; });
canvas.addEventListener('wheel', (e) => { if (scene === 'map') { mapScroll = clampScroll(mapScroll + e.deltaY * (W / canvas.getBoundingClientRect().width)); e.preventDefault(); } }, { passive: false });
let lastTap = { t: 0, x: 0, y: 0 };
const verTaps = { n: 0, t: 0 };
let mapDrag = null;

window.addEventListener('keydown', (e) => {
  sfx.unlock();
  if (scene === 'play') {
    if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp') game.launch();
    if (e.key === 'e' || e.key === 'Shift') game.useAbility();
    if (e.key === 'Escape' || e.key === 'p') setScene('pause');
    if (e.key === '`' && opts.dev) devOpen = !devOpen;
  } else if (scene === 'card' && (e.key === 'Enter' || e.key === ' ')) {
    closeCard();
  } else if (scene === 'pause' && (e.key === 'Escape' || e.key === 'p')) {
    setScene('play');
  } else if (scene === 'menu' && (e.key === 'Enter' || e.key === ' ')) {
    startGame(Math.min(prog, TOTAL_STAGES - 1));
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') game.keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') game.keys.right = false;
});

function onFocusChange(on) {
  sfx.setFocus(on);
  if (!on && scene === 'play') setScene('pause');
}
// Sound only plays while the game is actually on screen. 'focus' can arrive
// while the page is still hidden on some phones, so every event checks it.
const visible = () => onFocusChange(!document.hidden);
const hidden = () => onFocusChange(false);
document.addEventListener('visibilitychange', visible);
document.addEventListener('freeze', hidden);
document.addEventListener('resume', visible);
window.addEventListener('pagehide', hidden);
window.addEventListener('pageshow', visible);
window.addEventListener('blur', hidden);
window.addEventListener('focus', visible);

// ---------- menu background disc ----------
const demo = { x: W * 0.3, y: 500, vx: 250, vy: -330, path: [{ x: W * 0.3, y: 500 }], spin: 0 };
function updateDemo(dt) {
  demo.spin += dt * 6;
  demo.x += demo.vx * dt;
  demo.y += demo.vy * dt;
  let hit = false;
  if (demo.x < BALL_R) { demo.x = BALL_R; demo.vx = Math.abs(demo.vx); hit = true; }
  if (demo.x > W - BALL_R) { demo.x = W - BALL_R; demo.vx = -Math.abs(demo.vx); hit = true; }
  if (demo.y < BALL_R) { demo.y = BALL_R; demo.vy = Math.abs(demo.vy); hit = true; }
  if (demo.y > H - BALL_R) { demo.y = H - BALL_R; demo.vy = -Math.abs(demo.vy); hit = true; }
  if (hit) demo.path.push({ x: demo.x, y: demo.y });
  trimTrail(demo.path, demo.x, demo.y, 700);
}
function renderDemo(c) {
  c.globalAlpha = 0.5;
  c.globalCompositeOperation = 'lighter';
  drawTrail(c, demo.path, demo.x, demo.y, col(), 700, BALL_R, plat.trail, paletteColors(plat.pal, col()), performance.now() / 1000);
  c.globalCompositeOperation = 'source-over';
  c.save(); c.translate(demo.x, demo.y); c.rotate(demo.spin);
  drawSprite(c, discSprite(col(), BALL_R, plat.disc), -BALL_R, -BALL_R);
  c.restore();
  c.globalAlpha = 1;
}

// ---------- drawing ----------
function wrap(c, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawButton(c, b) {
  if (b.slider) { drawSlider(c, b); return; }
  const k = col();
  const down = pressed === b;
  if (b.arrow) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    c.beginPath(); c.arc(cx, cy, b.w / 2 - 4, 0, TAU);
    c.fillStyle = rgba(k, down ? 0.2 : 0.05); c.fill();
    neonStroke(c, k, k, 2.2, cx - 40, cy, cx + 40, cy, 0.6);
    c.beginPath();
    c.moveTo(cx - 6 * b.arrow, cy - 13); c.lineTo(cx + 7 * b.arrow, cy); c.lineTo(cx - 6 * b.arrow, cy + 13);
    neonStroke(c, k, k, 3.5, cx - 10, cy, cx + 10, cy, 0.8);
    return;
  }
  if (b.optRow) {
    roundRectPath(c, b.x, b.y, b.w, b.h, 14);
    c.fillStyle = rgba(k, down ? 0.16 : 0.03); c.fill();
    c.strokeStyle = rgba(k, 0.35); c.lineWidth = 1.5; c.stroke();
    const cy = b.y + b.h / 2;
    glowText(c, b.label, b.x + 26, cy, 16, rgba('#ffffff', 0.85), k, 'left', 500, 3);
    const valX = b.optRow.step ? (b.optRow.wide ? W / 2 + 145 : W / 2 + 200) : b.x + b.w - 26;
    glowText(c, b.optRow.val(), valX, cy, b.optRow.wide ? 13 : 18, '#ffffff', k, b.optRow.step ? 'center' : 'right', 700, 2);
    return;
  }
  if (b.small || b.tab !== undefined || b.ptab !== undefined) {
    const sel = (b.tab !== undefined && b.tab === devTab) || (b.ptab !== undefined && b.ptab === platTab);
    roundRectPath(c, b.x, b.y, b.w, b.h, 10);
    c.fillStyle = rgba(k, sel ? 0.3 : 0.06); c.fill();
    if (sel) neonStroke(c, k, k, 2, b.x, b.y, b.x + b.w, b.y + b.h, 0.6);
    else { c.strokeStyle = rgba(k, 0.55); c.lineWidth = 1.5; c.stroke(); }
    glowText(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.ptab !== undefined ? 11 : 12, '#ffffff', k, 'center', 700, b.ptab !== undefined ? 0.5 : 1);
    return;
  }
  roundRectPath(c, b.x, b.y, b.w, b.h, 16);
  c.fillStyle = rgba(k, down ? 0.18 : 0.04);
  c.fill();
  neonStroke(c, k, k, b.big ? 3.2 : 2.2, b.x, b.y, b.x + b.w, b.y + b.h, b.big ? 1 : 0.6);
  c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2;
  c.beginPath();
  c.moveTo(b.x + 26, b.y + b.h + 9); c.lineTo(b.x + 70, b.y + b.h + 9);
  c.moveTo(b.x + b.w - 70, b.y - 9); c.lineTo(b.x + b.w - 26, b.y - 9);
  c.stroke();
  glowText(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.fs || (b.big ? 26 : 21), '#ffffff', k, 'center', 700, b.fs ? 2 : 5);
}

function drawColorTile(c, b) {
  const t = THEMES[b.theme];
  const sel = b.theme === colorIndex;
  roundRectPath(c, b.x, b.y, b.w, b.h, 20);
  if (sel) {
    c.fillStyle = rgba(t.c, 0.08); c.fill();
    neonStroke(c, t.c, t.c, 2.8, b.x, b.y, b.x + b.w, b.y + b.h, 0.8);
  } else {
    c.strokeStyle = rgba(t.c, 0.3); c.lineWidth = 1.5; c.stroke();
  }
  const cy = b.y + b.h / 2;
  c.save(); c.translate(b.x + 60, cy); c.rotate(performance.now() / 400);
  drawSprite(c, discSprite(t.c), -BALL_R, -BALL_R);
  c.restore();
  for (let i = 0; i < 4; i++) {
    roundRectPath(c, b.x + 108 + i * 44, cy + 14, 36, 14, 3);
    c.strokeStyle = tierTone(t.c, i + 1); c.lineWidth = 2; c.stroke();
  }
  glowText(c, t.name, b.x + 108, cy - 16, 20, '#ffffff', t.c, 'left', 700, 3);
}

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// district a tile belongs to (by depth along the route)
function tileDistrict(D, i, j) {
  const t = i + j - J0;
  for (const d of D.dist) if (t < d.t1) return d.w;
  return WORLDS.length - 1;
}
const districtOpen = (w) => !WORLDS[w].soon && unlocked(worldStart(w));

// one isometric box (footprint inset f) with floors, optional neon band
function isoBox(c, x, y, h, k, f, R, beacons, w) {
  const L = [x - TW * f, y], B = [x, y + TH * f], Rr = [x + TW * f, y], T = [x, y - TH * f];
  const face = (pts, a) => {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.closePath();
    const ga = c.globalAlpha; c.globalAlpha = 1; c.fillStyle = '#000'; c.fill(); c.globalAlpha = ga;
    c.fillStyle = rgba(k, a); c.fill();
  };
  face([L, B, [B[0], B[1] - h], [L[0], L[1] - h]], 0.1);
  face([B, Rr, [Rr[0], Rr[1] - h], [B[0], B[1] - h]], 0.05);
  face([[L[0], L[1] - h], [B[0], B[1] - h], [Rr[0], Rr[1] - h], [T[0], T[1] - h]], 0.16);
  // floors
  c.beginPath();
  for (let yy = 9; yy < h - 4; yy += 9) {
    c.moveTo(L[0] + (B[0] - L[0]) * 0.15, L[1] + (B[1] - L[1]) * 0.15 - yy); c.lineTo(L[0] + (B[0] - L[0]) * 0.85, L[1] + (B[1] - L[1]) * 0.85 - yy);
    c.moveTo(B[0] + (Rr[0] - B[0]) * 0.15, B[1] + (Rr[1] - B[1]) * 0.15 - yy); c.lineTo(B[0] + (Rr[0] - B[0]) * 0.85, B[1] + (Rr[1] - B[1]) * 0.85 - yy);
  }
  c.strokeStyle = rgba(k, 0.2); c.lineWidth = 1; c.stroke();
  // lit windows
  c.fillStyle = 'rgba(255,255,255,0.55)';
  for (let q = 0; q < h / 14; q++) {
    if (R() > 0.35) continue;
    const yy = 9 + Math.floor(R() * Math.max(1, (h - 12) / 9)) * 9, u = 0.2 + R() * 0.6, left = R() < 0.5;
    const a = left ? L : B, b = left ? B : Rr;
    c.fillRect(a[0] + (b[0] - a[0]) * u - 1.5, a[1] + (b[1] - a[1]) * u - yy - 4, 3, 3);
  }
  // edges
  c.beginPath();
  c.moveTo(L[0], L[1]); c.lineTo(B[0], B[1]); c.lineTo(Rr[0], Rr[1]);
  c.moveTo(L[0], L[1]); c.lineTo(L[0], L[1] - h); c.moveTo(Rr[0], Rr[1]); c.lineTo(Rr[0], Rr[1] - h);
  c.moveTo(L[0], L[1] - h); c.lineTo(B[0], B[1] - h); c.lineTo(Rr[0], Rr[1] - h); c.lineTo(T[0], T[1] - h); c.closePath();
  c.strokeStyle = rgba(k, 0.5); c.lineWidth = 1.2; c.stroke();
  c.beginPath(); c.moveTo(B[0], B[1]); c.lineTo(B[0], B[1] - h);
  c.strokeStyle = rgba(k, 0.85); c.lineWidth = 1.4; c.stroke();
  if (R() < 0.18 && h > 30) { // neon band along the top of the right face
    c.beginPath(); c.moveTo(B[0], B[1] - h + 6); c.lineTo(Rr[0], Rr[1] - h + 6);
    c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2.5; c.stroke();
  }
  if (R() < 0.2 && h > 24) { // antenna with a blinking beacon
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x, y - h - 14); c.strokeStyle = rgba(k, 0.6); c.lineWidth = 1.2; c.stroke();
    beacons.push({ x, y: y - h - 14, ph: R() * TAU, w });
  }
}

const flatTile = (c, x, y, fill, stroke) => {
  c.beginPath(); c.moveTo(x, y - TH); c.lineTo(x + TW, y); c.lineTo(x, y + TH); c.lineTo(x - TW, y); c.closePath();
  c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
};

let isoLayerCache = null;
function isoLayer() {
  const k = col(), D = isoData();
  const res = Math.min(view.res, 1.6);
  const key = k + res + view.glow + prog + (opts.dev && opts.unlock);
  if (isoLayerCache && isoLayerCache.key === key) return isoLayerCache;
  const mk = () => {
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * res); cv.height = Math.round(D.height * res);
    const x = cv.getContext('2d');
    x.setTransform(res, 0, 0, res, 0, 0);
    return x;
  };
  const c = mk(), cb = mk();   // c: ground, cb: buildings
  const road = new Set(D.path.map((q) => q.i + ',' + q.j));
  const front = new Set();
  for (const q of D.path) for (const [a, b] of [[1, 0], [0, 1], [1, 1]]) front.add((q.i + a) + ',' + (q.j + b));
  const end = D.path[D.total - 1];
  const beacons = [], streets = [];
  const R = rng(9001);
  const maxSum = D.total + J0 + 6;
  for (let sum = 0; sum <= maxSum; sum++) {
    for (let d = -10; d <= 10; d++) {
      if ((sum + d) % 2) continue;
      const i = (sum + d) / 2, j = (sum - d) / 2, key2 = i + ',' + j;
      const { x, y } = isoXY(i, j);
      const w = tileDistrict(D, i, j);
      c.globalAlpha = cb.globalAlpha = districtOpen(w) ? 1 : 0.38;
      const nearTower = Math.abs(i - end.i) <= 2 && Math.abs(j - end.j) <= 2;
      const street = ((i % 5) + 5) % 5 === 0 || ((j % 5) + 5) % 5 === 0;
      if (road.has(key2)) { flatTile(c, x, y, rgba(k, 0.08), rgba(k, 0.22)); continue; }
      if (street || nearTower) { flatTile(c, x, y, rgba(k, 0.03), rgba(k, 0.1)); continue; }
      if (front.has(key2)) { if (R() < 0.5) isoBox(cb, x, y, 6 + R() * 8, k, 0.6, R, beacons, w); else flatTile(c, x, y, rgba(k, 0.02), rgba(k, 0.08)); continue; }
      if (R() < 0.12) { flatTile(c, x, y, rgba(k, 0.02), rgba(k, 0.08)); continue; }
      const hmin = 14 + w * 7, hmax = 42 + w * 13;
      isoBox(cb, x, y, hmin + R() * (hmax - hmin) * (R() < 0.15 ? 1.6 : 1), k, 0.78, R, beacons, w);
    }
  }
  // AURUM tower at the end of the road: the system's pyramid
  cb.globalAlpha = districtOpen(WORLDS.length - 1) ? 1 : 0.5;
  const tx = end.x, ty = end.y + TH * 2;
  isoBox(cb, tx, ty, 230, k, 1.5, rng(3), [], WORLDS.length - 1);
  const top = ty - 230;
  cb.beginPath();
  cb.moveTo(tx - TW * 1.5, top); cb.lineTo(tx, top - 110); cb.lineTo(tx + TW * 1.5, top);
  cb.moveTo(tx, top + TH * 1.5); cb.lineTo(tx, top - 110);
  cb.strokeStyle = rgba(k, 0.9); cb.lineWidth = 2; cb.stroke();
  c.globalAlpha = cb.globalAlpha = 1;
  // streets for the light-cars
  for (let s5 = -40; s5 <= 200; s5 += 5) {
    for (const axis of ['i', 'j']) {
      const pts = [];
      for (let o = -12; o <= 200; o++) {
        const i = axis === 'i' ? s5 : o, j = axis === 'i' ? o : s5;
        if (Math.abs(i - j) > 10 || i + j < 0 || i + j > maxSum) continue;
        pts.push(isoXY(i, j));
      }
      if (pts.length > 3) streets.push({ a: pts[0], b: pts[pts.length - 1], L: Math.hypot(pts[pts.length - 1].x - pts[0].x, pts[pts.length - 1].y - pts[0].y) });
    }
  }
  isoLayerCache = { key, img: c.canvas, bld: cb.canvas, res, beacons, streets };
  return isoLayerCache;
}

// small line icons for the district mechanics (s = half size)
function drawMechIcon(c, m, x, y, s, color) {
  c.save();
  c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
  const arrow = (x0, y0, x1, y1) => {
    const a = Math.atan2(y1 - y0, x1 - x0), h = s * 0.45;
    c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.moveTo(x1 - Math.cos(a - 0.6) * h, y1 - Math.sin(a - 0.6) * h); c.lineTo(x1, y1); c.lineTo(x1 - Math.cos(a + 0.6) * h, y1 - Math.sin(a + 0.6) * h);
  };
  c.beginPath();
  switch (m) {
    case 'slide': // a block sliding sideways
      c.strokeRect(x - s * 0.5, y - s * 0.9, s, s * 0.6);
      arrow(x - s * 0.2, y + s * 0.45, x + s, y + s * 0.45);
      arrow(x + s * 0.2, y + s * 0.45, x - s, y + s * 0.45);
      break;
    case 'gravity': // a core with bent orbits
      c.arc(x, y, s, 0.4, 2.7); c.moveTo(x - s * 0.62 + s * 1.24, y);
      c.arc(x, y, s * 0.62, 0, Math.PI * 0.9);
      c.stroke(); c.beginPath(); c.arc(x, y, s * 0.28, 0, TAU); c.fill();
      c.beginPath(); c.arc(x, y, s, 3.5, 5.8);
      break;
    case 'walls': // hatched indestructible block
      c.strokeRect(x - s, y - s * 0.6, s * 2, s * 1.2);
      for (let q = -2; q <= 1; q++) { c.moveTo(x + q * s * 0.55, y + s * 0.6); c.lineTo(x + q * s * 0.55 + s * 0.6, y - s * 0.6); }
      break;
    case 'portals':
      c.ellipse(x - s * 0.6, y, s * 0.35, s * 0.85, 0, 0, TAU);
      c.moveTo(x + s * 0.95, y); c.ellipse(x + s * 0.6, y, s * 0.35, s * 0.85, 0, 0, TAU);
      break;
    case 'blast': // starburst
      for (let q = 0; q < 8; q++) {
        const a = (q * TAU) / 8, r0 = q % 2 ? s * 0.45 : s * 0.3, r1 = q % 2 ? s * 0.8 : s;
        c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      }
      break;
    case 'phase': // block out of phase (dashed)
      c.setLineDash([3, 3]); c.strokeRect(x - s, y - s * 0.6, s * 2, s * 1.2);
      break;
    case 'descent': // a block pressed down onto the alert line
      c.strokeRect(x - s * 0.6, y - s, s * 1.2, s * 0.55);
      arrow(x, y - s * 0.3, x, y + s * 0.45);
      c.stroke(); c.beginPath(); c.setLineDash([3, 3]); c.moveTo(x - s, y + s * 0.85); c.lineTo(x + s, y + s * 0.85);
      break;
    default:
      c.arc(x, y, s * 0.5, 0, TAU);
  }
  c.stroke();
  c.restore();
}

function pathPoly(c, D, t0, t1) {
  c.beginPath();
  c.moveTo(D.path[t0].x, D.path[t0].y);
  for (let t = t0 + 1; t <= t1; t++) c.lineTo(D.path[t].x, D.path[t].y);
}

// a neon fence across the street at a district gate
function drawFence(c, D, d, now, k) {
  const g = D.path[d.gate], alongI = Math.floor(d.gate / RUN) % 2 === 0;
  const boss = worldStart(d.w) + worldCount(d.w) - 1;
  const open = !WORLDS[d.w].soon && prog > boss;
  const pt = (o) => (alongI ? isoXY(g.i, g.j + o) : isoXY(g.i + o, g.j));
  const segs = [[-5, -1.4], [1.4, 5]];
  c.save();
  for (const [a, b] of segs) {
    const A = pt(a), B = pt(b);
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.moveTo(A.x, A.y - 26); c.lineTo(B.x, B.y - 26);
    neonStroke(c, k, k, 2, A.x, A.y, B.x, B.y, 0.7);
    c.beginPath();
    for (let o = a; o <= b + 0.01; o += 1) { const P = pt(o); c.moveTo(P.x, P.y); c.lineTo(P.x, P.y - 26); }
    c.strokeStyle = rgba(k, 0.45); c.lineWidth = 1.2; c.stroke();
    // light curtain
    c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(B.x, B.y - 26); c.lineTo(A.x, A.y - 26); c.closePath();
    c.fillStyle = rgba(k, 0.07 + 0.04 * Math.sin(now * 3)); c.fill();
  }
  if (!open) {
    const A = pt(-1.4), B = pt(1.4);
    c.setLineDash([5, 5]); c.lineDashOffset = -now * 30;
    for (const hh of [6, 14, 22]) { c.beginPath(); c.moveTo(A.x, A.y - hh); c.lineTo(B.x, B.y - hh); c.strokeStyle = rgba(k, 0.75); c.lineWidth = 1.6; c.stroke(); }
  }
  c.restore();
}

function renderMap(c, now) {
  const k = col(), D = isoData(), L = isoLayer();
  const top = mapViewTop(), vh = mapViewH();
  mapScroll = clampScroll(mapScroll);
  c.save();
  c.beginPath(); c.rect(0, top, W, vh); c.clip();
  const sy = mapScroll * L.res, sh = Math.min(vh * L.res, L.img.height - sy);
  const blit = (img) => { if (sh > 0) c.drawImage(img, 0, sy, W * L.res, sh, 0, top, W, sh / L.res); };
  blit(L.img);
  c.translate(0, top - mapScroll);
  const vis = (y) => y > mapScroll - 60 && y < mapScroll + vh + 60;
  // light-cars on the side streets
  c.save(); c.globalCompositeOperation = 'lighter';
  L.streets.forEach((st, si) => {
    for (let q = 0; q < 2; q++) {
      const dir = q ? 1 : -1, sp = 40 + ((si * 37) % 50);
      let d = ((si * 131 + q * 0.5 * st.L) + now * sp * dir) % st.L; if (d < 0) d += st.L;
      const u = d / st.L, x = st.a.x + (st.b.x - st.a.x) * u, y = st.a.y + (st.b.y - st.a.y) * u;
      if (!vis(y)) continue;
      const ux = (st.b.x - st.a.x) / st.L, uy = (st.b.y - st.a.y) / st.L, off = dir * 3;
      const hx = x - uy * off, hy = y + ux * off, tx = hx - ux * 18 * dir, ty = hy - uy * 18 * dir;
      const g = c.createLinearGradient(tx, ty, hx, hy);
      const tint = dir > 0 ? '#ffffff' : k;
      g.addColorStop(0, rgba(tint, 0)); g.addColorStop(1, rgba(tint, 0.85));
      c.strokeStyle = g; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
    }
  });
  c.restore();
  // buildings on top of the cars, so they pass behind them
  c.translate(0, mapScroll - top);
  blit(L.bld);
  c.translate(0, top - mapScroll);
  // beacons
  for (const b of L.beacons) {
    if (!vis(b.y) || Math.sin(now * 2.4 + b.ph) < 0.45) continue;
    c.globalAlpha = districtOpen(b.w) ? 1 : 0.4;
    c.beginPath(); c.arc(b.x, b.y, 2.6, 0, TAU);
    c.fillStyle = '#ffffff'; c.shadowColor = k; c.shadowBlur = 10 * view.blur; c.fill(); c.shadowBlur = 0;
  }
  c.globalAlpha = 1;
  // route along the main street
  const N = D.nodes;
  c.lineCap = 'round'; c.lineJoin = 'round';
  pathPoly(c, D, 0, N[0].t);
  neonStroke(c, k, k, 3, 0, 0, W, 0, 0.8);
  for (let i = 0; i < N.length - 1; i++) {
    pathPoly(c, D, N[i].t, N[i + 1].t);
    if (i < prog) neonStroke(c, k, k, 3.5, 0, 0, W, 0, 0.9);
    else { c.save(); c.setLineDash([7, 9]); c.strokeStyle = rgba(k, 0.6); c.lineWidth = 2.5; c.stroke(); c.restore(); }
    if (i < prog) {
      c.save(); c.setLineDash([18, 260]); c.lineDashOffset = -((now * 140) % 278);
      pathPoly(c, D, N[i].t, N[i + 1].t); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.shadowColor = k; c.shadowBlur = 14 * view.blur; c.stroke();
      c.restore();
    }
  }
  // the rest of the road, still locked
  c.save(); c.setLineDash([4, 12]); pathPoly(c, D, N[N.length - 1].t, D.total - 1);
  c.strokeStyle = rgba(k, 0.3); c.lineWidth = 2; c.stroke(); c.restore();
  // fences + district names
  for (const d of D.dist) {
    if (d.w < WORLDS.length - 1 && vis(D.path[d.gate].y)) drawFence(c, D, d, now, k);
    const s0 = D.path[d.t0];
    if (!vis(s0.y)) continue;
    const right = s0.x < W / 2, x = right ? W - 26 : 26, y = s0.y + 18;
    const wd = WORLDS[d.w], open = districtOpen(d.w);
    const ms = wd.soon ? [] : worldMechs(d.w), SLOT = ms.length > 3 ? 62 : 86;
    c.font = `700 22px "Orbitron", sans-serif`;
    const tw = Math.max(c.measureText(wd.name).width, 150, ms.length * SLOT) + 28;
    c.fillStyle = 'rgba(0,0,0,0.72)';
    c.fillRect(right ? x - tw + 12 : x - 12, y - 46, tw, wd.soon ? 78 : ms.length ? 122 : 66);
    glowText(c, 'DISTRITO ' + (d.w + 1), x, y - 26, 12, rgba(k, 0.9), k, right ? 'right' : 'left', 700, 4);
    glowText(c, wd.name, x, y + 2, 22, open ? '#ffffff' : rgba('#ffffff', 0.55), k, right ? 'right' : 'left', 700, 3);
    if (wd.soon) glowText(c, 'EM BREVE', x, y + 24, 11, rgba(k, 0.75), k, right ? 'right' : 'left', 500, 4);
    ms.forEach((m, q) => {
      // newest mechanic of this district first, nearest the name's edge
      const mm = right ? ms[ms.length - 1 - q] : ms[q];   // always oldest to newest, left to right
      const ix = right ? x - SLOT / 2 + 4 - q * SLOT : x + SLOT / 2 - 4 + q * SLOT, iy = y + 42;
      const isNew = mm === wd.mech;
      c.beginPath(); c.arc(ix, iy, ms.length > 3 ? 15 : 17, 0, TAU);
      c.fillStyle = rgba(k, isNew ? 0.2 : 0.06); c.fill();
      c.strokeStyle = rgba(k, isNew ? 0.95 : 0.5); c.lineWidth = isNew ? 2 : 1.4; c.stroke();
      drawMechIcon(c, mm, ix, iy, 9, open ? '#ffffff' : rgba('#ffffff', 0.6));
      glowText(c, MECHS[mm].name, ix, iy + 29, ms.length > 3 ? 7.5 : 9, rgba('#ffffff', isNew ? 0.9 : 0.6), k, 'center', 600, ms.length > 3 ? 0 : 0.5);
    });
  }
  // the eye on top of the tower
  const end = D.path[D.total - 1], ey = end.y + TH * 2 - 230 - 62;
  if (vis(ey)) {
    const o = 0.5 + 0.5 * Math.sin(now * 0.8);
    c.beginPath(); c.moveTo(end.x - 16, ey); c.quadraticCurveTo(end.x, ey - 12 * o, end.x + 16, ey); c.quadraticCurveTo(end.x, ey + 12 * o, end.x - 16, ey);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(end.x, ey, 4 * o + 1, 0, TAU); c.fillStyle = '#ffffff'; c.shadowColor = k; c.shadowBlur = 16 * view.blur; c.fill(); c.shadowBlur = 0;
  }
  c.restore();
  // soft fade at the edges of the scroll view
  for (const [y0, y1] of [[top, top + 40], [top + vh, top + vh - 40]]) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, Math.min(y0, y1), W, 40);
  }
  // scrollbar
  const total = D.height, bh = Math.max(40, vh * (vh / total)), by = top + (vh - bh) * (mapScroll / Math.max(1, total - vh));
  c.fillStyle = rgba(k, 0.4); c.fillRect(W - 8, by, 3, bh);
  neonTitle(c, 'CIDADE', W / 2, safeTop + 84, 52, k, k, 14);
}

function drawNode(c, b, now) {
  const k = col(), i = b.node;
  const p = nodePos(i);
  const done = i < prog, open = unlocked(i), next = i === prog && open;
  const r = p.boss ? 36 : 28;
  c.globalAlpha = open ? 1 : 0.5;
  const shape = () => {
    c.beginPath();
    if (p.boss) for (let q = 0; q < 6; q++) { const a = (q * TAU) / 6 + Math.PI / 6; c[q ? 'lineTo' : 'moveTo'](p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
    else c.arc(p.x, p.y, r, 0, TAU);
    c.closePath();
  };
  shape(); c.fillStyle = '#000'; c.fill();
  shape();
  c.fillStyle = rgba(k, done ? 0.3 : pressed === b ? 0.35 : 0.08); c.fill();
  if (open) { shape(); neonStroke(c, k, k, next ? 3.5 : 2.5, p.x - r, p.y, p.x + r, p.y, next ? 1 + 0.4 * Math.sin(now * 5) : 0.6); }
  else { c.save(); c.setLineDash([5, 6]); shape(); c.strokeStyle = rgba(k, 0.8); c.lineWidth = 2; c.stroke(); c.restore(); }
  if (next) { c.beginPath(); c.arc(p.x, p.y, r + 10 + 4 * Math.sin(now * 5), 0, TAU); c.strokeStyle = rgba(k, 0.45); c.lineWidth = 1.5; c.stroke(); }
  if (p.boss) {
    c.beginPath(); c.moveTo(p.x - 16, p.y); c.quadraticCurveTo(p.x, p.y - 13, p.x + 16, p.y); c.quadraticCurveTo(p.x, p.y + 13, p.x - 16, p.y);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
  } else {
    glowText(c, stageLabel(i), p.x, p.y + 1, 14, '#ffffff', k, 'center', 700, 1);
  }
  if (done) {
    c.beginPath(); c.moveTo(p.x + r * 0.55, p.y - r * 0.85); c.lineTo(p.x + r * 0.75, p.y - r * 0.62); c.lineTo(p.x + r * 1.1, p.y - r * 1.05);
    c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
  }
  if (!open) { c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2; c.strokeRect(p.x - 7, p.y + r * 0.35, 14, 10); }
  c.globalAlpha = 1;
}

function cardBox() {
  ctx.font = `500 25px ${BODY_FONT}`;
  const lines = wrap(ctx, card ? card.text : '', 520);
  const h = 190 + lines.length * 36 + 90;
  const f = focusPoint();
  const y = f && f.y > H * 0.5 ? game.top + 70 : Math.min(H * 0.42, H - h - 40);
  return { x: W / 2 - 300, y, w: 600, h, lines };
}

function focusPoint() {
  if (!card || !card.focus || !game.paddle) return null;
  const p = game.paddle;
  switch (card.focus) {
    case 'paddle': return { x: p.x, y: p.y + 15, r: p.hw + 34 };
    case 'ball': { const b = game.balls[0]; return b ? { x: b.x, y: b.y, r: 44 } : null; }
    case 'brick': { const b = game.bricks.find((q) => q.kind !== 'wall'); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2, r: 56 } : null; }
    case 'drop': { const d = game.drops[0]; return d ? { x: d.x, y: d.y, r: 52 } : null; }
    case 'void': return { x: W / 2, y: game.bottom, r: 0, line: true };
    case 'boss': return game.boss ? { x: game.boss.cx, y: game.boss.cy, r: 80 } : null;
    case 'mech': {
      if (game.wells.length) return { x: game.wells[0].x, y: game.wells[0].y, r: 70 };
      const b = game.bricks.find((q) => game.rows[q.row] && game.rows[q.row].A > 0);
      return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2, r: 60 } : null;
    }
  }
  return null;
}

function renderCard(c, now) {
  const k = col();
  dim(c, 0.6);
  const f = focusPoint();
  if (f) {
    const pulse = 1 + 0.08 * Math.sin(now * 5);
    if (f.line) {
      c.beginPath(); c.moveTo(40, f.y); c.lineTo(W - 40, f.y);
      neonStroke(c, k, k, 4, 40, f.y, W - 40, f.y, 1.2);
    } else if (f.r) {
      c.beginPath(); c.arc(f.x, f.y, f.r * pulse, 0, TAU);
      neonStroke(c, k, k, 3, f.x - f.r, f.y, f.x + f.r, f.y, 1);
    }
  }
  const box = cardBox();
  roundRectPath(c, box.x, box.y, box.w, box.h, 26);
  c.fillStyle = 'rgba(0,0,0,0.88)';
  c.fill();
  neonStroke(c, k, k, 2.6, box.x, box.y, box.x + box.w, box.y + box.h, 0.9);
  glowText(c, card.kicker, W / 2, box.y + 44, 14, rgba(k, 0.9), k, 'center', 500, 6);
  neonTitle(c, card.title, W / 2, box.y + 100, 38, k, k, 6);
  c.save();
  c.font = `500 25px ${BODY_FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = 'rgba(255,255,255,0.92)';
  box.lines.forEach((ln, i) => c.fillText(ln, W / 2, box.y + 162 + i * 36));
  c.restore();
}

function renderDev(c) {
  const k = col();
  const t = devToggleRect();
  roundRectPath(c, t.x, t.y, t.w, t.h, 8);
  c.fillStyle = rgba(k, devOpen ? 0.35 : 0.08); c.fill();
  c.strokeStyle = rgba(k, 0.9); c.lineWidth = 1.5; c.stroke();
  glowText(c, opts.inf ? 'DEV ∞' : 'DEV', t.x + t.w / 2, t.y + t.h / 2 + 1, 12, '#ffffff', k, 'center', 700, 2);
  if (freeze) glowText(c, 'CONGELADO', t.x - 12, t.y + t.h / 2, 11, rgba(k, 0.9), k, 'right', 700, 2);
  if (!devOpen) return;
  const dp = devPanel();
  roundRectPath(c, dp.rect.x, dp.rect.y, dp.rect.w, dp.rect.h, 16);
  c.fillStyle = 'rgba(0,0,0,0.82)'; c.fill();
  neonStroke(c, k, k, 2, dp.rect.x, dp.rect.y, dp.rect.x + dp.rect.w, dp.rect.y, 0.6);
  for (const b of dp.list) drawButton(c, b);
}

function dim(c, a) {
  c.fillStyle = `rgba(0,0,0,${a})`;
  c.fillRect(0, 0, W, H);
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.res, 0, 0, view.res, 0, 0);

  buttons = layout();
  const k = col();
  const now = performance.now() / 1000;

  if (scene === 'menu') {
    renderDemo(ctx);
    neonTitle(ctx, 'NEON', W / 2, H * 0.17, 130, k, k, 18);
    neonTitle(ctx, 'BREAKER', W / 2, H * 0.17 + 110, 58, mix(k, '#ffffff', 0.4), k, 18);
    if (best > 0) glowText(ctx, 'RECORDE  ' + best, W / 2, H * 0.17 + 180, 18, rgba(k, 0.85), k, 'center', 500, 5);
    drawPlatform(ctx, plat, W / 2, H - 150, BASE_HW, now, k);
    const vt = performance.now() - verTaps.t < 1500 ? verTaps.n : 0;
    glowText(ctx, 'v' + VERSION, W - 24, H - 22, 12 + vt, rgba(k, 0.6 + vt * 0.08), k, 'right', 500, 2);
  } else if (scene === 'map') {
    renderMap(ctx, now);
  } else if (scene === 'crash') {
    renderCrash(ctx, now);
  } else if (scene === 'plat') {
    renderPlatScreen(ctx, now);
  } else if (scene === 'colors') {
    neonTitle(ctx, 'COR', W / 2, safeTop + 120, 64, k, k, 18);
  } else if (scene === 'credits') {
    renderCredits(ctx);
  } else if (scene === 'devgate') {
    renderDevGate(ctx, now);
  } else if (scene === 'options' || scene === 'dev') {
    neonTitle(ctx, scene === 'dev' ? 'CONFIG. DEV' : 'OPÇÕES', W / 2, safeTop + 105, 46, k, k, 12);
    if (optMsg && now - optMsg.t < 2.2) {
      ctx.globalAlpha = Math.min(1, (2.2 - (now - optMsg.t)) * 2);
      glowText(ctx, optMsg.text, W / 2, H - 165, 17, '#ffffff', k, 'center', 700, 4);
      ctx.globalAlpha = 1;
    }
  } else {
    game.render(ctx, scene === 'play');
    if (scene === 'play' && opts.dev) renderDev(ctx);
    if (scene === 'pause') {
      dim(ctx, 0.7);
      neonTitle(ctx, 'PAUSA', W / 2, H * 0.32, 72, k, k, 12);
    } else if (scene === 'over') {
      dim(ctx, 0.7);
      neonTitle(ctx, 'FIM DE JOGO', W / 2, H * 0.3, 60, k, k, 12);
      glowText(ctx, String(lastScore), W / 2, H * 0.42, 52, '#ffffff', k, 'center', 700, 3);
      glowText(ctx, newBest ? 'NOVO RECORDE!' : 'RECORDE  ' + best, W / 2, H * 0.42 + 56, 18, rgba(k, 0.9), k, 'center', 500, 5);
    } else if (scene === 'world') {
      dim(ctx, 0.7);
      glowText(ctx, `DISTRITO ${game.stage.w + 1}  ·  ${game.world.name}`, W / 2, H * 0.28, 22, rgba(k, 0.9), k, 'center', 700, 8);
      neonTitle(ctx, 'CONCLUÍDO', W / 2, H * 0.34, 62, k, k, 10);
      glowText(ctx, String(lastScore), W / 2, H * 0.45, 52, '#ffffff', k, 'center', 700, 3);
      if (game.index + 1 >= TOTAL_STAGES) glowText(ctx, 'NOVOS DISTRITOS EM BREVE', W / 2, H * 0.52, 16, rgba(k, 0.9), k, 'center', 500, 5);
      if (newShape) glowText(ctx, 'NOVO FORMATO DE PLATAFORMA: ' + newShape, W / 2, H * 0.555, 15, '#ffffff', k, 'center', 700, 3);
    } else if (scene === 'card' && card) {
      renderCard(ctx, now);
    }
  }

  for (const b of buttons) {
    if (b.node !== undefined) drawNode(ctx, b, now);
    else if (b.theme !== undefined) drawColorTile(ctx, b);
    else drawButton(ctx, b);
  }

  if (opts.fps) glowText(ctx, fps + ' FPS', 20, H - 20, 14, '#ffffff', k, 'left', 500, 2);
}

// ---------- loop ----------
let fps = 0, fpsN = 0, fpsT = performance.now();
const STEP = 1 / 120;
let acc = 0;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += dt;
  fpsN++;
  if (now - fpsT >= 1000) { fps = fpsN; fpsN = 0; fpsT = now; }
  while (acc >= STEP) {
    if (scene === 'play' && !freeze) game.update(STEP);
    else if (scene === 'menu') updateDemo(STEP);
    acc -= STEP;
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
