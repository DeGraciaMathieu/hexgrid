import { describe, it, expect } from 'vitest'
import { computeFrontierPoints } from './frontier.js'

const pt = (cx, cy) => ({ cx, cy })

describe('computeFrontierPoints', () => {
  describe('joueur du bas (isTop=false, avance vers le haut = cy min)', () => {
    it('retourne tous les points si le milieu est plus avance', () => {
      const points = [pt(0, 100), pt(100, 50), pt(200, 100)]
      expect(computeFrontierPoints(points, false)).toEqual(points)
    })

    it('retire une unite interieure en retrait (cy trop eleve)', () => {
      const points = [pt(0, 100), pt(100, 150), pt(200, 100)]
      expect(computeFrontierPoints(points, false)).toEqual([pt(0, 100), pt(200, 100)])
    })

    it('conserve une seule unite', () => {
      expect(computeFrontierPoints([pt(50, 80)], false)).toEqual([pt(50, 80)])
    })

    it('conserve deux unites sans point intermediaire', () => {
      const points = [pt(0, 100), pt(200, 80)]
      expect(computeFrontierPoints(points, false)).toEqual(points)
    })

    it('retire plusieurs unites interieures successives', () => {
      const points = [pt(0, 100), pt(50, 130), pt(100, 140), pt(150, 120), pt(200, 100)]
      expect(computeFrontierPoints(points, false)).toEqual([pt(0, 100), pt(200, 100)])
    })

    it('conserve une unite saillante parmi les interieures', () => {
      const points = [pt(0, 100), pt(50, 120), pt(100, 60), pt(150, 120), pt(200, 100)]
      expect(computeFrontierPoints(points, false)).toEqual([pt(0, 100), pt(100, 60), pt(200, 100)])
    })
  })

  describe('joueur du haut (isTop=true, avance vers le bas = cy max)', () => {
    it('retourne tous les points si le milieu est plus avance', () => {
      const points = [pt(0, 100), pt(100, 150), pt(200, 100)]
      expect(computeFrontierPoints(points, true)).toEqual(points)
    })

    it('retire une unite interieure en retrait (cy trop faible)', () => {
      const points = [pt(0, 100), pt(100, 50), pt(200, 100)]
      expect(computeFrontierPoints(points, true)).toEqual([pt(0, 100), pt(200, 100)])
    })

    it('retire plusieurs unites interieures successives', () => {
      const points = [pt(0, 100), pt(50, 70), pt(100, 60), pt(150, 80), pt(200, 100)]
      expect(computeFrontierPoints(points, true)).toEqual([pt(0, 100), pt(200, 100)])
    })

    it('conserve une unite saillante parmi les interieures', () => {
      const points = [pt(0, 100), pt(50, 80), pt(100, 140), pt(150, 80), pt(200, 100)]
      expect(computeFrontierPoints(points, true)).toEqual([pt(0, 100), pt(100, 140), pt(200, 100)])
    })
  })

  describe('cas limites', () => {
    it('points colineaires : les intermediaires sont retires', () => {
      const points = [pt(0, 100), pt(100, 100), pt(200, 100)]
      expect(computeFrontierPoints(points, false)).toEqual([pt(0, 100), pt(200, 100)])
      expect(computeFrontierPoints(points, true)).toEqual([pt(0, 100), pt(200, 100)])
    })
  })
})
