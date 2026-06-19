import { useState } from 'react'
import { LS } from '../lib/storage'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isAndroid = /android/i.test(navigator.userAgent)
const isMobile = isIOS || isAndroid
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function InstallPrompt({ installPromptRef }) {
  const [open, setOpen] = useState(false)
  const [gone, setGone] = useState(() => !!LS.get('pp_install_dismissed'))

  if (isStandalone || !isMobile || gone) return null

  async function installAndroid() {
    const evt = installPromptRef.current
    if (evt) {
      evt.prompt()
      const { outcome } = await evt.userChoice
      if (outcome === 'accepted') {
        LS.set('pp_install_dismissed', true)
        setGone(true)
        return
      }
    }
    setOpen(false)
  }

  function neverShow() {
    LS.set('pp_install_dismissed', true)
    setGone(true)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9997,
      padding: open ? '0 16px 28px' : '12px 16px 28px',
      pointerEvents: 'none',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', pointerEvents: 'auto' }}>

        {/* Collapsed: single small button */}
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 12,
              border: '1px solid rgba(249,115,22,0.4)',
              background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)',
              color: '#f97316', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Installera appen för bästa upplevelse
          </button>
        )}

        {/* Expanded: full instructions */}
        {open && (
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 16,
            padding: '20px 20px 16px',
            color: '#f1f5f9',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/icons/icon-192.png" alt="På Plats" width={36} height={36}
                style={{ borderRadius: 8, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Installera På Plats</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Fungerar offline · sparar din plats</div>
              </div>
            </div>

            {isIOS && (
              <div style={{
                background: '#0f172a', borderRadius: 10, padding: '12px 14px',
                marginBottom: 14, fontSize: 14, color: '#cbd5e1', lineHeight: 1.7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>1.</span>
                  <span>Tryck på</span>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                    stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0 }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <span>i adressfältet</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>2.</span>
                  <span>Välj <strong style={{ color: '#f1f5f9' }}>"Lägg till på hemskärmen"</strong></span>
                </div>
              </div>
            )}

            {isAndroid && (
              <button
                type="button"
                onClick={installAndroid}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  background: '#f97316', color: '#fff', fontWeight: 700,
                  fontSize: 15, cursor: 'pointer', marginBottom: 14,
                }}
              >
                Lägg till på hemskärmen
              </button>
            )}

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '3px 12px', fontSize: 12, color: '#64748b', marginBottom: 14,
            }}>
              <span><b style={{ color: '#475569' }}>GPS:</b> aktiverat på enheten</span>
              <span><b style={{ color: '#475569' }}>OS:</b> {isIOS ? 'iOS 15+, Safari' : 'Android 8+, Chrome'}</span>
              <span><b style={{ color: '#475569' }}>Nätverk:</b> krävs för start</span>
              <span><b style={{ color: '#475569' }}>Karta:</b> kräver WebGL</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: '#334155', color: '#f1f5f9', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Stäng
              </button>
              <button
                type="button"
                onClick={neverShow}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: 'transparent', color: '#64748b', fontWeight: 500,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Visa inte igen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
