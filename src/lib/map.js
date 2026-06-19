export const LIGHT = 'mapbox://styles/mapbox/streets-v12'
export const DARK  = 'mapbox://styles/mapbox/dark-v11'
export const MEDIA_BASE = '/uploads'

export function getMap() {
  return window.MAP
}

export function resetMap() {
  const map = window.MAP
  if (!map) return
  // Rensa markörer
  Object.values(window.MAP_MARKERS).forEach(m => m.remove())
  window.MAP_MARKERS = {}
  if (window.USER_MARKER) { window.USER_MARKER.remove(); window.USER_MARKER = null }
  map.flyTo({ center: [14.52, 59.33], zoom: 13, duration: 0 })
}

export function mediaUrl(id) {
  return id ? `${MEDIA_BASE}/${id}` : null
}
