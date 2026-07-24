import { useMemo } from "react";
import Select from "../Select";
import { fundOptions, getFund, FUND_DISCLAIMER } from "../../finance/funds";
import {
  holdingFromFund, holdingsFromProfile, blendedReturnFromHoldings,
  totalWeight, normalizeHoldings, RISK_PROFILES,
} from "../../finance/allocation";

const MAX_HOLDINGS = 12;

/**
 * Customisable portfolio allocation. Users pick specific NSE/BSE funds (each
 * carrying its own return), set weights, and tune returns. Emits the full
 * holdings array on every change so projections update live.
 * @param {{holdings:Array, onChange:(h:Array)=>void, riskProfile:string}} props
 */
export default function AllocationEditor({ holdings, onChange, riskProfile }) {
  const total = totalWeight(holdings);
  const blended = blendedReturnFromHoldings(holdings);
  const normalized = Math.abs(total - 100) < 0.5;

  // Fund picker options, excluding funds already in the portfolio.
  const options = useMemo(() => {
    const present = new Set(holdings.map((h) => h.id));
    return fundOptions().filter((o) => !present.has(o.value));
  }, [holdings]);

  const update = (i, patch) =>
    onChange(holdings.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  const remove = (i) => onChange(holdings.filter((_, idx) => idx !== i));

  const addFund = (fundId) => {
    const fund = getFund(fundId);
    if (!fund || holdings.length >= MAX_HOLDINGS) return;
    onChange([...holdings, holdingFromFund(fund, 0)]);
  };

  return (
    <div className="alloc-editor">
      <div className="alloc-editor-head">
        <div className="alloc-summary">
          <span className={`alloc-total ${normalized ? "" : "alloc-total-off"}`}>
            {total.toFixed(0)}% allocated
          </span>
          <span className="alloc-blended">≈ {(blended * 100).toFixed(1)}% blended return</span>
        </div>
        <div className="alloc-head-actions">
          {!normalized && total > 0 && (
            <button className="btn-tiny" onClick={() => onChange(normalizeHoldings(holdings))}>
              Normalize to 100%
            </button>
          )}
          <button className="btn-tiny" onClick={() => onChange(holdingsFromProfile(riskProfile))}>
            Reset to {RISK_PROFILES[riskProfile]?.label || riskProfile}
          </button>
        </div>
      </div>

      <div className="alloc-rows">
        {holdings.length === 0 && (
          <p className="muted text-xs" style={{ padding: "6px 0" }}>
            No holdings yet — add a fund below or reset to a template.
          </p>
        )}
        {holdings.map((h, i) => (
          <div className="alloc-row" key={h.id}>
            <div className="alloc-row-info">
              <div className="alloc-name-line">
                <span className="alloc-name" title={h.label}>{h.label}</span>
                {h.exchange && <span className="alloc-exch">{h.exchange}</span>}
              </div>
              <span className="alloc-asset-tag">{h.asset}</span>
            </div>
            <div className="alloc-inputs">
              <label className="alloc-input-group">
                <span>Weight</span>
                <span className="alloc-input-wrap">
                  <input type="number" min="0" max="100" step="1" value={h.weight}
                         onChange={(e) => update(i, { weight: e.target.value === "" ? 0 : parseFloat(e.target.value) })} />
                  <span className="alloc-suffix">%</span>
                </span>
              </label>
              <label className="alloc-input-group">
                <span>Return</span>
                <span className="alloc-input-wrap">
                  <input type="number" min="0" max="40" step="0.5"
                         value={+(h.annualReturn * 100).toFixed(2)}
                         onChange={(e) => update(i, { annualReturn: (e.target.value === "" ? 0 : parseFloat(e.target.value)) / 100 })} />
                  <span className="alloc-suffix">%</span>
                </span>
              </label>
              <button className="alloc-remove" onClick={() => remove(i)} aria-label={`Remove ${h.label}`}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {holdings.length < MAX_HOLDINGS && (
        <div className="alloc-add">
          <Select
            value=""
            onChange={addFund}
            options={options}
            placeholder="+ Add a fund (NSE / BSE)…"
            minWidth={300}
          />
        </div>
      )}

      <p className="alloc-disclaimer muted">{FUND_DISCLAIMER}</p>
    </div>
  );
}
