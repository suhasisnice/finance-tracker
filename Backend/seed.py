"""Seed script: creates a demo user and ~4 months of sample transactions.

Run once after starting fresh:  python seed.py
"""

import random
from datetime import datetime, timedelta

from database import get_connection, get_user_id, init_db
from security import hash_password


def seed(username="testuser", password="test1234"):
    init_db()
    con = get_connection()
    cur = con.cursor()

    if get_user_id(cur, username) is None:
        cur.execute(
            "INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
            (username, hash_password(password), str(datetime.now().date())),
        )
        con.commit()

    user_id = get_user_id(cur, username)

    expense_categories = ["Food", "Travel", "Entertainment", "Shopping", "Bills"]
    start_date = datetime(2025, 10, 1)

    # Monthly salary (income)
    for m in range(4):
        pay_day = (start_date + timedelta(days=30 * m)).strftime("%Y-%m-%d")
        cur.execute(
            "INSERT INTO transactions (user_id, amount, t_type, category, t_date) VALUES (?, ?, ?, ?, ?)",
            (user_id, 52000, "income", "Salary", pay_day),
        )

    # Daily-ish expenses
    for i in range(120):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        cur.execute(
            "INSERT INTO transactions (user_id, amount, t_type, category, t_date) VALUES (?, ?, ?, ?, ?)",
            (user_id, random.randint(100, 1500), "expense", random.choice(expense_categories), d),
        )

    con.commit()
    con.close()
    print(f"Seeded data for '{username}' (password: {password}).")


if __name__ == "__main__":
    seed()
