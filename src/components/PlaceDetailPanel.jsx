import { useEffect } from 'react'
import { fmtDist } from '../lib/geo'
import { Icons } from './Icons'
import ContentBlock from './ContentBlock'
import { showToast } from '../lib/toast'
import { apiFetch } from '../lib/api'

export default function PlaceDetailPanel({ place, asgn, sess, prog, dist, unlocked, near, onClose, onList, visit, answer, revealedClues, revealClue }) {
  const d = dist[place.id]
  const r = place.activation_radius_meters || 30
  const isVisited = prog.visited
  const blocks = place.content_blocks || []

  useEffect(() => {
    if (near && unlocked && !isVisited) {
      visit(place.id)
      showToast(`✓ ${place.title} besökt`, 'info', 2500)
      if (sess?.session_token) {
        apiFetch(`/sessions/${sess.session_token}/progress`, {
          method: 'POST',
          body: { place_id: place.id },
        }).catch(() => {})
      }
    }
  }, [near])

  function blockVisible(block) {
    if (block.type === 'text') return true
    return isVisited || near
  }

  const visible = blocks.filter(blockVisible)
  const locked = blocks.length - visible.length

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">{place.title}</div>
          <button className="sh-action" onClick={onList}>Platslista</button>
        </div>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10 }}>
          <span>PLATS {place.stop_order + 1}</span>
          {isVisited && <span style={{ color: 'var(--green)' }}>✓ Besökt</span>}
          {d && <span>{fmtDist(d)} bort</span>}
        </div>
        {asgn.max_clues > 0 && visible.some(b => b.type === 'clue' && b.is_hidden) && (
          <div style={{ padding: '6px 16px', background: 'rgba(217,119,6,.06)', borderBottom: '1px solid rgba(217,119,6,.2)', fontSize: 12, color: '#d97706', display: 'flex', gap: 6, alignItems: 'center' }}>
            💡 {Math.max(0, asgn.max_clues - (revealedClues?.size || 0))} av {asgn.max_clues} ledtrådar kvar
          </div>
        )}
        <div className="sheet-body" style={{ padding: 16 }}>
          {!unlocked && (
            <div className="block-locked" style={{ marginBottom: 16 }}>
              <Icons.Lock />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Låst</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Besök föregående plats först.</div>
              </div>
            </div>
          )}
          {unlocked && !isVisited && !near && locked > 0 && (
            <div className="block-locked" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Mer innehåll låses upp på plats</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {locked} block låses upp inom {r} m.{d ? ` Du är ${fmtDist(d)} bort.` : ''}
                </div>
              </div>
            </div>
          )}
          {visible.map(b => (
            <ContentBlock
              key={b.id} block={b} asgn={asgn} sess={sess}
              placeId={place.id}
              answer={prog.answers?.[b.id]}
              onAnswer={ans => answer(place.id, b.id, ans)}
              canAnswer={near || !!isVisited}
              revealedClues={revealedClues}
              onRevealClue={revealClue}
            />
          ))}
        </div>
      </div>
    </>
  )
}
