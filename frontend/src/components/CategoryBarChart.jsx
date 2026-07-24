// Horizontal category bar chart. Magnitude by category, one bar each, drawn in
// the same colour the donut gives that category (shared identity). Values are
// direct-labelled at the end of each bar; the axis is implied by the labels.

import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";
import { categoryColor } from "../chartPalette";

export default function CategoryBarChart({ categories }) {
  const { currency } = useCurrency();

  if (!categories || categories.length === 0) {
    return <p className="muted text-sm">No category data for this period.</p>;
  }

  const max = Math.max(...categories.map((c) => c.total)) || 1;

  return (
    <div className="bar-chart">
      {categories.map((c, i) => {
        const pct = (c.total / max) * 100;
        return (
          <div className="bar-row" key={c.category}>
            <div className="bar-label" title={c.category}>{c.category}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, background: categoryColor(i) }}
              />
              <span className="bar-value mono">{formatAmount(c.total, currency)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
