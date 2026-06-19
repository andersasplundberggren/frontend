import { useState } from 'react'
import { mediaUrl } from '../lib/map'

export default function SuspectGuessPanel({ places, sess, asgn, guess, onGuess, onClose, onLeave }) {
  const allSuspects = places.flatMap(p =>
    (p.content_blocks || [])
      .filter(b => b.type === 'suspect')
      .map(b => ({ ...b, placeTitle: p.title }))
  )

  const [selected, setSelected] = useState(null)

  function isCulprit(b) {
    if (!b) return false
    if (!!b.is_culprit || !!b.culprit_explanation) return true
    // Fallback: if only one suspect exists, they must be the culprit
    return allSuspects.length === 1
  }

  function submit(skip = false) {
    if (!skip && !selected) return
    const culprit = allSuspects.find(b => !!b.is_culprit || !!b.culprit_explanation)
      ?? (allSuspects.length === 1 ? allSuspects[0] : null)
    onGuess({
      suspect_block_id: skip ? null : selected?.id,
      suspect_name: skip ? culprit?.suspect_name : selected?.suspect_name,
      is_correct: skip ? null : isCulprit(selected),
      culprit_name: culprit?.suspect_name,
      culprit_block_id: culprit?.id,
      explanation: culprit?.culprit_explanation || '',
      skipped: skip,
    })
  }

  if (guess) return <ResultView guess={guess} allSuspects={allSuspects} onClose={onClose} onLeave={onLeave} />

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Vem är skyldig?</div>
          <div style={{ width: 48 }} />
        </div>

        <div style={{ padding: '0 16px 8px', fontSize: 14, color: 'var(--text2)', flexShrink: 0 }}>
          Du har besökt alla platser. Välj den person du tror är mördaren och bekräfta.
        </div>

        <div className="sheet-body" style={{ padding: '4px 0' }}>
          {allSuspects.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
              Inga misstänkta hittades i uppdraget.
            </div>
          )}
          {allSuspects.map(b => (
            <button
              key={b.id}
              onClick={() => setSelected(s => s?.id === b.id ? null : b)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', margin: '6px 16px', padding: 14,
                background: selected?.id === b.id ? 'rgba(249,115,22,.08)' : 'var(--bg2)',
                border: selected?.id === b.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', color: 'var(--text)',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <SuspectAvatar b={b} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{b.suspect_name}</div>
                {b.suspect_role && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{b.suspect_role}</div>}
                {b.placeTitle && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Hittad vid: {b.placeTitle}</div>}
              </div>
              {selected?.id === b.id && (
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 16px 24px', flexShrink: 0 }}>
          <button
            className="btn btn-primary btn-block"
            style={{ background: selected ? '#e11d48' : undefined, marginBottom: 10 }}
            disabled={!selected}
            onClick={() => submit(false)}
          >
            Bekräfta gissning
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => submit(true)}
            style={{ color: 'var(--text2)', fontSize: 14 }}
          >
            Hoppa över — visa svaret direkt
          </button>
        </div>
      </div>
    </>
  )
}

function SuspectAvatar({ b, size }) {
  const src = b.suspect_image_url || (b.suspect_image_id ? mediaUrl(b.suspect_image_id) : null)
  if (src) {
    return (
      <img
        src={src}
        alt={b.suspect_name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: 'var(--bg3)' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(220,38,38,.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, color: '#ef4444', flexShrink: 0,
    }}>
      {b.suspect_name?.[0] || '?'}
    </div>
  )
}

function ResultView({ guess, allSuspects, onClose, onLeave }) {
  const culprit = allSuspects.find(b => b.id === guess.culprit_block_id) || allSuspects.find(b => b.suspect_name === guess.culprit_name)

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />

        <div className="sheet-body" style={{ padding: '24px 16px 8px', textAlign: 'center' }}>
          {!guess.skipped && (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{guess.is_correct ? '🎉' : '❌'}</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>
                {guess.is_correct ? 'Rätt gissning!' : 'Fel gissning'}
              </div>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20 }}>
                {guess.is_correct
                  ? `Du hade rätt! ${guess.culprit_name} är skyldig.`
                  : `Det var ${guess.culprit_name} som var skyldig.`}
              </div>
            </>
          )}
          {guess.skipped && (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>Svaret</div>
              <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20 }}>
                {guess.culprit_name} är skyldig.
              </div>
            </>
          )}

          {culprit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              background: guess.is_correct ? 'rgba(34,197,94,.06)' : 'var(--bg2)',
              border: `1px solid ${guess.is_correct ? 'rgba(34,197,94,.25)' : 'var(--border)'}`,
              borderRadius: 12, padding: 14, marginBottom: 16,
            }}>
              <SuspectAvatar b={culprit} size={52} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{culprit.suspect_name}</div>
                {culprit.suspect_role && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{culprit.suspect_role}</div>}
              </div>
            </div>
          )}

          {guess.explanation && (
            <div style={{
              textAlign: 'left', borderLeft: '3px solid var(--accent)',
              padding: '10px 14px', marginBottom: 16,
              background: 'var(--bg2)', borderRadius: '0 8px 8px 0',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent)', marginBottom: 4 }}>Förklaring</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>{guess.explanation}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '8px 16px 28px', flexShrink: 0 }}>
          <button className="btn btn-primary btn-block" style={{ marginBottom: 10 }} onClick={onLeave}>
            Avsluta till startsidan
          </button>
          <button className="btn btn-secondary btn-block" onClick={onClose}>
            Stanna kvar och utforska
          </button>
        </div>
      </div>
    </>
  )
}
