import { MAX_TURNS } from '../engine/gameflow.js'

const PAD_LEFT = 52
const PAD_TOP = 16
const PAD_BOTTOM = 24
const INNER_W = 800
const INNER_H = 140
const TOTAL_W = PAD_LEFT + INNER_W
const TOTAL_H = PAD_TOP + INNER_H + PAD_BOTTOM
const X_TICKS = [0, 5, 10, 15, 20]
const Y_LEVELS = [0.5, 1]

export default function ScoreChart({ scoreHistory, units }) {
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
