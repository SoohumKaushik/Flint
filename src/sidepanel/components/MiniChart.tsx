import React from "react";

interface MiniChartProps {
  data: number[];        // values 0-10
  color: string;         // stroke color e.g. "#8B5CF6"
  height?: number;       // default 40
  showDots?: boolean;    // default true
  label?: string;        // optional label above chart
}

const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color,
  height = 40,
  showDots = true,
  label,
}) => {
  if (data.length === 0) return null;

  const width = 220;
  const padX = 6;
  const padY = 4;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // Map values to SVG coordinates
  const points = data.map((v, i) => {
    const x = padX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padY + chartH - (v / 10) * chartH;
    return { x, y, v };
  });

  // Build polyline path
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Build fill path (area under line)
  const fillD = [
    ...points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height - padY}`,
    `L ${points[0].x} ${height - padY}`,
    "Z",
  ].join(" ");

  return (
    <div className="w-full">
      {label && (
        <p className="text-xs text-flint-text-muted mb-1">{label}</p>
      )}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full overflow-visible"
      >
        {/* Area fill */}
        <path
          d={fillD}
          fill={color}
          fillOpacity="0.08"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill={color}
            fillOpacity="0.9"
          />
        ))}
      </svg>
    </div>
  );
};

export default MiniChart;
