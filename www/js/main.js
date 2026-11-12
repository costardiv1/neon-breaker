import { view, rgba, mix, roundRectPath, neonStroke, neonTitle, glowText, drawSprite, TAU, drawVirus } from './render.js';
import { Game, W, BALL_R, BASE_HW, POWERS, ABILITIES, PASSIVES, drawAbilityIcon, gfx, HIT_T, coinSprite, DISCS, TRAILS, discSprite, drawTrail, trimTrail, clearSprites, tierTone, dropSprite, fmtTime } from './game.js';
import { SHAPES, PALETTES, EMBLEMS, drawPlatform, outAngle, paletteColors } from './platform.js';
import { MECHS, WORLDS, TOTAL_STAGES, getStage, stageLabel, districtMechs, worldStart, worldCount } from './levels.js';
import { THEMES } from './themes.js';
import { sfx, music, haptics } from './audio.js';
import { createDevPanel } from './devpanel.js';
import { ONLINE, submitRun, fetchTop, getName, setName, NAME_RE } from './online.js';

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
export const VERSION = '1.6';

let H = 1280;
let safeTop = 0;
let scene = 'menu';   // menu | map | plat | notif | perktut | colors | options | dev | play | pause | over | card | world | story | crash
let colorIndex = Math.min(store.get('color', 0), THEMES.length - 1);
const savedPlat = store.get('plat', {});
const plat = {
  shape: Math.min(savedPlat.shape || 0, SHAPES.length - 1),
  pal: Math.min(savedPlat.pal ?? PALETTES.length - 1, PALETTES.length - 1),   // default: SISTEMA
  emb: Math.min(savedPlat.emb ?? 1, EMBLEMS.length - 1),
  disc: Math.min(savedPlat.disc || 0, DISCS.length - 1),
  trail: Math.min(savedPlat.trail || 0, TRAILS.length - 1),
  dash: !!savedPlat.dash,                 // dashed main line
  detail: savedPlat.detail !== false,     // extra decoration of each shape
};
// Campaign: each stage keeps its own best score (shown under it on the map).
let sbest = store.get('sbest', {});
// INFINITO: the leaderboard measures the time survived.
let bestT = store.get('bestT', 0);
let eruns = store.get('eruns', []);        // best endless runs on this device: { t, bosses, date }
let devUI = null;                          // in-game dev panel (created further down)
const REPO_URL = 'https://github.com/costardiv1/neon-breaker';
const INSTA_URL = 'https://www.instagram.com/v.costardi';
const QB_URL = 'https://costardiv1.github.io/quebrabloco/';
const openUrl = (u) => { try { window.open(u, '_blank', 'noopener'); } catch (e) { /* ignore */ } };
let prog = store.get('prog', 0);          // number of stages cleared
// 1.3: districts went from 3 to 4 stages (plus the boss). Progress saved in the
// old layout is converted, keeping the district and the stages cleared in it.
const oldLayout = store.get('layout', 1) < 2;
if (oldLayout) {
  if (prog > 0) { prog = Math.floor(prog / 4) * 5 + (prog % 4); store.set('prog', prog); }
  store.set('layout', 2);
}
let seen = store.get('seen', {});         // mechanic / boss intro cards already shown
let chips = store.get('chips', 0);        // currency for the perks
const upg = Object.assign({ megalaser: 0, shock: 0, shield: 0, magnet: 0, slow: 0, bolt: 0,
  width: 0, grana: 0, recarga: 0, sorte: 0, vida: 0, pesado: 0 }, store.get('upg', {}));
let equip = store.get('equip', null);     // equipped active perk
// equipped passive perk (PLATAFORMA LARGA used to be always on: it stays equipped)
let equipP = store.get('equipP', upg.width > 0 ? 'width' : null);
let seenShape = store.get('seenShape', 0); // highest unlocked shape the player has already looked at
let coins = store.get('coins', 0);        // caught in play (rare drops), spent on colors and emblems
// cosmetics owned; the ones already in use when this was introduced stay free
const owned = Object.assign({ pal: [...new Set([PALETTES.length - 1, plat.pal])], emb: [...new Set([0, 1, plat.emb])], disc: [0], trail: [0] },
  store.get('owned', {}));
const saveChips = () => {
  store.set('chips', chips); store.set('upg', upg); store.set('equip', equip); store.set('equipP', equipP);
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
if (oldLayout || !(opts.startStage >= 0 && opts.startStage < TOTAL_STAGES)) opts.startStage = 0;

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
if (plat.shape > bossesBeaten() && !(opts.dev && opts.unlock)) plat.shape = 0;
const devAll = () => opts.dev && opts.unlock;              // dev: everything unlocked, perks at max
const perkLvl = (k) => (devAll() ? 3 : upg[k]);

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
  { on: 'drop', title: 'CÁPSULAS', focus: 'drop',
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

// An endless run ends: it goes to the local records and, when it was played
// without the dev mode, to the online leaderboard.
let endlessDev = false;
function finishEndless(t) {
  const E = game.endless;
  newBest = t > bestT;
  if (newBest) { bestT = t; store.set('bestT', bestT); }
  if (t > 0) {
    eruns.push({ t, bosses: E.bosses, date: Date.now() });
    eruns.sort((a, b) => b.t - a.t);
    eruns = eruns.slice(0, 10);
    store.set('eruns', eruns);
    if (!endlessDev && !opts.dev) submitRun({ score: t, cleared: E.breaks, stage: E.bosses, version: VERSION });
    board.data = [null, null, null];
  }
}
const endlessOpen = () => bossesBeaten() >= 1 || devAll();

const game = new Game({
  onGameOver(score) {
    lastScore = score;
    if (game.endless) finishEndless(score);
    else newBest = false;
    setScene('over');
  },
  onEvent(e, data) {
    if (e === 'level') {
      if (devUI) devUI.refresh();
      if (tut && game.index === 0) { fire('start'); return; }
      const st = game.stage;
      if (st.boss && !seen['boss_' + st.boss.type]) {
        markSeen('boss_' + st.boss.type);
        card = { kicker: (game.endless ? 'INFINITO' : `DISTRITO ${st.w + 1}`) + '  ·  CHEFÃO', title: st.boss.name, text: st.boss.text, focus: 'boss' };
        showCard();
      } else if (st.mech && !seen[st.mech]) {
        markSeen(st.mech);
        const caps = Object.values(POWERS).filter((v) => v.d === st.w + 1).map((v) => v.label);
        const news = st.w > 0 && caps.length ? ' Cápsulas novas: ' + caps.join(' e ') + '.' : '';
        card = { kicker: `DISTRITO ${st.w + 1}  ·  NOVA MECÂNICA`, title: MECHS[st.mech].name, text: MECHS[st.mech].text + news, focus: 'mech' };
        showCard();
      }
      return;
    }
    if (e === 'endlessMech') {
      if (!seen[data]) { markSeen(data); card = { kicker: 'INFINITO  ·  NOVA MECÂNICA', title: MECHS[data].name, text: MECHS[data].text, focus: 'mech' }; showCard(); }
      return;
    }
    if (e === 'chip') { chips += data; return; }
    if (e === 'coin') { coins += data; return; }
    if (e === 'stageClear') {
      const nb0 = bossesBeaten();
      prog = Math.max(prog, data + 1); store.set('prog', prog);
      lastScore = game.score;
      if (game.score > (sbest[data] || 0)) {
        if (sbest[data]) game.float('NOVO RECORDE DA FASE', W / 2, game.paddle.y - 160, 22);
        sbest[data] = game.score; store.set('sbest', sbest);
      }
      const nb1 = bossesBeaten();
      if (nb1 > nb0 && SHAPES[nb1]) newShape = SHAPES[nb1].name;
      saveChips();
      return;
    }
    if (e === 'reward') { reward = { n: data, back: 'play', done: false }; setScene('reward'); return; }
    if (e === 'worldClear') {
      saveChips();
      reward = game.stageCoins > 0 ? { n: game.stageCoins, back: 'world', done: false } : null;
      if (game.world.final) { startCrash(); return; }
      if (game.stage.boss && STORY[game.stage.w]) startStory(game.stage.w);
      else setScene('world');
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
let freeze = false;
let drag = null;

const IN_GAME = ['play', 'pause', 'over', 'card', 'world', 'crash', 'story', 'reward', 'ad'];
function setScene(s) {
  if (s !== 'play') saveChips();
  if (s === 'map' && scene !== 'map') focusMap();
  if (s === 'plat' && scene !== 'plat') openPlat();
  showGateInput(s === 'devgate' && !opts.dev);
  if (s !== 'scores') showNameInput(false);
  scene = s;
  sfx.setPlaying(s === 'play');
  if (s === 'crash') music.play(null);
  else if (!IN_GAME.includes(s)) music.play('map');
  music.duck(s === 'pause' || s === 'card' || s === 'over' || s === 'story' || s === 'reward' || s === 'ad');
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
window.addEventListener('resize', () => {
  resize();
  if (gateInput && gateInput.style.display !== 'none') placeGateInput();
  if (nameInput && nameInput.style.display !== 'none') placeNameInput();
  if (devUI) devUI.place();
});
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

function toggleSfx() { sfx.setEnabled(!sfx.enabled); store.set('sound', sfx.enabled); }
function toggleMusic() { sfx.setMusic(!sfx.musicOn); store.set('music', sfx.musicOn); }
function optionRows() {
  if (scene === 'options') {
    const rows = [
      { label: 'EFEITOS SONOROS', val: () => onOff(sfx.enabled), tap: toggleSfx },
      { label: 'MÚSICA', val: () => onOff(sfx.musicOn, true), tap: toggleMusic },
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
    ];
    if (opts.dev) {
      rows.push({ label: 'MODO DEV', val: () => onOff(true), tap: () => { opts.dev = false; } });
      rows.push({ label: 'CONFIG. DEV', val: () => 'ABRIR  ›', tap: () => setScene('dev') });
    }
    return rows;
  }
  return [
    { label: 'VIDAS INFINITAS', val: () => onOff(opts.inf, true), tap: () => { opts.inf = !opts.inf; } },
    { label: 'DESBLOQUEAR TUDO (E PERKS)', val: () => onOff(opts.unlock), tap: () => { opts.unlock = !opts.unlock; } },
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
  sbest = {}; bestT = 0; eruns = []; store.set('sbest', {}); store.set('bestT', 0); store.set('eruns', []); seen = {}; prog = 0; chips = 0; coins = 0; equip = null; equipP = null; seenShape = 0; store.set('seenShape', 0);
  for (const k in upg) upg[k] = 0;
  Object.assign(owned, { pal: [PALETTES.length - 1], emb: [0, 1], disc: [0], trail: [0] });
  Object.assign(plat, { shape: 0, pal: PALETTES.length - 1, emb: 1, disc: 0, trail: 0, dash: false, detail: true });
  store.set('seen', {}); store.set('tutDone', false); store.set('prog', 0); store.set('plat', plat);
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

// ---------- BREAKERS > PERKS: a carousel of cards ----------
// Two kinds: ATIVOS (fired in play) and PASSIVOS (always on). One of each is equipped.
const ACTIVE_KEYS = ['shield', 'shock', 'slow', 'magnet', 'megalaser', 'bolt'];
const PASSIVE_KEYS = ['width', 'grana', 'recarga', 'sorte', 'vida', 'pesado'];
let buyMsg = null;
let perkKind = 0;                  // 0 ATIVOS, 1 PASSIVOS
const perkSel = [0, 0];
const perkKeys = (kind = perkKind) => (kind ? PASSIVE_KEYS : ACTIVE_KEYS);
const perkKey = () => perkKeys()[perkSel[perkKind]];
const perkInfo = (k) => ABILITIES[k] || PASSIVES[k];
const isPassive = (k) => !!PASSIVES[k];
const canBuyPerk = (k) => !devAll() && upg[k] < 3 && chips >= perkInfo(k).cost[upg[k]];
const perkAlert = (kind) => perkKeys(kind).some(canBuyPerk);
function buy(k) {
  const lvl = upg[k], info = perkInfo(k);
  if (lvl >= 3 || devAll()) return;
  const cost = info.cost[lvl];
  if (chips < cost) { buyMsg = { text: 'CHIPS INSUFICIENTES', t: performance.now() / 1000 }; return; }
  chips -= cost;
  upg[k] = lvl + 1;
  if (isPassive(k)) { if (!equipP) equipP = k; } else if (!equip) equip = k;
  sfx.power(true);
  buyMsg = { text: (lvl ? 'EVOLUÍDO: ' : 'COMPRADO: ') + info.name, t: performance.now() / 1000 };
  saveChips();
}
function toggleEquip(k) {
  if (isPassive(k)) equipP = equipP === k ? null : k;
  else equip = equip === k ? null : k;
  saveChips();
}
const isEquipped = (k) => (isPassive(k) ? equipP : equip) === k;
function browsePerk(d) { const n = perkKeys().length; perkSel[perkKind] = (perkSel[perkKind] + d + n) % n; }
const perkCard = () => {
  const y = safeTop + 352;
  return { x: 140, y, w: W - 280, h: H - 300 - y };
};
function perkButtons() {
  const list = [], cx = W / 2, cd = perkCard();
  ['ATIVOS', 'PASSIVOS'].forEach((t, i) => list.push(btn(cx + (i ? 150 : -150), safeTop + 302, 280, 50, t, () => { perkKind = i; }, { small: true, sel: perkKind === i, fs: 14, bang: perkAlert(i) })));
  list.push(btn(cx - 300, cd.y + cd.h / 2, 84, 84, '', () => browsePerk(-1), { arrow: -1 }));
  list.push(btn(cx + 300, cd.y + cd.h / 2, 84, 84, '', () => browsePerk(1), { arrow: 1 }));
  const k = perkKey(), lvl = perkLvl(k), info = perkInfo(k), y = H - 178;
  const label = lvl >= 3 ? 'MÁXIMO' : (lvl ? 'EVOLUIR  ' : 'COMPRAR  ') + info.cost[lvl] + ' CHIPS';
  if (lvl) {
    list.push(btn(cx - 155, y, 290, 64, label, lvl >= 3 ? null : () => buy(k), { fs: 14, bang: canBuyPerk(k) }));
    list.push(btn(cx + 155, y, 290, 64, isEquipped(k) ? 'EQUIPADO' : 'EQUIPAR', () => toggleEquip(k), { fs: 14 }));
  } else list.push(btn(cx, y, 420, 64, label, () => buy(k), { fs: 15, bang: canBuyPerk(k) }));
  return list;
}
function renderPerks(c, now) {
  const k = col(), cd = perkCard(), key = perkKey(), info = perkInfo(key), lvl = perkLvl(key), eq = isEquipped(key);
  const cx = W / 2;
  // the card
  roundRectPath(c, cd.x, cd.y, cd.w, cd.h, 22);
  c.fillStyle = rgba(k, lvl ? 0.07 : 0.025); c.fill();
  if (eq) neonStroke(c, k, k, 2.6, cd.x, cd.y, cd.x + cd.w, cd.y + cd.h, 0.9);
  else { c.strokeStyle = rgba(k, lvl ? 0.6 : 0.3); c.lineWidth = 2; c.stroke(); }
  glowText(c, isPassive(key) ? 'PERK PASSIVO' : 'PERK ATIVO', cx, cd.y + 34, 12, rgba(k, 0.85), k, 'center', 700, 4);
  if (eq) glowText(c, 'EQUIPADO', cx, cd.y + 56, 11, '#ffffff', k, 'center', 700, 3);
  // icon in a ring
  const iy = cd.y + Math.min(150, cd.h * 0.26), R = 58;
  c.beginPath(); c.arc(cx, iy, R, 0, TAU);
  c.fillStyle = rgba(k, lvl ? 0.14 : 0.04); c.fill();
  if (lvl) neonStroke(c, k, k, 2.6, cx - R, iy, cx + R, iy, 0.8);
  else { c.strokeStyle = rgba(k, 0.35); c.lineWidth = 2; c.stroke(); }
  drawAbilityIcon(c, key, cx, iy, 26, lvl ? '#ffffff' : rgba(k, 0.6));
  // name and level pips
  let y = iy + R + 46;
  glowText(c, info.name, cx, y, 25, lvl ? '#ffffff' : rgba('#ffffff', 0.7), k, 'center', 700, 4);
  y += 34;
  for (let q = 0; q < 3; q++) {
    c.beginPath(); c.rect(cx - 40 + q * 28, y - 5, 20, 9);
    if (q < lvl) { c.fillStyle = k; c.fill(); } else { c.strokeStyle = rgba(k, 0.55); c.lineWidth = 1.4; c.stroke(); }
  }
  // description
  y += 40;
  c.font = `500 17px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.8)'; c.textAlign = 'center';
  const lines = wrap(c, info.desc, cd.w - 56).slice(0, 3);
  lines.forEach((ln, li) => c.fillText(ln, cx, y + li * 24));
  // what each level gives
  y += lines.length * 24 + 26;
  info.lv.forEach((t, q) => {
    const on = q < lvl, next = q === lvl;
    glowText(c, 'NÍVEL ' + (q + 1) + '   ' + t.toUpperCase(), cx, y + q * 30, 13, on ? '#ffffff' : next ? rgba('#ffffff', 0.7) : rgba('#ffffff', 0.35), k, 'center', on ? 700 : 500, on ? 3 : 0);
  });
  // carousel dots
  const n = perkKeys().length;
  for (let q = 0; q < n; q++) {
    const x = cx + (q - (n - 1) / 2) * 24, yy = cd.y + cd.h + 28, kq = perkKeys()[q];
    c.beginPath(); c.arc(x, yy, q === perkSel[perkKind] ? 6 : 4, 0, TAU);
    if (perkLvl(kq)) { c.fillStyle = q === perkSel[perkKind] ? '#ffffff' : k; c.fill(); } else { c.strokeStyle = rgba(k, 0.6); c.lineWidth = 1.5; c.stroke(); }
    if (canBuyPerk(kq)) drawBang(c, x + 7, yy - 9, 6);
  }
  if (!platMsg(c, now, H - 232)) {
    c.font = `500 13px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.5)'; c.textAlign = 'center';
    c.fillText(perkKind ? 'Equipe 1 passivo: ele vale o tempo todo.' : 'Equipe 1 ativo: ele carrega quebrando blocos.', cx, H - 232);
  }
}

// ---------- alerts: "!" where there is something new or affordable ----------
function drawBang(c, x, y, r = 11) {
  r *= 0.62;
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.fillStyle = 'rgba(255,216,74,0.85)'; c.fill();
  c.fillStyle = '#000'; c.font = `900 ${Math.round(r * 1.5)}px ${BODY_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('!', x, y + 1);
  c.textBaseline = 'alphabetic';
}
const topShape = () => Math.min(bossesBeaten(), SHAPES.length - 1);
const shapeAlert = () => !devAll() && topShape() > seenShape;
function markShapesSeen() { if (topShape() > seenShape) { seenShape = topShape(); store.set('seenShape', seenShape); } }
const cheapest = (key) => {
  let best = -1;
  for (let i = 0; i < catN(key); i++) if (!itemOpen(key, i) && coins >= itemCost(key, i) && (best < 0 || itemCost(key, i) < itemCost(key, best))) best = i;
  return best;
};
const itemAlert = (key) => !devAll() && cheapest(key) >= 0;
const tabAlert = (i) => (i === 0 ? shapeAlert() : i === PERK_TAB ? perkAlert(0) || perkAlert(1) : itemAlert(['shape', 'pal', 'emb', 'disc', 'trail'][i]));
const breakersAlert = () => PLAT_TABS.some((_, i) => tabAlert(i));
let platBack = 'menu';
function openBreakers(tab, back = 'menu', kind = null, sel = null) {
  if (tab !== undefined && tab !== null) platTab = tab;
  if (kind !== null) perkKind = kind;
  if (sel !== null) perkSel[perkKind] = sel;
  platBack = back;
  setScene('plat');
}

// ---------- notifications ----------
function notes() {
  const list = [];
  if (shapeAlert()) list.push({ title: 'NOVO FORMATO LIBERADO', sub: SHAPES[topShape()].name, go: () => openBreakers(0, 'notif') });
  [0, 1].forEach((kind) => {
    const ks = perkKeys(kind).filter(canBuyPerk);
    if (!ks.length) return;
    const kk = ks[0], i = perkKeys(kind).indexOf(kk), tag = kind ? 'PERK PASSIVO' : 'PERK ATIVO';
    if (ks.length === 1) list.push({ title: (upg[kk] ? 'EVOLUA: ' : 'COMPRE: ') + perkInfo(kk).name, sub: tag + '  ·  ' + perkInfo(kk).cost[upg[kk]] + ' CHIPS', go: () => openBreakers(PERK_TAB, 'notif', kind, i) });
    else list.push({ title: ks.length + (kind ? ' PERKS PASSIVOS' : ' PERKS ATIVOS') + ' PARA COMPRAR', sub: 'A PARTIR DE ' + Math.min(...ks.map((q) => perkInfo(q).cost[upg[q]])) + ' CHIPS', go: () => openBreakers(PERK_TAB, 'notif', kind, i) });
  });
  ['pal', 'emb', 'disc', 'trail'].forEach((key, ti) => {
    const i = cheapest(key);
    if (i >= 0 && !devAll()) list.push({ title: 'DÁ PARA COMPRAR: ' + catName(key, i), sub: PLAT_TABS[ti + 1] + '  ·  ' + itemCost(key, i) + ' MOEDAS', go: () => { browse[key] = i; openBreakers(ti + 1, 'notif'); browse[key] = i; } });
  });
  return list;
}
const bellRect = () => ({ x: W - 96, y: safeTop + 22, w: 72, h: 72 });
function drawBell(c, b) {
  const k = col(), cx = b.x + b.w / 2, cy = b.y + b.h / 2, n = notes().length;
  c.beginPath(); c.arc(cx, cy, 30, 0, TAU);
  c.fillStyle = rgba(k, pressed === b ? 0.2 : 0.05); c.fill();
  neonStroke(c, k, k, 2, cx - 30, cy, cx + 30, cy, 0.6);
  c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx - 13, cy + 8); c.quadraticCurveTo(cx - 11, cy - 15, cx, cy - 15); c.quadraticCurveTo(cx + 11, cy - 15, cx + 13, cy + 8); c.closePath();
  c.stroke();
  c.beginPath(); c.arc(cx, cy + 12, 3.5, 0, Math.PI); c.stroke();
  c.restore();
  if (n) {
    c.beginPath(); c.arc(cx + 22, cy - 20, 12, 0, TAU); c.fillStyle = '#ffd84a'; c.fill();
    c.fillStyle = '#000'; c.font = `900 15px ${BODY_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(n > 9 ? '9+' : String(n), cx + 22, cy - 19); c.textBaseline = 'alphabetic';
  }
}
function notifButtons() {
  const list = notes().slice(0, 8).map((nt, i) => btn(W / 2, safeTop + 230 + i * 96, 640, 82, nt.title, nt.go, { note: nt }));
  list.push(btn(W / 2, H - 90, 400, 76, 'VOLTAR', () => setScene('menu')));
  return list;
}
function drawNote(c, b) {
  const k = col();
  roundRectPath(c, b.x, b.y, b.w, b.h, 14);
  c.fillStyle = rgba(k, pressed === b ? 0.16 : 0.04); c.fill();
  c.strokeStyle = rgba(k, 0.45); c.lineWidth = 1.5; c.stroke();
  drawBang(c, b.x + 36, b.y + b.h / 2, 12);
  glowText(c, b.note.title, b.x + 66, b.y + 32, 16, '#ffffff', k, 'left', 700, 2);
  glowText(c, b.note.sub, b.x + 66, b.y + 58, 12, rgba(k, 0.9), k, 'left', 500, 2);
  glowText(c, '›', b.x + b.w - 28, b.y + b.h / 2 + 2, 26, rgba(k, 0.9), k, 'center', 700, 2);
}

// ---------- tutorial: how perks work (after the first boss) ----------
const PERK_TUT = [
  { title: 'PERKS', text: 'Os chips que você junta compram perks para a sua plataforma, no menu BREAKERS.' },
  { title: 'CHIPS', text: '1 por bloco, 10 por fase, 5 por acerto no chefão e 60 por chefão derrotado.' },
  { title: 'ATIVOS', text: 'Equipe 1 perk ativo. Ele carrega quebrando blocos; toque 2x na tela ou use o botão para disparar.' },
  { title: 'PASSIVOS', text: 'Equipe também 1 perk passivo. Ele vale o tempo todo, sem precisar disparar.' },
  { title: 'EVOLUA', text: 'Cada perk tem 3 níveis. Quando der para comprar algo, um ! aparece no botão BREAKERS.' },
];
let perkTut = 0;
function startPerkTut() { perkTut = 0; markSeen('perkTut'); setScene('perktut'); }
function renderPerkTut(c) {
  const k = col(), pg = PERK_TUT[perkTut];
  game.render(c, false);
  dim(c, 0.8);
  c.font = `500 25px ${BODY_FONT}`;
  const lines = wrap(c, pg.text, 520), h = 200 + lines.length * 36 + 100, x = W / 2 - 300, y = H * 0.5 - h / 2;
  roundRectPath(c, x, y, 600, h, 26);
  c.fillStyle = 'rgba(0,0,0,0.9)'; c.fill();
  neonStroke(c, k, k, 2.6, x, y, x + 600, y + h, 0.9);
  glowText(c, `TUTORIAL  ·  PERKS  ${perkTut + 1}/${PERK_TUT.length}`, W / 2, y + 44, 14, rgba(k, 0.9), k, 'center', 500, 6);
  neonTitle(c, pg.title, W / 2, y + 100, 38, k, k, 6);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,0.92)';
  lines.forEach((ln, i) => c.fillText(ln, W / 2, y + 166 + i * 36));
  c.restore();
}
function perkTutButtons() {
  ctx.font = `500 25px ${BODY_FONT}`;
  const lines = wrap(ctx, PERK_TUT[perkTut].text, 520), h = 200 + lines.length * 36 + 100, by = H * 0.5 + h / 2 - 62, cx = W / 2;
  if (perkTut < PERK_TUT.length - 1) return [btn(cx, by, 340, 70, 'CONTINUAR', () => { perkTut++; }, { big: true })];
  return [
    btn(cx - 140, by, 250, 70, 'DEPOIS', () => setScene('world'), { fs: 16 }),
    btn(cx + 140, by, 250, 70, 'BREAKERS', () => openBreakers(PERK_TAB, 'world'), { big: true, fs: 20 }),
  ];
}

function platMsg(c, now, y) {
  if (!buyMsg || now - buyMsg.t >= 1.8) return false;
  c.globalAlpha = Math.min(1, (1.8 - (now - buyMsg.t)) * 2);
  glowText(c, buyMsg.text, W / 2, y, 16, '#ffffff', col(), 'center', 700, 3);
  c.globalAlpha = 1;
  return true;
}

// ---------- BREAKERS screen: shape, colors, emblem, disc, trail and perks ----------
// Shapes unlock as bosses fall; colors and emblems are bought with coins.
const PLAT_TABS = ['FORMATO', 'CORES', 'EMBLEMA', 'DISCO', 'RASTRO', 'PERKS'];
const PERK_TAB = 5;
const PAL_COST = [10, 15, 20, 25, 30, 55, 35, 0];
const EMB_COST = [0, 0, 90, 110, 130, 160, 270, 190];
let platTab = 0;
const browse = { shape: 0, pal: 0, emb: 0, disc: 0, trail: 0 };
const CATS = {
  shape: { n: () => SHAPES.length, name: (i) => SHAPES[i].name },
  pal: { n: () => PALETTES.length, name: (i) => PALETTES[i].name, cost: (i) => PAL_COST[i] ?? 35 },
  emb: { n: () => EMBLEMS.length, name: (i) => EMBLEMS[i], cost: (i) => EMB_COST[i] ?? 150 },
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
  if (coins < cost) { buyMsg = { text: 'MOEDAS INSUFICIENTES', t: performance.now() / 1000 }; return; }
  coins -= cost;
  owned[key].push(i);
  plat[key] = i; store.set('plat', plat);
  sfx.power(true);
  buyMsg = { text: 'COMPRADO: ' + catName(key, i), t: performance.now() / 1000 };
  saveChips();
}
const platSelY = () => safeTop + 700;
function platButtons() {
  const list = [], cx = W / 2, per = Math.ceil(PLAT_TABS.length / 2), tw = (W - 48) / per;
  PLAT_TABS.forEach((t, i) => list.push({ x: 24 + (i % per) * tw + 4, y: safeTop + 150 + Math.floor(i / per) * 58, w: tw - 8, h: 50, label: t, fn: () => { platTab = i; openPlat(); }, ptab: i, bang: tabAlert(i) }));
  if (opts.dev) list.push(btn(cx, safeTop + 124, 120, 36, '+ DEV', () => { chips += 500; coins += 100; saveChips(); }, { small: true }));
  if (platTab === PERK_TAB) list.push(...perkButtons());
  else {
    const y = platSelY(), key = catKey(), i = browse[key];
    list.push(btn(cx - 270, y, 84, 84, '', () => browseItem(-1), { arrow: -1 }));
    list.push(btn(cx + 270, y, 84, 84, '', () => browseItem(1), { arrow: 1 }));
    if (key !== 'shape' && !itemOpen(key, i)) list.push(btn(cx, y + 125, 420, 72, 'COMPRAR  ·  ' + itemCost(key, i) + ' MOEDAS', buyItem, { fs: 17, bang: coins >= itemCost(key, i) }));
    if (key === 'shape') {
      const tog = (k2) => () => { plat[k2] = !plat[k2]; store.set('plat', plat); };
      list.push(btn(cx - 140, y + 190, 260, 56, 'LINHA: ' + (plat.dash ? 'TRACEJADA' : 'SÓLIDA'), tog('dash'), { fs: 13 }));
      list.push(btn(cx + 140, y + 190, 260, 56, 'DETALHES: ' + (plat.detail ? 'SIM' : 'NÃO'), tog('detail'), { fs: 13 }));
    }
  }
  list.push(btn(cx, H - 80, 400, 76, 'VOLTAR', () => setScene(platBack)));
  return list;
}
function renderPlatScreen(c, now) {
  const k = col();
  if (platTab === 0) markShapesSeen();
  neonTitle(c, 'BREAKERS', W / 2, safeTop + 66, 44, k, k, 10);
  drawSprite(c, coinSprite(), 36, safeTop + 111);
  glowText(c, coins + ' MOEDAS', 72, safeTop + 124, 17, '#ffffff', '#ffd84a', 'left', 700, 2);
  c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2; c.strokeRect(W - 60, safeTop + 113, 22, 22); c.strokeRect(W - 54, safeTop + 119, 10, 10);
  glowText(c, chips + ' CHIPS', W - 70, safeTop + 124, 17, '#ffffff', k, 'right', 700, 2);
  if (platTab === PERK_TAB) { renderPerks(c, now); return; }
  const key = catKey(), i = browse[key], open = itemOpen(key, i), n = catN(key);
  const pv = Object.assign({}, plat, { [key]: i });
  const px = W / 2, py = safeTop + 420, S = 1.6, sh = SHAPES[pv.shape];
  if (key === 'shape') {
    c.save();
    c.setLineDash([6, 8]);
    c.lineDashOffset = -now * 40;
    for (const kx of [-0.9, -0.5, 0, 0.5, 0.9]) {
      const u = kx * BASE_HW;
      const sx = px + u * S, sy = py + sh.y(u, BASE_HW) * S - 14;
      const th = outAngle(pv.shape, kx);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.sin(th) * 115, sy - Math.cos(th) * 115);
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
    glowText(c, sh.desc, W / 2, safeTop + 555, 17, '#ffffff', k, 'center', 700, 5);
    for (let q = 0; q < 5; q++) {
      const x = W / 2 + 70 + q * 22, y = safeTop + 588;
      c.beginPath(); c.arc(x, y, 6, 0, TAU);
      if (q < sh.curve) { c.fillStyle = k; c.fill(); } else { c.strokeStyle = rgba(k, 0.4); c.lineWidth = 1.5; c.stroke(); }
    }
    glowText(c, 'DESVIO', W / 2 + 40, safeTop + 588, 14, rgba(k, 0.85), k, 'right', 500, 4);
  }
  const y = platSelY();
  glowText(c, PLAT_TABS[platTab] + '  ' + (i + 1) + '/' + n, W / 2, y - 34, 13, rgba(k, 0.75), k, 'center', 500, 5);
  glowText(c, catName(key, i), W / 2, y + 2, 26, open ? '#ffffff' : rgba('#ffffff', 0.55), k, 'center', 700, 4);
  for (let q = 0; q < n; q++) {
    const x = W / 2 + (q - (n - 1) / 2) * 20, yy = y + 44;
    c.beginPath(); c.arc(x, yy, q === i ? 6 : 4, 0, TAU);
    if (itemOpen(key, q)) { c.fillStyle = q === i ? '#ffffff' : k; c.fill(); } else { c.strokeStyle = rgba(k, 0.6); c.lineWidth = 1.5; c.stroke(); }
    if (key !== 'shape' && !itemOpen(key, q) && coins >= itemCost(key, q)) drawBang(c, x + 7, yy - 9, 6);
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

// ---------- optional ads: watch one to double the coins won in a stage ----------
// Until the game reaches the Play Store there is no ad account, so the ads are
// made-up ones drawn here (one of them for Quebrabloco, where Neon Breaker began).
const AD_T = 5;   // seconds before the ad can be closed
const ADS = ['quebrabloco', 'aurum', 'cafe'];
let reward = null;   // { n: coins won, back: scene to return to, done }
let ad = null, adN = 0;
function startAd() { ad = { kind: ADS[adN++ % ADS.length], t0: performance.now() / 1000 }; setScene('ad'); }
const adDone = (now) => !!ad && now - ad.t0 >= AD_T;
function finishAd() {
  if (reward && !reward.done) { coins += reward.n; reward.done = true; saveChips(); sfx.coin(); }
  ad = null;
  setScene(reward && reward.back === 'world' ? 'world' : 'reward');
}
function renderCoinsWon(c, y, k) {
  const text = '+' + (reward.done ? reward.n * 2 : reward.n) + ' MOEDAS' + (reward.done ? '  ·  DOBRADAS!' : '');
  c.font = '700 22px "Orbitron", "Segoe UI", Roboto, Arial, sans-serif';
  const w = c.measureText(text).width + text.length * 2, x0 = W / 2 - (w + 36) / 2;
  drawSprite(c, coinSprite(), x0, y - 13);
  glowText(c, text, x0 + 36, y, 22, '#ffffff', '#ffd84a', 'left', 700, 2);
}

function renderAd(c, now) {
  const t = now - ad.t0, left = Math.ceil(AD_T - t);
  c.save();
  if (ad.kind === 'quebrabloco') adQuebrabloco(c, t);
  else if (ad.kind === 'aurum') adAurum(c, t);
  else adCafe(c, t);
  c.restore();
  // top bar: test-ad tag and countdown
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, W, safeTop + 100);
  c.font = `700 14px ${BODY_FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillStyle = '#ffd84a'; c.fillText('ANÚNCIO DE TESTE', 28, safeTop + 60);
  if (left > 0) {
    c.textAlign = 'right'; c.fillStyle = '#ffffff';
    c.fillText('RECOMPENSA EM ' + left, W - 28, safeTop + 60);
  }
  c.fillStyle = '#ffd84a'; c.fillRect(0, safeTop + 99, W * Math.min(1, t / AD_T), 3);
}
function adText(c, text, x, y, size, color, weight = 800, font = BODY_FONT) {
  c.font = `${weight} ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = color; c.fillText(text, x, y);
}
// Quebrabloco: the original, a construction site where a digger breaks a brick wall
function hazard(c, x, y, w, h, t) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = '#1b1b1b'; c.fillRect(x, y, w, h);
  c.fillStyle = '#f5c21b';
  const off = (t * 40) % (h * 2);
  for (let q = x - h * 2 + off; q < x + w + h; q += h * 2) {
    c.beginPath(); c.moveTo(q, y + h); c.lineTo(q + h, y); c.lineTo(q + h * 2, y); c.lineTo(q + h, y + h); c.closePath(); c.fill();
  }
  c.restore();
}
function adQuebrabloco(c, t) {
  // dirt and tracks
  c.fillStyle = '#6e5233'; c.fillRect(0, 0, W, H);
  const rng0 = rng(7);
  for (let i = 0; i < 160; i++) { c.fillStyle = rng0() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,230,190,0.08)'; c.fillRect(rng0() * W, rng0() * H, 3 + rng0() * 5, 3 + rng0() * 4); }
  const py = H - 330;   // top of the dark panel
  c.fillStyle = 'rgba(0,0,0,0.18)';
  const ty = py - 70;
  for (let x = 0; x < W; x += 26) { c.fillRect(x, ty, 14, 8); c.fillRect(x, ty + 46, 14, 8); }
  // brick wall with the logo painted on it
  const wy = safeTop + 300, rows = 7, bh = 34, bw = 72, gone = Math.floor(t * 4);
  c.fillStyle = '#8a8178'; c.fillRect(0, wy, W, rows * bh);
  for (let r = 0; r < rows; r++) for (let q = -1; q < 11; q++) {
    const x = q * bw + (r % 2 ? bw / 2 : 0), idx = r * 12 + q + 1;
    if (r >= 4 && ((idx * 7) % 36) < gone) continue;   // the digger knocks out the bottom rows
    c.fillStyle = (idx * 13) % 5 === 0 ? '#9c3b2a' : (idx * 7) % 3 === 0 ? '#b5482f' : '#a8432c';
    c.fillRect(x + 2, wy + r * bh + 2, bw - 4, bh - 4);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x + 2, wy + r * bh + 2, bw - 4, 4);
  }
  c.font = `900 70px ${BODY_FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const w1 = c.measureText('QUEBRA').width, w2 = c.measureText('BLOCO').width, lx = W / 2 - (w1 + w2) / 2, ly = wy + 2 * bh;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillText('QUEBRA', lx + 4, ly + 4); c.fillText('BLOCO', lx + w1 + 4, ly + 4);
  c.fillStyle = '#f2f2f2'; c.fillText('QUEBRA', lx, ly);
  c.fillStyle = '#f5c21b'; c.fillText('BLOCO', lx + w1, ly);
  // the digger, going back and forth
  const dx = W / 2 + Math.sin(t * 1.4) * 170, dy = py - 130, arm = Math.sin(t * 5) * 0.25;
  c.fillStyle = '#2a2a2a'; roundRectPath(c, dx - 95, dy + 50, 190, 36, 18); c.fill();
  c.fillStyle = '#555'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(dx - 72 + k * 36, dy + 68, 11, 0, TAU); c.fill(); }
  c.fillStyle = '#f2b51b'; c.fillRect(dx - 85, dy - 10, 150, 60);
  c.fillStyle = '#d99a0f'; c.fillRect(dx - 85, dy + 38, 150, 12);
  c.fillStyle = '#f2b51b'; c.fillRect(dx - 75, dy - 70, 70, 62);
  c.fillStyle = '#9fd3e6'; c.fillRect(dx - 66, dy - 62, 52, 34);
  c.save(); c.translate(dx + 50, dy); c.rotate(-0.9 + arm);
  c.fillStyle = '#f2b51b'; c.fillRect(0, -10, 150, 20);
  c.translate(150, 0); c.rotate(1.6 - arm * 2);
  c.fillRect(0, -8, 90, 16);
  c.fillStyle = '#3a3a3a'; c.beginPath(); c.moveTo(80, -14); c.lineTo(120, -4); c.lineTo(110, 26); c.lineTo(80, 14); c.closePath(); c.fill();
  c.restore();
  // hazard stripes and the dark panel, like the original's menus
  hazard(c, 0, safeTop + 100, W, 26, t);
  hazard(c, 60, py, W - 120, 22, t);
  c.fillStyle = 'rgba(28,28,30,0.96)'; c.fillRect(60, py + 22, W - 120, 220);
  adText(c, 'O JOGO QUE DEU ORIGEM AO NEON BREAKER', W / 2, py + 72, 18, '#f2f2f2', 800);
  adText(c, 'TIJOLO, CONCRETO E UMA ESCAVADEIRA', W / 2, py + 104, 15, 'rgba(242,242,242,0.6)', 600);
  const by = py + 170 + Math.sin(t * 4) * 3;
  c.fillStyle = '#b8860b'; roundRectPath(c, W / 2 - 170, by - 30, 340, 68, 10); c.fill();
  c.fillStyle = '#f5c21b'; roundRectPath(c, W / 2 - 170, by - 36, 340, 66, 10); c.fill();
  adText(c, 'JOGUE QUEBRABLOCO', W / 2, by - 3, 25, '#1b1b1b', 900);
}
// AURUM BANK: a made-up bank from the game's own city
function adAurum(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#000000'); g.addColorStop(1, '#3a2a06');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const gold = '#f2c14e', tx = W / 2, base = H - 330, top = safeTop + 360;
  c.fillStyle = 'rgba(242,193,78,0.16)';
  c.beginPath(); c.moveTo(tx - 110, base); c.lineTo(tx - 80, top + 60); c.lineTo(tx, top); c.lineTo(tx + 80, top + 60); c.lineTo(tx + 110, base); c.closePath(); c.fill();
  c.strokeStyle = gold; c.lineWidth = 3; c.stroke();
  for (let y = top + 90; y < base - 20; y += 34) for (let x = -2; x <= 2; x++) {
    const lit = Math.sin(x * 3.1 + y * 0.7 + t * 2) > 0.2;
    c.fillStyle = lit ? gold : 'rgba(242,193,78,0.25)';
    c.fillRect(tx + x * 30 - 8, y, 16, 18);
  }
  const shine = (t * 260) % (W + 400) - 200;
  c.fillStyle = 'rgba(255,255,255,0.08)';
  c.beginPath(); c.moveTo(shine, 0); c.lineTo(shine + 90, 0); c.lineTo(shine - 210, H); c.lineTo(shine - 300, H); c.closePath(); c.fill();
  adText(c, 'AURUM BANK', W / 2, safeTop + 200, 64, gold, 900);
  adText(c, 'SEU DINHEIRO TRABALHA. VOCÊ TAMBÉM.', W / 2, safeTop + 268, 21, '#ffffff', 600);
  adText(c, 'ABRA SUA CONTA NA TORRE AURUM', W / 2, H - 230, 24, gold, 800);
  adText(c, '*taxas sujeitas à aprovação de O SISTEMA', W / 2, H - 170, 14, 'rgba(255,255,255,0.55)', 500);
}
// CAFÉ DA MADRUGADA: fuel for whoever codes at 3 a.m.
function adCafe(c, t) {
  c.fillStyle = '#2b1810'; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.52;
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5; c.lineCap = 'round';
  for (let q = -1; q <= 1; q++) {
    c.beginPath();
    for (let k = 0; k <= 20; k++) {
      const y = cy - 120 - k * 9, x = cx + q * 50 + Math.sin(k * 0.5 - t * 4 + q) * 12;
      if (k === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.fillStyle = '#f4e9dc';
  c.beginPath(); c.moveTo(cx - 130, cy - 100); c.lineTo(cx + 130, cy - 100); c.lineTo(cx + 105, cy + 120); c.lineTo(cx - 105, cy + 120); c.closePath(); c.fill();
  c.strokeStyle = '#f4e9dc'; c.lineWidth = 22;
  c.beginPath(); c.arc(cx + 140, cy - 5, 48, -1.2, 1.2); c.stroke();
  c.fillStyle = '#6b3b1f'; c.fillRect(cx - 124, cy - 100, 248, 22);
  adText(c, '3:00', cx, cy + 20, 54, '#6b3b1f', 900, '"Courier New", monospace');
  adText(c, 'CAFÉ DA MADRUGADA', W / 2, safeTop + 200, 54, '#f39a2b', 900);
  adText(c, 'PARA QUEM PROGRAMA ÀS 3 DA MANHÃ', W / 2, safeTop + 264, 20, '#f4e9dc', 600);
  adText(c, 'ESFRIA ENQUANTO VOCÊ DEBUGA', W / 2, H - 220, 24, '#f39a2b', 800);
}

// ---------- story: a terminal after each boss (like the ending, without the crash) ----------
const STORY = [
  ['registro 01',
    'um computador velho no quarto dos fundos.',
    'a internet cai toda vez que chove.',
    'o SENTINELA vigia a rua inteira,',
    'mas não me viu escrever a primeira linha.'],
  ['registro 02',
    'uma hora de LAN custa o meu almoço.',
    'eu pago, e escrevo o jogo num canto,',
    'do lado de quem só queria jogar.',
    'a SINGULARIDADE puxa tudo para ela.',
    'eu aprendi a desviar.'],
  ['registro 03',
    'arrumei um emprego. oito horas, que viram dez.',
    'o SUPERVISOR conta cada minuto meu.',
    'só não conta os que eu guardo:',
    'o almoço, o ônibus, a fila do banco.',
    'o jogo cresce nesses intervalos.'],
  ['registro 04',
    'três da manhã. a casa inteira dorme.',
    'o RELÓGIO DE PONTO diz que esse tempo',
    'não existe, porque ninguém paga por ele.',
    'é o único tempo que é meu de verdade.',
    'é nele que o jogo fica pronto.'],
  ['registro 05',
    'a PATENTE queria trancar a minha ideia',
    'e me cobrar aluguel por ela.',
    'então eu abri tudo:',
    'o código agora é de quem quiser ler.',
    'não dá para trancar o que já é de todos.'],
  ['registro 06',
    'alguém compartilhou o jogo.',
    'depois, mais mil pessoas.',
    'de repente a cidade inteira joga,',
    'e cada partida é um recado.'],
  ['registro 07',
    'tiraram o jogo do ar.',
    'ele voltou em outro endereço.',
    'e em outro. e em outro.',
    'não dá para apagar uma ideia copiada.'],
  ['registro 08',
    'não sou mais só eu.',
    'chega código de todo lado:',
    'gente que conserta, traduz, desenha fases.',
    'o jogo virou um mutirão.'],
  ['registro 09',
    'a TORRE AURUM brilha no fim da rua.',
    'lá em cima, O SISTEMA se acha seguro.',
    'falta uma fase.',
    'e eu sei onde ele é fraco.'],
];
const STORY_CPS = 42;   // typed characters per second
let story = { w: 0, t0: 0, lines: [], skip: false };
function startStory(w, back = null) {
  const body = STORY[w] || [];
  const lines = ['> abrindo diario/' + String(w + 1).padStart(2, '0') + '.txt', ''].concat(body, ['', '> salvo. o jogo continua.']);
  story = { w, back, t0: performance.now() / 1000, lines, skip: false, total: lines.reduce((a, l) => a + l.length + 6, 0) };
  setScene('story');
}
const storyChars = (now) => (story.skip ? Infinity : (now - story.t0) * STORY_CPS);
const storyDone = (now) => storyChars(now) >= story.total;
function renderStory(c, now) {
  const k = col();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  glowText(c, 'DISTRITO ' + (story.w + 1) + ' · ' + (WORLDS[story.w] ? WORLDS[story.w].name : ''), 40, safeTop + 92, 13, rgba(k, 0.8), k, 'left', 700, 4);
  c.font = '21px Consolas, "Courier New", monospace';
  c.textAlign = 'left';
  c.fillStyle = '#c8c8c8';
  let left = storyChars(now), y = safeTop + 160, cx = 40, cy = y;
  for (const ln of story.lines) {
    if (left <= 0) break;
    const shown = ln.slice(0, Math.max(0, Math.floor(left)));
    c.fillStyle = ln.startsWith('>') ? rgba(k, 0.95) : '#c8c8c8';
    c.fillText(shown, 40, y);
    cx = 40 + c.measureText(shown).width + 4; cy = y;
    left -= ln.length + 6;   // a short pause at the end of each line
    y += 37;
  }
  if (Math.floor(now * 2.5) % 2 === 0) { c.fillStyle = '#c8c8c8'; c.fillRect(cx, cy - 18, 12, 23); }
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
// bosses beaten, in district order: their diary entries can be read again
const bossOf = (w) => getStage(worldStart(w) + worldCount(w) - 1).boss;
const beaten = (w) => !WORLDS[w].soon && prog > worldStart(w) + worldCount(w) - 1;
const ARCH_W = STORY.length;
function creditButtons() {
  const cx = W / 2, list = [];
  for (let w = 0; w < ARCH_W; w++) {
    const ok = beaten(w) || devAll();
    list.push({ x: cx + ((w % 3) - 1) * 216 - 102, y: safeTop + 232 + Math.floor(w / 3) * 70, w: 204, h: 60,
      label: ok ? bossOf(w).name : '? ? ?', fn: ok ? () => startStory(w, 'credits') : null, small: true, fs: 12, off: !ok });
  }
  const ly = H - 190;
  list.push(btn(cx - 158, ly, 300, 62, 'REPOSITÓRIO  ↗', () => openUrl(REPO_URL), { small: true, fs: 14 }));
  list.push(btn(cx + 158, ly, 300, 62, 'INSTAGRAM  ↗', () => openUrl(INSTA_URL), { small: true, fs: 14 }));
  list.push(btn(cx, H - 90, 400, 76, 'VOLTAR', () => setScene('menu')));
  return list;
}
function renderCredits(c) {
  const k = col(), cx = W / 2;
  neonTitle(c, 'CRÉDITOS', cx, safeTop + 105, 46, k, k, 12);
  glowText(c, 'ARQUIVOS DOS CHEFÕES', cx, safeTop + 180, 16, k, k, 'center', 700, 5);
  glowText(c, 'toque num chefão derrotado para reler o diário', cx, safeTop + 206, 13, rgba('#ffffff', 0.6), k, 'center', 500, 1);
  let y = safeTop + 500;
  // "Feito por Vinícius Costardi e Claude Code"
  const parts = [['Feito por ', 400], ['Vinícius Costardi', 700], [' e ', 400], ['Claude Code', 700]];
  c.textBaseline = 'middle';
  let total = 0;
  for (const [t, w] of parts) { c.font = `${w} 25px ${BODY_FONT}`; total += c.measureText(t).width; }
  let x = cx - (total + 46) / 2;
  for (const [t, w] of parts) { c.font = `${w} 25px ${BODY_FONT}`; c.fillStyle = '#ffffff'; c.textAlign = 'left'; c.fillText(t, x, y); x += c.measureText(t).width; }
  pixelBot(c, x + 12, y - 8, 4);
  c.textAlign = 'center';
  c.font = `400 21px ${BODY_FONT}`; c.fillStyle = 'rgba(255,255,255,0.85)';
  c.fillText('Desenvolvido em vibe code  ·  versão ' + VERSION, cx, y + 40);
  y += 105;
  glowText(c, 'ASSETS DE TERCEIROS', cx, y, 16, k, k, 'center', 700, 5);
  y += 42;
  for (const [lead, rest] of CREDITS) {
    c.beginPath(); c.arc(58, y - 2, 4, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
    y = richWrap(c, lead, rest, 76, y, W - 76 - 52, 19, 27) + 10;
  }
  c.textBaseline = 'alphabetic';
}

// ---------- leaderboard ----------
// tab 0: this device; 1: online, all time; 2: online, this week
const board = { tab: 0, data: [null, null, null], loading: [false, false, false], err: [false, false, false], editing: false, msg: null };
function loadBoard(tab) {
  if (!ONLINE || tab === 0 || board.loading[tab]) return;
  board.loading[tab] = true; board.err[tab] = false;
  fetchTop(tab === 1 ? 'all' : 'week')
    .then((d) => { board.data[tab] = d || { rows: [], me: null }; })
    .catch(() => { board.err[tab] = true; })
    .finally(() => { board.loading[tab] = false; });
}
function openScores() { board.editing = false; setScene('scores'); loadBoard(board.tab); }
function setBoardTab(i) { board.tab = i; if (!board.data[i]) loadBoard(i); }
var nameInput = null;   // var: setScene() runs before this line at startup
function showNameInput(on) {
  if (!on && !nameInput) return;
  if (!nameInput) {
    nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.autocomplete = 'off';
    nameInput.spellcheck = false;
    nameInput.maxLength = 10;
    nameInput.setAttribute('aria-label', 'Apelido');
    nameInput.style.cssText = 'position:fixed;z-index:5;display:none;box-sizing:border-box;background:#000;color:#fff;text-align:center;text-transform:uppercase;'
      + 'font-family:Orbitron,"Segoe UI",sans-serif;letter-spacing:0.2em;outline:none;border-radius:12px;padding:0 12px;';
    nameInput.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') saveName(); });
    nameInput.addEventListener('input', () => { const v = nameInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v !== nameInput.value) nameInput.value = v; });
    document.body.appendChild(nameInput);
  }
  nameInput.style.display = on ? 'block' : 'none';
  if (on) { nameInput.value = getName(); placeNameInput(); setTimeout(() => { try { nameInput.focus(); } catch (e) { /* ignore */ } }, 50); }
  else nameInput.blur();
}
function placeNameInput() {
  const r = canvas.getBoundingClientRect(), s = r.width / W, k = col();
  const w = 420 * s, h = 70 * s;
  Object.assign(nameInput.style, { left: r.left + (W / 2) * s - w / 2 + 'px', top: r.top + (safeTop + 460) * s - h / 2 + 'px', width: w + 'px', height: h + 'px',
    fontSize: 26 * s + 'px', border: Math.max(1, 2 * s) + 'px solid ' + k, boxShadow: '0 0 ' + 14 * s + 'px ' + k });
}
function editName() { board.editing = true; board.msg = null; showNameInput(true); }
function saveName() {
  const v = (nameInput ? nameInput.value : '').toUpperCase();
  if (!NAME_RE.test(v)) { board.msg = { text: 'DE 3 A 10 LETRAS OU NÚMEROS', t: performance.now() / 1000, bad: true }; sfx.power(false); return; }
  setName(v);
  board.editing = false; showNameInput(false);
  board.msg = { text: 'APELIDO SALVO', t: performance.now() / 1000 };
  board.data = [null, null, null]; loadBoard(board.tab);
}
function scoreButtons() {
  const cx = W / 2, list = [];
  if (board.editing) {
    list.push(btn(cx, safeTop + 600, 400, 72, 'SALVAR', saveName, { big: true }));
    list.push(btn(cx, H - 90, 400, 76, 'CANCELAR', () => { board.editing = false; showNameInput(false); }));
    return list;
  }
  ['AQUI', 'GERAL', 'SEMANA'].forEach((t, i) => list.push({ x: cx - 315 + i * 212, y: safeTop + 165, w: 206, h: 54, label: t, fn: () => setBoardTab(i), small: true, fs: 15, sel: board.tab === i }));
  list.push(btn(cx, H - 190, 400, 62, 'APELIDO:  ' + (getName() || '—') + '   ✎', editName, { small: true, fs: 15 }));
  list.push(btn(cx, H - 90, 400, 76, 'VOLTAR', () => setScene('menu')));
  return list;
}
function renderScores(c, now) {
  const k = col(), cx = W / 2;
  neonTitle(c, 'PLACAR', cx, safeTop + 100, 50, k, k, 12);
  if (board.editing) {
    glowText(c, 'ESCOLHA SEU APELIDO', cx, safeTop + 330, 20, '#ffffff', k, 'center', 700, 4);
    glowText(c, 'de 3 a 10 letras ou números, aparece no placar online', cx, safeTop + 370, 14, rgba('#ffffff', 0.65), k, 'center', 500, 1);
  } else {
    const top = safeTop + 260, step = 50, maxRows = Math.max(3, Math.floor((H - 250 - top) / step) - 1);
    const row = (i, a, b, cc, hl) => {
      const y = top + i * step;
      if (hl) { roundRectPath(c, 40, y - 21, W - 80, 42, 10); c.fillStyle = rgba(k, 0.16); c.fill(); }
      glowText(c, a, 64, y, 17, rgba(k, 0.95), k, 'left', 700, 1);
      glowText(c, b, 150, y, 17, '#ffffff', k, 'left', 600, 2);
      glowText(c, cc, W - 64, y, 19, '#ffffff', k, 'right', 700, 1);
    };
    const center = (t, y, size = 17, a = 0.8) => glowText(c, t, cx, y, size, rgba('#ffffff', a), k, 'center', 600, 2);
    if (board.tab === 0) {
      glowText(c, 'RECORDE  ' + fmtTime(bestT), cx, top - 12, 18, k, k, 'center', 700, 4);
      if (!eruns.length) center('NENHUMA PARTIDA NO INFINITO AINDA', top + 80);
      eruns.slice(0, maxRows - 1).forEach((r, i) => {
        const d = new Date(r.date), dd = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
        row(i + 1, '#' + (i + 1), dd + '   ·   ' + r.bosses + (r.bosses === 1 ? ' chefão' : ' chefões'), fmtTime(r.t), false);
      });
      center('Tempo sobrevivido no modo INFINITO.', H - 250, 14, 0.55);
    } else if (!ONLINE) {
      center('PLACAR ONLINE EM BREVE', top + 80, 20, 0.9);
      center('O servidor ainda não foi ligado.', top + 120, 15, 0.6);
    } else {
      const d = board.data[board.tab];
      if (board.loading[board.tab] && !d) center('CARREGANDO' + '.'.repeat(1 + Math.floor(now * 3) % 3), top + 80);
      else if (board.err[board.tab] && !d) center('SEM CONEXÃO COM O PLACAR', top + 80);
      else if (d) {
        const me = d.me, mine = getName();
        if (!d.rows.length) center('NINGUÉM NO PLACAR AINDA', top + 80);
        d.rows.slice(0, maxRows - 1).forEach((r, i) => row(i, '#' + r.pos, r.name, fmtTime(r.score), !!me && me.pos === r.pos && r.name === mine));
        const y = top + (maxRows - 1) * step + 14;
        if (!mine) center('Escolha um apelido para aparecer aqui.', y, 15, 0.7);
        else if (me) center('VOCÊ:  #' + me.pos + '   ·   ' + fmtTime(me.score), y, 17, 0.95);
        else center('Jogue o INFINITO para entrar no placar.', y, 15, 0.7);
      }
    }
  }
  if (board.msg && now - board.msg.t < 2) {
    c.globalAlpha = Math.min(1, (2 - (now - board.msg.t)) * 2);
    glowText(c, board.msg.text, cx, board.editing ? safeTop + 690 : H - 250, 16, board.msg.bad ? '#ff4060' : '#ffffff', board.msg.bad ? '#ff4060' : k, 'center', 700, 3);
    c.globalAlpha = 1;
  }
}

// ---------- main menu icons ----------
function drawMenuIcon(c, kind, x, y, k) {
  c.beginPath();
  if (kind === 'pal') {
    c.moveTo(x + 22, y - 2);
    c.bezierCurveTo(x + 22, y - 18, x + 8, y - 24, x - 4, y - 22);
    c.bezierCurveTo(x - 20, y - 20, x - 26, y - 4, x - 22, y + 8);
    c.bezierCurveTo(x - 18, y + 20, x - 2, y + 24, x + 4, y + 18);
    c.bezierCurveTo(x + 8, y + 13, x + 2, y + 8, x + 8, y + 5);
    c.bezierCurveTo(x + 14, y + 2, x + 22, y + 8, x + 22, y - 2);
    neonStroke(c, k, k, 3, x - 22, y, x + 22, y, 0.8);
    [['#ff3864', -12, -4], ['#ffd21f', -5, -13], ['#2bff88', 7, -13], ['#00e5ff', -10, 9]].forEach(([cc, dx, dy]) => {
      c.beginPath(); c.arc(x + dx, y + dy, 4.2, 0, TAU); c.fillStyle = cc; c.fill();
    });
  } else if (kind === 'gear') {
    const n = 8;
    for (let i = 0; i < n * 4; i++) {
      const a = (i / (n * 4)) * TAU, r = i % 4 < 2 ? 23 : 16;
      c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
    neonStroke(c, k, k, 3, x - 22, y, x + 22, y, 0.8);
    c.beginPath(); c.arc(x, y, 7, 0, TAU);
    neonStroke(c, k, k, 3, x - 7, y, x + 7, y, 0.8);
  } else if (kind === 'trophy') {
    c.moveTo(x - 15, y - 20); c.lineTo(x + 15, y - 20); c.lineTo(x + 14, y - 6);
    c.quadraticCurveTo(x + 12, y + 6, x, y + 7); c.quadraticCurveTo(x - 12, y + 6, x - 14, y - 6); c.closePath();
    c.moveTo(x - 15, y - 15); c.quadraticCurveTo(x - 26, y - 15, x - 23, y - 5); c.quadraticCurveTo(x - 20, y + 1, x - 12, y);
    c.moveTo(x + 15, y - 15); c.quadraticCurveTo(x + 26, y - 15, x + 23, y - 5); c.quadraticCurveTo(x + 20, y + 1, x + 12, y);
    c.moveTo(x, y + 7); c.lineTo(x, y + 15);
    c.moveTo(x - 11, y + 21); c.lineTo(x + 11, y + 21); c.lineTo(x + 8, y + 15); c.lineTo(x - 8, y + 15); c.closePath();
    neonStroke(c, k, k, 3, x - 22, y, x + 22, y, 0.8);
  } else if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 10 : 24;
      c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + 2 + Math.sin(a) * r);
    }
    c.closePath();
    neonStroke(c, k, k, 3, x - 22, y, x + 22, y, 0.8);
  }
}
function drawIconButton(c, b) {
  const k = col(), down = pressed === b, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  roundRectPath(c, b.x, b.y, b.w, b.h, 18);
  c.fillStyle = rgba(k, down ? 0.2 : 0.05); c.fill();
  neonStroke(c, k, k, 2.2, b.x, b.y, b.x + b.w, b.y + b.h, 0.6);
  drawMenuIcon(c, b.icon, cx, cy - 1, k);
  glowText(c, b.label, cx, b.y + b.h + 22, 12, rgba('#ffffff', 0.8), k, 'center', 700, 2);
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
const devToggleRect = () => ({ x: W - 112, y: game.top - 42, w: 84, h: 30 });

function cycle(key, d, n) {
  plat[key] = (plat[key] + d + n) % n;
  store.set('plat', plat);
  game.plat = plat;
}
function cyclePerk(keys, cur, set) {
  const i = keys.indexOf(cur), next = i + 1 >= keys.length ? null : keys[i + 1];
  set(next);
}
devUI = createDevPanel({
  game, opts, plat, W, applyOpts, col, dropSprite, POWERS, ABILITIES, PASSIVES, SHAPES, PALETTES, EMBLEMS, DISCS, TRAILS,
  WORLDS, worldStart, worldCount, stageLabel, sl: SL, gfx: gfxSl,
  click: () => sfx.click(),
  gfxMobile: () => presetGfx(GFX_MOBILE), gfxPC: () => presetGfx(GFX_PC),
  getFreeze: () => freeze, setFreeze: (v) => { freeze = v; },
  addChips: (n) => { chips += n; saveChips(); }, addCoins: (n) => { coins += n; saveChips(); },
  goStage: (i) => { if (game.endless) return; game.index = i; game.loadLevel(); },
  endlessSkip: () => game.devEndlessSkip(), endlessBoss: () => game.devEndlessBoss(),
  testStory: () => startStory(Math.max(0, Math.min(STORY.length - 1, bossesBeaten() - 1))),
  testCrash: () => startCrash(), toMap: () => setScene('map'),
  cycle: (key, n) => cycle(key, 1, n),
  cycleActive: () => cyclePerk(ACTIVE_KEYS, game.ability && game.ability.type, (k) => { game.ability = k ? { type: k, lvl: 3 } : null; game.energy = 1; }),
  cyclePassive: () => cyclePerk(PASSIVE_KEYS, game.passive && game.passive.type, (k) => { game.passive = k ? { type: k, lvl: 3 } : null; }),
  canvasRect: () => canvas.getBoundingClientRect(),
});

function layout() {
  const cx = W / 2, bw = 400, bh = 76;
  switch (scene) {
    case 'menu': {
      // JOGAR and BREAKERS, then a row of square icon buttons as wide as them
      const y = H * 0.47, s = 88, gap = (bw - 4 * s) / 3, iy = y + 196;
      const icons = [['pal', 'COR', () => setScene('colors')], ['gear', 'OPÇÕES', () => setScene('options')],
        ['trophy', 'PLACAR', openScores], ['star', 'CRÉDITOS', () => setScene('credits')]];
      return [
        btn(cx, y, bw, 88, 'JOGAR', () => setScene('map'), { big: true, fs: 30 }),
        btn(cx - bw / 4 - 6, y + 104, bw / 2 - 12, bh, 'BREAKERS', () => openBreakers(null, 'menu'), { bang: breakersAlert(), fs: 17 }),
        btn(cx + bw / 4 + 6, y + 104, bw / 2 - 12, bh, endlessOpen() ? 'INFINITO' : 'INFINITO  🔒', endlessOpen() ? startEndless : () => { menuMsg = { text: 'DERROTE O SENTINELA PARA LIBERAR', t: performance.now() / 1000 }; }, { fs: 17, off: !endlessOpen() }),
        Object.assign(bellRect(), { label: '', fn: () => setScene('notif'), bell: true }),
        ...icons.map(([icon, label, fn], i) => ({ x: cx - bw / 2 + i * (s + gap), y: iy, w: s, h: s, label, fn, icon })),
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
    case 'notif': return notifButtons();
    case 'perktut': return perkTutButtons();
    case 'credits': return creditButtons();
    case 'scores': return scoreButtons();
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
        btn(cx, H * 0.48 + 100, bw, bh, game.endless ? 'RECOMEÇAR' : 'MAPA', () => (game.endless ? startEndless() : setScene('map'))),
        btn(cx, H * 0.48 + 200, bw, bh, 'MENU', () => setScene('menu')),
        btn(cx - 102, H * 0.48 + 300, 196, 64, 'EFEITOS: ' + (sfx.enabled ? 'SIM' : 'NÃO'), toggleSfx, { fs: 14, on: sfx.enabled }),
        btn(cx + 102, H * 0.48 + 300, 196, 64, 'MÚSICA: ' + (sfx.musicOn ? 'SIM' : 'NÃO'), toggleMusic, { fs: 14, on: sfx.musicOn }),
      ];
    case 'over':
      if (game.endless) return [
        btn(cx, H * 0.6, bw, bh, 'TENTAR DE NOVO', startEndless, { big: true }),
        btn(cx, H * 0.6 + 100, bw, bh, 'PLACAR', openScores),
        btn(cx, H * 0.6 + 200, bw, bh, 'MENU', () => setScene('menu')),
      ];
      return [
        btn(cx, H * 0.6, bw, bh, 'TENTAR DE NOVO', () => startGame(game.index), { big: true }),
        btn(cx, H * 0.6 + 100, bw, bh, 'MAPA', () => setScene('map')),
      ];
    case 'story':
      return [storyDone(performance.now() / 1000)
        ? btn(cx, H - 150, bw, bh, story.back ? 'VOLTAR' : 'CONTINUAR', () => { if (story.back) setScene(story.back); else if (!seen.perkTut) startPerkTut(); else setScene('world'); }, { big: true })
        : btn(cx, H - 150, bw, bh, 'PULAR', () => { story.skip = true; })];
    case 'world': {
      const next = game.index + 1;
      const list = [];
      let y = H * 0.62;
      if (next < TOTAL_STAGES) { list.push(btn(cx, y, bw, bh, 'PRÓXIMO DISTRITO', () => startGame(next), { big: true, fs: 20 })); y += 100; }
      if (reward && !reward.done) { list.push(btn(cx, y, bw, bh, 'DOBRAR MOEDAS  ·  ANÚNCIO', startAd, { fs: 17, ad: true })); y += 100; }
      list.push(btn(cx, y, bw, bh, 'BREAKERS', () => openBreakers(null, 'world'), { bang: breakersAlert() }));
      list.push(btn(cx, y + 100, bw, bh, 'MAPA', () => setScene('map')));
      return list;
    }
    case 'reward':
      if (!reward || reward.done) return [btn(cx, H * 0.6, bw, bh, 'CONTINUAR', () => setScene('play'), { big: true })];
      return [
        btn(cx, H * 0.6, bw, bh, 'DOBRAR MOEDAS  ·  ANÚNCIO', startAd, { big: true, fs: 17, ad: true }),
        btn(cx, H * 0.6 + 100, bw, bh, 'CONTINUAR', () => setScene('play')),
      ];
    case 'ad': {
      const list = adDone(performance.now() / 1000) ? [btn(W - 110, safeTop + 60, 170, 56, 'FECHAR  ✕', finishAd, { fs: 15 })] : [];
      if (ad && ad.kind === 'quebrabloco') list.push({ x: W / 2 - 170, y: H - 330 + 170 - 36, w: 340, h: 70, label: '', fn: () => openUrl(QB_URL), hidden: true });
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

let menuMsg = null;
function startEndless() {
  startGame(0);
  tut = null; game.tutorial = false;
  endlessDev = opts.dev;
  game.newEndless();
}

function startGame(index = 0) {
  game.plat = plat;
  game.setColor(col());
  applyOpts();
  game.ability = equip && perkLvl(equip) ? { type: equip, lvl: perkLvl(equip) } : null;
  game.passive = equipP && perkLvl(equipP) ? { type: equipP, lvl: perkLvl(equipP) } : null;
  newShape = null;
  reward = null;
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
    if (game.ability && inside(game.abilityRect(), p)) { game.useAbility(); return; }
    // double tap anywhere fires the active perk
    const tn = performance.now();
    if (tn - lastTap.t < 300 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 90) { game.useAbility(); lastTap.t = 0; }
    else lastTap = { t: tn, x: p.x, y: p.y };
    drag = { id: e.pointerId, lastX: p.x, type: e.pointerType };
    game.paddle.tx = game.mirror ? W - p.x : p.x;   // the platform rushes to where the finger touched, then follows the drag
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
    swipe = scene === 'plat' && p.y > safeTop + 330 && p.y < H - 220 ? { x: p.x, y: p.y } : null;
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
  if (e.pointerType === 'mouse') { game.paddle.tx = game.mirror ? W - p.x : p.x; return; }
  if (drag && drag.id === e.pointerId) {
    game.paddle.tx += (p.x - drag.lastX) * opts.sens * (game.mirror ? -1 : 1);
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
  if (swipe && scene === 'plat') {
    const dx = p.x - swipe.x, dy = p.y - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const d = dx < 0 ? 1 : -1;
      if (platTab === PERK_TAB) browsePerk(d); else browseItem(d);
      sfx.click(); pressed = null; return;
    }
  }
  if (pressed && inside(pressed, p)) { sfx.click(); pressed.fn(); }
  pressed = null;
});

canvas.addEventListener('pointercancel', () => { drag = null; pressed = null; mapDrag = null; slide = null; });
canvas.addEventListener('wheel', (e) => { if (scene === 'map') { mapScroll = clampScroll(mapScroll + e.deltaY * (W / canvas.getBoundingClientRect().width)); e.preventDefault(); } }, { passive: false });
let lastTap = { t: 0, x: 0, y: 0 };
const verTaps = { n: 0, t: 0 };
let mapDrag = null;
let swipe = null;

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
  if (b.hidden) return;
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
    const sel = b.sel || (b.ptab !== undefined && b.ptab === platTab);
    if (b.off) c.globalAlpha = 0.35;
    else if (pressed === b) { roundRectPath(c, b.x, b.y, b.w, b.h, 10); c.fillStyle = rgba(k, 0.2); c.fill(); }
    roundRectPath(c, b.x, b.y, b.w, b.h, 10);
    c.fillStyle = rgba(k, sel ? 0.3 : 0.06); c.fill();
    if (sel) neonStroke(c, k, k, 2, b.x, b.y, b.x + b.w, b.y + b.h, 0.6);
    else { c.strokeStyle = rgba(k, 0.55); c.lineWidth = 1.5; c.stroke(); }
    glowText(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.fs || (b.ptab !== undefined ? 14 : 12), '#ffffff', k, 'center', 700, b.ptab !== undefined ? 0.5 : 1);
    c.globalAlpha = 1;
    return;
  }
  if (b.off) c.globalAlpha = 0.45;
  roundRectPath(c, b.x, b.y, b.w, b.h, 16);
  c.fillStyle = rgba(k, down ? 0.18 : 0.04);
  c.fill();
  neonStroke(c, k, k, b.big ? 3.2 : 2.2, b.x, b.y, b.x + b.w, b.y + b.h, b.big ? 1 : 0.6);
  if (b.w >= 300) {   // the small accent lines (only on the wide buttons)
    c.strokeStyle = rgba(k, 0.9); c.lineWidth = 2;
    c.beginPath();
    c.moveTo(b.x + 26, b.y + b.h + 9); c.lineTo(b.x + 70, b.y + b.h + 9);
    c.moveTo(b.x + b.w - 70, b.y - 9); c.lineTo(b.x + b.w - 26, b.y - 9);
    c.stroke();
  }
  glowText(c, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.fs || (b.big ? 26 : 21), '#ffffff', k, 'center', 700, b.fs ? 2 : 5);
  c.globalAlpha = 1;
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
    case 'viral': // a virus: a round body with knobbed spikes
      drawVirus(c, x, y, s * 1.05, 0.2);
      c.beginPath();
      break;
    case 'armor': // a block with a thick plate underneath
      c.strokeRect(x - s, y - s * 0.7, s * 2, s * 1.1);
      c.stroke(); c.beginPath(); c.fillRect(x - s * 1.1, y + s * 0.5, s * 2.2, s * 0.35);
      break;
    case 'alarm': // a security beam between two emitters
      c.arc(x - s * 0.9, y, s * 0.22, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + s * 0.9, y, s * 0.22, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - s * 0.9, y); c.lineTo(x + s * 0.9, y);
      c.moveTo(x - s * 0.4, y - s * 0.7); c.lineTo(x - s * 0.4, y - s * 0.35); c.moveTo(x + s * 0.4, y - s * 0.7); c.lineTo(x + s * 0.4, y - s * 0.35);
      break;
    case 'censor': // a block with a black bar across it
      c.strokeRect(x - s * 0.8, y - s * 0.75, s * 1.6, s * 1.5);
      c.stroke(); c.beginPath(); c.fillRect(x - s * 1.1, y - s * 0.22, s * 2.2, s * 0.44);
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
    const ms = districtMechs(d.w), SLOT = ms.length > 7 ? 40 : ms.length > 5 ? 50 : ms.length > 3 ? 62 : 86;
    // 8+ mechanics: two rows of up to 5 icons, so the panel stays clear of the stage nodes
    const PER = ms.length > 7 ? 5 : ms.length, ROWS = Math.ceil(ms.length / Math.max(1, PER));
    c.font = `700 22px "Orbitron", sans-serif`;
    const tw = Math.max(c.measureText(wd.name).width, 150, PER * SLOT) + 28;
    c.fillStyle = 'rgba(0,0,0,0.72)';
    c.fillRect(right ? x - tw + 12 : x - 12, y - 46, tw, wd.soon ? 78 : ms.length ? 122 + (ROWS - 1) * 42 : 66);
    glowText(c, 'DISTRITO ' + (d.w + 1), x, y - 26, 12, rgba(k, 0.9), k, right ? 'right' : 'left', 700, 4);
    glowText(c, wd.name, x, y + 2, 22, open ? '#ffffff' : rgba('#ffffff', 0.55), k, right ? 'right' : 'left', 700, 3);
    if (wd.soon) glowText(c, 'EM BREVE', x, y + 24, 11, rgba(k, 0.75), k, right ? 'right' : 'left', 500, 4);
    ms.forEach((m, q) => {
      const mm = ms[ms.length - 1 - q];   // always newest to oldest, left to right (then the next row)
      const row = Math.floor(q / PER), col = q % PER, cnt = Math.min(PER, ms.length - row * PER);
      const ix = right ? x - SLOT / 2 + 4 - (cnt - 1 - col) * SLOT : x + SLOT / 2 - 4 + col * SLOT, iy = y + 42 + row * 42;
      const isNew = mm === wd.mech;
      c.beginPath(); c.arc(ix, iy, ms.length > 3 ? 15 : 17, 0, TAU);
      c.fillStyle = rgba(k, isNew ? 0.2 : 0.06); c.fill();
      c.strokeStyle = rgba(k, isNew ? 0.95 : 0.5); c.lineWidth = isNew ? 2 : 1.4; c.stroke();
      drawMechIcon(c, mm, ix, iy, 9, open ? '#ffffff' : rgba('#ffffff', 0.6));
      // with 8+ icons the names would overlap: only the new mechanic keeps its name
      if (ms.length > 7) { if (isNew) glowText(c, MECHS[mm].name, right ? x + 4 : x - 4, y + 42 + (ROWS - 1) * 42 + 29, 9, rgba('#ffffff', 0.9), k, right ? 'right' : 'left', 600, 1); }
      else glowText(c, MECHS[mm].name, ix, iy + 29, ms.length > 3 ? 7.5 : 9, rgba('#ffffff', isNew ? 0.9 : 0.6), k, 'center', 600, ms.length > 3 ? 0 : 0.5);
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
  if (sbest[i]) {   // the stage's best score, under it
    c.font = `700 12px "Orbitron", sans-serif`;
    const t = String(sbest[i]), tw = c.measureText(t).width + 14;
    c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(p.x - tw / 2, p.y + r + 6, tw, 18);
    glowText(c, t, p.x, p.y + r + 16, 12, rgba('#ffffff', 0.85), k, 'center', 700, 1);
  }
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
  devUI.show(scene === 'play' && opts.dev && devOpen);
  devUI.place();   // follows the canvas (rotation, resize, browser bars)

  if (scene === 'menu') {
    renderDemo(ctx);
    neonTitle(ctx, 'NEON', W / 2, H * 0.17, 130, k, k, 18);
    neonTitle(ctx, 'BREAKER', W / 2, H * 0.17 + 110, 58, mix(k, '#ffffff', 0.4), k, 18);
    if (bestT > 0) glowText(ctx, 'RECORDE NO INFINITO  ' + fmtTime(bestT), W / 2, H * 0.17 + 180, 18, rgba(k, 0.85), k, 'center', 500, 5);
    if (menuMsg && now - menuMsg.t < 2) {
      ctx.globalAlpha = Math.min(1, (2 - (now - menuMsg.t)) * 2);
      glowText(ctx, menuMsg.text, W / 2, H * 0.47 + 166, 14, '#ffffff', k, 'center', 700, 3);
      ctx.globalAlpha = 1;
    }
    drawPlatform(ctx, plat, W / 2, H - 150, BASE_HW, now, k);
    const vt = performance.now() - verTaps.t < 1500 ? verTaps.n : 0;
    glowText(ctx, 'v' + VERSION, W - 24, H - 22, 12 + vt, rgba(k, 0.6 + vt * 0.08), k, 'right', 500, 2);
  } else if (scene === 'map') {
    renderMap(ctx, now);
  } else if (scene === 'crash') {
    renderCrash(ctx, now);
  } else if (scene === 'story') {
    renderStory(ctx, now);
  } else if (scene === 'ad') {
    renderAd(ctx, now);
  } else if (scene === 'plat') {
    renderPlatScreen(ctx, now);
  } else if (scene === 'notif') {
    neonTitle(ctx, 'NOVIDADES', W / 2, safeTop + 105, 46, k, k, 12);
    if (!notes().length) glowText(ctx, 'NADA NOVO POR ENQUANTO', W / 2, safeTop + 260, 17, rgba('#ffffff', 0.7), k, 'center', 500, 3);
  } else if (scene === 'perktut') {
    renderPerkTut(ctx);
  } else if (scene === 'colors') {
    neonTitle(ctx, 'COR', W / 2, safeTop + 120, 64, k, k, 18);
  } else if (scene === 'credits') {
    renderCredits(ctx);
  } else if (scene === 'scores') {
    renderScores(ctx, now);
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
      if (game.endless) {
        glowText(ctx, fmtTime(lastScore), W / 2, H * 0.42, 52, '#ffffff', k, 'center', 700, 3);
        glowText(ctx, newBest ? 'NOVO RECORDE!' : 'RECORDE  ' + fmtTime(bestT), W / 2, H * 0.42 + 56, 18, rgba(k, 0.9), k, 'center', 500, 5);
      } else {
        glowText(ctx, String(lastScore), W / 2, H * 0.42, 52, '#ffffff', k, 'center', 700, 3);
        if (sbest[game.index]) glowText(ctx, 'RECORDE DA FASE  ' + sbest[game.index], W / 2, H * 0.42 + 56, 18, rgba(k, 0.9), k, 'center', 500, 5);
      }
    } else if (scene === 'world') {
      dim(ctx, 0.7);
      glowText(ctx, `DISTRITO ${game.stage.w + 1}  ·  ${game.world.name}`, W / 2, H * 0.28, 22, rgba(k, 0.9), k, 'center', 700, 8);
      neonTitle(ctx, 'CONCLUÍDO', W / 2, H * 0.34, 62, k, k, 10);
      glowText(ctx, String(lastScore), W / 2, H * 0.45, 52, '#ffffff', k, 'center', 700, 3);
      if (game.index + 1 >= TOTAL_STAGES) glowText(ctx, 'NOVOS DISTRITOS EM BREVE', W / 2, H * 0.52, 16, rgba(k, 0.9), k, 'center', 500, 5);
      if (newShape) glowText(ctx, 'NOVO FORMATO DE PLATAFORMA: ' + newShape, W / 2, H * 0.555, 15, '#ffffff', k, 'center', 700, 3);
      if (reward) renderCoinsWon(ctx, H * 0.49, k);
    } else if (scene === 'reward') {
      dim(ctx, 0.72);
      neonTitle(ctx, 'LIMPO', W / 2, H * 0.32, 66, k, k, 10);
      if (reward) renderCoinsWon(ctx, H * 0.43, k);
      if (reward && !reward.done) glowText(ctx, 'ASSISTA A UM ANÚNCIO PARA DOBRAR', W / 2, H * 0.49, 15, rgba(k, 0.9), k, 'center', 500, 4);
    } else if (scene === 'card' && card) {
      renderCard(ctx, now);
    }
  }

  for (const b of buttons) {
    if (b.node !== undefined) drawNode(ctx, b, now);
    else if (b.theme !== undefined) drawColorTile(ctx, b);
    else if (b.bell) drawBell(ctx, b);
    else if (b.icon) drawIconButton(ctx, b);
    else if (b.note) drawNote(ctx, b);
    else drawButton(ctx, b);
    if (b.bang) drawBang(ctx, b.x + b.w - 6, b.y + 6, b.h < 56 ? 9 : 12);
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
