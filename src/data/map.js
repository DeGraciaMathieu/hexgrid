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
  'ooooXooofoooo',
  'ooofoofffoooo',
  'oooofffooommo',
]

const BASE_MAP = RAW_MAP.map(row =>
  row.split('').map(ch => ch === 'm' ? 'open' : (CHAR_TO_TYPE[ch] || 'open'))
)

const MOUNTAIN_COUNT = 8

export function generateMap() {
  const map = BASE_MAP.map(row => [...row])

  const candidates = []
  for (let row = 1; row <= 7; row++) {
    for (let col = 0; col < COLS; col++) {
      if (map[row][col] === 'open') candidates.push({ col, row })
    }
  }

  // Fisher-Yates shuffle partiel pour choisir MOUNTAIN_COUNT hexes
  for (let i = 0; i < MOUNTAIN_COUNT; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
    const { col, row } = candidates[i]
    map[row][col] = 'mountain'
  }

  return map
}

export const SQUADS = {
  p2: {
    label: 'PLAYER 2 // RED CELL',
    color: '#ff5a4a',
    startRow: 0,
    roster: [
      { col: 1,  row: 0, code: 'L', name: 'Leader'  },
      { col: 3,  row: 0, code: 'S', name: 'Sniper'  },
      { col: 5,  row: 0, code: 'F', name: 'Fighter' },
      { col: 7,  row: 0, code: 'G', name: 'Gunner'  },
      { col: 11, row: 0, code: 'T', name: 'Trooper' },
    ],
  },
  p1: {
    label: 'PLAYER 1 // BLUE CELL',
    color: '#58a6ff',
    startRow: 8,
    roster: [
      { col: 1,  row: 8, code: 'T', name: 'Trooper' },
      { col: 3,  row: 8, code: 'G', name: 'Gunner'  },
      { col: 7,  row: 8, code: 'M', name: 'Medic'   },
      { col: 9,  row: 8, code: 'S', name: 'Sniper'  },
      { col: 11, row: 8, code: 'L', name: 'Leader'  },
    ],
  },
}
