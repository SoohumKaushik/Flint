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

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRACK_USAGE") {
    handleTrackUsage(message.payload).then(sendResponse);
    return true;
  }

  if (message.type === "ADD_SESSION_ENTRY" && message.entry) {
    chrome.storage.local.get("currentSession").then((data) => {
      const session = data.currentSession || { startTime: Date.now(), entries: [] };
      session.entries = session.entries || [];
      session.entries.push({
        prompt: message.entry.prompt,
        score: message.entry.score,
        timestamp: Date.now(),
      });
      return chrome.storage.local.set({ currentSession: session });
    }).catch(console.error);
    return false;
  }

  if (message.type === "ADD_RESPONSE" && message.text) {
    chrome.storage.local.get("currentSession").then((data) => {
      const session = data.currentSession || { startTime: Date.now(), entries: [], responses: [] };
      session.responses = session.responses || [];
      session.responses.push(message.text);
      if (session.responses.length > 20) session.responses = session.responses.slice(-20);
      return chrome.storage.local.set({ currentSession: session });
    }).catch(console.error);
    return false;
  }

  if (message.type === "OPEN_SIDE_PANEL" && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }

  if (message.type === "INJECT_BRIEF" && message.text) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "INJECT_TEXT", text: message.text });
      }
    });
  }
});

async function handleTrackUsage(payload: {
  prompt?: string;
  score?: number;
  tip?: string;
  improved?: string | null;
  sessionId?: string;
}): Promise<{ success: boolean }> {
  // Save to prompt history if analysis data is present
  if (payload.prompt && typeof payload.score === "number") {
    const { promptHistory = [] } = await chrome.storage.local.get("promptHistory");
    const entry = {
      prompt: payload.prompt.slice(0, 500),
      score: payload.score,
      tip: payload.tip,
      improved: payload.improved,
      timestamp: Date.now(),
    };
    promptHistory.unshift(entry);
    if (promptHistory.length > 50) promptHistory.length = 50;
    await chrome.storage.local.set({ promptHistory });

    // Track daily prompt count
    await trackPromptCount(payload.prompt || "");
  }

  // Track sessions
  if (payload.sessionId) {
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    const today = new Date().toDateString();
    if (!sessions.includes(`${today}:${payload.sessionId}`)) {
      sessions.push(`${today}:${payload.sessionId}`);
      const filtered = sessions.filter((s: string) => s.startsWith(today));
      await chrome.storage.local.set({
        sessions: filtered,
        dailySessions: filtered.length,
      });
    }
  }

  return { success: true };
}

async function trackPromptCount(promptText: string) {
  const { dailyUsage = { promptCount: 0, totalTokens: 0, date: "" } } =
    await chrome.storage.local.get("dailyUsage");
  const today = new Date().toDateString();

  if (dailyUsage.date !== today) {
    dailyUsage.promptCount = 0;
    dailyUsage.totalTokens = 0;
    dailyUsage.date = today;
  }

  dailyUsage.promptCount += 1;
  dailyUsage.totalTokens += Math.ceil(promptText.length / 4);
  await chrome.storage.local.set({ dailyUsage });
}

export {};
