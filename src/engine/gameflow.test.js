import { describe, it, expect } from 'vitest'
import { applyMove, applyRespawn } from './gameflow.js'

// Construit un état de jeu minimal.
function buildState({ turn = 1, activePlayer = 'p1', p1Roster, p2Roster } = {}) {
  return {
    units: {
      p1: {
        color: '#58a6ff',
        label: 'P1',
        startRow: 0,
        roster: p1Roster.map((pos, i) => ({ col: pos[0], row: pos[1], code: `A${i}`, name: '' })),
      },
      p2: {
        color: '#ff5a4a',
        label: 'P2',
        startRow: 8,
        roster: p2Roster.map((pos, i) => ({ col: pos[0], row: pos[1], code: `B${i}`, name: '' })),
      },
    },
    turn,
    activePlayer,
    scoreHistory: { p1: [], p2: [] },
    phase: 'move',
    respawnQueue: [],
    gameOver: false,
    pendingGameOver: false,
  }
}

// Construit un état avec une capture garantie :
// p1 a deux unités à portée d'un ennemi p2, et confirme sa position pour l'encercler.
//
// Disposition :
//   p1[0] en (3,4) — confirme sa position (targetHex = position courante)
//   p1[1] en (5,2) — déjà en place
//   p2[0] en (5,4) — la cible ennemie (distance ≤ 2 des deux alliés)
//   p2[1] en (10,8) — unité survivante (garantit un roster p2 non vide)
//
// Après le "mouvement" de p1[0] en (3,4), les deux alliés encerclent p2[0].
function buildCaptureState(turn) {
  return buildState({
    turn,
    activePlayer: 'p1',
    p1Roster: [[3, 4], [5, 2]],
    p2Roster: [[5, 4], [10, 8]],
  })
}

const MOVE = {
  selectedUnit: { squadKey: 'p1', unitIndex: 0 },
  targetHex: { col: 3, row: 4 },
}

describe('Régression — champ from après mouvement', () => {
  it('applyMove enregistre la position de départ dans from', () => {
    const state = buildState({
      activePlayer: 'p1',
      p1Roster: [[3, 4]],
      p2Roster: [[10, 8]],
    })

    const next = applyMove(state, {
      selectedUnit: { squadKey: 'p1', unitIndex: 0 },
      targetHex: { col: 4, row: 4 },
    })

    expect(next.units.p1.roster[0].from).toEqual([3, 4])
    expect(next.units.p1.roster[0].col).toBe(4)
    expect(next.units.p1.roster[0].row).toBe(4)
  })

  it('applyRespawn laisse from à undefined', () => {
    const state = buildCaptureState(10)
    const afterMove = applyMove(state, MOVE)
    const afterRespawn = applyRespawn(afterMove, { col: 0, row: 8 })

    const respawnedUnit = afterRespawn.units.p2.roster.find(u => u.col === 0 && u.row === 8)
    expect(respawnedUnit).toBeDefined()
    expect(respawnedUnit.from).toBeUndefined()
  })
})

describe('Régression — tour 20 avec capture', () => {
  it('au tour 20 avec capture : la partie ne se termine pas avant le respawn', () => {
    const state = buildCaptureState(20)
    const next = applyMove(state, MOVE)

    expect(next.gameOver).toBe(false)
    expect(next.phase).toBe('respawn')
    expect(next.respawnQueue.length).toBeGreaterThan(0)
  })

  it('au tour 20 avec capture : la partie se termine après le respawn', () => {
    const state = buildCaptureState(20)
    const afterMove = applyMove(state, MOVE)
    const afterRespawn = applyRespawn(afterMove, { col: 0, row: 8 })

    expect(afterRespawn.gameOver).toBe(true)
    expect(afterRespawn.respawnQueue.length).toBe(0)
  })

  it('avant le tour 20 avec capture : la partie continue après le respawn', () => {
    const state = buildCaptureState(10)
    const afterMove = applyMove(state, MOVE)

    expect(afterMove.gameOver).toBe(false)
    expect(afterMove.phase).toBe('respawn')

    const afterRespawn = applyRespawn(afterMove, { col: 0, row: 8 })

    expect(afterRespawn.gameOver).toBe(false)
    expect(afterRespawn.phase).toBe('move')
  })

  it('au tour 20 sans capture : la partie se termine immédiatement', () => {
    const state = buildState({
      turn: 20,
      activePlayer: 'p1',
      p1Roster: [[1, 1]],
      p2Roster: [[10, 8]],
    })

    const next = applyMove(state, {
      selectedUnit: { squadKey: 'p1', unitIndex: 0 },
      targetHex: { col: 2, row: 1 },
    })

    expect(next.gameOver).toBe(true)
    expect(next.phase).toBe('move')
    expect(next.respawnQueue.length).toBe(0)
  })
})
