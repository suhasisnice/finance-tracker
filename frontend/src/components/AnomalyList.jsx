// Flagged-transaction list from the anomaly detector. Each row shows the txn and
// the plain-language reason it was flagged. This is a status signal, so it pairs
// a warning colour with an icon + label, never colour alone.

import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";

export default function AnomalyList({ anomalies }) {
  const { currency } = useCurrency();

  if (!anomalies) return <p className="muted text-sm">Loading…</p>;

  if (anomalies.length === 0) {
    return (
      <div className="anomaly-empty">
        <span className="anomaly-ok-dot" aria-hidden="true" />
        No unusual transactions detected — spending sits within the normal range for every category.
      </div>
    );
  }

  return (
    <div className="anomaly-list">
      {anomalies.map((a) => (
        <div className="anomaly-item" key={a.t_id ?? `${a.category}-${a.t_date}-${a.amount}`}>
          <span className="anomaly-flag" aria-hidden="true">!</span>
          <div className="anomaly-body">
            <div className="anomaly-top">
              <span className="anomaly-amount mono">{formatAmount(a.amount, currency)}</span>
              <span className="badge badge-expense">{a.category}</span>
              <span className="muted text-xs mono">{a.t_date}</span>
              {a.z_score != null && <span className="anomaly-z">{a.z_score.toFixed(1)}σ</span>}
            </div>
            {a.description && <div className="anomaly-desc">{a.description}</div>}
            <div className="anomaly-reason">{a.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
