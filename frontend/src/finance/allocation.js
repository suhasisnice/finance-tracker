// Asset-allocation configuration and generation. The UI must call
// `allocationFor(profile)` and render whatever it returns — allocation weights
// are never written into components. To retune the model, edit ONLY this file.

import { CATEGORY_PALETTE } from "../chartPalette";

/**
 * The investable asset classes, each with a long-run expected annual return
 * (decimal). Blended portfolio return is derived from these + the profile
 * weights, so it is never hardcoded either.
 */
export const ASSET_CLASSES = {
  "Stocks":              { expectedReturn: 0.145, color: CATEGORY_PALETTE[0] },
  "Mutual Funds":        { expectedReturn: 0.120, color: CATEGORY_PALETTE[1] },
  "ETFs":                { expectedReturn: 0.110, color: CATEGORY_PALETTE[4] },
  "Debt Funds":          { expectedReturn: 0.070, color: CATEGORY_PALETTE[3] },
  "Gold":                { expectedReturn: 0.080, color: CATEGORY_PALETTE[6] },
  "International Funds":  { expectedReturn: 0.125, color: CATEGORY_PALETTE[5] },
};

/**
 * Risk profiles → percentage weights across the asset classes. Weights per
 * profile sum to 100. Assumed annual inflation is per-profile only so the
 * planner can be tuned in one place.
 */
export const RISK_PROFILES = {
  conservative: {
    label: "Conservative",
    blurb: "Capital preservation first — tilts to debt & gold.",
    inflation: 0.06,
    weights: { "Stocks": 10, "Mutual Funds": 20, "ETFs": 10, "Debt Funds": 40, "Gold": 15, "International Funds": 5 },
  },
  moderate: {
    label: "Moderate",
    blurb: "Balanced growth with a debt cushion.",
    inflation: 0.06,
    weights: { "Stocks": 25, "Mutual Funds": 25, "ETFs": 15, "Debt Funds": 20, "Gold": 10, "International Funds": 5 },
  },
  aggressive: {
    label: "Aggressive",
    blurb: "Maximise long-run growth — equity heavy.",
    inflation: 0.06,
    weights: { "Stocks": 40, "Mutual Funds": 25, "ETFs": 15, "Debt Funds": 5, "Gold": 5, "International Funds": 10 },
  },
};

export const RISK_PROFILE_OPTIONS = Object.entries(RISK_PROFILES).map(([value, p]) => ({
  value, label: p.label,
}));

/**
 * Generate the allocation for a risk profile.
 * @returns {Array<{asset:string, weight:number, expectedReturn:number, color:string}>}
 *          sorted by weight desc. Empty array for an unknown profile.
 */
export function allocationFor(profile) {
  const cfg = RISK_PROFILES[profile];
  if (!cfg) return [];
  return Object.entries(cfg.weights)
    .map(([asset, weight]) => ({
      asset,
      weight,
      expectedReturn: ASSET_CLASSES[asset]?.expectedReturn ?? 0,
      color: ASSET_CLASSES[asset]?.color ?? "#888",
    }))
    .sort((a, b) => b.weight - a.weight);
}

/** Weight-blended expected annual return (decimal) for a profile. */
export function blendedReturn(profile) {
  const alloc = allocationFor(profile);
  const total = alloc.reduce((s, a) => s + a.weight, 0) || 1;
  return alloc.reduce((s, a) => s + (a.weight / total) * a.expectedReturn, 0);
}

/** Assumed annual inflation for a profile (decimal). */
export function inflationFor(profile) {
  return RISK_PROFILES[profile]?.inflation ?? 0.06;
}

// ── Holdings model ───────────────────────────────────────────────────────────
// A "holding" is one line of a customisable portfolio: either a specific fund
// (from the catalogue, carrying its own return) or a generic asset class. The
// blended return and diversification derive from the holdings, so picking real
// funds changes the projection — the allocation is no longer just a tag name.
//
// Holding shape: { id, label, asset, exchange, weight, annualReturn }

export const ASSET_CLASS_NAMES = Object.keys(ASSET_CLASSES);

/** Colour for an asset class (used to tint its holdings in the donut). */
export function assetColor(asset) {
  return ASSET_CLASSES[asset]?.color ?? "#888";
}

/** Seed generic asset-class holdings from a risk profile's template weights. */
export function holdingsFromProfile(profile) {
  return allocationFor(profile).map((a) => ({
    id: `asset:${a.asset}`,
    label: a.asset,
    asset: a.asset,
    exchange: null,
    weight: a.weight,
    annualReturn: a.expectedReturn,
  }));
}

/** Build a holding from a catalogue fund at a given weight. */
export function holdingFromFund(fund, weight = 0) {
  return {
    id: fund.id,
    label: fund.name,
    asset: fund.asset,
    exchange: fund.exchange,
    weight,
    annualReturn: fund.annualReturn,
  };
}

/** Sum of holding weights (may differ from 100 while editing). */
export function totalWeight(holdings) {
  return (holdings || []).reduce((s, h) => s + (Number(h.weight) || 0), 0);
}

/** Weight-blended expected annual return (decimal) across holdings. */
export function blendedReturnFromHoldings(holdings) {
  const total = totalWeight(holdings);
  if (total <= 0) return 0;
  return (holdings || []).reduce(
    (s, h) => s + ((Number(h.weight) || 0) / total) * (Number(h.annualReturn) || 0),
    0
  );
}

/** Rescale holding weights so they sum to 100 (rounded to 1 decimal). */
export function normalizeHoldings(holdings) {
  const total = totalWeight(holdings);
  if (total <= 0) return holdings;
  return holdings.map((h) => ({
    ...h,
    weight: Math.round(((Number(h.weight) || 0) / total) * 1000) / 10,
  }));
}
