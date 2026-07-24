import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { CurrencyProvider } from "./CurrencyContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import Sidebar from "./components/Sidebar";

function PrivateApp({ username, onLogout }) {
  const dashRef = useRef(null);

  return (
    <div className="app-shell">
      <Sidebar username={username} onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route
            path="/dashboard"
            element={<DashboardPage ref={dashRef} username={username} />}
          />
          <Route
            path="/transactions"
            element={
              <TransactionsPage
                username={username}
                onTransactionAdded={() => dashRef.current?.refresh()}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState(
    () => sessionStorage.getItem("ft_user") || null
  );

  function handleLogin(user) {
    sessionStorage.setItem("ft_user", user);
    setUsername(user);
  }

  function handleLogout() {
    sessionStorage.removeItem("ft_user");
    setUsername(null);
  }

  return (
    <CurrencyProvider>
      <BrowserRouter>
        {username ? (
          <PrivateApp username={username} onLogout={handleLogout} />
        ) : (
          <Routes>
            <Route path="*" element={<AuthPage onLogin={handleLogin} />} />
          </Routes>
        )}
      </BrowserRouter>
    </CurrencyProvider>
  );
}
