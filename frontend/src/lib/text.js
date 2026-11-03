export function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function formatPercent(probability) {
  return `${(probability * 100).toFixed(1)}%`;
}
