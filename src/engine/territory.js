import { computeFrontierPoints, checkExtensions } from './frontier.js'
import { COLS, ROWS, HEX_SIZE } from '../data/map.js'

const PADDING = 20
const H = Math.sqrt(3) * HEX_SIZE
const HSPACE = 1.5 * HEX_SIZE
const VSPACE = H
const SVG_H = VSPACE * (ROWS - 1) + H + VSPACE / 2 + PADDING * 2

function hexCenter(col, row) {
  const cx = PADDING + HEX_SIZE + col * HSPACE
  const cy = PADDING + H / 2 + row * VSPACE + (col % 2 === 1 ? VSPACE / 2 : 0)
  return { cx, cy }
}

export function interpolateFrontierY(frontierPts, cx) {
  if (cx <= frontierPts[0].cx) return frontierPts[0].cy
  if (cx >= frontierPts[frontierPts.length - 1].cx) return frontierPts[frontierPts.length - 1].cy
  for (let i = 0; i < frontierPts.length - 1; i++) {
    const A = frontierPts[i], B = frontierPts[i + 1]
    if (cx >= A.cx && cx <= B.cx) {
      const t = (cx - A.cx) / (B.cx - A.cx)
      return A.cy + t * (B.cy - A.cy)
    }
  }
  return frontierPts[frontierPts.length - 1].cy
}

// Retourne { [squadKey]: nombre de hex scorants } selon les règles §6.
// Un hex score si : derrière la ligne de frontière ET aucune unité ennemie
// plus proche de la base que cet hex sur la même colonne.
export function countTerritoryHexes(units) {
  const result = {}

  for (const [squadKey, squad] of Object.entries(units)) {
    const sorted = [...squad.roster].sort((a, b) => a.col - b.col)
    const unitPts = sorted.map(u => hexCenter(u.col, u.row))
    const avgY = unitPts.reduce((s, p) => s + p.cy, 0) / unitPts.length
    const isTop = avgY < SVG_H / 2

    const enemyRosters = Object.entries(units)
      .filter(([k]) => k !== squadKey)
      .flatMap(([, s]) => s.roster)

    const enemyPts = enemyRosters.map(u => hexCenter(u.col, u.row))
    const frontierPts = computeFrontierPoints(unitPts, isTop, enemyPts)
    const { leftBlocked, rightBlocked } = checkExtensions(frontierPts, isTop, enemyPts)

    let count = 0
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const { cx, cy } = hexCenter(col, row)

        if (leftBlocked && cx < frontierPts[0].cx) continue
        if (rightBlocked && cx > frontierPts[frontierPts.length - 1].cx) continue

        const frontierY = interpolateFrontierY(frontierPts, cx)

        // Hex derrière la ligne (côté base du joueur)
        const inTerritory = isTop ? cy <= frontierY : cy >= frontierY
        if (!inTerritory) continue

        // Aucune unité ennemie plus proche de la base sur cette colonne
        const hasEnemyBlocker = enemyRosters.some(enemy => {
          if (enemy.col !== col) return false
          const { cy: enemyCy } = hexCenter(enemy.col, enemy.row)
          // isTop=true (base en haut) : ennemi bloqueur si son cy < cy du hex (plus haut = plus proche de la base)
          // isTop=false (base en bas) : ennemi bloqueur si son cy > cy du hex (plus bas = plus proche de la base)
          return isTop ? enemyCy < cy : enemyCy > cy
        })

        if (!hasEnemyBlocker) count++
      }
    }

    result[squadKey] = count
  }

  return result
}
