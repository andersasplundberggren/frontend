// Kö för skrivningar som inte kunde skickas (ingen täckning). Skickas av
// flushQueue() vid appstart, när nätet kommer tillbaka och regelbundet.

const QUEUE_KEY = 'pp_offline_q'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function read() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}
function write(q) {
  try {
    if (q.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
    else localStorage.removeItem(QUEUE_KEY)
  } catch {}
}
const sameItem = (a, b) => a.path === b.path && a.method === b.method &&
  (a.method === 'PUT' || JSON.stringify(a.body) === JSON.stringify(b.body))

export function enqueue(path, method, body) {
  const item = { path, method, body, ts: Date.now() }
  // Inga dubbletter. PUT (t.ex. anteckningar) ersätts av senaste versionen.
  const q = read().filter(x => !sameItem(x, item))
  q.push(item)
  write(q)
}

export function queueSize() { return read().length }

let flushing = null

// Skickar kön. apiFetchFn injiceras för att undvika cirkulär import.
// onSent(item, data) anropas för varje lyckad skrivning.
// HTTP 4xx (t.ex. 409 "redan besvarad") tas bort – servern har svarat och ett
// nytt försök ger samma resultat. Nätfel och 5xx ligger kvar till nästa gång.
export function flushQueue(apiFetchFn, onSent) {
  if (flushing) return flushing
  flushing = (async () => {
    let sent = 0
    const now = Date.now()
    for (const item of read()) {
      if (now - item.ts > MAX_AGE_MS) { remove(item); continue }
      try {
        const data = await apiFetchFn(item.path, { method: item.method, body: item.body })
        remove(item); sent++
        try { onSent?.(item, data) } catch {}
      } catch (e) {
        if (e.status >= 400 && e.status < 500) { remove(item); continue }
        break // ingen kontakt – försök igen senare, behåll ordningen
      }
    }
    return sent
  })().finally(() => { flushing = null })
  return flushing
}

function remove(item) {
  write(read().filter(x => !(sameItem(x, item) && x.ts === item.ts)))
}
