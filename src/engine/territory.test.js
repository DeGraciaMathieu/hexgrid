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
