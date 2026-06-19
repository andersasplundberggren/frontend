import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'

export default function LeaderboardPanel({ sess, groupToken, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const qs = groupToken ? `?group=${encodeURIComponent(groupToken)}` : ''
      const res = await apiFetch(`/sessions/${sess.session_token}/leaderboard${qs}`)
      setData(res.data ?? res)
    } catch {
      setError('Kunde inte ladda topplistan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (sess?.session_token) load() }, [])

  const entries = data?.entries || []

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '85vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Topplista</div>
          <button className="sh-action" onClick={load} disabled={loading} style={{ color: loading ? 'var(--text2)' : 'var(--accent)' }}>
            {loading ? '…' : 'Uppdatera'}
          </button>
        </div>

        <div className="sheet-body" style={{ padding: '0 0 32px' }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>Laddar…</div>
          )}
          {error && (
            <div style={{ padding: 24, textAlign: 'center', color: '#ef4444', fontSize: 14 }}>{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>Inga deltagare ännu.</div>
          )}

          {/* Header row */}
          {!loading && entries.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 16px', borderBottom: '1px solid var(--border)',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.06em', color: 'var(--text2)',
            }}>
              <div style={{ width: 32, textAlign: 'center' }}>#</div>
              <div style={{ flex: 1 }}>Namn</div>
              <div style={{ width: 40, textAlign: 'center' }}>Rätt</div>
              <div style={{ width: 52, textAlign: 'right' }}>Poäng</div>
            </div>
          )}

          {entries.map(e => (
            <div key={e.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px',
              background: e.is_me ? 'rgba(249,115,22,.07)' : 'transparent',
              borderBottom: '1px solid var(--border)',
              borderLeft: e.is_me ? '3px solid var(--accent)' : '3px solid transparent',
            }}>
              <div style={{
                width: 32, textAlign: 'center', fontWeight: 700, fontSize: 16,
                lineHeight: 1,
              }}>
                {e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : (
                  <span style={{ fontSize: 14, color: 'var(--text2)' }}>{e.rank}</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: e.is_me ? 700 : 500, fontSize: 15,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {e.nickname}{e.is_me ? ' (du)' : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {e.places_visited} platser
                  {e.completed && e.time_seconds != null ? ` · ${fmtTime(e.time_seconds)}` : ''}
                  {!e.completed ? ' · pågående' : ''}
                </div>
              </div>

              <div style={{ width: 40, textAlign: 'center', fontSize: 14, color: e.correct_count > 0 ? 'var(--green)' : 'var(--text2)' }}>
                {e.correct_count}
              </div>

              <div style={{ width: 52, textAlign: 'right', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
                {e.total_score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
