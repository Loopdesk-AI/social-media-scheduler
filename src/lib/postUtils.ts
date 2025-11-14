export type LimitState = "ok" | "warning" | "error";

export function getLength(content: string) {
  // Use Intl.Segmenter when available to count user-perceived grapheme clusters
  // Use Array.from to count code points (better than .length for emojis)
  return Array.from(content).length;
}

export function evaluateLimit(content: string, limit: number | undefined) {
  const length = getLength(content);
  if (!limit || limit <= 0)
    return { length, percent: 0, state: "ok" as LimitState };
  const percent = Math.min(100, Math.round((length / limit) * 100));
  if (length > limit) return { length, percent, state: "error" as LimitState };
  if (percent >= 90) return { length, percent, state: "warning" as LimitState };
  return { length, percent, state: "ok" as LimitState };
}

export function formatCountText(length: number, limit?: number) {
  if (!limit || limit <= 0) return `${length}`;
  return `${length} / ${limit}`;
}

export function splitGraphemes(content: string) {
  // Fallback implementation using Array.from
  return Array.from(content);
}

export function sliceByGraphemes(content: string, limit: number) {
  const arr = splitGraphemes(content);
  if (arr.length <= limit) return content;
  return arr.slice(0, limit).join("");
}
