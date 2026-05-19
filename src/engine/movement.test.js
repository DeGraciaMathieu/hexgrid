import { describe, it, expect } from 'vitest'
import { hexDistance, getReachableHexes } from './movement.js'

describe('hexDistance', () => {
  it('retourne 0 pour le même hex', () => {
    expect(hexDistance(0, 0, 0, 0)).toBe(0)
    expect(hexDistance(5, 3, 5, 3)).toBe(0)
  })

  it('retourne 1 pour les voisins directs (colonne paire)', () => {
    // voisins de (2, 2) col paire — hex intérieur pour éviter les bords
    expect(hexDistance(2, 2, 3, 2)).toBe(1)  // SE
    expect(hexDistance(2, 2, 3, 1)).toBe(1)  // NE
    expect(hexDistance(2, 2, 2, 3)).toBe(1)  // S
    expect(hexDistance(2, 2, 2, 1)).toBe(1)  // N
    expect(hexDistance(2, 2, 1, 2)).toBe(1)  // SW
    expect(hexDistance(2, 2, 1, 1)).toBe(1)  // NW
  })

  it('retourne 1 pour les voisins directs (colonne impaire)', () => {
    // voisins de (1, 1) col impaire
    expect(hexDistance(1, 1, 2, 1)).toBe(1)  // NE
    expect(hexDistance(1, 1, 2, 2)).toBe(1)  // SE
    expect(hexDistance(1, 1, 1, 2)).toBe(1)  // S
    expect(hexDistance(1, 1, 0, 1)).toBe(1)  // NW
    expect(hexDistance(1, 1, 0, 2)).toBe(1)  // SW
    expect(hexDistance(1, 1, 1, 0)).toBe(1)  // N
  })

  it('retourne 2 pour un hex à deux pas', () => {
    expect(hexDistance(0, 0, 2, 0)).toBe(2)
    expect(hexDistance(0, 0, 0, 2)).toBe(2)
  })

  it('retourne 3 pour un hex à trois pas', () => {
    expect(hexDistance(0, 0, 3, 0)).toBe(3)
    expect(hexDistance(0, 0, 0, 3)).toBe(3)
  })

  it('est symétrique', () => {
    expect(hexDistance(2, 3, 5, 1)).toBe(hexDistance(5, 1, 2, 3))
  })
})

describe('getReachableHexes', () => {
  const COLS = 13
  const ROWS = 9

  it('exclut le hex de départ', () => {
    const result = getReachableHexes(0, 0, 3, COLS, ROWS)
    expect(result.some(h => h.col === 0 && h.row === 0)).toBe(false)
  })

  it('inclut les voisins directs (distance 1)', () => {
    const result = getReachableHexes(4, 4, 3, COLS, ROWS)
    expect(result.some(h => h.col === 4 && h.row === 3)).toBe(true) // N
    expect(result.some(h => h.col === 4 && h.row === 5)).toBe(true) // S
  })

  it('exclut les hexes hors des limites du plateau', () => {
    const result = getReachableHexes(0, 0, 3, COLS, ROWS)
    expect(result.every(h => h.col >= 0 && h.col < COLS && h.row >= 0 && h.row < ROWS)).toBe(true)
  })

  it('exclut les hexes au-delà de la portée', () => {
    const result = getReachableHexes(6, 4, 1, COLS, ROWS)
    result.forEach(h => {
      expect(hexDistance(6, 4, h.col, h.row)).toBeLessThanOrEqual(1)
    })
  })

  it('retourne tous les hexes dans la portée', () => {
    const result = getReachableHexes(6, 4, 2, COLS, ROWS)
    result.forEach(h => {
      expect(hexDistance(6, 4, h.col, h.row)).toBeLessThanOrEqual(2)
    })
    // avec portée 2, on attend au moins 12 hexes (6 à dist 1 + 6+ à dist 2)
    expect(result.length).toBeGreaterThanOrEqual(12)
  })
})
