import React, { useEffect, useState } from "react";
import { useFlintStore } from "../../store";
import Context from "./Context";
import Dashboard from "./Dashboard";
import PromptHistory from "./PromptHistory";
import Settings from "./Settings";

type Tab = "context" | "overview" | "history" | "settings";

const tabs: { key: Tab; label: string }[] = [
  { key: "context", label: "Context" },
  { key: "overview", label: "Overview" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("context");
  const loadFromStorage = useFlintStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();

    // Refresh when storage changes
    const handler = () => loadFromStorage();
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [loadFromStorage]);

  return (
    <div className="min-h-screen bg-flint-bg flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-flint-text-primary tracking-tight">
          Flint
        </h1>
        <p className="text-xs text-flint-text-muted">Your AI guardian</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-flint-border px-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-semibold transition-colors relative ${
              activeTab === tab.key
                ? "text-flint-accent"
                : "text-flint-text-muted hover:text-flint-text-secondary"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-flint-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "context" && <Context />}
        {activeTab === "overview" && <Dashboard />}
        {activeTab === "history" && <PromptHistory />}
        {activeTab === "settings" && <Settings />}
      </div>
    </div>
  );
};

export default App;
