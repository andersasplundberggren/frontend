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
