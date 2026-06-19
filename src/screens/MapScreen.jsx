import { useState, useEffect, useRef, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import { haversine, fmtDist } from '../lib/geo'
import { getMap, resetMap, LIGHT, DARK } from '../lib/map'
import { showToast } from '../lib/toast'
import { LS } from '../lib/storage'
import { Icons } from '../components/Icons'
import PlaceListPanel from '../components/PlaceListPanel'
import PlaceDetailPanel from '../components/PlaceDetailPanel'
import MysteryPanel from '../components/MysteryPanel'
import SuspectGuessPanel from '../components/SuspectGuessPanel'
import MapSettingsPanel from '../components/MapSettingsPanel'


export default function MapScreen({ asgn, sess, prog, dark, setDark, guess, onGuess, panel, setPanel, place, setPlace, onLeave, visit, answer, revealedClues, revealClue, online, preview }) {
  const mapReady = useRef(false)
  const completionShown = useRef(false)
  const completionShownTrail = useRef(false)
  const posRef = useRef(null)
  const warned60 = useRef(false)
  const [mapLoadCount, setMapLoadCount] = useState(0)
  const [settings, setSettings] = useState(() => LS.get('pp_settings') || { trailLine: false, navRoute: false })
  const [timeLeft, setTimeLeft] = useState(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showTrailComplete, setShowTrailComplete] = useState(false)
  const [gps, setGps] = useState('searching')
  const [pos, setPos] = useState(null)
  const [dist, setDist] = useState({})
  const [quit, setQuit] = useState(false)
  const [intro, setIntro] = useState(true)

  const places = asgn.places || []
  const mystery = asgn.type === 'mystery'
  const trail = asgn.type === 'trail' || asgn.type === 'quiz_walk'
  const hasSuspects = places.some(p => (p.content_blocks || []).some(b => b.type === 'suspect'))

  function unlocked(p) {
    if (preview) return true
    if (asgn.unlock_mode !== 'linear') return true
    if (p.stop_order === 0) return true
    const prev = places.find(x => x.id === p.unlocks_after_place_id)
    return prev ? !!prog[prev.id]?.visited : true
  }
  function visited(id) { return !!prog[id]?.visited }
  function near(p) {
    if (preview) return true
    const d = dist[p.id]; return d !== undefined && d <= (p.activation_radius_meters || 30)
  }

  const vc = places.filter(p => visited(p.id)).length
  const next = useMemo(() =>
    places.filter(p => !visited(p.id) && unlocked(p))
      .sort((a, b) => (dist[a.id] || 9e9) - (dist[b.id] || 9e9))[0] || null
  , [dist, prog, places])

  // Countdown timer
  const timeLimit = (asgn.time_limit_minutes || 0) * 60
  useEffect(() => {
    if (!timeLimit) return
    const startAt = LS.get('pp_start_at') || Date.now()
    function tick() {
      const elapsed = Math.floor((Date.now() - startAt) / 1000)
      const left = Math.max(0, timeLimit - elapsed)
      setTimeLeft(left)
      if (left <= 60 && !warned60.current) {
        warned60.current = true
        showToast('⏱ 1 minut kvar!', 'info', 4000)
      }
      if (left === 0) {
        showToast('⏰ Tiden är ute!', 'wrong', 5000)
        onLeave()
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timeLimit])

  // Persist settings
  useEffect(() => { LS.set('pp_settings', settings) }, [settings])

  // Keep posRef current for nav route fetch
  useEffect(() => { posRef.current = pos }, [pos])

  // Init map
  useEffect(() => {
    const map = getMap()
    function onLoad() {
      map.resize()
      mapReady.current = true
      setMapLoadCount(1)
      updateMarkers()
      if (places.length) {
        map.flyTo({ center: [places[0].longitude, places[0].latitude], zoom: 14, duration: 0 })
      }
    }
    if (map.isStyleLoaded()) setTimeout(onLoad, 50)
    else map.once('load', onLoad)
    return () => { mapReady.current = false }
  }, [])

  // Dark/light toggle
  useEffect(() => {
    const map = getMap()
    if (!map) return
    map.setStyle(dark ? DARK : LIGHT)
    map.once('styledata', () => {
      if (mapReady.current) {
        updateMarkers()
        setMapLoadCount(c => c + 1)
      }
    })
  }, [dark])

  // Trail line layer
  useEffect(() => {
    if (!mapLoadCount) return
    const map = getMap()
    if (!map) return
    if (map.getLayer('pp-trail-line')) map.removeLayer('pp-trail-line')
    if (map.getSource('pp-trail')) map.removeSource('pp-trail')
    if (!settings.trailLine || places.length < 2) return
    const sorted = [...places].sort((a, b) => a.stop_order - b.stop_order)
    map.addSource('pp-trail', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: sorted.map(p => [p.longitude, p.latitude]) } },
    })
    map.addLayer({
      id: 'pp-trail-line', type: 'line', source: 'pp-trail',
      layout: { 'line-join': 'round', 'line-cap': 'butt' },
      paint: { 'line-color': '#f97316', 'line-width': 3, 'line-dasharray': [2, 3], 'line-opacity': 0.75 },
    })
  }, [settings.trailLine, mapLoadCount])

  // Nav route layer
  useEffect(() => {
    if (!mapLoadCount) return
    const map = getMap()
    if (!map) return
    if (!settings.navRoute || !next) {
      if (map.getLayer('pp-nav-line')) map.removeLayer('pp-nav-line')
      if (map.getSource('pp-nav')) map.removeSource('pp-nav')
      return
    }
    const currentPos = posRef.current
    if (!currentPos) return
    const token = mapboxgl.accessToken
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${currentPos.lng},${currentPos.lat};${next.longitude},${next.latitude}?geometries=geojson&access_token=${token}`
    let cancelled = false
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const m = getMap()
        if (!m) return
        const coords = data.routes?.[0]?.geometry?.coordinates
        if (!coords) return
        if (m.getLayer('pp-nav-line')) m.removeLayer('pp-nav-line')
        if (m.getSource('pp-nav')) m.removeSource('pp-nav')
        m.addSource('pp-nav', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
        })
        m.addLayer({
          id: 'pp-nav-line', type: 'line', source: 'pp-nav',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.85 },
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [settings.navRoute, next?.id, mapLoadCount])

  function updateMarkers() {
    const map = getMap()
    if (!map || !mapReady.current) return
    places.forEach(p => {
      const v = visited(p.id), u = unlocked(p)
      const cls = v ? 'visited' : u ? 'unlocked' : 'locked'
      const lbl = v ? '✓' : String(asgn.show_place_numbers ? p.stop_order + 1 : '●')
      if (window.MAP_MARKERS[p.id]) {
        const el = window.MAP_MARKERS[p.id].getElement()
        el.querySelector('.pm').className = `pm ${cls}`
        el.querySelector('span').textContent = lbl
      } else {
        const el = document.createElement('div')
        el.className = 'pm-wrap'
        el.innerHTML = `<div class="pm ${cls}"><span>${lbl}</span></div>`
        el.addEventListener('click', () => setPlace(p))
        window.MAP_MARKERS[p.id] = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.longitude, p.latitude])
          .addTo(map)
      }
    })
  }

  useEffect(() => { if (mapReady.current) updateMarkers() }, [prog])

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGps('error'); return }
    const id = navigator.geolocation.watchPosition(
      p => { setGps('active'); setPos({ lat: p.coords.latitude, lng: p.coords.longitude }) },
      () => setGps('error'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  useEffect(() => {
    const map = getMap()
    if (!map || !mapReady.current || !pos) return
    if (!window.USER_MARKER) {
      const el = document.createElement('div'); el.className = 'user-dot'
      window.USER_MARKER = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([pos.lng, pos.lat]).addTo(map)
    } else {
      window.USER_MARKER.setLngLat([pos.lng, pos.lat])
    }
    const d = {}
    places.forEach(p => {
      const dd = haversine(pos.lat, pos.lng, p.latitude, p.longitude)
      const wasNear = dist[p.id] !== undefined && dist[p.id] <= (p.activation_radius_meters || 30)
      const isNear = dd <= (p.activation_radius_meters || 30)
      if (isNear && !wasNear && unlocked(p) && !visited(p.id)) {
        showToast(`📍 Du är vid ${p.title} — öppna platsen för att besöka den`, 'info', 4000)
      }
      d[p.id] = dd
    })
    setDist(d)
  }, [pos])

  // Mystery: show whodunit card after player closes the last place detail panel
  useEffect(() => {
    if (!mystery || !hasSuspects || guess || completionShown.current) return
    if (!place && vc === places.length && places.length > 0) {
      completionShown.current = true
      setShowCompletion(true)
    }
  }, [place, vc])

  // Trail: show completion card after player closes the last place detail panel
  useEffect(() => {
    if (!trail || completionShownTrail.current) return
    if (!place && vc === places.length && places.length > 0) {
      completionShownTrail.current = true
      setShowTrailComplete(true)
    }
  }, [place, vc])

  function fmtTimer(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function statusLines() {
    if (preview) return ['Förhandsvisning', 'klicka för att öppna']
    const lines = []
    if (next) {
      if (!unlocked(next)) {
        const prev = places.find(p => p.id === next.unlocks_after_place_id)
        lines.push('låst tills')
        if (prev) lines.push(`${prev.title} är besökt`)
      } else {
        lines.push('upplåst')
      }
    }
    lines.push(gps === 'active' ? 'GPS aktiv' : gps === 'searching' ? 'Söker GPS…' : 'Ingen GPS')
    return lines
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {/* Preview banner */}
      {preview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
          background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 600,
          textAlign: 'center', padding: '5px 0', letterSpacing: '.06em',
          pointerEvents: 'none',
        }}>
          FÖRHANDSVISNING — Klicka på platser för att öppna dem
        </div>
      )}
      {/* Offline banner */}
      {online === false && (
        <div style={{
          position: 'fixed', top: preview ? 25 : 0, left: 0, right: 0, zIndex: 300,
          background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600,
          textAlign: 'center', padding: '5px 0', letterSpacing: '.02em',
          pointerEvents: 'none',
        }}>
          Offline — framsteg sparas lokalt och synkroniseras när du är online
        </div>
      )}
      {/* HUD */}
      <div className="hud-top" style={(preview || online === false) ? { top: 25 } : undefined}>
        <div className="hud-row1">
          <div className="hud-icon"><Icons.Pin /></div>
          <div className="hud-next">
            <div className="hud-label">NÄSTA PLATS</div>
            <div className="hud-title">
              {next
                ? `${next.title} · ${dist[next.id] ? fmtDist(dist[next.id]) : '…'}`
                : vc === places.length ? 'Alla besökta!' : 'Inga fler'}
            </div>
          </div>
          <div className="hud-status">
            {statusLines().map((l, i) => <div key={i} className="hud-status-line">{l}</div>)}
          </div>
        </div>
        <div className="hud-row2">
          <div className="hud-progress">
            <div className="hud-count">{vc}/{places.length}</div>
            <div className="hud-progress-track">
              <div className="hud-progress-fill" style={{ width: `${places.length ? vc / places.length * 100 : 0}%` }} />
            </div>
          </div>
          {timeLeft !== null ? (
            <div className="hud-name" style={{
              fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: timeLeft < 30 ? '#ef4444' : timeLeft < 120 ? '#f97316' : 'var(--text2)',
            }}>
              ⏱ {fmtTimer(timeLeft)}
            </div>
          ) : (
            <div className="hud-name">{asgn.title}</div>
          )}
        </div>
      </div>

      {/* Map controls */}
      <div className="map-ctrls">
        <button className="map-ctrl" onClick={() => pos && getMap()?.flyTo({ center: [pos.lng, pos.lat], zoom: 16, duration: 600 })}><Icons.Aim /></button>
        <button className="map-ctrl" onClick={() => getMap()?.zoomIn()}><Icons.Plus /></button>
        <button className="map-ctrl" onClick={() => getMap()?.zoomOut()}><Icons.Minus /></button>
        <button className="map-ctrl" onClick={() => setDark(d => !d)}>{dark ? <Icons.Sun /> : <Icons.Moon />}</button>
        <button className="map-ctrl" onClick={() => setIntro(true)}><Icons.Info /></button>
        <button className={`map-ctrl${panel === 'settings' ? ' active' : ''}`} onClick={() => setPanel(p => p === 'settings' ? null : 'settings')}><Icons.Settings /></button>
      </div>

      {/* Intro sheet */}
      {intro && asgn.description && (
        <>
          <div className="sheet-overlay" onClick={() => setIntro(false)} />
          <div className="sheet" style={{ maxHeight: '75vh' }}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div style={{ width: 48 }} />
              <div className="sheet-title">{asgn.title}</div>
              <button className="sh-action" onClick={() => setIntro(false)}>Stäng</button>
            </div>
            {asgn.intro_title && (
              <div style={{ padding: '6px 16px 0', fontSize: 13, color: 'var(--text2)' }}>{asgn.intro_title}</div>
            )}
            <div className="sheet-body" style={{ padding: '12px 16px 24px' }}>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{asgn.description}</div>
            </div>
          </div>
        </>
      )}

      {/* Bottom summary */}
      {!place && !panel && (
        <div className="map-summary">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{asgn.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{places.length} platser · {vc} besökta · {places.length - vc} kvar</div>
          {next && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>Nästa: {next.title}{dist[next.id] ? ` · ${fmtDist(dist[next.id])} kvar` : ''}</div>}
          {mystery && hasSuspects && vc === places.length && places.length > 0 && (
            <button
              onClick={() => setPanel('solve')}
              style={{
                marginTop: 10, width: '100%', padding: '10px 0',
                background: guess ? 'rgba(249,115,22,.12)' : '#e11d48',
                border: guess ? '1px solid rgba(249,115,22,.4)' : 'none',
                borderRadius: 10, color: guess ? 'var(--accent)' : '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {guess ? '🔍 Visa lösningen' : '🔍 Vem är skyldig? →'}
            </button>
          )}
          {trail && vc === places.length && places.length > 0 && (
            <button
              onClick={onLeave}
              style={{
                marginTop: 10, width: '100%', padding: '10px 0',
                background: 'var(--accent)', border: 'none',
                borderRadius: 10, color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🏆 Se resultaten →
            </button>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <button className={`nav-btn ${!panel && !place ? 'active' : ''}`} onClick={() => { setPanel(null); setPlace(null) }}>
          <Icons.Map />Karta
        </button>
        <button className={`nav-btn ${panel === 'list' ? 'active' : ''}`} onClick={() => setPanel(p => p === 'list' ? null : 'list')}>
          <Icons.List />Platser
        </button>
        {mystery && (
          <button className={`nav-btn ${panel === 'notes' ? 'active' : ''}`} onClick={() => setPanel(p => p === 'notes' ? null : 'notes')}>
            <Icons.Book />Fallboken
          </button>
        )}
        <button className="nav-btn danger" onClick={() => setQuit(true)}>
          <Icons.Leave />Avsluta
        </button>
      </div>

      {/* Panels */}
      {panel === 'list' && (
        <PlaceListPanel
          places={places} prog={prog} dist={dist}
          unlocked={unlocked} visited={visited} asgn={asgn}
          onClose={() => setPanel(null)}
          onPlace={p => { setPlace(p); setPanel(null) }}
        />
      )}
      {panel === 'notes' && (
        <MysteryPanel
          asgn={asgn}
          sess={sess}
          places={places}
          prog={prog}
          revealedClues={revealedClues}
          revealClue={revealClue}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'solve' && mystery && (
        <SuspectGuessPanel
          places={places}
          sess={sess}
          asgn={asgn}
          guess={guess}
          onGuess={onGuess}
          onClose={() => setPanel(null)}
          onLeave={() => { setPanel(null); onLeave() }}
        />
      )}
      {panel === 'settings' && (
        <MapSettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setPanel(null)}
        />
      )}
      {place && (
        <PlaceDetailPanel
          place={place} asgn={asgn} sess={sess}
          prog={prog[place.id] || {}} dist={dist}
          unlocked={unlocked(place)} near={near(place)}
          onClose={() => setPlace(null)}
          onList={() => { setPlace(null); setPanel('list') }}
          visit={visit} answer={answer}
          revealedClues={revealedClues} revealClue={revealClue}
        />
      )}

      {/* Mystery completion card */}
      {showCompletion && mystery && !guess && (
        <div className="dialog-overlay" onClick={() => setShowCompletion(false)}>
          <div className="dialog" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🔍</div>
            <h2 style={{ marginBottom: 8 }}>Alla platser besökta!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Du har samlat in alla ledtrådar. Nu är det dags att peka ut den skyldige.
              Tänk efter noga innan du bekräftar din gissning.
            </p>
            <div className="d-btns" style={{ flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ background: '#e11d48', width: '100%' }}
                onClick={() => { setShowCompletion(false); setPanel('solve') }}
              >
                Lös mordgåtan →
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setShowCompletion(false)}
              >
                Utforska vidare först
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trail completion card */}
      {showTrailComplete && trail && (
        <div className="dialog-overlay" onClick={() => setShowTrailComplete(false)}>
          <div className="dialog" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🏆</div>
            <h2 style={{ marginBottom: 8 }}>Tipspromenaden klar!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Du har besökt alla {places.length} platser. Se dina svar och poäng på resultatsidan.
            </p>
            <div className="d-btns" style={{ flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => { setShowTrailComplete(false); onLeave() }}
              >
                Se resultaten →
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setShowTrailComplete(false)}
              >
                Utforska vidare
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit dialog */}
      {quit && (
        <div className="dialog-overlay">
          <div className="dialog">
            {mystery && hasSuspects && !guess && vc === places.length && places.length > 0 ? (
              <>
                <h2>Lös mordgåtan?</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                  Du har inte pekat ut den skyldige än. Vill du lösa mordgåtan innan du avslutar?
                </p>
                <div className="d-btns" style={{ flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#e11d48', width: '100%' }}
                    onClick={() => { setQuit(false); setPanel('solve') }}
                  >
                    🔍 Lös mordgåtan
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setQuit(false)}>
                    Fortsätt utforska
                  </button>
                </div>
                <button
                  style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', width: '100%' }}
                  onClick={() => { setQuit(false); onLeave() }}
                >
                  Avsluta utan att lösa
                </button>
              </>
            ) : (
              <>
                <h2>Avsluta uppdraget?</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
                  {vc === places.length
                    ? 'Du har besökt alla platser. Dina framsteg sparas.'
                    : `Du har ${places.length - vc} platser kvar. Dina framsteg sparas och du kan återvända senare.`}
                </p>
                <div className="d-btns">
                  <button className="btn btn-secondary" onClick={() => setQuit(false)}>Fortsätt uppdraget</button>
                  <button className="btn btn-danger" onClick={() => { setQuit(false); onLeave() }}>Avsluta</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
