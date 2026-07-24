# Finance Tracker — Backend (FastAPI + SQLite)

Layered REST API for a personal finance tracker. Single-responsibility modules,
Pydantic validation, SQLite persistence, single-pass conditional-aggregate balance.

## Run

```bash
pip install -r requirements.txt
python seed.py            # optional: creates demo user 'testuser' / 'test1234'
uvicorn main:app --reload
```

Interactive docs: http://127.0.0.1:8000/docs

## Modules

| File                 | Responsibility                                   |
|----------------------|--------------------------------------------------|
| `main.py`            | FastAPI app + route handlers                     |
| `finance_manager.py` | Balance, history, monthly report, category split |
| `transaction.py`     | Persisting a single transaction                  |
| `database.py`        | Connection helper + schema init                  |
| `models.py`          | Pydantic request models                          |
| `security.py`        | PBKDF2 password hashing                           |

## API Reference

| Method | Path                | Query / Body                                   | Returns |
|--------|---------------------|------------------------------------------------|---------|
| GET    | `/`                 | —                                              | `{ "message": "pong" }` |
| POST   | `/users`            | `{ username, password }`                       | 201 created |
| POST   | `/login`            | `{ username, password }`                       | 200 ok / 401 |
| POST   | `/transactions`     | `{ username, amount, t_type, category, t_date }` | 201 created |
| GET    | `/balance`          | `?username=`                                   | `{ total_income, total_expense, net_balance }` |
| GET    | `/transactions`     | `?username=`                                   | `[ {...}, ... ]` (date-ordered) |
| GET    | `/monthly-report`   | `?username=&month=&year=`                      | `{ income, expense, net, transactions, details }` |
| GET    | `/category-summary` | `?username=&month=&year=` (month/year optional) | `{ categories: [ {category, total} ] }` |

- `t_type` is `"income"` or `"expense"`.
- `t_date` is `YYYY-MM-DD`.
- Invalid bodies → 422; unknown user → 404; duplicate username → 400; bad login → 401.

## Notes vs. prototype

- Balance now computed in a **single conditional-aggregate query** and returns
  income/expense/net (matches report Fig 4.1).
- Monthly report returns an **aggregated summary + details** (matches Fig 4.2).
- Transaction history is **chronologically ordered** and returns named JSON fields.
- Passwords are **PBKDF2-hashed** (addresses report limitation 5.3).
- Added `/login` and `/category-summary` to support the frontend.
