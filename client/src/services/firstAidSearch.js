const normalize = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const compact = value => normalize(value).replace(/\s/g, "");

function editDistance(left, right) {
  const a = normalize(left), b = normalize(right), rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= b.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) for (let column = 1; column <= b.length; column += 1) {
    const cost = a[row - 1] === b[column - 1] ? 0 : 1;
    rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + cost);
    if (row > 1 && column > 1 && a[row - 1] === b[column - 2] && a[row - 2] === b[column - 1]) rows[row][column] = Math.min(rows[row][column], rows[row - 2][column - 2] + 1);
  }
  return rows[a.length][b.length];
}

function fuzzyScore(term, candidate, weight) {
  if (term.length < 4) return 0;
  const difference = Math.abs(term.length - candidate.length), tolerance = Math.min(4, Math.max(1, Math.ceil(term.length * .3)));
  if (difference > tolerance) return 0;
  const distance = editDistance(term, candidate);
  return distance <= tolerance ? Math.round(weight * (1 - distance / Math.max(term.length, candidate.length))) : 0;
}

function tokenScore(term, words, weights) {
  let best = 0;
  for (const word of words) {
    if (word === term) best = Math.max(best, weights.exact);
    else if (word.startsWith(term)) best = Math.max(best, weights.prefix);
    else best = Math.max(best, fuzzyScore(term, word, weights.fuzzy));
  }
  return best;
}

export function scoreFirstAidGuide(guide, query, aliases = []) {
  const q = normalize(query); if (!q) return 1;
  const title = normalize(guide.title), titleWords = title.split(" "), aliasText = normalize(aliases.join(" ")), aliasWords = aliasText.split(" ").filter(Boolean);
  const description = normalize([guide.category, guide.warning, ...(guide.steps || [])].join(" ")), descriptionWords = description.split(" ").filter(Boolean);
  if (title === q || compact(title) === compact(q)) return 1000;
  let score = 0;
  if (title.startsWith(q) || compact(title).startsWith(compact(q))) score += 850;
  if (aliasText.split(" ").includes(q) || aliases.some(alias => normalize(alias) === q)) score += 650;
  if (aliases.some(alias => normalize(alias).includes(q))) score += 180;
  const terms = q.split(" "), matched = terms.map(term => {
    const titleScore = tokenScore(term, titleWords, { exact: 150, prefix: 125, fuzzy: 115 });
    const aliasScore = tokenScore(term, aliasWords, { exact: 105, prefix: 85, fuzzy: 80 });
    const descriptionScore = tokenScore(term, descriptionWords, { exact: 50, prefix: 35, fuzzy: 28 });
    const best = Math.max(titleScore, aliasScore, descriptionScore); score += best; return best > 0;
  });
  if (terms.length > 1) score += matched.filter(Boolean).length * 35;
  return matched.every(Boolean) ? score : matched.some(Boolean) && terms.length === 1 ? score : 0;
}

export function searchFirstAid(guides, query, aliasesByTitle = {}) {
  if (!normalize(query)) return guides;
  return guides.map((guide, index) => ({ guide, index, score: scoreFirstAidGuide(guide, query, aliasesByTitle[guide.title] || []) })).filter(result => result.score >= 28).sort((left, right) => right.score - left.score || left.index - right.index).map(result => result.guide);
}
