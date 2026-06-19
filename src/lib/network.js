const QUEUE_KEY = 'pp_offline_q'

export function enqueue(path, method, body) {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    q.push({ path, method, body, ts: Date.now() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
  } catch {}
}

export function dequeue() {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    localStorage.removeItem(QUEUE_KEY)
    return q
  } catch { return [] }
}

export function queueSize() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length } catch { return 0 }
}
