// Intelligent investment suggestions derived from the user's OWN cashflow.
// Pure: takes monthly aggregates (computed from existing transactions) and
// returns ratios, a recommended monthly investment, an opportunity-cost
// projection, and human-readable tips. No UI, no fetching.

import { sipFutureValue } from "./calculators.js";

const num = (v, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);

/**
 * Reduce a user's raw transactions into the monthly averages analyzeFinances
 * expects. Investment outflow is identified by category (default "Investments").
 * Monthly figures are totals divided by the number of distinct months observed.
 * @param {Array<{amount:number,t_type:string,category:string,t_date:string}>} transactions
 */
export function deriveMonthlyAggregates(transactions, investmentCategory = "Investments") {
  const txns = transactions || [];
  const months = new Set();
  let income = 0, expense = 0, investment = 0;

  for (const t of txns) {
    months.add((t.t_date || "").slice(0, 7));
    if (t.t_type === "income") income += num(t.amount);
    else if (t.t_type === "expense") {
      expense += num(t.amount);
      if ((t.category || "").toLowerCase() === investmentCategory.toLowerCase()) {
        investment += num(t.amount);
      }
    }
  }

  const n = Math.max(1, months.size);
  return {
    monthlyIncome: income / n,
    monthlyExpense: expense / n,
    monthlyInvestment: investment / n,
    existingInvestmentValue: investment,
    monthsObserved: months.size,
  };
}

// Rules of thumb used for the recommendation. Tunable in one place.
const TARGET_INVEST_RATIO = 0.20;   // aim to invest 20% of income
const SURPLUS_INVEST_SHARE = 0.60;  // ...or 60% of surplus, whichever is lower
const OPP_COST_YEARS = 10;
const OPP_COST_RETURN = 0.11;       // moderate blended return for the illustration

/**
 * @param {{monthlyIncome:number, monthlyExpense:number,
 *          monthlyInvestment?:number, existingInvestmentValue?:number}} input
 */
export function analyzeFinances(input) {
  const monthlyIncome = num(input.monthlyIncome);
  const monthlyExpense = num(input.monthlyExpense);
  const monthlyInvestment = num(input.monthlyInvestment);
  const existingInvestmentValue = num(input.existingInvestmentValue);

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRatio = monthlyIncome > 0 ? monthlySurplus / monthlyIncome : 0;
  const investmentRatio = monthlyIncome > 0 ? monthlyInvestment / monthlyIncome : 0;

  const recommendedMonthlyInvestment = Math.round(
    Math.min(monthlyIncome * TARGET_INVEST_RATIO, monthlySurplus * SURPLUS_INVEST_SHARE)
  );

  // Opportunity cost: the extra you *could* invest beyond what you already do.
  const extraMonthly = Math.max(0, recommendedMonthlyInvestment - monthlyInvestment);
  const opportunityCost = {
    extraMonthly,
    years: OPP_COST_YEARS,
    rate: OPP_COST_RETURN,
    projected: sipFutureValue(extraMonthly, OPP_COST_RETURN, OPP_COST_YEARS * 12),
  };

  return {
    monthlyIncome,
    monthlyExpense,
    monthlySurplus,
    monthlyInvestment,
    existingInvestmentValue,
    savingsRatio,
    investmentRatio,
    recommendedMonthlyInvestment,
    opportunityCost,
    suggestions: buildSuggestions({
      monthlyIncome, monthlySurplus, savingsRatio, investmentRatio,
      recommendedMonthlyInvestment, monthlyInvestment, opportunityCost,
    }),
  };
}

function buildSuggestions(s) {
  const tips = [];

  if (s.monthlyIncome <= 0) {
    tips.push({ level: "info", title: "Add income", message: "Record your income so the planner can tailor recommendations to your cashflow." });
    return tips;
  }

  if (s.savingsRatio < 0.1) {
    tips.push({ level: "warning", title: "Low savings rate",
      message: `You're saving ${(s.savingsRatio * 100).toFixed(0)}% of income. Trim discretionary spend to free up money to invest.` });
  } else if (s.savingsRatio >= 0.3) {
    tips.push({ level: "good", title: "Strong savings rate",
      message: `You save ${(s.savingsRatio * 100).toFixed(0)}% of income — a great base to invest from.` });
  }

  if (s.investmentRatio < TARGET_INVEST_RATIO && s.recommendedMonthlyInvestment > s.monthlyInvestment) {
    tips.push({ level: "info", title: "Invest more of your surplus",
      message: `You currently invest ${(s.investmentRatio * 100).toFixed(0)}% of income. Consider ~₹${s.recommendedMonthlyInvestment.toLocaleString("en-IN")}/mo to reach a ${TARGET_INVEST_RATIO * 100}% target.` });
  } else if (s.investmentRatio >= TARGET_INVEST_RATIO) {
    tips.push({ level: "good", title: "On-target investing",
      message: `You already invest ${(s.investmentRatio * 100).toFixed(0)}% of income — keep it up.` });
  }

  if (s.opportunityCost.extraMonthly > 0) {
    tips.push({ level: "info", title: "Opportunity cost of idle cash",
      message: `Investing ₹${s.opportunityCost.extraMonthly.toLocaleString("en-IN")}/mo more could grow to ₹${Math.round(s.opportunityCost.projected).toLocaleString("en-IN")} over ${s.opportunityCost.years} years at ${(s.opportunityCost.rate * 100).toFixed(0)}%.` });
  }

  if (!tips.length) {
    tips.push({ level: "good", title: "Looking healthy", message: "Your cashflow and investing balance look solid." });
  }
  return tips;
}
