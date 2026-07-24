import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";

/**
 * Shows what it would take to exactly hit the target: the required monthly SIP,
 * or the required one-time lump sum, at the current expected return.
 * @param {{requiredSip:number, requiredLumpSum:number, target:number,
 *          months:number, rate:number}} props
 */
export default function ReverseCalculators({ requiredSip, requiredLumpSum, target, months, rate }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);
  const years = Math.round((months / 12) * 10) / 10;

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 4 }}>Reach your target</div>
      <p className="muted text-xs" style={{ marginBottom: 14 }}>
        To hit {fmt(target)} in {years} yr{years !== 1 ? "s" : ""} at {(rate * 100).toFixed(1)}% p.a.,
        you'd need either of these.
      </p>
      <div className="reverse-grid">
        <div className="reverse-card">
          <div className="card-label">Monthly SIP needed</div>
          <div className="reverse-value mono">{fmt(requiredSip)}</div>
          <div className="card-sub">invested every month</div>
        </div>
        <div className="reverse-card">
          <div className="card-label">Lump sum needed</div>
          <div className="reverse-value mono">{fmt(requiredLumpSum)}</div>
          <div className="card-sub">invested today, one time</div>
        </div>
      </div>
    </div>
  );
}
