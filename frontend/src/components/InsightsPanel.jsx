import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";

function AlertBanner({ level, message }) {
  return (
    <div className={`alert-banner alert-${level}`}>
      <span className="alert-dot" />
      <span>{message}</span>
    </div>
  );
}

function ProgressBar({ spent, income, reliable }) {
  if (!income || income <= 0) return null;
  const pct = Math.min((spent / income) * 100, 110);
  const displayPct = Math.min(pct, 100);
  let barClass = "bar-ok";
  if (!reliable)       barClass = "bar-muted";
  else if (spent > income) barClass = "bar-danger";
  else if (pct >= 80)  barClass = "bar-warn";

  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>Projected spend vs income</span>
        <span className="mono">{pct.toFixed(0)}%</span>
      </div>
      <div className="progress-bar-bg">
        <div className={`progress-bar-fill ${barClass}`} style={{ width: `${displayPct}%` }} />
      </div>
      {!reliable && (
        <p className="muted text-xs" style={{ marginTop: 5 }}>Too early to project accurately</p>
      )}
    </div>
  );
}

export default function InsightsPanel({ data }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);

  if (!data) return (
    <div className="card">
      <div className="panel-heading">Insights</div>
      <p className="muted text-sm">Loading…</p>
    </div>
  );

  const {
    income, spent_so_far, projected_spend,
    projected_savings, savings_rate, projection_reliable,
    top_category, vs_last_month, vs_average, alerts = [],
  } = data;

  function DeltaBadge({ pct }) {
    if (pct == null) return null;
    const cls = pct > 0 ? "delta-up" : pct < 0 ? "delta-down" : "delta-neu";
    return <span className={`delta ${cls}`}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>;
  }

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 12 }}>Insights</div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {alerts.map((a, i) => <AlertBanner key={i} level={a.level} message={a.message} />)}
        </div>
      )}

      <ProgressBar spent={projected_spend} income={income} reliable={projection_reliable} />

      <div className="insights-mini-grid">
        <div className="insight-mini-card">
          <div className="card-label">Projected savings</div>
          <div className="card-value mono"
            style={{
              fontSize: "1.1rem",
              color: !projection_reliable ? "var(--text-muted)"
                : projected_savings >= 0 ? "var(--income)" : "var(--expense)",
            }}
          >
            {projection_reliable ? fmt(projected_savings) : "—"}
          </div>
        </div>

        <div className="insight-mini-card">
          <div className="card-label">Savings rate</div>
          <div className="card-value mono"
            style={{
              fontSize: "1.1rem",
              color: !projection_reliable ? "var(--text-muted)"
                : savings_rate >= 0 ? "var(--income)" : "var(--expense)",
            }}
          >
            {projection_reliable ? `${savings_rate?.toFixed(1)}%` : "—"}
          </div>
        </div>

        <div className="insight-mini-card">
          <div className="card-label">Spent so far</div>
          <div className="card-value mono" style={{ fontSize: "1.1rem", color: "var(--expense)" }}>
            {fmt(spent_so_far)}
          </div>
        </div>

        {top_category && (
          <div className="insight-mini-card">
            <div className="card-label">Top category</div>
            <div style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text)" }}>
              {top_category.category}
            </div>
            <div className="card-sub">{fmt(top_category.amount)}</div>
          </div>
        )}
      </div>

      {(vs_last_month?.last_month_spend != null || vs_average?.avg_monthly_spend != null) && (
        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {vs_last_month?.last_month_spend != null && (
            <div className="text-xs">
              <span className="muted">vs last month </span>
              <DeltaBadge pct={vs_last_month.change_pct} />
            </div>
          )}
          {vs_average?.avg_monthly_spend != null && (
            <div className="text-xs">
              <span className="muted">vs monthly avg </span>
              <DeltaBadge pct={vs_average.change_pct} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
