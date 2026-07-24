"""FinanceManager module: balance, history, and reporting logic."""

from datetime import date, datetime

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException

from database import get_connection, get_user_id


class FinanceManager:
    def _require_user(self, cur, username):
        user_id = get_user_id(cur, username)
        if user_id is None:
            raise HTTPException(status_code=404, detail="No user found.")
        return user_id

    def calculate_balance(self, username, source=None):
        """Net balance via a single-pass conditional-aggregation query."""
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            params = [user_id]
            source_filter = ""
            if source is not None:
                source_filter = " AND source = ?"
                params.append(source)
            cur.execute(
                f"""
                SELECT
                    COALESCE(SUM(CASE WHEN t_type = 'income'  THEN amount ELSE 0 END), 0) AS income,
                    COALESCE(SUM(CASE WHEN t_type = 'expense' THEN amount ELSE 0 END), 0) AS expense
                FROM transactions
                WHERE user_id = ?{source_filter}
                """,
                params,
            )
            row = cur.fetchone()
        finally:
            con.close()

        income = row["income"]
        expense = row["expense"]
        return {
            "username": username,
            "total_income": income,
            "total_expense": expense,
            "net_balance": income - expense,
        }

    def transaction_history(self, username, source=None):
        """All transactions for a user, ordered chronologically.

        `source` optionally filters to 'live' or 'sample' rows, backing the
        dashboard's sample-data toggle.
        """
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            params = [user_id]
            source_filter = ""
            if source is not None:
                source_filter = " AND source = ?"
                params.append(source)
            cur.execute(
                f"""
                SELECT t_id, amount, t_type, category, t_date, description, source
                FROM transactions
                WHERE user_id = ?{source_filter}
                ORDER BY t_date ASC, t_id ASC
                """,
                params,
            )
            rows = cur.fetchall()
        finally:
            con.close()
        return [dict(r) for r in rows]

    def monthly_report(self, username, month, year, source=None):
        """Aggregated income/expense/net plus the transaction list for a month."""
        if not 1 <= month <= 12:
            raise HTTPException(status_code=422, detail="month must be between 1 and 12.")

        start = datetime(year, month, 1)
        end = start + relativedelta(months=1)
        start_str = start.strftime("%Y-%m-%d")
        end_str = end.strftime("%Y-%m-%d")

        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            params = [user_id, start_str, end_str]
            source_filter = ""
            if source is not None:
                source_filter = " AND source = ?"
                params.append(source)
            cur.execute(
                f"""
                SELECT t_id, amount, t_type, category, t_date
                FROM transactions
                WHERE user_id = ? AND t_date >= ? AND t_date < ?{source_filter}
                ORDER BY t_date ASC, t_id ASC
                """,
                params,
            )
            rows = [dict(r) for r in cur.fetchall()]
        finally:
            con.close()

        income = sum(r["amount"] for r in rows if r["t_type"] == "income")
        expense = sum(r["amount"] for r in rows if r["t_type"] == "expense")

        return {
            "month": f"{year:04d}-{month:02d}",
            "income": income,
            "expense": expense,
            "net": income - expense,
            "transactions": len(rows),
            "details": rows,
        }

    def category_summary(self, username, month=None, year=None, source=None):
        """Expense totals grouped by category (optionally scoped to a month).

        Useful for the dashboard / pie-chart view (report future scope 5.4).
        `source` optionally filters to 'live' or 'sample' rows.
        """
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)

            params = [user_id]
            date_filter = ""
            if month is not None and year is not None:
                if not 1 <= month <= 12:
                    raise HTTPException(status_code=422, detail="month must be 1-12.")
                start = datetime(year, month, 1)
                end = start + relativedelta(months=1)
                date_filter = " AND t_date >= ? AND t_date < ?"
                params += [start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")]

            source_filter = ""
            if source is not None:
                source_filter = " AND source = ?"
                params.append(source)

            cur.execute(
                f"""
                SELECT category, SUM(amount) AS total
                FROM transactions
                WHERE user_id = ? AND t_type = 'expense'{date_filter}{source_filter}
                GROUP BY category
                ORDER BY total DESC
                """,
                params,
            )
            rows = cur.fetchall()
        finally:
            con.close()

        return {
            "username": username,
            "categories": [{"category": r["category"], "total": r["total"]} for r in rows],
        }

    def insights(self, username, month, year):
        """Trend analysis: pace projection, comparisons, and plain-English alerts.

        All figures are derived deterministically from the user's own
        transactions -- no external service or model is used.
        """
        if not 1 <= month <= 12:
            raise HTTPException(status_code=422, detail="month must be 1-12.")

        target = f"{year:04d}-{month:02d}"
        start = datetime(year, month, 1)
        end = start + relativedelta(months=1)
        last_start = start - relativedelta(months=1)
        last_key = last_start.strftime("%Y-%m")

        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)

            # Expense total per calendar month, across the user's whole history.
            cur.execute(
                """
                SELECT substr(t_date, 1, 7) AS ym, SUM(amount) AS total
                FROM transactions
                WHERE user_id = ? AND t_type = 'expense'
                GROUP BY ym
                """,
                (user_id,),
            )
            monthly = {r["ym"]: r["total"] for r in cur.fetchall()}

            # Income recorded inside the target month.
            cur.execute(
                """
                SELECT COALESCE(SUM(amount), 0) AS inc
                FROM transactions
                WHERE user_id = ? AND t_type = 'income'
                  AND t_date >= ? AND t_date < ?
                """,
                (user_id, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")),
            )
            income = cur.fetchone()["inc"]

            cur_cats = self._category_map(cur, user_id, start, end)
            cur_cats_prev = self._category_map(
                cur, user_id, last_start, last_start + relativedelta(months=1)
            )
        finally:
            con.close()

        today = date.today()
        is_current = (year == today.year and month == today.month)
        is_future = start.date() > date(today.year, today.month, 1)
        days_in_month = (end - start).days

        if is_future:
            return {"month": target, "message": "No data yet for a future month.", "alerts": []}

        spent = monthly.get(target, 0)
        days_elapsed = today.day if is_current else days_in_month
        projected = (spent / days_elapsed * days_in_month) if (is_current and days_elapsed) else spent

        # Early in a live month, a single purchase skews the projection wildly,
        # so we flag the first few days as unreliable.
        MIN_DAYS = 5
        projection_reliable = (not is_current) or days_elapsed >= MIN_DAYS

        last_spend = monthly.get(last_key, 0)
        prior = [v for k, v in monthly.items() if k < target]
        avg_spend = sum(prior) / len(prior) if prior else 0

        projected_savings = income - projected
        savings_rate = (projected_savings / income) if income else 0

        top_category = max(cur_cats.items(), key=lambda kv: kv[1], default=None)

        # Fastest-growing category vs the previous month.
        growth = []
        for cat, amt in cur_cats.items():
            prev = cur_cats_prev.get(cat, 0)
            if prev > 0:
                growth.append((cat, (amt / prev - 1) * 100))
        growth.sort(key=lambda x: x[1], reverse=True)
        fastest = growth[0] if growth else None

        alerts = self._build_alerts(
            is_current, projection_reliable, days_elapsed,
            projected, income, last_spend, avg_spend,
            projected_savings, savings_rate, fastest,
        )

        return {
            "month": target,
            "is_current_month": is_current,
            "days_elapsed": days_elapsed,
            "days_in_month": days_in_month,
            "projection_reliable": projection_reliable,
            "income": round(income, 2),
            "spent_so_far": round(spent, 2),
            "projected_spend": round(projected, 2),
            "projected_savings": round(projected_savings, 2),
            "savings_rate": round(savings_rate, 3),
            "vs_last_month": {
                "last_month_spend": round(last_spend, 2),
                "change_pct": round((projected / last_spend - 1) * 100, 1) if last_spend else None,
            },
            "vs_average": {
                "avg_monthly_spend": round(avg_spend, 2),
                "change_pct": round((projected / avg_spend - 1) * 100, 1) if avg_spend else None,
            },
            "top_category": (
                {"category": top_category[0], "amount": round(top_category[1], 2)}
                if top_category else None
            ),
            "alerts": alerts,
        }

    def _category_map(self, cur, user_id, start, end):
        cur.execute(
            """
            SELECT category, SUM(amount) AS total
            FROM transactions
            WHERE user_id = ? AND t_type = 'expense'
              AND t_date >= ? AND t_date < ?
            GROUP BY category
            """,
            (user_id, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")),
        )
        return {r["category"]: r["total"] for r in cur.fetchall()}

    @staticmethod
    def _build_alerts(is_current, projection_reliable, days_elapsed,
                      projected, income, last_spend, avg_spend,
                      projected_savings, savings_rate, fastest):
        alerts = []

        # Too early in a live month to trust the projection: say so and stop.
        if is_current and not projection_reliable:
            alerts.append({
                "level": "info",
                "message": f"Only {days_elapsed} day(s) into the month, too early to "
                           f"project reliably. Check back in a few days.",
            })
            if fastest and fastest[1] > 25:
                alerts.append({
                    "level": "info",
                    "message": f"{fastest[0]} is up {fastest[1]:.0f}% versus last month so far.",
                })
            return alerts

        pace = "you're on track to spend" if is_current else "you spent"

        if income and projected > income:
            alerts.append({
                "level": "warning",
                "message": f"At this pace {pace} \u20b9{projected:,.0f} this month, "
                           f"more than your \u20b9{income:,.0f} income. Time to reel it in.",
            })
        elif last_spend and projected > last_spend * 1.15:
            pct = (projected / last_spend - 1) * 100
            alerts.append({
                "level": "warning",
                "message": f"Spending is trending up: {pace} \u20b9{projected:,.0f}, "
                           f"about {pct:.0f}% over last month.",
            })
        elif last_spend and projected < last_spend * 0.9:
            pct = (1 - projected / last_spend) * 100
            alerts.append({
                "level": "good",
                "message": f"Nice. You're pacing about {pct:.0f}% below last month.",
            })

        if income and projected_savings > 0:
            alerts.append({
                "level": "info",
                "message": f"On track to save \u20b9{projected_savings:,.0f} "
                           f"({savings_rate * 100:.0f}% of income).",
            })
        elif income and projected_savings <= 0:
            alerts.append({
                "level": "warning",
                "message": "You're projected to spend everything you earn this month, "
                           "with nothing left to save.",
            })

        if fastest and fastest[1] > 25:
            alerts.append({
                "level": "info",
                "message": f"{fastest[0]} is up {fastest[1]:.0f}% versus last month.",
            })

        if not alerts:
            alerts.append({"level": "info", "message": "Spending looks steady this month."})
        return alerts
