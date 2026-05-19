import { useState } from 'react'
import HexMap from './components/HexMap.jsx'
import { SQUADS, COLS, ROWS } from './data/map.js'
import { getReachableHexes } from './engine/movement.js'
import { getThreatenedEnemies } from './engine/combat.js'
import { countTerritoryHexes } from './engine/territory.js'

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
  const [phase, setPhase] = useState('move')             // 'move' | 'respawn'
  const [respawnQueue, setRespawnQueue] = useState([])   // [{ squadKey, unit }]

  const occupiedHexes = selectedUnit
    ? Object.entries(units).flatMap(([key, squad]) =>
        squad.roster.flatMap((u, i) =>
          key === selectedUnit.squadKey && i === selectedUnit.unitIndex ? [] : [{ col: u.col, row: u.row }]
        )
      )
    : []

  const reachableHexes = phase === 'move' && selectedUnit
    ? getReachableHexes(
        units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].col,
        units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].row,
        MOVE_RANGE,
        COLS,
        ROWS,
        occupiedHexes,
      )
    : []

  const threatenedEnemies = phase === 'move' && selectedUnit && targetHex
    ? getThreatenedEnemies(selectedUnit, targetHex, units)
    : []

  const respawnHexes = (() => {
    if (phase !== 'respawn' || respawnQueue.length === 0) return []
    const { squadKey } = respawnQueue[0]
    const startRow = SQUADS[squadKey].startRow
    const occupiedSet = new Set(
      Object.values(units).flatMap(s => s.roster.map(u => `${u.col},${u.row}`))
    )
    return Array.from({ length: COLS }, (_, col) => ({ col, row: startRow }))
      .filter(h => !occupiedSet.has(`${h.col},${h.row}`))
  })()

  function handleSelectUnit(squadKey, unitIndex) {
    if (phase === 'respawn') return
    if (selectedUnit?.squadKey === squadKey && selectedUnit?.unitIndex === unitIndex) {
      setSelectedUnit(null)
      setTargetHex(null)
    } else {
      setSelectedUnit({ squadKey, unitIndex })
      setTargetHex(null)
    }
  }

  function handleSelectHex(col, row) {
    if (phase === 'respawn') {
      handleRespawnPlace(col, row)
      return
    }
    if (!selectedUnit) return
    const isReachable = reachableHexes.some(h => h.col === col && h.row === row)
    if (isReachable) setTargetHex({ col, row })
  }

  function handleConfirmMove() {
    if (!selectedUnit || !targetHex) return

    const capturedUnitsData = threatenedEnemies.map(({ squadKey, unitIndex }) => ({
      squadKey,
      unit: { ...units[squadKey].roster[unitIndex] },
    }))

    setUnits(prev => {
      const next = { ...prev }

      const roster = next[selectedUnit.squadKey].roster.map((u, i) =>
        i === selectedUnit.unitIndex ? { ...u, col: targetHex.col, row: targetHex.row, from: undefined } : u
      )
      next[selectedUnit.squadKey] = { ...next[selectedUnit.squadKey], roster }

      const capturedBySquad = {}
      threatenedEnemies.forEach(({ squadKey, unitIndex }) => {
        if (!capturedBySquad[squadKey]) capturedBySquad[squadKey] = new Set()
        capturedBySquad[squadKey].add(unitIndex)
      })
      Object.entries(capturedBySquad).forEach(([squadKey, indices]) => {
        next[squadKey] = {
          ...next[squadKey],
          roster: next[squadKey].roster.filter((_, i) => !indices.has(i)),
        }
      })

      return next
    })

    setSelectedUnit(null)
    setTargetHex(null)

    if (capturedUnitsData.length > 0) {
      setRespawnQueue(capturedUnitsData)
      setPhase('respawn')
    }
  }

  function handleRespawnPlace(col, row) {
    const isValid = respawnHexes.some(h => h.col === col && h.row === row)
    if (!isValid) return

    const { squadKey, unit } = respawnQueue[0]
    setUnits(prev => {
      const next = { ...prev }
      next[squadKey] = {
        ...next[squadKey],
        roster: [...next[squadKey].roster, { ...unit, col, row, from: undefined }],
      }
      return next
    })

    const newQueue = respawnQueue.slice(1)
    setRespawnQueue(newQueue)
    if (newQueue.length === 0) setPhase('move')
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
        {(() => {
          const counts = countTerritoryHexes(units)
          return (
            <div style={{ display: 'flex', gap: 24, fontSize: 12, letterSpacing: '0.15em', marginTop: 4 }}>
              {Object.entries(units).map(([key, squad]) => (
                <span key={key}>
                  <span style={{ color: squad.color }}>{squad.label.split('//')[1].trim()}</span>
                  <span style={{ color: 'var(--text-dim)' }}> · {counts[key] ?? 0} hex</span>
                </span>
              ))}
            </div>
          )
        })()}
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
          threatenedEnemies={threatenedEnemies}
          respawnHexes={respawnHexes}
          respawnSquadColor={phase === 'respawn' && respawnQueue.length > 0 ? units[respawnQueue[0].squadKey].color : null}
          onSelectUnit={handleSelectUnit}
          onSelectHex={handleSelectHex}
        />

        {phase === 'respawn' && respawnQueue.length > 0 && (
          <div style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px dashed var(--line)',
            paddingTop: 16,
          }}>
            <span style={{ fontSize: 12, flex: 1 }}>
              <span style={{ color: units[respawnQueue[0].squadKey].color, fontWeight: 600 }}>
                [{respawnQueue[0].unit.code}] {respawnQueue[0].unit.name}
              </span>
              <span style={{ color: 'var(--text-dim)' }}> — sélectionnez une case sur la ligne de départ</span>
            </span>
          </div>
        )}

        {phase === 'move' && selectedUnit && (
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
