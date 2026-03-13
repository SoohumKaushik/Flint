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
    // Wait 3 seconds on cold load before first attempt — claude.ai mounts the editor late
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

  // Read autoAnalyze setting on mount and listen for changes
  useEffect(() => {
    chrome.storage.local.get("autoAnalyze").then((data) => {
      setAutoAnalyze(data.autoAnalyze !== false);
    });
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.autoAnalyze) {
        setAutoAnalyze(changes.autoAnalyze.newValue !== false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Inject pulse animation keyframe
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes flintPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }`;
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

  if (!visible) return null;

  const scoreColor =
    result && result.score >= 7
      ? "#10B981"
      : result && result.score >= 4
        ? "#F59E0B"
        : result
          ? "#EF4444"
          : "#8B5CF6";

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
      {/* Error (non-key errors only) */}
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
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                background: scoreColor,
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                borderRadius: "6px",
                padding: "2px 8px",
                minWidth: "28px",
                textAlign: "center",
              }}
            >
              {result.score}/10
            </span>
            <span style={{ color: "#8B8BAE", fontSize: "12px" }}>
              Prompt score
            </span>
          </div>
          <p
            style={{
              color: "#F1F0FF",
              fontSize: "12px",
              margin: "0 0 8px 0",
              lineHeight: 1.4,
            }}
          >
            {result.tip}
          </p>
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

      {/* Analyze badge */}
      {!result && (
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
          <span style={{ fontSize: "14px" }}>⚡</span>
          {loading ? "Scoring..." : "✦ Score my prompt"}
        </button>
      )}
    </div>
  );
};

export default PromptAnalyzer;
