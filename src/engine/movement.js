// Convertit des coordonnées offset (odd-q, flat-top) en coordonnées cube.
// Les colonnes impaires sont décalées vers le bas d'un demi-hex.
export function toCube(col, row) {
  const x = col
  const z = row - (col - col % 2) / 2
  const y = -x - z
  return { x, y, z }
}

function fromCube(x, z) {
  const col = x
  const row = z + (col - col % 2) / 2
  return { col, row }
}

function cubeRound(fx, fy, fz) {
  let rx = Math.round(fx)
  let ry = Math.round(fy)
  let rz = Math.round(fz)
  const dx = Math.abs(rx - fx)
  const dy = Math.abs(ry - fy)
  const dz = Math.abs(rz - fz)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy > dz) ry = -rx - rz
  else rz = -rx - ry
  return fromCube(rx, rz)
}

const CUBE_DIRS = [
  [+1, -1,  0], [-1, +1,  0],
  [+1,  0, -1], [-1,  0, +1],
  [ 0, +1, -1], [ 0, -1, +1],
]

function getNeighbors(col, row, cols, rows) {
  const { x, z } = toCube(col, row)
  return CUBE_DIRS
    .map(([dx, , dz]) => fromCube(x + dx, z + dz))
    .filter(h => h.col >= 0 && h.col < cols && h.row >= 0 && h.row < rows)
}

// Distance en nombre de pas entre deux hexes.
export function hexDistance(col1, row1, col2, row2) {
  const a = toCube(col1, row1)
  const b = toCube(col2, row2)
  return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2
}

// Retourne true si la ligne droite entre deux hexes ne passe par aucune montagne.
export function hasLOS(col1, row1, col2, row2, mountainSet) {
  const dist = hexDistance(col1, row1, col2, row2)
  if (dist <= 1) return true

  const a = toCube(col1, row1)
  const b = toCube(col2, row2)

  for (let i = 1; i < dist; i++) {
    const t = i / dist
    const { col, row } = cubeRound(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t,
    )
    if (mountainSet.has(`${col},${row}`)) return false
  }

  return true
}

// Retourne tous les hexes atteignables depuis (col, row) dans un rayon `range`
// via BFS, en respectant les hexes occupés (unités) et impassables (montagnes).
export function getReachableHexes(col, row, range, cols, rows, occupiedHexes = [], impassableHexes = []) {
  const occupied = new Set(occupiedHexes.map(h => `${h.col},${h.row}`))
  const impassable = new Set(impassableHexes.map(h => `${h.col},${h.row}`))

  const visited = new Set([`${col},${row}`])
  const queue = [{ col, row, remaining: range }]
  const result = []

  while (queue.length > 0) {
    const { col: c, row: r, remaining } = queue.shift()
    if (remaining === 0) continue

    for (const n of getNeighbors(c, r, cols, rows)) {
      const key = `${n.col},${n.row}`
      if (impassable.has(key)) continue
      if (occupied.has(key)) continue
      if (visited.has(key)) continue
      visited.add(key)
      result.push({ col: n.col, row: n.row })
      queue.push({ col: n.col, row: n.row, remaining: remaining - 1 })
    }
  }

  return result
}
