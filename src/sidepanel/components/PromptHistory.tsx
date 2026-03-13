import React, { useState } from "react";
import { useFlintStore, type PromptEntry } from "../../store";

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const bg =
    score >= 7
      ? "bg-flint-success"
      : score >= 4
        ? "bg-flint-warning"
        : "bg-flint-danger";

  return (
    <span
      className={`${bg} text-white text-[11px] font-bold rounded-md px-1.5 py-0.5 min-w-[28px] text-center`}
    >
      {score}
    </span>
  );
};

const HistoryItem: React.FC<{ entry: PromptEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(entry.timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left bg-flint-card border border-flint-border rounded-xl p-3 transition-colors hover:border-flint-accent/30"
    >
      <div className="flex items-start gap-2">
        <ScoreBadge score={entry.score} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-flint-text-primary truncate">
            {entry.prompt}
          </p>
          <p className="text-[10px] text-flint-text-muted mt-0.5">
            {date} at {time}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-flint-border">
          <p className="text-xs text-flint-text-secondary leading-relaxed mb-1">
            {entry.prompt}
          </p>
          <p className="text-[11px] text-flint-accent mt-2">
            Tip: {entry.tip}
          </p>
          {entry.improved && (
            <div className="mt-2 bg-flint-surface rounded-lg p-2">
              <p className="text-[10px] text-flint-text-muted mb-1">
                Suggested improvement:
              </p>
              <p className="text-xs text-flint-text-primary">
                {entry.improved}
              </p>
            </div>
          )}
        </div>
      )}
    </button>
  );
};

const PromptHistory: React.FC = () => {
  const promptHistory = useFlintStore((s) => s.promptHistory);

  if (promptHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3">📝</div>
        <p className="text-sm text-flint-text-secondary">No prompts yet</p>
        <p className="text-xs text-flint-text-muted mt-1">
          Your analyzed prompts will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-flint-text-muted mb-1">
        Last {promptHistory.length} analyzed prompts
      </p>
      {promptHistory.map((entry, i) => (
        <HistoryItem key={`${entry.timestamp}-${i}`} entry={entry} />
      ))}
    </div>
  );
};

export default PromptHistory;
