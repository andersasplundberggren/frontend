const CACHE = 'paplats-v5'
const MEDIA_CACHE = 'paplats-media-v1'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest', '/icons/icon.svg']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== MEDIA_CACHE).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skippa Mapbox och externa resurser
  if (!url.origin.includes(self.location.hostname) && !url.hostname.includes('paplats.pixelworks.se')) return

  // Cache-first för mediafiler — laddas en gång och används offline
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/media/')) {
    e.respondWith(
      caches.open(MEDIA_CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      })
    )
    return
  }

  // Network-first för API-anrop — alltid färsk data, cache som fallback
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // index.html — alltid från nätverket, aldrig cachad (så ny JS alltid laddas)
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  // Network-first för app-skalet med cache-fallback (offline-stöd)
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
        return res
      })
      .catch(() => caches.match(request) || caches.match('/'))
  )
})
