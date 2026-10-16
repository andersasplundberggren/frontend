import { useState } from 'react'
import { reliabilityInfo } from '../lib/mystery'

// Etikett för vittnets tillförlitlighet (Pålitlig / Osäker / Misstänksam).
export function ReliabilityBadge({ value, small = false }) {
  const r = reliabilityInfo(value)
  if (!r) return null
  return (
    <span style={{ fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? '2px 6px' : '3px 8px', borderRadius: 6, background: r.bg, color: r.color, flexShrink: 0 }}>
      {r.label}
    </span>
  )
}

// Bevisets "dolda detaljbeskrivning" – visas först när spelaren granskar beviset.
export function EvidenceDetail({ text, small = false }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  if (open) {
    return (
      <div style={{ fontSize: small ? 12 : 13, color: 'var(--text2)', lineHeight: 1.6, marginTop: 8, padding: '8px 10px', background: 'rgba(59,130,246,.08)', borderRadius: 8 }}>
        🔎 {text}
      </div>
    )
  }
  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        marginTop: 10, width: '100%', padding: small ? '6px 0' : '8px 0',
        background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.35)',
        borderRadius: 8, color: 'var(--blue)', fontWeight: 600, fontSize: small ? 12 : 13,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      🔎 Granska närmare
    </button>
  )
}
