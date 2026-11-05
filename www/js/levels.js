// Worlds (city districts): each adds ONE new mechanic and keeps the ones from
// the previous districts (cumulative). Each has its own music and border-light
// style, a list of stages and a boss that guards the frontier to the next.
// Rows: 9 columns. '.' empty, '1'..'4' hits needed, 'X' wall, 'E' explosive.

export const MECHS = {
  slide:    { name: 'DESLIZE',   text: 'As fileiras de blocos deslizam de um lado para o outro.' },
  gravity:  { name: 'GRAVIDADE', text: 'Núcleos de gravidade puxam e curvam o disco.' },
  walls:    { name: 'MURALHA',   text: 'Blocos riscados são indestrutíveis.' },
  portals:  { name: 'PORTAIS',   text: 'Entre num portal e saia pelo outro.' },
  blast:    { name: 'REAÇÃO',    text: 'Blocos com X explodem e atingem os vizinhos.' },
  phase:    { name: 'FASE',      text: 'Blocos tracejados estão fora de fase: o disco atravessa.' },
  descent:  { name: 'PRESSÃO',   text: 'Os blocos descem. Se tocarem a linha de alerta, você perde uma vida.' },
};

export const WORLDS = [
  {
    name: 'SUBÚRBIO', mech: 'slide', music: 'w1', bossMusic: 'boss1', border: 'flow',
    boss: { type: 'sentinel', name: 'SENTINELA',
      text: 'Acerte o núcleo embaixo do casco quando a íris abrir.' },
    stages: [
      { name: 'QUINTAL', mech: null, rows: [
        '..22222..',
        '.1111111.',
        '.1111111.',
      ] },
      { name: 'RUA DE TERRA', rows: [
        '...222...',
        '..11111..',
        '.1111....',
        '....1111.',
        '..11111..',
      ] },
      { name: 'LAJE', rows: [
        '...333...',
        '.22222...',
        '...22222.',
        '.1111....',
        '....1111.',
        '..11111..',
      ] },
    ],
  },
  {
    name: 'LAN HOUSE', mech: 'gravity', music: 'w2', bossMusic: 'boss2', border: 'beat',
    boss: { type: 'singularity', name: 'SINGULARIDADE',
      text: 'Acerte o núcleo pela abertura do anel.' },
    stages: [
      { name: 'HORA AVULSA', wells: [[0.5, 0.42]], rows: [
        '..33333..',
        '.2222222.',
        '111111111',
        '..1111...',
      ] },
      { name: 'PING ALTO', wells: [[0.28, 0.36], [0.72, 0.55]], rows: [
        '222222222',
        '.11111...',
        '...11111.',
        '2.......2',
      ] },
      { name: 'ÚLTIMA PARTIDA', wells: [[0.5, 0.45]], orbit: true, rows: [
        '.3.3.3.3.',
        '222222222',
        '..2.2.2..',
        '111111111',
        '..11111..',
      ] },
    ],
  },
  {
    // Working for the corporation: the pressure never stops.
    name: 'HORA EXTRA', mech: 'descent', music: 'w3', bossMusic: 'boss3', border: 'scan',
    boss: { type: 'supervisor', name: 'O SUPERVISOR',
      text: 'Acerte o olho no topo da pirâmide quando ele abrir.' },
    stages: [
      { name: 'EXPEDIENTE', rows: [
        '222222222',
        '111111111',
        '.1.1.1.1.',
      ] },
      { name: 'META DO TRIMESTRE', wells: [[0.5, 0.5]], rows: [
        '........3',
        '.......33',
        '.....2222',
        '...222222',
        '.11111111',
      ] },
      { name: 'CORTE DE GASTOS', rows: [
        'X2222222X',
        '.1111111.',
        'X.......X',
        '..11111..',
      ] },
    ],
  },
  // The rest of the story, still being built. Read the names in order.
  {
    // Nights spent coding the game, after the overtime.
    name: 'MADRUGADA', mech: 'phase', music: 'w4', bossMusic: 'boss4', border: 'beat',
    boss: { type: 'clock', name: 'O RELÓGIO DE PONTO',
      text: 'Acerte o centro do relógio passando entre os ponteiros.' },
    stages: [
      { name: 'INSÔNIA', rows: [
        '..22222..',
        '.1111111.',
        '222222222',
        '.1111111.',
      ] },
      { name: 'TELA ACESA', wells: [[0.5, 0.5]], rows: [
        '3.3.3.3.3',
        '111111111',
        '.2222222.',
        '111111111',
        '..2...2..',
      ] },
      { name: 'TRÊS DA MANHÃ', rows: [
        'X2222222X',
        '.1111111.',
        '3.33333.3',
        '.1111111.',
        '..22.22..',
      ] },
    ],
  },
  {
    // The game takes shape: everything connects.
    name: 'CÓDIGO-FONTE', mech: 'portals', music: 'w5', bossMusic: 'boss5', border: 'flow',
    boss: { type: 'patent', name: 'A PATENTE',
      text: 'Acerte a fechadura embaixo do cadeado quando ela abrir.' },
    stages: [
      { name: 'HELLO WORLD', portals: [[0.14, 0.4, 0.86, 0.4]], rows: [
        '.2222222.',
        '.1111111.',
        '22.222.22',
        '.1111111.',
      ] },
      { name: 'GOTO', portals: [[0.12, 0.6, 0.88, 0.12], [0.88, 0.6, 0.12, 0.12]], rows: [
        '333...333',
        '111111111',
        '.22222.2.',
        '111111111',
      ] },
      { name: 'COMMIT', portals: [[0.5, 0.62, 0.5, 0.1]], rows: [
        '2E22E22E2',
        '.1111111.',
        'X.33333.X',
        '.1111111.',
        '..2E2E2..',
      ] },
    ],
  },
  { name: 'VIRAL', soon: true },
  { name: 'CENSURA', soon: true },
  { name: 'RESISTÊNCIA', soon: true },
  { name: 'TORRE AURUM', soon: true },
  { name: 'O SISTEMA', soon: true, final: true, music: 'w3', bossMusic: 'boss3', border: 'scan',
    boss: { type: 'system', name: 'O SISTEMA',
      text: 'Acerte o olho que tudo vê. Dizem que ele é grande demais para cair.' } },
];

// Stages per world = its stages + the boss.
export const worldCount = (w) => (WORLDS[w].soon ? 0 : WORLDS[w].stages.length + 1);
export const PLAYABLE = WORLDS.filter((x) => !x.soon).length;
export function worldStart(w) {
  let n = 0;
  for (let k = 0; k < w; k++) n += worldCount(k);
  return n;
}
export const TOTAL_STAGES = worldStart(WORLDS.length);

// Stage index -> { w, s }.
export function locate(i) {
  let w = 0;
  while (w < WORLDS.length - 1 && i >= worldStart(w + 1)) w++;
  return { w, s: i - worldStart(w) };
}

export function stageLabel(i) {
  const { w, s } = locate(i);
  return `${w + 1}-${s + 1}`;
}

// Mechanics active in world w: its own plus every previous world's.
export function worldMechs(w) {
  return WORLDS.slice(0, w + 1).map((x) => x.mech).filter(Boolean);
}

export function getStage(i) {
  const { w, s } = locate(i);
  const world = WORLDS[w];
  const all = worldMechs(w);
  if (s === worldCount(w) - 1) return { w, s, world, mech: world.mech, mechs: all, boss: world.boss, rows: [] };
  const st = world.stages[s];
  const mech = st.mech === undefined ? world.mech : st.mech;
  return { w, s, world, mech, mechs: mech ? all : [], rows: st.rows, wells: st.wells, orbit: st.orbit, portals: st.portals, name: st.name };
}
