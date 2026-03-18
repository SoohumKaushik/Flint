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
  autoAnalyze: boolean;
  showContextMeter: boolean;
}

export interface ProjectContext {
  name: string;
  description: string;
  stack: string;
  targetUsers: string;
  onboardingComplete: boolean;
  enabled: boolean;
}

export interface Reference {
  id: string;
  label: string;
  content: string;
}

interface FlintState {
  dailyUsage: DailyUsage;
  dailySessions: number;
  promptHistory: PromptEntry[];
  settings: FlintSettings;
  projectContext: ProjectContext;
  sessionGoal: string;
  references: Reference[];

  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<FlintSettings>) => Promise<void>;
  updateProjectContext: (partial: Partial<ProjectContext>) => Promise<void>;
  setSessionGoal: (goal: string) => Promise<void>;
  addReference: (ref: Omit<Reference, "id">) => Promise<void>;
  removeReference: (id: string) => Promise<void>;
}

export const useFlintStore = create<FlintState>((set) => ({
  dailyUsage: { promptCount: 0, totalTokens: 0, date: "" },
  dailySessions: 0,
  promptHistory: [],
  settings: {
    autoAnalyze: true,
    showContextMeter: true,
  },
  projectContext: {
    name: "",
    description: "",
    stack: "",
    targetUsers: "",
    onboardingComplete: false,
    enabled: true,
  },
  sessionGoal: "",
  references: [],

  loadFromStorage: async () => {
    const data = await chrome.storage.local.get([
      "dailyUsage",
      "dailySessions",
      "promptHistory",
      "autoAnalyze",
      "showContextMeter",
      "projectContext",
      "sessionGoal",
      "references",
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
        autoAnalyze: data.autoAnalyze !== false,
        showContextMeter: data.showContextMeter !== false,
      },
      projectContext: data.projectContext || {
        name: "",
        description: "",
        stack: "",
        targetUsers: "",
        onboardingComplete: false,
        enabled: true,
      },
      sessionGoal: data.sessionGoal || "",
      references: data.references || [],
    });
  },

  updateSettings: async (partial) => {
    const storageUpdate: Record<string, unknown> = {};
    if (partial.autoAnalyze !== undefined)
      storageUpdate.autoAnalyze = partial.autoAnalyze;
    if (partial.showContextMeter !== undefined)
      storageUpdate.showContextMeter = partial.showContextMeter;

    await chrome.storage.local.set(storageUpdate);

    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  updateProjectContext: async (partial) => {
    const { projectContext: current } = await chrome.storage.local.get("projectContext");
    const updated = { ...(current || {}), ...partial };
    await chrome.storage.local.set({ projectContext: updated });
    set({ projectContext: updated });
  },

  setSessionGoal: async (goal) => {
    await chrome.storage.local.set({ sessionGoal: goal });
    set({ sessionGoal: goal });
  },

  addReference: async (ref) => {
    const newRef: Reference = { ...ref, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    const { references = [] } = await chrome.storage.local.get("references");
    const updated = [...references, newRef];
    await chrome.storage.local.set({ references: updated });
    set({ references: updated });
  },

  removeReference: async (id) => {
    const { references = [] } = await chrome.storage.local.get("references");
    const updated = references.filter((r: Reference) => r.id !== id);
    await chrome.storage.local.set({ references: updated });
    set({ references: updated });
  },
}));
