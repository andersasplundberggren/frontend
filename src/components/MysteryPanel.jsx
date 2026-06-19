import { useState, useRef, useEffect } from 'react'
import { LS } from '../lib/storage'
import { apiFetch } from '../lib/api'

export default function MysteryPanel({ asgn, sess, places, prog, revealedClues, revealClue, onClose }) {
  const [tab, setTab] = useState('notes')
  const [zoomedSrc, setZoomedSrc] = useState(null)
  const [notes, setNotes] = useState(() => LS.get('pp_notes') || '')
  const [syncStatus, setSyncStatus] = useState('saved')
  const saveTimer = useRef(null)

  const discovered = places
    .filter(p => prog[p.id]?.visited)
    .flatMap(p => (p.content_blocks || []).map(b => ({ ...b, placeTitle: p.title })))

  const witnesses = discovered.filter(b => b.type === 'witness')
  const evidences = discovered.filter(b => b.type === 'evidence')
  const clues = discovered.filter(b => b.type === 'clue')
  const suspects = discovered.filter(b => b.type === 'suspect')
  const findingsCount = witnesses.length + evidences.length + clues.length

  const maxClues = asgn?.max_clues || 0
  const cluesUsed = revealedClues?.size || 0
  const atClueLimit = maxClues > 0 && cluesUsed >= maxClues

  function handleNotesChange(val) {
    setNotes(val)
    LS.set('pp_notes', val)
    setSyncStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!sess?.session_token) { setSyncStatus('saved'); return }
      try {
        await apiFetch(`/sessions/${sess.session_token}/notes`, {
          method: 'PUT',
          body: { content: val },
        })
        setSyncStatus('saved')
      } catch {
        setSyncStatus('error')
      }
    }, 2000)
  }

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const tabs = [
    ['notes', 'Anteckningar'],
    ['findings', `Fynd (${findingsCount})`],
    ['suspects', `Misstänkta (${suspects.length})`],
  ]

  return (
    <>
      {zoomedSrc && (
        <div onClick={() => setZoomedSrc(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={zoomedSrc} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100dvh', objectFit: 'contain', borderRadius: 6, touchAction: 'pinch-zoom' }} />
          <div style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#fff' }} onClick={() => setZoomedSrc(null)}>✕</div>
        </div>
      )}
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Fallboken</div>
          <div style={{ width: 48 }} />
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '11px 4px', background: 'none', border: 'none',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                color: tab === key ? 'var(--accent)' : 'var(--text2)',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >{label}</button>
          ))}
        </div>

        {tab === 'notes' && (
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Skriv dina teorier och anteckningar här…"
              style={{
                flex: 1, resize: 'none',
                background: 'var(--input-bg)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: 12,
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6,
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 11, color: syncStatus === 'error' ? 'var(--red)' : 'var(--text2)', marginTop: 8, textAlign: 'right' }}>
              {syncStatus === 'saving' ? 'Sparar…' : syncStatus === 'error' ? 'Kunde inte spara' : 'Sparad'}
            </div>
          </div>
        )}

        {tab === 'findings' && (
          <div className="sheet-body" style={{ padding: '8px 0' }}>
            {findingsCount === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
                Inga fynd ännu.<br />Besök fler platser för att samla bevis och vittnen.
              </div>
            )}

            {witnesses.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)' }}>VITTNESMÅL</div>
                {witnesses.map(b => (
                  <div key={b.id} style={{ margin: '0 16px 10px', background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
                      {b.witness_image_url
                        ? <img src={b.witness_image_url} alt={b.witness_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }} onClick={() => setZoomedSrc(b.witness_image_url)} />
                        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#a78bfa', flexShrink: 0 }}>{b.witness_name?.[0] || '?'}</div>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{b.witness_name}</div>
                        {b.witness_role && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{b.witness_role}</div>}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text2)' }}>{b.placeTitle}</div>
                    </div>
                    {b.witness_statement && (
                      <div style={{ borderTop: '1px solid rgba(139,92,246,.15)', padding: '8px 12px' }}>
                        <blockquote style={{ borderLeft: '3px solid rgba(139,92,246,.4)', paddingLeft: 10, fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                          "{b.witness_statement}"
                        </blockquote>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {evidences.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)' }}>BEVIS</div>
                {evidences.map(b => (
                  <div key={b.id} style={{ margin: '0 16px 10px', background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 10, overflow: 'hidden' }}>
                    {(b.evidence_image_url || b.media_url) && (
                      <img src={b.evidence_image_url || b.media_url} alt={b.title || 'Bevis'} style={{ width: '100%', display: 'block', maxHeight: 180, objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => setZoomedSrc(b.evidence_image_url || b.media_url)} />
                    )}
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 6 }}>Från: {b.placeTitle}</div>
                      {b.evidence_label && (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,.15)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{b.evidence_label}</span>
                      )}
                      {b.title && <div style={{ fontWeight: 600, fontSize: 13, marginBottom: b.body ? 4 : 0 }}>{b.title}</div>}
                      {b.body && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{b.body}</div>}
                    </div>
                  </div>
                ))}
              </>
            )}

            {clues.length > 0 && (
              <>
                <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)' }}>
                  LEDTRÅDAR
                  {maxClues > 0 && <span style={{ fontWeight: 400, marginLeft: 6 }}>· {Math.max(0, maxClues - cluesUsed)} av {maxClues} kvar</span>}
                </div>
                {clues.map(b => {
                  const shown = !b.is_hidden || revealedClues?.has(b.id)
                  const canReveal = !b.is_hidden || (!shown && !atClueLimit)
                  return (
                    <div key={b.id} style={{ margin: '0 16px 10px', background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.3)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Från: {b.placeTitle}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#d97706', marginBottom: shown ? 6 : 0 }}>💡 {b.title || 'Ledtråd'}</div>
                      {shown
                        ? b.body && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{b.body}</div>
                        : canReveal
                          ? (
                            <button
                              onClick={() => revealClue(b.id)}
                              style={{
                                marginTop: 10, width: '100%', padding: '8px 0',
                                background: 'rgba(217,119,6,.15)', border: '1px solid rgba(217,119,6,.4)',
                                borderRadius: 8, color: '#d97706', fontWeight: 600, fontSize: 13,
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              Visa ledtråd
                            </button>
                          )
                          : (
                            <div style={{ marginTop: 8, padding: '7px 12px', background: 'rgba(217,119,6,.1)', borderRadius: 8, fontSize: 13, color: '#d97706', textAlign: 'center' }}>
                              Inga fler ledtrådar kvar
                            </div>
                          )
                      }
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {tab === 'suspects' && (
          <div className="sheet-body" style={{ padding: '8px 0' }}>
            {suspects.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
                Inga misstänkta identifierade ännu.<br />Fortsätt undersöka platser.
              </div>
            )}
            {suspects.map(b => (
              <div key={b.id} style={{ margin: '8px 16px', background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>Från: {b.placeTitle}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(220,38,38,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#ef4444', flexShrink: 0 }}>
                    {b.suspect_name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{b.suspect_name}</div>
                    {b.suspect_role && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{b.suspect_role}</div>}
                    {b.suspect_motive && (
                      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600 }}>Motiv: </span>{b.suspect_motive}
                      </div>
                    )}
                    {b.suspect_alibi && (
                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>Alibi: </span>{b.suspect_alibi}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
