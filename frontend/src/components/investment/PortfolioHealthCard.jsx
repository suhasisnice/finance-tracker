// Portfolio Health Score — compact semicircle gauge + component breakdown,
// matching the dashboard's Financial Health gauge visual language.

const BANDS = [
  { min: 80, color: "var(--good)" },
  { min: 60, color: "var(--info)" },
  { min: 40, color: "var(--warn)" },
  { min: 0,  color: "var(--expense)" },
];
const bandColor = (s) => (BANDS.find((b) => s >= b.min) || BANDS[3]).color;

export default function PortfolioHealthCard({ health }) {
  if (!health) return null;
  const { score, rating, components } = health;
  const color = bandColor(score);

  const size = 170, cx = size / 2, cy = size / 2, r = 68, strokeW = 13;
  const arc = Math.PI * r;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 6 }}>Portfolio health</div>
      <div className="gauge-wrap">
        <svg width={size} height={cy + 12} viewBox={`0 0 ${size} ${cy + 12}`}
             role="img" aria-label={`Portfolio health ${score} out of 100, ${rating}`}>
          <path d={arcPath} fill="none" stroke="var(--surface2)" strokeWidth={strokeW} strokeLinecap="round" />
          <path d={arcPath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
                strokeDasharray={`${(score / 100) * arc} ${arc}`} style={{ transition: "stroke-dasharray .5s ease" }} />
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--text)" fontFamily="inherit">{score}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fontWeight="600" fill={color} fontFamily="inherit">{rating}</text>
        </svg>
      </div>
      <div className="health-breakdown" style={{ marginTop: 4 }}>
        {Object.entries(components).map(([k, c]) => (
          <div className="health-comp-row" key={k}>
            <div className="health-comp-head">
              <span className="health-comp-label">{c.label}</span>
              <span className="mono text-xs">{c.value}/100</span>
            </div>
            <div className="health-comp-bar-bg">
              <div className="health-comp-bar-fill" style={{ width: `${c.value}%`, background: bandColor(c.value) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
