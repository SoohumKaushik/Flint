import React, { useState } from "react";
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
  const [keyInput, setKeyInput] = useState(settings.openaiApiKey);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = async () => {
    await updateSettings({ openaiApiKey: keyInput });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* API Key */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-4">
        <label className="text-xs font-semibold text-flint-text-secondary block mb-2">
          OpenAI API Key
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            className="flex-1 bg-flint-surface border border-flint-border rounded-lg px-3 py-2 text-xs text-flint-text-primary placeholder-flint-text-muted outline-none focus:border-flint-accent transition-colors"
          />
          <button
            onClick={handleSaveKey}
            className="bg-flint-accent hover:bg-flint-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
        <p className="text-[10px] text-flint-text-muted mt-2">
          Used for prompt analysis. Your key stays on your device.
        </p>
      </div>

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
      </div>

      {/* Tagline */}
      <div className="text-center pt-4">
        <p className="text-xs text-flint-text-muted">
          Your AI guardian. Built for builders.
        </p>
        <p className="text-[10px] text-flint-text-muted mt-1">Flint v1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
