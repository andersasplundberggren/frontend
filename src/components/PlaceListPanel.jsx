import { fmtDist } from '../lib/geo'
import { Icons } from './Icons'

export default function PlaceListPanel({ places, prog, dist, unlocked, visited, asgn, onClose, onPlace }) {
  const vc = places.filter(p => visited(p.id)).length
  const nxt = places.find(p => !visited(p.id) && unlocked(p))

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">{asgn.title}</div>
          <div style={{ width: 48, fontSize: 13, color: 'var(--text2)', textAlign: 'right' }}>{vc}/{places.length}</div>
        </div>
        <div style={{ padding: '8px 16px 6px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)' }}>
          {vc}/{places.length} besökta{nxt ? ` • Nästa: ${nxt.title}` : ''}
        </div>
        <div className="sheet-body">
          {places.map(p => {
            const v = visited(p.id), u = unlocked(p), d = dist[p.id]
            const r = p.activation_radius_meters || 30
            const cls = v ? 'visited' : u ? 'unlocked' : 'locked'
            const sub = v ? '' : u
              ? (d ? `${fmtDist(d)} • Låst tills du är inom ${r} m` : 'Gå till platsen')
              : `Låst tills ${places.find(x => x.id === p.unlocks_after_place_id)?.title || 'föregående'} är besökt`

            return (
              <div key={p.id} className="place-row" onClick={() => onPlace(p)}>
                <div className={`place-num ${cls}`}>{v ? '✓' : p.stop_order + 1}</div>
                <div className="place-info">
                  <div className="place-name">{p.title}</div>
                  <div className="place-desc">{p.short_description || 'Ingen beskrivning tillgänglig ännu.'}</div>
                  {sub && <div className="place-sub">{sub}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {v
                    ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>Besökt</span>
                    : !u
                    ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Ordning</span>
                    : d ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{fmtDist(d)}</span>
                    : null}
                  <Icons.Chevron />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
