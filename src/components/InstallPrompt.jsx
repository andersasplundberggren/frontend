import { useState, useEffect } from 'react'
import { LS } from '../lib/storage'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
const isAndroid = /android/i.test(navigator.userAgent)
const isMobile = isIOS || isAndroid
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export default function InstallPrompt({ installPromptRef }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone) return
    if (!isMobile) return
    if (LS.get('pp_install_dismissed')) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  function dismiss() {
    LS.set('pp_install_dismissed', true)
    setVisible(false)
  }

  async function installAndroid() {
    const evt = installPromptRef.current
    if (evt) {
      evt.prompt()
      const { outcome } = await evt.userChoice
      if (outcome === 'accepted') LS.set('pp_install_dismissed', true)
    }
    setVisible(false)
  }

  function btn(fn) {
    return {
      onTouchEnd: (e) => { e.preventDefault(); fn() },
      onClick: fn,
    }
  }

  return (
    // Full-screen overlay: onTouchStart preventDefault blocks iOS from
    // focusing any input behind the prompt when the user taps anywhere here
    <div
      onTouchStart={e => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9997,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{
          background: '#1e293b',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 16,
          padding: '20px 20px 16px',
          color: '#f1f5f9',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
          maxWidth: 480,
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/icons/icon-192.png" alt="På Plats" width={40} height={40}
                style={{ borderRadius: 10, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Installera På Plats</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Bästa upplevelsen — fungerar offline</div>
              </div>
            </div>
            <button type="button" {...btn(dismiss)} aria-label="Stäng" style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0
            }}>
              ×
            </button>
          </div>

          {isIOS ? (
            <IOSInstructions />
          ) : (
            <button type="button" {...btn(installAndroid)} style={{
              width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
              background: '#f97316', color: '#fff', fontWeight: 700,
              fontSize: 15, cursor: 'pointer', marginBottom: 12
            }}>
              Lägg till på hemskärmen
            </button>
          )}

          <Requirements />

          <button type="button" {...btn(dismiss)} style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 13, cursor: 'pointer', width: '100%', paddingTop: 10
          }}>
            Inte nu
          </button>
        </div>
      </div>
    </div>
  )
}

function IOSInstructions() {
  return (
    <div style={{
      background: '#0f172a', borderRadius: 10, padding: '12px 14px',
      marginBottom: 12, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>1.</span>
        <span>Tryck på</span>
        <ShareIcon />
        <span>i adressfältet</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>2.</span>
        <span>Välj <strong style={{ color: '#f1f5f9' }}>"Lägg till på hemskärmen"</strong></span>
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

function Requirements() {
  return (
    <div style={{
      borderTop: '1px solid #1e293b',
      paddingTop: 10,
      marginTop: 4,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4px 16px',
      fontSize: 12,
      color: '#64748b',
    }}>
      <Row label="GPS" text="aktiverat på enheten" />
      <Row label="Rekommenderas" text={isIOS ? 'iOS 15+, Safari' : 'Android 8+, Chrome'} />
      <Row label="Nätverk" text="krävs för start och synk" />
      <Row label="Karta" text="kräver WebGL-stöd" />
    </div>
  )
}

function Row({ label, text }) {
  return (
    <div>
      <span style={{ color: '#475569', fontWeight: 600 }}>{label}: </span>
      {text}
    </div>
  )
}
