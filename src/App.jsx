import { useState, useEffect, useRef } from 'react'
import { LS } from './lib/storage'
import { resetMap } from './lib/map'
import { dequeue, enqueue } from './lib/network'
import { apiFetch } from './lib/api'
import { showToast } from './lib/toast'
import CodeScreen from './screens/CodeScreen'
import IntroScreen from './screens/IntroScreen'
import MapScreen from './screens/MapScreen'
import DoneScreen from './screens/DoneScreen'
import InstallPrompt from './components/InstallPrompt'

export default function App() {
  const [screen, setScreen] = useState(() => {
    const hasSession = !!LS.get('pp_s')
    const hasAssignment = !!LS.get('pp_a')
    return (hasSession && hasAssignment) ? 'map' : 'code'
  })
  const [asgn, setAsgn] = useState(() => {
    const a = LS.get('pp_a')
    if (a && !a._code) a._code = LS.get('pp_code') || ''
    return a
  })
  const [sess, setSess] = useState(() => LS.get('pp_s'))
  const [prog, setProg] = useState(() => LS.get('pp_p') || {})
  const [dark, setDark] = useState(() => LS.get('pp_dark') || false)
  const [preview, setPreview] = useState(false)
  const [name, setName] = useState(() => LS.get('pp_nickname') || '')
  const [guess, setGuess] = useState(() => LS.get('pp_guess') || null)
  const [revealedClues, setRevealedClues] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pp_revealed_clues') || '[]')) } catch { return new Set() }
  })
  const [place, setPlace] = useState(null)
  const [panel, setPanel] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [dupTab, setDupTab] = useState(false)
  const bcRef = useRef(null)
  const installPromptRef = useRef(null)

  useEffect(() => { if (asgn) LS.set('pp_a', asgn) }, [asgn])
  useEffect(() => { if (sess) LS.set('pp_s', sess) }, [sess])
  useEffect(() => { LS.set('pp_p', prog) }, [prog])
  useEffect(() => { LS.set('pp_dark', dark) }, [dark])

  // Online/offline detection + queue replay
  useEffect(() => {
    async function handleOnline() {
      setOnline(true)
      const items = dequeue()
      if (!items.length) return
      let ok = 0
      const failed = []
      for (const item of items) {
        try { await apiFetch(item.path, { method: item.method, body: item.body }); ok++ }
        catch { failed.push(item) }
      }
      failed.forEach(item => enqueue(item.path, item.method, item.body))
      if (ok > 0) showToast(`${ok} offline-ändringar synkroniserade`, 'info')
    }
    function handleOffline() { setOnline(false) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Detect duplicate tab — only warn if an active session exists
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const bc = new BroadcastChannel('paplats')
    bcRef.current = bc
    let answered = false
    bc.onmessage = (e) => {
      if (e.data === 'ping') {
        if (LS.get('pp_s')) bc.postMessage('pong')
      } else if (e.data === 'pong' && !answered) {
        answered = true
        setDupTab(true)
      } else if (e.data === 'takeover') {
        setDupTab(false)
      }
    }
    bc.postMessage('ping')
    return () => bc.close()
  }, [])

  // Capture native install prompt (Android/Chrome)
  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault()
      installPromptRef.current = e
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  function revealClue(id) {
    setRevealedClues(s => {
      const next = new Set(s)
      next.add(id)
      localStorage.setItem('pp_revealed_clues', JSON.stringify([...next]))
      return next
    })
  }

  function reset() {
    resetMap()
    ;['pp_a', 'pp_s', 'pp_p', 'pp_code', 'pp_guess', 'pp_revealed_clues', 'pp_start_at'].forEach(k => LS.del(k))
    setAsgn(null); setSess(null); setProg({}); setGuess(null)
    setRevealedClues(new Set()); setPlace(null); setPanel(null); setPreview(false); setScreen('code')
  }

  function visit(id) {
    setProg(p => ({ ...p, [id]: { ...p[id], visited: true, answers: p[id]?.answers || {} } }))
  }

  function answer(pid, bid, ans) {
    setProg(p => ({ ...p, [pid]: { ...p[pid], answers: { ...(p[pid]?.answers || {}), [bid]: ans } } }))
  }

  return (
    <>
      {screen === 'code' && (
        <CodeScreen
          onLoad={(a, code, playerName, isPreview) => {
            setAsgn({ ...a, _code: code })
            if (playerName) setName(playerName)
            if (isPreview) {
              setPreview(true)
              setSess({ session_token: null, preview: true })
              setProg({})
              setScreen('map')
            } else {
              LS.set('pp_code', code)
              setScreen('intro')
            }
          }}
          existing={asgn}
          hasSess={!!sess}
          onResume={() => setScreen('map')}
          onReset={reset}
        />
      )}

      {screen === 'intro' && (
        <IntroScreen
          asgn={asgn}
          name={name}
          onBack={() => setScreen('code')}
          onStart={s => { setSess(s); setProg({}); LS.set('pp_start_at', Date.now()); setScreen('map') }}
        />
      )}

      {screen === 'map' && (
        <MapScreen
          asgn={asgn} sess={sess} prog={prog}
          dark={dark} setDark={setDark}
          panel={panel} setPanel={setPanel}
          place={place} setPlace={setPlace}
          guess={guess} onGuess={g => { setGuess(g); LS.set('pp_guess', g) }}
          onLeave={() => setScreen('done')}
          visit={visit} answer={answer}
          revealedClues={revealedClues} revealClue={revealClue}
          online={online}
          preview={preview}
        />
      )}

      {screen === 'done' && (
        <DoneScreen asgn={asgn} sess={sess} prog={prog} guess={guess} onReset={reset} onBack={() => setScreen('map')} />
      )}

      {dupTab && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: 28, maxWidth: 340, width: '100%',
            color: '#f1f5f9', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ marginBottom: 12 }}>
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Appen är redan öppen</h2>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
              Du har redan På Plats öppet i en annan flik. Vill du fortsätta här istället?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { bcRef.current?.postMessage('takeover'); setDupTab(false) }}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: '#f97316', color: '#fff', fontWeight: 700,
                  fontSize: 15, cursor: 'pointer'
                }}
              >
                Ja, ta över
              </button>
              <button
                onClick={() => setDupTab(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: '#334155', color: '#f1f5f9', fontWeight: 600,
                  fontSize: 15, cursor: 'pointer'
                }}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'code' && (
        <InstallPrompt installPromptRef={installPromptRef} />
      )}
    </>
  )
}
