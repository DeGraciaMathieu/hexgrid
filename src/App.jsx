import HexMap from './components/HexMap.jsx'

export default function App() {
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
        <HexMap />
      </div>
    </div>
  )
}
