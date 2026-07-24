// Pure financial calculators — no React, no DOM, no side effects. Every export
// is a deterministic function so it can be unit-tested and memoised freely.
// Rates are annual decimals (0.12 = 12% p.a.) unless noted; corpus projections
// compound monthly for consistency between lump-sum and SIP.

/** Coerce to a finite number, else fall back. */
const num = (v, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);

/**
 * Compound Annual Growth Rate.
 * @returns {number} annual decimal rate, or 0 if inputs invalid.
 */
export function cagr(beginValue, endValue, years) {
  beginValue = num(beginValue); endValue = num(endValue); years = num(years);
  if (beginValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / beginValue, 1 / years) - 1;
}

/** Future value of a lump sum, compounded monthly over `months`. */
export function futureValue(presentValue, annualRate, months) {
  presentValue = num(presentValue); annualRate = num(annualRate); months = num(months);
  const i = annualRate / 12;
  return presentValue * Math.pow(1 + i, months);
}

/** Present value of a future amount, discounted monthly over `months`. */
export function presentValue(futureVal, annualRate, months) {
  futureVal = num(futureVal); annualRate = num(annualRate); months = num(months);
  const i = annualRate / 12;
  if (i === 0) return futureVal;
  return futureVal / Math.pow(1 + i, months);
}

/** Alias kept explicit for the lump-sum investment mode. */
export function lumpSumFutureValue(principal, annualRate, months) {
  return futureValue(principal, annualRate, months);
}

/**
 * Future value of a monthly SIP (annuity-due — contribution at start of month),
 * the convention Indian SIP calculators use.
 */
export function sipFutureValue(monthly, annualRate, months) {
  monthly = num(monthly); annualRate = num(annualRate); months = num(months);
  const i = annualRate / 12;
  if (months <= 0) return 0;
  if (i === 0) return monthly * months;
  return monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
}

/**
 * Future value of a step-up SIP: the monthly contribution rises by
 * `annualStepUpPct` (percent) every 12 months. Computed month-by-month so the
 * step timing is exact.
 * @returns {{corpus:number, invested:number}}
 */
export function stepUpSipFutureValue(monthly, annualRate, months, annualStepUpPct) {
  monthly = num(monthly); annualRate = num(annualRate);
  months = num(months); annualStepUpPct = num(annualStepUpPct);
  const i = annualRate / 12;
  const step = annualStepUpPct / 100;

  let corpus = 0, invested = 0, contribution = monthly;
  for (let m = 0; m < months; m++) {
    if (m > 0 && m % 12 === 0) contribution *= 1 + step;   // annual step-up
    corpus = (corpus + contribution) * (1 + i);            // annuity-due growth
    invested += contribution;
  }
  return { corpus, invested };
}

/** Real (inflation-adjusted / purchasing-power) value of a future amount. */
export function inflationAdjust(value, annualInflation, years) {
  value = num(value); annualInflation = num(annualInflation); years = num(years);
  return value / Math.pow(1 + annualInflation, years);
}

/**
 * Profit on an investment.
 * @returns {{profit:number, pct:number}} pct is percentage (25 = +25%).
 */
export function profit(invested, corpus) {
  invested = num(invested); corpus = num(corpus);
  const p = corpus - invested;
  return { profit: p, pct: invested > 0 ? (p / invested) * 100 : 0 };
}

/** Goal progress as a 0-100 percentage, clamped. */
export function goalProgress(current, target) {
  current = num(current); target = num(target);
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (current / target) * 100));
}

/** Reverse SIP: monthly contribution required to reach `targetCorpus`. */
export function reverseSip(targetCorpus, annualRate, months) {
  targetCorpus = num(targetCorpus); annualRate = num(annualRate); months = num(months);
  const i = annualRate / 12;
  if (months <= 0) return 0;
  if (i === 0) return targetCorpus / months;
  const factor = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  return factor > 0 ? targetCorpus / factor : 0;
}

/** Reverse lump sum: principal required today to reach `targetCorpus`. */
export function reverseLumpSum(targetCorpus, annualRate, months) {
  return presentValue(targetCorpus, annualRate, months);
}

/**
 * Combined corpus for a goal given its mode, using monthly compounding. Returns
 * the projected corpus and the total amount actually invested.
 * @param {{mode:string, monthly_sip:number, lumpsum_amount:number,
 *          step_up_pct:number, duration_months:number}} goal
 * @returns {{corpus:number, invested:number}}
 */
export function projectGoal(goal, annualRate) {
  const months = num(goal.duration_months);
  const stepUp = num(goal.step_up_pct);
  const sipMonthly = num(goal.monthly_sip);
  const lump = num(goal.lumpsum_amount);

  let corpus = 0, invested = 0;

  const includesSip = goal.mode === "sip" || goal.mode === "hybrid";
  const includesLump = goal.mode === "lumpsum" || goal.mode === "hybrid";

  if (includesSip) {
    if (stepUp > 0) {
      const s = stepUpSipFutureValue(sipMonthly, annualRate, months, stepUp);
      corpus += s.corpus; invested += s.invested;
    } else {
      corpus += sipFutureValue(sipMonthly, annualRate, months);
      invested += sipMonthly * months;
    }
  }
  if (includesLump) {
    corpus += lumpSumFutureValue(lump, annualRate, months);
    invested += lump;
  }
  return { corpus, invested };
}

/**
 * Year-by-year corpus and invested amount for growth charts.
 * @returns {Array<{year:number, invested:number, corpus:number, profit:number}>}
 */
export function yearWiseGrowth(goal, annualRate) {
  const totalMonths = num(goal.duration_months);
  const totalYears = Math.max(1, Math.ceil(totalMonths / 12));
  const rows = [];
  for (let y = 1; y <= totalYears; y++) {
    const months = Math.min(y * 12, totalMonths);
    const { corpus, invested } = projectGoal({ ...goal, duration_months: months }, annualRate);
    rows.push({ year: y, invested, corpus, profit: corpus - invested });
  }
  return rows;
}
