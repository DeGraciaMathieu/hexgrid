import { getReachableHexes } from './movement.js'
import { getThreatenedEnemies } from './combat.js'
import { countTerritoryHexes } from './territory.js'
import { COLS, ROWS } from '../data/map.js'

const MOVE_RANGE = 2

// Applique un mouvement simulé et retourne les units résultantes ainsi que les captures.
function simulateMove(units, squadKey, unitIndex, col, row) {
  const threatened = getThreatenedEnemies({ squadKey, unitIndex }, { col, row }, units)

  const next = { ...units }
  next[squadKey] = {
    ...next[squadKey],
    roster: next[squadKey].roster.map((u, i) =>
      i === unitIndex ? { ...u, col, row } : u
    ),
  }

  const capturedBySquad = {}
  threatened.forEach(({ squadKey: sk, unitIndex: ui }) => {
    if (!capturedBySquad[sk]) capturedBySquad[sk] = new Set()
    capturedBySquad[sk].add(ui)
  })
  Object.entries(capturedBySquad).forEach(([sk, indices]) => {
    next[sk] = {
      ...next[sk],
      roster: next[sk].roster.filter((_, i) => !indices.has(i)),
    }
  })

  return { nextUnits: next, threatened }
}

// Retourne le meilleur hex de respawn pour maximiser le territoire.
export function computeAIRespawn(respawnHexes, units, squadKey) {
  if (respawnHexes.length === 0) return null

  let best = respawnHexes[0]
  let bestScore = -Infinity

  for (const hex of respawnHexes) {
    const testUnits = {
      ...units,
      [squadKey]: {
        ...units[squadKey],
        roster: [...units[squadKey].roster, { col: hex.col, row: hex.row }],
      },
    }
    const score = countTerritoryHexes(testUnits)[squadKey] ?? 0
    if (score > bestScore) {
      bestScore = score
      best = hex
    }
  }

  return best
}

// Retourne la meilleure décision de mouvement : { unitIndex, col, row } ou null (passer).
// Priorité : 1) capture ennemie, 2) gain territorial, 3) avance par défaut.
export function computeAIMove(units, squadKey) {
  const squad = units[squadKey]
  const currentScore = countTerritoryHexes(units)[squadKey] ?? 0

  let bestMove = null
  let bestScore = -Infinity

  for (let unitIndex = 0; unitIndex < squad.roster.length; unitIndex++) {
    const unit = squad.roster[unitIndex]

    const occupiedHexes = Object.entries(units).flatMap(([key, s]) =>
      s.roster.flatMap((u, i) =>
        key === squadKey && i === unitIndex ? [] : [{ col: u.col, row: u.row }]
      )
    )

    const reachable = getReachableHexes(unit.col, unit.row, MOVE_RANGE, COLS, ROWS, occupiedHexes)

    for (const target of reachable) {
      const { nextUnits, threatened } = simulateMove(units, squadKey, unitIndex, target.col, target.row)

      const enemyCaptures = threatened.filter(t => t.squadKey !== squadKey).length
      const selfCaptured = threatened.some(t => t.squadKey === squadKey)

      // Ne jamais se sacrifier sans capture compensatrice
      if (selfCaptured && enemyCaptures === 0) continue

      const newScore = countTerritoryHexes(nextUnits)[squadKey] ?? 0
      const territoryDelta = newScore - currentScore
      const moveScore = enemyCaptures * 1000 + territoryDelta - (selfCaptured ? 500 : 0)

      if (moveScore > bestScore) {
        bestScore = moveScore
        bestMove = { unitIndex, col: target.col, row: target.row }
      }
    }
  }

  return bestMove
}
