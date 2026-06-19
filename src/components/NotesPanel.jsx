import { useState, useEffect } from 'react'
import { LS } from '../lib/storage'

export default function NotesPanel({ onClose }) {
  const [txt, setTxt] = useState(() => LS.get('pp_notes') || '')
  useEffect(() => LS.set('pp_notes', txt), [txt])

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ height: '75vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Anteckningar</div>
          <div style={{ width: 48 }} />
        </div>
        <div style={{ flex: 1, padding: 16, display: 'flex' }}>
          <textarea
            value={txt}
            onChange={e => setTxt(e.target.value)}
            placeholder="Skriv dina anteckningar här…"
            style={{ flex: 1, resize: 'none', background: 'var(--input-bg)', border: '1.5px solid var(--border)', borderRadius: 10, padding: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6, outline: 'none' }}
          />
        </div>
      </div>
    </>
  )
}
