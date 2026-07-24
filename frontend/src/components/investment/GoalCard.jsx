import { useCurrency } from "../../CurrencyContext";
import { formatCompactAmount } from "../../currency";
import { projectGoal, goalProgress } from "../../finance/calculators";
import {
  blendedReturn, blendedReturnFromHoldings, RISK_PROFILES,
} from "../../finance/allocation";

const MODE_LABEL = { sip: "Monthly SIP", lumpsum: "Lump Sum", hybrid: "Hybrid" };

export default function GoalCard({ goal, selected, onSelect, onEdit, onDelete }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatCompactAmount(v, currency);

  // Use the goal's saved custom allocation if present, else the profile template.
  const rate = goal.allocation && goal.allocation.length
    ? blendedReturnFromHoldings(goal.allocation)
    : blendedReturn(goal.risk_profile);
  const { corpus } = projectGoal(goal, rate);
  const progress = goalProgress(corpus, goal.target_amount);
  const onTrack = corpus >= goal.target_amount;

  const years = Math.round((goal.duration_months / 12) * 10) / 10;

  return (
    <div
      className={`card goal-card ${selected ? "goal-card-selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      aria-pressed={selected}
    >
      <div className="goal-card-head">
        <div className="goal-card-title-wrap">
          <span className="goal-card-title">{goal.name}</span>
          <span className={`goal-priority goal-priority-${goal.priority}`}>{goal.priority}</span>
        </div>
        <div className="goal-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="goal-icon-btn" title="Edit goal" onClick={onEdit} aria-label="Edit goal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11.5 2.5l2 2L6 12l-3 1 1-3 7.5-7.5z" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="goal-icon-btn goal-icon-danger" title="Delete goal" onClick={onDelete} aria-label="Delete goal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5L11 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="goal-card-meta">
        <span className="goal-tag">{RISK_PROFILES[goal.risk_profile]?.label || goal.risk_profile}</span>
        <span className="goal-tag">{MODE_LABEL[goal.mode]}</span>
        <span className="goal-tag">{years} yr{years !== 1 ? "s" : ""}</span>
      </div>

      <div className="goal-card-figures">
        <div>
          <div className="card-label">Target</div>
          <div className="goal-fig mono">{fmt(goal.target_amount)}</div>
        </div>
        <div>
          <div className="card-label">Projected</div>
          <div className={`goal-fig mono ${onTrack ? "income-val" : "expense-val"}`}>{fmt(corpus)}</div>
        </div>
      </div>

      <div className="goal-progress-wrap">
        <div className="goal-progress-bar-bg">
          <div className={`goal-progress-bar-fill ${onTrack ? "bar-ok" : "bar-warn"}`}
               style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <div className="goal-progress-meta">
          <span className="muted text-xs">{progress.toFixed(0)}% of target</span>
          <span className={`text-xs ${onTrack ? "income-val" : "expense-val"}`}>
            {onTrack ? "On track" : "Shortfall"}
          </span>
        </div>
      </div>
    </div>
  );
}
