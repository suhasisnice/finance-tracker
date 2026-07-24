// Portfolio allocation donut. Same SVG arc technique as the app's DonutChart,
// but percentage-aware and driven by the customisable holdings — each entry is
// {label, weight, annualReturn, exchange?}. Colours are assigned by index.

import { CATEGORY_PALETTE } from "../../chartPalette";

export default function AllocationDonut({ allocation, diversification }) {
  if (!allocation || allocation.length === 0) {
    return <p className="muted text-sm">No allocation to show — add a holding to see the mix.</p>;
  }

  const total = allocation.reduce((s, a) => s + (a.weight || 0), 0) || 1;
  const size = 150, cx = size / 2, cy = size / 2, r = 54, strokeW = 20;
  const circumference = 2 * Math.PI * r;

  // Prefix-sum the dash offsets without mutating a render-scope variable.
  const dashLens = allocation.map((a) => ((a.weight || 0) / total) * circumference);
  const slices = allocation.map((a, i) => ({
    ...a,
    color: a.color || CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    dashLen: dashLens[i],
    offset: dashLens.slice(0, i).reduce((s, v) => s + v, 0),
  }));

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           role="img" aria-label="Portfolio allocation">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle
            key={s.id || s.label || i}
            cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
            strokeDashoffset={-(s.offset - circumference / 4)}
            style={{ transition: "stroke-dasharray .4s ease" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600" fontFamily="inherit">
          Diversified
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="14" fill="var(--text)" fontWeight="700" fontFamily="inherit">
          {Math.round(diversification)}
        </text>
      </svg>

      <div className="donut-legend">
        {slices.map((s, i) => (
          <div className="legend-item" key={s.id || s.label || i}>
            <span className="legend-swatch" style={{ background: s.color }} />
            <span className="legend-cat">
              {s.label}{s.exchange ? ` · ${s.exchange}` : ""}
            </span>
            <span className="legend-val">
              {Math.round((s.weight / total) * 100)}% · {(s.annualReturn * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
