// Year-wise corpus growth as stacked bars: invested (base) + profit (top). The
// full bar height is that year's projected corpus, so this reads as both the
// invested-vs-profit split and the year-wise corpus trajectory.

import { useState } from "react";
import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount as formatAmount } from "../../currency";

export default function InvestVsProfitBars({ data }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);
  const [hover, setHover] = useState(null);

  if (!data || data.length === 0) {
    return <p className="muted text-sm">No projection to chart.</p>;
  }

  // Cap the number of bars so long horizons stay readable (sample every k years).
  const MAX_BARS = 12;
  const stride = Math.ceil(data.length / MAX_BARS);
  const rows = data.filter((_, i) => i % stride === 0 || i === data.length - 1);

  const W = 480, H = 220, padL = 14, padR = 14, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const yMax = Math.max(...rows.map((d) => d.corpus), 1) * 1.1;
  const n = rows.length;
  const slot = plotW / n;
  const barW = Math.min(30, slot * 0.6);
  const yv = (v) => (v / yMax) * plotH;

  return (
    <div className="trend-chart">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
           role="img" aria-label="Year-wise invested versus profit"
           onMouseLeave={() => setHover(null)}>
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth="1" />
        {rows.map((d, i) => {
          const cx = padL + slot * (i + 0.5);
          const invH = yv(d.invested);
          const proH = yv(d.profit);
          const baseY = padT + plotH;
          return (
            <g key={d.year} onMouseEnter={() => setHover(d)} style={{ cursor: "pointer" }}>
              {/* invisible hit area */}
              <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
              {/* invested (base) */}
              <rect x={cx - barW / 2} y={baseY - invH} width={barW} height={invH}
                    fill="var(--primary)" rx="3" />
              {/* profit (stacked on top, 2px gap) */}
              <rect x={cx - barW / 2} y={baseY - invH - proH - 2} width={barW} height={Math.max(0, proH)}
                    fill="var(--income)" rx="3" />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="inherit">
                Y{d.year}
              </text>
            </g>
          );
        })}

        {hover && (
          <g pointerEvents="none">
            <text x={W / 2} y={padT + 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="inherit">
              Year {hover.year}: {fmt(hover.corpus)}
            </text>
            <text x={W / 2} y={padT + 14} textAnchor="middle" fontSize="8.5" fill="var(--text-muted)" fontFamily="inherit">
              invested {fmt(hover.invested)} · profit {fmt(hover.profit)}
            </text>
          </g>
        )}
      </svg>
      <div className="trend-legend">
        <span className="trend-legend-item"><span className="trend-swatch" style={{ background: "var(--primary)" }} /> Invested</span>
        <span className="trend-legend-item"><span className="trend-swatch" style={{ background: "var(--income)" }} /> Profit</span>
      </div>
    </div>
  );
}
