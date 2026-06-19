import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'

// Initiera Mapbox direkt — innan React mountar
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

window.MAP = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [14.52, 59.33],
  zoom: 13,
  attributionControl: false,
})

window.MAP_MARKERS = {}
window.USER_MARKER = null

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  let swRefreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!swRefreshing) { swRefreshing = true; window.location.reload() }
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(reg => reg.update())
      .catch(() => {})
  })
}
