import { useEffect, useMemo, useRef, useState } from 'react'
import { buildInteractiveDoc } from '../lib/interactive'

const MIN_HEIGHT = 120
const MAX_HEIGHT = 3000

export default function InteractiveBlock({ b }) {
  const frameRef = useRef(null)
  const [height, setHeight] = useState(240)
  const srcDoc = useMemo(() => buildInteractiveDoc(b.body), [b.body])

  useEffect(() => {
    function onMessage(e) {
      // Lyssna bara på den egna iframen – andra block/fönster ignoreras.
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return
      const h = Number(e.data && e.data.paplatsHeight)
      if (Number.isFinite(h)) setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h)))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!b.body) return null

  return (
    <div className="block">
      {b.title && <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{b.title}</h3>}
      <iframe
        ref={frameRef}
        title={b.title || 'Interaktivt innehåll'}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ width: '100%', height, border: 0, display: 'block', borderRadius: 8, background: '#fff' }}
      />
    </div>
  )
}
