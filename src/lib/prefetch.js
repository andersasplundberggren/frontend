// Förladdar ett uppdrags bilder så att de finns i service workerns cache
// och fungerar även där täckningen försvinner. Bilderna är komprimerade
// (oftast 0,3–2 MB per uppdrag). Ljud och video förladdas inte.
const done = new Set()

export function prefetchAssignmentImages(asgn) {
  if (!asgn || done.has(asgn.id) || !navigator.onLine) return
  done.add(asgn.id)
  const urls = [...new Set((asgn.places || []).flatMap(p => (p.content_blocks || []).flatMap(b => [
    (b.type === 'image' || b.type === 'ar_overlay') ? b.media_url : null,
    b.type === 'evidence' && b.media_type === 'image' ? b.media_url : null,
    b.witness_image_url, b.suspect_image_url, b.evidence_image_url,
  ])).filter(Boolean))]

  // Några åt gången så att spelets egna anrop inte trängs undan.
  let i = 0
  const next = () => {
    if (i >= urls.length) return
    const url = urls[i++]
    fetch(url, { mode: 'cors', credentials: 'omit' }).catch(() => {}).finally(next)
  }
  for (let n = 0; n < 3; n++) next()
}
