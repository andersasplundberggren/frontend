let timer = null

export function showToast(msg, type = 'info', duration = 2500) {
  document.querySelectorAll('.toast').forEach(e => e.remove())
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.textContent = msg
  document.body.appendChild(el)
  clearTimeout(timer)
  timer = setTimeout(() => el.remove(), duration)
}
