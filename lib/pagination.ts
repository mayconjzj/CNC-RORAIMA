/** Parse a bounded integer query parameter without accepting partial strings. */
export function parseBoundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const safeFallback = Number.isSafeInteger(fallback)
    ? Math.min(maximum, Math.max(minimum, fallback))
    : minimum;

  if (value === null || !/^-?\d+$/.test(value.trim())) return safeFallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return safeFallback;

  return Math.min(maximum, Math.max(minimum, parsed));
}
