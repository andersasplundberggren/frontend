import { useState, useEffect } from 'react'
import { LS } from './lib/storage'
import { resetMap, DARK } from './lib/map'
import { dequeue, enqueue, queueSize } from './lib/network'
import { apiFetch } from './lib/api'
import { showToast } from './lib/toast'
import CodeScreen from './screens/CodeScreen'
import IntroScreen from './screens/IntroScreen'
import MapScreen from './screens/MapScreen'
import DoneScreen from './screens/DoneScreen'

export default function App() {
  const [screen, setScreen] = useState('code')
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

  if (screen === 'code') return (
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
  )

  if (screen === 'intro') return (
    <IntroScreen
      asgn={asgn}
      name={name}
      onBack={() => setScreen('code')}
      onStart={s => { setSess(s); setProg({}); LS.set('pp_start_at', Date.now()); setScreen('map') }}
    />
  )

  if (screen === 'map') return (
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
  )

  if (screen === 'done') return (
    <DoneScreen asgn={asgn} sess={sess} prog={prog} guess={guess} onReset={reset} onBack={() => setScreen('map')} />
  )

  return null
}
