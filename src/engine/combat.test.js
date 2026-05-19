import { describe, it, expect } from 'vitest'
import { getThreatenedEnemies } from './combat.js'

// Construit un état de jeu minimal pour les tests.
// allies  : positions des unités alliées (la première est celle qui se déplace)
// enemies : positions des unités ennemies
function buildUnits(allies, enemies) {
  return {
    p1: {
      color: '#58a6ff',
      label: 'P1',
      roster: allies.map((pos, i) => ({ col: pos[0], row: pos[1], code: String(i), name: '' })),
    },
    p2: {
      color: '#ff5a4a',
      label: 'P2',
      roster: enemies.map((pos, i) => ({ col: pos[0], row: pos[1], code: String(i), name: '' })),
    },
  }
}

const selectedFirst = { squadKey: 'p1', unitIndex: 0 }

describe('Capture par encerclement', () => {
  it("un ennemi encerclé par 2 alliés à portée est capturé", () => {
    // Ennemi en (5,4), deux alliés déjà à distance ≤ 2 après déplacement
    const units = buildUnits(
      [[3, 4], [5, 2]],  // allié 0 se déplace, allié 1 déjà en place
      [[5, 4]],          // ennemi cible
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 3, row: 4 }, units)
    expect(threatened.length).toBe(1)
  })

  it("un ennemi avec un seul allié à portée n'est pas capturé", () => {
    const units = buildUnits(
      [[3, 4]],   // un seul allié
      [[5, 4]],
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 3, row: 4 }, units)
    expect(threatened.length).toBe(0)
  })

  it("un ennemi à 3 cases de l'unité déplacée reste hors de portée", () => {
    // Allié se déplace en (2,4), ennemi en (5,4) : distance = 3
    const units = buildUnits(
      [[0, 4], [6, 4]],  // allié 1 est de l'autre côté mais trop loin aussi
      [[5, 4]],
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 2, row: 4 }, units)
    expect(threatened.length).toBe(0)
  })

  it("le déplacement lui-même est pris en compte, pas la position de départ", () => {
    // Allié 0 démarre loin de l'ennemi, se déplace à portée pour compléter l'encerclement
    const units = buildUnits(
      [[0, 0], [5, 2]],  // allié 1 déjà proche de l'ennemi
      [[5, 4]],
    )
    const sansDeplacement = getThreatenedEnemies(selectedFirst, { col: 0, row: 0 }, units)
    const avecDeplacement  = getThreatenedEnemies(selectedFirst, { col: 5, row: 5 }, units)

    expect(sansDeplacement.length).toBe(0) // allié 0 trop loin
    expect(avecDeplacement.length).toBe(1)  // allié 0 maintenant à portée
  })

  it("plusieurs ennemis peuvent être capturés simultanément", () => {
    const units = buildUnits(
      [[4, 4], [6, 4]],   // deux alliés encadrent deux ennemis
      [[5, 3], [5, 5]],   // deux ennemis chacun à portée des deux alliés
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 4, row: 4 }, units)
    expect(threatened.length).toBe(2)
  })

  it("un ennemi adjacent (distance 1) à 2 alliés est capturé", () => {
    // Allié 0 se déplace en (4,4), allié 1 en (6,4), ennemi en (5,4) : distance 1 des deux
    const units = buildUnits(
      [[0, 0], [6, 4]],
      [[5, 4]],
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 4, row: 4 }, units)
    expect(threatened.length).toBe(1)
  })

  it("un ennemi exactement à 2 cases est bien considéré à portée", () => {
    // Allié 0 se déplace en (3,4), ennemi en (5,4) : distance exacte = 2
    const units = buildUnits(
      [[0, 4], [5, 2]],
      [[5, 4]],
    )
    const threatened = getThreatenedEnemies(selectedFirst, { col: 3, row: 4 }, units)
    expect(threatened.length).toBe(1)
  })
})
