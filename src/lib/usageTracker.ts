export interface DailyUsage {
  promptCount: number;
  totalTokens: number;
  date: string;
}

/** Get today's usage data from chrome.storage.local */
export async function getDailyUsage(): Promise<DailyUsage> {
  const { dailyUsage } = await chrome.storage.local.get("dailyUsage");
  const today = new Date().toDateString();

  if (!dailyUsage || dailyUsage.date !== today) {
    const fresh: DailyUsage = { promptCount: 0, totalTokens: 0, date: today };
    await chrome.storage.local.set({ dailyUsage: fresh });
    return fresh;
  }

  return dailyUsage;
}

/** Increment prompt count and add tokens */
export async function trackPromptUsage(tokens: number): Promise<DailyUsage> {
  const usage = await getDailyUsage();
  usage.promptCount += 1;
  usage.totalTokens += tokens;
  await chrome.storage.local.set({ dailyUsage: usage });
  return usage;
}

/** Get the number of sessions today */
export async function getSessionCount(): Promise<number> {
  const { dailySessions = 0 } = await chrome.storage.local.get("dailySessions");
  return dailySessions;
}

/** Track a new session */
export async function trackSession(sessionId: string): Promise<void> {
  await chrome.runtime.sendMessage({
    type: "TRACK_USAGE",
    payload: { sessionId },
  });
}
