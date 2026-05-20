import { getThreatenedEnemies } from './combat.js'
import { countTerritoryHexes } from './territory.js'

export const MAX_TURNS = 20

// Applique un mouvement et retourne le prochain état de jeu.
// state : { units, turn, activePlayer, scoreHistory, phase, respawnQueue, gameOver, pendingGameOver }
// move  : { selectedUnit: { squadKey, unitIndex }, targetHex: { col, row } }
export function applyMove(state, move, mountainHexes = []) {
  const { units, turn, activePlayer, scoreHistory } = state
  const { selectedUnit, targetHex } = move

  const threatened = getThreatenedEnemies(selectedUnit, targetHex, units, mountainHexes)

  const capturedUnitsData = threatened.map(({ squadKey, unitIndex }) => ({
    squadKey,
    unit: { ...units[squadKey].roster[unitIndex] },
  }))

  const nextUnits = { ...units }

  nextUnits[selectedUnit.squadKey] = {
    ...nextUnits[selectedUnit.squadKey],
    roster: nextUnits[selectedUnit.squadKey].roster.map((u, i) =>
      i === selectedUnit.unitIndex ? { ...u, col: targetHex.col, row: targetHex.row, from: [u.col, u.row] } : u
    ),
  }

  const capturedBySquad = {}
  threatened.forEach(({ squadKey, unitIndex }) => {
    if (!capturedBySquad[squadKey]) capturedBySquad[squadKey] = new Set()
    capturedBySquad[squadKey].add(unitIndex)
  })
  Object.entries(capturedBySquad).forEach(([squadKey, indices]) => {
    nextUnits[squadKey] = {
      ...nextUnits[squadKey],
      roster: nextUnits[squadKey].roster.filter((_, i) => !indices.has(i)),
    }
  })

  const playerScore = countTerritoryHexes(nextUnits)[activePlayer] ?? 0
  const nextHistory = {
    ...scoreHistory,
    [activePlayer]: [...scoreHistory[activePlayer], (scoreHistory[activePlayer].at(-1) ?? 0) + playerScore],
  }

  if (capturedUnitsData.length > 0) {
    return {
      units: nextUnits,
      scoreHistory: nextHistory,
      respawnQueue: capturedUnitsData,
      phase: 'respawn',
      pendingGameOver: turn === MAX_TURNS,
      gameOver: false,
      turn: turn === MAX_TURNS ? turn : turn + 1,
      activePlayer: turn === MAX_TURNS ? activePlayer : (activePlayer === 'p1' ? 'p2' : 'p1'),
    }
  }

  if (turn === MAX_TURNS) {
    return {
      units: nextUnits,
      scoreHistory: nextHistory,
      respawnQueue: [],
      phase: 'move',
      pendingGameOver: false,
      gameOver: true,
      turn,
      activePlayer,
    }
  }

  return {
    units: nextUnits,
    scoreHistory: nextHistory,
    respawnQueue: [],
    phase: 'move',
    pendingGameOver: false,
    gameOver: false,
    turn: turn + 1,
    activePlayer: activePlayer === 'p1' ? 'p2' : 'p1',
  }
}

// Applique un placement de respawn et retourne le prochain état de jeu.
// state   : { units, respawnQueue, phase, pendingGameOver, gameOver }
// hexPos  : { col, row }
export function applyRespawn(state, hexPos) {
  const { units, respawnQueue, pendingGameOver } = state
  const { squadKey, unit } = respawnQueue[0]

  const nextUnits = {
    ...units,
    [squadKey]: {
      ...units[squadKey],
      roster: [...units[squadKey].roster, { ...unit, col: hexPos.col, row: hexPos.row, from: undefined }],
    },
  }

  const newQueue = respawnQueue.slice(1)

  if (newQueue.length === 0) {
    if (pendingGameOver) {
      return { ...state, units: nextUnits, respawnQueue: [], pendingGameOver: false, gameOver: true }
    }
    return { ...state, units: nextUnits, respawnQueue: [], phase: 'move' }
  }

  return { ...state, units: nextUnits, respawnQueue: newQueue }
}
