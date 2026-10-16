// Testläge (öppnas från admin via "🧪 Testa"). Ingen spelsession finns,
// så svar rättas här i appen i stället för på servern och inget sparas.
// Rättningen följer servern (routes/api/v1/sessions.js) så att testet visar
// samma resultat som en riktig spelare får.

export function gradeLocally(block, { chosen_option, solution_text }) {
  if (chosen_option) {
    const ok = !!block.correct_option && chosen_option.toLowerCase() === block.correct_option.toLowerCase()
    return { is_correct: block.correct_option ? ok : null, points_earned: ok ? (block.points || 0) : 0 }
  }
  if (solution_text) {
    const ok = !!block.solution_answer &&
      solution_text.trim().toLowerCase() === block.solution_answer.trim().toLowerCase()
    return { is_correct: block.solution_answer ? ok : null, points_earned: ok ? (block.solution_points || 0) : 0 }
  }
  return { is_correct: null, points_earned: 0 }
}
