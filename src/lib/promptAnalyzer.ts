import type { ProjectContext, Reference } from "../store";

export interface AnalysisResult {
  score: number;
  tip: string;
  improved: string | null;
}

const FLINT_API_URL = "https://flint-backend-two.vercel.app/api/analyze";

/**
 * Calls the Flint backend API directly to analyze a prompt.
 * Returns the parsed analysis result.
 */
export async function analyzePrompt(prompt: string): Promise<AnalysisResult> {
  // Read context from storage
  const stored = await chrome.storage.local.get(["projectContext", "sessionGoal", "references"]);
  const projectContext = stored.projectContext as ProjectContext | undefined;
  const sessionGoal = stored.sessionGoal as string | undefined;
  const references = stored.references as Reference[] | undefined;

  let context: Record<string, unknown> | undefined;
  if (projectContext?.onboardingComplete && projectContext?.enabled) {
    context = {
      projectName: projectContext.name || undefined,
      projectDescription: projectContext.description || undefined,
      stack: projectContext.stack || undefined,
      targetUsers: projectContext.targetUsers || undefined,
      sessionGoal: sessionGoal || undefined,
      references: references?.length
        ? references.map((r) => ({ label: r.label, content: r.content }))
        : undefined,
    };
  }

  const response = await fetch(FLINT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed — please try again");
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  if (typeof data.score !== "number") throw new Error("Invalid response");

  // Save to history via background (fire and forget)
  chrome.runtime.sendMessage({ type: "TRACK_USAGE", payload: { prompt, ...data } }).catch(() => {});

  return data as AnalysisResult;
}

/**
 * Requests an improved version of a prompt.
 * Reuses the analysis flow — caller should use the `improved` field.
 */
export async function improvePrompt(prompt: string): Promise<string | null> {
  const result = await analyzePrompt(prompt);
  return result.improved;
}
