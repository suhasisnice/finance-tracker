import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";
import StatCard from "../StatCard";

/**
 * Renders the headline projection figures for a goal/simulation.
 * @param {{metrics: object}} props  metrics from GoalDetail's useMemo.
 */
export default function ProjectionStats({ metrics }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  const {
    corpus, invested, returns, profitPct,
    inflationAdjusted, purchasingPowerPct, goalProgressPct,
    surplus,
  } = metrics;

  return (
    <div className="projection-grid">
      <StatCard label="Projected corpus" value={fmt(corpus)} colorClass="primary-val" glassClass="stat-card-net" />
      <StatCard label="Total invested" value={fmt(invested)} />
      <StatCard label="Estimated returns" value={fmt(returns)} colorClass="income-val" glassClass="stat-card-income" />
      <StatCard label="Profit %" value={`${profitPct >= 0 ? "+" : ""}${profitPct.toFixed(1)}%`}
                colorClass={profitPct >= 0 ? "income-val" : "expense-val"} />
      <StatCard label="Inflation-adjusted value" value={fmt(inflationAdjusted)}
                sub="in today's money" />
      <StatCard label="Purchasing power" value={`${purchasingPowerPct.toFixed(0)}%`}
                sub="of nominal corpus retained" />
      <StatCard label="Goal progress" value={`${goalProgressPct.toFixed(0)}%`}
                colorClass={goalProgressPct >= 100 ? "income-val" : undefined} />
      <StatCard label={surplus >= 0 ? "Surplus vs target" : "Shortfall vs target"}
                value={fmt(Math.abs(surplus))}
                colorClass={surplus >= 0 ? "income-val" : "expense-val"} />
    </div>
  );
}
