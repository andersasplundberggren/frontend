import React from 'react'

// Fångar oväntade fel så att spelaren ser en förklaring och kan komma vidare
// i stället för en tom skärm. "Börja om" rensar sparat spelläge men behåller
// inställningar (namn, mörkt läge, kartval).
const GAME_KEYS = ['pp_a', 'pp_s', 'pp_p', 'pp_code', 'pp_guess', 'pp_revealed_clues', 'pp_start_at', 'pp_notes', 'pp_test_mode']

export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) { console.error('[App] Oväntat fel:', error, info?.componentStack) }

  restart = () => {
    GAME_KEYS.forEach(k => { try { localStorage.removeItem(k) } catch {} })
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--bg, #fff)', color: 'var(--text, #111)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>😕</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Något gick fel</div>
          <div style={{ fontSize: 15, opacity: .75, lineHeight: 1.5, marginBottom: 20 }}>
            Prova att ladda om. Hjälper det inte kan du börja om – dina sparade svar på servern finns kvar.
          </div>
          <button className="btn btn-primary btn-block" style={{ marginBottom: 10 }} onClick={() => window.location.reload()}>Ladda om</button>
          <button className="btn btn-secondary btn-block" onClick={this.restart}>Börja om</button>
        </div>
      </div>
    )
  }
}
