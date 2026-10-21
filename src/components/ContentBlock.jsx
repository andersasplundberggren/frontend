import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { showToast } from '../lib/toast'
import { Icons } from './Icons'
import InteractiveBlock from './InteractiveBlock'
import { ReliabilityBadge, EvidenceDetail } from './MysteryBits'
import { gradeLocally } from '../lib/testmode'

// Länkar från admin: http(s), mailto: och tel: visas, utan protokoll läggs
// https:// till. Andra protokoll (javascript:, data: …) visas inte.
function safeUrl(u) {
  const v = typeof u === 'string' ? u.trim() : ''
  if (!v) return null
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null
  return 'https://' + v.replace(/^\/+/, '')
}

// Skickar ett svar till servern – eller rättar lokalt i testläget (ingen session).
async function submitAnswer(sess, b, body) {
  if (sess?.preview) return gradeLocally(b, body)
  const raw = await apiFetch(`/sessions/${sess.session_token}/progress`, { method: 'POST', body, queue: true })
  return raw.data ?? raw
}

function Lightbox({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <img
        src={src}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '100dvh', objectFit: 'contain', borderRadius: 6, touchAction: 'pinch-zoom' }}
      />
      <div style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#fff' }} onClick={onClose}>✕</div>
    </div>
  )
}

export default function ContentBlock({ block: b, asgn, sess, placeId, answer: ans, onAnswer, canAnswer, revealedClues, onRevealClue }) {
  const [zoomedSrc, setZoomedSrc] = useState(null)

  const content = (() => {
    switch (b.type) {
      case 'text':
        return (
          <div className="block">
            {b.title && <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{b.title}</h3>}
            {b.body && <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{b.body}</p>}
          </div>
        )

      case 'image':
        return b.media_url ? (
          <div className="block" style={{ cursor: 'zoom-in' }} onClick={() => setZoomedSrc(b.media_url)}>
            {b.title && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{b.title}</div>}
            <img
              src={b.media_url} alt={b.title || ''}
              style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 280, objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        ) : null

      case 'video':
        return b.media_url ? (
          <div className="block">
            {b.title && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{b.title}</div>}
            <video
              src={b.media_url}
              controls
              playsInline
              preload="metadata"
              style={{ width: '100%', borderRadius: 10, display: 'block', background: '#000', maxHeight: 320 }}
            />
          </div>
        ) : null

      case 'audio':
        return b.media_url ? (
          <div className="block" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            {b.title && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{b.title}</div>}
            <audio
              src={b.media_url}
              controls
              preload="metadata"
              style={{ width: '100%' }}
            />
          </div>
        ) : null

      case 'question':
        return <QuestionBlock b={b} asgn={asgn} sess={sess} placeId={placeId} ans={ans} onAnswer={onAnswer} canAnswer={canAnswer} />

      case 'clue':
        return <ClueBlock b={b} maxClues={asgn.max_clues || 0} revealedClues={revealedClues} onReveal={() => onRevealClue?.(b.id)} />

      case 'solution':
        return <SolutionBlock b={b} asgn={asgn} sess={sess} placeId={placeId} ans={ans} onAnswer={onAnswer} canAnswer={canAnswer} />

      case 'witness': {
        const witnessImg = b.witness_image_url || null
        return (
          <div className="block" style={{ background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              {witnessImg
                ? <img src={witnessImg} alt={b.witness_name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }} onClick={() => setZoomedSrc(witnessImg)} />
                : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(139,92,246,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#a78bfa', flexShrink: 0 }}>{b.witness_name?.[0] || '?'}</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{b.witness_name}</div>
                {b.witness_role && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{b.witness_role}</div>}
              </div>
              <ReliabilityBadge value={b.witness_reliability} />
            </div>
            {b.witness_statement && (
              <div style={{ borderTop: '1px solid rgba(139,92,246,.15)', padding: '10px 14px' }}>
                <blockquote style={{ borderLeft: '3px solid rgba(139,92,246,.4)', paddingLeft: 12, fontSize: 14, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
                  "{b.witness_statement}"
                </blockquote>
              </div>
            )}
          </div>
        )
      }

      case 'evidence': {
        const evidenceImg = b.evidence_image_url || b.media_url || null
        return (
          <div className="block" style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 10, overflow: 'hidden' }}>
            {evidenceImg && (
              <img src={evidenceImg} alt={b.title || 'Bevis'} style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => setZoomedSrc(evidenceImg)} />
            )}
            <div style={{ padding: 14 }}>
              {b.evidence_label && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,.15)', color: 'var(--blue)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{b.evidence_label}</span>}
              {b.title && <div style={{ fontWeight: 700, fontSize: 15, marginBottom: b.body ? 6 : 0 }}>{b.title}</div>}
              {b.body && <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{b.body}</div>}
              <EvidenceDetail text={b.evidence_detail} />
              {safeUrl(b.cta_url) && (
                <a href={safeUrl(b.cta_url)} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: 'var(--blue)', textDecoration: 'underline' }}>
                  {b.cta_label || 'Granska närmare'} ↗
                </a>
              )}
            </div>
          </div>
        )
      }

      case 'suspect': {
        const suspectImg = b.suspect_image_url || null
        return (
          <div className="block" style={{ background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              {suspectImg
                ? <img src={suspectImg} alt={b.suspect_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in' }} onClick={() => setZoomedSrc(suspectImg)} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#ef4444', flexShrink: 0 }}>{b.suspect_name?.[0] || '?'}</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.suspect_name}</div>
                {b.suspect_role && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{b.suspect_role}</div>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(220,38,38,.15)', color: '#ef4444', flexShrink: 0 }}>Misstänkt</span>
            </div>
            {(b.suspect_motive || b.suspect_alibi) && (
              <div style={{ borderTop: '1px solid rgba(220,38,38,.15)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {b.suspect_motive && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#ef4444', marginBottom: 2 }}>Motiv</div>
                    <div style={{ fontSize: 14, color: 'var(--text2)', fontStyle: 'italic' }}>{b.suspect_motive}</div>
                  </div>
                )}
                {b.suspect_alibi && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--blue)', marginBottom: 2 }}>Alibi</div>
                    <div style={{ fontSize: 14, color: 'var(--text2)', fontStyle: 'italic' }}>{b.suspect_alibi}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }

      case 'link':
        return safeUrl(b.cta_url) ? (
          <div className="block">
            <a href={safeUrl(b.cta_url)} target="_blank" rel="noopener" className="btn btn-secondary btn-block">
              {b.cta_label || 'Öppna länk'} ↗
            </a>
          </div>
        ) : null

      case 'interactive':
        return <InteractiveBlock b={b} />

      default:
        return null
    }
  })()

  if (!content) return null

  return (
    <>
      {content}
      {zoomedSrc && <Lightbox src={zoomedSrc} onClose={() => setZoomedSrc(null)} />}
    </>
  )
}

function ClueBlock({ b, maxClues, revealedClues, onReveal }) {
  const isRevealed = revealedClues?.has(b.id) || !b.is_hidden
  const used = revealedClues?.size || 0
  const atLimit = maxClues > 0 && used >= maxClues && !isRevealed
  const cluesLeft = maxClues > 0 ? Math.max(0, maxClues - used) : null

  return (
    <div className="block" style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.3)', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isRevealed ? 6 : 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#d97706' }}>💡 {b.title || 'Ledtråd'}</div>
        {cluesLeft !== null && !isRevealed && (
          <span style={{ fontSize: 11, color: '#d97706', opacity: 0.7 }}>{cluesLeft} kvar</span>
        )}
      </div>
      {isRevealed
        ? b.body && <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{b.body}</div>
        : atLimit
          ? <div style={{ marginTop: 8, padding: '7px 12px', background: 'rgba(217,119,6,.1)', borderRadius: 8, fontSize: 13, color: '#d97706', textAlign: 'center' }}>
              Inga fler ledtrådar kvar
            </div>
          : <button
              onClick={onReveal}
              style={{
                marginTop: 10, width: '100%', padding: '8px 0',
                background: 'rgba(217,119,6,.15)', border: '1px solid rgba(217,119,6,.4)',
                borderRadius: 8, color: '#d97706', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Visa ledtråd{cluesLeft !== null ? ` · ${cluesLeft} kvar` : ''}
            </button>
      }
    </div>
  )
}

function SolutionBlock({ b, asgn, sess, placeId, ans, onAnswer, canAnswer }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  // Fel svar på en lösning får rättas: blocket är klart först när svaret är rätt
  // (eller väntar på täckning / rättas manuellt).
  const wrong = !!ans && ans.is_correct === false && !ans.pending
  const done = !!ans && !wrong
  const pendingAnswer = () => ({ solution_text: text.trim() })

  async function send() {
    if (!text.trim() || loading || done || !canAnswer) return
    setLoading(true)
    try {
      const data = await submitAnswer(sess, b, { place_id: placeId, block_id: b.id, solution_text: text.trim() })
      const isCorrect = data.is_correct === true || data.is_correct === 1 || data.is_correct === 'true'
        ? true : data.is_correct === false || data.is_correct === 0 || data.is_correct === 'false'
        ? false : undefined
      onAnswer({ solution_text: text.trim(), is_correct: isCorrect, points: data.points_earned })
      if (asgn.grading_mode === 'auto') {
        if (isCorrect === true) showToast(`✓ Rätt! +${data.points_earned} poäng`, 'correct')
        else if (isCorrect === false) { showToast('✗ Inte rätt – försök igen', 'wrong'); setText('') }
        else showToast('Svar registrerat', 'info')
      } else {
        showToast('Svar registrerat', 'info')
      }
    } catch (e) {
      if (e.offline && e.queued) {
        // Ingen täckning: svaret är sparat och skickas automatiskt senare.
        onAnswer({ ...pendingAnswer(), is_correct: undefined, pending: true })
        showToast('Ingen täckning – svaret sparas och skickas automatiskt', 'info')
      }
      else if (e.offline) showToast(e.message, 'wrong')
      else if (e.status === 409) showToast('Svar redan registrerat', 'info')
      else showToast(e.message || 'Fel', 'wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="block card">
      {b.title && <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{b.title}</div>}
      {wrong && (
        <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444' }}>
          ✗ "{ans.solution_text}" var inte rätt – försök igen.
        </div>
      )}
      {b.body && <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{b.body}</div>}
      {b.solution_hint && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.3)', marginBottom: 12, fontSize: 13, color: '#d97706' }}>
          💡 Ledtråd: {b.solution_hint}
        </div>
      )}
      {done ? (
        <>
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 8, fontSize: 14,
            background: ans.is_correct === true ? 'rgba(34,197,94,.08)' : ans.is_correct === false ? 'rgba(239,68,68,.08)' : 'var(--bg3)',
            border: `1px solid ${ans.is_correct === true ? 'rgba(34,197,94,.3)' : ans.is_correct === false ? 'rgba(239,68,68,.3)' : 'var(--border)'}`,
            color: ans.is_correct === true ? 'var(--green)' : ans.is_correct === false ? '#ef4444' : 'var(--text)',
          }}>
            {ans.solution_text}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
            {ans.pending ? '⏳ Sparat – skickas när du får täckning'
              : asgn.grading_mode === 'auto'
              ? ans.is_correct === true ? `✓ Rätt · ${ans.points} poäng`
              : ans.is_correct === false ? '✗ Fel svar'
              : 'Svar registrerat'
              : 'Svar registrerat'}
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={canAnswer ? 'Skriv ditt svar…' : 'Gå till platsen för att svara'}
            disabled={!canAnswer || loading}
            className="form-input"
            style={{ marginBottom: 10 }}
          />
          <button
            className="btn btn-primary btn-block"
            onClick={send}
            disabled={!text.trim() || loading || !canAnswer}
          >
            {loading ? 'Skickar…' : 'Skicka svar'}
          </button>
        </>
      )}
    </div>
  )
}

function QuestionBlock({ b, asgn, sess, placeId, ans, onAnswer, canAnswer }) {
  const [sel, setSel] = useState(ans?.chosen || null)
  const [loading, setLoading] = useState(false)
  const done = !!ans
  const pendingAnswer = () => ({ chosen: sel })

  const opts = [
    b.option_a && { k: 'a', l: b.option_a },
    b.option_b && { k: 'b', l: b.option_b },
    b.option_c && { k: 'c', l: b.option_c },
    b.option_d && { k: 'd', l: b.option_d },
  ].filter(Boolean)

  async function send() {
    if (!sel || loading || done || !canAnswer) return
    setLoading(true)
    try {
      const data = await submitAnswer(sess, b, { place_id: placeId, block_id: b.id, chosen_option: sel })
      const isCorrect = data.is_correct === true || data.is_correct === 1 || data.is_correct === 'true'
        ? true : data.is_correct === false || data.is_correct === 0 || data.is_correct === 'false'
        ? false : undefined
      onAnswer({ chosen: sel, is_correct: isCorrect, correct_option: data.correct_option ?? null, points: data.points_earned, explanation: data.explanation ?? null })
      if (asgn.grading_mode === 'auto') {
        if (isCorrect === true) showToast(`✓ Rätt! +${data.points_earned} poäng`, 'correct')
        else if (isCorrect === false) showToast('✗ Fel svar', 'wrong')
        else showToast('Svar registrerat', 'info')
      } else {
        showToast('Svar registrerat', 'info')
      }
    } catch (e) {
      if (e.offline && e.queued) {
        // Ingen täckning: svaret är sparat och skickas automatiskt senare.
        onAnswer({ ...pendingAnswer(), is_correct: undefined, pending: true })
        showToast('Ingen täckning – svaret sparas och skickas automatiskt', 'info')
      }
      else if (e.offline) showToast(e.message, 'wrong')
      else if (e.status === 409) showToast('Svar redan registrerat', 'info')
      else showToast(e.message || 'Fel', 'wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="block card">
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, lineHeight: 1.5 }}>{b.body}</div>
      {opts.map(o => {
        let cls = 'option-btn'
        if (done) {
          cls += ' answered'
          if (o.k === ans.chosen) {
            if (ans.is_correct === true) cls += ' correct'
            else if (ans.is_correct === false) cls += ' wrong'
          }
          if (ans.is_correct === false && ans.correct_option && o.k === ans.correct_option) cls += ' correct'
        } else if (o.k === sel) cls += ' selected'
        return (
          <button key={o.k} className={cls} onClick={() => !done && setSel(o.k)}>
            <span className="opt-key">{o.k.toUpperCase()}</span>{o.l}
          </button>
        )
      })}
      {done && (ans.explanation || b.explanation) && asgn.grading_mode === 'auto' && (
        <div style={{ marginTop: 10, padding: 10, background: 'var(--bg3)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          {ans.explanation || b.explanation}
        </div>
      )}
      {!done && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={send} disabled={!sel || loading || !canAnswer}>
          {!canAnswer ? 'Gå till platsen för att svara' : loading ? 'Skickar…' : 'Skicka svar'}
        </button>
      )}
      {done && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
          {ans.pending ? '⏳ Sparat – skickas när du får täckning'
            : asgn.grading_mode === 'auto'
            ? ans.is_correct === true ? `✓ Rätt · ${ans.points} poäng`
            : ans.is_correct === false ? '✗ Fel svar'
            : 'Svar registrerat'
            : 'Svar registrerat'}
        </div>
      )}
    </div>
  )
}
