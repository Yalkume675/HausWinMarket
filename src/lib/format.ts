
 // Small display helpers. Demo API prices are shown as Kina (K).
export function formatPrice(value: number | undefined | null) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `K ${n.toFixed(2)}`;
}

export function pluralise(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
