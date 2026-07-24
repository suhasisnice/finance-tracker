"""Anomaly detection: swappable interface + a statistical baseline.

`AnomalyDetector` is the contract every implementation (statistical today, an
Isolation Forest or similar later) must satisfy. Callers should depend on
`get_anomaly_detector()`, not on `StatisticalAnomalyDetector` directly.

Method (deterministic, not ML): within each expense category that has at least
MIN_SAMPLES transactions, flag any transaction whose amount exceeds
    mean + SIGMA * stddev
i.e. an unusually large spend relative to that category's own history.
"""

import math
from abc import ABC, abstractmethod
from collections import defaultdict

MIN_SAMPLES = 5   # a category needs at least this many txns to have a stable baseline
SIGMA = 2.0       # flag amounts more than this many standard deviations above the mean


class AnomalyDetector(ABC):
    """Contract: return the subset of transactions that look anomalous."""

    @abstractmethod
    def detect(self, transactions: list[dict]) -> list[dict]:
        raise NotImplementedError


class StatisticalAnomalyDetector(AnomalyDetector):
    """Per-category mean + SIGMA*stddev threshold baseline. Intended to be
    replaced by a trained model later behind the same `detect()` signature."""

    def detect(self, transactions: list[dict]) -> list[dict]:
        by_category = defaultdict(list)
        for t in transactions:
            if t["t_type"] == "expense":
                by_category[t["category"]].append(t)

        flagged = []
        for category, txns in by_category.items():
            if len(txns) < MIN_SAMPLES:
                continue

            amounts = [t["amount"] for t in txns]
            mean = sum(amounts) / len(amounts)
            variance = sum((a - mean) ** 2 for a in amounts) / len(amounts)
            stddev = math.sqrt(variance)

            if stddev == 0:
                continue  # every amount identical: nothing can be an outlier

            threshold = mean + SIGMA * stddev
            for t in txns:
                if t["amount"] > threshold:
                    z = (t["amount"] - mean) / stddev
                    flagged.append({
                        **t,
                        "reason": (
                            f"₹{t['amount']:,.0f} in {category} is {z:.1f}σ above the "
                            f"category average of ₹{mean:,.0f} "
                            f"(flagging threshold ₹{threshold:,.0f})."
                        ),
                        "category_mean": round(mean, 2),
                        "category_stddev": round(stddev, 2),
                        "threshold": round(threshold, 2),
                        "z_score": round(z, 2),
                    })

        # Most extreme first.
        flagged.sort(key=lambda t: t["z_score"], reverse=True)
        return flagged


def get_anomaly_detector() -> AnomalyDetector:
    """Single point of construction: swap the returned implementation to upgrade."""
    return StatisticalAnomalyDetector()
