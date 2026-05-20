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

describe('Territoire de base — sans ennemi menaçant', () => {
  it('P1 (base bas) score des hexes derrière sa ligne quand P2 est en position de départ', () => {
    // P2 reste en row=0 (sa base), sans pression sur P1
    const units = buildUnits(
      [[1, 6], [5, 6], [9, 6]],   // p1 avancé en row=6
      [[1, 0], [5, 0], [9, 0]],   // p2 en position de départ (row=0)
    )
    const scores = countTerritoryHexes(units)
    // P1 doit scorer tous les hexes entre sa ligne et sa base (rows 7-8)
    expect(scores.p1).toBeGreaterThan(0)
  })

  it('P2 (base haut) score des hexes derrière sa ligne quand P1 est en position de départ', () => {
    const units = buildUnits(
      [[1, 8], [5, 8], [9, 8]],   // p1 en position de départ (row=8)
      [[1, 2], [5, 2], [9, 2]],   // p2 avancé en row=2
    )
    const scores = countTerritoryHexes(units)
    // P2 doit scorer tous les hexes entre sa ligne et sa base (rows 0-1)
    expect(scores.p2).toBeGreaterThan(0)
  })
})

describe('Ennemi bloqueur de colonne — règle §6', () => {
  it('une unité ennemie infiltrée dans une colonne annule le scoring de cette colonne vers la base', () => {
    // P1 tient la ligne en row=5. P2 infiltre une unité en col=5, row=7 (entre P1 et la base P1).
    const avecBloqueur = buildUnits(
      [[1, 5], [5, 5], [9, 5]],   // p1 en ligne
      [[5, 7]],                    // p2 infiltré : col=5, plus proche de la base p1 que certains hexes
    )
    const sansBloq = buildUnits(
      [[1, 5], [5, 5], [9, 5]],
      [[5, 0]],                    // p2 en position de départ, sans pression
    )
    const scoreAvec = countTerritoryHexes(avecBloqueur).p1
    const scoreSans = countTerritoryHexes(sansBloq).p1
    // L'ennemi bloqueur en col=5 annule tous les hexes de col=5 entre lui et la base p1
    expect(scoreAvec).toBeLessThan(scoreSans)
  })
})

describe('Ennemi infiltré — repli de frontière et scoring réduit', () => {
  it('un ennemi derrière la ligne provoque un repli qui réduit le territoire scoré', () => {
    // P1 tient cols 3-9 en row=5. P2 infiltre une unité en col=6, row=6 (derrière la ligne P1).
    // La frontière doit replier pour exclure l'intrus → score P1 inférieur au cas sans infiltration.
    const avecInfiltré = buildUnits(
      [[3, 5], [6, 5], [9, 5]],
      [[6, 6]],                    // p2 infiltré derrière la frontière p1
    )
    const sansInfiltré = buildUnits(
      [[3, 5], [6, 5], [9, 5]],
      [[6, 0]],                    // p2 en position de départ
    )
    const scoreAvec = countTerritoryHexes(avecInfiltré).p1
    const scoreSans = countTerritoryHexes(sansInfiltré).p1
    expect(scoreAvec).toBeLessThan(scoreSans)
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
