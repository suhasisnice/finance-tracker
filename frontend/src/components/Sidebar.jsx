import { NavLink } from "react-router-dom";
import { useCurrency } from "../CurrencyContext";
import Select from "./Select";

function IconDashboard() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  );
}

function IconTx() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M2 8h8M2 12h5" strokeLinecap="round"/>
      <path d="M12 10l2 2-2 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconInvest() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 5h3v3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ marginRight: 6 }}>
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" strokeLinecap="round"/>
      <path d="M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Sidebar({ username, onLogout }) {
  const { currencyCode, changeCurrency, CURRENCIES } = useCurrency();

  return (
    <aside className="sidebar">

      {/* ── Wordmark ─────────────────────────────────────────── */}
      <div className="sidebar-logo">
        {/* Small circular logo — logo-sm.png */}
        <img
          src="/logo-sm.png"
          alt="GrowX"
          className="sidebar-logo-img"
        />
        <span className="sidebar-wordmark">GrowX</span>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          <IconDashboard /> Dashboard
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => isActive ? "active" : ""}>
          <IconTx /> Transactions
        </NavLink>
        <NavLink to="/investments" className={({ isActive }) => isActive ? "active" : ""}>
          <IconInvest /> Investments
        </NavLink>
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="currency-select-wrap">
          <label htmlFor="currency-pick">Currency</label>
          <Select
            id="currency-pick"
            value={currencyCode}
            onChange={changeCurrency}
            minWidth={280}
            options={CURRENCIES.map((c) => ({
              value: c.code,
              label: `${c.symbol} ${c.code} — ${c.country}`,
            }))}
          />
        </div>

        <div className="sidebar-user">
          Signed in as <strong>{username}</strong>
        </div>

        <button className="btn-logout" onClick={onLogout}>
          <IconLogout /> Sign out
        </button>
      </div>

    </aside>
  );
}
