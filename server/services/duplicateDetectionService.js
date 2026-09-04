const STOP_WORDS = new Set(["the", "and", "for", "with", "this", "that", "there", "near", "from"]);

const tokenize = (value = "") => new Set(
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
);

const jaccardSimilarity = (left, right) => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
};

const calculateDuplicateSimilarity = (candidate = {}, existing = {}) => {
  const categoryScore = candidate.category && existing.category && candidate.category.toLowerCase() === existing.category.toLowerCase() ? 1 : 0;
  const locationScore = jaccardSimilarity(candidate.location, existing.location);
  const titleScore = jaccardSimilarity(candidate.title, existing.title);
  const descriptionScore = jaccardSimilarity(candidate.description, existing.description);
  const score = categoryScore * 0.25 + locationScore * 0.25 + titleScore * 0.25 + descriptionScore * 0.25;

  return Math.round(score * 100);
};

const findSimilarComplaints = (candidate, complaints = [], threshold = 60) => complaints
  .map((complaint) => ({
    complaint,
    similarity: calculateDuplicateSimilarity(candidate, complaint),
  }))
  .filter((match) => match.similarity >= threshold)
  .sort((a, b) => b.similarity - a.similarity);

module.exports = { tokenize, jaccardSimilarity, calculateDuplicateSimilarity, findSimilarComplaints };
