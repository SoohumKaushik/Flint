import React, { useEffect, useState } from "react";
import {
  contextPercentage,
  contextLabel,
  contextColor,
} from "../../lib/tokenEstimator";
import { getConversationText } from "../injector";

const ContextMeter: React.FC = () => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const text = getConversationText();
      const p = contextPercentage(text.length);
      setPct(p);
    };

    update();

    // Watch for new messages via MutationObserver
    const observer = new MutationObserver(update);
    const target = document.querySelector("main") || document.body;
    observer.observe(target, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  if (pct < 1) return null;

  const color = contextColor(pct);
  const label = contextLabel(pct);

  return (
    <div
      title="Estimated from conversation length — not exact token count"
      style={{
        pointerEvents: "auto",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          background: "#080810",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 0.5s ease, background 0.5s ease",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>
      {/* Label */}
      {pct >= 10 && (
        <div
          style={{
            background: "#080810",
            color,
            fontSize: "11px",
            padding: "3px 10px",
            textAlign: "center",
            opacity: 0.9,
            letterSpacing: "0.02em",
          }}
        >
          {label} — ~{Math.round(pct)}% est.
        </div>
      )}
    </div>
  );
};

export default ContextMeter;
