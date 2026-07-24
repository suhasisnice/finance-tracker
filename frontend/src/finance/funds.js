// Curated catalogue of Indian exchange-listed / platform-traded funds and
// instruments, spanning NSE and BSE across the six asset classes.
//
// IMPORTANT: the `annualReturn` figures are ILLUSTRATIVE long-run averages for
// planning, not official or guaranteed returns — every one is editable in the
// allocation editor. Nothing here is investment advice.

/** @typedef {{id:string, name:string, exchange:"NSE"|"BSE", asset:string, annualReturn:number}} Fund */

export const FUND_DISCLAIMER =
  "Returns are illustrative long-run averages for planning — edit any to match your own estimate. Not investment advice.";

/** @type {Fund[]} */
export const FUND_CATALOG = [
  // ── ETFs ──────────────────────────────────────────────────────────────────
  { id: "niftybees",     name: "Nippon India ETF Nifty 50 BeES", exchange: "NSE", asset: "ETFs", annualReturn: 0.130 },
  { id: "sbietfnifty",   name: "SBI Nifty 50 ETF",               exchange: "NSE", asset: "ETFs", annualReturn: 0.125 },
  { id: "hdfcsensexetf", name: "HDFC BSE Sensex ETF",            exchange: "BSE", asset: "ETFs", annualReturn: 0.124 },
  { id: "icicin50etf",   name: "ICICI Prudential Nifty 50 ETF",  exchange: "NSE", asset: "ETFs", annualReturn: 0.125 },
  { id: "bankbees",      name: "Nippon India ETF Nifty Bank BeES", exchange: "NSE", asset: "ETFs", annualReturn: 0.135 },

  // ── Stocks (direct equities) ──────────────────────────────────────────────
  { id: "reliance", name: "Reliance Industries",   exchange: "NSE", asset: "Stocks", annualReturn: 0.150 },
  { id: "tcs",      name: "Tata Consultancy Svcs", exchange: "NSE", asset: "Stocks", annualReturn: 0.145 },
  { id: "hdfcbank", name: "HDFC Bank",             exchange: "NSE", asset: "Stocks", annualReturn: 0.140 },
  { id: "infy",     name: "Infosys",               exchange: "BSE", asset: "Stocks", annualReturn: 0.140 },
  { id: "itc",      name: "ITC",                   exchange: "BSE", asset: "Stocks", annualReturn: 0.130 },

  // ── Mutual Funds (via BSE StAR MF / NSE MF platforms) ─────────────────────
  { id: "ppfcf",        name: "Parag Parikh Flexi Cap",   exchange: "NSE", asset: "Mutual Funds", annualReturn: 0.160 },
  { id: "miraelarge",   name: "Mirae Asset Large Cap",    exchange: "BSE", asset: "Mutual Funds", annualReturn: 0.135 },
  { id: "axisbluechip", name: "Axis Bluechip Fund",       exchange: "NSE", asset: "Mutual Funds", annualReturn: 0.130 },
  { id: "hdfcflexi",    name: "HDFC Flexi Cap Fund",      exchange: "BSE", asset: "Mutual Funds", annualReturn: 0.150 },
  { id: "sbismallcap",  name: "SBI Small Cap Fund",       exchange: "BSE", asset: "Mutual Funds", annualReturn: 0.180 },
  { id: "quantactive",  name: "Quant Active Fund",        exchange: "NSE", asset: "Mutual Funds", annualReturn: 0.185 },

  // ── Debt Funds ────────────────────────────────────────────────────────────
  { id: "hdfccorpbond", name: "HDFC Corporate Bond Fund",        exchange: "BSE", asset: "Debt Funds", annualReturn: 0.075 },
  { id: "sbigilt",      name: "SBI Magnum Gilt Fund",            exchange: "NSE", asset: "Debt Funds", annualReturn: 0.070 },
  { id: "icicicorp",    name: "ICICI Pru Corporate Bond Fund",   exchange: "NSE", asset: "Debt Funds", annualReturn: 0.075 },
  { id: "abslliquid",   name: "ABSL Liquid Fund",                exchange: "BSE", asset: "Debt Funds", annualReturn: 0.065 },

  // ── Gold ──────────────────────────────────────────────────────────────────
  { id: "goldbees",   name: "Nippon India ETF Gold BeES", exchange: "NSE", asset: "Gold", annualReturn: 0.090 },
  { id: "sbigoldetf", name: "SBI Gold ETF",               exchange: "NSE", asset: "Gold", annualReturn: 0.085 },
  { id: "hdfcgoldetf", name: "HDFC Gold ETF",             exchange: "BSE", asset: "Gold", annualReturn: 0.085 },

  // ── International Funds ────────────────────────────────────────────────────
  { id: "motilalnasdaq", name: "Motilal Oswal NASDAQ 100 ETF",   exchange: "NSE", asset: "International Funds", annualReturn: 0.160 },
  { id: "motilalsp500",  name: "Motilal Oswal S&P 500 Index",    exchange: "BSE", asset: "International Funds", annualReturn: 0.140 },
  { id: "franklinus",    name: "Franklin India Feeder US Opp.",  exchange: "NSE", asset: "International Funds", annualReturn: 0.145 },
];

const _BY_ID = Object.fromEntries(FUND_CATALOG.map((f) => [f.id, f]));

/** @returns {Fund|undefined} */
export const getFund = (id) => _BY_ID[id];

/** Funds grouped by asset class, in catalogue order. */
export function fundsByAsset() {
  const groups = {};
  for (const f of FUND_CATALOG) (groups[f.asset] ||= []).push(f);
  return groups;
}

/**
 * Select options for picking a fund, labelled with exchange and return, grouped
 * by asset class (asset name appears as a disabled-looking prefix option).
 * @returns {Array<{value:string, label:string, asset:string, exchange:string}>}
 */
export function fundOptions() {
  return FUND_CATALOG.map((f) => ({
    value: f.id,
    label: `${f.name} · ${f.exchange} · ${(f.annualReturn * 100).toFixed(1)}%`,
    asset: f.asset,
    exchange: f.exchange,
  }));
}
