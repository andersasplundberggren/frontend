export default function MapSettingsPanel({ settings, onChange, onClose }) {
  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '60vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Kartinställningar</div>
          <div style={{ width: 48 }} />
        </div>
        <div className="sheet-body" style={{ padding: '8px 16px 32px' }}>
          <ToggleRow
            title="Visa rutt"
            desc="Dragen linje mellan alla stopp på kartan"
            active={settings.trailLine}
            onToggle={() => onChange(s => ({ ...s, trailLine: !s.trailLine }))}
          />
          <ToggleRow
            title="Navigering till nästa"
            desc="Gångväg från din position till nästa plats"
            active={settings.navRoute}
            onToggle={() => onChange(s => ({ ...s, navRoute: !s.navRoute }))}
          />
        </div>
      </div>
    </>
  )
}

function ToggleRow({ title, desc, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', width: '100%',
        padding: '14px 0', background: 'none', border: 'none',
        borderBottom: '1px solid var(--border)', cursor: 'pointer',
        fontFamily: 'inherit', color: 'var(--text)', textAlign: 'left', gap: 12,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{
        width: 44, height: 26, borderRadius: 13,
        background: active ? 'var(--accent)' : 'var(--bg3)',
        transition: 'background .2s', position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 3, left: active ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }} />
      </div>
    </button>
  )
}
