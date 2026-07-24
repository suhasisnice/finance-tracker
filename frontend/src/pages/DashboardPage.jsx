import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  getBalance, getMonthlyReport, getCategorySummary, getInsights,
  getHealthScore, getAnomalies, getForecast,
} from "../api";
import { currentMonthYear, pad2 } from "../utils";
import { useCurrency } from "../CurrencyContext";
import { formatAmount } from "../currency";
import StatCard from "../components/StatCard";
import InsightsPanel from "../components/InsightsPanel";
import DonutChart from "../components/DonutChart";
import CategoryBarChart from "../components/CategoryBarChart";
import HealthGauge from "../components/HealthGauge";
import TrendForecastChart from "../components/TrendForecastChart";
import AnomalyList from "../components/AnomalyList";
import RoadmapPanel from "../components/RoadmapPanel";

function Loader() {
  return <div className="loader"><span className="spinner" /> Loading</div>;
}

const DashboardPage = forwardRef(function DashboardPage({ username }, ref) {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const { currency } = useCurrency();
  const fmt = (v) => formatAmount(v, currency);

  const [month, setMonth] = useState(curMonth);
  const [year,  setYear]  = useState(curYear);
  const [source, setSource] = useState("sample");   // "sample" | "live"

  const [balance,  setBalance]  = useState(null);
  const [report,   setReport]   = useState(null);
  const [cats,     setCats]     = useState(null);
  const [insights, setInsights] = useState(null);
  const [health,   setHealth]   = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [forecast, setForecast] = useState(null);

  const [loadingBal,     setLoadingBal]     = useState(true);
  const [loadingReport,  setLoadingReport]  = useState(true);
  const [loadingCat,     setLoadingCat]     = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState("");

  const fetchBalance = useCallback(async () => {
    setLoadingBal(true);
    try { setBalance(await getBalance(username, source)); }
    catch (e) { setError(e.message); }
    finally   { setLoadingBal(false); }
  }, [username, source]);

  const fetchMonthData = useCallback(async (m, y) => {
    setLoadingReport(true); setLoadingCat(true); setLoadingInsight(true);
    setError("");
    const [r, c, i] = await Promise.allSettled([
      getMonthlyReport(username, m, y, source),
      getCategorySummary(username, m, y, source),
      getInsights(username, m, y),
    ]);
    if (r.status === "fulfilled") setReport(r.value); else setError(r.reason.message);
    if (c.status === "fulfilled") setCats(c.value);
    if (i.status === "fulfilled") setInsights(i.value);
    setLoadingReport(false); setLoadingCat(false); setLoadingInsight(false);
  }, [username, source]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    const [h, a, f] = await Promise.allSettled([
      getHealthScore(username, source),
      getAnomalies(username, source),
      getForecast(username, source),
    ]);
    if (h.status === "fulfilled") setHealth(h.value);
    if (a.status === "fulfilled") setAnomalies(a.value.anomalies);
    if (f.status === "fulfilled") setForecast(f.value);
    setLoadingAnalytics(false);
  }, [username, source]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);
  useEffect(() => { fetchMonthData(month, year); }, [month, year, fetchMonthData]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  useImperativeHandle(ref, () => ({
    refresh() { fetchBalance(); fetchMonthData(month, year); fetchAnalytics(); },
  }), [fetchBalance, fetchMonthData, fetchAnalytics, month, year]);

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
          <h1 className="greeting-headline">Hey, {username}</h1>
          <p className="greeting-sub">Here's how your money's looking this month.</p>
        </div>
        <div className="dashboard-controls">
          {/* Sample / Live data toggle */}
          <div className="source-toggle" role="group" aria-label="Data source">
            <button
              type="button"
              className={`source-btn ${source === "sample" ? "source-active" : ""}`}
              onClick={() => setSource("sample")}
            >
              Sample Data
            </button>
            <button
              type="button"
              className={`source-btn ${source === "live" ? "source-active" : ""}`}
              onClick={() => setSource("live")}
            >
              Live entries
            </button>
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
      </div>

      {source === "sample" && (
        <div className="sample-banner">
          <span className="sample-badge">Sample Data</span>
          Showing ~120 demo transactions. Switch to <strong>Live entries</strong> to see your own.
        </div>
      )}

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

      {/* Health score + Monthly summary */}
      <div className="dashboard-two-col">
        {loadingAnalytics ? <div className="card"><Loader /></div> : <HealthGauge data={health} />}

        {loadingReport ? (
          <div className="card"><Loader /></div>
        ) : report ? (
          <div className="card">
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="panel-heading">{report.month}</span>
              <span className="muted text-xs">{report.transactions} transaction{report.transactions !== 1 ? "s" : ""}</span>
            </div>
            <div className="stat-grid" style={{ marginBottom: 0 }}>
              <StatCard label="Income"  value={fmt(report.income)}  colorClass="income-val" />
              <StatCard label="Expense" value={fmt(report.expense)} colorClass="expense-val" />
              <StatCard label="Net" value={fmt(report.net)} colorClass={report.net >= 0 ? "income-val" : "expense-val"} />
            </div>
            <div style={{ marginTop: 16 }}>
              {loadingInsight ? <Loader /> : <InsightsPanel data={insights} />}
            </div>
          </div>
        ) : null}
      </div>

      {/* Category breakdown: pie + bar side by side */}
      <div className="dashboard-two-col">
        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Expenses by category</div>
          {loadingCat ? <Loader /> : (
            cats?.categories?.length > 0
              ? <DonutChart categories={cats.categories} />
              : <p className="muted text-sm">No expense data for this period.</p>
          )}
        </div>
        <div className="card">
          <div className="panel-heading" style={{ marginBottom: 14 }}>Category spend (ranked)</div>
          {loadingCat ? <Loader /> : <CategoryBarChart categories={cats?.categories || []} />}
        </div>
      </div>

      {/* Monthly trend + forecast */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 14 }}>
          <span className="panel-heading">Monthly spend trend & forecast</span>
          {forecast?.overall?.forecast != null && (
            <span className="muted text-xs">
              Next month projected: <span className="mono">{fmt(forecast.overall.forecast)}</span>
            </span>
          )}
        </div>
        {loadingAnalytics ? <Loader /> : <TrendForecastChart trend={forecast?.trend} />}
      </div>

      {/* Anomalies */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 14 }}>
          <span className="panel-heading">Unusual transactions</span>
          {anomalies && <span className="muted text-xs">{anomalies.length} flagged</span>}
        </div>
        {loadingAnalytics ? <Loader /> : <AnomalyList anomalies={anomalies} />}
      </div>

      {/* Roadmap */}
      <RoadmapPanel />
    </div>
  );
});

export default DashboardPage;
