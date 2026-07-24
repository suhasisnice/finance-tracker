import { useState } from "react";
import Select from "../Select";
import { RISK_PROFILE_OPTIONS } from "../../finance/allocation";

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const MODES = [
  { value: "sip", label: "Monthly SIP" },
  { value: "lumpsum", label: "Lump Sum" },
  { value: "hybrid", label: "Hybrid" },
];

const EMPTY = {
  name: "", target_amount: "", duration_months: "", risk_profile: "moderate",
  priority: "medium", mode: "sip", monthly_sip: "", lumpsum_amount: "",
  step_up_pct: "", notes: "",
};

/** Create/edit form for an investment goal. `initial` = goal to edit, or null. */
export default function GoalForm({ initial, onSubmit, onCancel, submitting }) {
  const [f, setF] = useState(() =>
    initial ? { ...EMPTY, ...initial, target_amount: initial.target_amount ?? "" } : { ...EMPTY }
  );
  const [error, setError] = useState("");

  const set = (k) => (v) => setF((prev) => ({ ...prev, [k]: v }));
  const setInput = (k) => (e) => set(k)(e.target.value);

  const showSip = f.mode === "sip" || f.mode === "hybrid";
  const showLump = f.mode === "lumpsum" || f.mode === "hybrid";

  function submit(e) {
    e.preventDefault();
    setError("");

    const name = f.name.trim();
    const target = parseFloat(f.target_amount);
    const duration = parseInt(f.duration_months, 10);
    const sip = parseFloat(f.monthly_sip) || 0;
    const lump = parseFloat(f.lumpsum_amount) || 0;
    const step = parseFloat(f.step_up_pct) || 0;

    if (!name) return setError("Give your goal a name.");
    if (!(target > 0)) return setError("Target amount must be greater than zero.");
    if (!(duration > 0)) return setError("Duration must be at least one month.");
    if (showSip && !(sip > 0)) return setError("Enter a monthly SIP amount for this mode.");
    if (showLump && !(lump > 0)) return setError("Enter a lump-sum amount for this mode.");

    onSubmit({
      name,
      target_amount: target,
      duration_months: duration,
      risk_profile: f.risk_profile,
      priority: f.priority,
      mode: f.mode,
      monthly_sip: showSip ? sip : 0,
      lumpsum_amount: showLump ? lump : 0,
      step_up_pct: showSip ? step : 0,
      notes: f.notes.trim() || null,
    });
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="error-msg">{error}</div>}

      <div className="goal-form-grid">
        <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
          <label htmlFor="goal-name">Goal name</label>
          <input id="goal-name" type="text" placeholder="e.g. Retirement, Home down payment"
                 value={f.name} onChange={setInput("name")} required />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="goal-target">Target amount (INR)</label>
          <input id="goal-target" type="number" min="1" step="1000" placeholder="10,00,000"
                 value={f.target_amount} onChange={setInput("target_amount")} required />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="goal-duration">Duration (months)</label>
          <input id="goal-duration" type="number" min="1" max="1200" step="1" placeholder="120"
                 value={f.duration_months} onChange={setInput("duration_months")} required />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Risk profile</label>
          <Select value={f.risk_profile} onChange={set("risk_profile")} options={RISK_PROFILE_OPTIONS} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Priority</label>
          <Select value={f.priority} onChange={set("priority")} options={PRIORITY_OPTIONS} />
        </div>

        <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
          <label>Investment mode</label>
          <div className="type-toggle">
            {MODES.map((m) => (
              <button type="button" key={m.value}
                className={`type-btn ${f.mode === m.value ? "mode-active" : ""}`}
                onClick={() => set("mode")(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {showSip && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-sip">Monthly SIP (INR)</label>
            <input id="goal-sip" type="number" min="0" step="500" placeholder="15,000"
                   value={f.monthly_sip} onChange={setInput("monthly_sip")} />
          </div>
        )}

        {showSip && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-step">Annual step-up (%)</label>
            <input id="goal-step" type="number" min="0" max="100" step="1" placeholder="0"
                   value={f.step_up_pct} onChange={setInput("step_up_pct")} />
          </div>
        )}

        {showLump && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="goal-lump">Lump sum (INR)</label>
            <input id="goal-lump" type="number" min="0" step="1000" placeholder="2,00,000"
                   value={f.lumpsum_amount} onChange={setInput("lumpsum_amount")} />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
          <label htmlFor="goal-notes">Notes (optional)</label>
          <input id="goal-notes" type="text" placeholder="Any context for this goal"
                 value={f.notes || ""} onChange={setInput("notes")} />
        </div>
      </div>

      <div className="goal-form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <><span className="spinner" /> Saving…</> : initial?.g_id ? "Save changes" : "Create goal"}
        </button>
      </div>
    </form>
  );
}
