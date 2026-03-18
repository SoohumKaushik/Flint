import React, { useEffect, useState } from "react";
import { useFlintStore } from "../../store";

function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function scoreColor(score: number): string {
  if (score >= 7) return "bg-flint-success";
  if (score >= 4) return "bg-flint-warning";
  return "bg-flint-danger";
}

function scoreTextColor(score: number): string {
  if (score >= 7) return "text-flint-success";
  if (score >= 4) return "text-flint-warning";
  return "text-flint-danger";
}

const LiveSession: React.FC = () => {
  const currentSession = useFlintStore((s) => s.currentSession);
  const sessionGoal = useFlintStore((s) => s.sessionGoal);
  const startNewSession = useFlintStore((s) => s.startNewSession);

  const [elapsed, setElapsed] = useState("");
  const [resetToast, setResetToast] = useState(false);

  // Timer — update every 30s
  useEffect(() => {
    const update = () =>
      setElapsed(formatElapsed(Date.now() - currentSession.startTime));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [currentSession.startTime]);

  const entries = currentSession.entries;
  const count = entries.length;
  const avg =
    count > 0
      ? entries.reduce((s, e) => s + e.score, 0) / count
      : null;
  const best = count > 0 ? Math.max(...entries.map((e) => e.score)) : null;

  // Session health (last 3)
  const lastThree = entries.slice(-3);
  const healthAvg =
    lastThree.length >= 2
      ? lastThree.reduce((s, e) => s + e.score, 0) / lastThree.length
      : null;

  let healthLabel: React.ReactNode = null;
  if (healthAvg !== null) {
    if (healthAvg > 8)
      healthLabel = (
        <span className="text-flint-success font-bold text-xs">
          🔥 On fire
        </span>
      );
    else if (healthAvg >= 7)
      healthLabel = (
        <span className="text-flint-success text-xs">⚡ In the zone</span>
      );
    else if (healthAvg >= 4)
      healthLabel = (
        <span className="text-flint-warning text-xs">📈 Getting there</span>
      );
    else
      healthLabel = (
        <span className="text-flint-danger text-xs">😅 Struggling</span>
      );
  }

  const handleReset = async () => {
    await startNewSession();
    setResetToast(true);
    setTimeout(() => setResetToast(false), 1500);
  };

  const trailDots = entries.slice(-10);

  return (
    <div className="bg-flint-card border border-flint-border rounded-xl p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-flint-text-secondary">
          Live Session
        </span>
        <span className="text-xs text-flint-text-muted tabular-nums">
          {elapsed}
        </span>
      </div>

      {/* Session goal */}
      {sessionGoal && (
        <div className="border-l-2 border-flint-accent pl-2 mb-2.5">
          <p className="text-[10px] italic text-flint-text-muted truncate">
            {sessionGoal}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 mb-2.5">
        <div className="bg-flint-surface rounded-lg py-1.5 text-center">
          <p className="text-sm font-semibold text-flint-text-primary">
            {count}
          </p>
          <p className="text-[10px] text-flint-text-muted">Prompts</p>
        </div>
        <div className="bg-flint-surface rounded-lg py-1.5 text-center">
          <p
            className={`text-sm font-semibold ${
              avg !== null ? scoreTextColor(avg) : "text-flint-text-muted"
            }`}
          >
            {avg !== null ? avg.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-flint-text-muted">Avg Score</p>
        </div>
        <div className="bg-flint-surface rounded-lg py-1.5 text-center">
          <p
            className={`text-sm font-semibold ${
              best !== null ? scoreTextColor(best) : "text-flint-text-muted"
            }`}
          >
            {best !== null ? best : "—"}
          </p>
          <p className="text-[10px] text-flint-text-muted">Best</p>
        </div>
      </div>

      {/* Score trail */}
      <div className="mb-2">
        <p className="text-[10px] text-flint-text-muted mb-1">Score trail</p>
        {trailDots.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {trailDots.map((e, i) => (
              <span
                key={i}
                title={String(e.score)}
                className={`w-2.5 h-2.5 rounded-full ${scoreColor(e.score)}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-[10px] italic text-flint-text-muted">
            No prompts scored yet
          </p>
        )}
      </div>

      {/* Health + Reset */}
      <div className="flex items-center justify-between">
        <div>{healthLabel}</div>
        <button
          onClick={handleReset}
          className="text-[10px] text-flint-text-muted hover:text-flint-accent transition-colors"
        >
          {resetToast ? "Session reset" : "New Session"}
        </button>
      </div>
    </div>
  );
};

export default LiveSession;
