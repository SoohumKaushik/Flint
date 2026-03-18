/**
 * Rough token estimation: ~4 characters per token.
 * Good enough for a usage gauge in v1.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Claude 3.5 Sonnet context window */
export const MAX_CONTEXT_TOKENS = 200_000;
export const MAX_CONTEXT_CHARS = 800_000;

export function contextPercentage(charCount: number): number {
  const tokenEstimate = Math.ceil(charCount / 4);
  return Math.min(100, (tokenEstimate / 200000) * 100);
}

export function contextLabel(pct: number): string {
  if (pct < 40) return "You have plenty of space";
  if (pct < 70) return "Getting full";
  return "Almost out of space — start a new chat soon";
}

export function contextColor(pct: number): string {
  if (pct < 40) return "#10B981";
  if (pct < 70) return "#F59E0B";
  return "#EF4444";
}
