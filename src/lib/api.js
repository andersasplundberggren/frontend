import { enqueue } from './network.js'

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export async function apiFetch(path, opts = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    // Network failure (offline)
    if (opts.method && opts.method !== 'GET') {
      enqueue(path, opts.method, opts.body)
    }
    const err = new Error('Ingen internetanslutning')
    err.offline = true
    throw err
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return data
}
