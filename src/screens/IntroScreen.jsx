import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { LS } from '../lib/storage'
import { showToast } from '../lib/toast'

export default function IntroScreen({ asgn, name, onBack, onStart }) {
  const [loading, setLoading] = useState(false)

  async function startSession() {
    const code = asgn._code || LS.get('pp_code') || ''
    const res = await apiFetch('/sessions', {
      method: 'POST',
      body: { access_code: code, ...(name ? { name, nickname: name } : {}) },
    })
    return res.data || res
  }

  async function go() {
    setLoading(true)
    try {
      const sess = await startSession()
      onStart(sess)
    } catch (e) {
      showToast(e.message || 'Kunde inte starta', 'wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'all' }}>
      {/* Dark gradient over map */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.70) 45%, rgba(8,12,28,0.97) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}>
        <div style={{ padding: '0 20px', maxWidth: 480, width: '100%', margin: '0 auto' }}>

          {/* Cover media */}
          {asgn.intro_media_url && (
            <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
              {asgn.intro_media_type === 'video'
                ? <video src={asgn.intro_media_url} autoPlay muted loop playsInline style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                : <img src={asgn.intro_media_url} alt={asgn.title} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              }
            </div>
          )}

          {/* Assignment card */}
          <div style={{
            background: 'rgba(15,23,42,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 18, marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: 6 }}>UPPDRAG</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: asgn.intro_body ? 10 : 0 }}>{asgn.title}</div>
            {asgn.intro_body && (
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{asgn.intro_body}</div>
            )}
          </div>

          {/* Buttons */}
          <button
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: loading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white', fontWeight: 800, fontSize: 17, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
            }}
            onClick={go}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />
                Startar…
              </>
            ) : 'Starta uppdrag'}
          </button>

          <button
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onClick={onBack}
          >
            Tillbaka
          </button>
        </div>
      </div>
    </div>
  )
}
