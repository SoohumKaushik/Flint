export interface AnalysisResult {
  score: number;
  tip: string;
  improved: string | null;
}

const SYSTEM_PROMPT = `You are a prompt coach for non-technical people building with AI. Analyze this prompt for clarity, specificity, and effectiveness for coding/building tasks. Rate it 1-10. Give ONE short plain-English tip (max 15 words). If score < 7, suggest an improved version. Return JSON: {"score": number, "tip": string, "improved": string|null}`;

/**
 * Sends a prompt to the background service worker for analysis via OpenAI.
 * Returns the parsed analysis result.
 */
export async function analyzePrompt(prompt: string): Promise<AnalysisResult> {
  const response = await chrome.runtime.sendMessage({
    type: "ANALYZE_PROMPT",
    payload: { prompt, systemPrompt: SYSTEM_PROMPT },
  });

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data as AnalysisResult;
}

/**
 * Requests the background worker to improve a prompt.
 * Reuses the analysis flow — caller should use the `improved` field.
 */
export async function improvePrompt(prompt: string): Promise<string | null> {
  const result = await analyzePrompt(prompt);
  return result.improved;
}
