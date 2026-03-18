import React, { useEffect, useState, useCallback, useRef } from "react";
import { analyzePrompt, type AnalysisResult } from "../../lib/promptAnalyzer";
import { getInputText, setInputText, findTextarea } from "../injector";

const PromptAnalyzer: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [contextActive, setContextActive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleAnalyzeRef = useRef<() => void>(() => {});

  const checkInput = useCallback(() => {
    const text = getInputText().trim();
    setCurrentPrompt(text);
    if (text.length >= 10) {
      setVisible(true);
    } else {
      setVisible(false);
      setResult(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    let el: HTMLElement | null = null;
    let retries = 0;

    const attachListeners = () => {
      const found = findTextarea();
      if (found && found !== el) {
        if (el) {
          el.removeEventListener("input", checkInput);
          el.removeEventListener("keyup", checkInput);
        }
        el = found;
        el.addEventListener("input", checkInput);
        el.addEventListener("keyup", checkInput);
      }
      if (!found && retries < 30) {
        retries++;
        setTimeout(attachListeners, 1000);
      }
    };

    const interval = setInterval(checkInput, 600);
    setTimeout(attachListeners, 3000);

    const observer = new MutationObserver(() => {
      attachListeners();
      checkInput();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      if (el) {
        el.removeEventListener("input", checkInput);
        el.removeEventListener("keyup", checkInput);
      }
    };
  }, [checkInput]);

  // Read autoAnalyze + context state on mount and listen for changes
  useEffect(() => {
    chrome.storage.local.get(["autoAnalyze", "projectContext"]).then((data) => {
      setAutoAnalyze(data.autoAnalyze !== false);
      const ctx = data.projectContext;
      setContextActive(ctx?.onboardingComplete && ctx?.enabled);
    });
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.autoAnalyze) {
        setAutoAnalyze(changes.autoAnalyze.newValue !== false);
      }
      if (changes.projectContext) {
        const ctx = changes.projectContext.newValue;
        setContextActive(ctx?.onboardingComplete && ctx?.enabled);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Inject animation keyframes
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes flintPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
      @keyframes flintRingFill { from { stroke-dashoffset: 100; } }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Auto-analyze debounce when autoAnalyze is on
  useEffect(() => {
    if (!autoAnalyze || currentPrompt.length < 15 || result || loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleAnalyzeRef.current();
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [autoAnalyze, currentPrompt, result, loading]);

  const handleAnalyze = async () => {
    if (!currentPrompt || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzePrompt(currentPrompt);
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  handleAnalyzeRef.current = handleAnalyze;

  const handleImprove = () => {
    if (result?.improved) {
      setInputText(result.improved);
      setResult(null);
    }
  };

  const openSidePanel = () => {
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  };

  if (!visible) return null;

  const scoreColor =
    result && result.score >= 7
      ? "#10B981"
      : result && result.score >= 4
        ? "#F59E0B"
        : result
          ? "#EF4444"
          : "#8B5CF6";

  // SVG score ring parameters
  const ringSize = 36;
  const ringStroke = 3;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = result ? (result.score / 10) * ringCircumference : 0;
  const ringOffset = ringCircumference - ringProgress;

  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
      }}
    >
      {/* Error */}
      {error && (
        <div
          style={{
            background: "#141428",
            border: "1px solid #EF4444",
            borderRadius: "10px",
            padding: "8px 12px",
            color: "#F1F0FF",
            fontSize: "12px",
            maxWidth: "260px",
          }}
        >
          {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div
          style={{
            background: "#141428",
            border: "1px solid #1E1E35",
            borderRadius: "12px",
            padding: "10px 14px",
            maxWidth: "280px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            position: "relative",
          }}
        >
          {/* Sidebar button (top-right) */}
          <button
            onClick={openSidePanel}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "none",
              border: "none",
              color: "#8B8BAE",
              fontSize: "12px",
              cursor: "pointer",
              padding: "2px",
              lineHeight: 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#8B5CF6")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#8B8BAE")}
            title="Open Flint panel"
          >
            ↗
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            {/* Score ring */}
            <svg
              width={ringSize}
              height={ringSize}
              style={{ flexShrink: 0 }}
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="#1E1E35"
                strokeWidth={ringStroke}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={scoreColor}
                strokeWidth={ringStroke}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ animation: "flintRingFill 0.6s ease-out" }}
              />
              <text
                x={ringSize / 2}
                y={ringSize / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize="11"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {result.score}
              </text>
            </svg>
            <p
              style={{
                color: "#F1F0FF",
                fontSize: "12px",
                margin: 0,
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              {result.tip}
            </p>
          </div>
          {result.improved && (
            <button
              onClick={handleImprove}
              style={{
                background: "#8B5CF6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#7C3AED")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "#8B5CF6")
              }
            >
              Improve it
            </button>
          )}
        </div>
      )}

      {/* Floating bar (no result) */}
      {!result && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              background: loading ? "#1E1E35" : "#141428",
              border: "1px solid #1E1E35",
              borderRadius: "20px",
              padding: "6px 14px",
              color: "#8B5CF6",
              fontSize: "12px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              animation: loading ? "none" : "flintPulse 2s ease-in-out infinite",
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.borderColor = "#8B5CF6";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#1E1E35";
            }}
          >
            {/* Context dot */}
            {contextActive && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#8B5CF6",
                  boxShadow: "0 0 6px rgba(139, 92, 246, 0.6)",
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontSize: "14px" }}>⚡</span>
            {loading ? "Scoring..." : "Score my prompt"}
          </button>

          {/* Open sidebar button */}
          <button
            onClick={openSidePanel}
            style={{
              background: "#141428",
              border: "1px solid #1E1E35",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              color: "#8B8BAE",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              padding: 0,
              lineHeight: 1,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#8B5CF6";
              e.currentTarget.style.color = "#8B5CF6";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#1E1E35";
              e.currentTarget.style.color = "#8B8BAE";
            }}
            title="Open Flint panel"
          >
            ↗
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptAnalyzer;
