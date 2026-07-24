import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";

const META = {
  bear: { label: "Bear", cls: "scenario-bear", note: "Downturn" },
  base: { label: "Base", cls: "scenario-base", note: "Expected" },
  bull: { label: "Bull", cls: "scenario-bull", note: "Strong market" },
};

/**
 * @param {{scenarios: Array<{key:string, rate:number, corpus:number, profit:number}>}} props
 */
export default function ScenarioPanel({ scenarios }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  return (
    <div className="card">
      <div className="panel-heading" style={{ marginBottom: 4 }}>Scenario analysis</div>
      <p className="muted text-xs" style={{ marginBottom: 14 }}>
        How your corpus shifts if annual returns run below or above the expected rate.
      </p>
      <div className="scenario-grid">
        {scenarios.map((s) => {
          const m = META[s.key];
          return (
            <div className={`scenario-card ${m.cls}`} key={s.key}>
              <div className="scenario-head">
                <span className="scenario-label">{m.label}</span>
                <span className="scenario-rate mono">{(s.rate * 100).toFixed(1)}%</span>
              </div>
              <div className="scenario-corpus mono">{fmt(s.corpus)}</div>
              <div className="scenario-note">{m.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
