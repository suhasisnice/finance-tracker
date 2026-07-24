import { useEffect, useState, useCallback } from "react";
import { addTransaction, getTransactions } from "../api";
import { todayISO } from "../utils";
import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";
import Select from "../components/Select";

const PRESET_CATEGORIES = [
  "Food", "Travel", "Entertainment", "Shopping", "Bills", "Salary",
  "Health", "Education", "Fuel", "Rent", "Subscriptions", "Groceries",
  "Dining Out", "Insurance", "Investments", "Gym & Fitness", "Personal Care", "Other",
];

const CATEGORY_OPTIONS = PRESET_CATEGORIES.map((c) => ({ value: c, label: c }));

function Loader() {
  return <div className="loader"><span className="spinner" /> Loading</div>;
}

export default function TransactionsPage({ username, onTransactionAdded }) {
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);

  const [amount, setAmount]                 = useState("");
  const [tType, setTType]                   = useState("expense");
  const [category, setCategory]             = useState("Food");
  const [customCategory, setCustomCategory] = useState("");
  const [tDate, setTDate]                   = useState(todayISO());
  const [formError, setFormError]           = useState("");
  const [formSuccess, setFormSuccess]       = useState("");
  const [submitting, setSubmitting]         = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [listError, setListError]       = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const data = await getTransactions(username);
      setTransactions([...data].reverse());
    } catch (e) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(""); setFormSuccess("");

    const finalCategory = category === "Other" ? customCategory.trim() : category;
    if (!finalCategory) { setFormError("Please enter a category name."); return; }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be a positive number."); return;
    }

    setSubmitting(true);
    try {
      await addTransaction({ username, amount: parsedAmount, t_type: tType, category: finalCategory, t_date: tDate });
      setFormSuccess("Transaction recorded.");
      setAmount("");
      setTDate(todayISO());
      await fetchTransactions();
      if (onTransactionAdded) onTransactionAdded();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Transactions</h1>

      {/* ── Add form ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="panel-heading" style={{ marginBottom: 16 }}>New transaction</div>

        {formError   && <div className="error-msg">{formError}</div>}
        {formSuccess && <div className="success-msg">{formSuccess}</div>}

        <form onSubmit={handleSubmit}>
          <div className="tx-form-grid">

            {/* Amount */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="amount">Amount (INR)</label>
              <input
                id="amount" type="number" min="0.01" step="0.01"
                placeholder="0.00" value={amount}
                onChange={(e) => setAmount(e.target.value)} required
              />
            </div>

            {/* Type toggle */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <div className="type-toggle">
                <button type="button"
                  className={`type-btn ${tType === "income" ? "income-active" : ""}`}
                  onClick={() => setTType("income")}>
                  Income
                </button>
                <button type="button"
                  className={`type-btn ${tType === "expense" ? "expense-active" : ""}`}
                  onClick={() => setTType("expense")}>
                  Expense
                </button>
              </div>
            </div>

            {/* Category — custom select */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category</label>
              <Select
                value={category}
                onChange={setCategory}
                options={CATEGORY_OPTIONS}
                placeholder="Select category"
              />
            </div>

            {/* Custom category input */}
            {category === "Other" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="custom-cat">Custom category</label>
                <input
                  id="custom-cat" type="text" placeholder="e.g. Rent"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)} required
                />
              </div>
            )}

            {/* Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="t-date">Date</label>
              <input
                id="t-date" type="date" value={tDate} max={todayISO()}
                onChange={(e) => setTDate(e.target.value)} required
              />
            </div>

            {/* Submit */}
            <div className="form-group" style={{ marginBottom: 0, display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? <><span className="spinner" /> Adding…</> : "Add transaction"}
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <span className="panel-heading">All transactions</span>
          {transactions.length > 0 && (
            <span className="muted text-xs">{transactions.length} records</span>
          )}
        </div>

        {listError && <div className="error-msg">{listError}</div>}

        {loading ? <Loader /> : transactions.length === 0 ? (
          <div className="empty-state">No transactions yet. Add your first one above.</div>
        ) : (
          <div className="tx-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.t_id}>
                    <td className="mono">{tx.t_date}</td>
                    <td>{tx.category}</td>
                    <td><span className={`badge badge-${tx.t_type}`}>{tx.t_type}</span></td>
                    <td
                      className="mono"
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color: tx.t_type === "income" ? "var(--income)" : "var(--expense)",
                      }}
                    >
                      {tx.t_type === "income" ? "+" : "−"}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
