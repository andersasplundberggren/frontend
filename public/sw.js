// Service worker för PÅ PLATS.
// - App-skalet: nätverket först, cache som reserv (offline).
// - Bilder (även från api.pixelworks.se/media): cache först, så att uppdragets
//   bilder fungerar utan täckning. Appen förladdar dem när ett uppdrag startar.
// - Ljud/video och API-anrop går alltid via nätverket.
const CACHE = 'paplats-v6'
const MEDIA_CACHE = 'paplats-media-v2'
const MAX_SHELL_ENTRIES = 60
const MAX_MEDIA_ENTRIES = 400
const IMAGE_EXT = /\.(webp|jpe?g|png|gif|svg)$/i

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest', '/icons/icon.svg']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== MEDIA_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Håll cachen begränsad – äldsta posterna tas bort först. App-skalets
// grundfiler (förinstallerade vid install) tas aldrig bort.
const PINNED = ['/', '/manifest.webmanifest', '/icons/icon.svg']
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = (await cache.keys()).filter(k => !PINNED.includes(new URL(k.url).pathname))
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

function isMediaImage(url) {
  return (url.pathname.startsWith('/media/') || url.pathname.startsWith('/uploads/')) && IMAGE_EXT.test(url.pathname)
}

async function mediaImage(request, url) {
  const cache = await caches.open(MEDIA_CACHE)
  const key = url.href
  const cached = await cache.match(key)
  if (cached) return cached
  // Hämta med CORS så att svaret går att kontrollera och cacha (inte "opaque").
  const res = await fetch(new Request(key, { mode: 'cors', credentials: 'omit' }))
  const type = res.headers.get('content-type') || ''
  // Cacha bara riktiga bilder – aldrig en HTML-felsida som råkar ge 200.
  if (res.ok && type.startsWith('image/')) {
    cache.put(key, res.clone()).then(() => trim(MEDIA_CACHE, MAX_MEDIA_ENTRIES))
  }
  return res
}

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Bilder från appen eller från backendens /media – cache först.
  if (isMediaImage(url)) {
    e.respondWith(mediaImage(request, url).catch(() => fetch(request)))
    return
  }

  // Övrigt från andra adresser (Mapbox, API, ljud/video) – rör inte.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/') || url.pathname.startsWith('/uploads/')) return

  // Sidnavigering / index.html – alltid färsk, cachat skal som reserv offline.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(request).catch(async () => (await caches.match('/')) || Response.error()))
    return
  }

  // App-skalet (JS, CSS, ikoner) – nätverket först, cache som reserv.
  e.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(request, copy)).then(() => trim(CACHE, MAX_SHELL_ENTRIES))
        }
        return res
      })
      .catch(async () => (await caches.match(request)) || Response.error())
  )
})
