"""FastAPI application: route handlers / endpoints."""

import sqlite3
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from categorizer import get_categorizer
from database import get_connection, init_db
from finance_manager import FinanceManager
from models import CategorizeIn, LoginIn, TransactionIn, UserIn
from security import hash_password, verify_password
from transaction import Transaction

app = FastAPI(title="Finance Tracker API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

fm = FinanceManager()
categorizer = get_categorizer()

# Ensure tables exist as soon as the app module is loaded.
init_db()


@app.get("/")
def ping():
    return {"message": "pong"}


@app.post("/users", status_code=201)
def create_user(user: UserIn):
    con = get_connection()
    cur = con.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)",
            (user.username, hash_password(user.password), str(date.today())),
        )
        con.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400, detail="Username is already taken. Choose another."
        )
    finally:
        con.close()
    return {"message": "User created", "username": user.username}


@app.post("/login")
def login(creds: LoginIn):
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT password FROM users WHERE username = ?", (creds.username,))
    row = cur.fetchone()
    con.close()

    if row is None or not verify_password(creds.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"message": "Login successful", "username": creds.username}


@app.post("/transactions", status_code=201)
def add_transaction(tx: TransactionIn):
    t = Transaction(tx.username, tx.amount, tx.t_type, tx.category, tx.t_date,
                     tx.description, tx.source)
    return t.save_to_db()


@app.post("/categorize")
def categorize_description(payload: CategorizeIn):
    return {"description": payload.description, "category": categorizer.categorize(payload.description)}


@app.get("/balance")
def get_balance(username: str):
    return fm.calculate_balance(username)


@app.get("/transactions")
def get_history(username: str, source: str | None = None):
    return fm.transaction_history(username, source)


@app.get("/monthly-report")
def get_monthly_report(username: str, month: int, year: int):
    return fm.monthly_report(username, month, year)


@app.get("/category-summary")
def get_category_summary(
    username: str, month: int | None = None, year: int | None = None, source: str | None = None
):
    return fm.category_summary(username, month, year, source)


@app.get("/insights")
def get_insights(username: str, month: int, year: int):
    return fm.insights(username, month, year)
