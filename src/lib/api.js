import { enqueue } from './network.js'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
const TIMEOUT_MS = 15000

// Anrop till backend.
//   opts.queue = true  → skrivningen sparas och skickas senare om nätet saknas
//                        (bara för sådant som tål det: besök, svar, anteckningar).
//   opts.timeoutMs     → avbryt efter så här lång tid (standard 15 s), så att
//                        appen inte hänger på svag mobiltäckning.
// Fel har err.offline = true (ingen kontakt/timeout) eller err.status (HTTP-fel).
export async function apiFetch(path, opts = {}) {
  const { queue = false, timeoutMs = TIMEOUT_MS, body, headers, ...rest } = opts
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'omit', // API:t använder session_token, inte cookies
      ...rest,
      headers: {
        'Accept': 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
  } catch {
    // Ingen kontakt eller timeout
    if (queue && rest.method && rest.method !== 'GET') enqueue(path, rest.method, body)
    const err = new Error(ctrl.signal.aborted ? 'Servern svarar inte – kontrollera täckningen' : 'Ingen internetanslutning')
    err.offline = true
    err.queued = !!(queue && rest.method && rest.method !== 'GET')
    throw err
  } finally {
    clearTimeout(timer)
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  if (data === null) {
    // T.ex. en HTML-sida från webbhotellet i stället för API-svar.
    const err = new Error('Oväntat svar från servern')
    err.status = res.status
    throw err
  }
  return data
}
