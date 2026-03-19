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

export interface SessionEntry {
  prompt: string;
  score: number;
  timestamp: number;
  response?: string;
}

export interface ResponseEntry {
  text: string;
  relevance: number;
  aligned: boolean;
  suggestion: string;
  timestamp: number;
}

interface FlintState {
  dailyUsage: DailyUsage;
  dailySessions: number;
  promptHistory: PromptEntry[];
  settings: FlintSettings;
  projectContext: ProjectContext;
  sessionGoal: string;
  references: Reference[];
  currentSession: {
    startTime: number;
    entries: SessionEntry[];
    responses: ResponseEntry[];
  };

  loadFromStorage: () => Promise<void>;
  updateSettings: (partial: Partial<FlintSettings>) => Promise<void>;
  updateProjectContext: (partial: Partial<ProjectContext>) => Promise<void>;
  setSessionGoal: (goal: string) => Promise<void>;
  addReference: (ref: Omit<Reference, "id">) => Promise<void>;
  removeReference: (id: string) => Promise<void>;
  startNewSession: () => Promise<void>;
  addSessionEntry: (entry: Omit<SessionEntry, "timestamp">) => Promise<void>;
  addSessionResponse: (entry: ResponseEntry) => Promise<void>;
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
  currentSession: { startTime: Date.now(), entries: [], responses: [] },

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
      "currentSession",
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
      currentSession: data.currentSession || { startTime: Date.now(), entries: [], responses: [] },
    });
  },

  updateSettings: async (partial) => {
    const storageUpdate: Record<string, unknown> = {};
    if (partial.autoAnalyze !== undefined)
      storageUpdate.autoAnalyze = partial.autoAnalyze;
    if (partial.showContextMeter !== undefined)
      storageUpdate.showContextMeter = partial.showContextMeter;

    await chrome.storage.local.set(storageUpdate).catch(console.error);

    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  updateProjectContext: async (partial) => {
    const { projectContext: current } = await chrome.storage.local.get("projectContext");
    const updated = { ...(current || {}), ...partial };
    await chrome.storage.local.set({ projectContext: updated }).catch(console.error);
    set({ projectContext: updated });
  },

  setSessionGoal: async (goal) => {
    await chrome.storage.local.set({ sessionGoal: goal }).catch(console.error);
    set({ sessionGoal: goal });
  },

  addReference: async (ref) => {
    const newRef: Reference = { ...ref, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    const { references = [] } = await chrome.storage.local.get("references");
    const updated = [...references, newRef];
    await chrome.storage.local.set({ references: updated }).catch(console.error);
    set({ references: updated });
  },

  removeReference: async (id) => {
    const { references = [] } = await chrome.storage.local.get("references");
    const updated = references.filter((r: Reference) => r.id !== id);
    await chrome.storage.local.set({ references: updated }).catch(console.error);
    set({ references: updated });
  },

  startNewSession: async () => {
    const session = { startTime: Date.now(), entries: [] as SessionEntry[], responses: [] as ResponseEntry[] };
    await chrome.storage.local.set({ currentSession: session }).catch(console.error);
    set({ currentSession: session });
  },

  addSessionEntry: async (entry) => {
    const { currentSession } = await chrome.storage.local.get("currentSession");
    const session = currentSession || { startTime: Date.now(), entries: [], responses: [] };
    session.entries.push({ ...entry, timestamp: Date.now() });
    await chrome.storage.local.set({ currentSession: session }).catch(console.error);
    set({ currentSession: session });
  },

  addSessionResponse: async (entry: ResponseEntry) => {
    const { currentSession } = await chrome.storage.local.get("currentSession");
    const session = currentSession || { startTime: Date.now(), entries: [], responses: [] };
    session.responses = session.responses || [];
    session.responses.push(entry);
    if (session.responses.length > 20) session.responses = session.responses.slice(-20);
    await chrome.storage.local.set({ currentSession: session }).catch(console.error);
    set({ currentSession: session });
  },
}));
