import { useState, useEffect } from 'react'
import HexMap from './components/HexMap.jsx'
import { SQUADS, COLS, ROWS, generateMap } from './data/map.js'
import { getReachableHexes } from './engine/movement.js'
import { getThreatenedEnemies } from './engine/combat.js'
import { countTerritoryHexes } from './engine/territory.js'
import { computeAIMove, computeAIRespawn } from './engine/ai.js'

const MOVE_RANGE = 2
const AI_PLAYER = 'p2'
const AI_STEP_MS = 600 // TODO: dépend du territoire (§3 core-game.md)

const MAX_TURNS = 20
const PAD_LEFT = 52
const PAD_TOP = 16
const PAD_BOTTOM = 24
const INNER_W = 800
const INNER_H = 140
const TOTAL_W = PAD_LEFT + INNER_W
const TOTAL_H = PAD_TOP + INNER_H + PAD_BOTTOM
const X_TICKS = [0, 5, 10, 15, 20]
const Y_LEVELS = [0.5, 1]

function ScoreChart({ scoreHistory, units }) {
  const hasData = scoreHistory.p1.length > 0 || scoreHistory.p2.length > 0
  if (!hasData) return null

  const rawMax = Math.max(1, ...scoreHistory.p1, ...scoreHistory.p2)
  const domainMax = rawMax * 1.1

  function toCoords(history, playerKey) {
    return history.map((score, i) => {
      const turnIndex = playerKey === 'p1' ? i * 2 : i * 2 + 1
      const x = PAD_LEFT + (turnIndex / (MAX_TURNS - 1)) * INNER_W
      const y = PAD_TOP + INNER_H - (score / domainMax) * INNER_H
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
          const y = PAD_TOP + INNER_H - level * INNER_H
          const label = Math.round(level * domainMax)
          return (
            <g key={level}>
              <line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + INNER_W} y2={y} stroke="#30363d" strokeWidth="1" strokeDasharray="3 3" />
              <text x={PAD_LEFT - 4} y={y + 3.5} textAnchor="end" fontSize="11" fill="#6e7681" fontFamily="JetBrains Mono, monospace">{label}</text>
            </g>
          )
        })}

        {/* axe X */}
        <line x1={PAD_LEFT} y1={PAD_TOP + INNER_H} x2={PAD_LEFT + INNER_W} y2={PAD_TOP + INNER_H} stroke="#30363d" strokeWidth="1" />
        {X_TICKS.map(t => {
          const x = PAD_LEFT + (t / (MAX_TURNS - 1)) * INNER_W
          return (
            <g key={t}>
              <line x1={x} y1={PAD_TOP + INNER_H} x2={x} y2={PAD_TOP + INNER_H + 3} stroke="#30363d" strokeWidth="1" />
              <text x={x} y={PAD_TOP + INNER_H + 14} textAnchor="middle" fontSize="11" fill="#6e7681" fontFamily="JetBrains Mono, monospace">{t}</text>
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
  const [map] = useState(generateMap)
  const mountainHexes = map.flatMap((rowArr, row) =>
    rowArr.flatMap((type, col) => type === 'mountain' ? [{ col, row }] : [])
  )
  const [units, setUnits] = useState(initUnits)
  const [selectedUnit, setSelectedUnit] = useState(null) // { squadKey, unitIndex }
  const [targetHex, setTargetHex] = useState(null)       // { col, row }
  const [phase, setPhase] = useState('move')             // 'move' | 'respawn'
  const [respawnQueue, setRespawnQueue] = useState([])   // [{ squadKey, unit }]
  const [turn, setTurn] = useState(1)
  const [activePlayer, setActivePlayer] = useState('p1')
  const [scoreHistory, setScoreHistory] = useState({ p1: [], p2: [] })
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' && phase === 'move' && selectedUnit && targetHex && activePlayer !== AI_PLAYER) {
        e.preventDefault()
        handleConfirmMove()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase, selectedUnit, targetHex, activePlayer])

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
        mountainHexes,
      )
    : []

  const threatenedEnemies = phase === 'move' && selectedUnit && targetHex
    ? getThreatenedEnemies(selectedUnit, targetHex, units, mountainHexes)
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
      if (respawnQueue[0]?.squadKey === AI_PLAYER) return
      handleRespawnPlace(col, row)
      return
    }
    if (activePlayer === AI_PLAYER) return
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

  // IA : tour de mouvement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameOver || activePlayer !== AI_PLAYER || phase !== 'move') return

    const decision = computeAIMove(units, AI_PLAYER, mountainHexes)

    // Pré-calcul atomique de tous les changements d'état
    let nextUnits, capturedUnitsData, nextHistory

    if (decision) {
      const aiUnit = { squadKey: AI_PLAYER, unitIndex: decision.unitIndex }
      const target = { col: decision.col, row: decision.row }
      const threatened = getThreatenedEnemies(aiUnit, target, units, mountainHexes)

      capturedUnitsData = threatened.map(({ squadKey, unitIndex: ui }) => ({
        squadKey,
        unit: { ...units[squadKey].roster[ui] },
      }))

      nextUnits = { ...units }
      nextUnits[AI_PLAYER] = {
        ...nextUnits[AI_PLAYER],
        roster: nextUnits[AI_PLAYER].roster.map((u, i) =>
          i === decision.unitIndex ? { ...u, col: decision.col, row: decision.row, from: undefined } : u
        ),
      }

      const capturedBySquad = {}
      threatened.forEach(({ squadKey: sk, unitIndex: ui }) => {
        if (!capturedBySquad[sk]) capturedBySquad[sk] = new Set()
        capturedBySquad[sk].add(ui)
      })
      Object.entries(capturedBySquad).forEach(([sk, indices]) => {
        nextUnits[sk] = {
          ...nextUnits[sk],
          roster: nextUnits[sk].roster.filter((_, i) => !indices.has(i)),
        }
      })

      const playerScore = countTerritoryHexes(nextUnits)[AI_PLAYER] ?? 0
      nextHistory = {
        ...scoreHistory,
        [AI_PLAYER]: [...scoreHistory[AI_PLAYER], (scoreHistory[AI_PLAYER].at(-1) ?? 0) + playerScore],
      }
    } else {
      capturedUnitsData = []
      nextUnits = units
      const playerScore = countTerritoryHexes(units)[AI_PLAYER] ?? 0
      nextHistory = {
        ...scoreHistory,
        [AI_PLAYER]: [...scoreHistory[AI_PLAYER], (scoreHistory[AI_PLAYER].at(-1) ?? 0) + playerScore],
      }
    }

    const timers = []

    if (decision) {
      timers.push(setTimeout(() => setSelectedUnit({ squadKey: AI_PLAYER, unitIndex: decision.unitIndex }), AI_STEP_MS))
      timers.push(setTimeout(() => setTargetHex({ col: decision.col, row: decision.row }), AI_STEP_MS * 2))
    }

    timers.push(setTimeout(() => {
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
    }, decision ? AI_STEP_MS * 3 : AI_STEP_MS))

    return () => timers.forEach(clearTimeout)
  }, [activePlayer, phase, gameOver])

  // IA : phase de respawn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'respawn' || respawnQueue.length === 0) return
    if (respawnQueue[0].squadKey !== AI_PLAYER) return

    const hex = computeAIRespawn(respawnHexes, units, AI_PLAYER)
    if (!hex) return

    const { squadKey, unit } = respawnQueue[0]

    const t = setTimeout(() => {
      setUnits(prev => ({
        ...prev,
        [squadKey]: {
          ...prev[squadKey],
          roster: [...prev[squadKey].roster, { ...unit, col: hex.col, row: hex.row, from: undefined }],
        },
      }))

      const newQueue = respawnQueue.slice(1)
      setRespawnQueue(newQueue)
      if (newQueue.length === 0) setPhase('move')
    }, AI_STEP_MS)

    return () => clearTimeout(t)
  }, [phase, respawnQueue])

  function handleCancel() {
    setSelectedUnit(null)
    setTargetHex(null)
  }

  const p1Score = scoreHistory.p1.at(-1) ?? 0
  const p2Score = scoreHistory.p2.at(-1) ?? 0
  const winner = gameOver
    ? (p1Score > p2Score ? units.p1 : p2Score > p1Score ? units.p2 : null)
    : null

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

      <ScoreChart scoreHistory={scoreHistory} units={units} />

      <div style={{ marginBottom: 16 }}>
        {gameOver ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, letterSpacing: '0.15em' }}>
            <span style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 11 }}>// fin de partie</span>
            {winner ? (
              <>
                <span style={{ color: winner.color, fontWeight: 600 }}>{winner.label.split('//')[1].trim()}</span>
                <span style={{ color: 'var(--text-dim)' }}>victoire</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>égalité</span>
            )}
            <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
              {Object.entries(units).map(([key, squad]) => {
                const score = key === 'p1' ? p1Score : p2Score
                return <span key={key} style={{ marginLeft: 16 }}><span style={{ color: squad.color }}>{squad.label.split('//')[1].trim()}</span> {score} pts</span>
              })}
            </span>
          </div>
        ) : (
          <>
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
          </>
        )}
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
          map={map}
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
      </div>
    </div>
  )
}
