// Spend trend in 5-day buckets with a least-squares forecast continuation.
// Change-over-time, one series: a dense solid line over observed 5-day windows,
// a dashed continuation over the projected buckets, and a shaded ±10% band. Both
// halves share one per-bucket y-axis. A crosshair reports the value under the
// pointer (the series is too dense for a marker on every point).

import { useState } from "react";
import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const shortDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
};

export default function TrendForecastChart({ trend }) {
  const { currency } = useCurrency();
  const [hover, setHover] = useState(null);

  if (!trend || !trend.binned || trend.binned.length < 2) {
    return <p className="muted text-sm">Need at least two 5-day periods of data to plot a trend.</p>;
  }

  const observed = trend.binned;              // [{date, total}]
  const projected = trend.forecast || [];     // [{date, value, lower, upper}]

  // One continuous index axis: observed first, then the projected buckets.
  const points = [
    ...observed.map((b) => ({ date: b.date, value: b.total, forecast: false })),
    ...projected.map((f) => ({ date: f.date, value: f.value, lower: f.lower, upper: f.upper, forecast: true })),
  ];
  const N = points.length;
  const bStart = observed.length;             // first forecast index

  const W = 480, H = 210;
  const padL = 14, padR = 16, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const yMax = Math.max(
    ...observed.map((b) => b.total),
    ...projected.map((f) => f.upper),
    1,
  ) * 1.15;
  const x = (i) => padL + (i / (N - 1)) * plotW;
  const y = (v) => padT + plotH - (v / yMax) * plotH;

  const obsLine = observed.map((b, i) => `${x(i)},${y(b.total)}`).join(" ");

  // Dashed forecast line runs from the last observed point through the projection.
  const fcLine = [
    `${x(bStart - 1)},${y(observed[observed.length - 1].total)}`,
    ...projected.map((f, k) => `${x(bStart + k)},${y(f.value)}`),
  ].join(" ");

  // ±10% band polygon across the projected region.
  const bandTop = projected.map((f, k) => `${x(bStart + k)},${y(f.upper)}`);
  const bandBot = projected.map((f, k) => `${x(bStart + k)},${y(f.lower)}`).reverse();
  const bandPath = projected.length ? `${bandTop.join(" ")} ${bandBot.join(" ")}` : "";

  // ~6 evenly spaced date labels so the axis doesn't crowd.
  const labelStep = Math.max(1, Math.round((N - 1) / 5));
  const labelIdx = [];
  for (let i = 0; i < N; i += labelStep) labelIdx.push(i);
  if (labelIdx[labelIdx.length - 1] !== N - 1) labelIdx.push(N - 1);

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    let i = Math.round(((vbX - padL) / plotW) * (N - 1));
    i = Math.max(0, Math.min(N - 1, i));
    setHover(i);
  }

  return (
    <div className="trend-chart">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
           role="img" aria-label="Spend trend in 5-day periods with forecast"
           onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {/* baseline */}
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth="1" />

        {/* forecast start divider */}
        {projected.length > 0 && (
          <line x1={x(bStart - 1)} y1={padT} x2={x(bStart - 1)} y2={padT + plotH}
                stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 3" />
        )}

        {/* ±10% band */}
        {bandPath && <polygon points={bandPath} fill="var(--info-dim)" stroke="none" />}

        {/* observed solid line */}
        <polyline points={obsLine} fill="none" stroke="var(--primary)" strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round" />

        {/* dashed forecast line */}
        {projected.length > 0 && (
          <polyline points={fcLine} fill="none" stroke="var(--info)" strokeWidth="2"
                    strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* x labels */}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9"
                fill={i >= bStart ? "var(--info)" : "var(--text-muted)"} fontFamily="inherit">
            {shortDate(points[i].date)}
          </text>
        ))}

        {/* hover crosshair + point */}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH}
                  stroke="var(--border-glass)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(points[hover].value)} r="4"
                    fill={points[hover].forecast ? "var(--bg2)" : "var(--primary)"}
                    stroke={points[hover].forecast ? "var(--info)" : "var(--bg2)"} strokeWidth="2" />
            <text x={Math.min(Math.max(x(hover), 50), W - 50)} y={padT + 1} textAnchor="middle"
                  fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="inherit">
              {formatAmount(points[hover].value, currency)}
            </text>
            <text x={Math.min(Math.max(x(hover), 50), W - 50)} y={padT + 13} textAnchor="middle"
                  fontSize="8.5" fill="var(--text-muted)" fontFamily="inherit">
              {shortDate(points[hover].date)}{points[hover].forecast ? " · projected" : ""}
            </text>
          </g>
        )}
      </svg>

      <div className="trend-legend">
        <span className="trend-legend-item">
          <span className="trend-swatch" style={{ background: "var(--primary)" }} /> Observed (per 5 days)
        </span>
        <span className="trend-legend-item">
          <span className="trend-swatch trend-swatch-dashed" /> Forecast
        </span>
        <span className="trend-legend-item">
          <span className="trend-swatch" style={{ background: "var(--info-dim)" }} /> ±10% band
        </span>
      </div>
    </div>
  );
}
