import { hexDistance, hasLOS } from './movement.js'

// Une unité ennemie est capturée si au moins 2 unités alliées sont à distance ≤ 2 avec LOS.
function isEnemyCaptured(enemy, friendlyPositions, mountainSet) {
  const count = friendlyPositions.filter(f => {
    if (hexDistance(enemy.col, enemy.row, f.col, f.row) > 2) return false
    return hasLOS(enemy.col, enemy.row, f.col, f.row, mountainSet)
  }).length
  return count >= 2
}

// Retourne toutes les unités qui seraient capturées si selectedUnit se déplace vers targetPos.
// Inclut les ennemis encerclés ET l'unité déplacée si elle-même encerclée.
// Chaque élément : { col, row, squadKey, unitIndex }
export function getThreatenedEnemies(selectedUnit, targetPos, units, mountainHexes = []) {
  const mountainSet = new Set(mountainHexes.map(h => `${h.col},${h.row}`))
  const { squadKey, unitIndex } = selectedUnit

  // Positions alliées après le déplacement simulé
  const friendlyPositions = []
  Object.entries(units).forEach(([key, squad]) => {
    if (key === squadKey) {
      squad.roster.forEach((u, i) => {
        friendlyPositions.push(
          i === unitIndex
            ? { col: targetPos.col, row: targetPos.row }
            : { col: u.col, row: u.row }
        )
      })
    }
  })

  // Positions et unités ennemies
  const enemyPositions = []
  const enemyUnits = []
  Object.entries(units).forEach(([key, squad]) => {
    if (key !== squadKey) {
      squad.roster.forEach((u, i) => {
        enemyPositions.push({ col: u.col, row: u.row })
        enemyUnits.push({ col: u.col, row: u.row, squadKey: key, unitIndex: i })
      })
    }
  })

  const captured = enemyUnits.filter(enemy => isEnemyCaptured(enemy, friendlyPositions, mountainSet))

  // L'unité déplacée est elle-même capturée si 2+ ennemis sont à portée ≤ 2 avec LOS
  if (isEnemyCaptured({ col: targetPos.col, row: targetPos.row }, enemyPositions, mountainSet)) {
    captured.push({ col: targetPos.col, row: targetPos.row, squadKey, unitIndex })
  }

  return captured
}
