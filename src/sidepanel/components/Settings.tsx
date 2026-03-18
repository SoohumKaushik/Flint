import React, { useState, useEffect } from "react";
import { useFlintStore } from "../../store";

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-xs text-flint-text-primary">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-colors relative ${
        checked ? "bg-flint-accent" : "bg-flint-border"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  </div>
);

const Settings: React.FC = () => {
  const settings = useFlintStore((s) => s.settings);
  const updateSettings = useFlintStore((s) => s.updateSettings);
  const loadFromStorage = useFlintStore((s) => s.loadFromStorage);
  const [confirmClear, setConfirmClear] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.local.get("analyticsEnabled").then((data) => {
      setAnalyticsEnabled(data.analyticsEnabled !== false);
    });
  }, []);

  const handleClearHistory = async () => {
    await chrome.storage.local.set({ promptHistory: [] });
    await loadFromStorage();
    setConfirmClear(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toggles */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-4">
        <Toggle
          label="Auto-analyze prompts"
          checked={settings.autoAnalyze}
          onChange={(v) => updateSettings({ autoAnalyze: v })}
        />
        <div className="border-t border-flint-border" />
        <Toggle
          label="Show space meter"
          checked={settings.showContextMeter}
          onChange={(v) => updateSettings({ showContextMeter: v })}
        />
        <div className="border-t border-flint-border" />
        <Toggle
          label="Help improve Flint (anonymous stats)"
          checked={analyticsEnabled}
          onChange={async (v) => {
            await chrome.storage.local.set({ analyticsEnabled: v });
            setAnalyticsEnabled(v);
          }}
        />
      </div>
      <p className="text-[10px] text-flint-text-muted mt-2 px-1">No prompt content is ever collected.</p>

      {/* Danger Zone */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-4">
        <span className="text-xs font-semibold text-flint-danger">Danger Zone</span>
        <div className="mt-3">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-flint-danger border border-flint-danger/30 rounded-lg px-3 py-1.5 hover:bg-flint-danger/10 transition-colors"
            >
              Clear prompt history
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-flint-text-muted">Are you sure?</span>
              <button
                onClick={handleClearHistory}
                className="text-xs text-white bg-flint-danger rounded-lg px-3 py-1.5 hover:bg-flint-danger/80 transition-colors"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs text-flint-text-muted hover:text-flint-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tagline */}
      <div className="text-center pt-4">
        <p className="text-xs text-flint-text-muted">
          Your AI guardian. Built for builders.
        </p>
        <p className="text-[10px] text-flint-accent mt-1">Powered by Flint AI</p>
        <p className="text-[10px] text-flint-text-muted mt-1">Flint v2.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
