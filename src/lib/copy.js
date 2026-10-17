// Texter för detektivlägena. 'mystery' = mordgåta (vuxen), 'kids_mystery' =
// barndeckare. Båda fungerar likadant (Fallbok, misstänkta, gissning) – bara
// språket skiljer.

export function isMysteryType(type) {
  return type === 'mystery' || type === 'kids_mystery'
}

const MYSTERY = {
  emoji: '🔍',
  book: 'Fallboken',
  solveButton: '🔍 Vem är skyldig? →',
  showSolution: '🔍 Visa lösningen',
  guessTitle: 'Vem är skyldig?',
  guessIntro: 'Du har besökt alla platser. Välj den person du tror är mördaren och bekräfta.',
  allVisitedTitle: 'Alla platser besökta!',
  allVisitedText: 'Du har samlat in alla ledtrådar. Nu är det dags att peka ut den skyldige. Tänk efter noga innan du bekräftar din gissning.',
  solveCta: 'Lös mordgåtan →',
  quitTitle: 'Lös mordgåtan?',
  quitText: 'Du har inte pekat ut den skyldige än. Vill du lösa mordgåtan innan du avslutar?',
  quitCta: '🔍 Lös mordgåtan',
  doneLabel: 'Mordgåtan avklarad',
  donePartial: 'Mordgåtan avslutad',
  unsolvedTitle: 'Mordgåtan är olöst',
  unsolvedText: n => `Du måste besöka alla ${n} platser för att avslöja vem som är skyldig.`,
  rightTitle: 'Rätt gissning!',
  rightText: name => `Du hade rätt! ${name} är skyldig.`,
  wrongEmoji: '❌',
  wrongTitle: 'Fel gissning',
  wrongText: name => `Det var ${name} som var skyldig.`,
  doneRight: '✓ Du gissade rätt!',
  doneWrong: name => `✗ Du gissade ${name} — det var fel.`,
  wrongIsError: true,
}

const KIDS = {
  emoji: '🕵️',
  book: 'Detektivboken',
  solveButton: '🕵️ Vem gjorde det? →',
  showSolution: '🕵️ Visa lösningen',
  guessTitle: 'Vem gjorde det?',
  guessIntro: 'Du har varit på alla platser! Titta i Detektivboken – vem tror du gjorde det?',
  allVisitedTitle: 'Du har hittat alla spår!',
  allVisitedText: 'Bra jobbat, detektiv! Nu är det dags att lösa fallet. Titta i Detektivboken och tänk efter – vem gjorde det?',
  solveCta: 'Lös fallet →',
  quitTitle: 'Lös fallet?',
  quitText: 'Du har inte löst fallet än. Vill du gissa vem som gjorde det innan du slutar?',
  quitCta: '🕵️ Lös fallet',
  doneLabel: 'Fallet är löst',
  donePartial: 'Fallet är avslutat',
  unsolvedTitle: 'Fallet är inte löst än',
  unsolvedText: n => `Besök alla ${n} platser för att få veta vem som gjorde det.`,
  rightTitle: 'Snyggt jobbat, detektiv! 🎉',
  rightText: name => `Du hade rätt – det var ${name}!`,
  wrongEmoji: '🤔',
  wrongTitle: 'Nära!',
  wrongText: name => `Det var faktiskt ${name}. Läs förklaringen här under!`,
  doneRight: '🎉 Du löste fallet!',
  doneWrong: name => `Du gissade på ${name} – nära, men det var någon annan.`,
  wrongIsError: false,
}

export function detectiveCopy(type) {
  return type === 'kids_mystery' ? KIDS : MYSTERY
}
