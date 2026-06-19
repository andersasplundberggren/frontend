import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { LS } from '../lib/storage'

const GUIDE_STEPS = [
  {
    n: 1,
    title: 'Ange åtkomstkoden',
    body: 'Koden finns på inbjudningskortet eller QR-skylten vid startpunkten. Skriv in den och tryck på Öppna uppdrag.',
    bold: 'Öppna uppdrag',
  },
  {
    n: 2,
    title: 'Hitta platser på kartan',
    body: 'Kartan visar din position och uppdragets platser. Gå fysiskt till en plats för att låsa upp dess innehåll.',
  },
  {
    n: 3,
    title: 'Utforska innehållet på plats',
    body: 'Varje plats har unikt innehåll — historik, frågor, ledtrådar eller utmaningar. Tryck på knappen längst ned på kartan för att komma till närmaste plats.',
  },
  {
    n: 4,
    title: 'Svara på frågor och lös gåtor',
    body: 'I tipspromenader svarar du direkt i appen. I mordgåtor och skattjakter kan du öppna ledtrådar och använda anteckningsfunktionen.',
  },
  {
    n: 5,
    title: 'Avsluta uppdraget',
    body: 'Tryck på Avsluta uppdrag när du är klar för att se ditt resultat och avsluta sessionen.',
    bold: 'Avsluta uppdrag',
  },
]

function GuideSheet({ onClose }) {
  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', pointerEvents: 'all' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        background: '#111827',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.4)',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 201,
        animation: 'slideUp .28s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'all',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '12px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 17, fontWeight: 700, color: 'white', flex: 2, textAlign: 'center' }}>Så fungerar appen</div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#f97316', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Stäng</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 16px 40px', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#f97316', marginBottom: 4, marginTop: 16 }}>PÅ PLATS GUIDE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 20 }}>Så fungerar appen</div>
          {GUIDE_STEPS.map(step => (
            <div key={step.n} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: 16, marginBottom: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15, color: '#93c5fd', flexShrink: 0,
              }}>{step.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  {step.bold
                    ? step.body.split(step.bold).map((part, i, arr) => (
                        <span key={i}>{part}{i < arr.length - 1 && <strong style={{ color: '#cbd5e1' }}>{step.bold}</strong>}</span>
                      ))
                    : step.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function CodeScreen({ onLoad, existing, hasSess, onResume, onReset }) {
  const params = new URLSearchParams(window.location.search)
  const initCode = params.get('code') || ''
  const initPreview = params.get('preview') || ''
  const [code, setCode] = useState(initCode)
  const [name, setName] = useState(() => LS.get('pp_nickname') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (initPreview && !existing) loadPreview(initPreview)
    else if (initCode && !existing) load(initCode)
  }, [])

  async function loadPreview(token) {
    setLoading(true); setError('')
    try {
      const res = await apiFetch(`/assignments/preview/${encodeURIComponent(token)}`)
      onLoad(res.data, null, '', true)
    } catch (e) {
      setError(e.message || 'Förhandsvisningen hittades inte.')
    } finally {
      setLoading(false)
    }
  }

  async function load(c = code) {
    const t = c.trim().toUpperCase()
    if (!t) return
    const n = name.trim()
    if (n) LS.set('pp_nickname', n)
    setLoading(true); setError('')
    try {
      const res = await apiFetch(`/assignments/${encodeURIComponent(t)}`)
      const assignment = res.data
      onLoad(assignment, t, n)
    } catch (e) {
      setError(e.message || 'Uppdraget hittades inte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'all' }}>
      {/* Dark gradient over the map */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,12,28,0.55) 0%, rgba(8,12,28,0.75) 50%, rgba(8,12,28,0.97) 100%)',
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

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#f97316', marginBottom: 6 }}>PÅ PLATS</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.1 }}>Ange kod</div>
          </div>

          {/* Resume banner */}
          {existing && hasSess && (
            <div style={{
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 8, fontWeight: 500 }}>Pågående uppdrag: <strong style={{ color: 'white' }}>{existing.title}</strong></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                    background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onClick={onResume}
                >
                  Fortsätt
                </button>
                <button
                  style={{
                    padding: '9px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94a3b8', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onClick={onReset}
                >
                  Avsluta
                </button>
              </div>
            </div>
          )}

          {/* Form card */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 16, marginBottom: 12,
          }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: 6 }}>ÅTKOMSTKOD</label>
              <input
                style={{
                  width: '100%', padding: '13px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: '.08em',
                  textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                onKeyDown={e => e.key === 'Enter' && load()}
                placeholder="Till exempel KARLSKOGA"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={20}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b', marginBottom: 2 }}>
                NAMN <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#475569' }}>— valfritt</span>
              </label>
              <input
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.4)', border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 15, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()}
                placeholder="Ditt namn (visas för arrangören)"
                autoComplete="name"
                maxLength={30}
              />
            </div>
            {error && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', color: '#fca5a5', fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          {/* Primary button */}
          <button
            style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: loading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white', fontWeight: 800, fontSize: 17, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
              transition: 'opacity .15s',
            }}
            onClick={() => load()}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />
                Hämtar…
              </>
            ) : 'Öppna uppdrag'}
          </button>

          {/* Guide button */}
          <button
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20,
            }}
            onClick={() => setShowGuide(true)}
          >
            Så fungerar det
          </button>

          {/* Footer */}
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
            Namn är frivilligt och visas bara för arrangören.<br />Framsteg sparas lokalt under pågående uppdrag.
          </p>
        </div>
      </div>

      {showGuide && <GuideSheet onClose={() => setShowGuide(false)} />}
    </div>
  )
}
