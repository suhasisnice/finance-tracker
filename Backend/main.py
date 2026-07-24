"""FastAPI application: route handlers / endpoints."""

import sqlite3
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from anomaly import get_anomaly_detector
from categorizer import get_categorizer
from database import get_connection, init_db
from finance_manager import FinanceManager
from forecast import get_forecaster
from health_score import get_health_scorer
from investment import InvestmentManager
from models import (
    CategorizeIn, InvestmentGoalIn, LoginIn, ParseSmsIn, TransactionIn, UserIn,
)
from security import hash_password, verify_password
from sms_parser import get_sms_parser
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
sms_parser = get_sms_parser()
health_scorer = get_health_scorer()
anomaly_detector = get_anomaly_detector()
forecaster = get_forecaster()
investments = InvestmentManager()

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


@app.post("/parse-sms")
def parse_sms(payload: ParseSmsIn):
    parsed = sms_parser.parse(payload.text)
    category = categorizer.categorize(parsed.merchant or payload.text)
    return {**parsed.to_dict(), "suggested_category": category}


@app.get("/balance")
def get_balance(username: str, source: str | None = None):
    return fm.calculate_balance(username, source)


@app.get("/transactions")
def get_history(username: str, source: str | None = None):
    return fm.transaction_history(username, source)


@app.get("/monthly-report")
def get_monthly_report(username: str, month: int, year: int, source: str | None = None):
    return fm.monthly_report(username, month, year, source)


@app.get("/category-summary")
def get_category_summary(
    username: str, month: int | None = None, year: int | None = None, source: str | None = None
):
    return fm.category_summary(username, month, year, source)


@app.get("/insights")
def get_insights(username: str, month: int, year: int):
    return fm.insights(username, month, year)


@app.get("/health-score")
def get_health_score(username: str, source: str | None = None):
    transactions = fm.transaction_history(username, source)
    return health_scorer.score(transactions)


@app.get("/anomalies")
def get_anomalies(username: str, source: str | None = None):
    transactions = fm.transaction_history(username, source)
    return {"anomalies": anomaly_detector.detect(transactions)}


@app.get("/forecast")
def get_forecast(username: str, source: str | None = None):
    transactions = fm.transaction_history(username, source)
    return forecaster.forecast(transactions)


# ── Investment Planner: goal persistence ────────────────────────────────────
@app.get("/investment-goals")
def list_investment_goals(username: str):
    return {"goals": investments.list(username)}


@app.post("/investment-goals", status_code=201)
def create_investment_goal(goal: InvestmentGoalIn):
    return investments.create(goal)


@app.put("/investment-goals/{g_id}")
def update_investment_goal(g_id: int, goal: InvestmentGoalIn):
    return investments.update(g_id, goal)


@app.delete("/investment-goals/{g_id}")
def delete_investment_goal(g_id: int, username: str):
    return investments.delete(username, g_id)
