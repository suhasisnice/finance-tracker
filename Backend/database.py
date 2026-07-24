"""Database layer: connection helper and schema initialisation."""

import sqlite3

DB_NAME = "finance.db"


def get_connection():
    """Return a SQLite connection with row access by name and FK enforcement."""
    con = sqlite3.connect(DB_NAME)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON;")
    return con


def init_db():
    """Create the users and transactions tables if they do not exist."""
    con = get_connection()
    cur = con.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            t_id        INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            amount      REAL NOT NULL,
            t_type      TEXT NOT NULL CHECK (t_type IN ('income', 'expense')),
            category    TEXT NOT NULL,
            t_date      TEXT NOT NULL,
            description TEXT,
            source      TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'sample')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )

    # Index speeds up per-user, date-bounded queries (balance, monthly report).
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, t_date);"
    )

    _add_column_if_missing(cur, "transactions", "description", "TEXT")
    _add_column_if_missing(cur, "transactions", "source", "TEXT NOT NULL DEFAULT 'live'")

    # Investment goals for the Investment Planner. Financial projections are
    # derived client-side from these inputs; only the goal definition is stored.
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS investment_goals (
            g_id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            name            TEXT NOT NULL,
            target_amount   REAL NOT NULL,
            duration_months INTEGER NOT NULL,
            risk_profile    TEXT NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
            priority        TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
            mode            TEXT NOT NULL CHECK (mode IN ('sip', 'lumpsum', 'hybrid')),
            monthly_sip     REAL NOT NULL DEFAULT 0,
            lumpsum_amount  REAL NOT NULL DEFAULT 0,
            step_up_pct     REAL NOT NULL DEFAULT 0,
            notes           TEXT,
            created_at      TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_goal_user ON investment_goals(user_id);"
    )

    # Custom fund/asset allocation, stored as a JSON array of holdings. Null
    # means "use the risk-profile template" (back-compatible with older goals).
    _add_column_if_missing(cur, "investment_goals", "allocation_json", "TEXT")

    con.commit()
    con.close()


def _add_column_if_missing(cur, table, column, coltype):
    """Additive migration: add a column to an existing table if it isn't there yet.

    Needed because CREATE TABLE IF NOT EXISTS is a no-op on a table that
    already exists from before this column was introduced.
    """
    cur.execute(f"PRAGMA table_info({table});")
    existing = {row["name"] for row in cur.fetchall()}
    if column not in existing:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coltype};")


def get_user_id(cur, username):
    """Return the user id for a username, or None if it does not exist."""
    cur.execute("SELECT id FROM users WHERE username = ?", (username,))
    row = cur.fetchone()
    return row["id"] if row else None
