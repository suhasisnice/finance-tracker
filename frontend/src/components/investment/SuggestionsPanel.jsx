import { useEffect, useState, useMemo } from "react";
import { getTransactions } from "../../api";
import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";
import { analyzeFinances, deriveMonthlyAggregates } from "../../finance/suggestions";

function CapacitySkeleton() {
  return (
    <div className="card">
      <div className="skeleton-line" style={{ width: "40%", height: 14 }} />
      <div className="skeleton-line" style={{ width: "100%", height: 60, marginTop: 16 }} />
    </div>
  );
}

/**
 * User-level "investing capacity" derived from the user's OWN transactions:
 * savings/investment ratios, a recommended monthly investment, opportunity
 * cost, and tips. Independent of any single goal.
 */
export default function SuggestionsPanel({ username, onUseRecommended }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  const [txns, setTxns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTransactions(username)
      .then((d) => { if (alive) setTxns(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [username]);

  const analysis = useMemo(() => {
    if (!txns) return null;
    return analyzeFinances(deriveMonthlyAggregates(txns));
  }, [txns]);

  if (loading) return <CapacitySkeleton />;
  if (error) return <div className="error-msg">{error}</div>;
  if (!analysis || analysis.monthlyIncome <= 0) {
    return (
      <div className="card">
        <div className="panel-heading" style={{ marginBottom: 8 }}>Your investing capacity</div>
        <p className="muted text-sm">Add income and expense transactions to get tailored investment suggestions.</p>
      </div>
    );
  }

  const a = analysis;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="section-header" style={{ marginBottom: 14 }}>
        <span className="panel-heading">Your investing capacity</span>
        <span className="muted text-xs">from your income &amp; spending</span>
      </div>

      <div className="capacity-grid">
        <div className="capacity-stat">
          <div className="card-label">Monthly income</div>
          <div className="capacity-val mono">{fmt(a.monthlyIncome)}</div>
        </div>
        <div className="capacity-stat">
          <div className="card-label">Monthly surplus</div>
          <div className="capacity-val mono income-val">{fmt(a.monthlySurplus)}</div>
        </div>
        <div className="capacity-stat">
          <div className="card-label">Savings ratio</div>
          <div className="capacity-val mono">{(a.savingsRatio * 100).toFixed(0)}%</div>
        </div>
        <div className="capacity-stat">
          <div className="card-label">Investment ratio</div>
          <div className="capacity-val mono">{(a.investmentRatio * 100).toFixed(0)}%</div>
        </div>
        <div className="capacity-stat capacity-highlight">
          <div className="card-label">Recommended / month</div>
          <div className="capacity-val mono primary-val">{fmt(a.recommendedMonthlyInvestment)}</div>
          {onUseRecommended && a.recommendedMonthlyInvestment > 0 && (
            <button className="capacity-use-btn" onClick={() => onUseRecommended(a.recommendedMonthlyInvestment)}>
              Use in new goal
            </button>
          )}
        </div>
      </div>

      {a.suggestions.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {a.suggestions.map((s, i) => (
            <div className={`alert-banner alert-${s.level}`} key={i}>
              <span className="alert-dot" />
              <span><strong>{s.title}.</strong> {s.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
