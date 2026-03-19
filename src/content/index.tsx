import React from "react";
import { createRoot } from "react-dom/client";
import ContextMeter from "./components/ContextMeter";
import PromptAnalyzer from "./components/PromptAnalyzer";
import { mountContextMeter, mountPromptAnalyzer, setInputText } from "./injector";
import { startResponseObserver } from "./responseObserver";

function init() {
  // Mount context meter
  const meterContainer = mountContextMeter();
  createRoot(meterContainer).render(
    <React.StrictMode>
      <ContextMeter />
    </React.StrictMode>
  );

  // Mount prompt analyzer
  const analyzerContainer = mountPromptAnalyzer();
  createRoot(analyzerContainer).render(
    <React.StrictMode>
      <PromptAnalyzer />
    </React.StrictMode>
  );

  // Track session
  const CLAUDE_NEW_PATTERNS = ["/new", "/chat/new"];
  const isNewConversation = CLAUDE_NEW_PATTERNS.some(p => window.location.pathname.includes(p));

  async function getOrCreateSessionId(): Promise<string> {
    try {
      const storage = (chrome.storage as any).session ?? chrome.storage.local;
      const data = await storage.get("flintSessionId");
      if (isNewConversation || !data.flintSessionId) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await storage.set({ flintSessionId: id });
        return id;
      }
      return data.flintSessionId;
    } catch {
      return `${Date.now()}-fallback`;
    }
  }

  getOrCreateSessionId().then((sessionId) => {
    chrome.runtime.sendMessage({
      type: "TRACK_USAGE",
      payload: { sessionId },
    }).catch(() => {});
  });

  // Start response observer
  startResponseObserver();

  // Listen for text injection from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "INJECT_TEXT" && msg.text) {
      setInputText(msg.text);
    }
  });
}

// Wait for page to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
