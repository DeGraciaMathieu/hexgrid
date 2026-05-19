import { useState } from 'react'
import HexMap from './components/HexMap.jsx'
import { SQUADS, COLS, ROWS } from './data/map.js'
import { getReachableHexes } from './engine/movement.js'

const MOVE_RANGE = 3 // TODO: dépend du territoire (§3 core-game.md)

function initUnits() {
  return Object.fromEntries(
    Object.entries(SQUADS).map(([key, squad]) => [
      key,
      { ...squad, roster: squad.roster.map(u => ({ ...u })) },
    ])
  )
}

export default function App() {
  const [units, setUnits] = useState(initUnits)
  const [selectedUnit, setSelectedUnit] = useState(null) // { squadKey, unitIndex }
  const [targetHex, setTargetHex] = useState(null)       // { col, row }

  const reachableHexes = selectedUnit
    ? getReachableHexes(
        units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].col,
        units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].row,
        MOVE_RANGE,
        COLS,
        ROWS,
      )
    : []

  function handleSelectUnit(squadKey, unitIndex) {
    if (selectedUnit?.squadKey === squadKey && selectedUnit?.unitIndex === unitIndex) {
      setSelectedUnit(null)
      setTargetHex(null)
    } else {
      setSelectedUnit({ squadKey, unitIndex })
      setTargetHex(null)
    }
  }

  function handleSelectHex(col, row) {
    if (!selectedUnit) return
    const isReachable = reachableHexes.some(h => h.col === col && h.row === row)
    if (isReachable) setTargetHex({ col, row })
  }

  function handleConfirmMove() {
    if (!selectedUnit || !targetHex) return
    setUnits(prev => {
      const next = { ...prev }
      const roster = next[selectedUnit.squadKey].roster.map((u, i) =>
        i === selectedUnit.unitIndex ? { ...u, col: targetHex.col, row: targetHex.row, from: undefined } : u
      )
      next[selectedUnit.squadKey] = { ...next[selectedUnit.squadKey], roster }
      return next
    })
    setSelectedUnit(null)
    setTargetHex(null)
  }

  function handleCancel() {
    setSelectedUnit(null)
    setTargetHex(null)
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      <header style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 28,
        borderBottom: '1px dashed var(--line)',
        paddingBottom: 20,
      }}>
        <span style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
          // sector-07 / recon overlay
        </span>
        <h1 style={{
          fontFamily: "'Major Mono Display', monospace",
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          hex grid
        </h1>
        <span style={{ fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
          <span className="blink" />
          tactical map · 13 × 9 · 2 squads engaged
        </span>
      </header>

      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: 20,
      }}>
        <HexMap
          units={units}
          selectedUnit={selectedUnit}
          targetHex={targetHex}
          reachableHexes={reachableHexes}
          onSelectUnit={handleSelectUnit}
          onSelectHex={handleSelectHex}
        />

        {selectedUnit && (
          <div style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px dashed var(--line)',
            paddingTop: 16,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1 }}>
              {targetHex
                ? `déplacement vers (${targetHex.col.toString(16).toUpperCase()}·${targetHex.row.toString(16).toUpperCase()})`
                : 'sélectionnez une case de destination'}
            </span>
            {targetHex && (
              <button onClick={handleConfirmMove} style={{
                background: 'transparent',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '6px 16px',
                cursor: 'pointer',
                borderRadius: 2,
              }}>
                Confirmer
              </button>
            )}
            <button onClick={handleCancel} style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '6px 16px',
              cursor: 'pointer',
              borderRadius: 2,
            }}>
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
