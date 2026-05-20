export default function StartScreen({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 420, width: '100%', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--accent)', textTransform: 'uppercase' }}>
            // sector-07 / recon overlay
          </span>
          <h1 style={{
            fontFamily: "'Major Mono Display', monospace",
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            margin: 0,
          }}>
            hex grid
          </h1>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
            <span className="blink" />
            sélectionnez un mode de jeu
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { mode: 'ai', label: 'vs IA', desc: 'joueur 1 contre l\'intelligence artificielle' },
            { mode: '2p', label: '2 joueurs', desc: 'deux joueurs sur le même écran' },
          ].map(({ mode, label, desc }) => (
            <button
              key={mode}
              onClick={() => onSelect(mode)}
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                padding: '16px 20px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'border-color 0.15s',
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
            >
              <span style={{ fontSize: 13, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
