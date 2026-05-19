import { useState } from 'react'
import { COLS, ROWS, HEX_SIZE, TERRAIN, MAP } from '../data/map.js'
import { computeFrontierPoints } from '../engine/frontier.js'

const PADDING = 20
const W = 2 * HEX_SIZE
const H = Math.sqrt(3) * HEX_SIZE
const HSPACE = 1.5 * HEX_SIZE
const VSPACE = H

const SVG_W = HSPACE * (COLS - 1) + W + PADDING * 2
const SVG_H = VSPACE * (ROWS - 1) + H + VSPACE / 2 + PADDING * 2

function hexCenter(col, row) {
  const cx = PADDING + HEX_SIZE + col * HSPACE
  const cy = PADDING + H / 2 + row * VSPACE + (col % 2 === 1 ? VSPACE / 2 : 0)
  return { cx, cy }
}

function hexPoints(cx, cy, size) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    pts.push(`${(cx + size * Math.cos(angle)).toFixed(2)},${(cy + size * Math.sin(angle)).toFixed(2)}`)
  }
  return pts.join(' ')
}

function InfluenceZones({ units }) {
  return (
    <>
      <defs>
        {Object.entries(units).map(([key, squad]) => (
          <pattern
            key={key}
            id={`zone-${key}`}
            patternUnits="userSpaceOnUse"
            width="12"
            height="12"
            patternTransform="rotate(45)"
          >
            <rect width="12" height="12" fill={squad.color} opacity="0.05" />
            <line x1="0" y1="0" x2="0" y2="12" stroke={squad.color} strokeWidth="1.5" opacity="0.35" />
          </pattern>
        ))}
      </defs>

      {Object.entries(units).map(([key, squad]) => {
        const sorted = [...squad.roster].sort((a, b) => a.col - b.col)
        const unitPts = sorted.map(u => hexCenter(u.col, u.row))
        const avgY = unitPts.reduce((s, p) => s + p.cy, 0) / unitPts.length
        const isTop = avgY < SVG_H / 2
        const edgeY = isTop ? 0 : SVG_H

        const enemyPts = Object.entries(units)
          .filter(([k]) => k !== key)
          .flatMap(([, s]) => s.roster.map(u => hexCenter(u.col, u.row)))

        const frontierPts = computeFrontierPoints(unitPts, isTop, enemyPts)

        const pts = [
          `0,${edgeY}`,
          `0,${frontierPts[0].cy.toFixed(2)}`,
          ...frontierPts.map(p => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`),
          `${SVG_W},${frontierPts[frontierPts.length - 1].cy.toFixed(2)}`,
          `${SVG_W},${edgeY}`,
        ].join(' ')

        return (
          <polygon
            key={key}
            points={pts}
            fill={`url(#zone-${key})`}
            style={{ pointerEvents: 'none' }}
          />
        )
      })}
    </>
  )
}

function SquadLines({ units }) {
  return Object.entries(units).map(([key, squad], i) => {
    const sorted = [...squad.roster].sort((a, b) => a.col - b.col)
    const unitPts = sorted.map(u => hexCenter(u.col, u.row))
    const avgY = unitPts.reduce((s, p) => s + p.cy, 0) / unitPts.length
    const isTop = avgY < SVG_H / 2
    const enemyPts = Object.entries(units)
      .filter(([k]) => k !== key)
      .flatMap(([, s]) => s.roster.map(u => hexCenter(u.col, u.row)))
    const frontierPts = computeFrontierPoints(unitPts, isTop, enemyPts)
    const pts = frontierPts.map(p => `${p.cx.toFixed(2)},${p.cy.toFixed(2)}`).join(' ')

    return (
      <polyline
        key={i}
        points={pts}
        fill="none"
        stroke={squad.color}
        strokeWidth="1.8"
        opacity="0.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${squad.color})` }}
      />
    )
  })
}

function MovementTrails({ units }) {
  return Object.values(units).map(squad =>
    squad.roster
      .filter(u => u.from)
      .map((unit, i) => {
        const from = hexCenter(unit.from[0], unit.from[1])
        const to = hexCenter(unit.col, unit.row)
        return (
          <g key={`${squad.color}-${i}`}>
            <line
              x1={from.cx} y1={from.cy}
              x2={to.cx} y2={to.cy}
              stroke={squad.color}
              strokeWidth="2.5"
              opacity="0.7"
              className="movement-trail"
            />
            <circle
              cx={from.cx} cy={from.cy}
              r={HEX_SIZE * 0.35}
              fill="none"
              stroke={squad.color}
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.45"
            />
          </g>
        )
      })
  )
}

function ReachableOverlay({ reachableHexes, color }) {
  if (!reachableHexes.length) return null
  return reachableHexes.map(({ col, row }) => {
    const { cx, cy } = hexCenter(col, row)
    return (
      <polygon
        key={`reach-${col}-${row}`}
        points={hexPoints(cx, cy, HEX_SIZE - 1.5)}
        fill={color}
        opacity="0.18"
        style={{ pointerEvents: 'none' }}
      />
    )
  })
}

function TargetPlaceholder({ targetHex, fromHex, color }) {
  if (!targetHex) return null
  const { cx, cy } = hexCenter(targetHex.col, targetHex.row)
  const from = fromHex ? hexCenter(fromHex.col, fromHex.row) : null
  return (
    <g style={{ pointerEvents: 'none' }}>
      {from && (
        <>
          <line
            x1={from.cx} y1={from.cy}
            x2={cx} y2={cy}
            stroke={color}
            strokeWidth="2.5"
            opacity="0.7"
            className="movement-trail"
          />
          <circle
            cx={from.cx} cy={from.cy}
            r={HEX_SIZE * 0.35}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.45"
          />
        </>
      )}
      <polygon
        points={hexPoints(cx, cy, HEX_SIZE - 1.5)}
        fill={color}
        opacity="0.25"
      />
      <circle
        cx={cx} cy={cy}
        r={HEX_SIZE * 0.55}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.8"
      />
    </g>
  )
}

function Units({ units, selectedUnit, onSelectUnit, onHover }) {
  return Object.entries(units).map(([squadKey, squad]) =>
    squad.roster.map((unit, unitIndex) => {
      const { cx, cy } = hexCenter(unit.col, unit.row)
      const isSelected = selectedUnit?.squadKey === squadKey && selectedUnit?.unitIndex === unitIndex
      return (
        <g key={`${squadKey}-${unitIndex}`}>
          <circle
            cx={cx} cy={cy}
            r={HEX_SIZE * 0.65}
            fill={squad.color}
            stroke="#ffffff"
            strokeWidth={isSelected ? 2.5 : 1.5}
            style={{
              filter: isSelected
                ? `drop-shadow(0 0 12px ${squad.color}) drop-shadow(0 0 4px ${squad.color})`
                : `drop-shadow(0 0 8px ${squad.color}) drop-shadow(0 0 2px ${squad.color})`,
            }}
          />
          {isSelected && (
            <circle
              cx={cx} cy={cy}
              r={HEX_SIZE * 0.75}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
              style={{ pointerEvents: 'none' }}
            />
          )}
          <text
            x={cx} y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              fill: '#ffffff',
              paintOrder: 'stroke',
              stroke: 'rgba(0,0,0,0.6)',
              strokeWidth: '0.5px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {unit.code}
          </text>
          <circle
            cx={cx} cy={cy}
            r={HEX_SIZE * 0.65}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => {
              const movedTag = unit.from ? ' · ADVANCED' : ''
              const name = squad.label.split('//')[1].trim()
              onHover(`${name} · ${unit.name} [${unit.code}]${movedTag}`)
            }}
            onClick={() => onSelectUnit(squadKey, unitIndex)}
          />
        </g>
      )
    })
  )
}

function HexTile({ col, row, onHover, onClick }) {
  const type = MAP[row]?.[col] ?? 'open'
  const terrain = TERRAIN[type]
  const { cx, cy } = hexCenter(col, row)
  const coordLabel = `${col.toString(16).toUpperCase()}${row.toString(16).toUpperCase()}`
  const coord = `${col.toString().padStart(2, '0')}·${row.toString().padStart(2, '0')}`

  return (
    <g>
      <polygon
        points={hexPoints(cx, cy, HEX_SIZE - 1.5)}
        fill={terrain.fill}
        stroke="var(--line)"
        strokeWidth="1"
        className="hex"
        style={{ cursor: 'pointer', transition: 'filter 0.18s ease, stroke 0.18s ease' }}
        onMouseEnter={() => onHover(`${coord} · ${terrain.label}`)}
        onClick={onClick}
      />
      {terrain.icon && (
        <text
          x={cx} y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={type === 'objective' ? 'var(--accent)' : 'var(--text)'}
          opacity={type === 'objective' ? undefined : 0.45}
          style={{
            fontSize: 14,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {terrain.icon}
        </text>
      )}
      <text
        x={cx} y={cy + HEX_SIZE - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          fill: 'var(--text-dim)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {coordLabel}
      </text>
    </g>
  )
}

function ThreatenedUnits({ threatenedEnemies }) {
  if (!threatenedEnemies.length) return null
  return threatenedEnemies.map(({ col, row, squadKey, unitIndex }) => {
    const { cx, cy } = hexCenter(col, row)
    return (
      <circle
        key={`threatened-${squadKey}-${unitIndex}`}
        cx={cx} cy={cy}
        r={HEX_SIZE * 0.82}
        fill="none"
        stroke="#ff3333"
        strokeWidth="2"
        className="threatened-ring"
        style={{ filter: 'drop-shadow(0 0 5px #ff3333)', pointerEvents: 'none' }}
      />
    )
  })
}

export default function HexMap({ units, selectedUnit, targetHex, reachableHexes, threatenedEnemies = [], onSelectUnit, onSelectHex }) {
  const [hoverInfo, setHoverInfo] = useState('— · —')

  const selectedColor = selectedUnit ? units[selectedUnit.squadKey].color : null
  const selectedPos = selectedUnit
    ? { col: units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].col,
        row: units[selectedUnit.squadKey].roster[selectedUnit.unitIndex].row }
    : null

  return (
    <div>
      <div style={{ overflowX: 'auto', padding: 12 }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
        >
          <InfluenceZones units={units} />

          {Array.from({ length: COLS }, (_, col) =>
            Array.from({ length: ROWS }, (_, row) => (
              <HexTile
                key={`${col}-${row}`}
                col={col}
                row={row}
                onHover={setHoverInfo}
                onClick={() => onSelectHex(col, row)}
              />
            ))
          )}

          <ReachableOverlay reachableHexes={reachableHexes} color={selectedColor} />
          <TargetPlaceholder targetHex={targetHex} fromHex={selectedPos} color={selectedColor} />

          <SquadLines units={units} />
          <MovementTrails units={units} />
          <Units
            units={units}
            selectedUnit={selectedUnit}
            onSelectUnit={onSelectUnit}
            onHover={setHoverInfo}
          />
          <ThreatenedUnits threatenedEnemies={threatenedEnemies} />
        </svg>
      </div>

      <Legend units={units} />

      <div style={{
        marginTop: 20,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderTop: '1px dashed var(--line)',
        paddingTop: 14,
      }}>
        <span>grid.render() ok</span>
        <span>{hoverInfo}</span>
      </div>
    </div>
  )
}

function Legend({ units }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {Object.entries(TERRAIN).map(([key, t]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-dim)' }}>
            <span style={{
              width: 22,
              height: 19,
              background: t.fill,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              border: '1px solid var(--line)',
              flexShrink: 0,
            }} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 22,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        borderTop: '1px dashed var(--line)',
        paddingTop: 18,
      }}>
        {Object.values(units).map(squad => {
          const codes = [...new Map(squad.roster.map(u => [u.code, u.name])).entries()]
          return (
            <div key={squad.label}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: squad.color, marginBottom: 8 }}>
                {squad.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: 12, color: 'var(--text-dim)' }}>
                {codes.map(([code, name]) => (
                  <span key={code}>
                    <span style={{ color: squad.color, fontWeight: 600 }}>[{code}]</span> {name}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
