export const COLS = 13
export const ROWS = 9
export const HEX_SIZE = 32

export const TERRAIN = {
  open:      { fill: 'var(--terrain-open)',      label: 'Terrain ouvert', icon: null  },
  forest:    { fill: 'var(--terrain-forest)',    label: 'Forêt',          icon: '♣'   },
  water:     { fill: 'var(--terrain-water)',     label: 'Eau',            icon: '~'   },
  mountain:  { fill: 'var(--terrain-mountain)',  label: 'Hauteur',        icon: '▲'   },
  urban:     { fill: 'var(--terrain-urban)',     label: 'Ruine',          icon: '▢'   },
  objective: { fill: 'var(--terrain-objective)', label: 'Objectif',       icon: '✶'   },
}

const CHAR_TO_TYPE = {
  o: 'open', f: 'forest', w: 'water',
  m: 'mountain', u: 'urban', X: 'objective',
}

const RAW_MAP = [
  'oooofffooomoo',
  'oofffoommmmoo',
  'oofoooooommoo',
  'ooouoXoooowoo',
  'oouuuoooowwwo',
  'oouooooowwooo',
  'ooooXooofooo',
  'ooofoofffoooo',
  'oooofffooommo',
]

export const MAP = RAW_MAP.map(row =>
  row.split('').map(ch => CHAR_TO_TYPE[ch] || 'open')
)

export const SQUADS = {
  p2: {
    label: 'PLAYER 2 // RED CELL',
    color: '#ff5a4a',
    roster: [
      { col: 1,  row: 1, code: 'L', name: 'Leader'  },
      { col: 3,  row: 1, code: 'S', name: 'Sniper'  },
      { col: 5,  row: 3, code: 'F', name: 'Fighter', from: [5, 1] },
      { col: 7,  row: 2, code: 'G', name: 'Gunner',  from: [7, 1] },
      { col: 9,  row: 3, code: 'F', name: 'Fighter', from: [9, 1] },
      { col: 11, row: 1, code: 'T', name: 'Trooper' },
    ],
  },
  p1: {
    label: 'PLAYER 1 // BLUE CELL',
    color: '#58a6ff',
    roster: [
      { col: 1,  row: 7, code: 'T', name: 'Trooper' },
      { col: 3,  row: 6, code: 'G', name: 'Gunner',  from: [3, 7] },
      { col: 4,  row: 6, code: 'F', name: 'Fighter', from: [5, 7] },
      { col: 7,  row: 6, code: 'M', name: 'Medic',   from: [7, 7] },
      { col: 9,  row: 7, code: 'S', name: 'Sniper'  },
      { col: 11, row: 7, code: 'L', name: 'Leader'  },
    ],
  },
}
