import { useEffect, useState, useCallback } from "react";
import {
  getInvestmentGoals, createInvestmentGoal, updateInvestmentGoal, deleteInvestmentGoal,
} from "../api";
import GoalForm from "../components/investment/GoalForm";
import GoalCard from "../components/investment/GoalCard";
import GoalDetail from "../components/investment/GoalDetail";
import SuggestionsPanel from "../components/investment/SuggestionsPanel";

function GoalCardSkeleton() {
  return (
    <div className="card goal-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line" style={{ width: "55%", height: 16 }} />
      <div className="skeleton-line" style={{ width: "40%", height: 11, marginTop: 12 }} />
      <div className="skeleton-line" style={{ width: "70%", height: 24, marginTop: 16 }} />
      <div className="skeleton-line" style={{ width: "100%", height: 8, marginTop: 18 }} />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="card investment-empty">
      <div className="empty-icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 17l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 8h4v4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="empty-title">Plan your first investment goal</h3>
      <p className="muted text-sm" style={{ maxWidth: 420, textAlign: "center" }}>
        Set a target, pick a risk profile and mode, and GrowX will project your corpus,
        returns, and progress — with a live What-If simulator and scenario analysis.
      </p>
      <button className="btn btn-primary" onClick={onCreate} style={{ marginTop: 6 }}>
        + Create a goal
      </button>
    </div>
  );
}

export default function InvestmentPlannerPage({ username }) {
  const [goals, setGoals] = useState(null);       // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);     // goal being edited (has g_id)
  const [prefill, setPrefill] = useState(null);     // partial initial for a new goal
  const [submitting, setSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getInvestmentGoals(username);
      setGoals(data.goals);
      // Keep selection valid; default to the first goal.
      setSelectedId((prev) => {
        if (prev && data.goals.some((g) => g.g_id === prev)) return prev;
        return data.goals[0]?.g_id ?? null;
      });
    } catch (e) {
      setError(e.message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function openCreate() { setEditing(null); setPrefill(null); setShowForm(true); }
  function openEdit(goal) { setEditing(goal); setPrefill(null); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setPrefill(null); }
  function useRecommended(amount) {
    setEditing(null);
    setPrefill({ monthly_sip: amount, mode: "sip" });
    setShowForm(true);
  }

  async function handleSubmit(payload) {
    setSubmitting(true); setError("");
    try {
      const body = { username, ...payload };
      const saved = editing
        ? await updateInvestmentGoal(editing.g_id, body)
        : await createInvestmentGoal(body);
      closeForm();
      await fetchGoals();
      if (saved?.g_id) setSelectedId(saved.g_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(goal) {
    if (!window.confirm(`Delete goal “${goal.name}”? This can't be undone.`)) return;
    setError("");
    try {
      await deleteInvestmentGoal(username, goal.g_id);
      await fetchGoals();
    } catch (e) {
      setError(e.message);
    }
  }

  const hasGoals = goals && goals.length > 0;
  const selectedGoal = hasGoals ? goals.find((g) => g.g_id === selectedId) : null;

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1 className="greeting-headline">Investment Planner</h1>
          <p className="greeting-sub">Turn goals into a plan — projections, scenarios, and a live simulator.</p>
        </div>
        {hasGoals && !showForm && (
          <button className="btn btn-primary" onClick={openCreate}>+ New goal</button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <SuggestionsPanel username={username} onUseRecommended={useRecommended} />

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="panel-heading" style={{ marginBottom: 16 }}>
            {editing ? "Edit goal" : "New investment goal"}
          </div>
          <GoalForm
            initial={editing || prefill}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            submitting={submitting}
          />
        </div>
      )}

      {loading ? (
        <div className="goal-grid">
          {Array.from({ length: 3 }).map((_, i) => <GoalCardSkeleton key={i} />)}
        </div>
      ) : !hasGoals && !showForm ? (
        <EmptyState onCreate={openCreate} />
      ) : hasGoals ? (
        <>
          <div className="goal-grid">
            {goals.map((g) => (
              <GoalCard
                key={g.g_id}
                goal={g}
                selected={g.g_id === selectedId}
                onSelect={() => setSelectedId(g.g_id)}
                onEdit={(e) => { e.stopPropagation(); openEdit(g); }}
                onDelete={(e) => { e.stopPropagation(); handleDelete(g); }}
              />
            ))}
          </div>

          {selectedGoal && (
            <GoalDetail
              key={selectedGoal.g_id}
              goal={selectedGoal}
              username={username}
              onGoalUpdated={fetchGoals}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
