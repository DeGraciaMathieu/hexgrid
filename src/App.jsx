import { useState, useEffect } from 'react'
import HexMap from './components/HexMap.jsx'
import StartScreen from './components/StartScreen.jsx'
import { SQUADS, COLS, ROWS, MOVE_RANGE, generateMap } from './data/map.js'
import { getReachableHexes } from './engine/movement.js'
import { getThreatenedEnemies } from './engine/combat.js'
import { countTerritoryHexes } from './engine/territory.js'
import { computeAIMove, computeAIRespawn } from './engine/ai.js'
import { applyMove, applyRespawn, MAX_TURNS } from './engine/gameflow.js'

const AI_PLAYER = 'p2'
const AI_STEP_MS = 600 // TODO: dépend du territoire (§3 core-game.md)

function initUnits() {
  return Object.fromEntries(
    Object.entries(SQUADS).map(([key, squad]) => [
      key,
      { ...squad, roster: squad.roster.map(({ from: _, ...u }) => u) },
    ])
  )
}

export default function App() {
  const [gameMode, setGameMode] = useState(null)
  const [map] = useState(generateMap)
  const mountainHexes = map.flatMap((rowArr, row) =>
    rowArr.flatMap((type, col) => type === 'mountain' ? [{ col, row }] : [])
  )
  const waterHexes = map.flatMap((rowArr, row) =>
    rowArr.flatMap((type, col) => type === 'water' ? [{ col, row }] : [])
  )
  const impassableHexes = [...mountainHexes, ...waterHexes]
  const [units, setUnits] = useState(initUnits)
  const [selectedUnit, setSelectedUnit] = useState(null) // { squadKey, unitIndex }
  const [targetHex, setTargetHex] = useState(null)       // { col, row }
  const [phase, setPhase] = useState('move')             // 'move' | 'respawn'
  const [respawnQueue, setRespawnQueue] = useState([])   // [{ squadKey, unit }]
  const [turn, setTurn] = useState(1)
  const [activePlayer, setActivePlayer] = useState('p1')
  const [scoreHistory, setScoreHistory] = useState({ p1: [], p2: [] })
  const [gameOver, setGameOver] = useState(false)
  const [pendingGameOver, setPendingGameOver] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' && phase === 'move' && selectedUnit && targetHex && !(gameMode === 'ai' && activePlayer === AI_PLAYER)) {
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
        impassableHexes,
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
    if (gameMode === 'ai' && activePlayer === AI_PLAYER) return
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
      if (gameMode === 'ai' && respawnQueue[0]?.squadKey === AI_PLAYER) return
      handleRespawnPlace(col, row)
      return
    }
    if (gameMode === 'ai' && activePlayer === AI_PLAYER) return
    if (!selectedUnit) return
    const isReachable = reachableHexes.some(h => h.col === col && h.row === row)
    if (isReachable) setTargetHex({ col, row })
  }

  function handleConfirmMove() {
    if (!selectedUnit || !targetHex) return

    const next = applyMove(
      { units, turn, activePlayer, scoreHistory, phase, respawnQueue, gameOver, pendingGameOver },
      { selectedUnit, targetHex },
      mountainHexes,
    )

    setUnits(next.units)
    setSelectedUnit(null)
    setTargetHex(null)
    setScoreHistory(next.scoreHistory)
    setRespawnQueue(next.respawnQueue)
    setPhase(next.phase)
    setTurn(next.turn)
    setActivePlayer(next.activePlayer)
    setGameOver(next.gameOver)
    setPendingGameOver(next.pendingGameOver)
  }

  function handleRespawnPlace(col, row) {
    const isValid = respawnHexes.some(h => h.col === col && h.row === row)
    if (!isValid) return

    const next = applyRespawn(
      { units, respawnQueue, phase, pendingGameOver, gameOver },
      { col, row },
    )

    setUnits(next.units)
    setRespawnQueue(next.respawnQueue)
    setPhase(next.phase)
    setGameOver(next.gameOver)
    setPendingGameOver(next.pendingGameOver)
  }

  // IA : tour de mouvement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameMode !== 'ai' || gameOver || activePlayer !== AI_PLAYER || phase !== 'move') return

    const decision = computeAIMove(units, AI_PLAYER, mountainHexes, waterHexes)
    const timers = []

    if (decision) {
      const next = applyMove(
        { units, turn, activePlayer, scoreHistory, phase, respawnQueue, gameOver, pendingGameOver },
        { selectedUnit: { squadKey: AI_PLAYER, unitIndex: decision.unitIndex }, targetHex: { col: decision.col, row: decision.row } },
        mountainHexes,
      )

      timers.push(setTimeout(() => setSelectedUnit({ squadKey: AI_PLAYER, unitIndex: decision.unitIndex }), AI_STEP_MS))
      timers.push(setTimeout(() => setTargetHex({ col: decision.col, row: decision.row }), AI_STEP_MS * 2))
      timers.push(setTimeout(() => {
        setUnits(next.units)
        setSelectedUnit(null)
        setTargetHex(null)
        setScoreHistory(next.scoreHistory)
        setRespawnQueue(next.respawnQueue)
        setPhase(next.phase)
        setTurn(next.turn)
        setActivePlayer(next.activePlayer)
        setGameOver(next.gameOver)
        setPendingGameOver(next.pendingGameOver)
      }, AI_STEP_MS * 3))
    } else {
      const playerScore = countTerritoryHexes(units)[AI_PLAYER] ?? 0
      const nextHistory = {
        ...scoreHistory,
        [AI_PLAYER]: [...scoreHistory[AI_PLAYER], (scoreHistory[AI_PLAYER].at(-1) ?? 0) + playerScore],
      }
      timers.push(setTimeout(() => {
        setScoreHistory(nextHistory)
        if (turn === 20) {
          setGameOver(true)
          return
        }
        setTurn(t => t + 1)
        setActivePlayer(p => p === 'p1' ? 'p2' : 'p1')
      }, AI_STEP_MS))
    }

    return () => timers.forEach(clearTimeout)
  }, [activePlayer, phase, gameOver, pendingGameOver])

  // IA : phase de respawn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (gameMode !== 'ai' || phase !== 'respawn' || respawnQueue.length === 0) return
    if (respawnQueue[0].squadKey !== AI_PLAYER) return

    const hex = computeAIRespawn(respawnHexes, units, AI_PLAYER)
    if (!hex) return

    const t = setTimeout(() => {
      const next = applyRespawn(
        { units, respawnQueue, phase, pendingGameOver, gameOver },
        hex,
      )
      setUnits(next.units)
      setRespawnQueue(next.respawnQueue)
      setPhase(next.phase)
      setGameOver(next.gameOver)
      setPendingGameOver(next.pendingGameOver)
    }, AI_STEP_MS)

    return () => clearTimeout(t)
  }, [phase, respawnQueue, pendingGameOver])

  function handleCancel() {
    setSelectedUnit(null)
    setTargetHex(null)
  }

  const p1Score = scoreHistory.p1.at(-1) ?? 0
  const p2Score = scoreHistory.p2.at(-1) ?? 0
  const winner = gameOver
    ? (p1Score > p2Score ? units.p1 : p2Score > p1Score ? units.p2 : null)
    : null

  if (gameMode === null) {
    return <StartScreen onSelect={setGameMode} />
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
