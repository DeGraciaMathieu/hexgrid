import { hexDistance } from './movement.js'

// Une unité ennemie est capturée si au moins 2 unités alliées sont à distance ≤ 2 d'elle.
function isEnemyCaptured(enemy, friendlyPositions) {
  const count = friendlyPositions.filter(
    f => hexDistance(enemy.col, enemy.row, f.col, f.row) <= 2
  ).length
  return count >= 2
}

// Retourne les ennemis qui seraient capturés si selectedUnit se déplace vers targetPos.
// Chaque élément : { col, row, squadKey, unitIndex }
export function getThreatenedEnemies(selectedUnit, targetPos, units) {
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

  // Unités ennemies
  const enemyUnits = []
  Object.entries(units).forEach(([key, squad]) => {
    if (key !== squadKey) {
      squad.roster.forEach((u, i) => {
        enemyUnits.push({ col: u.col, row: u.row, squadKey: key, unitIndex: i })
      })
    }
  })

  return enemyUnits.filter(enemy => isEnemyCaptured(enemy, friendlyPositions))
}
