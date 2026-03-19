import React, { useEffect, useState, useRef } from "react";
import { useFlintStore } from "../../store";
import Context from "./Context";
import Dashboard from "./Dashboard";
import PromptHistory from "./PromptHistory";
import Settings from "./Settings";
import Actions from "./Actions";

type Tab = "context" | "actions" | "overview" | "history" | "settings";

const tabs: { key: Tab; label: string }[] = [
  { key: "context", label: "Context" },
  { key: "actions", label: "Actions" },
  { key: "overview", label: "Overview" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("context");
  const loadFromStorage = useFlintStore((s) => s.loadFromStorage);

  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    loadFromStorage();

    // Refresh when storage changes
    const handler = () => loadFromStorage();
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, [loadFromStorage]);

  useEffect(() => {
    updateScrollState();
    const el = tabScrollRef.current;
    if (el) el.addEventListener("scroll", updateScrollState);
    return () => { if (el) el.removeEventListener("scroll", updateScrollState); };
  }, []);

  const scrollTabs = (dir: "left" | "right") => {
    const el = tabScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

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
      <div className="flex items-center border-b border-flint-border">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs("left")}
            className="flex items-center justify-center w-6 h-6 shrink-0 rounded-md bg-flint-surface border border-flint-border text-flint-text-secondary hover:text-flint-accent hover:border-flint-accent transition-colors text-sm font-bold ml-1"
          >
            ‹
          </button>
        )}

        {/* Scrollable tab strip */}
        <div
          ref={tabScrollRef}
          className="flex overflow-x-auto scrollbar-hide flex-1 px-2 gap-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-[11px] font-semibold transition-colors relative whitespace-nowrap shrink-0 ${
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

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollTabs("right")}
            className="flex items-center justify-center w-6 h-6 shrink-0 rounded-md bg-flint-surface border border-flint-border text-flint-text-secondary hover:text-flint-accent hover:border-flint-accent transition-colors text-sm font-bold mr-1"
          >
            ›
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "context" && <Context />}
        {activeTab === "actions" && <Actions />}
        {activeTab === "overview" && <Dashboard />}
        {activeTab === "history" && <PromptHistory />}
        {activeTab === "settings" && <Settings />}
      </div>
    </div>
  );
};

export default App;
