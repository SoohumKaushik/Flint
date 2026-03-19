import type { ProjectContext, Reference } from "../store";

export interface AnalysisResult {
  score: number;
  tip: string;
  improved: string | null;
}

const FLINT_API_URL = "https://flint-backend-two.vercel.app/api/analyze";
const FLINT_EVENT_URL = "https://flint-backend-two.vercel.app/api/event";
export const FLINT_BRIEF_URL = "https://flint-backend-two.vercel.app/api/brief";
const FLINT_API_KEY = "flint-ext-v2-2026";

export async function trackEvent(event: string, value?: number): Promise<void> {
  const { analyticsEnabled } = await chrome.storage.local.get("analyticsEnabled").catch(() => ({ analyticsEnabled: true }));
  if (analyticsEnabled === false) return;
  fetch(FLINT_EVENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-flint-key": FLINT_API_KEY },
    body: JSON.stringify({ event, value }),
  }).catch(() => {});
}

/**
 * Calls the Flint backend API directly to analyze a prompt.
 * Returns the parsed analysis result.
 */
export async function analyzePrompt(prompt: string): Promise<AnalysisResult> {
  if (!navigator.onLine) {
    throw new Error("You are offline — check your connection");
  }

  const stored = await chrome.storage.local.get(["projectContext", "sessionGoal", "references"]).catch(() => ({}));
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(FLINT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-flint-key": FLINT_API_KEY,
      },
      body: JSON.stringify({ prompt, context }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      const data = await response.json().catch(() => ({})) as any;
      const retry = data.retryAfter ? ` Try again in ${data.retryAfter}s.` : "";
      throw new Error(`Too many requests — slow down a bit.${retry}`);
    }
    if (response.status === 401) {
      throw new Error("Extension needs updating — please reload");
    }
    if (!response.ok) {
      throw new Error("Something went wrong — try again");
    }

    const data = await response.json() as any;
    if (data.error) throw new Error(data.error);
    if (typeof data.score !== "number") throw new Error("Invalid response");

    chrome.runtime.sendMessage({ type: "TRACK_USAGE", payload: { prompt, ...data } }).catch(() => {});
    trackEvent("prompt_scored", data.score);

    return data as AnalysisResult;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("Request timed out — try again");
    if (err.message?.toLowerCase().includes("fetch") || err.message?.toLowerCase().includes("network")) {
      throw new Error("Cannot reach Flint servers — check your connection");
    }
    throw err;
  }
}

/**
 * Requests an improved version of a prompt.
 * Reuses the analysis flow — caller should use the `improved` field.
 */
export async function improvePrompt(prompt: string): Promise<string | null> {
  const result = await analyzePrompt(prompt);
  return result.improved;
}

export async function generateBrief(context: {
  projectName?: string;
  projectDescription?: string;
  stack?: string;
  targetUsers?: string;
  sessionGoal?: string;
  references?: Array<{ label: string; content: string }>;
}): Promise<string> {
  const response = await fetch(FLINT_BRIEF_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-flint-key": FLINT_API_KEY,
    },
    body: JSON.stringify({ context }),
  });
  if (!response.ok) throw new Error("Failed to generate brief");
  const data = await response.json() as any;
  if (!data.brief) throw new Error("Empty brief");
  return data.brief as string;
}
