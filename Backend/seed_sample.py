"""Seed ~120 realistic Indian sample transactions (source='sample').

These rows sit alongside a user's real ('live') entries and are what the
dashboard's "Sample Data" toggle shows. Every expense carries a real merchant
description, and its category is assigned by the actual rule-based categorizer
so the sample data exercises the full pipeline. A mild upward spend trend gives
the forecast something to project, and a few deliberate outliers give the
anomaly detector something to flag.

Run:  python seed_sample.py
Idempotent: existing sample rows for the user are cleared first.
"""

import random
from datetime import datetime

from categorizer import get_categorizer
from database import get_connection, get_user_id, init_db
from security import hash_password

SEED = 42  # reproducible sample data

# Four consecutive months ending at the current demo month.
MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07"]

# Merchant pool: (description, (min_amount, max_amount)). Category is derived by
# the categorizer from the description, so these must contain the known keywords.
MERCHANTS = [
    ("Swiggy order",              (180, 650)),
    ("Zomato dinner",             (200, 800)),
    ("Blinkit groceries",         (150, 900)),
    ("Zepto quick delivery",      (120, 700)),
    ("BigBasket monthly stock",   (800, 2500)),
    ("DMart shopping",            (600, 2200)),
    ("Uber ride",                 (90, 550)),
    ("Ola cab",                   (100, 600)),
    ("Rapido bike",               (40, 180)),
    ("Amazon order",              (300, 3000)),
    ("Flipkart purchase",         (250, 2800)),
    ("BookMyShow movie",          (200, 900)),
]

# Fixed monthly bills (description, amount) — recurring, low variance.
MONTHLY_BILLS = [
    ("Jio recharge", 399),
    ("Airtel postpaid bill", 699),
]

MONTHLY_SALARY = 65000


def _insert(cur, user_id, amount, t_type, category, ym, day, description):
    t_date = f"{ym}-{day:02d}"
    cur.execute(
        """
        INSERT INTO transactions (user_id, amount, t_type, category, t_date, description, source)
        VALUES (?, ?, ?, ?, ?, ?, 'sample')
        """,
        (user_id, round(amount, 2), t_type, category, t_date, description),
    )


def seed(username="testuser", password="test1234"):
    random.seed(SEED)
    init_db()
    categorizer = get_categorizer()

    con = get_connection()
    cur = con.cursor()

    if get_user_id(cur, username) is None:
        cur.execute(
            "INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
            (username, hash_password(password), str(datetime.now().date())),
        )
        con.commit()
    user_id = get_user_id(cur, username)

    # Idempotency: clear any prior sample rows for this user.
    cur.execute("DELETE FROM transactions WHERE user_id = ? AND source = 'sample'", (user_id,))

    count = 0
    for month_idx, ym in enumerate(MONTHS):
        # Salary on the 1st.
        _insert(cur, user_id, MONTHLY_SALARY, "income", "Salary", ym, 1, "Monthly salary credit")
        count += 1

        # Recurring bills mid-month.
        for desc, amt in MONTHLY_BILLS:
            category = categorizer.categorize(desc)
            _insert(cur, user_id, amt, "expense", category, ym, random.randint(3, 8), desc)
            count += 1

        # ~28 discretionary/variable expenses per month. A gentle month-over-month
        # growth factor (1.00, 1.08, 1.16, 1.24) produces a mild upward trend.
        growth = 1.0 + 0.08 * month_idx
        for _ in range(28):
            desc, (lo, hi) = random.choice(MERCHANTS)
            amount = random.uniform(lo, hi) * growth
            category = categorizer.categorize(desc)
            day = random.randint(2, 27)
            _insert(cur, user_id, amount, "expense", category, ym, day, desc)
            count += 1

    # A few deliberate anomalies (well above their category's usual range) so the
    # anomaly detector has clear outliers to surface.
    _insert(cur, user_id, 34999, "expense", categorizer.categorize("Amazon order"),
            "2026-06", 18, "Amazon order — new phone")
    _insert(cur, user_id, 12500, "expense", categorizer.categorize("Flipkart purchase"),
            "2026-05", 22, "Flipkart purchase — laptop bag & accessories")
    _insert(cur, user_id, 8200, "expense", categorizer.categorize("BookMyShow movie"),
            "2026-07", 12, "BookMyShow — concert tickets")
    count += 3

    con.commit()
    con.close()
    print(f"Seeded {count} sample transactions for '{username}' across {MONTHS[0]}..{MONTHS[-1]}.")


if __name__ == "__main__":
    seed()
