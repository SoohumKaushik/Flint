import React, { useState } from "react";
import { useFlintStore } from "../../store";
import { trackEvent } from "../../lib/promptAnalyzer";

interface Action {
  id: string;
  emoji: string;
  label: string;
  description: string;
  buildPrompt: (ctx: {
    projectName: string;
    projectDescription: string;
    stack: string;
    sessionGoal: string;
    recentPrompts: string[];
  }) => string;
}

const actions: Action[] = [
  {
    id: "progress",
    emoji: "\u{1F4CA}",
    label: "Progress",
    description: "Where are we vs. today\u2019s goal?",
    buildPrompt: ({ projectName, projectDescription, stack, sessionGoal }) =>
      `<context>\nProject: ${projectName} \u2014 ${projectDescription}\nStack: ${stack}\nToday's goal: ${sessionGoal}\n</context>\n\n<mission>\nReview our session progress honestly. Tell me:\n1. What have we accomplished toward the goal so far?\n2. What's still pending?\n3. What is the single most important next step right now?\n\nBe specific. No filler.\n</mission>`,
  },
  {
    id: "explain",
    emoji: "\u{1F50D}",
    label: "Explain",
    description: "Break down what you just did",
    buildPrompt: () =>
      `<mission>\nIn plain English, explain what you just built or wrote. Cover:\n- The key decisions you made and why\n- What approach you chose and what you ruled out\n- Anything I should know before we continue\n\nKeep it under 150 words. Be direct.\n</mission>`,
  },
  {
    id: "review",
    emoji: "\u2705",
    label: "Review",
    description: "Check last output for correctness",
    buildPrompt: ({ projectName, projectDescription, stack }) =>
      `<context>\nProject: ${projectName} \u2014 ${projectDescription}\nStack: ${stack}\n</context>\n\n<mission>\nReview the last thing you built or wrote. Check for:\n- Logic errors or incorrect assumptions\n- Edge cases that could break in production\n- Performance or security concerns\n- Anything that doesn't follow ${stack} conventions\n\nVerdict: ship-ready / needs fixes (list them) / needs rethink. Be blunt.\n</mission>`,
  },
  {
    id: "on_track",
    emoji: "\u{1F3AF}",
    label: "On Track?",
    description: "Are we heading the right direction?",
    buildPrompt: ({ projectName, sessionGoal, recentPrompts }) => {
      const recentList =
        recentPrompts.length > 0
          ? recentPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")
          : "(none yet)";
      return `<context>\nProject: ${projectName}\nToday's goal: ${sessionGoal}\nRecent prompts:\n${recentList}\n</context>\n\n<mission>\nBe brutally honest: are we on track toward the goal \u2014 "${sessionGoal}"?\n\nAnswer:\n1. On track / drifting / off course \u2014 and why in one sentence\n2. The biggest risk or distraction in this session\n3. One concrete thing to do right now to stay on the fastest path\n\nNo sugarcoating.\n</mission>`;
    },
  },
  {
    id: "next_step",
    emoji: "\u26A1",
    label: "Next Step",
    description: "What should we do right now?",
    buildPrompt: ({ projectName, projectDescription, sessionGoal }) =>
      `<context>\nProject: ${projectName} \u2014 ${projectDescription}\nToday's goal: ${sessionGoal}\n</context>\n\n<mission>\nWhat is the single most important next action to move toward the goal \u2014 "${sessionGoal}"?\n\nGive me one specific, concrete task. Not a list \u2014 just the one thing. Tell me what it is and why it's the priority right now.\n</mission>`,
  },
  {
    id: "summarize",
    emoji: "\u{1F504}",
    label: "Summarize",
    description: "Bullet-point recap of this session",
    buildPrompt: () =>
      `<mission>\nSummarize our entire conversation so far as a tight bullet list. Group by topic. Include:\n- What was built or changed\n- Key decisions made\n- Current state of the work\n\nMax 10 bullets. Skip pleasantries and meta-commentary. Just the facts.\n</mission>`,
  },
];

type ButtonState = "idle" | "injecting" | "done";

const Actions: React.FC = () => {
  const projectContext = useFlintStore((s) => s.projectContext);
  const sessionGoal = useFlintStore((s) => s.sessionGoal);
  const currentSession = useFlintStore((s) => s.currentSession);
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonState>>({});

  const handleAction = async (action: Action) => {
    if (buttonStates[action.id] === "injecting") return;

    setButtonStates((prev) => ({ ...prev, [action.id]: "injecting" }));

    const recentPrompts = (currentSession.entries || [])
      .slice(-3)
      .map((e) => e.prompt.slice(0, 100));

    const prompt = action.buildPrompt({
      projectName: projectContext.name || "Unknown",
      projectDescription: projectContext.description || "",
      stack: projectContext.stack || "",
      sessionGoal: sessionGoal || "(not set)",
      recentPrompts,
    });

    try {
      await chrome.runtime.sendMessage({ type: "INJECT_BRIEF", text: prompt });
      trackEvent("action_" + action.id);
      setButtonStates((prev) => ({ ...prev, [action.id]: "done" }));
      setTimeout(() => {
        setButtonStates((prev) => ({ ...prev, [action.id]: "idle" }));
      }, 2000);
    } catch {
      setButtonStates((prev) => ({ ...prev, [action.id]: "idle" }));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-flint-text-primary mb-1">Quick Actions</h2>
        <p className="text-xs text-flint-text-muted">
          One-click prompts powered by your project context.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const state = buttonStates[action.id] || "idle";
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={state === "injecting"}
              className={`text-left p-3 rounded-lg border transition-all ${
                state === "done"
                  ? "bg-flint-accent/20 border-flint-accent/40"
                  : "bg-flint-card border-flint-border hover:border-flint-accent/40 hover:bg-flint-card/80"
              } ${state === "injecting" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {state === "idle" && (
                <>
                  <div className="text-base mb-1">{action.emoji} <span className="text-xs font-semibold text-flint-text-primary">{action.label}</span></div>
                  <div className="text-[10px] text-flint-text-muted leading-tight">{action.description}</div>
                </>
              )}
              {state === "injecting" && (
                <div className="text-xs text-flint-text-secondary py-1">Injecting...</div>
              )}
              {state === "done" && (
                <div className="text-xs text-flint-accent font-semibold py-1">Injected ✓</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-flint-surface border border-flint-border p-3">
        <p className="text-[10px] text-flint-text-muted leading-relaxed">
          <span className="font-semibold text-flint-text-secondary">Tip:</span> These prompts use
          your Project DNA and session goal for context. Make sure they're set in the Context tab.
        </p>
      </div>
    </div>
  );
};

export default Actions;
