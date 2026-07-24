// Portfolio-level scores and scenario analysis. Pure functions.

const num = (v, fallback = 0) => (Number.isFinite(+v) ? +v : fallback);
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * Diversification score 0-100 from allocation weights, via a normalised inverse
 * Herfindahl index. 100 = perfectly even across N assets; 0 = all in one.
 * @param {number[]} weights  percentages (need not sum to exactly 100)
 */
export function diversificationScore(weights) {
  const w = (weights || []).map((x) => num(x)).filter((x) => x > 0);
  const n = w.length;
  if (n <= 1) return n === 1 ? 0 : 0;
  const total = w.reduce((s, x) => s + x, 0) || 1;
  const hhi = w.reduce((s, x) => s + Math.pow(x / total, 2), 0); // 1/n..1
  const minHhi = 1 / n;
  return clamp(((1 - hhi) / (1 - minHhi)) * 100);
}

/** Map an expected annual return (decimal) to a 0-100 sub-score: 6%→0, 15%→100. */
function returnScore(expectedReturn) {
  return clamp(((num(expectedReturn) - 0.06) / (0.15 - 0.06)) * 100);
}

/**
 * Portfolio Health Score 0-100 — a documented weighted blend:
 *   diversification 40% · goal progress 40% · return adequacy 20%
 * @param {{diversification:number, goalProgressPct:number, expectedReturn:number}} p
 * @returns {{score:number, rating:string, components:object}}
 */
export function portfolioHealthScore({ diversification, goalProgressPct, expectedReturn }) {
  const div = clamp(num(diversification));
  const prog = clamp(num(goalProgressPct));
  const ret = returnScore(expectedReturn);

  const components = {
    diversification: { label: "Diversification", value: Math.round(div), weight: 0.4 },
    goal_progress:   { label: "On-track to goal", value: Math.round(prog), weight: 0.4 },
    return_adequacy: { label: "Return adequacy", value: Math.round(ret), weight: 0.2 },
  };
  const score = Math.round(div * 0.4 + prog * 0.4 + ret * 0.2);
  return { score, rating: ratingFor(score), components };
}

function ratingFor(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Critical";
}

/**
 * Bear / Base / Bull annual returns around a base rate. Bear shaves 4pts, Bull
 * adds 3pts (asymmetric — downside is deeper), clamped at 0.
 * @returns {{bear:number, base:number, bull:number}}
 */
export function scenarioReturns(baseReturn) {
  const base = num(baseReturn);
  return {
    bear: Math.max(0, base - 0.04),
    base,
    bull: Math.max(0, base + 0.03),
  };
}
