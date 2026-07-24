/** Return today's date as YYYY-MM-DD. */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Return { month, year } for the current month. */
export function currentMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/** Zero-pad a number to 2 digits. */
export function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Build a "YYYY-MM" label from month+year integers. */
export function monthLabel(month, year) {
  return `${year}-${pad2(month)}`;
}

/** Legacy INR formatter — used only where currency context isn't available. */
export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}
