// Meny för testläget (öppnas via den lila bannern). Bara synlig när appen
// öppnats med en testlänk från admin – inget här sparas på servern.
export default function TestMenu({ mode, setMode, onVisitAll, onRestart, onExit, onClose }) {
  const modeBtn = (key, title, desc) => (
    <button
      onClick={() => setMode(key)}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: 12, marginBottom: 8,
        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
        background: mode === key ? 'rgba(124,58,237,.10)' : 'var(--bg2)',
        border: mode === key ? '2px solid #7c3aed' : '2px solid var(--border)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{mode === key ? '● ' : '○ '}{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{desc}</div>
    </button>
  )
  return (
    <>
      <div className="sheet-overlay" onClick={onClose} style={{ pointerEvents: 'auto' }} />
      <div className="sheet" style={{ maxHeight: '80vh', pointerEvents: 'auto' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">🧪 Testläge</div>
          <div style={{ width: 48 }} />
        </div>
        <div className="sheet-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
            Du testar uppdraget som en spelare. Svar rättas direkt i appen och <strong>inget sparas</strong> i resultat eller statistik.
          </div>
          {modeBtn('quick', 'Snabbtest', 'Alla platser är öppna. Tryck på en plats för att öppna den.')}
          {modeBtn('walk', 'Simulera promenad', 'Vanliga regler för radie och ordning. Tryck på kartan för att flytta dig dit.')}
          <div style={{ height: 8 }} />
          <button className="btn btn-secondary btn-block" style={{ marginBottom: 8 }} onClick={onVisitAll}>
            ✓ Markera alla platser besökta
          </button>
          <button className="btn btn-secondary btn-block" style={{ marginBottom: 8 }} onClick={onRestart}>
            ↺ Börja om testet
          </button>
          <button className="btn btn-secondary btn-block" style={{ color: '#ef4444' }} onClick={onExit}>
            Avsluta testläget
          </button>
        </div>
      </div>
    </>
  )
}
