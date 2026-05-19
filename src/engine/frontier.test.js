import { describe, it, expect } from 'vitest'
import { computeFrontierPoints, checkExtensions } from './frontier.js'

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

  describe('Flanc ennemi hors du span allié', () => {
    // Ces tests couvrent le cas où un ennemi se retrouve à gauche de toutes les unités alliées
    // ou à droite — zone que le tracé ne peut pas couvrir. Le polygone de territoire ne doit
    // pas s'étendre de ce côté-là.

    it("un ennemi qui flanque à gauche, derrière la ligne, bloque l'extension gauche du territoire", () => {
      // Joueur bas (p1) : unités sur un span central.
      // Ennemi p2 glisse en col 0 (hors span) et se retrouve en retrait dans le territoire p1.
      // Attendu : leftBlocked=true → le polygone ne s'étend plus jusqu'au bord gauche.
      const ligne_p1 = [pt(100, 150), pt(300, 130), pt(500, 150)]
      const flanqueur = pt(30, 300) // hors span gauche, cy > ligne → territoire p1

      const frontierPts = computeFrontierPoints(ligne_p1, false, [flanqueur])
      const { leftBlocked, rightBlocked } = checkExtensions(frontierPts, false, [flanqueur])

      expect(leftBlocked).toBe(true)
      expect(rightBlocked).toBe(false)
    })

    it("un ennemi hors span mais devant la ligne ne bloque pas l'extension (il n'est pas dans le territoire)", () => {
      const ligne_p1 = [pt(100, 150), pt(300, 130), pt(500, 150)]
      const ennemi_devant = pt(30, 50) // hors span gauche, mais cy < ligne → devant, hors territoire

      const frontierPts = computeFrontierPoints(ligne_p1, false, [ennemi_devant])
      const { leftBlocked } = checkExtensions(frontierPts, false, [ennemi_devant])

      expect(leftBlocked).toBe(false)
    })

    it("un ennemi qui flanque à droite bloque l'extension droite du territoire", () => {
      const ligne_p1 = [pt(100, 150), pt(300, 130), pt(500, 150)]
      const flanqueur = pt(620, 300) // hors span droit, derrière la ligne

      const frontierPts = computeFrontierPoints(ligne_p1, false, [flanqueur])
      const { leftBlocked, rightBlocked } = checkExtensions(frontierPts, false, [flanqueur])

      expect(leftBlocked).toBe(false)
      expect(rightBlocked).toBe(true)
    })

    it("le joueur du haut est aussi protégé contre les flancs (isTop=true)", () => {
      // Joueur haut (p2) : territoire au-dessus de la ligne (cy plus petit = devant).
      // Ennemi qui flanque à gauche avec cy < frontierPts[0].cy → dans le territoire haut.
      const ligne_p2 = [pt(100, 200), pt(300, 220), pt(500, 200)]
      const flanqueur = pt(30, 80) // hors span gauche, cy < ligne → territoire p2

      const frontierPts = computeFrontierPoints(ligne_p2, true, [flanqueur])
      const { leftBlocked } = checkExtensions(frontierPts, true, [flanqueur])

      expect(leftBlocked).toBe(true)
    })
  })
})
