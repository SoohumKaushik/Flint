import React, { useState } from "react";

interface OnboardingProps {
  onComplete: (data: {
    name: string;
    description: string;
    stack: string;
    targetUsers: string;
    sessionGoal: string;
  }) => void;
  initialData?: Partial<{
    name: string;
    description: string;
    stack: string;
    targetUsers: string;
    sessionGoal: string;
  }>;
}

const TECH_CHIPS = [
  "Next.js",
  "React",
  "TypeScript",
  "Python",
  "Supabase",
  "Firebase",
  "Tailwind",
  "Node.js",
  "PostgreSQL",
  "Stripe",
  "Vue",
  "FastAPI",
];

const STEPS = [
  {
    question: "What are you building?",
    placeholder:
      "e.g. A SaaS tool that helps designers manage client feedback",
    field: "description" as const,
    type: "textarea" as const,
  },
  {
    question: "What's your tech stack?",
    placeholder: "e.g. Next.js, TypeScript, Supabase",
    field: "stack" as const,
    type: "input" as const,
  },
  {
    question: "Who is it for?",
    placeholder: "e.g. Indie developers, small design agencies",
    field: "targetUsers" as const,
    type: "input" as const,
  },
  {
    question: "What do you want to achieve today?",
    placeholder: "e.g. Fix the auth flow and add a dashboard page",
    field: "sessionGoal" as const,
    type: "textarea" as const,
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialData }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    stack: initialData?.stack || "",
    targetUsers: initialData?.targetUsers || "",
    sessionGoal: initialData?.sessionGoal || "",
  });
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const current = STEPS[step];
  const value = data[current.field];

  const updateField = (val: string) => {
    setData((prev) => ({ ...prev, [current.field]: val }));
  };

  const addChip = (chip: string) => {
    const existing = data.stack;
    if (existing.includes(chip)) return;
    const newVal = existing ? `${existing}, ${chip}` : chip;
    setData((prev) => ({ ...prev, stack: newVal }));
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setDirection("forward");
      setStep((s) => s + 1);
    } else {
      // Extract name from description (first sentence or first ~40 chars)
      let name = data.description;
      const dashIdx = name.indexOf("—");
      const colonIdx = name.indexOf(":");
      if (dashIdx > 0 && dashIdx < 50) name = name.slice(0, dashIdx).trim();
      else if (colonIdx > 0 && colonIdx < 50) name = name.slice(0, colonIdx).trim();
      else if (name.length > 50) name = name.slice(0, 50).trim();
      onComplete({ ...data, name });
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection("back");
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-5 py-8">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < step
                ? "bg-flint-accent"
                : i === step
                  ? "bg-flint-accent scale-125"
                  : "bg-flint-border"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div
        key={step}
        className="w-full max-w-sm"
        style={{
          animation: `flintFadeIn 0.3s ease-out`,
        }}
      >
        <h2 className="text-lg font-semibold text-flint-text-primary mb-4 text-center">
          {current.question}
        </h2>

        {current.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => updateField(e.target.value)}
            placeholder={current.placeholder}
            rows={3}
            className="w-full bg-flint-card border border-flint-border rounded-xl px-4 py-3 text-sm text-flint-text-primary placeholder:text-flint-text-muted focus:outline-none focus:border-flint-accent resize-none"
            autoFocus
          />
        ) : (
          <input
            value={value}
            onChange={(e) => updateField(e.target.value)}
            placeholder={current.placeholder}
            className="w-full bg-flint-card border border-flint-border rounded-xl px-4 py-3 text-sm text-flint-text-primary placeholder:text-flint-text-muted focus:outline-none focus:border-flint-accent"
            autoFocus
          />
        )}

        {/* Tech chips on step 2 */}
        {step === 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {TECH_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => addChip(chip)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  data.stack.includes(chip)
                    ? "bg-flint-accent/20 border-flint-accent text-flint-accent"
                    : "bg-flint-card border-flint-border text-flint-text-secondary hover:border-flint-accent hover:text-flint-accent"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex w-full max-w-sm justify-between mt-8">
        <button
          onClick={back}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            step === 0
              ? "invisible"
              : "text-flint-text-muted hover:text-flint-text-primary"
          }`}
        >
          Back
        </button>
        <button
          onClick={next}
          className="px-5 py-2 text-sm font-semibold rounded-lg bg-flint-accent text-white hover:bg-flint-accent-hover transition-colors"
        >
          {step === STEPS.length - 1 ? "Let's go 🔥" : "Next"}
        </button>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes flintFadeIn {
          from { opacity: 0; transform: translateY(${direction === "forward" ? "12px" : "-12px"}); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
