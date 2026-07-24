// Radial goal-progress ring: how close the projected corpus is to the target.

import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";

export default function GoalProgressRing({ progressPct, corpus, target }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  const pct = Math.max(0, Math.min(100, progressPct));
  const onTrack = pct >= 100;
  const size = 150, cx = size / 2, cy = size / 2, r = 58, strokeW = 14;
  const circ = 2 * Math.PI * r;
  const color = onTrack ? "var(--income)" : pct >= 60 ? "var(--warn)" : "var(--expense)";

  return (
    <div className="progress-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
           role="img" aria-label={`Goal progress ${pct.toFixed(0)} percent`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface2)" strokeWidth={strokeW} />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)" fontFamily="inherit">
          {pct.toFixed(0)}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill={color} fontWeight="600" fontFamily="inherit">
          {onTrack ? "On track" : "Shortfall"}
        </text>
      </svg>
      <div className="progress-ring-meta">
        <div className="ring-meta-row">
          <span className="muted text-xs">Projected</span>
          <span className="mono text-sm">{fmt(corpus)}</span>
        </div>
        <div className="ring-meta-row">
          <span className="muted text-xs">Target</span>
          <span className="mono text-sm">{fmt(target)}</span>
        </div>
      </div>
    </div>
  );
}
