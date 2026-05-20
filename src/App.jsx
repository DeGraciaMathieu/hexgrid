import { useState } from 'react'
import HexMap from './components/HexMap.jsx'
import { SQUADS, COLS, ROWS } from './data/map.js'
import { getReachableHexes } from './engine/movement.js'
import { getThreatenedEnemies } from './engine/combat.js'
import { countTerritoryHexes } from './engine/territory.js'

const MOVE_RANGE = 2 // TODO: dépend du territoire (§3 core-game.md)

const MAX_TURNS = 20
const PAD_LEFT = 36
const PAD_BOTTOM = 18
const INNER_W = 320
const INNER_H = 220
const TOTAL_W = PAD_LEFT + INNER_W
const TOTAL_H = INNER_H + PAD_BOTTOM
const X_TICKS = [0, 5, 10, 15, 20]
const Y_LEVELS = [0.25, 0.5, 0.75, 1]

function ScoreChart({ scoreHistory, units }) {
  const hasData = scoreHistory.p1.length > 0 || scoreHistory.p2.length > 0
  if (!hasData) return null

  const maxScore = Math.max(1, ...scoreHistory.p1, ...scoreHistory.p2)

  function toCoords(history, playerKey) {
    return history.map((score, i) => {
      const turnIndex = playerKey === 'p1' ? i * 2 : i * 2 + 1
      const x = PAD_LEFT + (turnIndex / (MAX_TURNS - 1)) * INNER_W
      const y = INNER_H - (score / maxScore) * INNER_H
      return { x, y }
    })
  }

  return (
    <div style={{ marginBottom: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 4, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
        territoire · historique
      </div>
      <svg width="100%" viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`} style={{ display: 'block' }}>

        {/* grille horizontale */}
        {Y_LEVELS.map(level => {
          const y = INNER_H - level * INNER_H
          const label = Math.round(level * maxScore)
          return (
            <g key={level}>
              <line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + INNER_W} y2={y} stroke="#30363d" strokeWidth="1" strokeDasharray="3 3" />
              <text x={PAD_LEFT - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="#6e7681" fontFamily="JetBrains Mono, monospace">{label}</text>
            </g>
          )
        })}

        {/* axe X */}
        <line x1={PAD_LEFT} y1={INNER_H} x2={PAD_LEFT + INNER_W} y2={INNER_H} stroke="#30363d" strokeWidth="1" />
        {X_TICKS.map(t => {
          const x = PAD_LEFT + (t / (MAX_TURNS - 1)) * INNER_W
          return (
            <g key={t}>
              <line x1={x} y1={INNER_H} x2={x} y2={INNER_H + 3} stroke="#30363d" strokeWidth="1" />
              <text x={x} y={INNER_H + 11} textAnchor="middle" fontSize="8" fill="#6e7681" fontFamily="JetBrains Mono, monospace">{t}</text>
            </g>
          )
        })}

        {/* courbes */}
        {Object.entries(scoreHistory).map(([key, history]) => {
          const coords = toCoords(history, key)
          if (coords.length === 0) return null
          const color = units[key].color
          if (coords.length === 1) {
            return <circle key={key} cx={coords[0].x} cy={coords[0].y} r="2.5" fill={color} opacity="0.85" />
          }
          return (
            <polyline
              key={key}
              points={coords.map(c => `${c.x},${c.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 20, marginTop: 6, fontSize: 11, letterSpacing: '0.15em' }}>
        {Object.entries(units).map(([key, squad]) => {
          const last = scoreHistory[key].at(-1) ?? 0
          return (
            <span key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: squad.color }}>{squad.label.split('//')[1].trim()}</span>
              <span style={{ color: 'var(--text-dim)' }}>{last} pts</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function initUnits() {
  return Object.fromEntries(
    Object.entries(SQUADS).map(([key, squad]) => [
      key,
      { ...squad, roster: squad.roster.map(({ from: _, ...u }) => u) },
    ])
  )
}

export default function App() {
  const [units, setUnits] = useState(initUnits)
  const [selectedUnit, setSelectedUnit] = useState(null) // { squadKey, unitIndex }
  const [targetHex, setTargetHex] = useState(null)       // { col, row }
  const [phase, setPhase] = useState('move')             // 'move' | 'respawn'
  const [respawnQueue, setRespawnQueue] = useState([])   // [{ squadKey, unit }]
  const [turn, setTurn] = useState(1)
  const [activePlayer, setActivePlayer] = useState('p1')
  const [scoreHistory, setScoreHistory] = useState({ p1: [], p2: [] })
  const [gameOver, setGameOver] = useState(false)

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
    if (squadKey !== activePlayer) return
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

    const nextUnits = { ...units }

    const roster = nextUnits[selectedUnit.squadKey].roster.map((u, i) =>
      i === selectedUnit.unitIndex ? { ...u, col: targetHex.col, row: targetHex.row, from: undefined } : u
    )
    nextUnits[selectedUnit.squadKey] = { ...nextUnits[selectedUnit.squadKey], roster }

    const capturedBySquad = {}
    threatenedEnemies.forEach(({ squadKey, unitIndex }) => {
      if (!capturedBySquad[squadKey]) capturedBySquad[squadKey] = new Set()
      capturedBySquad[squadKey].add(unitIndex)
    })
    Object.entries(capturedBySquad).forEach(([squadKey, indices]) => {
      nextUnits[squadKey] = {
        ...nextUnits[squadKey],
        roster: nextUnits[squadKey].roster.filter((_, i) => !indices.has(i)),
      }
    })

    const territoryCounts = countTerritoryHexes(nextUnits)
    const playerScore = territoryCounts[activePlayer] ?? 0

    const nextHistory = {
      ...scoreHistory,
      [activePlayer]: [...scoreHistory[activePlayer], (scoreHistory[activePlayer].at(-1) ?? 0) + playerScore],
    }

    setUnits(nextUnits)
    setSelectedUnit(null)
    setTargetHex(null)
    setScoreHistory(nextHistory)

    if (capturedUnitsData.length > 0) {
      setRespawnQueue(capturedUnitsData)
      setPhase('respawn')
    }

    if (turn === 20) {
      setGameOver(true)
      return
    }

    setTurn(t => t + 1)
    setActivePlayer(p => p === 'p1' ? 'p2' : 'p1')
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

  if (gameOver) {
    const p1Score = scoreHistory.p1.at(-1) ?? 0
    const p2Score = scoreHistory.p2.at(-1) ?? 0
    const winner = p1Score > p2Score ? units.p1 : p2Score > p1Score ? units.p2 : null
    return (
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            // fin de partie · tour 20
          </div>
          {winner ? (
            <>
              <div style={{ fontFamily: "'Major Mono Display', monospace", fontSize: 'clamp(24px, 4vw, 36px)', color: winner.color, marginBottom: 8 }}>
                {winner.label.split('//')[1].trim()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 32 }}>
                victoire
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Major Mono Display', monospace", fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--text)', marginBottom: 8 }}>
                égalité
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 32 }}>
                même score
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 40 }}>
            {Object.entries(units).map(([key, squad]) => {
              const score = key === 'p1' ? p1Score : p2Score
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.2em', color: squad.color, textTransform: 'uppercase' }}>
                    {squad.label.split('//')[1].trim()}
                  </span>
                  <span style={{ fontFamily: "'Major Mono Display', monospace", fontSize: 28, color: 'var(--text)' }}>
                    {score}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>pts</span>
                </div>
              )
            })}
          </div>
          <ScoreChart scoreHistory={scoreHistory} units={units} />
        </div>
      </div>
    )
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

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: 6 }}>
          <span style={{ color: units[activePlayer].color, textTransform: 'uppercase' }}>
            {units[activePlayer].label.split('//')[1].trim()}
          </span>
          <span><span style={{ color: 'var(--text)' }}>{turn}</span> / 20</span>
        </div>
        <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(turn / 20) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
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
        <div style={{ width: 260, flexShrink: 0 }}>
          <ScoreChart scoreHistory={scoreHistory} units={units} />
        </div>
      </div>
    </div>
  )
}
