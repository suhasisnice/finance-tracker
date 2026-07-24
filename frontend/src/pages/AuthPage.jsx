import { useState } from "react";
import { loginUser, registerUser } from "../api";

export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchTab(t) {
    setTab(t);
    setError("");
    setSuccess("");
    setUsername("");
    setPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await loginUser(username, password);
        onLogin(res.username);
      } else {
        await registerUser(username, password);
        setSuccess("Account created. You can now sign in.");
        switchTab("login");
        setUsername(username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          {/* Large speech-bubble logo — logo.png */}
          <img src="/logo.png" alt="GrowX" className="auth-logo-img" />
          <span className="auth-logo-text">GrowX</span>
        </div>

        <h1 className="auth-heading">{tab === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="auth-sub">
          {tab === "login"
            ? "Sign in to your account to continue."
            : "Start tracking your finances today."}
        </p>

        <div className="tab-bar">
          <button className={`tab-btn ${tab === "login" ? "active" : ""}`} onClick={() => switchTab("login")}>
            Sign in
          </button>
          <button className={`tab-btn ${tab === "signup" ? "active" : ""}`} onClick={() => switchTab("signup")}>
            Register
          </button>
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={tab === "signup" ? "Min 4 characters" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? <><span className="spinner" />{tab === "login" ? "Signing in…" : "Creating account…"}</>
              : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="demo-hint">
          Demo account — <code>testuser</code> / <code>test1234</code>
        </p>
      </div>
    </div>
  );
}
