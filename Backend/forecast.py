"""Spend forecasting: swappable interface + a least-squares trend baseline.

`Forecaster` is the contract every implementation (linear trend today, an LSTM
later) must satisfy. Callers should depend on `get_forecaster()`, not on
`LinearTrendForecaster` directly.

Method (deterministic, not ML): fit a degree-1 least-squares line to the series
of monthly expense totals with numpy.polyfit, then extrapolate one month ahead.
A +/-10% band around the point estimate expresses uncertainty. Produced for the
overall spend and for each individual category.
"""

from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime

import numpy as np
from dateutil.relativedelta import relativedelta

MIN_MONTHS = 2   # need at least two points to fit a line
BAND = 0.10      # +/-10% uncertainty band around the point forecast


class Forecaster(ABC):
    """Contract: forecast next-month spend overall and per category."""

    @abstractmethod
    def forecast(self, transactions: list[dict]) -> dict:
        raise NotImplementedError


class LinearTrendForecaster(Forecaster):
    """numpy.polyfit degree-1 trend baseline. Intended to be replaced by a
    sequence model later behind the same `forecast()` signature."""

    def forecast(self, transactions: list[dict]) -> dict:
        expenses = [t for t in transactions if t["t_type"] == "expense"]

        overall_series = self._monthly_series(expenses)
        overall = self._fit_and_project(overall_series)

        # Per-category forecasts, only where enough history exists.
        by_category = defaultdict(list)
        for t in expenses:
            by_category[t["category"]].append(t)

        categories = []
        for category, txns in by_category.items():
            series = self._monthly_series(txns)
            projection = self._fit_and_project(series)
            if projection is not None:
                categories.append({"category": category, **projection})

        categories.sort(key=lambda c: c["forecast"], reverse=True)

        return {
            "next_month": overall["next_month"] if overall else None,
            "overall": overall,
            "categories": categories,
            # A finer 5-day-bucketed series for the trend chart, with its own
            # self-consistent forecast on the same (per-bucket) scale so the
            # observed line and projection share one y-axis.
            "trend": self._binned_trend(expenses),
        }

    def _binned_trend(self, expenses: list[dict], bucket_days: int = 5,
                      horizon_days: int = 30) -> dict | None:
        """Bucket expenses into `bucket_days`-wide windows and project the next
        month's worth of buckets with the same least-squares technique."""
        if not expenses:
            return None

        dates = [datetime.strptime(t["t_date"][:10], "%Y-%m-%d") for t in expenses]
        start = min(dates)
        end = max(dates)

        n_buckets = (end - start).days // bucket_days + 1
        totals = [0.0] * n_buckets
        for t, d in zip(expenses, dates):
            idx = (d - start).days // bucket_days
            totals[idx] += t["amount"]

        binned = [
            {"date": (start + relativedelta(days=i * bucket_days)).strftime("%Y-%m-%d"),
             "total": round(v, 2)}
            for i, v in enumerate(totals)
        ]

        if n_buckets < MIN_MONTHS:
            return {"bucket_days": bucket_days, "binned": binned, "forecast": []}

        x = np.arange(n_buckets)
        y = np.array(totals, dtype=float)
        slope, intercept = np.polyfit(x, y, 1)

        n_future = max(1, horizon_days // bucket_days)
        forecast = []
        for j in range(1, n_future + 1):
            point = max(0.0, float(slope * (n_buckets - 1 + j) + intercept))
            d = start + relativedelta(days=(n_buckets - 1 + j) * bucket_days)
            forecast.append({
                "date": d.strftime("%Y-%m-%d"),
                "value": round(point, 2),
                "lower": round(point * (1 - BAND), 2),
                "upper": round(point * (1 + BAND), 2),
            })

        return {"bucket_days": bucket_days, "binned": binned, "forecast": forecast}

    @staticmethod
    def _monthly_series(txns: list[dict]) -> list[tuple[str, float]]:
        """Return [(YYYY-MM, total)] sorted chronologically, with gap months
        filled as 0 so the trend reflects real elapsed time, not just the
        months that happened to have spending."""
        totals = defaultdict(float)
        for t in txns:
            totals[t["t_date"][:7]] += t["amount"]
        if not totals:
            return []

        keys = sorted(totals)
        start = datetime.strptime(keys[0], "%Y-%m")
        end = datetime.strptime(keys[-1], "%Y-%m")

        series = []
        cur = start
        while cur <= end:
            key = cur.strftime("%Y-%m")
            series.append((key, totals.get(key, 0.0)))
            cur += relativedelta(months=1)
        return series

    @staticmethod
    def _fit_and_project(series: list[tuple[str, float]]) -> dict | None:
        if len(series) < MIN_MONTHS:
            return None

        x = np.arange(len(series))
        y = np.array([total for _, total in series], dtype=float)

        # Degree-1 least-squares fit: y = slope*x + intercept.
        slope, intercept = np.polyfit(x, y, 1)
        next_x = len(series)
        point = float(slope * next_x + intercept)
        point = max(0.0, point)  # spend can't be negative

        last_key = series[-1][0]
        next_month = (datetime.strptime(last_key, "%Y-%m") + relativedelta(months=1)).strftime("%Y-%m")

        return {
            "next_month": next_month,
            "forecast": round(point, 2),
            "lower": round(point * (1 - BAND), 2),
            "upper": round(point * (1 + BAND), 2),
            "slope": round(float(slope), 2),
            "history": [{"month": k, "total": round(v, 2)} for k, v in series],
        }


def get_forecaster() -> Forecaster:
    """Single point of construction: swap the returned implementation to upgrade."""
    return LinearTrendForecaster()
