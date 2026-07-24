"""Financial Health Score: swappable interface + a documented weighted baseline.

`HealthScorer` is the contract every implementation (statistical today, an ML
model later) must satisfy. Callers should depend on `get_health_scorer()`, not
on `WeightedHealthScorer` directly.

------------------------------------------------------------------------------
SCORING MODEL (deterministic, not ML)
------------------------------------------------------------------------------
The overall score is a weighted average of four component sub-scores, each
normalised to 0-100 (higher = healthier). Weights sum to 1.0:

    Component                     Weight   Raw metric                Healthy when
    ---------------------------   ------   -----------------------   ------------
    Savings rate                   0.35    (income-expense)/income   high
    Discretionary vs essential     0.25    discretionary/expense     low
    Spend volatility (MoM)         0.20    stddev/mean of monthly    low
    Category concentration (HHI)   0.20    Herfindahl index          low

Each raw metric is mapped to a 0-100 sub-score with a documented linear ramp
(see the _score_* helpers). The final score is round(sum(weight * sub_score)).
"""

import math
from abc import ABC, abstractmethod
from collections import defaultdict

# Weights for the four components. Must sum to 1.0.
WEIGHTS = {
    "savings_rate": 0.35,
    "discretionary_ratio": 0.25,
    "volatility": 0.20,
    "concentration": 0.20,
}

# Categories treated as essential / non-negotiable spending. Everything else
# (Food Delivery, Entertainment, Shopping, Dining Out, Travel, Subscriptions,
# Personal Care, Uncategorized, ...) is treated as discretionary. Matched
# case-insensitively. Investments count as essential: money committed to the
# future, not lifestyle spend.
ESSENTIAL_CATEGORIES = {
    "bills", "rent", "groceries", "health", "insurance",
    "education", "fuel", "food", "investments",
}


def _clamp(value, low=0.0, high=100.0):
    return max(low, min(high, value))


class HealthScorer(ABC):
    """Contract: turn a user's transactions into a 0-100 score + breakdown."""

    @abstractmethod
    def score(self, transactions: list[dict]) -> dict:
        """`transactions`: list of {amount, t_type, category, t_date} dicts."""
        raise NotImplementedError


class WeightedHealthScorer(HealthScorer):
    """Statistical baseline. Intended to be replaced by a trained model later
    behind the same `score()` signature."""

    def score(self, transactions: list[dict]) -> dict:
        expenses = [t for t in transactions if t["t_type"] == "expense"]
        income_total = sum(t["amount"] for t in transactions if t["t_type"] == "income")
        expense_total = sum(t["amount"] for t in expenses)

        if not transactions:
            return self._empty_result("No transactions to score yet.")

        # ── Component 1: savings rate ────────────────────────────────────────
        savings_rate = (income_total - expense_total) / income_total if income_total > 0 else 0.0
        savings_sub = self._score_savings_rate(savings_rate)

        # ── Component 2: discretionary vs essential ──────────────────────────
        discretionary_total = sum(
            t["amount"] for t in expenses
            if t["category"].strip().lower() not in ESSENTIAL_CATEGORIES
        )
        disc_ratio = discretionary_total / expense_total if expense_total > 0 else 0.0
        disc_sub = self._score_discretionary_ratio(disc_ratio)

        # ── Component 3: month-over-month spend volatility ───────────────────
        monthly = defaultdict(float)
        for t in expenses:
            monthly[t["t_date"][:7]] += t["amount"]  # group by YYYY-MM
        monthly_totals = list(monthly.values())
        cv = self._coefficient_of_variation(monthly_totals)
        volatility_sub = self._score_volatility(cv) if len(monthly_totals) >= 2 else None

        # ── Component 4: category concentration (Herfindahl index) ───────────
        cat_totals = defaultdict(float)
        for t in expenses:
            cat_totals[t["category"]] += t["amount"]
        hhi = self._herfindahl(list(cat_totals.values()), expense_total)
        concentration_sub = self._score_concentration(hhi) if cat_totals else None

        components = {
            "savings_rate": {
                "label": "Savings rate",
                "raw": round(savings_rate, 4),
                "raw_display": f"{savings_rate * 100:.1f}%",
                "sub_score": round(savings_sub, 1),
                "weight": WEIGHTS["savings_rate"],
            },
            "discretionary_ratio": {
                "label": "Discretionary vs essential",
                "raw": round(disc_ratio, 4),
                "raw_display": f"{disc_ratio * 100:.1f}% discretionary",
                "sub_score": round(disc_sub, 1),
                "weight": WEIGHTS["discretionary_ratio"],
            },
            "volatility": {
                "label": "Spend volatility (MoM)",
                "raw": round(cv, 4) if volatility_sub is not None else None,
                "raw_display": f"CV {cv:.2f}" if volatility_sub is not None else "need 2+ months",
                "sub_score": round(volatility_sub, 1) if volatility_sub is not None else None,
                "weight": WEIGHTS["volatility"],
            },
            "concentration": {
                "label": "Category concentration (HHI)",
                "raw": round(hhi, 4) if concentration_sub is not None else None,
                "raw_display": f"HHI {hhi:.2f}" if concentration_sub is not None else "no expenses",
                "sub_score": round(concentration_sub, 1) if concentration_sub is not None else None,
                "weight": WEIGHTS["concentration"],
            },
        }

        # Weighted average over the components that have a sub-score. If a
        # component is unavailable (e.g. <2 months of data), its weight is
        # dropped and the remaining weights are renormalised so the score
        # stays on a 0-100 scale rather than being artificially deflated.
        available = {k: c for k, c in components.items() if c["sub_score"] is not None}
        weight_sum = sum(c["weight"] for c in available.values())
        if weight_sum == 0:
            overall = 0.0
        else:
            overall = sum(c["sub_score"] * c["weight"] for c in available.values()) / weight_sum

        # Record each component's contribution to the final (renormalised) score.
        for c in components.values():
            if c["sub_score"] is not None and weight_sum > 0:
                c["contribution"] = round(c["sub_score"] * c["weight"] / weight_sum, 1)
            else:
                c["contribution"] = None

        overall = round(_clamp(overall))
        return {
            "score": overall,
            "rating": self._rating(overall),
            "components": components,
            "totals": {
                "income": round(income_total, 2),
                "expense": round(expense_total, 2),
                "months_observed": len(monthly_totals),
            },
        }

    # ── Metric → sub-score mappings (all documented linear ramps) ────────────

    @staticmethod
    def _score_savings_rate(rate: float) -> float:
        """0% saved → 0 pts; 20%+ saved → 100 pts (20% is a common healthy target).
        Negative savings (spending more than earned) clamps to 0."""
        return _clamp(rate / 0.20 * 100)

    @staticmethod
    def _score_discretionary_ratio(ratio: float) -> float:
        """<=30% discretionary → 100 pts; >=80% discretionary → 0 pts; linear between."""
        return _clamp((0.80 - ratio) / (0.80 - 0.30) * 100)

    @staticmethod
    def _score_volatility(cv: float) -> float:
        """CV 0 (perfectly steady) → 100 pts; CV >=0.60 → 0 pts; linear between."""
        return _clamp((1 - cv / 0.60) * 100)

    @staticmethod
    def _score_concentration(hhi: float) -> float:
        """HHI is in (0, 1]. Well-diversified spend (low HHI) scores high.
        HHI 0 → 100 pts; HHI 1 (everything in one category) → 0 pts."""
        return _clamp((1 - hhi) * 100)

    # ── Statistical helpers ──────────────────────────────────────────────────

    @staticmethod
    def _coefficient_of_variation(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        if mean == 0:
            return 0.0
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        return math.sqrt(variance) / mean

    @staticmethod
    def _herfindahl(category_totals: list[float], expense_total: float) -> float:
        """Sum of squared category shares. 1/n (even spread) → 1 (single category)."""
        if expense_total <= 0:
            return 0.0
        return sum((amt / expense_total) ** 2 for amt in category_totals)

    @staticmethod
    def _rating(score: int) -> str:
        if score >= 80:
            return "Excellent"
        if score >= 60:
            return "Good"
        if score >= 40:
            return "Fair"
        if score >= 20:
            return "Poor"
        return "Critical"

    def _empty_result(self, message: str) -> dict:
        return {
            "score": None,
            "rating": None,
            "message": message,
            "components": {},
            "totals": {"income": 0, "expense": 0, "months_observed": 0},
        }


def get_health_scorer() -> HealthScorer:
    """Single point of construction: swap the returned implementation to upgrade."""
    return WeightedHealthScorer()
