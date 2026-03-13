import { create } from "zustand";

export interface DailyUsage {
  promptCount: number;
  totalTokens: number;
  date: string;
}

export interface PromptEntry {
  prompt: string;
  score: number;
  tip: string;
  improved: string | null;
  timestamp: number;
}

export interface FlintSettings {
  openaiApiKey: string;
  autoAnalyze: boolean;
  showContextMeter: boolean;
}

interface FlintState {
  dailyUsage: DailyUsage;
  dailySessions: number;
  promptHistory: PromptEntry[];
  settings: FlintSettings;

  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<FlintSettings>) => Promise<void>;
}

export const useFlintStore = create<FlintState>((set) => ({
  dailyUsage: { promptCount: 0, totalTokens: 0, date: "" },
  dailySessions: 0,
  promptHistory: [],
  settings: {
    openaiApiKey: "",
    autoAnalyze: true,
    showContextMeter: true,
  },

  loadFromStorage: async () => {
    const data = await chrome.storage.local.get([
      "dailyUsage",
      "dailySessions",
      "promptHistory",
      "openaiApiKey",
      "autoAnalyze",
      "showContextMeter",
    ]);

    set({
      dailyUsage: data.dailyUsage || {
        promptCount: 0,
        totalTokens: 0,
        date: new Date().toDateString(),
      },
      dailySessions: data.dailySessions || 0,
      promptHistory: data.promptHistory || [],
      settings: {
        openaiApiKey: data.openaiApiKey || "",
        autoAnalyze: data.autoAnalyze !== false,
        showContextMeter: data.showContextMeter !== false,
      },
    });
  },

  updateSettings: async (partial) => {
    const storageUpdate: Record<string, unknown> = {};
    if (partial.openaiApiKey !== undefined)
      storageUpdate.openaiApiKey = partial.openaiApiKey;
    if (partial.autoAnalyze !== undefined)
      storageUpdate.autoAnalyze = partial.autoAnalyze;
    if (partial.showContextMeter !== undefined)
      storageUpdate.showContextMeter = partial.showContextMeter;

    await chrome.storage.local.set(storageUpdate);

    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },
}));
