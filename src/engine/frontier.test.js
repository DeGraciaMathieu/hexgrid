import { describe, it, expect } from 'vitest'
import { computeFrontierPoints } from './frontier.js'

const pt = (cx, cy) => ({ cx, cy })

// Helpers lisibles
const estSurLaFrontiere = (frontier, unit) => frontier.includes(unit)
const estInterieure = (frontier, unit) => !frontier.includes(unit)

describe('Ligne de frontière', () => {
  describe('Sans unité ennemie — tracé optimal', () => {
    it('les unités en retrait sont des unités intérieures et ne contribuent pas au tracé', () => {
      const flanc_gauche  = pt(0,   100)
      const unite_interieure = pt(100, 200) // en arrière par rapport au front
      const flanc_droit   = pt(200, 100)

      const frontier = computeFrontierPoints([flanc_gauche, unite_interieure, flanc_droit], false)

      expect(estSurLaFrontiere(frontier, flanc_gauche)).toBe(true)
      expect(estSurLaFrontiere(frontier, flanc_droit)).toBe(true)
      expect(estInterieure(frontier, unite_interieure)).toBe(true)
    })

    it('une unité plus avancée que la ligne directe est incluse dans la frontière', () => {
      const flanc_gauche  = pt(0,   100)
      const pointe        = pt(100,  50) // saillante vers l'ennemi
      const flanc_droit   = pt(200, 100)

      const frontier = computeFrontierPoints([flanc_gauche, pointe, flanc_droit], false)

      expect(estSurLaFrontiere(frontier, pointe)).toBe(true)
    })

    it('le joueur du haut (isTop=true) obéit à la même logique en sens inverse', () => {
      const flanc_gauche  = pt(0,   100)
      const unite_interieure = pt(100,  50) // en retrait pour le joueur du haut
      const flanc_droit   = pt(200, 100)

      const frontier = computeFrontierPoints([flanc_gauche, unite_interieure, flanc_droit], true)

      expect(estInterieure(frontier, unite_interieure)).toBe(true)
    })
  })

  describe('Ennemi infiltré dans le territoire', () => {
    it("une unité intérieure est promue sur la frontière pour exclure l'ennemi", () => {
      const flanc_gauche     = pt(0,   100)
      const unite_interieure = pt(100, 150) // normalement hors tracé
      const flanc_droit      = pt(200, 100)
      const ennemi_infiltre  = pt(50,  120) // derrière la ligne directe → territoire

      const sans_ennemi = computeFrontierPoints(
        [flanc_gauche, unite_interieure, flanc_droit], false
      )
      const avec_ennemi = computeFrontierPoints(
        [flanc_gauche, unite_interieure, flanc_droit], false, [ennemi_infiltre]
      )

      expect(estInterieure(sans_ennemi, unite_interieure)).toBe(true) // intérieure sans brèche
      expect(estSurLaFrontiere(avec_ennemi, unite_interieure)).toBe(true) // promue lors de la brèche
    })

    it("un ennemi hors territoire (devant la ligne) ne modifie pas le tracé", () => {
      const flanc_gauche  = pt(0,   100)
      const flanc_droit   = pt(200, 100)
      const ennemi_devant = pt(100,  50) // plus avancé que notre ligne → hors territoire

      const sans_ennemi = computeFrontierPoints([flanc_gauche, flanc_droit], false)
      const avec_ennemi = computeFrontierPoints([flanc_gauche, flanc_droit], false, [ennemi_devant])

      expect(avec_ennemi).toEqual(sans_ennemi)
    })

    it("la frontière se replie sur les extrémités si aucun contournement n'est possible", () => {
      // Ennemi profondément infiltré, pas d'unité intérieure pour le contourner
      const flanc_gauche      = pt(0,   100)
      const flanc_droit       = pt(200, 100)
      const ennemi_non_evitable = pt(100, 300)

      const frontier = computeFrontierPoints(
        [flanc_gauche, flanc_droit], false, [ennemi_non_evitable]
      )

      expect(frontier).toEqual([flanc_gauche, flanc_droit])
    })

    it("deux ennemis infiltrés en zones différentes sont tous deux exclus du territoire", () => {
      // Les deux ennemis sont assez profonds pour qu'aucun chemin ne puisse en exclure
      // un seul : le seul chemin valide passe par les deux unités intérieures.
      const flanc_gauche   = pt(0,   100)
      const unite_milieu_g = pt(75,  150)
      const unite_milieu_d = pt(125, 150)
      const flanc_droit    = pt(200, 100)
      const ennemi_gauche  = pt(50,  130) // profond côté gauche
      const ennemi_droit   = pt(150, 130) // profond côté droit

      const frontier = computeFrontierPoints(
        [flanc_gauche, unite_milieu_g, unite_milieu_d, flanc_droit],
        false,
        [ennemi_gauche, ennemi_droit],
      )

      // Le seul chemin valide est FG → UMG → UMD → FD :
      // les deux unités intérieures sont promues sur la frontière.
      expect(estSurLaFrontiere(frontier, unite_milieu_g)).toBe(true)
      expect(estSurLaFrontiere(frontier, unite_milieu_d)).toBe(true)
    })

    it("le joueur du haut (isTop=true) voit aussi sa frontière se déformer lors d'une brèche", () => {
      const flanc_gauche     = pt(0,   100)
      const unite_interieure = pt(100,  50) // en retrait pour le joueur du haut
      const flanc_droit      = pt(200, 100)
      const ennemi_infiltre  = pt(50,   90) // derrière la ligne directe → territoire haut

      const sans_ennemi = computeFrontierPoints(
        [flanc_gauche, unite_interieure, flanc_droit], true
      )
      const avec_ennemi = computeFrontierPoints(
        [flanc_gauche, unite_interieure, flanc_droit], true, [ennemi_infiltre]
      )

      expect(estInterieure(sans_ennemi, unite_interieure)).toBe(true)
      expect(estSurLaFrontiere(avec_ennemi, unite_interieure)).toBe(true)
    })
  })
})
