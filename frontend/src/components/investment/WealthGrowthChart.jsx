// Year-wise wealth growth: the invested line and the projected-corpus line,
// with the widening gap between them (your returns) shaded. Change-over-time,
// two related series on one y-axis. Crosshair reports the year under the pointer.

import { useState } from "react";
import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount as formatAmount } from "../../currency";

export default function WealthGrowthChart({ data }) {
  const { currency } = useCurrency();
  const [hover, setHover] = useState(null);

  if (!data || data.length < 2) {
    return <p className="muted text-sm">Not enough duration to plot growth.</p>;
  }

  const W = 480, H = 220, padL = 14, padR = 16, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const N = data.length;

  const yMax = Math.max(...data.map((d) => d.corpus), 1) * 1.1;
  const x = (i) => padL + (i / (N - 1)) * plotW;
  const y = (v) => padT + plotH - (v / yMax) * plotH;

  const corpusLine = data.map((d, i) => `${x(i)},${y(d.corpus)}`).join(" ");
  const investedLine = data.map((d, i) => `${x(i)},${y(d.invested)}`).join(" ");
  // Area between the two lines = returns.
  const areaPath =
    data.map((d, i) => `${x(i)},${y(d.corpus)}`).join(" ") + " " +
    data.map((d, i) => `${x(i)},${y(d.invested)}`).reverse().join(" ");

  const labelStep = Math.max(1, Math.round((N - 1) / 6));
  const labelIdx = [];
  for (let i = 0; i < N; i += labelStep) labelIdx.push(i);
  if (labelIdx[labelIdx.length - 1] !== N - 1) labelIdx.push(N - 1);

  function move(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    let i = Math.round(((vbX - padL) / plotW) * (N - 1));
    setHover(Math.max(0, Math.min(N - 1, i)));
  }

  return (
    <div className="trend-chart">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
           role="img" aria-label="Year-wise wealth growth"
           onMouseMove={move} onMouseLeave={() => setHover(null)}>
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth="1" />
        <polygon points={areaPath} fill="var(--income-dim)" stroke="none" />
        <polyline points={investedLine} fill="none" stroke="var(--text-muted)" strokeWidth="1.75"
                  strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={corpusLine} fill="none" stroke="var(--income)" strokeWidth="2.25"
                  strokeLinejoin="round" strokeLinecap="round" />

        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="inherit">
            Y{data[i].year}
          </text>
        ))}

        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + plotH}
                  stroke="var(--border-glass)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].corpus)} r="4" fill="var(--income)" stroke="var(--bg2)" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(data[hover].invested)} r="3.5" fill="var(--text-muted)" stroke="var(--bg2)" strokeWidth="2" />
            <text x={Math.min(Math.max(x(hover), 54), W - 54)} y={padT + 1} textAnchor="middle"
                  fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="inherit">
              {formatAmount(data[hover].corpus, currency)}
            </text>
            <text x={Math.min(Math.max(x(hover), 54), W - 54)} y={padT + 13} textAnchor="middle"
                  fontSize="8.5" fill="var(--text-muted)" fontFamily="inherit">
              Year {data[hover].year} · invested {formatAmount(data[hover].invested, currency)}
            </text>
          </g>
        )}
      </svg>
      <div className="trend-legend">
        <span className="trend-legend-item"><span className="trend-swatch" style={{ background: "var(--income)" }} /> Corpus</span>
        <span className="trend-legend-item"><span className="trend-swatch trend-swatch-dashed" style={{ borderTopColor: "var(--text-muted)" }} /> Invested</span>
        <span className="trend-legend-item"><span className="trend-swatch" style={{ background: "var(--income-dim)" }} /> Returns</span>
      </div>
    </div>
  );
}
