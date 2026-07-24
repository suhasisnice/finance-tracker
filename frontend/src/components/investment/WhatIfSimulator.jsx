import { useCurrency } from "../../CurrencyContext";
import { formatAmount } from "../../currency";
import Select from "../Select";
import { RISK_PROFILE_OPTIONS } from "../../finance/allocation";

const MODES = [
  { value: "sip", label: "Monthly SIP" },
  { value: "lumpsum", label: "Lump Sum" },
  { value: "hybrid", label: "Hybrid" },
];

/** A synced range slider + numeric input. Dynamic max so the slider always
 *  reaches the current value even if typed beyond the base max. */
function SimSlider({ label, value, onChange, min, max, step, format }) {
  const dynamicMax = Math.max(max, value || 0);
  return (
    <div className="sim-field">
      <div className="sim-field-head">
        <label>{label}</label>
        <span className="sim-value mono">{format ? format(value) : value}</span>
      </div>
      <div className="sim-slider-row">
        <input
          type="range" min={min} max={dynamicMax} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label={label}
        />
        <input
          type="number" min={min} step={step} value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
          className="sim-number"
          aria-label={`${label} exact value`}
        />
      </div>
    </div>
  );
}

/**
 * @param {{sim:object, onChange:(field:string,value:any)=>void,
 *          expectedReturn:number, inflation:number}} props
 */
export default function WhatIfSimulator({ sim, onChange, expectedReturn, inflation }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);

  const showSip = sim.mode === "sip" || sim.mode === "hybrid";
  const showLump = sim.mode === "lumpsum" || sim.mode === "hybrid";

  return (
    <div className="card whatif-card">
      <div className="section-header" style={{ marginBottom: 6 }}>
        <span className="panel-heading">What-If simulator</span>
        <div className="whatif-derived">
          <span className="whatif-pill">≈ {(expectedReturn * 100).toFixed(1)}% p.a. return</span>
          <span className="whatif-pill whatif-pill-muted">{(inflation * 100).toFixed(0)}% inflation</span>
        </div>
      </div>
      <p className="muted text-xs" style={{ marginBottom: 16 }}>
        Drag any input — every projection, scenario, and chart updates instantly.
      </p>

      <div className="sim-field" style={{ marginBottom: 16 }}>
        <div className="sim-field-head"><label>Investment mode</label></div>
        <div className="type-toggle">
          {MODES.map((m) => (
            <button type="button" key={m.value}
              className={`type-btn ${sim.mode === m.value ? "mode-active" : ""}`}
              onClick={() => onChange("mode", m.value)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-grid">
        {showSip && (
          <SimSlider label="Monthly SIP" value={sim.monthly_sip}
                     onChange={(v) => onChange("monthly_sip", v)}
                     min={0} max={200000} step={500} format={fmt} />
        )}
        {showSip && (
          <SimSlider label="Annual step-up" value={sim.step_up_pct}
                     onChange={(v) => onChange("step_up_pct", v)}
                     min={0} max={25} step={1} format={(v) => `${v}%`} />
        )}
        {showLump && (
          <SimSlider label="Lump sum" value={sim.lumpsum_amount}
                     onChange={(v) => onChange("lumpsum_amount", v)}
                     min={0} max={5000000} step={5000} format={fmt} />
        )}
        <SimSlider label="Duration (months)" value={sim.duration_months}
                   onChange={(v) => onChange("duration_months", Math.max(1, Math.round(v)))}
                   min={1} max={480} step={1}
                   format={(v) => `${v} mo · ${(v / 12).toFixed(1)} yr`} />

        <div className="sim-field">
          <div className="sim-field-head"><label>Risk profile</label></div>
          <Select value={sim.risk_profile} onChange={(v) => onChange("risk_profile", v)}
                  options={RISK_PROFILE_OPTIONS} />
        </div>
      </div>
    </div>
  );
}
