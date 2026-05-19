// Convertit des coordonnées offset (odd-q, flat-top) en coordonnées cube.
// Les colonnes impaires sont décalées vers le bas d'un demi-hex.
function toCube(col, row) {
  const x = col
  const z = row - (col - col % 2) / 2
  const y = -x - z
  return { x, y, z }
}

// Distance en nombre de pas entre deux hexes.
export function hexDistance(col1, row1, col2, row2) {
  const a = toCube(col1, row1)
  const b = toCube(col2, row2)
  return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2
}

// Retourne tous les hexes atteignables depuis (col, row) dans un rayon `range`,
// filtrés par les limites du plateau. Exclut le hex de départ.
// TODO: la portée devra tenir compte du territoire (règle §3) quand celui-ci
// sera implémenté — vitesse 1 en territoire propre, 3 hors territoire.
export function getReachableHexes(col, row, range, cols, rows) {
  const result = []
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (c === col && r === row) continue
      const d = hexDistance(col, row, c, r)
      if (d <= range) result.push({ col: c, row: r })
    }
  }
  return result
}
