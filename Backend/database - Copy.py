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
            t_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id  INTEGER NOT NULL,
            amount   REAL NOT NULL,
            t_type   TEXT NOT NULL CHECK (t_type IN ('income', 'expense')),
            category TEXT NOT NULL,
            t_date   TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    )

    # Index speeds up per-user, date-bounded queries (balance, monthly report).
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, t_date);"
    )

    con.commit()
    con.close()


def get_user_id(cur, username):
    """Return the user id for a username, or None if it does not exist."""
    cur.execute("SELECT id FROM users WHERE username = ?", (username,))
    row = cur.fetchone()
    return row["id"] if row else None
