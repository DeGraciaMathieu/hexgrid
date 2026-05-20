import { describe, it, expect } from 'vitest'
import { countTerritoryHexes } from './territory.js'

// Construit un objet units minimal pour countTerritoryHexes.
function buildUnits(p1Roster, p2Roster) {
  return {
    p1: { roster: p1Roster.map(([col, row]) => ({ col, row })) },
    p2: { roster: p2Roster.map(([col, row]) => ({ col, row })) },
  }
}

// Scénario de flanquement latéral :
//   P1 couvre les colonnes 6-10 en row=5 (zone centrale-droite).
//   P2 flanqueur en col=1 row=6 : hors du span P1 (gauche), avancé dans son territoire.
//   Sans le fix, les cols 0-5 scorent quand même.
//   Avec le fix (checkExtensions), ces cols ne scorent plus.
//
// Référence : P2 en col=1 row=0 (position de départ, pas dans le territoire P1).
//   → pas de flanquement → P1 score normalement les cols 0-5 derrière sa ligne.

// Régression : si toutes les unités de P2 franchissent la ligne médiane (territoire ennemi),
// isTop doit rester true (base en haut). Avec l'ancien code (isTop dérivé de la position moyenne),
// isTop basculait à false → P2 ne scorait que les hexes sous ses unités (quasi zéro).
// Avec le fix, P2 score correctement tous les hexes derrière sa ligne vers sa base (haut).
describe('isTop stable même quand toutes les unités sont en territoire ennemi', () => {
  it('P2 entièrement dans la moitié basse : score P2 élevé (orientation top maintenue)', () => {
    // P2 (base haut) avance toutes ses unités en row=7 (profondément dans le territoire P1)
    // P1 (base bas) reste en position de départ sur row=8
    const units = buildUnits(
      [[1, 8], [3, 8], [5, 8], [7, 8], [11, 8]],   // p1 en bas (normal)
      [[1, 7], [3, 7], [5, 7], [7, 7], [11, 7]],   // p2 tout en bas (territoire ennemi)
    )

    const scores = countTerritoryHexes(units)

    // Avec isTop=true stable : P2 score tous les hexes au-dessus de ses unités (rows 0-6 ≈ 80+ hexes)
    // Avec isTop=false (bug) : P2 ne scorerait que les hexes sous row 7, soit quasi zéro
    expect(scores.p2).toBeGreaterThan(50)
    expect(scores.p1).toBeGreaterThan(0)
  })
})

describe('Flanc latéral ennemi — scoring territorial', () => {
  const p1Units = [[6, 5], [8, 5], [10, 5]]

  it('un ennemi qui flanque à gauche du span réduit le score territorial de P1', () => {
    const avecFlanqueur  = buildUnits(p1Units, [[1, 6]])
    const sansFlanqueur  = buildUnits(p1Units, [[1, 0]])

    const scoreFlanque  = countTerritoryHexes(avecFlanqueur).p1
    const scoreNormal   = countTerritoryHexes(sansFlanqueur).p1

    expect(scoreFlanque).toBeLessThan(scoreNormal)
  })

  it('un ennemi en position avancée non flanquante (devant la ligne) ne réduit pas le score', () => {
    // P2 à col=8 row=3 : dans le span P1 mais devant la frontière — ne bloque pas l'extension
    const avecEnnemiFront  = buildUnits(p1Units, [[8, 3]])
    const sansFlanqueur    = buildUnits(p1Units, [[1, 0]])

    const scoreAvec  = countTerritoryHexes(avecEnnemiFront).p1
    const scoreSans  = countTerritoryHexes(sansFlanqueur).p1

    expect(scoreAvec).toBe(scoreSans)
  })
})
