export const COLS = 13
export const ROWS = 9
export const HEX_SIZE = 32
export const MOVE_RANGE = 2

export const TERRAIN = {
  open:      { fill: 'var(--terrain-open)',      label: 'Terrain ouvert', icon: null  },
  forest:    { fill: 'var(--terrain-forest)',    label: 'Forêt',          icon: '♣'   },
  water:     { fill: 'var(--terrain-water)',     label: 'Eau',            icon: '~'   },
  mountain:  { fill: 'var(--terrain-mountain)',  label: 'Hauteur',        icon: '▲'   },
  objective: { fill: 'var(--terrain-objective)', label: 'Objectif',       icon: '✶'   },
}

const CHAR_TO_TYPE = {
  o: 'open', f: 'forest', w: 'water',
  m: 'mountain', X: 'objective',
}

const RAW_MAP = [
  'oooofffooomoo',
  'oofffoommmmoo',
  'oofoooooommoo',
  'oooooXoooowoo',
  'ooooooooowwwo',
  'oooooooowwooo',
  'ooooXooofoooo',
  'ooofoofffoooo',
  'oooofffooommo',
]

const BASE_MAP = RAW_MAP.map(row =>
  row.split('').map(ch => ch === 'm' ? 'open' : (CHAR_TO_TYPE[ch] || 'open'))
)

const MOUNTAIN_SEEDS = 4
const MOUNTAIN_SPREAD_CHANCE = 0.4
const MOUNTAIN_MAX_SIZE = 2

const WATER_SEEDS = 2
const WATER_SPREAD_CHANCE = 0.4
const WATER_MAX_SIZE = 2

const CUBE_DIRS = [
  [+1, -1,  0], [-1, +1,  0],
  [+1,  0, -1], [-1,  0, +1],
  [ 0, +1, -1], [ 0, -1, +1],
]

function toCube(col, row) {
  const x = col
  const z = row - (col - col % 2) / 2
  return { x, z }
}

function fromCube(x, z) {
  const col = x
  const row = z + (col - col % 2) / 2
  return { col, row }
}

function getNeighbors(col, row) {
  const { x, z } = toCube(col, row)
  return CUBE_DIRS
    .map(([dx, , dz]) => fromCube(x + dx, z + dz))
    .filter(h => h.col >= 0 && h.col < COLS && h.row >= 1 && h.row <= 7)
}

export function generateMap() {
  const map = BASE_MAP.map(row => [...row])

  const isOpen = (col, row) => map[row]?.[col] === 'open'

  const getOpenHexes = () => {
    const hexes = []
    for (let row = 1; row <= 7; row++) {
      for (let col = 0; col < COLS; col++) {
        if (isOpen(col, row)) hexes.push({ col, row })
      }
    }
    return hexes
  }

  const placeCluster = (terrain, seeds, spreadChance, maxSize) => {
    const openHexes = getOpenHexes()
    for (let i = 0; i < seeds; i++) {
      const j = i + Math.floor(Math.random() * (openHexes.length - i))
      ;[openHexes[i], openHexes[j]] = [openHexes[j], openHexes[i]]
    }
    for (let i = 0; i < seeds; i++) {
      const seed = openHexes[i]
      if (!isOpen(seed.col, seed.row)) continue
      map[seed.row][seed.col] = terrain
      const frontier = [seed]
      let size = 1
      while (frontier.length > 0 && size < maxSize) {
        const idx = Math.floor(Math.random() * frontier.length)
        const current = frontier[idx]
        frontier.splice(idx, 1)
        for (const nb of getNeighbors(current.col, current.row)) {
          if (size >= maxSize) break
          if (!isOpen(nb.col, nb.row)) continue
          if (Math.random() < spreadChance) {
            map[nb.row][nb.col] = terrain
            frontier.push(nb)
            size++
          }
        }
      }
    }
  }

  placeCluster('mountain', MOUNTAIN_SEEDS, MOUNTAIN_SPREAD_CHANCE, MOUNTAIN_MAX_SIZE)
  placeCluster('water', WATER_SEEDS, WATER_SPREAD_CHANCE, WATER_MAX_SIZE)

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
