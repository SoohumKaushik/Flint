import React from "react";
import { createRoot } from "react-dom/client";
import ContextMeter from "./components/ContextMeter";
import PromptAnalyzer from "./components/PromptAnalyzer";
import { mountContextMeter, mountPromptAnalyzer } from "./injector";

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
  const sessionId = window.location.pathname.split("/").pop() || "default";
  chrome.runtime.sendMessage({
    type: "TRACK_USAGE",
    payload: { sessionId },
  });
}

// Wait for page to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
