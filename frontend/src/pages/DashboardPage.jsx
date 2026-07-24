import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { getBalance, getMonthlyReport, getCategorySummary, getInsights } from "../api";
import { currentMonthYear, pad2 } from "../utils";
import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";
import StatCard from "../components/StatCard";
import InsightsPanel from "../components/InsightsPanel";
import DonutChart from "../components/DonutChart";

function Loader() {
  return <div className="loader"><span className="spinner" /> Loading</div>;
}

const DashboardPage = forwardRef(function DashboardPage({ username }, ref) {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);

  const [month, setMonth] = useState(curMonth);
  const [year,  setYear]  = useState(curYear);

  const [balance,  setBalance]  = useState(null);
  const [report,   setReport]   = useState(null);
  const [cats,     setCats]     = useState(null);
  const [insights, setInsights] = useState(null);

  const [loadingBal,     setLoadingBal]     = useState(true);
  const [loadingReport,  setLoadingReport]  = useState(true);
  const [loadingCat,     setLoadingCat]     = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [error, setError] = useState("");

  const fetchBalance = useCallback(async () => {
    setLoadingBal(true);
    try { setBalance(await getBalance(username)); }
    catch (e) { setError(e.message); }
    finally   { setLoadingBal(false); }
  }, [username]);

  const fetchMonthData = useCallback(async (m, y) => {
    setLoadingReport(true); setLoadingCat(true); setLoadingInsight(true);
    setError("");
    const [r, c, i] = await Promise.allSettled([
      getMonthlyReport(username, m, y),
      getCategorySummary(username, m, y),
      getInsights(username, m, y),
    ]);
    if (r.status === "fulfilled") setReport(r.value); else setError(r.reason.message);
    if (c.status === "fulfilled") setCats(c.value);
    if (i.status === "fulfilled") setInsights(i.value);
    setLoadingReport(false); setLoadingCat(false); setLoadingInsight(false);
  }, [username]);

  useEffect(() => { fetchBalance(); },                    [fetchBalance]);
  useEffect(() => { fetchMonthData(month, year); }, [month, year, fetchMonthData]);

  useImperativeHandle(ref, () => ({
    refresh() { fetchBalance(); fetchMonthData(month, year); },
  }), [fetchBalance, fetchMonthData, month, year]);

  const pickerValue = `${year}-${pad2(month)}`;
  function handleMonthChange(e) {
    const [y, m] = e.target.value.split("-").map(Number);
    setYear(y); setMonth(m);
  }

  return (
    <div>
      {/* Header row */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1 className="greeting-headline">Hey, {username} 👋</h1>
          <p className="greeting-sub">Here's how your money's looking this month.</p>
        </div>
        <div className="month-picker">
          <label htmlFor="month-pick">Month</label>
          <input
            id="month-pick"
            type="month"
            value={pickerValue}
            max={`${curYear}-${pad2(curMonth)}`}
            onChange={handleMonthChange}
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* All-time balance cards */}
      <div className="stat-grid">
        {loadingBal ? <div className="card"><Loader /></div> : balance ? (
          <>
            <StatCard label="Total income"   value={fmt(balance.total_income)}   colorClass="income-val"  glassClass="stat-card-income" />
            <StatCard label="Total expenses" value={fmt(balance.total_expense)}  colorClass="expense-val" glassClass="stat-card-expense" />
            <StatCard
              label="Net balance"
              value={fmt(balance.net_balance)}
              colorClass={balance.net_balance >= 0 ? "income-val" : "expense-val"}
              glassClass="stat-card-net"
            />
          </>
        ) : null}
      </div>

      {/* Monthly summary */}
      {loadingReport ? (
        <div className="card" style={{ marginBottom: 16 }}><Loader /></div>
      ) : report ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <span className="panel-heading">{report.month}</span>
            <span className="muted text-xs">{report.transactions} transaction{report.transactions !== 1 ? "s" : ""}</span>
          </div>
          <div className="stat-grid" style={{ marginBottom: 0 }}>
            <StatCard label="Income"  value={fmt(report.income)}  colorClass="income-val" />
            <StatCard label="Expense" value={fmt(report.expense)} colorClass="expense-val" />
            <StatCard label="Net" value={fmt(report.net)} colorClass={report.net >= 0 ? "income-val" : "expense-val"} />
          </div>
        </div>
      ) : null}

      {/* Insights + Donut */}
      <div className="dashboard-two-col">
        {loadingInsight ? <div className="card"><Loader /></div> : <InsightsPanel data={insights} />}

        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Expenses by category</div>
          {loadingCat ? <Loader /> : (
            cats?.categories?.length > 0
              ? <DonutChart categories={cats.categories} />
              : <p className="muted text-sm">No expense data for this period.</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default DashboardPage;
