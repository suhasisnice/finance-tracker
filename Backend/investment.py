"""InvestmentManager: persistence for Investment Planner goals.

Mirrors FinanceManager's shape (per-user, raw sqlite3, HTTPException on missing
user). Only the goal definition is stored here; all financial projections are
derived client-side from these inputs.
"""

import json
from datetime import date

from fastapi import HTTPException

from database import get_connection, get_user_id

# Columns selected for read; allocation_json is parsed into `allocation`.
_SELECT = (
    "g_id, name, target_amount, duration_months, risk_profile, priority, mode, "
    "monthly_sip, lumpsum_amount, step_up_pct, notes, allocation_json, created_at"
)


def _row_to_goal(row):
    """Row dict → API goal, parsing allocation_json into an `allocation` list."""
    goal = dict(row)
    raw = goal.pop("allocation_json", None)
    try:
        goal["allocation"] = json.loads(raw) if raw else None
    except (ValueError, TypeError):
        goal["allocation"] = None
    return goal


def _dump_allocation(allocation):
    """Serialise an allocation list to JSON text, or None."""
    return json.dumps(allocation) if allocation else None


class InvestmentManager:
    def _require_user(self, cur, username):
        user_id = get_user_id(cur, username)
        if user_id is None:
            raise HTTPException(status_code=404, detail="No user found.")
        return user_id

    def create(self, goal):
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, goal.username)
            cur.execute(
                """
                INSERT INTO investment_goals
                    (user_id, name, target_amount, duration_months, risk_profile,
                     priority, mode, monthly_sip, lumpsum_amount, step_up_pct,
                     notes, allocation_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, goal.name, goal.target_amount, goal.duration_months,
                 goal.risk_profile, goal.priority, goal.mode, goal.monthly_sip,
                 goal.lumpsum_amount, goal.step_up_pct, goal.notes,
                 _dump_allocation(goal.allocation), str(date.today())),
            )
            g_id = cur.lastrowid
            con.commit()
        finally:
            con.close()
        return self.get_one(goal.username, g_id)

    def list(self, username):
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            cur.execute(
                f"""
                SELECT {_SELECT}
                FROM investment_goals
                WHERE user_id = ?
                ORDER BY
                    CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                    g_id DESC
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        finally:
            con.close()
        return [_row_to_goal(r) for r in rows]

    def get_one(self, username, g_id):
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            cur.execute(
                f"""
                SELECT {_SELECT}
                FROM investment_goals
                WHERE user_id = ? AND g_id = ?
                """,
                (user_id, g_id),
            )
            row = cur.fetchone()
        finally:
            con.close()
        if row is None:
            raise HTTPException(status_code=404, detail="Goal not found.")
        return _row_to_goal(row)

    def update(self, g_id, goal):
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, goal.username)
            cur.execute(
                """
                UPDATE investment_goals
                SET name = ?, target_amount = ?, duration_months = ?, risk_profile = ?,
                    priority = ?, mode = ?, monthly_sip = ?, lumpsum_amount = ?,
                    step_up_pct = ?, notes = ?, allocation_json = ?
                WHERE user_id = ? AND g_id = ?
                """,
                (goal.name, goal.target_amount, goal.duration_months, goal.risk_profile,
                 goal.priority, goal.mode, goal.monthly_sip, goal.lumpsum_amount,
                 goal.step_up_pct, goal.notes, _dump_allocation(goal.allocation),
                 user_id, g_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Goal not found.")
            con.commit()
        finally:
            con.close()
        return self.get_one(goal.username, g_id)

    def delete(self, username, g_id):
        con = get_connection()
        cur = con.cursor()
        try:
            user_id = self._require_user(cur, username)
            cur.execute(
                "DELETE FROM investment_goals WHERE user_id = ? AND g_id = ?",
                (user_id, g_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Goal not found.")
            con.commit()
        finally:
            con.close()
        return {"deleted": g_id}
