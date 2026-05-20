import { describe, it, expect } from 'vitest'
import { generateMap, COLS, ROWS } from './map.js'

describe('generateMap - symétrie', () => {
  it('les terrains mountain et water sont symétriques à 180°', () => {
    for (let i = 0; i < 20; i++) {
      const map = generateMap()
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const terrain = map[row][col]
          if (terrain === 'mountain' || terrain === 'water') {
            const mirrorCol = COLS - 1 - col
            const mirrorRow = ROWS - 1 - row
            expect(map[mirrorRow][mirrorCol]).toBe(terrain)
          }
        }
      }
    }
  })

  it('les zones de départ (rows 0 et 8) ne sont jamais modifiées', () => {
    for (let i = 0; i < 20; i++) {
      const map = generateMap()
      for (let col = 0; col < COLS; col++) {
        expect(map[0][col]).not.toBe('mountain')
        expect(map[0][col]).not.toBe('water')
        expect(map[8][col]).not.toBe('mountain')
        expect(map[8][col]).not.toBe('water')
      }
    }
  })
})
