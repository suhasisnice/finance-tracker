const BASE = "http://127.0.0.1:8000";

/**
 * Parse a non-2xx error response into a readable string.
 * `detail` can be a string (400/401) or an array of objects (422).
 */
async function parseError(res) {
  let detail = "Request failed";
  try {
    const body = await res.json();
    if (typeof body.detail === "string") {
      detail = body.detail;
    } else if (Array.isArray(body.detail)) {
      detail = body.detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
    }
  } catch (_) {
    detail = res.statusText || detail;
  }
  const err = new Error(detail);
  err.status = res.status;
  return err;
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (username, password) =>
  request("POST", "/users", { username, password });

export const loginUser = (username, password) =>
  request("POST", "/login", { username, password });

// ── Transactions ──────────────────────────────────────────────────────────────
export const addTransaction = (payload) =>
  request("POST", "/transactions", payload);

export const getTransactions = (username) =>
  request("GET", `/transactions?username=${encodeURIComponent(username)}`);

// ── Balance ───────────────────────────────────────────────────────────────────
export const getBalance = (username) =>
  request("GET", `/balance?username=${encodeURIComponent(username)}`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const getMonthlyReport = (username, month, year) =>
  request(
    "GET",
    `/monthly-report?username=${encodeURIComponent(username)}&month=${month}&year=${year}`
  );

export const getCategorySummary = (username, month, year) => {
  let url = `/category-summary?username=${encodeURIComponent(username)}`;
  if (month != null) url += `&month=${month}&year=${year}`;
  return request("GET", url);
};

export const getInsights = (username, month, year) =>
  request(
    "GET",
    `/insights?username=${encodeURIComponent(username)}&month=${month}&year=${year}`
  );
