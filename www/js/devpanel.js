// ---------- in-game dev panel ----------
// A small HTML panel over the canvas: a row of tabs with icons on top (one
// section at a time), sliders with their value in big and buttons with icons.
// It is dragged by its top bar, folds into a small button and remembers both.
// main.js passes in everything it needs through `api`.

const CSS = `
#nbdev { position: fixed; z-index: 6; box-sizing: border-box; display: none; flex-direction: column;
  background: rgba(8,8,12,0.8); border: 1px solid var(--k35); border-radius: 12px; color: #fff;
  font: 600 13px "Segoe UI", Roboto, Arial, sans-serif; box-shadow: 0 0 18px var(--k25); overflow: hidden;
  touch-action: pan-y; -webkit-user-select: none; user-select: none; }
#nbdev * { box-sizing: border-box; }
#nbdev .hd { display: flex; align-items: center; gap: 3px; padding: 4px; cursor: grab; touch-action: none;
  border-bottom: 1px solid var(--k25); }
#nbdev .hd button { flex: 1 1 0; height: 30px; padding: 0; font-size: 15px; text-align: center; }
#nbdev .hd .grip { flex: 0 0 auto; width: 18px; text-align: center; color: var(--k); font-size: 13px; letter-spacing: -2px; }
#nbdev .bd { overflow-y: auto; padding: 7px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain; }
#nbdev.fold { width: auto !important; }
#nbdev.fold .bd, #nbdev.fold .hd .tab { display: none; }
#nbdev.fold .hd { border-bottom: 0; }
#nbdev.fold .hd button { flex: 0 0 auto; width: 40px; }
#nbdev .ttl { font-weight: 800; font-size: 12px; letter-spacing: 0.12em; color: var(--k); text-transform: uppercase; }
#nbdev .lb { display: flex; justify-content: space-between; align-items: baseline; font-size: 11px;
  letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.6); font-weight: 700; margin-top: 2px; }
#nbdev .lb output { color: var(--k); font: 700 18px Orbitron, "Segoe UI", sans-serif; letter-spacing: 0; text-shadow: 0 0 8px var(--k60); }
#nbdev input[type=range] { width: 100%; accent-color: var(--k); margin: 0; height: 22px; }
#nbdev .sc { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.45); margin-top: -4px; }
#nbdev .row { display: flex; flex-wrap: wrap; gap: 5px; }
#nbdev .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
#nbdev button { background: var(--k10); color: #fff; border: 1px solid var(--k45); border-radius: 7px; padding: 6px 8px;
  font: 700 12px "Segoe UI", Roboto, Arial, sans-serif; cursor: pointer; text-align: left; line-height: 1.15; }
#nbdev button:active { background: var(--k35); }
#nbdev button.on { background: var(--k35); border-color: var(--k); box-shadow: 0 0 8px var(--k45); }
#nbdev .row button { flex: 1 1 auto; text-align: center; }
#nbdev .num button { flex: 0 0 auto; min-width: 34px; text-align: center; padding: 6px 4px; }
#nbdev .cap { display: flex; align-items: center; gap: 6px; padding: 4px 6px; }
#nbdev .cap img { width: 34px; height: auto; flex: 0 0 auto; }
#nbdev .ck { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
#nbdev .ck input { width: 16px; height: 16px; accent-color: var(--k); margin: 0; }
#nbdev .note { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500; }
`;

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const hexA = (hex, a) => {
  const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export function createDevPanel(api) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'nbdev';
  document.body.appendChild(el);

  const TABS = [['jogo', '🎮', 'Jogo'], ['graf', '🖥️', 'Gráficos'], ['mundo', '🗺️', 'Capítulo e fase'], ['breaker', '🛸', 'Breaker'], ['caps', '💊', 'Cápsulas']];
  // position (fractions of the canvas), folded and tab are kept between sessions
  const saved = (() => { try { return JSON.parse(localStorage.getItem('nb_devui')) || {}; } catch (e) { return {}; } })();
  let tab = TABS.some((t) => t[0] === saved.tab) ? saved.tab : 'jogo', pos = saved.pos || null;
  let folded = !!saved.fold, shown = false, direct = false, lastCol = '', dragging = null;
  const save = () => { try { localStorage.setItem('nb_devui', JSON.stringify({ tab, pos, fold: folded })); } catch (e) { /* ignore */ } };
  let acts = {}, sliders = {};
  const imgCache = {};

  const capImg = (type) => {
    const k = api.col() + type;
    if (!imgCache[k]) { try { imgCache[k] = api.dropSprite(type, api.col()).img.toDataURL(); } catch (e) { imgCache[k] = ''; } }
    return imgCache[k];
  };

  let nid = 0;
  const b = (label, fn, cls = '') => { const id = 'a' + nid++; acts[id] = fn; return `<button data-a="${id}" class="${cls}">${label}</button>`; };
  const check = (label, get, set) => {
    const id = 'a' + nid++; acts[id] = () => set(!get());
    return `<label class="ck"><input type="checkbox" data-a="${id}" ${get() ? 'checked' : ''}> ${label}</label>`;
  };
  const slider = (label, s, ticks) => {
    const id = 's' + nid++; sliders[id] = s;
    return `<div class="lb"><span>${label}</span><output id="o${id}">${esc(s.fmt(s.get()))}</output></div>`
      + `<input type="range" data-s="${id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.get()}">`
      + (ticks ? `<div class="sc">${ticks.map((t) => `<span>${t}</span>`).join('')}</div>` : '');
  };

  function build() {
    const g = api.game, o = api.opts;
    const scroll = el.querySelector('.bd') ? el.querySelector('.bd').scrollTop : 0;
    acts = {}; sliders = {}; nid = 0;
    const st = g.stage, w = st ? st.w : 0;

    const jogo = [
      slider('Velocidade do disco', api.sl.speed, ['30%', '250%']),
      slider('Sensibilidade', api.sl.sens, ['0,5×', '2,5×']),
      slider('Cápsulas caindo', api.sl.drop, ['13%', '100%']),
      check('♾️ Vidas infinitas', () => o.inf, (v) => { o.inf = v; api.applyOpts(); }),
      check('🧊 Congelar o jogo', api.getFreeze, api.setFreeze),
      check('📊 Mostrar FPS', () => o.fps, (v) => { o.fps = v; api.applyOpts(); }),
      `<div class="grid">${[
        b('❤️ +1 vida', () => { g.lives = Math.min(6, g.lives + 1); }),
        b('⚡ Energia cheia', () => { g.energy = 1; }),
        b('💾 +500 chips', () => api.addChips(500)),
        b('🪙 +100 moedas', () => api.addCoins(100)),
      ].join('')}</div>`,
    ].join('');

    const graf = [
      slider('Brilho do neon', api.gfx('glow', 0, 1.5)),
      slider('Resolução', api.gfx('res', 0.4, 1)),
      slider('Partículas', api.gfx('fx', 0, 1.5)),
      slider('Rastro do disco', api.gfx('trail', 0, 1)),
      slider('Textura do campo', api.gfx('grid', 0, 2)),
      `<div class="row">${b('📱 Padrão celular', api.gfxMobile)}${b('💻 Padrão PC', api.gfxPC)}</div>`,
    ].join('');

    const worlds = api.WORLDS.map((wd, i) => (wd.soon ? '' : b(String(i + 1), () => api.goStage(api.worldStart(i)), i === w ? 'on' : ''))).join('');
    const n = api.worldCount(w), s0 = api.worldStart(w);
    const stages = Array.from({ length: n }, (_, i) => b(i === n - 1 ? '👑' : String(i + 1), () => api.goStage(s0 + i), s0 + i === g.index ? 'on' : '')).join('');
    const mundo = g.endless ? [
      `<div class="lb"><span>Infinito · ${esc(g.endless.mechs.length ? g.endless.mechs.length + ' mecânicas' : 'sem mecânicas')}</span></div>`,
      `<div class="grid">${[
        b('⏩ Próxima mecânica', api.endlessSkip),
        b('👑 Chefão agora', api.endlessBoss),
        b(g.boss ? '☠️ Matar chefão' : '🧹 Limpar blocos', () => g.devClear()),
        b('😡 Modo fúria', () => g.devFury()),
      ].join('')}</div>`,
    ].join('') : [
      `<div class="lb"><span>Capítulo</span><output>${w + 1}</output></div><div class="row num">${worlds}</div>`,
      `<div class="lb"><span>Fase · ${esc(st ? api.stageLabel(g.index) : '')}</span></div><div class="row num">${stages}</div>`,
      `<div class="grid">${[
        b('⏭️ Pular fase', () => g.devSkip()),
        b('🔁 Reiniciar fase', () => g.devRestart()),
        b(g.boss ? '☠️ Matar chefão' : '🧹 Limpar blocos', () => g.devClear()),
        b('👑 Ir p/ chefão', () => g.devBoss()),
        b('💥 Chefão −3', () => g.devBossHit(3)),
        b('😡 Modo fúria', () => g.devFury()),
        b('📜 Testar diário', api.testStory),
        b('🏁 Testar final', api.testCrash),
        b('🗺️ Ir ao mapa', api.toMap),
      ].join('')}</div>`,
    ].join('');

    const P = api.plat;
    const perkName = (x, names, none) => (x ? names[x.type].name : none);
    const breaker = `<div class="grid">${[
      b('🔷 ' + esc(api.SHAPES[P.shape].name) + ' ›', () => api.cycle('shape', api.SHAPES.length)),
      b('🎨 ' + esc(api.PALETTES[P.pal].name) + ' ›', () => api.cycle('pal', api.PALETTES.length)),
      b('🔰 ' + esc(api.EMBLEMS[P.emb]) + ' ›', () => api.cycle('emb', api.EMBLEMS.length)),
      b('💿 ' + esc(api.DISCS[P.disc].name) + ' ›', () => api.cycle('disc', api.DISCS.length)),
      b('✨ ' + esc(api.TRAILS[P.trail].name) + ' ›', () => api.cycle('trail', api.TRAILS.length)),
      b('⚔️ ' + esc(perkName(g.ability, api.ABILITIES, 'Sem ativo')) + ' ›', api.cycleActive),
      b('🛡️ ' + esc(perkName(g.passive, api.PASSIVES, 'Sem passivo')) + ' ›', api.cyclePassive),
    ].join('')}</div>`;

    const capBtn = (k, n = 1) => b(`<img src="${capImg(k)}" alt="">${esc(api.POWERS[k].label)}${n > 1 ? ' ×2' : ''}`,
      () => (direct ? g.applyPower(k, n) : g.devDrop(k, n)), 'cap');
    const keys = Object.keys(api.POWERS);
    const caps = [
      check('⚡ Aplicar na hora (sem cair)', () => direct, (v) => { direct = v; }),
      `<div class="note">Toque numa cápsula para ela cair em cima da plataforma.</div>`,
      `<div class="grid">${[
        b('💿 +1 disco', () => g.devAddBall()),
        b('🚀 Lançar', () => g.launch()),
        b('↩️ Resetar disco', () => g.resetBall()),
        b('✖ Tirar efeitos', () => { g.effects = {}; }),
      ].join('')}</div>`,
      `<div class="lb"><span>Power-ups</span></div><div class="grid">${keys.filter((k) => api.POWERS[k].good).map((k) => capBtn(k)).join('')}${capBtn('wide', 2)}</div>`,
      `<div class="lb"><span>Debuffs</span></div><div class="grid">${keys.filter((k) => !api.POWERS[k].good).map((k) => capBtn(k)).join('')}${capBtn('shrink', 2)}</div>`,
    ].join('');

    const body = { jogo, graf, mundo, breaker, caps }[tab];
    el.innerHTML = `<div class="hd"><span class="grip" aria-hidden="true">⋮⋮</span>`
      + TABS.map(([k, ic, name]) => `<button class="tab ${k === tab ? 'on' : ''}" data-tab="${k}" aria-label="${name}">${ic}</button>`).join('')
      + `<button data-fold aria-label="${folded ? 'Abrir' : 'Recolher'}">${folded ? '🛠️' : '–'}</button></div>`
      + `<div class="bd"><div class="ttl">${TABS.find((t) => t[0] === tab)[2]}</div>${body}</div>`;
    el.classList.toggle('fold', folded);
    el.querySelector('.bd').scrollTop = scroll;
  }

  el.addEventListener('click', (e) => {
    if (dragging && dragging.moved) return;   // the end of a drag is not a tap
    if (e.target.closest('[data-fold]')) { folded = !folded; save(); build(); place(); return; }
    const tb = e.target.closest('[data-tab]');
    if (tb) { tab = tb.dataset.tab; save(); api.click(); build(); return; }
    const t = e.target.closest('[data-a]');
    if (!t || !acts[t.dataset.a]) return;
    api.click();
    acts[t.dataset.a]();
    setTimeout(build, 0);   // labels (names, current stage) may have changed
  });
  // drag by the top bar
  el.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.hd')) return;
    const r = el.getBoundingClientRect();
    dragging = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, moved: false };
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging || dragging.id !== e.pointerId) return;
    if (!dragging.moved && Math.hypot(e.clientX - dragging.x0, e.clientY - dragging.y0) < 8) return;
    if (!dragging.moved) { dragging.moved = true; try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    const c = api.canvasRect();
    pos = { x: (e.clientX - dragging.dx - c.left) / c.width, y: (e.clientY - dragging.dy - c.top) / c.height };
    place();
  });
  const endDrag = (e) => {
    if (!dragging || dragging.id !== e.pointerId) return;
    const moved = dragging.moved;
    if (moved) { save(); setTimeout(() => { dragging = null; }, 0); } else dragging = null;
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('input', (e) => {
    const s = sliders[e.target.dataset.s];
    if (!s) return;
    s.set(+e.target.value);
    if (s.after) s.after(); else api.applyOpts();
    const out = el.querySelector('#o' + e.target.dataset.s);
    if (out) out.textContent = s.fmt(s.get());
  });
  // keep game keys (arrows, space) from reaching the page while using the panel
  el.addEventListener('keydown', (e) => e.stopPropagation());
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) el.addEventListener(ev, (e) => e.stopPropagation());

  // about a third of the screen, top right by default; kept inside the canvas
  function place() {
    const r = api.canvasRect(), s = r.width / api.W;
    const w = Math.min(268, r.width - 16), h = Math.max(170, r.height * 0.36);
    el.style.width = folded ? '' : w + 'px';
    el.style.maxHeight = h + 'px';
    const ew = folded ? el.offsetWidth || 60 : w, eh = Math.min(h, el.offsetHeight || h);
    let x = pos ? r.left + pos.x * r.width : r.right - w - 8, y = pos ? r.top + pos.y * r.height : r.top + (api.game.top + 6) * s;
    x = Math.max(r.left + 4, Math.min(r.right - ew - 4, x));
    y = Math.max(r.top + 4, Math.min(r.bottom - eh - 4, y));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  }
  function theme() {
    const k = api.col();
    if (k === lastCol) return;
    lastCol = k;
    el.style.setProperty('--k', k);
    for (const [n, a] of [['06', 0.06], ['10', 0.1], ['25', 0.25], ['35', 0.35], ['45', 0.45], ['60', 0.6]]) el.style.setProperty('--k' + n, hexA(k, a));
  }

  return {
    show(on) {
      if (on === shown) return;
      shown = on;
      if (on) { theme(); build(); place(); }
      el.style.display = on ? 'flex' : 'none';
    },
    refresh() { if (shown) build(); },
    place() { if (shown) place(); },
    get shown() { return shown; },
  };
}
