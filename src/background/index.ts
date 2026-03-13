const FLINT_API_URL = "https://flint-backend-two.vercel.app/api/analyze";

// Daily reset alarm
chrome.alarms.create("daily-reset", {
  periodInMinutes: 1440,
  when: getNextMidnight(),
});

function getNextMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "daily-reset") {
    await chrome.storage.local.set({
      dailyUsage: { promptCount: 0, totalTokens: 0, date: new Date().toDateString() },
      dailySessions: 0,
    });
  }
});

// Open side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Message handler
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ANALYZE_PROMPT") {
    handleAnalyze(message.payload).then(sendResponse);
    return true; // keep channel open for async
  }

  if (message.type === "IMPROVE_PROMPT") {
    handleAnalyze(message.payload).then(sendResponse);
    return true;
  }

  if (message.type === "TRACK_USAGE") {
    handleTrackUsage(message.payload).then(sendResponse);
    return true;
  }
});

async function handleAnalyze(payload: {
  prompt: string;
  systemPrompt: string;
}): Promise<{ data?: unknown; error?: string }> {
  try {
    const res = await fetch(FLINT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: payload.prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error: (err as { error?: string }).error || `API error (${res.status})`,
      };
    }

    const data = await res.json();

    if (data.error) {
      return { error: data.error };
    }

    // Save to history
    const { promptHistory = [] } = await chrome.storage.local.get("promptHistory");
    const entry = {
      prompt: payload.prompt.slice(0, 500),
      score: data.score,
      tip: data.tip,
      improved: data.improved,
      timestamp: Date.now(),
    };
    promptHistory.unshift(entry);
    if (promptHistory.length > 20) promptHistory.length = 20;
    await chrome.storage.local.set({ promptHistory });

    // Track usage
    await trackPromptCount();

    return { data };
  } catch (e) {
    return { error: `Something went wrong: ${(e as Error).message}` };
  }
}

async function trackPromptCount() {
  const { dailyUsage = { promptCount: 0, totalTokens: 0, date: "" } } =
    await chrome.storage.local.get("dailyUsage");
  const today = new Date().toDateString();

  if (dailyUsage.date !== today) {
    dailyUsage.promptCount = 0;
    dailyUsage.totalTokens = 0;
    dailyUsage.date = today;
  }

  dailyUsage.promptCount += 1;
  await chrome.storage.local.set({ dailyUsage });
}

async function handleTrackUsage(payload: {
  sessionId?: string;
}): Promise<{ success: boolean }> {
  if (payload.sessionId) {
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    const today = new Date().toDateString();
    if (!sessions.includes(`${today}:${payload.sessionId}`)) {
      sessions.push(`${today}:${payload.sessionId}`);
      // Keep only today's sessions
      const filtered = sessions.filter((s: string) => s.startsWith(today));
      await chrome.storage.local.set({
        sessions: filtered,
        dailySessions: filtered.length,
      });
    }
  }
  return { success: true };
}

export {};
