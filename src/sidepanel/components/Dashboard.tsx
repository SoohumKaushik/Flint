import React from "react";
import { useFlintStore } from "../../store";

const DAILY_TIPS = [
  "Start with what you want to build, not how to build it.",
  "Be specific — say 'blue signup button' not just 'a button'.",
  "Share error messages directly — AI reads them faster than you.",
  "Break big tasks into small, clear steps for better results.",
  "Give examples of what you want — it helps AI understand your vision.",
  "Tell AI what NOT to do — constraints help narrow the output.",
  "Mention your tech stack so AI writes compatible code.",
  "Re-read your prompt once — would a stranger understand it?",
  "If the output is wrong, refine your prompt instead of starting over.",
  "Use Flint's 'Improve it' button to level up weak prompts instantly.",
];

function getTodayTip(): string {
  const day = new Date().getDate();
  return DAILY_TIPS[day % DAILY_TIPS.length];
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-flint-card border border-flint-border rounded-xl p-4 ${className}`}
  >
    {children}
  </div>
);

const Dashboard: React.FC = () => {
  const dailyUsage = useFlintStore((s) => s.dailyUsage);
  const dailySessions = useFlintStore((s) => s.dailySessions);
  const promptHistory = useFlintStore((s) => s.promptHistory);

  // Compute average score from today's prompts
  const todayPrompts = promptHistory.filter(
    (p) => new Date(p.timestamp).toDateString() === new Date().toDateString()
  );
  const avgScore =
    todayPrompts.length > 0
      ? todayPrompts.reduce((sum, p) => sum + p.score, 0) / todayPrompts.length
      : 0;

  const scoreColor =
    avgScore >= 7 ? "text-flint-success" : avgScore >= 4 ? "text-flint-warning" : avgScore > 0 ? "text-flint-danger" : "text-flint-text-muted";

  // Usage progress (cap at 100 prompts as a soft daily limit visual)
  const usagePct = Math.min(100, (dailyUsage.promptCount / 100) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Today's Usage */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-flint-text-secondary">
            Today's Usage
          </span>
          <span className="text-xs text-flint-text-muted">
            {dailyUsage.promptCount} prompts
          </span>
        </div>
        <div className="w-full h-2 bg-flint-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-flint-accent rounded-full transition-all duration-500"
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <p className="text-[10px] text-flint-text-muted mt-1.5">
          ~{dailyUsage.totalTokens.toLocaleString()} credits used today
        </p>
      </Card>

      {/* Efficiency Score */}
      <Card>
        <span className="text-xs font-semibold text-flint-text-secondary">
          Efficiency Score
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className={`text-4xl font-bold ${scoreColor}`}>
            {avgScore > 0 ? avgScore.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-flint-text-muted">/10</span>
        </div>
        <p className="text-[10px] text-flint-text-muted mt-1">
          Average prompt quality today
        </p>
      </Card>

      {/* Score Trend */}
      {promptHistory.length > 0 && (
        <Card>
          <span className="text-xs font-semibold text-flint-text-secondary">
            Score Trend
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            {promptHistory.slice(0, 7).map((p, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  p.score >= 7
                    ? "bg-flint-success"
                    : p.score >= 4
                      ? "bg-flint-warning"
                      : "bg-flint-danger"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-flint-text-muted mt-1.5">
            Last {Math.min(promptHistory.length, 7)} prompts
          </p>
        </Card>
      )}

      {/* Sessions */}
      <Card>
        <span className="text-xs font-semibold text-flint-text-secondary">
          Sessions
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-bold text-flint-text-primary">
            {dailySessions}
          </span>
        </div>
        <p className="text-[10px] text-flint-text-muted mt-1">
          Conversations today
        </p>
      </Card>

      {/* Daily tip */}
      <Card className="bg-flint-surface border-flint-accent/20">
        <span className="text-xs font-semibold text-flint-accent">
          Daily Tip
        </span>
        <p className="text-xs text-flint-text-primary mt-2 leading-relaxed">
          {getTodayTip()}
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
