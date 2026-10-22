import { apiFetch } from './api'

// Gemensam logik för mordgåtor – används av gissningen, slutskärmen och Fallboken
// så att alla räknar likadant.

// Den skyldige avgörs ENBART av kryssrutan "Den skyldige" (is_culprit) i admin.
// Förklaringstexten (culprit_explanation) kan finnas på alla misstänkta och
// säger inget om skuld. Om ingen är markerad och det bara finns en misstänkt
// räknas den som skyldig; annars finns inget facit (null).
export function findCulprit(suspects) {
  return suspects.find(b => !!b.is_culprit)
    ?? (suspects.length === 1 ? suspects[0] : null)
}

// Tillförlitlighet på vittnen – samma värden som admin sparar.
const RELIABILITY = {
  reliable:   { label: 'Pålitlig',    color: '#16a34a', bg: 'rgba(22,163,74,.12)' },
  uncertain:  { label: 'Osäker',      color: '#a78bfa', bg: 'rgba(139,92,246,.15)' },
  suspicious: { label: 'Misstänksam', color: '#ef4444', bg: 'rgba(220,38,38,.15)' },
}

export function reliabilityInfo(value) {
  return RELIABILITY[value] || null
}

// Skickar spelarens gissning (eller null = hoppa över). Servern rättar och
// sparar – facit finns inte i appen. I testläget (ingen session) rättas
// gissningen lokalt eftersom testlänkens data innehåller facit.
export async function submitGuess(sess, suspects, suspectBlockId) {
  if (sess?.preview || !sess?.session_token) {
    const culprit = findCulprit(suspects)
    const chosen = suspects.find(b => b.id === suspectBlockId)
    return {
      suspect_block_id: suspectBlockId ?? null,
      suspect_name: suspectBlockId == null ? culprit?.suspect_name : chosen?.suspect_name,
      is_correct: suspectBlockId == null || !culprit ? null : suspectBlockId === culprit.id,
      culprit_name: culprit?.suspect_name,
      culprit_block_id: culprit?.id,
      explanation: culprit?.culprit_explanation || '',
      culprit_audio_url: culprit?.culprit_audio_url || null,
      skipped: suspectBlockId == null,
    }
  }
  const send = () => apiFetch(`/sessions/${sess.session_token}/guess`, {
    method: 'POST',
    body: { suspect_block_id: suspectBlockId ?? null },
  })
  let res
  try {
    res = await send()
  } catch (e) {
    // 409: servern saknar besök (t.ex. kvar i offlinekön). Skicka dem och
    // försök en gång till. Servern räknar inte dubbla besök.
    const missing = e.status === 409 ? e.data?.missing_place_ids : null
    if (!Array.isArray(missing) || !missing.length) throw e
    for (const placeId of missing) {
      await apiFetch(`/sessions/${sess.session_token}/progress`, {
        method: 'POST',
        body: { place_id: placeId },
      })
    }
    res = await send()
  }
  const d = res.data ?? res
  return {
    suspect_block_id: d.suspect_block_id,
    suspect_name: d.skipped ? d.culprit_name : d.suspect_name,
    is_correct: d.is_correct,
    culprit_name: d.culprit_name,
    culprit_block_id: d.culprit_block_id,
    explanation: d.explanation || '',
    culprit_audio_url: d.culprit_audio_url || null,
    skipped: !!d.skipped,
  }
}

// Frågor som ställs i slutrapporten efter gissningen (i stället för på platsen).
export function finalReportQuestions(places) {
  return places.flatMap(p => (p.content_blocks || [])
    .filter(b => b.type === 'question' && b.in_final_report)
    .map(b => ({ ...b, placeId: p.id })))
}
