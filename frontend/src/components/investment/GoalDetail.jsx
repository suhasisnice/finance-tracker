import { useState, useEffect, useMemo, useCallback } from "react";
import { updateInvestmentGoal } from "../../api";
import {
  inflationFor, holdingsFromProfile, blendedReturnFromHoldings,
} from "../../finance/allocation";
import {
  projectGoal, profit, inflationAdjust, goalProgress, reverseSip, reverseLumpSum,
  yearWiseGrowth,
} from "../../finance/calculators";
import { scenarioReturns, diversificationScore, portfolioHealthScore } from "../../finance/portfolio";
import ProjectionStats from "./ProjectionStats";
import WhatIfSimulator from "./WhatIfSimulator";
import ScenarioPanel from "./ScenarioPanel";
import ReverseCalculators from "./ReverseCalculators";
import StepUpCompare from "./StepUpCompare";
import AllocationDonut from "./AllocationDonut";
import AllocationEditor from "./AllocationEditor";
import GoalProgressRing from "./GoalProgressRing";
import WealthGrowthChart from "./WealthGrowthChart";
import InvestVsProfitBars from "./InvestVsProfitBars";
import PortfolioHealthCard from "./PortfolioHealthCard";

const SIM_FIELDS = ["mode", "monthly_sip", "lumpsum_amount", "step_up_pct", "duration_months", "risk_profile"];

/** Holdings baked into a goal, or the risk-profile template if none saved. */
function holdingsForGoal(goal) {
  return goal.allocation && goal.allocation.length
    ? goal.allocation
    : holdingsFromProfile(goal.risk_profile);
}

function simFromGoal(goal) {
  return {
    mode: goal.mode,
    monthly_sip: goal.monthly_sip,
    lumpsum_amount: goal.lumpsum_amount,
    step_up_pct: goal.step_up_pct,
    duration_months: goal.duration_months,
    risk_profile: goal.risk_profile,
    holdings: holdingsForGoal(goal),
  };
}

/** Stable key for comparing holdings (ignores label/exchange cosmetics). */
const holdingsKey = (hs) => JSON.stringify((hs || []).map((h) => [h.id, h.weight, h.annualReturn]));

export default function GoalDetail({ goal, username, onGoalUpdated }) {
  const [sim, setSim] = useState(() => simFromGoal(goal));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { setSim(simFromGoal(goal)); }, [goal]);

  const onChange = useCallback((field, value) => {
    setSim((prev) => {
      // Changing the risk profile re-seeds the allocation only if the user
      // hasn't customised it yet (holdings still match the old template).
      if (field === "risk_profile") {
        const pristine = holdingsKey(prev.holdings) === holdingsKey(holdingsFromProfile(prev.risk_profile));
        return {
          ...prev,
          risk_profile: value,
          holdings: pristine ? holdingsFromProfile(value) : prev.holdings,
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const onHoldingsChange = useCallback((holdings) => {
    setSim((prev) => ({ ...prev, holdings }));
  }, []);

  const d = useMemo(() => {
    const rate = blendedReturnFromHoldings(sim.holdings);   // returns now come from the funds
    const inflation = inflationFor(sim.risk_profile);
    const months = sim.duration_months;
    const years = months / 12;
    const target = goal.target_amount;

    const { corpus, invested } = projectGoal(sim, rate);
    const returns = corpus - invested;
    const { pct: profitPct } = profit(invested, corpus);
    const inflationAdjusted = inflationAdjust(corpus, inflation, years);
    const purchasingPowerPct = corpus > 0 ? (inflationAdjusted / corpus) * 100 : 0;
    const goalProgressPct = goalProgress(corpus, target);
    const surplus = corpus - target;

    const sr = scenarioReturns(rate);
    const scenarios = ["bear", "base", "bull"].map((key) => {
      const r = sr[key];
      const p = projectGoal(sim, r);
      return { key, rate: r, corpus: p.corpus, profit: p.corpus - p.invested };
    });

    const diversification = diversificationScore(sim.holdings.map((h) => h.weight));
    const portfolioHealth = portfolioHealthScore({ diversification, goalProgressPct, expectedReturn: rate });
    const yearWise = yearWiseGrowth(sim, rate);

    return {
      rate, inflation, months, years, target, corpus,
      metrics: { corpus, invested, returns, profitPct, inflationAdjusted, purchasingPowerPct, goalProgressPct, surplus },
      scenarios,
      requiredSip: reverseSip(target, rate, months),
      requiredLumpSum: reverseLumpSum(target, rate, months),
      diversification, portfolioHealth, yearWise, goalProgressPct,
    };
  }, [sim, goal.target_amount]);

  const isDirty =
    SIM_FIELDS.some((k) => sim[k] !== goal[k]) ||
    holdingsKey(sim.holdings) !== holdingsKey(holdingsForGoal(goal));
  const showSip = sim.mode === "sip" || sim.mode === "hybrid";

  async function handleSave() {
    setSaving(true); setSaveError("");
    try {
      await updateInvestmentGoal(goal.g_id, {
        username,
        name: goal.name,
        target_amount: goal.target_amount,
        priority: goal.priority,
        notes: goal.notes,
        mode: sim.mode,
        monthly_sip: sim.monthly_sip,
        lumpsum_amount: sim.lumpsum_amount,
        step_up_pct: sim.step_up_pct,
        duration_months: sim.duration_months,
        risk_profile: sim.risk_profile,
        allocation: sim.holdings,
      });
      await onGoalUpdated?.();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="goal-detail">
      <div className="goal-detail-head">
        <div>
          <div className="panel-heading">{goal.name} — plan</div>
          <p className="muted text-xs" style={{ marginTop: 2 }}>
            Live projections at the current inputs. Adjust the simulator or allocation, then save.
          </p>
        </div>
        {isDirty && (
          <div className="detail-actions">
            <span className="dirty-dot" aria-hidden="true" />
            <span className="muted text-xs">Unsaved changes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSim(simFromGoal(goal))} disabled={saving}>
              Reset
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : "Save to goal"}
            </button>
          </div>
        )}
      </div>

      {saveError && <div className="error-msg">{saveError}</div>}

      <WhatIfSimulator sim={sim} onChange={onChange} expectedReturn={d.rate} inflation={d.inflation} />

      <ProjectionStats metrics={d.metrics} />

      {/* Customisable allocation: donut + fund editor */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-heading" style={{ marginBottom: 14 }}>Portfolio allocation</div>
        <div className="alloc-layout">
          <div className="alloc-donut-col">
            <AllocationDonut allocation={sim.holdings} diversification={d.diversification} />
          </div>
          <div className="alloc-editor-col">
            <AllocationEditor holdings={sim.holdings} onChange={onHoldingsChange} riskProfile={sim.risk_profile} />
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Wealth growth</div>
          <WealthGrowthChart data={d.yearWise} />
        </div>
        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Year-wise: invested vs profit</div>
          <InvestVsProfitBars data={d.yearWise} />
        </div>
      </div>

      <div className="dashboard-two-col">
        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Goal progress</div>
          <GoalProgressRing progressPct={d.metrics.goalProgressPct} corpus={d.metrics.corpus} target={d.target} />
        </div>
        <PortfolioHealthCard health={d.portfolioHealth} />
      </div>

      <div className="dashboard-two-col">
        <ScenarioPanel scenarios={d.scenarios} />
        <ReverseCalculators
          requiredSip={d.requiredSip} requiredLumpSum={d.requiredLumpSum}
          target={d.target} months={d.months} rate={d.rate}
        />
      </div>

      {showSip && sim.monthly_sip > 0 && (
        <StepUpCompare monthlySip={sim.monthly_sip} rate={d.rate}
                       months={d.months} currentStepUp={sim.step_up_pct} />
      )}
    </div>
  );
}
