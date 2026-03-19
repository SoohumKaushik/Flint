import React, { useState } from "react";
import { useFlintStore } from "../../store";
import { trackEvent, generateBrief } from "../../lib/promptAnalyzer";
import Onboarding from "./Onboarding";
import LiveSession from "./LiveSession";

const Context: React.FC = () => {
  const projectContext = useFlintStore((s) => s.projectContext);
  const sessionGoal = useFlintStore((s) => s.sessionGoal);
  const references = useFlintStore((s) => s.references);
  const updateProjectContext = useFlintStore((s) => s.updateProjectContext);
  const setSessionGoal = useFlintStore((s) => s.setSessionGoal);
  const addReference = useFlintStore((s) => s.addReference);
  const removeReference = useFlintStore((s) => s.removeReference);

  const [editing, setEditing] = useState(false);
  const [showRefForm, setShowRefForm] = useState(false);
  const [refLabel, setRefLabel] = useState("");
  const [refContent, setRefContent] = useState("");
  const [briefing, setBriefing] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleOnboardingComplete = async (data: {
    name: string;
    description: string;
    stack: string;
    targetUsers: string;
    sessionGoal: string;
  }) => {
    await updateProjectContext({
      name: data.name,
      description: data.description,
      stack: data.stack,
      targetUsers: data.targetUsers,
      onboardingComplete: true,
    });
    await setSessionGoal(data.sessionGoal);
    trackEvent("context_setup_completed");
    setEditing(false);
  };

  const handleAddRef = async () => {
    if (!refLabel.trim() || !refContent.trim()) return;
    await addReference({ label: refLabel.trim(), content: refContent.trim() });
    setRefLabel("");
    setRefContent("");
    setShowRefForm(false);
  };

  const buildFallbackBrief = () => {
    const lines = [`[Context for this session]`];
    lines.push(`Project: ${projectContext.name} — ${projectContext.description}`);
    lines.push(`Stack: ${projectContext.stack}`);
    lines.push(`Users: ${projectContext.targetUsers}`);
    if (sessionGoal) lines.push(`Today's goal: ${sessionGoal}`);
    references.forEach((r) => lines.push(`${r.label}: ${r.content}`));
    lines.push("");
    lines.push("Keep this context in mind throughout our conversation.");
    return lines.join("\n");
  };

  const handleBriefClaude = async () => {
    setBriefing("loading");
    try {
      const brief = await generateBrief({
        projectName: projectContext.name || undefined,
        projectDescription: projectContext.description || undefined,
        stack: projectContext.stack || undefined,
        targetUsers: projectContext.targetUsers || undefined,
        sessionGoal: sessionGoal || undefined,
        references: references.length
          ? references.map((r) => ({ label: r.label, content: r.content }))
          : undefined,
      });
      chrome.runtime.sendMessage({ type: "INJECT_BRIEF", text: brief });
      setBriefing("done");
    } catch {
      // Silent fallback to plain-text template
      chrome.runtime.sendMessage({ type: "INJECT_BRIEF", text: buildFallbackBrief() });
      setBriefing("done");
    }
    trackEvent("brief_claude_used");
    setTimeout(() => setBriefing("idle"), 2000);
  };

  // Show onboarding if not complete or editing
  if (!projectContext.onboardingComplete || editing) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        initialData={
          projectContext.onboardingComplete
            ? {
                name: projectContext.name,
                description: projectContext.description,
                stack: projectContext.stack,
                targetUsers: projectContext.targetUsers,
                sessionGoal,
              }
            : undefined
        }
      />
    );
  }

  const stackChips = projectContext.stack
    .split(/[,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* Live Session */}
      <LiveSession />

      {/* Project DNA */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-flint-text-secondary uppercase tracking-widest">
            Project DNA
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={projectContext.enabled}
              onChange={(e) =>
                updateProjectContext({ enabled: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-flint-surface border border-flint-border rounded-full peer peer-checked:bg-flint-accent peer-checked:border-flint-accent transition-all after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4 after:shadow-sm" />
          </label>
        </div>
        <p className="text-sm font-medium text-flint-text-primary mb-0.5">
          {projectContext.name}
        </p>
        <p className="text-xs text-flint-text-muted mb-2 leading-relaxed">
          {projectContext.description}
        </p>
        {stackChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {stackChips.map((chip) => (
              <span
                key={chip}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-flint-accent/10 text-flint-accent border border-flint-accent/20"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-flint-text-muted hover:text-flint-accent transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Today's Goal */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-3.5">
        <span className="text-xs font-semibold text-flint-text-secondary uppercase tracking-widest block mb-2">
          Today's Goal
        </span>
        <textarea
          value={sessionGoal}
          onChange={(e) => setSessionGoal(e.target.value)}
          placeholder="What do you want to accomplish today?"
          rows={2}
          className="w-full bg-flint-surface border border-flint-border rounded-lg px-3 py-2 text-xs text-flint-text-primary placeholder:text-flint-text-muted focus:outline-none focus:border-flint-accent resize-none"
        />
      </div>

      {/* References */}
      <div className="bg-flint-card border border-flint-border rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-flint-text-secondary uppercase tracking-widest">
            References
          </span>
          {references.length < 5 && (
            <button
              onClick={() => setShowRefForm(true)}
              className="text-xs text-flint-text-muted hover:text-flint-accent transition-colors"
            >
              + Add
            </button>
          )}
        </div>

        {references.map((ref) => (
          <div
            key={ref.id}
            className="flex items-start gap-2 py-1.5 border-b border-flint-border last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-flint-text-primary truncate">
                {ref.label}
              </p>
              <p className="text-[11px] text-flint-text-muted truncate">
                {ref.content}
              </p>
            </div>
            <button
              onClick={() => removeReference(ref.id)}
              className="text-flint-text-muted hover:text-flint-danger text-xs shrink-0 mt-0.5"
            >
              ×
            </button>
          </div>
        ))}

        {showRefForm && (
          <div className="mt-2 flex flex-col gap-1.5">
            <input
              value={refLabel}
              onChange={(e) => setRefLabel(e.target.value)}
              placeholder="Label (e.g. API docs)"
              className="w-full bg-flint-surface border border-flint-border rounded-lg px-3 py-1.5 text-xs text-flint-text-primary placeholder:text-flint-text-muted focus:outline-none focus:border-flint-accent"
              autoFocus
            />
            <textarea
              value={refContent}
              onChange={(e) => setRefContent(e.target.value)}
              placeholder="URL or paste text"
              rows={2}
              className="w-full bg-flint-surface border border-flint-border rounded-lg px-3 py-1.5 text-xs text-flint-text-primary placeholder:text-flint-text-muted focus:outline-none focus:border-flint-accent resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddRef}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-flint-accent text-white hover:bg-flint-accent-hover transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowRefForm(false);
                  setRefLabel("");
                  setRefContent("");
                }}
                className="px-3 py-1 text-xs text-flint-text-muted hover:text-flint-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {references.length === 0 && !showRefForm && (
          <p className="text-[11px] text-flint-text-muted">
            Add URLs or notes for Claude to reference.
          </p>
        )}
      </div>

      {/* Brief Claude button */}
      <button
        onClick={handleBriefClaude}
        disabled={briefing === "loading"}
        className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${
          briefing === "loading"
            ? "bg-flint-accent/70 text-white/80 cursor-wait animate-pulse"
            : "bg-flint-accent text-white hover:bg-flint-accent-hover"
        }`}
      >
        {briefing === "loading"
          ? "Crafting brief..."
          : briefing === "done"
            ? "Briefed! 🎯"
            : "✦ Brief Claude"}
      </button>
    </div>
  );
};

export default Context;
