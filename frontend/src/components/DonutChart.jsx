import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";
import { CATEGORY_PALETTE as PALETTE } from "../chartPalette";

export default function DonutChart({ categories }) {
  const { currency } = useCurrency();

  if (!categories || categories.length === 0) {
    return <p className="muted text-sm">No category data.</p>;
  }

  const total = categories.reduce((s, c) => s + c.total, 0);
  const size = 150;
  const cx = size / 2;
  const cy = size / 2;
  const r = 54;
  const strokeW = 20;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = categories.map((cat, i) => {
    const pct = total > 0 ? cat.total / total : 0;
    const dashLen = pct * circumference;
    const s = { ...cat, pct, dashLen, offset, color: PALETTE[i % PALETTE.length] };
    offset += dashLen;
    return s;
  });

  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
        {slices.map((s) => (
          <circle
            key={s.category}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
            strokeDashoffset={-(s.offset - circumference / 4)}
            style={{ transition: "stroke-dasharray .4s ease" }}
          />
        ))}
        {/* Centre */}
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontWeight="600" fontFamily="inherit">
          Total
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8.5" fill="var(--text)" fontWeight="700" fontFamily="inherit">
          {formatAmount(total, currency)}
        </text>
      </svg>

      <div className="donut-legend">
        {slices.map((s) => (
          <div className="legend-item" key={s.category}>
            <span className="legend-swatch" style={{ background: s.color }} />
            <span className="legend-cat">{s.category}</span>
            <span className="legend-val">{formatAmount(s.total, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
