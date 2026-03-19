import React, { useEffect, useState } from "react";
import { useFlintStore } from "../../store";
import MiniChart from "./MiniChart";

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

function responseColor(relevance: number): string {
  if (relevance >= 7) return "bg-teal-400";
  if (relevance >= 4) return "bg-yellow-400";
  return "bg-red-400";
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

  // Response quality
  const responses = currentSession.responses || [];
  const avgRelevance =
    responses.length > 0
      ? responses.reduce((s, r) => s + r.relevance, 0) / responses.length
      : null;

  // Drift detection
  const lastThreeResponses = responses.slice(-3);
  const driftingCount = lastThreeResponses.filter(r => !r.aligned || r.relevance < 5).length;
  const isDrifting = lastThreeResponses.length >= 2 && driftingCount >= 2;

  const promptScores = entries.slice(-10).map((e) => e.score);
  const responseScores = (currentSession.responses || []).slice(-10).map((r: any) => r.relevance ?? 5);

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
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
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
        <div className="bg-flint-surface rounded-lg py-1.5 text-center">
          <p
            className={`text-sm font-semibold ${
              avgRelevance !== null ? scoreTextColor(avgRelevance) : "text-flint-text-muted"
            }`}
          >
            {avgRelevance !== null ? avgRelevance.toFixed(1) : "—"}
          </p>
          <p className="text-[10px] text-flint-text-muted">Response Qual</p>
        </div>
      </div>

      {/* Score trail */}
      {(promptScores.length > 0 || responseScores.length > 0) && (
        <div className="mb-2 flex flex-col gap-2">
          {promptScores.length > 0 && (
            <MiniChart
              data={promptScores}
              color="#8B5CF6"
              label="Prompt scores"
              height={36}
            />
          )}
          {responseScores.length > 0 && (
            <MiniChart
              data={responseScores}
              color="#2DD4BF"
              label="Response quality"
              height={36}
            />
          )}
        </div>
      )}

      {/* Drift warning */}
      {isDrifting && (
        <div className="mt-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-[11px] text-yellow-400 font-medium">⚠️ Session may be drifting</p>
          <p className="text-[10px] text-flint-text-muted mt-0.5">
            {lastThreeResponses[lastThreeResponses.length - 1]?.suggestion || "Use 'On Track?' in the Actions tab to refocus."}
          </p>
        </div>
      )}

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
