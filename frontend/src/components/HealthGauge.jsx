// Financial Health Score gauge: a 0-100 semicircular arc plus the per-component
// breakdown from the backend. Score is a single headline value, so it's shown as
// a number + rating label (never colour-alone), with the arc colour reinforcing
// the band.

const BANDS = [
  { min: 80, color: "var(--good)",    label: "Excellent" },
  { min: 60, color: "var(--info)",    label: "Good" },
  { min: 40, color: "var(--warn)",    label: "Fair" },
  { min: 20, color: "var(--expense)", label: "Poor" },
  { min: 0,  color: "var(--expense)", label: "Critical" },
];

function bandColor(score) {
  return (BANDS.find((b) => score >= b.min) || BANDS[BANDS.length - 1]).color;
}

function ComponentRow({ c }) {
  const available = c.sub_score != null;
  const pct = available ? Math.max(0, Math.min(100, c.sub_score)) : 0;
  return (
    <div className="health-comp-row">
      <div className="health-comp-head">
        <span className="health-comp-label">{c.label}</span>
        <span className="muted text-xs">{c.raw_display}</span>
      </div>
      <div className="health-comp-bar-bg">
        <div
          className="health-comp-bar-fill"
          style={{ width: `${pct}%`, background: available ? bandColor(c.sub_score) : "var(--border)" }}
        />
      </div>
      <div className="health-comp-meta">
        <span className="muted text-xs">weight {Math.round(c.weight * 100)}%</span>
        <span className="mono text-xs">{available ? `${c.sub_score.toFixed(0)}/100` : "n/a"}</span>
      </div>
    </div>
  );
}

export default function HealthGauge({ data }) {
  if (!data || data.score == null) {
    return (
      <div className="card">
        <div className="panel-heading">Financial Health Score</div>
        <p className="muted text-sm">{data?.message || "Not enough data to score yet."}</p>
      </div>
    );
  }

  const { score, rating, components } = data;
  const color = bandColor(score);

  // Top semicircle drawn as a dashed arc (same technique as the donut).
  const size = 200, cx = size / 2, cy = size / 2, r = 82, strokeW = 16;
  const arc = Math.PI * r;                    // length of a semicircle
  const filled = (score / 100) * arc;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const order = ["savings_rate", "discretionary_ratio", "volatility", "concentration"];

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 8 }}>Financial Health Score</div>

      <div className="gauge-wrap">
        <svg width={size} height={cy + 14} viewBox={`0 0 ${size} ${cy + 14}`} role="img"
             aria-label={`Health score ${score} out of 100, rated ${rating}`}>
          <path d={arcPath} fill="none" stroke="var(--border)" strokeWidth={strokeW} strokeLinecap="round" />
          <path d={arcPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${filled} ${arc}`} style={{ transition: "stroke-dasharray .5s ease" }} />
          <text x={cx} y={cy - 12} textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--text)" fontFamily="inherit">
            {score}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="12" fontWeight="600" fill={color} fontFamily="inherit">
            {rating}
          </text>
        </svg>
        <div className="gauge-scale">
          <span className="muted text-xs">0</span>
          <span className="muted text-xs">100</span>
        </div>
      </div>

      <div className="health-breakdown">
        {order.filter((k) => components[k]).map((k) => <ComponentRow key={k} c={components[k]} />)}
      </div>
    </div>
  );
}
