import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

const MODE_CONFIG = {
  mystery:     { emoji: '🔍', labelDone: 'Mordgåtan avklarad', labelPartial: 'Mordgåtan avslutad' },
  trail:       { emoji: '🏆', labelDone: 'Tipspromenaden klar', labelPartial: 'Tipspromenaden avslutad' },
  quiz_walk:   { emoji: '🏆', labelDone: 'Tipspromenaden klar', labelPartial: 'Tipspromenaden avslutad' },
  exploration: { emoji: '🗺️', labelDone: 'Utforskningen klar', labelPartial: 'Utforskningen avslutad' },
}

export default function DoneScreen({ asgn, sess, prog, guess, onReset, onBack }) {
  const [serverData, setServerData] = useState(null)
  const [finishing, setFinishing] = useState(false)

  const places = asgn.places || []
  const mode = asgn.type || 'exploration'
  const config = MODE_CONFIG[mode] || MODE_CONFIG.exploration

  // Local stats as fallback while server responds
  const vc = places.filter(p => prog[p.id]?.visited).length
  const allVisited = places.length > 0 && vc === places.length
  const localAnswers = places.flatMap(p => Object.values(prog[p.id]?.answers || {}))
  const localCorrect = localAnswers.filter(a => a.is_correct).length
  const localPts = localAnswers.reduce((s, a) => s + (a.points || 0), 0)

  const totalScore = serverData?.total_score ?? localPts
  const totalAnswers = serverData?.progress?.filter(r => r.block_id && (r.chosen_option || r.solution_text))?.length ?? localAnswers.length
  const correctAnswers = serverData?.progress?.filter(r => r.is_correct === true || r.is_correct === 1)?.length ?? localCorrect

  // Culprit for mystery mode
  const allSuspectBlocks = places.flatMap(p => p.content_blocks || []).filter(b =>
    b.block_type === 'suspect' || b.type === 'suspect'
  )
  const culprit = guess?.culprit_name
    ? guess
    : (() => {
        const block = allSuspectBlocks.find(b => !!b.is_culprit || !!b.culprit_explanation)
          ?? (allSuspectBlocks.length === 1 ? allSuspectBlocks[0] : null)
        return block ? { culprit_name: block.suspect_name, explanation: block.culprit_explanation, culprit_block: block } : null
      })()

  useEffect(() => {
    if (!sess?.session_token) return
    apiFetch(`/sessions/${sess.session_token}`)
      .then(data => setServerData(data.data ?? data))
      .catch(() => {})
  }, [])

  async function finish() {
    setFinishing(true)
    try {
      if (sess?.session_token) {
        await apiFetch(`/sessions/${sess.session_token}/complete`, { method: 'POST' }).catch(() => {})
      }
    } finally {
      onReset()
    }
  }

  const culpritBlock = places.flatMap(p => p.content_blocks || []).find(b => b.suspect_name === culprit?.culprit_name)

  return (
    <div className="screen" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, #c2410c 100%)',
        padding: '48px 24px 32px', textAlign: 'center', color: '#fff',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>{config.emoji}</div>
        <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 6 }}>{allVisited ? config.labelDone : config.labelPartial}!</div>
        <div style={{ fontSize: 15, opacity: .85 }}>{asgn.title}</div>
      </div>

      <div className="screen-body" style={{ paddingTop: 24 }}>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-box">
            <div className="stat-val">{vc}/{places.length}</div>
            <div className="stat-lbl">Platser</div>
          </div>
          {(mode === 'trail' || mode === 'quiz_walk') && (
            <>
              <div className="stat-box">
                <div className="stat-val">{totalAnswers}</div>
                <div className="stat-lbl">Svar</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{ color: 'var(--green)' }}>{correctAnswers}</div>
                <div className="stat-lbl">Rätt</div>
              </div>
              <div className="stat-box">
                <div className="stat-val" style={{ color: 'var(--accent)' }}>{totalScore}</div>
                <div className="stat-lbl">Poäng</div>
              </div>
            </>
          )}
        </div>

        {/* Mystery culprit reveal — only if all places visited */}
        {mode === 'mystery' && !allVisited && (
          <div style={{ marginBottom: 24, padding: '16px', background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Mordgåtan är olöst</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Du måste besöka alla {places.length} platser för att avslöja vem som är skyldig.
            </div>
          </div>
        )}
        {mode === 'mystery' && allVisited && culprit && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)', marginBottom: 10 }}>
              {guess?.skipped ? 'SVARET' : guess?.is_correct ? 'RÄTT GISSNING!' : guess ? 'SKYLDIG' : 'DEN SKYLDIGE'}
            </div>
            {guess && !guess.skipped && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 14, fontWeight: 600,
                background: guess.is_correct ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                color: guess.is_correct ? 'var(--green)' : '#ef4444',
                border: `1px solid ${guess.is_correct ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
              }}>
                {guess.is_correct ? '✓ Du gissade rätt!' : `✗ Du gissade ${guess.suspect_name} — det var fel.`}
              </div>
            )}
            <div style={{
              background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.25)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                {culpritBlock?.suspect_image_url
                  ? <img src={culpritBlock.suspect_image_url} alt={culprit.culprit_name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>{culprit.culprit_name?.[0] || '?'}</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{culprit.culprit_name}</div>
                  {culpritBlock?.suspect_role && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{culpritBlock.suspect_role}</div>}
                </div>
              </div>
              {culprit.explanation && (
                <div style={{ borderTop: '1px solid rgba(220,38,38,.15)', padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#ef4444', marginBottom: 6 }}>Förklaring</div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, fontStyle: 'italic' }}>{culprit.explanation}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score bar for trail/quiz_walk */}
        {(mode === 'trail' || mode === 'quiz_walk') && totalAnswers > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
              <span>Rätt svar</span>
              <span>{correctAnswers} av {totalAnswers}</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'var(--bg3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 5, background: 'var(--green)',
                width: `${totalAnswers ? (correctAnswers / totalAnswers) * 100 : 0}%`,
                transition: 'width .6s ease',
              }} />
            </div>
          </div>
        )}

        {/* Completion message */}
        <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
          {places.length > 0 && vc === places.length
            ? <><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Alla platser besökta!</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Du har genomfört hela uppdraget.</div></>
            : <><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{vc} av {places.length} platser besökta</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {vc === 0 ? 'Du lämnade uppdraget utan att besöka några platser.' : 'Du kan alltid återvända och slutföra uppdraget.'}
                </div></>
          }
        </div>


        <button
          className="btn btn-primary btn-block"
          style={{ marginBottom: 12 }}
          onClick={finish}
          disabled={finishing}
        >
          {finishing ? <><div className="spinner" />Avslutar…</> : 'Avsluta och starta om'}
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={onBack}
        >
          ← Tillbaka till kartan
        </button>


      </div>
    </div>
  )
}
