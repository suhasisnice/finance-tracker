import { useState } from "react";
import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";
import { sipFutureValue, stepUpSipFutureValue } from "../../finance/calculators";

const STEP_OPTIONS = [0, 5, 10, 15];

/**
 * Compares a flat SIP against annually-stepped-up SIPs at several increase
 * rates, so the impact of raising your SIP each year is explicit.
 * @param {{monthlySip:number, rate:number, months:number, currentStepUp:number}} props
 */
export default function StepUpCompare({ monthlySip, rate, months, currentStepUp }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  // Include the goal's own step-up if it isn't already in the preset list.
  const steps = STEP_OPTIONS.includes(currentStepUp)
    ? STEP_OPTIONS
    : [...STEP_OPTIONS, currentStepUp].sort((a, b) => a - b);

  const rows = steps.map((pct) => {
    if (pct === 0) {
      const corpus = sipFutureValue(monthlySip, rate, months);
      return { pct, corpus, invested: monthlySip * months };
    }
    const { corpus, invested } = stepUpSipFutureValue(monthlySip, rate, months, pct);
    return { pct, corpus, invested };
  });

  const flat = rows[0].corpus || 1;
  const max = Math.max(...rows.map((r) => r.corpus)) || 1;
  const [hover, setHover] = useState(null);

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 4 }}>Annual SIP increase</div>
      <p className="muted text-xs" style={{ marginBottom: 14 }}>
        Raising your {fmt(monthlySip)}/mo SIP each year compounds hard. Extra vs a flat SIP:
      </p>
      <div className="stepup-list">
        {rows.map((r) => {
          const extra = r.corpus - flat;
          const isCurrent = r.pct === currentStepUp;
          return (
            <div className={`stepup-row ${isCurrent ? "stepup-current" : ""}`} key={r.pct}
                 onMouseEnter={() => setHover(r.pct)} onMouseLeave={() => setHover(null)}>
              <div className="stepup-label">
                {r.pct === 0 ? "Flat" : `+${r.pct}%/yr`}
                {isCurrent && <span className="stepup-badge">current</span>}
              </div>
              <div className="stepup-bar-track">
                <div className="stepup-bar-fill" style={{ width: `${(r.corpus / max) * 100}%` }} />
              </div>
              <div className="stepup-figs">
                <span className="mono">{fmt(r.corpus)}</span>
                {r.pct !== 0 && (
                  <span className="stepup-extra income-val mono">+{fmt(extra)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hover != null && hover !== 0 && (
        <p className="muted text-xs" style={{ marginTop: 10 }}>
          At +{hover}%/yr you invest {fmt(rows.find((r) => r.pct === hover).invested)} in total.
        </p>
      )}
    </div>
  );
}
