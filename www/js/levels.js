// Worlds (city districts): each brings ONE new mechanic. Mechanics no longer
// pile up: a stage uses its district's mechanic plus the older ones it picks
// (`also`, or its own field pieces: wells, portals, bars, beams, V, B).
// Each district has its own music and border-light style, a list of stages and
// a boss that guards the frontier to the next.
// Rows: 9 columns. '.' empty, '1'..'4' hits needed, 'X' wall, 'E' explosive,
// 'V' infected (CONTÁGIO), 'B' shielded underneath (BLINDAGEM), 'L' leak (VAZAMENTO).
// Every district has 4 stages and a boss.

export const MECHS = {
  slide:    { name: 'DESLIZE',   text: 'As fileiras deslizam de um lado para o outro.' },
  gravity:  { name: 'GRAVIDADE', text: 'Núcleos puxam e curvam o disco.' },
  walls:    { name: 'MURALHA',   text: 'Blocos riscados não quebram.' },
  portals:  { name: 'PORTAIS',   text: 'Entra num portal, sai pelo outro.' },
  blast:    { name: 'REAÇÃO',    text: 'Blocos com X explodem os vizinhos.' },
  phase:    { name: 'FASE',      text: 'O disco atravessa os blocos tracejados.' },
  descent:  { name: 'PRESSÃO',   text: 'Os blocos descem. Não deixe tocarem a linha.' },
  viral:    { name: 'CONTÁGIO',  text: 'O vírus cria blocos em volta. Quebre ele primeiro.' },
  censor:   { name: 'VAZAMENTO', text: 'Tarjas rebatem o disco. Acerte a gota para derrubá-las.' },
  armor:    { name: 'BLINDAGEM', text: 'A placa protege por baixo. Acerte por cima ou pelo lado.' },
  alarm:    { name: 'SEGURANÇA', text: 'Feixes ligados rebatem o disco.' },
};

export const WORLDS = [
  {
    name: 'SUBÚRBIO', mech: 'slide', music: 'w1', bossMusic: 'boss1', border: 'flow',
    boss: { type: 'sentinel', name: 'SENTINELA',
      text: 'Acerte o núcleo quando a íris abrir.' },
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
      { name: 'PONTO FINAL', rows: [
        '2.2.2.2.2',
        '.1111111.',
        '..22222..',
        '.1111111.',
        '1.1.1.1.1',
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
      { name: 'PING ALTO', also: ['slide'], wells: [[0.28, 0.36], [0.72, 0.55]], rows: [
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
      { name: 'CORUJÃO', also: ['slide'], wells: [[0.3, 0.5], [0.7, 0.5]], rows: [
        '33.222.33',
        '.2222222.',
        '11.111.11',
        '.1111111.',
      ] },
    ],
  },
  {
    // Working for the corporation: the pressure never stops.
    name: 'HORA EXTRA', mech: 'descent', music: 'w3', bossMusic: 'boss3', border: 'scan',
    boss: { type: 'supervisor', name: 'O SUPERVISOR',
      text: 'Acerte o olho quando ele abrir.' },
    stages: [
      { name: 'EXPEDIENTE', also: ['slide'], rows: [
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
      { name: 'BANCO DE HORAS', also: ['slide'], rows: [
        '3X33333X3',
        '222222222',
        '.1111111.',
        '1.1.1.1.1',
      ] },
    ],
  },
  // The rest of the story, still being built. Read the names in order.
  {
    // Nights spent coding the game, after the overtime.
    name: 'MADRUGADA', mech: 'phase', music: 'w4', bossMusic: 'boss4', border: 'beat',
    boss: { type: 'clock', name: 'O RELÓGIO DE PONTO',
      text: 'Passe entre os ponteiros e acerte o centro.' },
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
      { name: 'TRÊS DA MANHÃ', also: ['descent'], rows: [
        'X2222222X',
        '.1111111.',
        '3.33333.3',
        '.1111111.',
        '..22.22..',
      ] },
      { name: 'CAFÉ FRIO', wells: [[0.5, 0.55]], rows: [
        '.3333333.',
        '2.22222.2',
        '111111111',
        'X.22222.X',
        '.1111111.',
      ] },
    ],
  },
  {
    // The game takes shape: everything connects.
    name: 'CÓDIGO-FONTE', mech: 'portals', music: 'w5', bossMusic: 'boss5', border: 'flow',
    boss: { type: 'patent', name: 'A PATENTE',
      text: 'Acerte a fechadura quando ela abrir.' },
    stages: [
      { name: 'HELLO WORLD', also: ['slide'], portals: [[0.14, 0.4, 0.86, 0.4]], rows: [
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
      { name: 'COMMIT', also: ['descent'], portals: [[0.5, 0.62, 0.5, 0.1]], rows: [
        '2E22E22E2',
        '.1111111.',
        'X.33333.X',
        '.1111111.',
        '..2E2E2..',
      ] },
      { name: 'DEPLOY', portals: [[0.2, 0.5, 0.8, 0.5]], rows: [
        'E3333333E',
        '.2222222.',
        'X.11111.X',
        '.2222222.',
        '..1E1E1..',
      ] },
    ],
  },
  {
    // The game gets out: one share, then a thousand.
    name: 'VIRAL', mech: 'viral', music: 'w6', bossMusic: 'boss6', border: 'beat',
    boss: { type: 'algorithm', name: 'O ALGORITMO',
      text: 'Passe entre os satélites e acerte o núcleo.' },
    stages: [
      { name: 'PRIMEIRO SHARE', also: ['slide'], rows: [
        '..22222..',
        '.1111111.',
        '....V....',
        '.1111111.',
      ] },
      { name: 'CORRENTE', portals: [[0.14, 0.45, 0.86, 0.45]], rows: [
        'V.......V',
        '.2222222.',
        '..11111..',
        '.2222222.',
        '....V....',
      ] },
      { name: 'TRENDING', wells: [[0.5, 0.5]], rows: [
        '3.3.V.3.3',
        '.2222222.',
        'V.......V',
        '.1111111.',
        '..2...2..',
      ] },
      { name: 'MIL CÓPIAS', also: ['descent'], rows: [
        'X..V.V..X',
        '.2222222.',
        '.V.....V.',
        '.1111111.',
        '...E.E...',
      ] },
    ],
  },
  {
    // The system answers: the game is taken down, piece by piece.
    name: 'CENSURA', mech: 'censor', music: 'w7', bossMusic: 'boss7', border: 'scan',
    boss: { type: 'censor', name: 'O CENSOR',
      text: 'Acerte a lente quando a tarja abrir.' },
    stages: [
      { name: 'FORA DO AR', also: ['slide'], bars: 1, rows: [
        '222222222',
        '.1111111.',
        '222222222',
        '.111L111.',
      ] },
      { name: 'TARJA PRETA', bars: 2, rows: [
        '3.33333.3',
        '111111111',
        '.22.2.22.',
        '111111111',
        '..2.L.2..',
      ] },
      { name: 'DENÚNCIA', bars: 1, portals: [[0.12, 0.55, 0.88, 0.12]], rows: [
        'X3333333X',
        '.2222222.',
        '..11111..',
        '.2222222.',
        'L.1E1E1..',
      ] },
      { name: 'ESPELHO', bars: 2, wells: [[0.5, 0.5]], rows: [
        '33.333.33',
        '2.22222.2',
        '.1111111.',
        'X.22L22.X',
        '.1111111.',
        '..22.22..',
      ] },
    ],
  },
  {
    // Not alone anymore: code arrives from everywhere, and the system armors up.
    name: 'RESISTÊNCIA', mech: 'armor', music: 'w8', bossMusic: 'boss8', border: 'flow',
    boss: { type: 'armored', name: 'O BLINDADO',
      text: 'O escudo segue o disco. Acerte pelo lado aberto.' },
    stages: [
      { name: 'MUTIRÃO', also: ['descent'], rows: [
        '..22222..',
        '.BBBBBBB.',
        '.1111111.',
        '..1...1..',
      ] },
      { name: 'RÁDIO PIRATA', also: ['slide'], rows: [
        '2.2.2.2.2',
        'BB.BBB.BB',
        '.2222222.',
        'B.11111.B',
        '..1.1.1..',
      ] },
      { name: 'GARAGEM', wells: [[0.5, 0.5]], rows: [
        '333...333',
        '.BBB.BBB.',
        '.2222222.',
        '..V...V..',
        '.BB...BB.',
      ] },
      { name: 'PONTO DE ENCONTRO', bars: 1, rows: [
        '3B3B3B3B3',
        '.2222222.',
        'B.2E2E2.B',
        '.1111111.',
        'BB..L..BB',
      ] },
    ],
  },
  {
    // The golden tower at the end of the street, where O SISTEMA lives.
    name: 'TORRE AURUM', mech: 'alarm', music: 'w9', bossMusic: 'boss9', border: 'scan',
    boss: { type: 'council', name: 'O CONSELHO',
      text: 'Três cadeiras, um dono. Acerte a da coroa.' },
    stages: [
      { name: 'SAGUÃO', beams: [[0.1, 0.9, 0.12, 0]], rows: [
        '.3333333.',
        '222222222',
        '.1111111.',
        '..11111..',
      ] },
      { name: 'ELEVADOR', also: ['slide'], beams: [[0.05, 0.52, 0.14, 0], [0.48, 0.95, 0.14, 2.2]], rows: [
        '33.333.33',
        '.BBBBBBB.',
        '222222222',
        '.1.1.1.1.',
        '..2...2..',
      ] },
      { name: 'ANDAR 99', beams: [[0.1, 0.9, 0.1, 0], [0.22, 0.78, 0.4, 1.5]], portals: [[0.12, 0.7, 0.88, 0.7]], rows: [
        'X3333333X',
        '.2222222.',
        '..11111..',
        '.2222222.',
        '...E.E...',
      ] },
      { name: 'COBERTURA', beams: [[0.1, 0.9, 0.1, 0], [0.05, 0.47, 0.36, 1], [0.53, 0.95, 0.36, 3]], rows: [
        '4.33333.4',
        '.BBBBBBB.',
        '3.22222.3',
        '.1111111.',
        'X.2E2E2.X',
        '..1...1..',
      ] },
    ],
  },
  { name: 'O SISTEMA', soon: true, final: true, music: 'w3', bossMusic: 'boss3', border: 'scan',
    boss: { type: 'system', name: 'O SISTEMA',
      text: 'Acerte o olho que tudo vê. Dizem que ele é grande demais para cair.' } },
];

// Bonus stages: side streets on the map, in districts 2, 5 and 8. They open
// after the district's 2nd stage, have no district mechanic, a twist of their
// own and pay coins when cleared.
export const BONUS = [
  { w: 1, after: 1, kind: 'missiles', name: 'LAG', coins: 40, demo: 'cap:missile',
    text: 'A plataforma dispara mísseis sem parar. Limpe tudo e ganhe moedas.',
    rows: [
      '333333333',
      '2.2.2.2.2',
      '222222222',
      '.1.1.1.1.',
      '111111111',
      '222222222',
      '.3.3.3.3.',
      '111111111',
    ] },
  { w: 4, after: 1, kind: 'fork', name: 'FORK BOMB', coins: 60, demo: 'cap:multi',
    text: 'Cada bloco quebrado solta mais um disco. Limpe tudo e ganhe moedas.',
    rows: [
      '2.2.2.2.2',
      '111111111',
      '222222222',
      '1.1.1.1.1',
      '222222222',
      '111111111',
      '222222222',
      '1.1.1.1.1',
      '111111111',
    ] },
  { w: 7, after: 1, kind: 'bombs', name: 'BARRICADA', coins: 80, demo: 'cap:bomb',
    text: 'O disco é uma bomba: toda batida explode os blocos em volta. Limpe tudo e ganhe moedas.',
    rows: [
      'X3333333X',
      '.4.4.4.4.',
      '333333333',
      'X.3.3.3.X',
      '444444444',
      '333333333',
      '..33333..',
    ] },
];
export const bonusIndex = (b) => worldStart(b.w) + b.after;   // the stage it opens after
export function getBonus(b) {
  return { w: b.w, s: -1, world: WORLDS[b.w], mech: null, mechs: [], rows: b.rows, name: b.name, bonus: b };
}

// Stages per world = its stages + the boss.
export const worldCount = (w) => (WORLDS[w].soon ? 0 : WORLDS[w].stages.length + 1);
export function worldStart(w) {
  let n = 0;
  for (let k = 0; k < w; k++) n += worldCount(k);
  return n;
}
export const TOTAL_STAGES = worldStart(WORLDS.length);

// Stage index -> { w, s }.
function locate(i) {
  let w = 0;
  while (w < WORLDS.length - 1 && i >= worldStart(w + 1)) w++;
  return { w, s: i - worldStart(w) };
}

export function stageLabel(i) {
  const { w, s } = locate(i);
  return `${w + 1}-${s + 1}`;
}

// Every district mechanic up to world w (bosses still use all of them).
export function worldMechs(w) {
  return WORLDS.slice(0, w + 1).map((x) => x.mech).filter(Boolean);
}

// Mechanics a stage uses: the district's own, the older ones it picks and the
// ones its field pieces bring.
function stageMechs(world, st) {
  const own = st.mech === undefined ? world.mech : st.mech;
  if (!own) return [];
  const m = new Set([own, ...(st.also || [])]);
  if (st.wells) m.add('gravity');
  if (st.portals) m.add('portals');
  if (st.bars) m.add('censor');
  if (st.beams) m.add('alarm');
  const rows = (st.rows || []).join('');
  if (rows.includes('V')) m.add('viral');
  if (rows.includes('B')) m.add('armor');
  return [...m];
}

// Mechanics that show up in world w, oldest first (for the map).
const ORDER = WORLDS.map((x) => x.mech).filter(Boolean);
export function districtMechs(w) {
  const wd = WORLDS[w];
  if (wd.soon) return [];
  const m = new Set([wd.mech]);
  for (const st of wd.stages) for (const k of stageMechs(wd, st)) m.add(k);
  return [...m].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

export function getStage(i) {
  const { w, s } = locate(i);
  const world = WORLDS[w];
  const all = worldMechs(w);
  if (s === worldCount(w) - 1) return { w, s, world, mech: world.mech, mechs: all, boss: world.boss, rows: [] };
  const st = world.stages[s];
  const mech = st.mech === undefined ? world.mech : st.mech;
  return { w, s, world, mech, mechs: stageMechs(world, st), rows: st.rows, wells: st.wells, orbit: st.orbit, portals: st.portals, bars: st.bars, beams: st.beams, name: st.name };
}
